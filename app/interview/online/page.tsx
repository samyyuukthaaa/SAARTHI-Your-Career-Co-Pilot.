"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { InterviewerFace } from "@/components/interview/InterviewerFace";
import { Controls, EyeContactBadge } from "@/components/interview/Controls";
import { fmt, useInterviewSession, type Round } from "@/components/interview/useInterviewSession";
import { useTracking } from "@/lib/tracking/useTracking";

export default function OnlinePage() {
  return (
    <Suspense>
      <OnlineInterview />
    </Suspense>
  );
}

function OnlineInterview() {
  const router = useRouter();
  const round = (useSearchParams().get("round") as Round) || "hr";
  const s = useInterviewSession(round === "technical" ? "technical" : "hr", "online");
  const track = useTracking({ enabled: true });
  const ready = track.status === "ready";

  const { phase, recordEye } = s;
  useEffect(() => {
    if (phase === "answering" && ready) recordEye(track.snapshot);
  }, [track.snapshot, phase, ready, recordEye]);

  const joined = s.phase !== "waiting" && s.phase !== "connecting";
  const toReport = async () => {
    const id = await s.finish();
    router.push(id ? `/report/${id}` : "/interview");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0B2A33] text-paper">
      <header className="flex items-center justify-between px-5 py-3">
        <Logo light tagline={false} />
        <p className="text-[0.95rem] text-paper/75">
          {round === "technical" ? "Technical round" : "HR round"}
          {joined && <> · {fmt(s.elapsed)} · question {s.index + 1} of {s.total}</>}
        </p>
      </header>

      {/* One <video> element for the whole session: the tracker is bound to it. */}
      <main className={joined ? "flex flex-1 flex-col gap-4 px-4 pb-6" : "mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 py-8 md:grid-cols-[1.3fr_1fr]"}>
        <div className={joined ? "relative grid flex-1 gap-4 md:grid-cols-[1fr_300px]" : "contents"}>
          {joined && (
            <div className="relative overflow-hidden rounded-[20px] bg-[#1D4C58]">
              <InterviewerFace speaking={s.speaking} className="h-full max-h-[70vh] w-full" />
              <span className="absolute bottom-3 left-3 rounded-pill bg-ink/60 px-3 py-1 text-[0.9rem]">Kavya Rao · HR Manager</span>
            </div>
          )}
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-ink md:aspect-auto md:min-h-[200px]">
            <video ref={track.videoRef} className="h-full w-full -scale-x-100 object-cover" playsInline muted />
            {!ready && <CameraNote status={track.status} />}
            {joined && <span className="absolute left-3 top-3"><EyeContactBadge on={track.snapshot.eyeContact} ready={ready} /></span>}
            {s.phase === "answering" && <span className="absolute bottom-3 right-3 rounded-pill bg-ink/60 px-3 py-1 text-[0.85rem]">Answer {fmt(s.answerTime)}</span>}
          </div>
        </div>

        {!joined ? (
          <div>
            <h1 className="display-wide text-[2rem]">Kavya Rao will join shortly</h1>
            <p className="mt-2 text-paper/75">HR Manager. Sit where your face is well lit, and look at her face on screen, not at yourself.</p>
            <Button variant="next" className="mt-6 px-7 py-3" onClick={s.start} disabled={s.phase === "connecting"}>
              {s.phase === "connecting" ? "Connecting…" : "Join interview"}
            </Button>
            {s.error && <p className="mt-3 text-marigold" role="alert">{s.error}</p>}
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-3xl text-center" aria-live="polite">
              <p className="text-[1.15rem] leading-snug">{s.caption}</p>
              {s.phase === "answering" && s.heard && <p className="mx-auto mt-2 max-w-2xl text-[0.95rem] italic text-paper/60">{s.heard}</p>}
              {s.hint && <p className="mx-auto mt-3 max-w-2xl rounded-tile bg-marigold px-4 py-2.5 text-left text-ink">{s.hint}</p>}
            </div>
            <Controls canAnswer={s.phase === "answering"} onNext={s.next} onHelp={s.help} onEnd={toReport} />
            {s.phase === "done" && (
              <div className="text-center">
                <Button variant="next" onClick={toReport}>See your report</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CameraNote({ status }: { status: string }) {
  const text =
    status === "loading"
      ? "Starting camera and face tracking…"
      : status === "denied"
      ? "Camera blocked. Allow camera access in your browser's address bar to get eye-contact feedback, or continue without it."
      : status === "no-camera"
      ? "No camera found. You can still practise; eye-contact feedback will be off."
      : status === "error"
      ? "Face tracking couldn't load. Check your internet connection and reload."
      : "";
  return <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-paper/80">{text}</p>;
}
