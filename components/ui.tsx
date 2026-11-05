import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "quiet" | "ghost" | "next";

const variants: Record<Variant, string> = {
  primary: "bg-peacock text-paper hover:bg-peacock-deep",
  next: "bg-marigold text-ink hover:bg-marigold-deep hover:text-paper",
  quiet: "bg-paper text-peacock-deep ring-1 ring-inset ring-line hover:ring-peacock",
  ghost: "text-peacock-deep hover:bg-peacock-wash",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 font-display text-[1rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...p} />;
}

export function LinkButton({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, variants[variant], className)} {...p} />;
}

export function Chip({ children, tone = "plain", className }: { children: ReactNode; tone?: "plain" | "gap" | "good" | "peacock"; className?: string }) {
  const tones = {
    plain: "bg-mist text-ink-soft",
    gap: "bg-marigold-wash text-marigold-deep",
    good: "bg-leaf-wash text-leaf",
    peacock: "bg-peacock-wash text-peacock-deep",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[0.85rem] font-medium", tones[tone], className)}>{children}</span>;
}

// Thin progress bar; `ghost` marks a previous value (e.g. last week's score).
export function Meter({ value, ghost, tone = "peacock", label }: { value: number; ghost?: number; tone?: "peacock" | "marigold" | "leaf"; label: string }) {
  const fill = { peacock: "bg-peacock", marigold: "bg-marigold", leaf: "bg-leaf" }[tone];
  return (
    <div className="relative h-2.5 w-full rounded-pill bg-mist" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
      <div className={clsx("h-full rounded-pill", fill)} style={{ width: `${value}%` }} />
      {ghost !== undefined && <div className="absolute top-[-3px] h-4 w-0.5 bg-ink/40" style={{ left: `${ghost}%` }} title={`Before: ${ghost}`} />}
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="display-wide text-[2.1rem] text-peacock-deep md:text-[2.6rem]">{title}</h1>
        {sub && <p className="mt-2 text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
