// Thin client for the FastAPI backend (backend/). Every call falls back to mock data when
// NEXT_PUBLIC_USE_MOCKS is not "false", so the website also works on its own.
"use client";
import { useEffect, useState } from "react";
import * as mock from "./mock";
import type { Job, Report, Resource, Task } from "./mock";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });
  if (!res.ok) {
    const detail = await res.json().then((b) => b?.detail).catch(() => null);
    throw new Error(typeof detail === "string" ? detail : `Saarathi's server returned ${res.status}. Try again in a moment.`);
  }
  return res.json() as Promise<T>;
}

const get = <T,>(path: string, fallback: T) => (USE_MOCKS ? Promise.resolve(fallback) : call<T>(path));
const send = <T,>(method: string, path: string, body: unknown, fallback: T) =>
  USE_MOCKS ? Promise.resolve(fallback) : call<T>(path, { method, body: JSON.stringify(body) });

export type Me = {
  name: string;
  city?: string;
  minutesPerDay: number;
  readiness: number;
  readinessLastWeek: number;
  streak: number;
  goal: string | null;
  shortlist: string[];
  done: string[];
  lastReport: { id: string; round: string; date: string; tip: string | null } | null;
  reports: { id: string; round: string; date: string; overall: number }[];
};
export type Week = { days: { day: string; focus: string; tasks: number }[]; minutesPerDay: number; goal: string | null };
export type TestItem = { id: string; q: string; kind: string; options: string[] };
export type Quiz = { skill: string; label: string; questions: { id: string; q: string; options: string[] }[] };
export type QuizResult = { score: number; results: { id: string; correct: boolean; answer: number }[]; next: string };

const mockMe: Me = {
  ...mock.user,
  goal: "Associate Software Engineer, Accenture",
  shortlist: ["j1"],
  done: [],
  lastReport: { id: "demo", round: mock.report.round, date: mock.report.date, tip: mock.report.fixes[0].title },
  reports: [{ id: "demo", round: mock.report.round, date: mock.report.date, overall: mock.report.overall }],
};

export const api = {
  me: () => get<Me>("/me", mockMe),
  jobs: () => get<Job[]>("/jobs/matches", mock.jobs), // Job matcher agent
  resources: () => get<Resource[]>("/learning/items", mock.resources), // Learning curator agent
  today: () => get<Task[]>("/plan/today", mock.today), // Prep planner agent
  week: () => get<Week>("/plan/week", { days: mock.week, minutesPerDay: mock.user.minutesPerDay, goal: mockMe.goal }),
  report: (id: string) => get<Report>(`/interview/${id}/report`, { ...mock.report, id }), // Report agent
  saveShortlist: (ids: string[]) => send("PUT", "/jobs/shortlist", { ids }, { shortlist: ids }),
  saveDone: (ids: string[]) => send("PUT", "/learning/done", { ids }, { done: ids }),
  quiz: (skill: string) => get<Quiz>(`/quiz/${skill}`, { skill, label: skill, questions: [] }),
  gradeQuiz: (skill: string, answers: Record<string, number>) =>
    send<QuizResult>("POST", `/quiz/${skill}`, { answers }, { score: 0, results: [], next: "" }),
  genie: (text: string, lang: string) => send<{ reply: string; distress: boolean }>("POST", "/genie", { text, lang }, { reply: "", distress: false }),
  test: () => get<TestItem[]>("/profile/test", []),
  saveProfile: (body: { languages: string[]; minutesPerDay: number; answers: Record<string, number> }) =>
    send("POST", "/profile", body, { ok: true }),

  async uploadCv(file: File) {
    if (USE_MOCKS) {
      await new Promise((r) => setTimeout(r, 1400));
      return { skills: ["Java", "SQL", "React", "Git"], projects: 3, education: "B.Tech CSE, 2026" };
    }
    const body = new FormData();
    body.append("file", file);
    return call<{ skills: string[]; projects: number; education: string }>("/profile/cv", { method: "POST", body }); // Profile agent
  },
};

/** Load data once on mount. `data` is undefined while loading. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setError("");
    load()
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message || "Couldn't reach Saarathi's server."));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error };
}

// Interview loop: answers + tracking metrics up, questions + hints down.
export type TrackingSample = { eyeContact: boolean; faceFound: boolean; yaw: number; pitch: number; lookY: number; slouch: boolean };
export type ServerEvent =
  | { type: "question"; text: string; index: number; total: number; followUp: boolean }
  | { type: "hint"; text: string }
  | { type: "end"; reportId: string | null; text: string };

export function openInterview(sessionId: string, round: string, mode: string, onEvent: (e: ServerEvent) => void, onError: () => void) {
  const ws = new WebSocket(`${WS}/interview/${sessionId}?round=${round}&mode=${mode}`);
  ws.onmessage = (m) => onEvent(JSON.parse(m.data));
  ws.onerror = onError;
  const sendJson = (o: object) => ws.readyState === 1 && ws.send(JSON.stringify(o));
  return {
    ready: new Promise<void>((resolve) => ws.addEventListener("open", () => resolve())),
    start: () => sendJson({ type: "start" }),
    answer: (text: string, seconds: number) => sendJson({ type: "answer", text, seconds }),
    sendMetrics: (s: TrackingSample) => sendJson({ type: "metrics", ...s }),
    askGenie: () => sendJson({ type: "genie_help" }),
    end: () => sendJson({ type: "end" }),
    close: () => ws.close(),
  };
}
