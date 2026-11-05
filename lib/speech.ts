"use client";
// Browser speech-to-text (Chrome/Edge). Stand-in until Sarvam/Bhashini STT runs on the backend.

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function make(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export const canListen = () => make() !== null;

/** One utterance, e.g. a question to Genie. */
export function listen(lang: string): Promise<string> {
  return new Promise((resolve) => {
    const r = make();
    if (!r) return resolve("");
    let text = "";
    r.lang = lang;
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => (text = e.results[0][0].transcript);
    r.onend = () => resolve(text);
    r.onerror = () => resolve(text);
    r.start();
  });
}

/** Continuous transcript of a whole interview answer. Restarts itself when Chrome stops after silence. */
export function transcriber(lang: string, onWords?: (all: string) => void) {
  const r = make();
  let finals = "";
  let running = false;
  if (r) {
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) finals += " " + e.results[i][0].transcript;
      onWords?.(finals.trim());
    };
    r.onend = () => {
      if (running) {
        try {
          r.start();
        } catch {
          /* already started */
        }
      }
    };
    r.onerror = () => {};
  }
  return {
    supported: !!r,
    start() {
      finals = "";
      if (!r || running) return;
      running = true;
      try {
        r.start();
      } catch {
        /* already started */
      }
    },
    stop(): string {
      running = false;
      r?.stop();
      return finals.trim();
    },
  };
}
