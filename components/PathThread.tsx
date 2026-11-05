"use client";
import clsx from "clsx";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Task } from "@/lib/mock";
import { useApp } from "@/lib/store";

const kindLabel: Record<Task["kind"], string> = {
  learn: "Learn",
  quiz: "Quiz",
  practice: "Practice",
  interview: "Interview",
  apply: "Apply",
};

// The signature element: today's steps on one marigold thread, from where you are to the job.
export function PathThread({ tasks, goal }: { tasks: Task[]; goal: string }) {
  const { done, toggleDone } = useApp();
  const nextId = tasks.find((t) => !done.includes(t.id))?.id;

  return (
    <ol className="relative">
      <span aria-hidden className="absolute bottom-6 left-[15px] top-4 w-[3px] rounded-pill bg-marigold/35" />
      {tasks.map((t) => {
        const isDone = done.includes(t.id);
        const isNext = t.id === nextId;
        return (
          <li key={t.id} className="relative flex gap-4 pb-6">
            <button
              onClick={() => toggleDone(t.id)}
              aria-label={isDone ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
              className={clsx(
                "relative z-10 mt-1 flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full border-[3px] transition-colors",
                isDone ? "border-marigold bg-marigold text-ink" : isNext ? "border-marigold bg-paper" : "border-line bg-paper"
              )}
            >
              {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
              {isNext && <span className="h-2.5 w-2.5 rounded-full bg-marigold" />}
            </button>
            <Link
              href={t.href}
              className={clsx(
                "flex-1 rounded-tile px-4 py-3 transition-colors",
                isNext ? "bg-marigold-wash ring-1 ring-marigold/60" : "hover:bg-mist",
                isDone && "opacity-60"
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className={clsx("font-display text-[1.12rem] font-semibold", isDone && "line-through decoration-ink/40")}>{t.title}</span>
                <span className="shrink-0 text-[0.9rem] text-ink-soft">{t.minutes} min</span>
              </span>
              <span className="mt-0.5 block text-[0.95rem] text-ink-soft">
                {kindLabel[t.kind]} · {t.detail}
              </span>
            </Link>
          </li>
        );
      })}
      <li className="relative flex items-center gap-4">
        <span className="relative z-10 flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-peacock text-[0.75rem] font-bold text-paper">
          Job
        </span>
        <span className="font-display text-[1.05rem] font-medium text-peacock-deep">{goal}</span>
      </li>
    </ol>
  );
}
