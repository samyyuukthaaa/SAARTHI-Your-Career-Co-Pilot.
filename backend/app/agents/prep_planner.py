"""Prep planner agent: builds and re-plans the day-by-day to-do list and writes quizzes.
Tools: get_shortlist, get_learning_items, get_constraints, create_todo_plan, generate_quiz."""
from __future__ import annotations

import random
from datetime import date, timedelta

from .. import llm
from ..data import QUIZZES
from ..services import skill_label
from . import job_matcher, learning_curator


def _day_label(d: date) -> str:
    return f"{d.strftime('%a')} {d.day}"


async def create_todo_plan(user: dict, days: int = 7) -> list[dict]:
    """A list of days, each with tasks that fit inside minutesPerDay."""
    budget = int(user.get("minutesPerDay", 90))
    done = set(user.get("done", []))
    items = [i for i in await learning_curator.items(user) if i["id"] not in done]
    jobs = job_matcher.shortlisted_jobs(user)
    today = date.today()
    plan = []
    queue = list(items)
    quizzed: set[str] = set()
    for n in range(days):
        tasks, used = [], 0
        if n == 0 and jobs:
            j = jobs[0]
            tasks.append(dict(id=f"apply-{j['id']}", kind="apply", title=f"Apply to {j['company']}", detail=j["title"], minutes=10, href="/jobs"))
            used += 10
        if n % 2 == 0 or n == days - 1:
            focus = "eye contact while answering" if n == 0 else "structure your answers with STAR" if n < days - 1 else "full mock, like the real thing"
            rnd = "Technical" if n % 4 == 2 else "HR"
            tasks.append(dict(id=f"iv-{n}", kind="interview", title=f"{rnd} round in the interview room", detail=f"Focus: {focus}", minutes=15, href="/interview"))
            used += 15
        while queue and used + min(queue[0]["minutes"], 45) <= budget:
            it = queue.pop(0)
            mins = min(it["minutes"], 45)
            tasks.append(dict(id=f"learn-{it['id']}", kind="learn", title=it["title"], detail=f"{it['provider']} · {it['language']}", minutes=mins, href="/learn", resource=it["id"]))
            used += mins
            skill = it["skillKey"]
            if skill in QUIZZES and skill not in quizzed and not any(q["skillKey"] == skill for q in queue) and used + 10 <= budget + 10:
                quizzed.add(skill)
                tasks.append(dict(id=f"quiz-{skill}", kind="quiz", title=f"Quiz: {skill_label(skill)}", detail=f"{len(QUIZZES[skill])} questions · checks it stuck", minutes=10, href=f"/learn/quiz/{skill}"))
                used += 10
        if not any(t["kind"] in ("learn", "interview") for t in tasks):
            tasks.append(dict(id=f"rev-{n}", kind="practice", title="Revise your weakest topic", detail="Re-take a quiz you scored under 60%", minutes=20, href="/learn"))
        plan.append(dict(date=today + timedelta(days=n), tasks=tasks))
    return plan


def _focus(tasks: list[dict]) -> str:
    learn = [t for t in tasks if t["kind"] == "learn"]
    iv = [t for t in tasks if t["kind"] == "interview"]
    parts = []
    if learn:
        parts.append(learn[0]["title"].split(":")[0].split(",")[0][:34])
    if iv:
        parts.append(iv[0]["title"].split(" in ")[0])
    return " + ".join(parts) or "Revise weak topics"


async def today(user: dict) -> list[dict]:
    plan = await create_todo_plan(user, days=1)
    return plan[0]["tasks"]


async def week(user: dict) -> dict:
    plan = await create_todo_plan(user)
    jobs = job_matcher.shortlisted_jobs(user)
    goal = f"{jobs[0]['title']}, {jobs[0]['company']}" if jobs else None
    return dict(
        days=[dict(day=_day_label(d["date"]), focus=_focus(d["tasks"]), tasks=len(d["tasks"])) for d in plan],
        minutesPerDay=user.get("minutesPerDay", 90),
        goal=goal,
    )


async def generate_quiz(skill: str, user: dict) -> list[dict]:
    bank = QUIZZES.get(skill)
    if not bank:
        ai = await llm.ask_json(
            "You write short multiple-choice quizzes for Indian freshers preparing for placements. Plain English, one correct option.",
            f"Write 5 MCQs on '{skill_label(skill)}'. Format: [{{\"q\": str, \"options\": [4 strings], \"answer\": index}}]",
            max_tokens=1500, cache_key=f"quiz:{skill}",
        )
        bank = [q for q in ai if isinstance(q, dict) and len(q.get("options", [])) == 4] if isinstance(ai, list) else []
    rng = random.Random(f"{user.get('id')}:{skill}")
    qs = bank[:]
    rng.shuffle(qs)
    return [dict(id=f"{skill}-{bank.index(q)}", **q) for q in qs]
