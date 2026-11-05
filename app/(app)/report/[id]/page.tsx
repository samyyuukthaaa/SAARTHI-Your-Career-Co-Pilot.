import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { LinkButton, Meter } from "@/components/ui";
import { report, resources } from "@/lib/mock";

const gazeColors = ["bg-peacock", "bg-peacock/55", "bg-marigold", "bg-brick"];

export default function Report() {
  const r = report;
  const delta = r.overall - r.previous;

  return (
    <>
      <p className="text-ink-soft">{r.round} · {r.date}</p>
      <h1 className="display-wide mt-1 text-[2.1rem] text-peacock-deep md:text-[2.6rem]">Better than last time. Three things to fix.</h1>

      <section className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]" aria-labelledby="scores">
        <div>
          <h2 id="scores" className="sr-only">Scores</h2>
          <p className="display-narrow text-[4.5rem] leading-none text-peacock-deep">{r.overall}</p>
          <p className="mt-2 flex items-center gap-1 font-semibold text-leaf">
            {delta >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />} {Math.abs(delta)} since your last interview
          </p>
        </div>
        <ul className="space-y-4">
          {r.scores.map((s) => (
            <li key={s.label}>
              <div className="mb-1.5 flex justify-between text-[0.98rem]">
                <span className="font-medium">{s.label}</span>
                <span className="text-ink-soft">{s.value} <span className="text-ink-faint">(was {s.previous})</span></span>
              </div>
              <Meter value={s.value} ghost={s.previous} label={s.label} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="gaze">
        <h2 id="gaze" className="font-display text-[1.35rem] font-semibold">Where you looked</h2>
        <div className="mt-4 flex h-6 overflow-hidden rounded-pill" role="img" aria-label={r.gaze.map((g) => `${g.label} ${g.value}%`).join(", ")}>
          {r.gaze.map((g, i) => (
            <div key={g.label} className={gazeColors[i]} style={{ width: `${g.value}%` }} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem]">
          {r.gaze.map((g, i) => (
            <li key={g.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${gazeColors[i]}`} aria-hidden /> {g.label} <span className="text-ink-soft">{g.value}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="moments">
        <h2 id="moments" className="font-display text-[1.35rem] font-semibold">Moments that mattered</h2>
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {r.moments.map((m) => (
            <li key={m.t} className="grid grid-cols-[64px_1fr] gap-4 py-3.5">
              <span className="display-narrow text-[1.2rem] text-ink-soft">{m.t}</span>
              <span className="flex gap-2">
                <span aria-hidden className={m.kind === "good" ? "text-leaf" : "text-marigold-deep"}>{m.kind === "good" ? "✓" : "●"}</span>
                <span><span className="sr-only">{m.kind === "good" ? "Went well: " : "To fix: "}</span>{m.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-[20px] bg-marigold-wash p-6 md:p-8" aria-labelledby="fixes">
        <h2 id="fixes" className="font-display text-[1.35rem] font-semibold">Before your next interview</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5">
          {r.fixes.map((f) => {
            const lesson = resources.find((x) => x.id === f.lesson);
            return (
              <li key={f.title}>
                <span className="font-medium">{f.title}</span>
                {lesson && (
                  <span className="block text-[0.95rem] text-ink-soft">
                    Lesson: <Link href="/learn" className="text-peacock underline underline-offset-4">{lesson.title}</Link> ({lesson.minutes} min)
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <LinkButton href="/interview" className="mt-6">Practise again</LinkButton>
      </section>
    </>
  );
}
