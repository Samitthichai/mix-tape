"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { PerspectiveCamera } from "three";

/** Soft studio lighting with a procedural environment (no HDR downloads). */
export function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.55 * intensity} />
      <directionalLight
        position={[-3, 5, 6]}
        intensity={1.6 * intensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[4, -2, 3]} intensity={0.35 * intensity} color="#FFE394" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#FFE394" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#8BDFDD" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#F48F68" position={[0, -3, 4]} scale={3} />
      </Environment>
    </>
  );
}

/** Dolly the camera so a `w` x `h` box at the origin fits the canvas with some margin. */
export function FitCamera({
  w,
  h,
  margin = 1.15,
  y = 0,
  lookY = y,
}: {
  w: number;
  h: number;
  margin?: number;
  y?: number;
  lookY?: number;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const t = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const aspect = size.width / Math.max(1, size.height);
    const d = Math.max((h * margin) / (2 * t), (w * margin) / (2 * t * aspect));
    camera.position.set(0, y, d);
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, w, h, margin, y, lookY]);
  return null;
}
