"use client";
import clsx from "clsx";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, LinkButton, Loading, PageTitle } from "@/components/ui";
import { api, useLoad, type QuizResult } from "@/lib/api";

// Short check after a lesson. The Prep planner agent writes the questions; the score feeds
// back into job matching and which lessons the Learning curator picks next.
export default function QuizPage() {
  const { skill } = useParams<{ skill: string }>();
  const { data: quiz, error } = useLoad(() => api.quiz(skill), [skill]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  if (!quiz) return <Loading error={error} label="Writing your quiz" />;
  const all = quiz.questions.every((q) => answers[q.id] !== undefined);
  const check = (id: string) => result?.results.find((r) => r.id === id);

  const submit = async () => {
    setSending(true);
    setSendError("");
    try {
      setResult(await api.gradeQuiz(skill, answers));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageTitle title={`Quiz: ${quiz.label}`} sub={`${quiz.questions.length} questions. No timer, no penalty: this only decides what to show you next.`} />

      {result && (
        <div className={clsx("mb-8 rounded-[20px] p-6", result.score >= 60 ? "bg-leaf-wash" : "bg-marigold-wash")} role="status">
          <p className="display-narrow text-[3rem] leading-none text-peacock-deep">{result.score}%</p>
          <p className="mt-2 text-[1.05rem]">{result.next}</p>
          <LinkButton href="/learn" variant="quiet" className="mt-4">Back to lessons</LinkButton>
        </div>
      )}

      <ol className="space-y-10">
        {quiz.questions.map((q, n) => {
          const c = check(q.id);
          return (
            <li key={q.id}>
              <p className="font-display text-[1.2rem] font-semibold">
                {n + 1}. {q.q}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`Question ${n + 1}`}>
                {q.options.map((o, i) => {
                  const picked = answers[q.id] === i;
                  const right = c && c.answer === i;
                  const wrong = c && picked && !c.correct;
                  return (
                    <button
                      key={o}
                      role="radio"
                      aria-checked={picked}
                      disabled={!!result}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={clsx(
                        "rounded-tile px-4 py-3 text-left ring-1 ring-inset transition-colors",
                        right ? "bg-leaf-wash font-semibold text-leaf ring-leaf" : wrong ? "bg-brick-wash text-brick ring-brick" : picked ? "bg-peacock-wash font-semibold text-peacock-deep ring-peacock" : "bg-paper ring-line hover:ring-peacock/60"
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-10 flex items-center gap-4">
          <Button onClick={submit} disabled={!all || sending}>{sending ? "Checking…" : "Check my answers"}</Button>
          {!all && <span className="text-ink-soft">Answer every question to check.</span>}
        </div>
      )}
      {sendError && <p className="mt-3 text-brick" role="alert">{sendError}</p>}
    </>
  );
}
