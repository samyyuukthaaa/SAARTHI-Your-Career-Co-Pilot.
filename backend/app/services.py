"""Plumbing the agents call as tools: skill extraction, the job pipeline (official APIs only, never
scraping), YouTube lecture search and notification delivery through n8n."""
from __future__ import annotations

import hashlib
import html
import logging
import re
import time
from datetime import datetime, timezone

import httpx

from . import config, store
from .data import SKILLS

log = logging.getLogger("saarathi.services")

_SKILL_RX = {k: re.compile("|".join(aliases), re.I) for k, (_, aliases) in SKILLS.items()}


def extract_skills(text: str) -> list[str]:
    return [k for k, rx in _SKILL_RX.items() if rx.search(text or "")]


def skill_label(key: str) -> str:
    return SKILLS[key][0] if key in SKILLS else key


# ---------------------------------------------------------------- job pipeline
FRESHER_QUERIES = ["software engineer fresher", "graduate engineer trainee", "frontend developer intern", "data analyst fresher", "python developer fresher"]
CITIES = ["Hyderabad", "Bengaluru", "Chennai", "Pune"]


def _days_ago(iso: str | None) -> int:
    if not iso:
        return 0
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return max(0, (datetime.now(timezone.utc) - dt).days)
    except ValueError:
        return 0


def _jid(source: str, title: str, company: str, city: str) -> str:
    # Same title + company + city from two sources is one job.
    return "x" + hashlib.sha1(f"{title}|{company}|{city}".lower().encode()).hexdigest()[:10]


def _norm(source, title, company, location, description, salary, url, posted) -> dict:
    text = re.sub(r"<[^>]+>", " ", html.unescape(description or ""))
    skills = extract_skills(f"{title} {text}") or ["communication"]
    level = "intern" if re.search(r"\bintern", title, re.I) else "fresher"
    return dict(
        id=_jid(source, title, company, location), title=title.strip(), company=company.strip() or "Company",
        location=location or "India", salary=salary, skills=skills[:6], level=level, source=source,
        posted_days_ago=_days_ago(posted), apply_url=url, round=[],
    )


async def _adzuna(client: httpx.AsyncClient) -> list[dict]:
    if not (config.ADZUNA_APP_ID and config.ADZUNA_APP_KEY):
        return []
    out = []
    for q in FRESHER_QUERIES[:3]:
        for city in CITIES[:2]:
            r = await client.get(
                "https://api.adzuna.com/v1/api/jobs/in/search/1",
                params=dict(app_id=config.ADZUNA_APP_ID, app_key=config.ADZUNA_APP_KEY, what=q, where=city, results_per_page=10, max_days_old=30),
            )
            if r.status_code != 200:
                continue
            for j in r.json().get("results", []):
                lo, hi = j.get("salary_min"), j.get("salary_max")
                salary = f"₹{lo / 1e5:.1f}–{hi / 1e5:.1f} LPA" if lo and hi else None
                out.append(_norm("Adzuna", j.get("title", ""), j.get("company", {}).get("display_name", ""), j.get("location", {}).get("display_name", city),
                                 j.get("description", ""), salary, j.get("redirect_url", ""), j.get("created")))
    return out


async def _remotive(client: httpx.AsyncClient) -> list[dict]:
    r = await client.get("https://remotive.com/api/remote-jobs", params={"category": "software-dev", "limit": 40})
    if r.status_code != 200:
        return []
    out = []
    for j in r.json().get("jobs", []):
        title = j.get("title", "")
        if re.search(r"senior|lead|principal|staff|manager|director|head of", title, re.I):
            continue
        loc = j.get("candidate_required_location") or "Remote"
        if not re.search(r"worldwide|anywhere|india|asia|apac", loc, re.I):
            continue
        out.append(_norm("Remotive", title, j.get("company_name", ""), "Remote", j.get("description", ""), j.get("salary") or None, j.get("url", ""), j.get("publication_date")))
    return out[:15]


