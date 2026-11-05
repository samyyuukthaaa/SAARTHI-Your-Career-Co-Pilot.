"use client";
// Scripted interview for the demo. In production the questions, hints and follow-ups come from the
// Interviewer agent (AgentFoundry) over the WebSocket in lib/api.ts, and audio comes from Sarvam/Bhashini TTS.
import { useCallback, useEffect, useRef, useState } from "react";
import { questions } from "@/lib/mock";

export type Round = keyof typeof questions;
export type Phase = "waiting" | "asking" | "answering" | "done";

const hints: Record<Round, string> = {
  hr: "Try STAR: one line on the situation, what you had to do, what you did, and the result. Look up at her as you start.",
  technical: "Think out loud. Say the simplest approach first, then how you'd improve it. It's fine to ask a clarifying question.",
};

export function useInterviewSession(round: Round) {
  const list = questions[round];
  const [index, setIndex] = useState(-1);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [hint, setHint] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [answerTime, setAnswerTime] = useState(0);
  const eye = useRef({ on: 0, total: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (phase === "waiting" || phase === "done") return;
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

  const ask = useCallback(
    (i: number) => {
      setIndex(i);
      setHint("");
      setPhase("asking");
      speak(list[i], () => {
        setPhase("answering");
        setAnswerTime(0);
      });
    },
    [list, speak]
  );

  const start = useCallback(() => ask(0), [ask]);

  const next = useCallback(() => {
    if (index >= list.length - 1) {
      setPhase("done");
      speak("Thank you for your time. We'll be in touch.");
      return;
    }
    ask(index + 1);
  }, [ask, index, list.length, speak]);

  const say = useCallback((text: string) => speak(text), [speak]);
  const help = useCallback(() => setHint(hints[round]), [round]);
  const recordEye = useCallback((on: boolean) => {
    eye.current.total++;
    if (on) eye.current.on++;
  }, []);
  const eyePct = eye.current.total ? Math.round((eye.current.on / eye.current.total) * 100) : 0;

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    clearTimeout(timer.current);
  }, []);

  return { index, total: list.length, phase, speaking, caption, hint, elapsed, answerTime, start, next, say, help, recordEye, eyePct };
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
