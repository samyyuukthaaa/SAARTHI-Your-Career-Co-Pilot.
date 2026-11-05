import clsx from "clsx";

// The mark is a chariot wheel: a saarathi steers the journey; the marigold hub is "you".
export function Wheel({ className, light = false }: { className?: string; light?: boolean }) {
  const stroke = light ? "#F4F6F5" : "#0F5C6E";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round">
        <circle cx="20" cy="20" r="15" />
        <path d="M20 5v30M5 20h30M9.4 9.4l21.2 21.2M30.6 9.4 9.4 30.6" />
      </g>
      <circle cx="20" cy="20" r="5" fill="#E9A23B" />
    </svg>
  );
}

export function Logo({ light = false, tagline = true, className }: { light?: boolean; tagline?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <Wheel className="h-8 w-8 shrink-0" light={light} />
      <span className="flex flex-col leading-none">
        <span className={clsx("display-wide text-[1.35rem]", light ? "text-paper" : "text-peacock-deep")}>Saarathi</span>
        {tagline && (
          <span className={clsx("mt-1 text-[0.8rem] font-medium", light ? "text-paper/70" : "text-ink-soft")}>your career copilot</span>
        )}
      </span>
    </span>
  );
}