async def _arbeitnow(client: httpx.AsyncClient) -> list[dict]:
    r = await client.get("https://www.arbeitnow.com/api/job-board-api")
    if r.status_code != 200:
        return []
    out = []
    for j in r.json().get("data", []):
        title = j.get("title", "")
        # Arbeitnow is Europe-centric: keep only listings with no home city, i.e. open to anyone remote.
        if not j.get("remote") or (j.get("location") or "").strip().lower() != "remote":
            continue
        if re.search(r"senior|lead|principal|head|manager|united states|\bus\b|speaking", title, re.I):
            continue
        if not re.search(r"junior|intern|graduate|trainee|entry|developer|engineer", title, re.I):
            continue
        posted = datetime.fromtimestamp(j["created_at"], timezone.utc).isoformat() if j.get("created_at") else None
        out.append(_norm("Arbeitnow", title, j.get("company_name", ""), "Remote", j.get("description", ""), None, j.get("url", ""), posted))
    return out[:10]


async def refresh_jobs() -> dict:
    """The daily pipeline: pull, normalise, de-duplicate, drop stale listings, store."""
    counts: dict[str, int] = {}
    if not config.FETCH_LIVE_JOBS:
        return counts
    found: dict[str, dict] = {}
    async with httpx.AsyncClient(timeout=12, headers={"User-Agent": "Saarathi/0.1 (career copilot; contact via repo)"}) as client:
        for name, fn in (("Adzuna", _adzuna), ("Remotive", _remotive), ("Arbeitnow", _arbeitnow)):
            try:
                jobs = await fn(client)
            except (httpx.HTTPError, ValueError, KeyError) as e:
                log.info("%s unavailable: %s", name, e)
                jobs = []
            counts[name] = len(jobs)
            for j in jobs:
                if j["posted_days_ago"] <= 30 and j["apply_url"]:
                    found.setdefault(j["id"], j)
    store.upsert_jobs(list(found.values()))
    store.prune_jobs()
    store.cache_set("jobs:last_refresh", {"at": time.time(), "counts": counts})
    return counts


# ---------------------------------------------------------------- YouTube lecture search
EDU_CHANNEL_HINTS = re.compile(r"nptel|freecodecamp|cs50|apna college|code ?with ?harry|gate smashers|jenny|mit|khan|striver|take u forward|telusko|kunal", re.I)


async def search_youtube(skill_label_: str, language: str) -> list[dict]:
    if not config.YOUTUBE_API_KEY:
        return []
    key = f"yt:{skill_label_}:{language}"
    if (hit := store.cache_get(key, 3 * 86400)) is not None:
        return hit
    q = f"{skill_label_} {'in hindi' if language == 'Hindi' else 'tutorial'}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://www.googleapis.com/youtube/v3/search",
                                 params=dict(part="snippet", q=q, type="playlist", maxResults=8, key=config.YOUTUBE_API_KEY, relevanceLanguage="hi" if language == "Hindi" else "en"))
        items = r.json().get("items", []) if r.status_code == 200 else []
    except httpx.HTTPError:
        items = []
    out = []
    for it in items:
        sn = it.get("snippet", {})
        if not EDU_CHANNEL_HINTS.search(sn.get("channelTitle", "")):
            continue
        out.append(dict(title=html.unescape(sn.get("title", "")), channel=sn.get("channelTitle", ""),
                        url=f"https://www.youtube.com/playlist?list={it['id']['playlistId']}"))
    store.cache_set(key, out)
    return out


# ---------------------------------------------------------------- notifications (n8n delivers, backend decides)
async def queue_notification(uid: str, channel: str, template: str, data: dict) -> bool:
    payload = {"user": uid, "channel": channel, "template": template, "data": data}
    store.log_notification(uid, payload)
    if not config.N8N_WEBHOOK_URL:
        return False
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(config.N8N_WEBHOOK_URL, json=payload)
        return r.status_code < 300
    except httpx.HTTPError:
        return False
