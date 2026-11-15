"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide, Group, Mesh, Vector3 } from "three";
import type { CassetteDesign, PlacedSticker, Side } from "@/lib/mixtape";
import { drawCassetteFace, drawHub, drawSelection } from "@/lib/draw";
import { useFontsReady } from "@/lib/useFontsReady";
import { STICKER_PAD, getStickerTexture, useCanvasTexture } from "./useCanvasTexture";

export const CW = 3.2;
export const CH = 2.04;
export const CD = 0.36;
const U = CW / 100;
const FACE_Z = CD / 2 + 0.003;
const HUB_R = (11.5 * U) / 2;
const REELS: [number, number][] = [
  [31.5, 47],
  [68.5, 47],
];

/** Face-percentage → local face coordinates. */
const fx = (x: number) => (x / 100 - 0.5) * CW;
const fy = (y: number) => (0.5 - y / 100) * CH;

export interface StickerEditing {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onMove: (id: number, x: number, y: number) => void;
}

interface CassetteProps {
  design: CassetteDesign;
  title: string;
  spinning?: boolean;
  /** Seconds per reel revolution. */
  speed?: number;
  editing?: StickerEditing;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/** A C-90 cassette: side A on the front face, side B on the back. */
export function Cassette3D({ design, title, spinning = false, speed = 2.4, editing, onClick }: CassetteProps) {
  const clear = design.finish === "clear";
  return (
    <group onClick={onClick}>
      <RoundedBox args={[CW, CH, CD]} radius={0.06} smoothness={4} castShadow>
        {clear ? (
          <meshPhysicalMaterial
            color={design.shell}
            transmission={0.6}
            thickness={0.4}
            roughness={0.18}
            ior={1.45}
            transparent
            opacity={0.85}
          />
        ) : (
          <meshStandardMaterial color={design.shell} roughness={0.42} metalness={0.02} />
        )}
      </RoundedBox>
      <Face side="A" design={design} title={title} spinning={spinning} speed={speed} editing={editing} />
      <group rotation={[0, Math.PI, 0]}>
        <Face side="B" design={design} title={title} spinning={spinning} speed={speed} editing={editing} />
      </group>
    </group>
  );
}

interface FaceProps {
  side: Side;
  design: CassetteDesign;
  title: string;
  spinning: boolean;
  speed: number;
  editing?: StickerEditing;
}

function Face({ side, design, title, spinning, speed, editing }: FaceProps) {
  const fonts = useFontsReady();
  const faceTex = useCanvasTexture(
    1280,
    Math.round(1280 * (CH / CW)),
    (c) => drawCassetteFace(c, { design, side, title }),
    [design.shell, design.finish, design.label, design.pen, side, title, fonts]
  );
  const hubTex = useCanvasTexture(256, 256, drawHub, []);
  const hubs = useRef<(Mesh | null)[]>([]);

  useFrame((_, dt) => {
    if (!spinning) return;
    const w = ((Math.PI * 2) / speed) * Math.min(dt, 0.1);
    hubs.current.forEach((m) => m && (m.rotation.z -= w));
  });

  const clear = design.finish === "clear";
  return (
    <group position={[0, 0, FACE_Z]}>
      <mesh>
        <planeGeometry args={[CW, CH]} />
        <meshStandardMaterial
          map={faceTex}
          transparent={clear}
          alphaTest={clear ? 0 : 0.5}
          roughness={0.5}
          metalness={0}
        />
      </mesh>
      {REELS.map(([x, y], i) => (
        <mesh key={i} ref={(m) => void (hubs.current[i] = m)} position={[fx(x), fy(y), 0.004]}>
          <circleGeometry args={[HUB_R, 48]} />
          <meshStandardMaterial map={hubTex} transparent alphaTest={0.4} roughness={0.6} />
        </mesh>
      ))}
      <Stickers stickers={design.stickers} fonts={fonts} editing={editing} />
    </group>
  );
}

function Stickers({
  stickers,
  fonts,
  editing,
}: {
  stickers: PlacedSticker[];
  fonts: boolean;
  editing?: StickerEditing;
}) {
  const plane = useRef<Group>(null);
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number } | null>(null);
  const selTex = useCanvasTexture(256, 256, drawSelection, []);
  const tmp = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (!drag) return;
    const end = () => setDrag(null);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [drag]);

  const toPct = (p: Vector3) => {
    const l = plane.current!.worldToLocal(tmp.copy(p));
    return { x: (l.x / CW + 0.5) * 100, y: (0.5 - l.y / CH) * 100 };
  };

  return (
    <group ref={plane}>
      {stickers.map((st, i) => {
        const w = 13 * U * (st.s || 1);
        const selected = editing?.selectedId === st.id;
        return (
          <group
            key={st.id}
            position={[fx(st.x), fy(st.y), 0.012 + i * 0.002]}
            rotation={[0, 0, (-(st.r || 0) * Math.PI) / 180]}
          >
            <mesh
              onPointerDown={
                editing
                  ? (e) => {
                      e.stopPropagation();
                      const p = toPct(e.point);
                      editing.onSelect(st.id);
                      setDrag({ id: st.id, dx: p.x - st.x, dy: p.y - st.y });
                    }
                  : undefined
              }
              onPointerOver={editing ? () => (document.body.style.cursor = "grab") : undefined}
              onPointerOut={editing ? () => (document.body.style.cursor = "") : undefined}
            >
              <planeGeometry args={[w * STICKER_PAD, w * STICKER_PAD]} />
              <meshStandardMaterial
                map={getStickerTexture(st.k, fonts)}
                transparent
                alphaTest={0.02}
                roughness={0.35}
                side={DoubleSide}
              />
            </mesh>
            {selected && (
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[w + 1.6 * U, w + 1.6 * U]} />
                <meshBasicMaterial map={selTex} transparent depthWrite={false} />
              </mesh>
            )}
          </group>
        );
      })}
      {drag && editing && (
        <mesh
          position={[0, 0, 0.1]}
          onPointerMove={(e) => {
            e.stopPropagation();
            const p = toPct(e.point);
            const x = Math.max(-4, Math.min(104, p.x - drag.dx));
            const y = Math.max(-6, Math.min(106, p.y - drag.dy));
            editing.onMove(drag.id, +x.toFixed(1), +y.toFixed(1));
          }}
        >
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
