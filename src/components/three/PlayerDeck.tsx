"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, PresentationControls, RoundedBox } from "@react-three/drei";
import { easing } from "maath";
import { ExtrudeGeometry, Group, Path, Shape } from "three";
import type { CassetteDesign, Side } from "@/lib/mixtape";
import { drawDeckFace, drawDoor, drawKey, drawLcd } from "@/lib/draw";
import { useFontsReady } from "@/lib/useFontsReady";
import { CW, Cassette3D } from "./Cassette3D";
import { useCanvasTexture } from "./useCanvasTexture";
import { FitCamera, StudioLights } from "./StageBits";

/* Deck geometry, in scene units. U mirrors the design's 1cqw of the player width. */
const DW = 4.4;
const DH = 3.8;
const U = DW / 100;
const FD = 0.5; // depth of the front plate (= depth of the tape well)
const BD = 1.5; // body behind the plate
const WELL = { x: -DW / 2 + 4 * U, w: DW - 8 * U, top: DH / 2 - 0.24 * DH, bottom: -DH / 2 + 0.04 * DH };
const WELL_H = WELL.top - WELL.bottom;
const HINGE_Y = WELL.bottom;

/* Cassette poses */
const K = (DW * 0.84) / CW; // cassette scale when seated
const SEAT = { y: DH / 2 - 0.3 * DH - (CW * (204 / 320) * K) / 2 + 0.02, z: -FD / 2 + 0.03 };
const UP = { y: DH / 2 + 2.1, z: 1.1, rx: 0.18, rz: (6 * Math.PI) / 180, s: 0.85 * K };
const DOOR_OPEN = 0.5;

export interface DeckKey {
  name: string;
  label: string;
  onClick: () => void;
  down?: boolean;
}

interface Props {
  design: CassetteDesign;
  title: string;
  side: Side;
  inserted: boolean;
  playing: boolean;
  /** Seconds the insert/eject motion takes. */
  speed: number;
  keys: DeckKey[];
  lcdTop: string;
  lcdBottom: string;
  onTapeClick: () => void;
  className?: string;
}

export default function PlayerDeck(props: Props) {
  return (
    <div className={props.className} style={{ touchAction: "pan-y" }}>
      <Canvas flat shadows="percentage" dpr={[1, 2]} camera={{ fov: 30, position: [0, 1, 16] }} gl={{ antialias: true, alpha: true }}>
        <FitCamera w={DW + 0.6} h={DH + 3.6} margin={1.08} y={1.6} lookY={0} />
        <StudioLights />
        <PresentationControls
          global
          cursor={false}
          snap
          speed={1.2}
          polar={[-0.25, 0.35]}
          azimuth={[-0.7, 0.7]}
          rotation={[0.06, -0.22, 0]}
        >
          <group position={[0, -1.55, 0]}>
            <Deck {...props} />
          </group>
        </PresentationControls>
        <ContactShadows position={[0, -1.55 - DH / 2 - 0.01, 0]} opacity={0.4} scale={12} blur={2.4} far={3} color="#272727" />
      </Canvas>
    </div>
  );
}

