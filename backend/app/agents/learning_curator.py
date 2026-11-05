"""Learning curator agent: picks free lectures and courses for each skill gap, matched to the
user's language, level and time. Tools: get_skill_gaps, search_catalogue, search_youtube, save_learning_items.
It only links catalogue rows or YouTube API results; it never invents a course link."""
from __future__ import annotations

from ..data import CATALOGUE
from ..services import search_youtube, skill_label
from . import job_matcher


def get_skill_gaps(user: dict) -> list[tuple[str, dict]]:
    """(skill key, job that asks for it), most important first; failed quizzes come first."""
    gaps: list[tuple[str, dict]] = []
    seen = set()
    quiz = user.get("quiz", {})
    have = job_matcher.known_skills(user)
    for s, v in sorted(quiz.items(), key=lambda kv: kv[1]):
        if v < 60 and s not in seen:
            seen.add(s)
            gaps.append((s, {}))
    for job in job_matcher.shortlisted_jobs(user):
        for s in job.get("skills", []):
            if s not in have and s not in seen:
                seen.add(s)
                gaps.append((s, job))
    if "communication" not in seen:  # everyone practises the interview itself
        gaps.append(("communication", {}))
    return gaps


def _rank(item: dict, user: dict, weak: bool) -> float:
    langs = [l.lower() for l in user.get("languages", ["English"])]
    lang = item["language"].lower()
    score = 0.0
    if "hindi" in langs and "hindi" in lang:
        score += 3
    if "english" in langs and "english" in lang:
        score += 1.5
    if not any(l.split()[0] in lang for l in langs):
        score -= 4
    if weak and item["level"] == "Beginner":
        score += 1.5
    if item["minutes"] <= user.get("minutesPerDay", 90):
        score += 1
    top = user.get("psych", {}).get("top", "I")
    if top in ("A", "S", "E") and item["format"] in ("Video course", "Lecture"):
        score += 0.7
    if top in ("I", "C", "R") and item["format"] in ("Practice", "Article"):
        score += 0.7
    return score


def _why(item: dict, user: dict, job: dict, weak_score: int | None) -> str:
    parts = []
    if job:
        rounds = job.get("round") or []
        step = rounds[0].lower() if rounds else "selection"
        parts.append(f"Asked in {job['company']}'s {step}.")
    if weak_score is not None:
        parts.append(f"Your quiz score here was {round(weak_score / 20)}/5, so this starts from the basics.")
    if "hindi" in item["language"].lower() and "Hindi" in user.get("languages", []):
        parts.append("Hindi matches your setting.")
    if item["format"] == "Practice":
        parts.append("Hands-on practice, right before your quiz.")
    if not parts:
        parts.append(f"Fits in your {user.get('minutesPerDay', 90)} minutes a day.")
    return " ".join(parts)


async def items(user: dict, per_skill: int = 2) -> list[dict]:
    out = []
    quiz = user.get("quiz", {})
    for skill, job in get_skill_gaps(user)[:6]:
        weak = quiz.get(skill)
        rows = sorted((c for c in CATALOGUE if c["skill"] == skill), key=lambda c: -_rank(c, user, weak is not None and weak < 60))
        picked = rows[:per_skill]
        wants_hindi = "Hindi" in user.get("languages", [])
        if wants_hindi and not any("hindi" in r["language"].lower() for r in picked):
            for yt in (await search_youtube(skill_label(skill), "Hindi"))[:1]:
                picked.append(dict(id=f"yt-{abs(hash(yt['url'])) % 10**8}", skill=skill, title=yt["title"], provider="YouTube",
                                   language="Hindi", format="Video course", minutes=45, level="Beginner", url=yt["url"]))
        for r in picked:
            out.append(dict(
                id=r["id"], skill=skill_label(skill), title=r["title"], provider=r["provider"], language=r["language"], format=r["format"],
                minutes=r["minutes"], level=r["level"], url=r["url"], why=_why(r, user, job, weak if weak is not None and weak < 60 else None),
                skillKey=skill,
            ))
    return out


def lesson_for(skill: str, user: dict) -> dict | None:
    rows = sorted((c for c in CATALOGUE if c["skill"] == skill), key=lambda c: -_rank(c, user, True))
    return rows[0] if rows else None
