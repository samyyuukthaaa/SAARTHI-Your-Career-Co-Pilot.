"use client";
import clsx from "clsx";
import { useState } from "react";
import Link from "next/link";
import { Building2, Video } from "lucide-react";
import { LinkButton, PageTitle } from "@/components/ui";
import { api, useLoad } from "@/lib/api";

const rounds = [
  { id: "hr", name: "HR round", body: "Introduction, motivation, strengths, a tricky situation." },
  { id: "technical", name: "Technical round", body: "Arrays, strings, OOP and your own project, explained out loud." },
] as const;

const modes = [
  { id: "room", icon: Building2, name: "In-person room", body: "Knock, walk in and sit across the desk. The room moves with your head and the interviewer notices when you look away.", note: "Best on a laptop with a webcam" },
  { id: "online", icon: Video, name: "Online call", body: "A video interview like Google Meet or Teams, the way most first rounds now happen.", note: "Works on any phone" },
] as const;

export default function InterviewLobby() {
  const [round, setRound] = useState<(typeof rounds)[number]["id"]>("hr");
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("room");
  const { data: me } = useLoad(api.me);
  const past = me?.reports.slice().reverse() ?? [];

  return (
    <>
      <PageTitle title="Practise an interview" sub="About 8 minutes. Your camera stays on your device; only scores like eye contact are saved." />

      <h2 className="font-display text-[1.2rem] font-semibold">Round</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Round">
        {rounds.map((r) => (
          <button key={r.id} role="radio" aria-checked={round === r.id} onClick={() => setRound(r.id)} className={clsx("rounded-tile p-5 text-left ring-1 ring-inset transition-colors", round === r.id ? "bg-peacock-wash ring-2 ring-peacock" : "bg-paper ring-line hover:ring-peacock/60")}>
            <span className="font-display text-[1.2rem] font-semibold text-peacock-deep">{r.name}</span>
            <span className="mt-1 block text-ink-soft">{r.body}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-10 font-display text-[1.2rem] font-semibold">Where</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Interview setting">
        {modes.map(({ id, icon: Icon, name, body, note }) => (
          <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={clsx("flex gap-4 rounded-tile p-5 text-left ring-1 ring-inset transition-colors", mode === id ? "bg-peacock-wash ring-2 ring-peacock" : "bg-paper ring-line hover:ring-peacock/60")}>
            <Icon className="mt-1 h-7 w-7 shrink-0 text-peacock" aria-hidden />
            <span>
              <span className="font-display text-[1.2rem] font-semibold text-peacock-deep">{name}</span>
              <span className="mt-1 block text-ink-soft">{body}</span>
              <span className="mt-2 block text-[0.9rem] text-ink-faint">{note}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <LinkButton href={`/interview/${mode}?round=${round}`} variant="next" className="px-7 py-3 text-[1.08rem]">
          Start interview
        </LinkButton>
        <p className="text-ink-soft">
          Stuck mid-answer? Say <strong className="font-semibold text-ink">&quot;Saarathi, help&quot;</strong> for a quiet hint.
        </p>
      </div>

      {past.length > 0 && (
        <div className="mt-12 border-t border-line pt-6">
          <h2 className="font-display text-[1.2rem] font-semibold">Past interviews</h2>
          <ul className="mt-2 divide-y divide-line">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <Link href={`/report/${r.id}`} className="font-medium text-peacock underline underline-offset-4">{r.round}</Link>
                <span className="text-ink-soft">{r.date} · {r.overall}/100</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