const ease = {
  outBack: (t: number) => {
    const c1 = 1.1,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Deck({ design, title, side, inserted, playing, speed, keys, lcdTop, lcdBottom, onTapeClick }: Props) {
  const fonts = useFontsReady();
  const body = useRef<Group>(null);
  const door = useRef<Group>(null);
  const tape = useRef<Group>(null);
  const flip = useRef(side === "A" ? 0 : Math.PI);
  const p = useRef(inserted ? 1 : 0);
  const landedAt = useRef<number | null>(null);

  const faceTex = useCanvasTexture(1760, 1520, drawDeckFace, [fonts]);
  const lcdTex = useCanvasTexture(1080, 190, (c) => drawLcd(c, lcdTop, lcdBottom, inserted), [lcdTop, lcdBottom, inserted, fonts]);
  const doorTex = useCanvasTexture(1472, Math.round(1472 * (WELL_H / WELL.w)), drawDoor, [fonts]);

  const plate = useMemo(() => {
    const s = roundedRect(new Shape(), -DW / 2, -DH / 2, DW, DH, 4 * U, 3 * U);
    s.holes.push(roundedRect(new Path(), WELL.x, WELL.bottom, WELL.w, WELL_H, 2 * U, 2 * U));
    const g = new ExtrudeGeometry(s, {
      depth: FD,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 3,
      curveSegments: 24,
    });
    return g;
  }, []);
  useMemo(() => {
    faceTex.repeat.set(1 / DW, 1 / DH);
    faceTex.offset.set(0.5, 0.5);
  }, [faceTex]);

  useFrame(({ clock }, dt) => {
    dt = Math.min(dt, 0.1);
    const t = clock.getElapsedTime();
    const was = p.current;
    const target = inserted ? 1 : 0;
    const step = dt / Math.max(0.2, speed);
    p.current = target > p.current ? Math.min(1, p.current + step) : Math.max(0, p.current - step);
    if (was < 1 && p.current === 1) landedAt.current = t;

    const travel = clamp01(p.current / 0.62);
    const close = clamp01((p.current - 0.62) / 0.38);
    const theta = DOOR_OPEN * (1 - ease.inOut(close));
    if (door.current) door.current.rotation.x = theta;

    // seated pose follows the door (cassette rides in the door's holder)
    const ly = SEAT.y - HINGE_Y,
      lz = SEAT.z;
    const sy = HINGE_Y + ly * Math.cos(theta) - lz * Math.sin(theta);
    const sz = ly * Math.sin(theta) + lz * Math.cos(theta);

    const k = inserted ? ease.outBack(travel) : ease.inOut(travel);
    const bob = (1 - travel) * Math.sin(t * 1.8) * 0.08;
    easing.damp(flip, "current", side === "A" ? 0 : Math.PI, 0.25, dt);
    if (tape.current) {
      tape.current.position.set(0, lerp(UP.y, sy, k) + bob, lerp(UP.z, sz, k));
      tape.current.rotation.set(lerp(UP.rx, theta, k), flip.current + (1 - k) * Math.sin(t * 0.9) * 0.15, lerp(UP.rz, 0, k));
      tape.current.scale.setScalar(lerp(UP.s, K, k));
    }

    // clunk when the door shuts
    if (body.current) {
      const since = landedAt.current === null ? 9 : t - landedAt.current;
      const c = since < 0.34 ? Math.sin((since / 0.34) * Math.PI) * Math.exp(-since * 6) : 0;
      body.current.position.y = -c * 0.09;
    }
  });

  const hover = (on: boolean) => () => {
    document.body.style.cursor = on ? "pointer" : "";
  };

  return (
    <group ref={body}>
      {/* front plate with the well cut out */}
      <mesh geometry={plate} position={[0, 0, -FD]} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" map={faceTex} roughness={0.5} metalness={0.15} />
        <meshStandardMaterial attach="material-1" color="#2f2f31" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* body */}
      <RoundedBox args={[DW, DH, BD]} radius={0.14} smoothness={4} position={[0, 0, -FD - BD / 2 + 0.03]} castShadow>
        <meshStandardMaterial color="#3B3B3D" roughness={0.55} metalness={0.15} />
      </RoundedBox>
      {/* well floor */}
      <mesh position={[0, (WELL.top + WELL.bottom) / 2, -FD + 0.04]}>
        <planeGeometry args={[WELL.w, WELL_H]} />
        <meshStandardMaterial color="#1C1C1D" roughness={0.9} />
      </mesh>
      {/* LCD */}
      <mesh position={[-DW / 2 + 0.32 * DW, DH / 2 - 0.1 * DH, 0.03]}>
        <planeGeometry args={[0.54 * DW, 0.11 * DH]} />
        <meshStandardMaterial
          map={lcdTex}
          emissive="#FFE394"
          emissiveMap={lcdTex}
          emissiveIntensity={inserted ? 0.35 : 0.08}
          roughness={0.3}
        />
      </mesh>
      {/* carry handle */}
      <Handle />
      {/* piano keys */}
      {keys.map((k, i) => (
        <PianoKey key={k.name} index={i} def={k} fonts={fonts} />
      ))}
      {/* door, hinged at the bottom of the well */}
      <group ref={door} position={[0, HINGE_Y, 0.015]}>
        <mesh position={[0, WELL_H / 2, 0]} renderOrder={2}>
          <planeGeometry args={[WELL.w, WELL_H]} />
          <meshStandardMaterial map={doorTex} transparent depthWrite={false} roughness={0.4} />
        </mesh>
        <mesh position={[0, WELL_H / 2, 0.006]} renderOrder={3}>
          <planeGeometry args={[WELL.w, WELL_H]} />
          <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} depthWrite={false} />
        </mesh>
      </group>
      {/* the tape */}
      <group
        ref={tape}
        onClick={(e) => {
          e.stopPropagation();
          if (!inserted) onTapeClick();
        }}
        onPointerOver={inserted ? undefined : hover(true)}
        onPointerOut={hover(false)}
      >
        <Cassette3D design={design} title={title} spinning={playing} speed={2} />
      </group>
    </group>
  );
}

