"use client";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, Chip } from "@/components/ui";
import { api } from "@/lib/api";

const languages = ["English", "हिंदी Hindi", "తెలుగు Telugu", "தமிழ் Tamil"];

// Sample of the 10-minute test: RIASEC interests + Mini-IPIP personality + situational questions.
const testItems = [
  { q: "I enjoy fixing something until it works exactly right.", kind: "Interest" },
  { q: "I feel comfortable explaining my ideas to a group.", kind: "Personality" },
  { q: "Your teammate missed a deadline the night before a demo. What do you do first?", kind: "Situation", options: ["Finish their part myself", "Call them to understand what happened", "Tell the mentor right away", "Cut the feature from the demo"] },
];
const scale = ["Not like me", "A little", "Somewhat", "Mostly", "Very much like me"];

type Parsed = { skills: string[]; projects: number; education: string };

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [langs, setLangs] = useState<string[]>(["English", "हिंदी Hindi"]);
  const [minutes, setMinutes] = useState(90);
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const input = useRef<HTMLInputElement>(null);

  const steps = ["Your CV", "Language and time", "Quick test"];

  const readCv = async (f: File) => {
    if (f.type !== "application/pdf") return setError("Upload your CV as a PDF. You can export one from Word or Google Docs.");
    if (f.size > 5 * 1024 * 1024) return setError("That file is over 5 MB. Export a smaller PDF and try again.");
    setError("");
    setFile(f);
    setParsing(true);
    try {
      setParsed(await api.uploadCv(f));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20">
        <ol className="mb-10 flex gap-2" aria-label="Setup steps">
          {steps.map((s, i) => (
            <li key={s} className="flex-1">
              <span className={clsx("block h-1.5 rounded-pill", i <= step ? "bg-marigold" : "bg-mist")} />
              <span className={clsx("mt-2 block text-[0.9rem]", i === step ? "font-semibold text-ink" : "text-ink-faint")}>
                {i + 1}. {s}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section className="animate-rise">
            <h1 className="display-wide text-[2.2rem] text-peacock-deep">Start with your CV</h1>
            <p className="mt-2 max-w-lg text-ink-soft">Saarathi reads your skills, projects and education. Nothing is shared with employers.</p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) readCv(f);
              }}
              className="mt-8 rounded-[20px] border-2 border-dashed border-line bg-paper p-10 text-center"
            >
              {parsing ? (
                <p className="flex items-center justify-center gap-2 text-peacock-deep">
                  <Loader2 className="h-5 w-5 animate-spin" /> Reading {file?.name}…
                </p>
              ) : parsed ? (
                <div className="text-left">
                  <p className="font-display text-[1.2rem] font-semibold text-leaf">Got it. Here&apos;s what we found:</p>
                  <p className="mt-3 text-ink-soft">{parsed.education} · {parsed.projects} projects</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsed.skills.map((s) => (
                      <Chip key={s} tone="peacock">{s}</Chip>
                    ))}
                  </div>
                  <button onClick={() => input.current?.click()} className="mt-4 text-[0.95rem] font-medium text-peacock underline underline-offset-4">
                    Upload a different CV
                  </button>
                </div>
              ) : (
                <>
                  <FileUp className="mx-auto h-10 w-10 text-peacock" aria-hidden />
                  <p className="mt-3 font-display text-[1.15rem] font-semibold">Drop your CV here</p>
                  <p className="text-ink-soft">PDF, up to 5 MB</p>
                  <Button variant="quiet" className="mt-5" onClick={() => input.current?.click()}>
                    Choose file
                  </Button>
                </>
              )}
              <input ref={input} type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && readCv(e.target.files[0])} />
            </div>
            {error && <p className="mt-3 text-brick" role="alert">{error}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => setStep(1)} disabled={!parsed}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>I don&apos;t have a CV yet</Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="animate-rise">
            <h1 className="display-wide text-[2.2rem] text-peacock-deep">How do you like to learn?</h1>
            <h2 className="mt-8 font-display text-[1.2rem] font-semibold">Languages you&apos;re comfortable in</h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {languages.map((l) => {
                const on = langs.includes(l);
                return (
                  <button
                    key={l}
                    aria-pressed={on}
                    onClick={() => setLangs(on ? langs.filter((x) => x !== l) : [...langs, l])}
                    className={clsx("rounded-pill px-4 py-2 font-medium ring-1 ring-inset", on ? "bg-peacock text-paper ring-peacock" : "bg-paper text-ink-soft ring-line")}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
            <h2 className="mt-8 font-display text-[1.2rem] font-semibold" id="mins">Time you can give each day</h2>
            <div className="mt-3 flex items-center gap-4">
              <input type="range" min={30} max={240} step={15} value={minutes} onChange={(e) => setMinutes(+e.target.value)} aria-labelledby="mins" className="w-full max-w-sm accent-[#0F5C6E]" />
              <span className="display-narrow text-[1.6rem] text-peacock-deep">{minutes} min</span>
            </div>
            <p className="mt-2 text-ink-soft">Your plan fits inside this. You can change it any time.</p>
            <div className="mt-10 flex gap-3">
              <Button variant="quiet" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)} disabled={langs.length === 0}>Continue</Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="animate-rise" key={q}>
            <p className="text-ink-soft">
              Question {q + 1} of {testItems.length} in this preview · the full test takes about 10 minutes
            </p>
            <h1 className="display-narrow mt-4 max-w-2xl text-[2rem] leading-tight text-ink">{testItems[q].q}</h1>
            <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label="Your answer">
              {(testItems[q].options ?? scale).map((label, i) => (
                <button
                  key={label}
                  role="radio"
                  aria-checked={answers[q] === i}
                  onClick={() => setAnswers({ ...answers, [q]: i })}
                  className={clsx(
                    "rounded-tile px-5 py-3.5 text-left text-[1.05rem] ring-1 ring-inset transition-colors",
                    answers[q] === i ? "bg-peacock-wash font-semibold text-peacock-deep ring-peacock" : "bg-paper ring-line hover:ring-peacock/60"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="mt-4 text-[0.95rem] text-ink-soft underline underline-offset-4">I don&apos;t understand this question</button>
            <div className="mt-8 flex gap-3">
              <Button variant="quiet" onClick={() => (q === 0 ? setStep(1) : setQ(q - 1))}>Back</Button>
              <Button
                variant={q === testItems.length - 1 ? "next" : "primary"}
                disabled={answers[q] === undefined}
                onClick={() => (q < testItems.length - 1 ? setQ(q + 1) : router.push("/home"))}
              >
                {q === testItems.length - 1 ? "See my plan" : "Next question"}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
