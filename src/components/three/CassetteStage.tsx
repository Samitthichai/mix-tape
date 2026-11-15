"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, PresentationControls } from "@react-three/drei";
import type { Group } from "three";
import type { CassetteDesign } from "@/lib/mixtape";
import { CH, CW, Cassette3D } from "./Cassette3D";
import { FitCamera, StudioLights } from "./StageBits";

interface Props {
  design: CassetteDesign;
  title: string;
  spinning?: boolean;
  speed?: number;
  /** In-plane tilt in degrees (clockwise, like CSS rotate). */
  tilt?: number;
  className?: string;
}

/** Hero cassette: floats, sways, can be dragged around and springs back. */
export default function CassetteStage({ design, title, spinning = true, speed = 3, tilt = -4, className }: Props) {
  return (
    <div className={className} style={{ touchAction: "pan-y" }}>
      <Canvas flat shadows="percentage" dpr={[1, 2]} camera={{ fov: 30, position: [0, 0, 8] }} gl={{ antialias: true, alpha: true }}>
        <FitCamera w={CW} h={CH + 0.6} margin={1.25} />
        <StudioLights />
        <PresentationControls
          global
          cursor
          snap
          speed={1.4}
          polar={[-0.5, 0.5]}
          azimuth={[-Math.PI, Math.PI]}
          rotation={[0, 0, 0]}
        >
          <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.06, 0.06]}>
            <Intro tilt={tilt}>
              <Cassette3D design={design} title={title} spinning={spinning} speed={speed} />
            </Intro>
          </Float>
        </PresentationControls>
        <ContactShadows position={[0, -CH / 2 - 0.45, 0]} opacity={0.28} scale={7} blur={2.6} far={2} color="#272727" />
      </Canvas>
    </div>
  );
}

/** Spins the cassette in on mount and keeps a gentle idle sway. */
function Intro({ tilt, children }: { tilt: number; children: React.ReactNode }) {
  const g = useRef<Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    if (t0.current === null) t0.current = t;
    const k = Math.min(1, (t - t0.current) / 1.4);
    const e = 1 - Math.pow(1 - k, 3);
    g.current.rotation.y = (1 - e) * Math.PI * 2 + Math.sin(t * 0.6) * 0.12;
    g.current.rotation.x = Math.sin(t * 0.45) * 0.05 - 0.08;
    g.current.rotation.z = (-tilt * Math.PI) / 180;
    g.current.scale.setScalar(0.6 + 0.4 * e);
  });
  return <group ref={g}>{children}</group>;
}
