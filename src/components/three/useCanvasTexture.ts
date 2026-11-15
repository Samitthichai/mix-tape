"use client";

import { useEffect, useLayoutEffect, useMemo, type DependencyList } from "react";
import { CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace } from "three";
import type { StickerKind } from "@/lib/mixtape";
import { drawSticker } from "@/lib/stickers";
import { FONT } from "@/lib/fonts";

function makeTexture(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  return { canvas, tex };
}

/** A texture backed by a canvas that is repainted whenever `deps` change. */
export function useCanvasTexture(w: number, h: number, draw: (canvas: HTMLCanvasElement) => void, deps: DependencyList) {
  const { canvas, tex } = useMemo(() => makeTexture(w, h), [w, h]);
  useLayoutEffect(() => {
    draw(canvas);
    // three.js textures are mutable GPU handles; flagging the upload is the intended API.
    // eslint-disable-next-line react-hooks/immutability
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, tex, ...deps]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* Sticker textures are shared across every cassette on screen. The canvas spans
   120 viewBox units so strokes and the drop shadow are not clipped. */
export const STICKER_PAD = 1.2;
const stickerCache = new Map<string, CanvasTexture>();

export function getStickerTexture(kind: StickerKind, fontsReady: boolean) {
  const key = `${kind}:${fontsReady}`;
  let tex = stickerCache.get(key);
  if (tex) return tex;
  const S = 256;
  const { canvas, tex: t } = makeTexture(S, S);
  const ctx = canvas.getContext("2d")!;
  const art = document.createElement("canvas");
  art.width = art.height = S;
  const actx = art.getContext("2d")!;
  actx.translate(S * (0.1 / STICKER_PAD), S * (0.1 / STICKER_PAD));
  drawSticker(actx, kind, S / STICKER_PAD, FONT.display);
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(art, 0, 0);
  t.needsUpdate = true;
  tex = t;
  stickerCache.set(key, tex);
  return tex;
}
