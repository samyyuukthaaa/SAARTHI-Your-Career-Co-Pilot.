"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

export type Lang = "en" | "hi";

type State = {
  lang: Lang;
  shortlist: string[];
  done: string[];
  setLang: (l: Lang) => void;
  hydrate: (s: { shortlist: string[]; done: string[] }) => void;
  toggleShortlist: (id: string) => void;
  toggleDone: (id: string) => void;
};

const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

// Per-device copy of the user's choices; every change is also saved on the server, which the agents read.
export const useApp = create<State>()(
  persist(
    (set, get) => ({
      lang: "en",
      shortlist: ["j1"],
      done: [],
      setLang: (lang) => set({ lang }),
      hydrate: ({ shortlist, done }) => set({ shortlist, done }),
      toggleShortlist: (id) => {
        const shortlist = flip(get().shortlist, id);
        set({ shortlist });
        api.saveShortlist(shortlist).catch(() => {});
      },
      toggleDone: (id) => {
        const done = flip(get().done, id);
        set({ done });
        api.saveDone(done).catch(() => {});
      },
    }),
    { name: "saarathi-prefs" }
  )
);
