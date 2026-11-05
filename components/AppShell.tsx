"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Briefcase, CalendarDays, Flame, MessagesSquare, Sun } from "lucide-react";
import { Logo } from "./Logo";
import { Genie } from "./Genie";
import { useApp } from "@/lib/store";
import { useT, type Key } from "@/lib/i18n";
import { api, useLoad, USE_MOCKS } from "@/lib/api";

const nav: { href: string; key: Key; icon: typeof Sun }[] = [
  { href: "/home", key: "today", icon: Sun },
  { href: "/jobs", key: "jobs", icon: Briefcase },
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/plan", key: "plan", icon: CalendarDays },
  { href: "/interview", key: "interview", icon: MessagesSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const t = useT();
  const { lang, setLang, hydrate } = useApp();
  const { data: me } = useLoad(api.me);

  // The server is the source of truth for what's shortlisted and finished.
  useEffect(() => {
    if (me && !USE_MOCKS) hydrate({ shortlist: me.shortlist, done: me.done });
  }, [me, hydrate]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-paper px-5 py-6 md:flex">
        <Link href="/" aria-label="Saarathi home">
          <Logo />
        </Link>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
          {nav.map(({ href, key, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-tile px-3 py-2.5 font-display text-[1.05rem] font-medium transition-colors",
                  active ? "bg-peacock text-paper" : "text-ink-soft hover:bg-mist hover:text-ink"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4 text-[0.95rem]">
          <p className="flex items-center gap-2 text-ink-soft">
            <Flame className="h-4 w-4 text-marigold" aria-hidden /> {me?.streak ?? 0}-day streak
          </p>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/home" aria-label="Saarathi home">
          <Logo tagline={false} />
        </Link>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 md:px-10 md:pb-16 md:pt-10">{children}</main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Main">
        {nav.map(({ href, key, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={clsx("flex flex-col items-center gap-0.5 py-2 text-[0.75rem] font-medium", active ? "text-peacock" : "text-ink-faint")}>
              <Icon className="h-5 w-5" aria-hidden />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <Genie />
    </div>
  );
}

function LangToggle({ lang, setLang }: { lang: "en" | "hi"; setLang: (l: "en" | "hi") => void }) {
  return (
    <div className="inline-flex rounded-pill bg-mist p-1 text-[0.9rem]" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={clsx("rounded-pill px-3 py-1 font-medium", lang === l ? "bg-paper text-peacock-deep shadow-sm" : "text-ink-soft")}
        >
          {l === "en" ? "English" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}
