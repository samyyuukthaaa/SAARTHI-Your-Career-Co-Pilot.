"use client";
import Link from "next/link";
import { PathThread } from "@/components/PathThread";
import { Chip, LinkButton, Meter } from "@/components/ui";
import { jobs, today, user } from "@/lib/mock";
import { useT } from "@/lib/i18n";

export default function Home() {
  const t = useT();
  const fresh = jobs.slice(0, 2);
  const minutes = today.reduce((s, x) => s + x.minutes, 0);

  return (
    <>
      <div className="mb-10">
        <p className="text-ink-soft">{t("greeting")}, {user.name}</p>
        <h1 className="display-wide mt-1 max-w-2xl text-[2.1rem] text-peacock-deep md:text-[2.6rem]">
          {today.length} steps today, about {minutes} minutes.
        </h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="path">
          <h2 id="path" className="sr-only">Today&apos;s steps</h2>
          <PathThread tasks={today} goal="Associate Software Engineer, Accenture" />
        </section>

        <div className="space-y-10">
          <section aria-labelledby="ready">
            <h2 id="ready" className="font-display text-[1.25rem] font-semibold">Interview readiness</h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="display-narrow text-[3rem] leading-none text-peacock-deep">{user.readiness}</span>
              <span className="text-ink-soft">up from {user.readinessLastWeek} last week</span>
            </p>
            <div className="mt-3">
              <Meter value={user.readiness} ghost={user.readinessLastWeek} label="Interview readiness" />
            </div>
            <Link href="/report/demo" className="mt-3 inline-block text-[0.95rem] font-medium text-peacock underline underline-offset-4">
              See your last interview report
            </Link>
          </section>

          <section aria-labelledby="fresh" className="border-t border-line pt-8">
            <div className="flex items-baseline justify-between">
              <h2 id="fresh" className="font-display text-[1.25rem] font-semibold">New matches</h2>
              <Link href="/jobs" className="text-[0.95rem] font-medium text-peacock">All jobs</Link>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {fresh.map((j) => (
                <li key={j.id} className="py-3">
                  <Link href="/jobs" className="group flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-display text-[1.08rem] font-semibold group-hover:text-peacock">{j.title}</span>
                      <span className="text-[0.95rem] text-ink-soft">{j.company} · {j.location}</span>
                    </span>
                    <Chip tone="peacock">{j.match}% fit</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] bg-peacock-deep p-6 text-paper">
            <h2 className="font-display text-[1.25rem] font-semibold">Practise before it counts</h2>
            <p className="mt-1 text-paper/80">Last time you looked down while describing your project. Try one HR round focusing on eye contact.</p>
            <LinkButton href="/interview" variant="next" className="mt-5">Open the interview room</LinkButton>
          </section>
        </div>
      </div>
    </>
  );
}
