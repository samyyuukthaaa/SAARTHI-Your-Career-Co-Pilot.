"use client";
import clsx from "clsx";
import { useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Chip, LinkButton, PageTitle } from "@/components/ui";
import { jobs } from "@/lib/mock";
import { useApp } from "@/lib/store";

const filters = ["All", "Hyderabad", "Remote", "Internships"] as const;

export default function Jobs() {
  const { shortlist, toggleShortlist } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const shown = jobs.filter((j) =>
    filter === "All" ? true : filter === "Remote" ? j.location.includes("Remote") : filter === "Internships" ? /intern/i.test(j.title) : j.location.includes(filter)
  );

  return (
    <>
      <PageTitle
        title="Jobs that fit you"
        sub="Refreshed every morning from Adzuna, JSearch, Jooble and company job boards. Shortlist the ones you want and Saarathi builds your preparation around them."
      />

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter jobs">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={clsx("rounded-pill px-4 py-1.5 text-[0.95rem] font-medium ring-1 ring-inset", filter === f ? "bg-ink text-paper ring-ink" : "bg-paper text-ink-soft ring-line")}
          >
            {f}
          </button>
        ))}
      </div>

      {shortlist.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-tile bg-marigold-wash px-5 py-4">
          <p className="text-ink">
            <strong className="font-semibold">{shortlist.length} shortlisted.</strong> Your lessons and plan cover what these jobs ask for.
          </p>
          <LinkButton href="/learn" variant="next" className="py-2">See what to learn</LinkButton>
        </div>
      )}

      <ul className="divide-y divide-line border-y border-line">
        {shown.map((j) => {
          const saved = shortlist.includes(j.id);
          return (
            <li key={j.id} className="grid gap-4 py-6 md:grid-cols-[88px_1fr_auto]">
              <div className="flex items-baseline gap-2 md:block">
                <span className="display-narrow text-[2.4rem] leading-none text-peacock-deep">{j.match}</span>
                <span className="text-[0.85rem] text-ink-soft md:block">% fit</span>
              </div>
              <div>
                <h2 className="font-display text-[1.3rem] font-semibold">{j.title}</h2>
                <p className="text-ink-soft">
                  {j.company} · {j.location}
                  {j.salary && <> · {j.salary}</>}
                </p>
                <ul className="mt-3 space-y-1 text-[0.98rem]">
                  {j.reasons.map((r) => (
                    <li key={r} className="flex gap-2"><span aria-hidden className="text-leaf">✓</span>{r}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[0.9rem] text-ink-soft">To learn:</span>
                  {j.gaps.map((g) => <Chip key={g} tone="gap">{g}</Chip>)}
                </div>
                <p className="mt-3 text-[0.88rem] text-ink-faint">
                  Selection: {j.round.join(" → ")} · via {j.source} · posted {j.postedDaysAgo}d ago
                </p>
              </div>
              <div className="flex gap-2 md:flex-col md:items-end">
                <button
                  onClick={() => toggleShortlist(j.id)}
                  aria-pressed={saved}
                  className={clsx("inline-flex items-center gap-2 rounded-pill px-4 py-2 font-display font-semibold ring-1 ring-inset", saved ? "bg-peacock text-paper ring-peacock" : "bg-paper text-peacock-deep ring-line hover:ring-peacock")}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {saved ? "Shortlisted" : "Shortlist"}
                </button>
                <a href={j.applyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 font-display font-medium text-peacock-deep hover:bg-mist">
                  Apply on {j.source} <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="py-10 text-ink-soft">No jobs match this filter yet. New openings arrive every morning; try &quot;All&quot; for now.</p>}
      <p className="mt-6 text-[0.9rem] text-ink-faint">
        Looking for government or apprenticeship roles? <a className="underline underline-offset-4" href="https://www.ncs.gov.in" target="_blank" rel="noreferrer">Search on the National Career Service portal</a>.
      </p>
    </>
  );
}