function PianoKey({ index, def, fonts }: { index: number; def: DeckKey; fonts: boolean }) {
  const g = useRef<Group>(null);
  const tapped = useRef(false);
  const pressedAt = useRef(-1);
  const w = 8.6 * U,
    h = 7 * U,
    d = 0.42;
  const play = def.name === "Play";
  const tex = useCanvasTexture(256, 208, (c) => drawKey(c, def.label, play), [def.label, play, fonts]);
  const x = -DW / 2 + 22 * U + index * 9.6 * U + w / 2;
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const now = clock.getElapsedTime();
    if (tapped.current) {
      tapped.current = false;
      pressedAt.current = now;
    }
    const momentary = pressedAt.current >= 0 && now - pressedAt.current < 0.14;
    const down = def.down || momentary;
    easing.damp(g.current.position, "y", DH / 2 + 1.5 * U - (down ? 2 * U : 0), 0.06, dt);
  });
  return (
    <group ref={g} position={[x, DH / 2 + 1.5 * U, -d / 2 - 0.06]}>
      <RoundedBox
        args={[w, h, d]}
        radius={0.025}
        smoothness={3}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          tapped.current = true;
          def.onClick();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <meshStandardMaterial color={play ? "#F48F68" : "#B8B8BA"} roughness={0.35} metalness={play ? 0.05 : 0.6} />
      </RoundedBox>
      <mesh position={[0, 0, d / 2 + 0.002]}>
        <planeGeometry args={[w - 0.02, h - 0.02]} />
        <meshStandardMaterial map={tex} roughness={0.35} metalness={play ? 0 : 0.3} />
      </mesh>
    </group>
  );
}

function Handle() {
  const z = -FD - BD + 0.35;
  const y = DH / 2;
  return (
    <group>
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x, y + 0.2, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.4, 16]} />
          <meshStandardMaterial color="#C4C4C6" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, y + 0.42, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.07, 3.4, 8, 16]} />
        <meshStandardMaterial color="#C4C4C6" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

function roundedRect<T extends Path>(p: T, x: number, y: number, w: number, h: number, rTop: number, rBot: number): T {
  p.moveTo(x + rBot, y);
  p.lineTo(x + w - rBot, y);
  p.quadraticCurveTo(x + w, y, x + w, y + rBot);
  p.lineTo(x + w, y + h - rTop);
  p.quadraticCurveTo(x + w, y + h, x + w - rTop, y + h);
  p.lineTo(x + rTop, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - rTop);
  p.lineTo(x, y + rBot);
  p.quadraticCurveTo(x, y, x + rBot, y);
  return p;
}
