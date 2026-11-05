"""Report agent: writes the post-interview report and links each fix to a real lesson.
Tools: get_transcript, get_session_metrics, get_learning_items, write_report."""
from __future__ import annotations

from datetime import date

from .. import llm, store
from . import learning_curator

DIMENSIONS = ["Answer quality", "Eye contact", "Voice and pace", "Posture", "Confidence"]


def _fmt(sec: float) -> str:
    sec = int(sec)
    return f"{sec // 60}:{sec % 60:02d}"


def _gaze(metrics: list[dict]) -> tuple[list[dict], int | None]:
    seen = [m for m in metrics if m.get("faceFound", True)]
    if not seen:
        return [dict(label=l, value=0) for l in ("Interviewer", "Notes on desk", "Floor", "Away")], None
    buckets = {"Interviewer": 0, "Notes on desk": 0, "Floor": 0, "Away": 0}
    for m in seen:
        look_y = m.get("lookY", m.get("pitch", 0))
        if m.get("eyeContact"):
            buckets["Interviewer"] += 1
        elif look_y < -0.35:
            buckets["Floor"] += 1
        elif look_y < -0.12:
            buckets["Notes on desk"] += 1
        else:
            buckets["Away"] += 1
    n = len(seen)
    vals = {k: round(100 * v / n) for k, v in buckets.items()}
    vals["Away"] += 100 - sum(vals.values())  # make it add to 100
    return [dict(label=k, value=max(0, v)) for k, v in vals.items()], vals["Interviewer"]


def _look_away_moments(metrics: list[dict]) -> list[dict]:
    out, start = [], None
    for m in metrics:
        away = m.get("faceFound", True) and not m.get("eyeContact")
        if away and start is None:
            start = m["t"]
        elif not away and start is not None:
            if m["t"] - start >= 5:
                out.append(dict(t=_fmt(start), kind="fix", text=f"Looked away for {int(m['t'] - start)} seconds while answering.", sec=start))
            start = None
    return out[:2]


