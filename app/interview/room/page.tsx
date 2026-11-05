"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, DoorOpen, MousePointer2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { Controls, EyeContactBadge } from "@/components/interview/Controls";
import { fmt, useInterviewSession, type Round } from "@/components/interview/useInterviewSession";
import { useTracking } from "@/lib/tracking/useTracking";
import type { RoomPhase } from "@/components/interview/Room3D";

const Room3D = dynamic(() => import("@/components/interview/Room3D"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-ink-soft">Setting up the room…</div>,
});

type Stage = "setup" | "door" | "walking" | "calibrate" | "interview";

export default function RoomPage() {
  return (
    <Suspense>
      <InPersonInterview />
    </Suspense>
  );
}

function InPersonInterview() {
  const router = useRouter();
  const round = (useSearchParams().get("round") as Round) === "technical" ? "technical" : "hr";
  const [stage, setStage] = useState<Stage>("setup");
  const [camOn, setCamOn] = useState(false);
  const [calMsg, setCalMsg] = useState("");
  const [nodKey, setNodKey] = useState(0);
  const track = useTracking({ enabled: camOn });
  const s = useInterviewSession(round);
  const ready = track.status === "ready";
  const away = useRef({ since: 0, reacted: -1 });

  const phase: RoomPhase = stage === "setup" || stage === "door" ? "door" : stage === "walking" ? "walking" : "seated";

  const knock = () => {
    setStage("walking");
    s.say("Come in, please. Have a seat.");
    setTimeout(() => setStage(camOn && ready ? "calibrate" : "interview"), 3200);
  };

  // Start the questions once seated (and calibrated, if the camera is on).
  const { phase: sPhase, start, recordEye, index, say, next } = s;
  useEffect(() => {
    if (stage === "interview" && sPhase === "waiting") start();
  }, [stage, sPhase, start]);

  // Eye-contact sampling and the "are you with me?" reaction.
  useEffect(() => {
    if (sPhase !== "answering" || !ready) return;
    recordEye(track.snapshot.eyeContact);
    const now = performance.now();
    if (track.snapshot.eyeContact || !track.snapshot.faceFound) away.current.since = now;
    else if (now - away.current.since > 4000 && away.current.reacted !== index) {
      away.current.reacted = index;
      say("Are you with me? Take your time, and look up when you're ready.");
    }
  }, [track.snapshot, sPhase, ready, recordEye, index, say]);

  const runCalibration = async () => {
    setCalMsg("Hold still and look into her eyes…");
    const ok = await track.calibrate(2000);
    if (ok) {
      setCalMsg("");
      setStage("interview");
    } else setCalMsg("We couldn't see your face clearly. Move closer to the light and try again.");
  };

  const finishAnswer = () => {
    setNodKey((k) => k + 1);
    next();
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#DCE6E4]">
      <div className="absolute inset-0">
        <Room3D live={track.live} tracking={camOn && ready} phase={phase} speaking={s.speaking} nodKey={nodKey} />
      </div>

      {/* top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link href="/interview" className="pointer-events-auto rounded-pill bg-paper/85 px-3 py-1.5 backdrop-blur">
          <Logo tagline={false} />
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          {stage === "interview" && (
            <span className="rounded-pill bg-paper/85 px-3 py-1.5 text-[0.95rem] text-ink backdrop-blur">
              {fmt(s.elapsed)} · question {s.index + 1} of {s.total}
            </span>
          )}
          {camOn && <EyeContactBadge on={track.snapshot.eyeContact} ready={ready} />}
        </div>
      </header>

      {/* tracking preview (the tracker needs a live <video>) */}
      <div className={camOn ? "absolute bottom-4 left-4 h-24 w-32 overflow-hidden rounded-tile ring-2 ring-paper md:h-28 md:w-40" : "pointer-events-none absolute h-px w-px opacity-0"}>
        <video ref={track.videoRef} className="h-full w-full -scale-x-100 object-cover" playsInline muted />
      </div>

      {stage === "setup" && (
        <Overlay>
          <h1 className="display-wide text-[1.9rem] text-peacock-deep">Before you walk in</h1>
          <p className="mt-2 text-ink-soft">
            With your camera on, the room moves as you move your head, and Saarathi measures eye contact and posture. Video stays on your device.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="next"
              onClick={() => {
                setCamOn(true);
                setStage("door");
              }}
            >
              <Camera className="h-5 w-5" aria-hidden /> Use my camera
            </Button>
            <Button variant="quiet" onClick={() => setStage("door")}>
              <MousePointer2 className="h-5 w-5" aria-hidden /> Continue without camera
            </Button>
          </div>
          <p className="mt-4 text-[0.9rem] text-ink-faint">Best on a laptop. Sit about an arm&apos;s length from the screen.</p>
        </Overlay>
      )}

      {stage === "door" && (
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-4">
          {camOn && track.status !== "ready" && <p className="rounded-pill bg-paper/90 px-4 py-2 text-ink">{statusText(track.status)}</p>}
          {camOn && ready && <p className="rounded-pill bg-paper/90 px-4 py-2 text-ink">Try leaning left and right. The room follows you.</p>}
          <Button variant="next" className="px-7 py-3 text-[1.1rem]" onClick={knock}>
            <DoorOpen className="h-5 w-5" aria-hidden /> Knock and walk in
          </Button>
        </div>
      )}

      {stage === "calibrate" && (
        <Overlay>
          <h2 className="display-wide text-[1.7rem] text-peacock-deep">Look into her eyes</h2>
          <p className="mt-2 text-ink-soft">Two seconds of calibration so Saarathi knows what eye contact looks like from where your camera sits.</p>
          {calMsg && <p className="mt-3 font-medium text-peacock-deep" role="status">{calMsg}</p>}
          <div className="mt-5 flex gap-3">
            <Button onClick={runCalibration}>Calibrate</Button>
            <Button variant="ghost" onClick={() => setStage("interview")}>Skip</Button>
          </div>
        </Overlay>
      )}

      {stage === "interview" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/55 to-transparent px-4 pb-6 pt-16 text-paper">
          <div className="mx-auto max-w-3xl text-center" aria-live="polite">
            <p className="text-[1.15rem] leading-snug">{s.caption}</p>
            {s.hint && <p className="mx-auto mt-3 max-w-2xl rounded-tile bg-marigold px-4 py-2.5 text-left text-ink">{s.hint}</p>}
          </div>
          <div className="mt-4">
            {s.phase === "done" ? (
              <div className="text-center">
                <Button variant="next" onClick={() => router.push("/report/demo")}>See your report</Button>
              </div>
            ) : (
              <Controls canAnswer={s.phase === "answering"} onNext={finishAnswer} onHelp={s.help} onEnd={() => router.push("/report/demo")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-end justify-center bg-ink/25 p-4 md:items-center">
      <div className="w-full max-w-lg animate-rise rounded-[22px] bg-paper p-6 shadow-[0_20px_60px_rgba(20,33,43,0.25)] md:p-8">{children}</div>
    </div>
  );
}

function statusText(s: string) {
  if (s === "loading") return "Starting camera and face tracking…";
  if (s === "denied") return "Camera blocked. The room will follow your mouse instead.";
  if (s === "no-camera") return "No camera found. The room will follow your mouse instead.";
  if (s === "error") return "Face tracking couldn't load. The room will follow your mouse instead.";
  return "";
}
