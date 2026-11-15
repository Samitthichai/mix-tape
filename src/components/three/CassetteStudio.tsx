"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import type { Group } from "three";
import type { CassetteDesign, Side } from "@/lib/mixtape";
import { CH, CW, Cassette3D, type StickerEditing } from "./Cassette3D";
import { FitCamera, StudioLights } from "./StageBits";

interface Props {
  design: CassetteDesign;
  title: string;
  side: Side;
  editing: StickerEditing;
  className?: string;
}

/** Sticker editor: the cassette faces the camera, flips to the side being recorded, and tilts gently with the pointer. */
export default function CassetteStudio({ design, title, side, editing, className }: Props) {
  return (
    <div className={className} style={{ touchAction: "none" }}>
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: 24, position: [0, 0, 10] }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => editing.onSelect(null)}
      >
        <FitCamera w={CW} h={CH} margin={1.2} />
        <StudioLights intensity={0.95} />
        <Rig side={side}>
          <Cassette3D design={design} title={title} editing={editing} />
        </Rig>
      </Canvas>
    </div>
  );
}

function Rig({ side, children }: { side: Side; children: React.ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    const flip = side === "A" ? 0 : Math.PI;
    easing.damp(g.current.rotation, "y", flip + pointer.x * 0.08, 0.35, dt);
    easing.damp(g.current.rotation, "x", -pointer.y * 0.06, 0.35, dt);
  });
  return <group ref={g}>{children}</group>;
}
