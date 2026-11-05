"use client";
// Webcam head + eye tracking with MediaPipe Face Landmarker, entirely in the browser.
// Video frames never leave the device; only the numbers in `live` are sent to the backend.
import { useCallback, useEffect, useRef, useState } from "react";
import { OneEuro } from "./oneEuro";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type TrackStatus = "idle" | "loading" | "ready" | "denied" | "no-camera" | "error";

export type Live = {
  faceFound: boolean;
  x: number; // head position, -1 (left) … 1 (right), mirrored like a selfie view
  y: number; // -1 (down) … 1 (up)
  z: number; // 0 (far) … 1 (close), from iris spacing
  yaw: number; // radians, turning left/right
  pitch: number; // radians, nodding up/down
  lookX: number; // combined head + eye direction, calibrated so 0 = interviewer's eyes
  lookY: number;
  eyeContact: boolean;
  slouch: boolean;
};

const blank: Live = { faceFound: false, x: 0, y: 0, z: 0.5, yaw: 0, pitch: 0, lookX: 0, lookY: 0, eyeContact: false, slouch: false };

type Options = { enabled: boolean; eyeContactThreshold?: number; targetFps?: number };

export function useTracking({ enabled, eyeContactThreshold = 0.2, targetFps = 20 }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const live = useRef<Live>({ ...blank }); // read every frame by the 3D scene (no re-render)
  const [snapshot, setSnapshot] = useState<Live>({ ...blank }); // ~5 Hz copy for the UI
  const [status, setStatus] = useState<TrackStatus>("idle");
  const [fps, setFps] = useState(0);
  const baseline = useRef({ lookX: 0, lookY: 0, y: 0, z: 0.5 });
  const raw = useRef({ lookX: 0, lookY: 0 });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let landmarker: import("@mediapipe/tasks-vision").FaceLandmarker | null = null;
    const filters = { x: new OneEuro(1.2, 0.03), y: new OneEuro(1.2, 0.03), z: new OneEuro(0.8, 0.02), lx: new OneEuro(1.5, 0.05), ly: new OneEuro(1.5, 0.05) };

    (async () => {
      setStatus("loading");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
      } catch (e) {
        const name = (e as DOMException)?.name;
        setStatus(name === "NotAllowedError" ? "denied" : "no-camera");
        return;
      }
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const files = await FilesetResolver.forVisionTasks(WASM);
        landmarker = await FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });
      } catch {
        setStatus("error");
        return;
      }
      if (cancelled) return;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      setStatus("ready");

      const minGap = 1000 / targetFps;
      let lastRun = 0;
      let lastUi = 0;
      let frames = 0;
      let fpsWindow = performance.now();

      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (now - lastRun < minGap || video.readyState < 2 || !landmarker) return;
        lastRun = now;
        const res = landmarker.detectForVideo(video, now);
        frames++;
        if (now - fpsWindow > 1000) {
          setFps(frames);
          frames = 0;
          fpsWindow = now;
        }
        const pts = res.faceLandmarks?.[0];
        const L = live.current;
        if (!pts) {
          L.faceFound = false;
          L.eyeContact = false;
        } else {
          L.faceFound = true;
          // Head position from the nose tip (landmark 1), mirrored.
          const nx = (0.5 - pts[1].x) * 2;
          const ny = (0.5 - pts[1].y) * 2;
          // Depth from distance between iris centres (468, 473): closer face = wider spacing.
          const iris = Math.hypot(pts[468].x - pts[473].x, pts[468].y - pts[473].y);
          const nz = Math.min(Math.max((iris - 0.06) / 0.12, 0), 1);
          L.x = filters.x.filter(nx, now);
          L.y = filters.y.filter(ny, now);
          L.z = filters.z.filter(nz, now);

          // Head rotation from the facial transformation matrix (column-major 4x4).
          const m = res.facialTransformationMatrixes?.[0]?.data;
          if (m) {
            L.yaw = Math.atan2(m[8], m[10]);
            L.pitch = Math.asin(Math.max(-1, Math.min(1, -m[9])));
          }
          // Eye direction from blendshapes; combine with head rotation for gaze.
          const b = Object.fromEntries((res.faceBlendshapes?.[0]?.categories ?? []).map((c) => [c.categoryName, c.score]));
          const eyeX = ((b.eyeLookOutLeft ?? 0) - (b.eyeLookInLeft ?? 0) + (b.eyeLookInRight ?? 0) - (b.eyeLookOutRight ?? 0)) / 2;
          const eyeY = ((b.eyeLookUpLeft ?? 0) + (b.eyeLookUpRight ?? 0) - (b.eyeLookDownLeft ?? 0) - (b.eyeLookDownRight ?? 0)) / 2;
          raw.current.lookX = -L.yaw * 1.6 + eyeX;
          raw.current.lookY = L.pitch * 1.6 + eyeY;
          L.lookX = filters.lx.filter(raw.current.lookX - baseline.current.lookX, now);
          L.lookY = filters.ly.filter(raw.current.lookY - baseline.current.lookY, now);
          L.eyeContact = Math.abs(L.lookX) < eyeContactThreshold && Math.abs(L.lookY) < eyeContactThreshold;
          // Rough slouch proxy until Pose Landmarker is added: head sinks and moves away vs. calibration.
          L.slouch = L.y < baseline.current.y - 0.25 && L.z < baseline.current.z - 0.08;
        }
        if (now - lastUi > 200) {
          lastUi = now;
          setSnapshot({ ...L });
        }
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
    };
  }, [enabled, eyeContactThreshold, targetFps]);

  // Average 2 seconds of gaze while the user looks into the interviewer's eyes.
  const calibrate = useCallback(async (ms = 2000) => {
    const samples: { lookX: number; lookY: number; y: number; z: number }[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (live.current.faceFound) samples.push({ ...raw.current, y: live.current.y, z: live.current.z });
        if (performance.now() - start < ms) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    if (samples.length < 10) return false;
    const avg = (k: keyof (typeof samples)[number]) => samples.reduce((s, v) => s + v[k], 0) / samples.length;
    baseline.current = { lookX: avg("lookX"), lookY: avg("lookY"), y: avg("y"), z: avg("z") };
    return true;
  }, []);

  return { videoRef, live, snapshot, status, fps, calibrate };
}
