# Saarathi — your career copilot (web frontend)

Saarathi helps first-time coders in India find jobs that fit, learn what's missing from free open courses in their language, and practise interviews in a room that feels real. This repo folder is the **Next.js website**. The FastAPI backend and the seven agents built in **AgentFoundry** live in `backend/` and `agents/` of the monorepo.

## Run it

```bash
cd web            # or this folder
npm install
cp .env.example .env.local
npm run dev       # http://localhost:3000
```

With `NEXT_PUBLIC_USE_MOCKS=true` (the default) every page works with demo data from `lib/mock.ts`, so the UI can be built before the backend exists. Set it to `false` once FastAPI is running.

Camera and microphone need **HTTPS** (or `localhost`). Use Chrome or Edge.

## Pages

| Route | What it is | Backend agent behind it |
| --- | --- | --- |
| `/` | Landing page | — |
| `/onboarding` | CV upload → languages and daily time → psychometric test | Profile |
| `/home` | Today's steps on the path, readiness score, new matches | Prep planner, Job matcher |
| `/jobs` | Ranked jobs with reasons, skill gaps, shortlist, apply link-out | Job matcher |
| `/learn` | Free lectures and courses per skill gap, mark done, quiz | Learning curator |
| `/plan` | The week's plan | Prep planner |
| `/interview` | Choose round (HR / technical) and setting (in-person room / online call) | — |
| `/interview/room` | 3D in-person room: knock and walk in, head-coupled camera, eye contact, calibration, interviewer reactions | Interviewer |
| `/interview/online` | Meet-style video interview with a 2D interviewer | Interviewer |
| `/report/[id]` | Scores vs last time, where you looked, moments, fixes linked to lessons | Report |
| Floating button | "Ask Saarathi" voice assistant on every app page | Genie |

## Where things live

```
app/                     routes (App Router)
  (app)/                 pages inside the app shell (rail + mobile tab bar)
  interview/room         3D room page
  interview/online       online call page
components/
  AppShell.tsx           navigation, language toggle
  Genie.tsx              assistant panel (mock replies → replace with /genie API)
  PathThread.tsx         today's steps on the marigold path (signature element)
  interview/Room3D.tsx   React Three Fiber room, interviewer, head-coupled camera rig
  interview/useInterviewSession.ts  scripted demo interview (replace with WebSocket)
lib/
  tracking/useTracking.ts  MediaPipe Face Landmarker: head position, rotation, gaze, eye contact, calibration
  tracking/oneEuro.ts      smoothing filter
  api.ts                   REST + WebSocket client with mock fallbacks
  mock.ts                  demo data shaped like the API contract
  store.ts                 per-device preferences (language, shortlist, done items)
  i18n.ts                  English / Hindi strings for the shell
```

## Wiring the backend (Person A)

1. `lib/api.ts` — endpoints are already named: `/jobs/matches`, `/learning/items`, `/plan/today`, `/interview/{id}/report`, `/profile/cv`, and `ws /interview/{session}`.
2. Replace `useInterviewSession` with `openInterview()` events: `question`, `hint`, `end`. Send mic chunks with `MediaRecorder` and tracking samples every second with `sendMetrics()`.
3. Replace browser `speechSynthesis` (placeholder voice) with Sarvam/Bhashini TTS audio URLs from the backend.
4. Replace the Genie's mock replies with a call to the Genie agent.

## Tuning the tracking

`useTracking` exposes a 5 Hz `snapshot` for UI and a per-frame `live` ref for the 3D scene. If eye contact feels too strict or loose, change `eyeContactThreshold` (default 0.2). If yaw or pitch signs look inverted on a device, flip them in `useTracking.ts`. Add a debug overlay printing `snapshot` while tuning.

## Design

- Colours: paper `#F4F6F5`, ink `#14212B`, peacock `#0F5C6E` (primary), marigold `#E9A23B` (only for "your next step"), leaf `#3E8E63`, brick `#B4473A`.
- Type: Anek Latin (headings, using its width axis) and Mukta (body), both by Ek Type with matching Devanagari, Telugu and Tamil families.
- Mark: a chariot wheel. A saarathi steers the journey; the marigold hub is the user.

## Licence

MIT. Learning resources are linked, never re-hosted.
