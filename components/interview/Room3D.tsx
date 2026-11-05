"use client";
// The in-person interview room. The screen behaves like a window: the camera follows the user's head
// (from lib/tracking), so leaning left shows more of the right wall and leaning in brings the desk closer.
// Without a webcam, the mouse drives the same offset so the room still feels alive.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Live } from "@/lib/tracking/useTracking";

export type RoomPhase = "door" | "walking" | "seated";

type Props = {
  live: MutableRefObject<Live>;
  tracking: boolean;
  phase: RoomPhase;
  speaking: boolean;
  nodKey: number;
};

const SEAT = new THREE.Vector3(0, 1.2, 2.25);
const DOOR = new THREE.Vector3(1.7, 1.62, 4.6);
const FOCUS = new THREE.Vector3(0, 1.38, 0);

const C = {
  wall: "#EAF1EF",
  wallSide: "#D6E2DF",
  floor: "#B9A58E",
  wood: "#7A5A42",
  woodDark: "#5E4432",
  peacock: "#0F5C6E",
  deep: "#0A3F4C",
  skin: "#8C5A3C",
  hair: "#14212B",
  metal: "#4A5A64",
  marigold: "#E9A23B",
  paper: "#F4F6F5",
  leaf: "#3E8E63",
};

function Rig({ live, tracking, phase }: Pick<Props, "live" | "tracking" | "phase">) {
  const { camera, pointer } = useThree();
  const base = useRef(DOOR.clone());
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useRef(FOCUS.clone().add(new THREE.Vector3(0.6, 0, 0)));

  useFrame((_, dt) => {
    // Walk from the door to the chair, then stay seated.
    const goal = phase === "door" ? DOOR : SEAT;
    base.current.lerp(goal, 1 - Math.exp(-dt * (phase === "walking" ? 1.4 : 4)));

    // Head-coupled offset (or mouse fallback).
    const L = live.current;
    const useHead = tracking && L.faceFound;
    const ox = useHead ? L.x * 0.55 : pointer.x * 0.35;
    const oy = useHead ? L.y * 0.3 : pointer.y * 0.18;
    const oz = useHead ? (0.5 - L.z) * 0.9 : 0;
    target.set(base.current.x + ox, base.current.y + oy, base.current.z + oz);
    camera.position.lerp(target, 1 - Math.exp(-dt * 8));

    look.current.lerp(FOCUS, 1 - Math.exp(-dt * 2));
    camera.lookAt(look.current);
  });
  return null;
}

function Interviewer({ speaking, nodKey }: { speaking: boolean; nodKey: number }) {
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);
  const nodStart = useRef(-10);
  const lastNod = useRef(nodKey);
  const { camera } = useThree();
  const tmp = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (nodKey !== lastNod.current) {
      lastNod.current = nodKey;
      nodStart.current = t;
    }
    if (head.current) {
      // Turn gently toward the user, plus a nod after good answers.
      tmp.position.copy(head.current.getWorldPosition(new THREE.Vector3()));
      tmp.lookAt(camera.position);
      const yaw = THREE.MathUtils.clamp(tmp.rotation.y, -0.5, 0.5);
      const sinceNod = t - nodStart.current;
      const nod = sinceNod < 0.9 ? Math.sin((sinceNod / 0.9) * Math.PI * 2) * 0.12 : 0;
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, yaw * 0.6, 0.08);
      head.current.rotation.x = nod + Math.sin(t * 0.7) * 0.015;
    }
    if (mouth.current) mouth.current.scale.y = speaking ? 0.5 + Math.abs(Math.sin(t * 13)) * 1.6 : 0.35;
    if (eyes.current) eyes.current.scale.y = t % 4.2 < 0.12 ? 0.1 : 1;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* chair */}
      <mesh position={[0, 1.0, -0.38]} castShadow>
        <boxGeometry args={[0.62, 0.95, 0.08]} />
        <meshStandardMaterial color={C.metal} roughness={0.7} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.9, -0.12]} castShadow>
        <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
        <meshStandardMaterial color={C.peacock} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.13, 0.06]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.06, 0.13, 3]} />
        <meshStandardMaterial color={C.paper} />
      </mesh>
      {/* arms resting on desk */}
      <mesh position={[-0.2, 0.84, 0.1]} rotation={[1.35, 0, 0.35]} castShadow>
        <capsuleGeometry args={[0.042, 0.28, 6, 12]} />
        <meshStandardMaterial color={C.peacock} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.84, 0.1]} rotation={[1.35, 0, -0.35]} castShadow>
        <capsuleGeometry args={[0.042, 0.28, 6, 12]} />
        <meshStandardMaterial color={C.peacock} roughness={0.8} />
      </mesh>
      {/* neck + head */}
      <mesh position={[0, 1.27, -0.11]}>
        <cylinderGeometry args={[0.05, 0.055, 0.12, 16]} />
        <meshStandardMaterial color={C.skin} />
      </mesh>
      <group ref={head} position={[0, 1.44, -0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.145, 32, 32]} />
          <meshStandardMaterial color={C.skin} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.035, -0.02]} scale={[1.06, 0.95, 1.04]}>
          <sphereGeometry args={[0.145, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={C.hair} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.09, -0.15]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color={C.hair} roughness={0.9} />
        </mesh>
        <group ref={eyes}>
          <mesh position={[-0.05, 0.015, 0.132]}>
            <sphereGeometry args={[0.016, 12, 12]} />
            <meshStandardMaterial color={C.hair} />
          </mesh>
          <mesh position={[0.05, 0.015, 0.132]}>
            <sphereGeometry args={[0.016, 12, 12]} />
            <meshStandardMaterial color={C.hair} />
          </mesh>
        </group>
        <mesh position={[0, 0.052, 0.128]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.13, 0.008, 0.01]} />
          <meshStandardMaterial color={C.hair} />
        </mesh>
        <mesh ref={mouth} position={[0, -0.06, 0.135]}>
          <sphereGeometry args={[0.022, 16, 8]} />
          <meshStandardMaterial color="#5A2E22" />
        </mesh>
        <mesh position={[0, -0.005, 0.145]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#7A4D33" />
        </mesh>
      </group>
    </group>
  );
}

