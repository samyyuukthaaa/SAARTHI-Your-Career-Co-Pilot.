"use client";
import clsx from "clsx";
import { useState } from "react";
import { Mic, MicOff, PhoneOff, SkipForward } from "lucide-react";
import { Wheel } from "../Logo";

export function Controls({ onNext, onHelp, onEnd, canAnswer }: { onNext: () => void; onHelp: () => void; onEnd: () => void; canAnswer: boolean }) {
  const [muted, setMuted] = useState(false);
  const base = "flex h-12 items-center justify-center gap-2 rounded-pill font-display font-semibold transition-colors";
  const round = `${base} px-5`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <button onClick={() => setMuted((m) => !m)} aria-pressed={muted} aria-label={muted ? "Unmute microphone" : "Mute microphone"} className={clsx(base, "w-12 shrink-0", muted ? "bg-brick text-paper" : "bg-paper text-peacock-deep hover:bg-mist")}>
        {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <button onClick={onNext} disabled={!canAnswer} className={clsx(round, "bg-paper text-peacock-deep hover:bg-mist disabled:opacity-40")}>
        <SkipForward className="h-5 w-5" aria-hidden /> I&apos;ve finished my answer
      </button>
      <button onClick={onHelp} className={clsx(round, "bg-marigold text-ink hover:bg-marigold-deep hover:text-paper")}>
        <Wheel className="h-6 w-6" /> Saarathi, help
      </button>
      <button onClick={onEnd} className={clsx(round, "bg-brick text-paper hover:brightness-110")}>
        <PhoneOff className="h-5 w-5" aria-hidden /> End
      </button>
    </div>
  );
}

export function EyeContactBadge({ on, ready }: { on: boolean; ready: boolean }) {
  if (!ready) return <span className="rounded-pill bg-ink/60 px-3 py-1 text-[0.85rem] text-paper">Camera off</span>;
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-pill px-3 py-1 text-[0.85rem] font-semibold", on ? "bg-leaf text-paper" : "bg-marigold text-ink")} aria-live="polite">
      <span className={clsx("h-2 w-2 rounded-full", on ? "bg-paper" : "bg-ink")} aria-hidden />
      {on ? "Eye contact" : "Look at the interviewer"}
    </span>
  );
}
