"""Job matcher agent: ranks cached jobs for one user and explains each match in plain language.
Tools: get_profile, search_cached_jobs, search_live_jobs (the daily pipeline), explain_match.
It only ever returns jobs that exist in the jobs table; it never invents one."""
from __future__ import annotations

from .. import store
from ..data import RIASEC_SKILLS, SKILL_DISPLAY
from ..services import skill_label

INTEREST_TEXT = {
    "R": "Your test shows you like hands-on technical work",
    "I": "Your test shows you like structured problem-solving",
    "A": "Your test shows you enjoy design and building things people see",
    "S": "Your test shows you enjoy helping and working with people",
    "E": "Your test shows you're comfortable leading and presenting",
    "C": "Your test shows you like clear, well-organised work",
}


def known_skills(user: dict) -> set[str]:
    """CV skills, minus ones the user failed a quiz on, plus ones they proved in a quiz."""
    quiz = user.get("quiz", {})
    have = {s for s in user.get("skills", []) if quiz.get(s, 100) >= 50}
    return have | {s for s, v in quiz.items() if v >= 70}


def explain_match(user: dict, job: dict) -> dict:
    req = job.get("skills") or []
    have = known_skills(user)
    matched = [s for s in req if s in have]
    gaps = [s for s in req if s not in have]
    top = user.get("psych", {}).get("top", "I")
    interest = len(set(req) & RIASEC_SKILLS.get(top, set()))
    city = (user.get("city") or "").lower()
    loc = job.get("location", "")
    local = bool(city and city in loc.lower()) or "remote" in loc.lower() or "pan-india" in loc.lower()

    overlap = len(matched) / len(req) if req else 0.3
    score = 38 + 50 * overlap + 4 * min(interest, 2) + (4 if local else 0) - min(job.get("posted_days_ago", 0), 30) / 10
    score = int(max(25, min(97, round(score))))

    reasons = []
    if matched:
        names = [SKILL_DISPLAY.get(s, s) for s in matched[:2]]
        reasons.append(f"{' and '.join(names)} from your CV" if len(names) > 1 else f"{names[0]} from your CV")
    reasons.append("Internship, no experience needed" if job.get("level") == "intern" else "Open to freshers")
    if interest:
        reasons.append(INTEREST_TEXT.get(top, ""))
    if local:
        reasons.append("Remote role" if "remote" in loc.lower() else f"In {loc.split('·')[0].strip()}")
    return dict(match=score, reasons=[r for r in reasons if r][:3], gaps=[skill_label(g) for g in gaps], gap_keys=gaps)


def to_card(user: dict, job: dict) -> dict:
    m = explain_match(user, job)
    return dict(
        id=job["id"], title=job["title"], company=job["company"], location=job["location"], salary=job.get("salary"),
        match=m["match"], reasons=m["reasons"], gaps=m["gaps"], source=job["source"], postedDaysAgo=job.get("posted_days_ago", 0),
        applyUrl=job["apply_url"], round=job.get("round") or ["Application review", "Technical interview", "HR interview"],
    )


def ranked(user: dict, limit: int = 30) -> list[dict]:
    cards = [to_card(user, j) for j in store.all_jobs()]
    cards.sort(key=lambda c: (-c["match"], c["postedDaysAgo"]))
    return cards[:limit]


def shortlisted_jobs(user: dict) -> list[dict]:
    jobs = [j for jid in user.get("shortlist", []) if (j := store.get_job(jid))]
    if not jobs:  # nothing ticked yet: plan around the best match so the app is never empty
        best = ranked(user, 1)
        jobs = [store.get_job(best[0]["id"])] if best else []
    return [j for j in jobs if j]
