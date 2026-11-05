// Thin client for the FastAPI backend. Every function falls back to mock data so the
// website works before the backend exists. Agents (built in AgentFoundry) run server-side.
import * as mock from "./mock";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

async function get<T>(path: string, fallback: T): Promise<T> {
  if (USE_MOCKS) return fallback;
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  jobs: () => get("/jobs/matches", mock.jobs), // Job matcher agent
  resources: () => get("/learning/items", mock.resources), // Learning curator agent
  today: () => get("/plan/today", mock.today), // Prep planner agent
  report: (id: string) => get(`/interview/${id}/report`, { ...mock.report, id }), // Report agent

  async uploadCv(file: File) {
    if (USE_MOCKS) {
      await new Promise((r) => setTimeout(r, 1400));
      return { skills: ["Java", "SQL", "React", "Git"], projects: 3, education: "B.Tech CSE, 2026" };
    }
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${API}/profile/cv`, { method: "POST", body, credentials: "include" }); // Profile agent
    if (!res.ok) throw new Error("We couldn't read that file. Upload a PDF under 5 MB.");
    return res.json();
  },
};

// Interview loop: audio chunks + tracking metrics up, questions + TTS audio down.
export type TrackingSample = { t: number; eyeContact: boolean; yaw: number; pitch: number; distance: number; slouch: boolean };
export type ServerEvent =
  | { type: "question"; text: string; audioUrl?: string }
  | { type: "hint"; text: string }
  | { type: "end"; reportId: string };

export function openInterview(sessionId: string, onEvent: (e: ServerEvent) => void) {
  if (USE_MOCKS) return null; // pages run a local scripted interview instead
  const ws = new WebSocket(`${WS}/interview/${sessionId}`);
  ws.onmessage = (m) => onEvent(JSON.parse(m.data));
  return {
    sendAudio: (chunk: Blob) => ws.readyState === 1 && ws.send(chunk),
    sendMetrics: (s: TrackingSample) => ws.readyState === 1 && ws.send(JSON.stringify({ type: "metrics", ...s })),
    askGenie: () => ws.readyState === 1 && ws.send(JSON.stringify({ type: "genie_help" })),
    close: () => ws.close(),
  };
}
