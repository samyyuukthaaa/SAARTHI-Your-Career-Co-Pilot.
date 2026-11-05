"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "hi";

type State = {
  lang: Lang;
  shortlist: string[];
  done: string[];
  setLang: (l: Lang) => void;
  toggleShortlist: (id: string) => void;
  toggleDone: (id: string) => void;
};

// Per-device preferences. Server truth lives in Supabase once the backend is wired.
export const useApp = create<State>()(
  persist(
    (set) => ({
      lang: "en",
      shortlist: ["j1"],
      done: [],
      setLang: (lang) => set({ lang }),
      toggleShortlist: (id) =>
        set((s) => ({ shortlist: s.shortlist.includes(id) ? s.shortlist.filter((x) => x !== id) : [...s.shortlist, id] })),
      toggleDone: (id) => set((s) => ({ done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] })),
    }),
    { name: "saarathi-prefs" }
  )
);