function Desk() {
  return (
    <group position={[0, 0, 0.5]}>
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.06, 0.85]} />
        <meshStandardMaterial color={C.wood} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.4, -0.38]} castShadow>
        <boxGeometry args={[1.84, 0.7, 0.04]} />
        <meshStandardMaterial color={C.woodDark} roughness={0.6} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.38, 0]} castShadow>
          <boxGeometry args={[0.06, 0.76, 0.8]} />
          <meshStandardMaterial color={C.woodDark} />
        </mesh>
      ))}
      {/* laptop */}
      <group position={[0.45, 0.8, -0.05]} rotation={[0, -0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.34, 0.015, 0.24]} />
          <meshStandardMaterial color="#9AA7AC" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.11, -0.12]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.34, 0.22, 0.012]} />
          <meshStandardMaterial color="#9AA7AC" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
      {/* your CV on the desk + pen */}
      <mesh position={[-0.35, 0.795, 0.12]} rotation={[-Math.PI / 2, 0, 0.12]}>
        <planeGeometry args={[0.21, 0.297]} />
        <meshStandardMaterial color={C.paper} />
      </mesh>
      <mesh position={[-0.18, 0.8, 0.14]} rotation={[0, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.15, 8]} />
        <meshStandardMaterial color={C.deep} />
      </mesh>
      {/* nameplate */}
      <mesh position={[0, 0.82, 0.32]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.32, 0.07, 0.02]} />
        <meshStandardMaterial color={C.marigold} />
      </mesh>
      {/* glass of water */}
      <mesh position={[-0.7, 0.85, -0.05]}>
        <cylinderGeometry args={[0.035, 0.03, 0.12, 16]} />
        <meshStandardMaterial color="#CFE3E8" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function RoomShell() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.5]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color={C.floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.6, -1.2]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={C.wall} roughness={0.95} />
      </mesh>
      <mesh position={[-3, 1.6, 1.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={C.wallSide} roughness={0.95} />
      </mesh>
      <mesh position={[3, 1.6, 1.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={C.wallSide} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.2, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#EEF2F1" />
      </mesh>
      {/* window with daylight */}
      <group position={[-1.35, 1.75, -1.19]}>
        <mesh>
          <planeGeometry args={[1.3, 1.1]} />
          <meshStandardMaterial color="#CFE8F0" emissive="#BFE2EE" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.38, 0.05, 0.03]} />
          <meshStandardMaterial color={C.paper} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.05, 1.18, 0.03]} />
          <meshStandardMaterial color={C.paper} />
        </mesh>
      </group>
      {/* bookshelf */}
      <group position={[1.85, 0, -1.0]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.9, 1.9, 0.35]} />
          <meshStandardMaterial color={C.deep} roughness={0.8} />
        </mesh>
        {[0.45, 0.95, 1.45].map((y, row) =>
          [-0.3, -0.18, -0.05, 0.1, 0.24].map((x, i) => (
            <mesh key={`${row}-${i}`} position={[x, y + 0.13, 0.08]}>
              <boxGeometry args={[0.1, 0.26 - ((i + row) % 3) * 0.04, 0.22]} />
              <meshStandardMaterial color={[C.marigold, C.paper, C.leaf, "#DCEBEE", "#B4473A"][(i + row) % 5]} />
            </mesh>
          ))
        )}
      </group>
      {/* plant */}
      <group position={[-2.2, 0, -0.6]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.44, 20]} />
          <meshStandardMaterial color="#C7B9A6" />
        </mesh>
        {[
          [0, 0.75, 0, 0.28],
          [0.15, 0.95, 0.05, 0.2],
          [-0.12, 1.05, -0.05, 0.22],
          [0.02, 1.25, 0.02, 0.16],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial color={C.leaf} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* wall clock */}
      <mesh position={[0.6, 2.35, -1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 32]} />
        <meshStandardMaterial color={C.paper} />
      </mesh>
    </group>
  );
}

export default function Room3D({ live, tracking, phase, speaking, nodKey }: Props) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 50, near: 0.05, far: 30, position: DOOR.toArray() }} gl={{ antialias: true }}>
      <color attach="background" args={["#DCE6E4"]} />
      <hemisphereLight args={["#F7FBFA", "#B9A58E", 1.0]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-2.5, 4, 1.5]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0.5, 2.6, 1.5]} intensity={6} distance={6} color="#FFE6C2" />
      <RoomShell />
      <Desk />
      <Interviewer speaking={speaking} nodKey={nodKey} />
      <Rig live={live} tracking={tracking} phase={phase} />
    </Canvas>
  );
}
