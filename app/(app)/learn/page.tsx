"use client";
import clsx from "clsx";
import { Check, ExternalLink } from "lucide-react";
import { Chip, LinkButton, PageTitle } from "@/components/ui";
import { resources } from "@/lib/mock";
import { useApp } from "@/lib/store";

export default function Learn() {
  const { done, toggleDone } = useApp();
  const skills = Array.from(new Set(resources.map((r) => r.skill)));

  return (
    <>
      <PageTitle
        title="Learn what's missing"
        sub="Free lectures and courses picked for the jobs you shortlisted, your level and your languages. Every link opens the original source."
      />

      <div className="space-y-12">
        {skills.map((skill) => {
          const items = resources.filter((r) => r.skill === skill);
          const finished = items.filter((r) => done.includes(r.id)).length;
          return (
            <section key={skill} aria-labelledby={`s-${skill}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
                <h2 id={`s-${skill}`} className="display-narrow text-[1.7rem] text-ink">{skill}</h2>
                <span className="text-ink-soft">{finished} of {items.length} done</span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((r) => {
                  const isDone = done.includes(r.id);
                  return (
                    <li key={r.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="flex flex-wrap items-center gap-2 text-[0.9rem] text-ink-soft">
                          <span className="font-semibold text-peacock-deep">{r.provider}</span>
                          <span>{r.format}</span>
                          <span>{r.minutes} min</span>
                          <Chip>{r.language}</Chip>
                        </p>
                        <h3 className={clsx("mt-1 font-display text-[1.2rem] font-semibold", isDone && "text-ink-soft line-through decoration-ink/30")}>{r.title}</h3>
                        <p className="mt-1 text-[0.98rem] text-ink-soft">{r.why}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-pill bg-peacock px-4 py-2 font-display font-semibold text-paper hover:bg-peacock-deep">
                          Open <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                        <button
                          onClick={() => toggleDone(r.id)}
                          aria-pressed={isDone}
                          className={clsx("inline-flex items-center gap-1.5 rounded-pill px-4 py-2 font-display font-semibold ring-1 ring-inset", isDone ? "bg-leaf-wash text-leaf ring-leaf/40" : "text-ink-soft ring-line hover:ring-peacock")}
                        >
                          <Check className="h-4 w-4" aria-hidden /> {isDone ? "Done" : "Mark done"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {finished === items.length && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-tile bg-marigold-wash px-5 py-3">
                  <p>Ready to check it stuck? 8 questions, about 10 minutes.</p>
                  <LinkButton href="/learn" variant="next" className="py-2">Take the quiz</LinkButton>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
