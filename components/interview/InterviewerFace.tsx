"use client";
import clsx from "clsx";
import { useEffect, useState } from "react";

// 2D interviewer for the online room: light enough for any phone. The mouth follows the speaking
// state; swap in TTS audio levels from the Web Audio API for real lip sync.
export function InterviewerFace({ speaking, className }: { speaking: boolean; className?: string }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label={speaking ? "Interviewer speaking" : "Interviewer listening"}>
      <rect width="240" height="240" fill="#1D4C58" />
      <rect x="150" y="30" width="70" height="90" rx="4" fill="#2A6372" />
      <path d="M150 75h70M185 30v90" stroke="#1D4C58" strokeWidth="3" />
      <path d="M46 240c4-52 36-76 74-76s70 24 74 76z" fill="#0F5C6E" />
      <path d="M104 164l16 22 16-22" fill="#F4F6F5" />
      <rect x="108" y="140" width="24" height="26" rx="8" fill="#7A4D33" />
      <ellipse cx="120" cy="110" rx="40" ry="46" fill="#8C5A3C" />
      <path d="M78 104c0-38 22-56 42-56s42 18 42 56c-8-16-22-26-42-26s-34 10-42 26z" fill="#14212B" />
      <circle cx="120" cy="54" r="14" fill="#14212B" />
      <g fill="#14212B">
        <ellipse cx="104" cy="112" rx="4.5" ry={blink ? 0.6 : 4.5} />
        <ellipse cx="136" cy="112" rx="4.5" ry={blink ? 0.6 : 4.5} />
      </g>
      <path d="M96 100q8-5 16 0M128 100q8-5 16 0" stroke="#14212B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g style={{ transformOrigin: "120px 134px" }} className={clsx(speaking && "animate-talk")}>
        <ellipse cx="120" cy="134" rx="10" ry={speaking ? 6 : 1.8} fill="#5A2E22" />
      </g>
    </svg>
  );
}
