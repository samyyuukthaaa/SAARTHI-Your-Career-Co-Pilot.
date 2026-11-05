"use client";
import { useApp, type Lang } from "./store";

// Small dictionary for the shell. Swap for next-intl when the full Hindi UI is translated.
const dict = {
  today: { en: "Today", hi: "आज" },
  jobs: { en: "Jobs", hi: "नौकरियाँ" },
  learn: { en: "Learn", hi: "सीखें" },
  plan: { en: "Plan", hi: "योजना" },
  interview: { en: "Interview", hi: "इंटरव्यू" },
  askGenie: { en: "Ask Saarathi", hi: "सारथी से पूछें" },
  greeting: { en: "Good morning", hi: "सुप्रभात" },
} satisfies Record<string, Record<Lang, string>>;

export type Key = keyof typeof dict;

export function useT() {
  const lang = useApp((s) => s.lang);
  return (k: Key) => dict[k][lang];
}
