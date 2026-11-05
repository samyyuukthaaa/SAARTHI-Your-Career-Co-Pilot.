"use client";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { LinkButton, Loading, Meter } from "@/components/ui";
import { api, useLoad } from "@/lib/api";

const gazeColors = ["bg-peacock", "bg-peacock/55", "bg-marigold", "bg-brick"];

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error } = useLoad(() => api.report(id), [id]);
  if (!r) return <Loading error={error} label="Writing your report" />;
  const delta = r.overall - r.previous;

  return (
    <>
      <p className="text-ink-soft">{r.round} · {r.date}</p>
      <h1 className="display-wide mt-1 text-[2.1rem] text-peacock-deep md:text-[2.6rem]">{r.headline ?? "Better than last time. Three things to fix."}</h1>
      {r.summary && <p className="mt-3 max-w-2xl text-[1.05rem] text-ink-soft">{r.summary}</p>}

      <section className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]" aria-labelledby="scores">
        <div>
          <h2 id="scores" className="sr-only">Scores</h2>
          <p className="display-narrow text-[4.5rem] leading-none text-peacock-deep">{r.overall}</p>
          <p className={`mt-2 flex items-center gap-1 font-semibold ${delta >= 0 ? "text-leaf" : "text-brick"}`}>
            {delta >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />} {Math.abs(delta)} since your last interview
          </p>
        </div>
        <ul className="space-y-4">
          {r.scores.map((s) => (
            <li key={s.label}>
              <div className="mb-1.5 flex justify-between text-[0.98rem]">
                <span className="font-medium">{s.label}</span>
                <span className="text-ink-soft">
                  {s.measured === false ? "not measured (camera off)" : <>{s.value} <span className="text-ink-faint">(was {s.previous})</span></>}
                </span>
              </div>
              <Meter value={s.value} ghost={s.previous} label={s.label} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="gaze">
        <h2 id="gaze" className="font-display text-[1.35rem] font-semibold">Where you looked</h2>
        {r.gazeMeasured === false && <p className="mt-1 text-ink-soft">Turn your camera on next time to see where you looked. Video never leaves your device.</p>}
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
        {r.moments.length === 0 && <p className="mt-2 text-ink-soft">Nothing stood out either way. Try a longer interview for more detail.</p>}
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {r.moments.map((m, i) => (
            <li key={`${m.t}-${i}`} className="grid grid-cols-[64px_1fr] gap-4 py-3.5">
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
          {r.fixes.map((f) => (
            <li key={f.title}>
              <span className="font-medium">{f.title}</span>
              {f.lesson && (
                <span className="block text-[0.95rem] text-ink-soft">
                  Lesson:{" "}
                  <a href={f.lesson.url} target="_blank" rel="noreferrer" className="text-peacock underline underline-offset-4">{f.lesson.title}</a> ({f.lesson.minutes} min)
                </span>
              )}
            </li>
          ))}
        </ol>
        <LinkButton href="/interview" className="mt-6">Practise again</LinkButton>
      </section>

      {r.transcript && r.transcript.length > 0 && (
        <details className="mt-10 rounded-tile border border-line p-5">
          <summary className="cursor-pointer font-display text-[1.15rem] font-semibold">What you said</summary>
          <ol className="mt-4 space-y-5">
            {r.transcript.map((t, i) => (
              <li key={i}>
                <p className="font-medium">{t.q}</p>
                <p className="mt-1 text-ink-soft">{t.a || <em>No transcript: your browser didn&apos;t provide speech-to-text.</em>}</p>
                {t.followUp && (
                  <>
                    <p className="mt-2 font-medium">{t.followUp}</p>
                    <p className="mt-1 text-ink-soft">{t.followUpAnswer || "…"}</p>
                  </>
                )}
                <p className="mt-1 text-[0.9rem] text-ink-faint">Answer score {t.score}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
}
