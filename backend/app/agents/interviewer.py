"""Interviewer agent: runs the mock interview turn by turn for both rooms.
Tools: get_job_requirements, get_profile, next_question, score_answer, give_hint.
Hints coach the structure of an answer; they never give the answer itself."""
from __future__ import annotations

import re

from .. import llm
from ..data import FILLERS, FOLLOW_UPS, HINTS, QUESTIONS
from . import job_matcher

MAIN_QUESTIONS = 5
MAX_TURNS = 8  # caps LLM cost per interview during the pilot


def new_session(user: dict, round_: str, mode: str) -> dict:
    jobs = job_matcher.shortlisted_jobs(user)
    job = jobs[0] if jobs else {}
    bank = QUESTIONS["technical" if round_ == "technical" else "hr"]
    # Always open and close the HR round with intro + questions-for-me; pick the middle from the bank.
    picks = bank[:MAIN_QUESTIONS - 1] + [bank[-1]] if round_ != "technical" else bank[:MAIN_QUESTIONS]
    return dict(
        round=round_, mode=mode, name=user.get("name") or "there", company=job.get("company", "ours"),
        jobTitle=job.get("title"), jobId=job.get("id"), questions=picks, qi=-1, followUps=0,
        turns=[], metrics=[], hints=0, started=None, ended=None,
    )


def _fill(q: str, s: dict) -> str:
    return q.format(name=s["name"], company=s["company"])


def count_fillers(text: str) -> int:
    t = f" {text.lower()} "
    return sum(len(re.findall(rf"\b{re.escape(f)}\b", t)) for f in FILLERS)


def score_answer(q: dict, text: str, seconds: float) -> dict:
    words = len(text.split())
    if not text.strip():
        # No transcript (browser speech recognition unavailable): judge only on time spent answering.
        length = min(1.0, seconds / 45)
        return dict(score=int(35 + 30 * length), words=0, fillers=0, wpm=None, hasResult=False, transcript=False)
    low = text.lower()
    kw = q.get("keywords", [])
    relevance = min(1.0, sum(1 for k in kw if k in low) / max(2, len(kw) / 2)) if kw else 0.5
    length = 1.0 if 40 <= words <= 220 else max(0.2, words / 40) if words < 40 else 0.7
    structure = 0.0
    if re.search(r"\b(because|for example|for instance|such as|so that)\b", low):
        structure += 0.5
    has_result = bool(re.search(r"\b(result|in the end|finally|we (got|reduced|improved|cut|increased)|\d+ ?%|\d+x)\b", low))
    if has_result:
        structure += 0.5
    fillers = count_fillers(text)
    filler_rate = fillers / max(words, 1)
    score = 100 * (0.30 * length + 0.35 * relevance + 0.20 * structure + 0.15 * max(0.0, 1 - filler_rate * 10))
    wpm = round(words / (seconds / 60)) if seconds > 5 else None
    return dict(score=int(max(10, min(98, score))), words=words, fillers=fillers, wpm=wpm, hasResult=has_result, transcript=True)


def _rule_follow_up(q: dict, text: str, sc: dict) -> str | None:
    if not sc["transcript"]:
        return None
    if sc["words"] < 18:
        return FOLLOW_UPS["short"]
    if q["kind"] == "behavioural" and not sc["hasResult"]:
        return FOLLOW_UPS["result"]
    if q["kind"] == "problem" and not re.search(r"o\(|complexity|linear|time", text.lower()):
        return FOLLOW_UPS["complexity"]
    if q["kind"] == "concept" and not re.search(r"example|for instance|like when", text.lower()) and sc["words"] < 60:
        return FOLLOW_UPS["example"]
    return None


async def _llm_follow_up(s: dict, q: str, text: str) -> str | None:
    ai = await llm.ask_json(
        "You are a friendly but realistic campus interviewer in India. Decide whether one short follow-up question is needed. "
        "Never give the candidate the answer.",
        f"Round: {s['round']}. Role: {s.get('jobTitle') or 'software fresher'} at {s['company']}.\nQuestion: {q}\nCandidate answer: {text}\n"
        'Return {"follow_up": "<one sentence>" or null}.',
        max_tokens=300,
    )
    return ai.get("follow_up") if isinstance(ai, dict) else None


def start(s: dict) -> dict:
    s["qi"] = 0
    return dict(type="question", text=_fill(s["questions"][0]["q"], s), index=0, total=len(s["questions"]), followUp=False)


async def answer(s: dict, text: str, seconds: float) -> dict:
    """Record the answer to the current question and return the next server event."""
    q = s["questions"][s["qi"]]
    asked = s["turns"][-1]["followUpText"] if s["turns"] and s["turns"][-1].get("pending") else _fill(q["q"], s)
    sc = score_answer(q, text, seconds)
    if s["turns"] and s["turns"][-1].get("pending"):
        prev = s["turns"][-1]
        prev["pending"] = False
        prev["followUpAnswer"] = text
        prev["score"] = int((prev["score"] + sc["score"]) / 2) if sc["transcript"] else prev["score"]
        prev["seconds"] += seconds
        prev["fillers"] += sc["fillers"]
        prev["words"] += sc["words"]
    else:
        s["turns"].append(dict(q=asked, kind=q["kind"], text=text, seconds=seconds, at=s.get("clock", 0), **sc))

    total_turns = sum(1 + (1 if t.get("followUpText") else 0) for t in s["turns"])
    last = s["turns"][-1]
    if not last.get("followUpText") and s["followUps"] < 2 and total_turns < MAX_TURNS:
        fu = await _llm_follow_up(s, asked, text) if (llm.enabled() and text.strip()) else _rule_follow_up(q, text, sc)
        if fu:
            s["followUps"] += 1
            last["followUpText"] = fu
            last["pending"] = True
            return dict(type="question", text=fu, index=s["qi"], total=len(s["questions"]), followUp=True)

    s["qi"] += 1
    if s["qi"] >= len(s["questions"]):
        return dict(type="done", text="Thank you for your time. We'll be in touch.")
    return dict(type="question", text=_fill(s["questions"][s["qi"]]["q"], s), index=s["qi"], total=len(s["questions"]), followUp=False)


def give_hint(s: dict) -> str:
    s["hints"] += 1
    q = s["questions"][max(s["qi"], 0)]
    return HINTS.get(q["kind"], HINTS["concept"])
