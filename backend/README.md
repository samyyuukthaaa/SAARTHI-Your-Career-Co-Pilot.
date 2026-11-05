# Saarathi backend (FastAPI)

The API behind the website. Seven agents make every decision that needs judgement; everything else is plumbing.

## Run it

```bash
cd backend
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # macOS/Linux: .venv/bin/pip
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

Then set `NEXT_PUBLIC_USE_MOCKS=false` in the website's `.env.local` and run `npm run dev`. Tests: `.venv/Scripts/python -m pytest -q`.

Every key in `.env.example` is optional. With no keys, the agents use built-in rules, jobs come from Remotive and Arbeitnow (free, no key), plus seeded demo listings, and notifications are logged instead of sent.

## Agents (`app/agents/`)

| Agent | Job | Endpoints |
|---|---|---|
| Genie | Routes requests, replies in Hindi or English, spots distress and points to Tele-MANAS 14416 | `POST /genie` |
| Profile | CV PDF → skills, education, projects; RIASEC + Mini-IPIP + situational test scoring | `POST /profile/cv`, `GET /profile/test`, `POST /profile`, `DELETE /profile` |
| Job matcher | Ranks cached jobs against CV, quiz scores and interests; explains each match | `GET /jobs/matches`, `PUT /jobs/shortlist`, `POST /jobs/refresh` |
| Learning curator | Free lectures per skill gap, matched to language, level and time | `GET /learning/items`, `PUT /learning/done` |
| Prep planner | Day-by-day plan inside minutes-per-day; quizzes | `GET /plan/today`, `GET /plan/week`, `GET/POST /quiz/{skill}` |
| Interviewer | Asks, follows up, gives hints without answers | `WS /interview/{session_id}?round=hr|technical&mode=online|room` |
| Report | Scores, gaze split, moments, three fixes linked to real lessons | `GET /interview/{id}/report` |

Also: `GET /me`, `GET /cohort` (placement-cell table), `GET /notifications`, `POST /cron/daily` (Vercel Cron: refresh jobs, send each student today's steps via n8n).

## Interview WebSocket

Client → server: `{"type":"start"}`, `{"type":"answer","text":"…","seconds":42}`, `{"type":"metrics","eyeContact":true,"faceFound":true,"yaw":0,"pitch":0,"lookY":0,"slouch":false}` (about once a second), `{"type":"genie_help"}`, `{"type":"end"}`.
Server → client: `{"type":"question","text":"…","index":0,"total":5,"followUp":false}`, `{"type":"hint","text":"…"}`, `{"type":"end","reportId":"r-…"}`.

Video never leaves the browser; only these numbers do. Answers are transcribed by the browser until Sarvam/Bhashini STT is wired in.

## Data

SQLite (`saarathi.db`) with the same tables planned for Supabase: users, jobs, sessions, reports, notifications, cache. Swapping in Supabase only touches `app/store.py`.
