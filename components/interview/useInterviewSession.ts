"use client";
// One interview session for both rooms. With the backend running, questions, follow-ups and hints come
// from the Interviewer agent over the WebSocket, answers are transcribed in the browser, and tracking
// numbers (never video) are streamed once a second. On mock data it runs a local scripted interview.
import { useCallback, useEffect, useRef, useState } from "react";
import { questions } from "@/lib/mock";
import { openInterview, USE_MOCKS, type ServerEvent, type TrackingSample } from "@/lib/api";
import { transcriber } from "@/lib/speech";

export type Round = keyof typeof questions;
export type Phase = "waiting" | "connecting" | "asking" | "answering" | "thinking" | "done";

const hints: Record<Round, string> = {
  hr: "Try STAR: one line on the situation, what you had to do, what you did, and the result. Look up at her as you start.",
  technical: "Think out loud. Say the simplest approach first, then how you'd improve it. It's fine to ask a clarifying question.",
};
const HELP_WORDS = /\b(saarathi|sarathi|genie)[, ]+help\b/i;

export function useInterviewSession(round: Round, mode: "online" | "room" = "online") {
  const list = questions[round];
  const [index, setIndex] = useState(-1);
  const [total, setTotal] = useState(list.length);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [hint, setHint] = useState("");
  const [heard, setHeard] = useState("");
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [answerTime, setAnswerTime] = useState(0);
  const eye = useRef({ on: 0, total: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const conn = useRef<ReturnType<typeof openInterview> | null>(null);
  const ears = useRef<ReturnType<typeof transcriber> | null>(null);
  const lastSample = useRef(0);
  const answerStart = useRef(0);
  const helped = useRef(-1);
  const current = useRef(-1);
  const ended = useRef<(id: string | null) => void>();

  useEffect(() => {
    if (phase === "waiting" || phase === "done" || phase === "connecting") return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setAnswerTime((a) => a + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const speak = useCallback((text: string, then?: () => void) => {
    setCaption(text);
    setSpeaking(true);
    const done = () => {
      setSpeaking(false);
      then?.();
    };
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      u.rate = 0.98;
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } else {
      clearTimeout(timer.current);
      timer.current = setTimeout(done, Math.max(1500, text.length * 55));
    }
  }, []);

  const beginAnswer = useCallback(() => {
    setPhase("answering");
    setAnswerTime(0);
    setHeard("");
    answerStart.current = performance.now();
    ears.current?.start();
  }, []);

  const help = useCallback(() => {
    if (conn.current) conn.current.askGenie();
    else setHint(hints[round]);
  }, [round]);

  // ---- server events
  const onEvent = useCallback(
    (e: ServerEvent) => {
      if (e.type === "question") {
        setIndex(e.index);
        current.current = e.index;
        setTotal(e.total);
        setHint("");
        setPhase("asking");
        speak(e.text, beginAnswer);
      } else if (e.type === "hint") {
        setHint(e.text);
      } else if (e.type === "end") {
        setPhase("done");
        setReportId(e.reportId);
        speak(e.text);
        ended.current?.(e.reportId);
        conn.current = null;
      }
    },
    [speak, beginAnswer]
  );

  const start = useCallback(async () => {
    if (USE_MOCKS) {
      setIndex(0);
      setPhase("asking");
      speak(list[0], beginAnswer);
      return;
    }
    setPhase("connecting");
    ears.current = transcriber("en-IN", (all) => {
      setHeard(all);
      if (HELP_WORDS.test(all) && helped.current !== current.current) {
        helped.current = current.current;
        help();
      }
    });
    const c = openInterview(crypto.randomUUID(), round, mode, onEvent, () => {
      setError("Couldn't connect to the interviewer. Make sure the Saarathi backend is running, then try again.");
      setPhase("waiting");
    });
    conn.current = c;
    await c.ready;
    c.start();
  }, [list, speak, beginAnswer, round, mode, onEvent, help]);

  const next = useCallback(() => {
    if (USE_MOCKS) {
      if (index >= list.length - 1) {
        setPhase("done");
        setReportId("demo");
        speak("Thank you for your time. We'll be in touch.");
        return;
      }
      setIndex(index + 1);
      setPhase("asking");
      speak(list[index + 1], beginAnswer);
      return;
    }
    const text = ears.current?.stop() ?? "";
    const seconds = Math.round((performance.now() - answerStart.current) / 1000);
    setPhase("thinking");
    setCaption("…");
    conn.current?.answer(text, seconds);
  }, [index, list, speak, beginAnswer]);

  /** End early (or after the last question). Resolves with the report id once it's written. */
  const finish = useCallback((): Promise<string | null> => {
    if (USE_MOCKS || !conn.current) return Promise.resolve(reportId ?? (USE_MOCKS ? "demo" : null));
    ears.current?.stop();
    return new Promise((resolve) => {
      ended.current = resolve;
      conn.current?.end();
    });
  }, [reportId]);

  const say = useCallback((text: string) => speak(text), [speak]);

  const recordEye = useCallback((s: TrackingSample) => {
    eye.current.total++;
    if (s.eyeContact) eye.current.on++;
    const now = performance.now();
    if (conn.current && now - lastSample.current > 1000) {
      lastSample.current = now;
      conn.current.sendMetrics({ eyeContact: s.eyeContact, faceFound: s.faceFound, yaw: s.yaw, pitch: s.pitch, lookY: s.lookY, slouch: s.slouch });
    }
  }, []);
  const eyePct = eye.current.total ? Math.round((eye.current.on / eye.current.total) * 100) : 0;

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      clearTimeout(timer.current);
      ears.current?.stop();
      conn.current?.close();
    },
    []
  );

  return { index, total, phase, speaking, caption, hint, heard, error, reportId, elapsed, answerTime, start, next, finish, say, help, recordEye, eyePct };
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
