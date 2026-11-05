"use client";
import clsx from "clsx";
import { Loading, PageTitle } from "@/components/ui";
import { api, useLoad } from "@/lib/api";
import { useApp } from "@/lib/store";

export default function Plan() {
  const { shortlist, done } = useApp();
  const { data: week, error } = useLoad(api.week, [shortlist.join(), done.join()]);
  if (!week) return <Loading error={error} label="Planning your week" />;
  return (
    <>
      <PageTitle
        title="Your week"
        sub={`Built around ${week.minutesPerDay} minutes a day${week.goal ? ` and your goal: ${week.goal}` : ""}. Saarathi re-plans each night from your quiz and interview results.`}
      />
      <ol className="divide-y divide-line border-y border-line">
        {week.days.map((d, i) => (
          <li key={d.day} className={clsx("grid grid-cols-[96px_1fr_auto] items-center gap-4 py-5", i === 0 && "bg-marigold-wash/60 -mx-4 px-4 md:-mx-6 md:px-6")}>
            <span className={clsx("display-narrow text-[1.5rem]", i === 0 ? "text-marigold-deep" : "text-ink-soft")}>{d.day}</span>
            <span className="font-display text-[1.15rem] font-semibold">{d.focus}</span>
            <span className="text-ink-soft">{d.tasks} tasks</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-ink-soft">Want reminders? Turn on email or WhatsApp in your profile and Saarathi will send today&apos;s steps each morning.</p>
    </>
  );
}