async def write_report(s: dict, user: dict, report_id: str) -> dict:
    turns = s["turns"]
    metrics = s["metrics"]
    answer_q = round(sum(t["score"] for t in turns) / len(turns)) if turns else 40
    gaze, eye = _gaze(metrics)
    slouch = [m for m in metrics if m.get("faceFound", True)]
    posture = round(100 - 100 * sum(1 for m in slouch if m.get("slouch")) / len(slouch)) if slouch else None

    words = sum(t["words"] for t in turns)
    talk_min = sum(t["seconds"] for t in turns) / 60
    fillers = sum(t["fillers"] for t in turns)
    has_transcript = any(t.get("transcript") for t in turns)
    wpm = words / talk_min if talk_min and has_transcript else None
    fpm = fillers / talk_min if talk_min and has_transcript else 0
    if wpm is None:
        voice = 60
    else:
        pace = 1.0 if 110 <= wpm <= 165 else max(0.3, 1 - abs(wpm - 140) / 140)
        voice = round(100 * (0.6 * pace + 0.4 * max(0, 1 - fpm / 8)))
    short = sum(1 for t in turns if t.get("transcript") and t["words"] < 20)
    confidence = round(0.4 * answer_q + 0.35 * (eye if eye is not None else 55) + 0.25 * max(0, 100 - 12 * short - 4 * s.get("hints", 0)))

    values = {"Answer quality": answer_q, "Eye contact": eye, "Voice and pace": voice, "Posture": posture, "Confidence": confidence}
    weights = {"Answer quality": 0.35, "Eye contact": 0.2, "Voice and pace": 0.15, "Posture": 0.1, "Confidence": 0.2}
    present = {k: v for k, v in values.items() if v is not None}
    overall = round(sum(present[k] * weights[k] for k in present) / sum(weights[k] for k in present))

    prev_reports = [r for r in store.user_reports(user["id"]) if r["id"] != report_id]
    prev = prev_reports[-1] if prev_reports else None
    baseline = (user.get("readiness") or [overall])[-1]
    prev_scores = {x["label"]: x["value"] for x in prev["scores"]} if prev else {}
    scores = [dict(label=k, value=v if v is not None else 0, previous=prev_scores.get(k, v if prev is None and v is not None else baseline), measured=v is not None)
              for k, v in values.items()]

    moments = []
    for t in turns:
        q_short = t["q"].split("?")[0].split(".")[-1].strip()[:60]
        if t["score"] >= 70:
            moments.append(dict(t=_fmt(t["at"]), kind="good", text=f"Clear, specific answer to \"{q_short}\".", sec=t["at"]))
        elif t.get("transcript") and t["words"] < 20:
            moments.append(dict(t=_fmt(t["at"]), kind="fix", text=f"Very short answer to \"{q_short}\". Add one concrete example.", sec=t["at"]))
        if t.get("fillers", 0) >= 4:
            moments.append(dict(t=_fmt(t["at"]), kind="fix", text=f"{t['fillers']} filler words (\"basically\", \"like\") in one answer.", sec=t["at"]))
        if t["kind"] == "behavioural" and t.get("transcript") and not t.get("hasResult"):
            moments.append(dict(t=_fmt(t["at"]), kind="fix", text="Story had no result at the end. Finish with what changed.", sec=t["at"]))
    moments += _look_away_moments(metrics)
    moments.sort(key=lambda m: m["sec"])
    for m in moments:
        m.pop("sec", None)

    # Three fixes, weakest dimensions first, each tied to a real lesson in the catalogue.
    fix_text = {
        "Answer quality": ("Answer with one specific example and its result", "communication"),
        "Eye contact": ("Hold eye contact through the first sentence of every answer", "communication"),
        "Voice and pace": ("Replace filler words with a two-second pause", "communication"),
        "Posture": ("Sit back with shoulders level before you start speaking", "communication"),
        "Confidence": ("Practise a 60-second introduction until it feels easy", "communication"),
    }
    weak_tech = [t for t in turns if s["round"] == "technical" and t["score"] < 60]
    fixes = []
    for label, _ in sorted(((k, v) for k, v in present.items()), key=lambda kv: kv[1])[:3]:
        title, skill = fix_text[label]
        if label == "Answer quality" and weak_tech:
            title, skill = "Revise arrays, strings and complexity before the next technical round", "dsa"
        lesson = learning_curator.lesson_for(skill, user)
        fixes.append(dict(title=title, lesson=dict(id=lesson["id"], title=lesson["title"], minutes=lesson["minutes"], url=lesson["url"]) if lesson else None))

    summary = None
    if llm.enabled() and has_transcript:
        summary = await llm.ask(
            "You are an encouraging interview coach for first-time job seekers in India. Two short sentences, plain English.",
            "Summarise how this mock interview went and the single most useful thing to change.\n"
            + "\n".join(f"Q: {t['q']}\nA: {t['text']}" for t in turns),
            max_tokens=300,
        )

    delta = overall - (prev["overall"] if prev else baseline)
    headline = ("Better than last time." if delta > 0 else "About the same as last time." if delta == 0 else "A tougher one this time.") + " Three things to fix."
    report = dict(
        id=report_id, round=f"{'Technical' if s['round'] == 'technical' else 'HR'} round · {'in-person room' if s['mode'] == 'room' else 'online call'}",
        date=f"{date.today().day} {date.today().strftime('%b %Y')}", overall=overall, previous=prev["overall"] if prev else baseline,
        headline=headline, summary=summary, scores=scores, gaze=gaze, gazeMeasured=eye is not None, moments=moments[:8], fixes=fixes,
        transcript=[dict(q=t["q"], a=t["text"], followUp=t.get("followUpText"), followUpAnswer=t.get("followUpAnswer"), score=t["score"]) for t in turns],
        stats=dict(wordsPerMinute=round(wpm) if wpm else None, fillersPerMinute=round(fpm, 1), hints=s.get("hints", 0), transcript=has_transcript),
    )
    store.save_report(report_id, user["id"], report)
    user.setdefault("readiness", []).append(overall)
    user["lastReport"] = report_id
    store.save_user(user)
    return report
