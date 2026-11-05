import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";

const steps = [
  { title: "Upload your CV", body: "Saarathi reads your skills and projects, then a 10-minute test shows how you like to work." },
  { title: "See jobs that fit", body: "Fresh openings every morning from official job sources, each with a plain reason why it suits you." },
  { title: "Learn what's missing, free", body: "NPTEL, freeCodeCamp, MIT OpenCourseWare and more, picked for your gaps, level and language." },
  { title: "Practise the interview", body: "Walk into a 3D interview room that moves with your head and notices when you look away." },
  { title: "Know exactly what to fix", body: "A report with your eye contact, voice and answers, and the lesson that fixes each weak spot." },
];

const sources = ["NPTEL", "SWAYAM", "freeCodeCamp", "MIT OpenCourseWare", "Khan Academy", "CS50", "MDN"];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/home" className="rounded-pill px-4 py-2 font-display font-medium text-peacock-deep hover:bg-mist">
            Sign in
          </Link>
          <LinkButton href="/onboarding" className="hidden sm:inline-flex">
            Start free
          </LinkButton>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="animate-rise">
          <h1 className="display-wide text-[2.6rem] leading-[1.02] text-peacock-deep sm:text-[3.4rem] lg:text-[4rem]">
            Your first interview shouldn&apos;t be your first interview.
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.15rem] text-ink-soft">
            Saarathi finds jobs that fit you, teaches what&apos;s missing with free lectures in your language, and lets you practise in a room that feels real. Made for first-time coders across India.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/onboarding" variant="next" className="px-6 py-3 text-[1.08rem]">
              Start with your CV
            </LinkButton>
            <LinkButton href="/interview/room" variant="quiet" className="px-6 py-3 text-[1.08rem]">
              Try the interview room
            </LinkButton>
          </div>
          <p className="mt-5 text-[0.95rem] text-ink-faint">Free and open source. Works in English and Hindi, in any phone or laptop browser.</p>
        </div>
        <RoomWindow />
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="display-narrow max-w-xl text-[2rem] text-ink md:text-[2.4rem]">From CV to offer, one step a day</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-5 md:gap-6">
            <span aria-hidden className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-[3px] rounded-pill bg-marigold/40 md:left-4 md:right-4 md:top-[15px] md:h-[3px] md:w-auto" />
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 md:flex-col md:gap-3">
                <span className="relative z-10 flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full border-[3px] border-marigold bg-paper font-display text-[0.95rem] font-bold text-ink">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-[1.2rem] font-semibold text-peacock-deep">{s.title}</h3>
                  <p className="mt-1 text-[0.98rem] text-ink-soft">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="display-narrow text-[2rem] text-ink">Learning from open resources</h2>
          <p className="mt-3 max-w-md text-ink-soft">
            Every lesson Saarathi suggests is free and links to the original source. Nothing is copied or locked behind a paywall.
          </p>
        </div>
        <ul className="flex flex-wrap content-start gap-2.5">
          {sources.map((s) => (
            <li key={s} className="rounded-pill border border-line bg-paper px-4 py-2 font-display text-[1.05rem] font-medium text-peacock-deep">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <footer className="bg-peacock-deep text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10">
          <Logo light />
          <p className="max-w-md text-[0.95rem] text-paper/75">
            Open source, built in AgentFoundry for Code for a Billion. Feeling overwhelmed? Tele-MANAS is free and confidential: 14416.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Hero illustration: the screen as a window into the interview room.
function RoomWindow() {
  return (
    <figure className="relative">
      <svg viewBox="0 0 520 420" className="w-full" role="img" aria-label="An interviewer at a desk, seen through a window frame">
        <defs>
          <clipPath id="frame">
            <rect x="20" y="20" width="480" height="340" rx="26" />
          </clipPath>
        </defs>
        <rect x="20" y="20" width="480" height="340" rx="26" fill="#DCEBEE" />
        <g clipPath="url(#frame)">
          <path d="M20 250 L500 250 L500 360 L20 360 Z" fill="#CFD9D6" />
          <path d="M100 250 L20 360 M420 250 L500 360" stroke="#B8C7C3" strokeWidth="2" />
          <rect x="300" y="60" width="140" height="110" rx="6" fill="#F4F6F5" />
          <path d="M370 60v110M300 115h140" stroke="#CFD9D6" strokeWidth="4" />
          <rect x="64" y="96" width="70" height="130" rx="4" fill="#0A3F4C" opacity="0.85" />
          <rect x="74" y="110" width="50" height="10" fill="#E9A23B" />
          <rect x="74" y="130" width="38" height="10" fill="#F4F6F5" />
          <rect x="74" y="150" width="46" height="10" fill="#DCEBEE" />
          {/* interviewer */}
          <ellipse cx="250" cy="150" rx="34" ry="38" fill="#8C5A3C" />
          <path d="M214 140c0-30 20-44 38-44s38 14 38 44c-10-12-22-18-38-18s-28 6-38 18z" fill="#14212B" />
          <circle cx="238" cy="152" r="3.5" fill="#14212B" />
          <circle cx="262" cy="152" r="3.5" fill="#14212B" />
          <path d="M240 170q10 7 20 0" stroke="#14212B" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M188 250c4-44 30-64 62-64s58 20 62 64z" fill="#0F5C6E" />
          <rect x="120" y="236" width="260" height="22" rx="4" fill="#4A5A64" />
          <rect x="140" y="258" width="14" height="100" fill="#4A5A64" />
          <rect x="346" y="258" width="14" height="100" fill="#4A5A64" />
          <rect x="300" y="222" width="46" height="14" rx="2" fill="#F4F6F5" />
        </g>
        <rect x="20" y="20" width="480" height="340" rx="26" fill="none" stroke="#0A3F4C" strokeWidth="10" />
        {/* head-movement hint */}
        <g transform="translate(260 395)">
          <path d="M-70 0h140" stroke="#E9A23B" strokeWidth="3" strokeLinecap="round" />
          <path d="M-70 0l10-7M-70 0l10 7M70 0l-10-7M70 0l-10 7" stroke="#E9A23B" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
      <figcaption className="mt-1 text-center text-[0.95rem] text-ink-soft">Lean left or right. The room moves with you, like a real window.</figcaption>
    </figure>
  );
}
