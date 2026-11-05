"""Saarathi API: REST for the website, a WebSocket for the interview loop, and cron endpoints.
Run: uvicorn app.main:app --reload --port 8000 (from backend/)."""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config, llm, services, store
from .agents import genie, interviewer, job_matcher, learning_curator, prep_planner, profile, report
from .data import CATALOGUE, QUIZZES, SEED_JOBS

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("saarathi")
COOKIE = "saarathi_uid"


@asynccontextmanager
async def lifespan(_: FastAPI):
    store.upsert_jobs(SEED_JOBS)  # demo listings that link to real careers pages; live ones are added beside them
    task = asyncio.create_task(_refresh_quietly())
    yield
    task.cancel()


async def _refresh_quietly() -> None:
    if store.cache_get("jobs:last_refresh", 12 * 3600):
        return
    try:
        counts = await services.refresh_jobs()
        log.info("Job refresh: %s", counts)
    except Exception as e:  # network trouble must never stop the API from starting
        log.info("Job refresh skipped: %s", e)


app = FastAPI(title="Saarathi API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def uid(saarathi_uid: str | None = Cookie(default=None)) -> str:
    # Visitors who haven't onboarded share the demo profile; onboarding gives them their own.
    return saarathi_uid or "demo"


def _set_cookie(resp: Response, value: str) -> None:
    resp.set_cookie(COOKIE, value, max_age=180 * 86400, httponly=True, samesite="lax")


# ---------------------------------------------------------------- health + me
@app.get("/health")
def health():
    return {"ok": True, "llm": llm.enabled(), "model": config.LLM_MODEL if llm.enabled() else None,
            "liveJobs": config.FETCH_LIVE_JOBS, "lastJobRefresh": store.cache_get("jobs:last_refresh", 10**9)}


@app.get("/me")
async def me(user_id: str = Depends(uid)):
    u = store.get_user(user_id)
    r = u.get("readiness") or [0]
    jobs = job_matcher.shortlisted_jobs(u)
    reports = store.user_reports(user_id)
    last = reports[-1] if reports else None
    return dict(
        name=u.get("name") or "there", city=u.get("city"), languages=u.get("languages"), minutesPerDay=u.get("minutesPerDay"),
        readiness=r[-1], readinessLastWeek=r[-2] if len(r) > 1 else r[-1], streak=u.get("streak", 0),
        skills=profile.display_skills(u.get("skills", [])), education=u.get("education"),
        goal=f"{jobs[0]['title']}, {jobs[0]['company']}" if jobs else None, shortlist=u.get("shortlist", []), done=u.get("done", []),
        lastReport=dict(id=last["id"], round=last["round"], date=last["date"], tip=last["fixes"][0]["title"] if last["fixes"] else None) if last else None,
        reports=[dict(id=x["id"], round=x["round"], date=x["date"], overall=x["overall"]) for x in reports][-5:],
        onboarded=u.get("onboarded", False),
    )


# ---------------------------------------------------------------- Profile agent
@app.post("/profile/cv")
async def upload_cv(response: Response, file: UploadFile = File(...), saarathi_uid: str | None = Cookie(default=None)):
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "That file is over 5 MB. Export a smaller PDF and try again.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(415, "Upload your CV as a PDF. You can export one from Word or Google Docs.")
    try:
        parsed = await profile.parse_cv(data)
    except ValueError as e:
        raise HTTPException(422, str(e))
    user_id = saarathi_uid or "u-" + uuid.uuid4().hex[:12]
    if not saarathi_uid:
        _set_cookie(response, user_id)
        user = store.get_user(user_id)
        user.update(shortlist=[], done=[], quiz={}, readiness=[], streak=0, name=None)
        store.save_user(user)
    profile.save_profile(user_id, skills=parsed["skills"], education=parsed["education"], projects=parsed["projects"], name=parsed.get("name"))
    return dict(skills=profile.display_skills(parsed["skills"]), projects=parsed["projects"], education=parsed["education"], name=parsed.get("name"))


@app.get("/profile/test")
def psych_test():
    return profile.test_items()


class ProfileIn(BaseModel):
    name: str | None = None
    city: str | None = None
    languages: list[str] | None = None
    minutesPerDay: int | None = Field(default=None, ge=15, le=480)
    answers: dict[str, int] | None = None


@app.post("/profile")
def save_profile(body: ProfileIn, response: Response, saarathi_uid: str | None = Cookie(default=None)):
    user_id = saarathi_uid
    if not user_id:  # skipped the CV step
        user_id = "u-" + uuid.uuid4().hex[:12]
        _set_cookie(response, user_id)
        user = store.get_user(user_id)
        user.update(shortlist=[], done=[], quiz={}, readiness=[], streak=0, skills=[], education=None, projects=0, name=None)
        store.save_user(user)
    langs = [l.split()[-1] for l in body.languages] if body.languages else None  # "हिंदी Hindi" -> "Hindi"
    psych = profile.score_psychometric(body.answers) if body.answers else None
    u = profile.save_profile(user_id, name=body.name, city=body.city, languages=langs, minutesPerDay=body.minutesPerDay, psych=psych, onboarded=True)
    if not u.get("readiness"):
        u["readiness"] = [35]
        store.save_user(u)
    return dict(ok=True, psych=u.get("psych"))


@app.delete("/profile")
def delete_my_data(response: Response, user_id: str = Depends(uid)):
    if user_id == "demo":
        raise HTTPException(400, "This is the shared demo profile. Sign up to get your own data you can delete.")
    store.delete_user(user_id)
    response.delete_cookie(COOKIE)
    return dict(ok=True)


# ---------------------------------------------------------------- Job matcher agent
@app.get("/jobs/matches")
def job_matches(user_id: str = Depends(uid)):
    return job_matcher.ranked(store.get_user(user_id))


class ShortlistIn(BaseModel):
    ids: list[str]


@app.put("/jobs/shortlist")
def set_shortlist(body: ShortlistIn, user_id: str = Depends(uid)):
    u = store.get_user(user_id)
    u["shortlist"] = [i for i in body.ids if store.get_job(i)]
    store.save_user(u)
    return dict(shortlist=u["shortlist"])


@app.post("/jobs/refresh")
async def jobs_refresh():
    return dict(counts=await services.refresh_jobs(), total=len(store.all_jobs()))


# ---------------------------------------------------------------- Learning curator agent
@app.get("/learning/items")
async def learning_items(user_id: str = Depends(uid)):
    return await learning_curator.items(store.get_user(user_id))


class DoneIn(BaseModel):
    ids: list[str]


@app.put("/learning/done")
def set_done(body: DoneIn, user_id: str = Depends(uid)):
    u = store.get_user(user_id)
    u["done"] = body.ids
    store.save_user(u)
    return dict(done=u["done"])


@app.get("/learning/catalogue")
def catalogue():
    return CATALOGUE


# ---------------------------------------------------------------- Prep planner agent
@app.get("/plan/today")
async def plan_today(user_id: str = Depends(uid)):
    return await prep_planner.today(store.get_user(user_id))


@app.get("/plan/week")
async def plan_week(user_id: str = Depends(uid)):
    return await prep_planner.week(store.get_user(user_id))


@app.get("/quiz/{skill}")
async def get_quiz(skill: str, user_id: str = Depends(uid)):
    qs = await prep_planner.generate_quiz(skill, store.get_user(user_id))
    if not qs:
        raise HTTPException(404, "No quiz for this topic yet.")
    return dict(skill=skill, label=services.skill_label(skill), questions=[{k: v for k, v in q.items() if k != "answer"} for q in qs])


class QuizIn(BaseModel):
    answers: dict[str, int]


@app.post("/quiz/{skill}")
async def grade_quiz(skill: str, body: QuizIn, user_id: str = Depends(uid)):
    u = store.get_user(user_id)
    qs = await prep_planner.generate_quiz(skill, u)
    results = [dict(id=q["id"], correct=body.answers.get(q["id"]) == q["answer"], answer=q["answer"]) for q in qs]
    score = round(100 * sum(r["correct"] for r in results) / len(results)) if results else 0
    u.setdefault("quiz", {})[skill] = score
    store.save_user(u)
    nxt = "Well done. Move on to the next topic in your plan." if score >= 60 else "Let's go over this once more. Your Learn page now starts this topic from the basics."
    return dict(score=score, results=results, next=nxt)


# ---------------------------------------------------------------- Genie
class GenieIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    lang: str = "en"


@app.post("/genie")
async def ask_genie(body: GenieIn, user_id: str = Depends(uid)):
    return await genie.reply(store.get_user(user_id), body.text, body.lang)


# ---------------------------------------------------------------- Interview + Report agents
@app.get("/interview/{report_id}/report")
def get_report(report_id: str, user_id: str = Depends(uid)):
    r = store.get_report(report_id)
    if not r:
        reports = store.user_reports(user_id)
        if report_id == "latest" and reports:
            return reports[-1]
        raise HTTPException(404, "Report not found. Finish an interview to get one.")
    return r


@app.websocket("/interview/{session_id}")
async def interview_ws(ws: WebSocket, session_id: str):
    """Client -> {type: start|answer|metrics|genie_help|end}; server -> {type: question|hint|end}.
    Audio frames (binary) are accepted for STT once Sarvam/Bhashini keys are configured; until then the
    browser sends its own transcript with each answer."""
    await ws.accept()
    user_id = ws.cookies.get(COOKIE) or "demo"
    user = store.get_user(user_id)
    round_ = ws.query_params.get("round", "hr")
    mode = ws.query_params.get("mode", "online")
    s = store.get_session(session_id) or interviewer.new_session(user, round_, mode)
    started = time.time()
    try:
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
            if msg.get("bytes") is not None:
                continue  # audio chunk: STT provider not configured yet
            ev = json.loads(msg.get("text") or "{}")
            kind = ev.get("type")
            clock = time.time() - started
            if kind == "start":
                await ws.send_json(interviewer.start(s))
            elif kind == "metrics":
                s["metrics"].append(dict(t=round(clock, 1), eyeContact=bool(ev.get("eyeContact")), faceFound=bool(ev.get("faceFound", True)),
                                         yaw=ev.get("yaw", 0), pitch=ev.get("pitch", 0), lookY=ev.get("lookY", 0), slouch=bool(ev.get("slouch"))))
            elif kind == "genie_help":
                await ws.send_json(dict(type="hint", text=interviewer.give_hint(s)))
            elif kind == "answer":
                seconds = float(ev.get("seconds") or 0)
                s["clock"] = max(0.0, clock - seconds)
                out = await interviewer.answer(s, str(ev.get("text", ""))[:4000], seconds)
                if out["type"] == "done":
                    await _finish(ws, s, user, session_id, out["text"])
                    break
                await ws.send_json(out)
            elif kind == "end":
                await _finish(ws, s, user, session_id, "Thank you for your time.")
                break
            store.save_session(session_id, user_id, s)
    except WebSocketDisconnect:
        store.save_session(session_id, user_id, s)


async def _finish(ws: WebSocket, s: dict, user: dict, session_id: str, closing: str) -> None:
    report_id = "r-" + session_id[:12]
    if s["turns"] or s["metrics"]:
        await report.write_report(s, store.get_user(user["id"]), report_id)
        await services.queue_notification(user["id"], "email", "report_ready", {"reportId": report_id})
    else:
        report_id = None
    store.save_session(session_id, user["id"], s)
    await ws.send_json(dict(type="end", reportId=report_id, text=closing))
    await ws.close()


# ---------------------------------------------------------------- cohort page + cron + notifications
@app.get("/cohort")
def cohort():
    rows = []
    for u in store.all_users():
        if u["id"] == "demo":
            continue
        reps = store.user_reports(u["id"])
        rows.append(dict(id=u["id"][-6:], name=u.get("name") or "Student", interviews=len(reps), first=reps[0]["overall"] if reps else None,
                         latest=reps[-1]["overall"] if reps else None, quizzes=len(u.get("quiz", {})), shortlisted=len(u.get("shortlist", []))))
    two = [r for r in rows if r["interviews"] >= 2]
    avg = round(sum(r["latest"] - r["first"] for r in two) / len(two), 1) if two else None
    return dict(users=len(rows), twoPlus=len(two), avgChange=avg, rows=rows)


@app.get("/notifications")
def my_notifications(user_id: str = Depends(uid)):
    return store.notifications(user_id)


@app.post("/cron/daily")
async def cron_daily(request: Request, authorization: str | None = Header(default=None)):
    """Vercel Cron calls this each morning: refresh jobs, then send each student today's steps."""
    if config.CRON_SECRET and authorization != f"Bearer {config.CRON_SECRET}":
        raise HTTPException(401, "Bad cron secret")
    counts = await services.refresh_jobs()
    sent = 0
    for u in store.all_users():
        if u["id"] == "demo" or not u.get("onboarded"):
            continue
        tasks = await prep_planner.today(u)
        top = job_matcher.ranked(u, 1)
        await services.queue_notification(u["id"], "email", "daily_plan", {"tasks": [t["title"] for t in tasks], "topJob": top[0] if top else None})
        sent += 1
    return dict(jobs=counts, notified=sent)
