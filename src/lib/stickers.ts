import type { StickerKind } from "./mixtape";

/**
 * Sticker artwork, described once as SVG path ops on a 100x100 viewBox so the same
 * data can render as inline SVG (2D UI) and onto a canvas (3D textures).
 */
export interface StickerOp {
  d?: string;
  text?: { x: number; y: number; value: string; size: number };
  fill?: string;
  stroke?: string;
  sw?: number;
  /** Paint the stroke under the fill (SVG paint-order: stroke). */
  strokeFirst?: boolean;
  cap?: CanvasLineCap;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const poly = (pts: string) => {
  const p = pts.trim().split(/\s+/);
  return `M${p[0].replace(",", " ")}${p
    .slice(1)
    .map((q) => `L${q.replace(",", " ")}`)
    .join("")}Z`;
};
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${
    x + r
  }A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const W = "#FFFFFF";
const INK = "#272727";

const HEART = "M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z";
const STAR = poly("50,6 61,37 94,38 68,58 77,91 50,72 23,91 32,58 6,38 39,37");
const BOLT = poly("60,4 18,56 46,56 36,96 84,40 55,40 68,4");
const SPARKLE = "M50 4 C54 38 62 46 96 50 C62 54 54 62 50 96 C46 62 38 54 4 50 C38 46 46 38 50 4Z";
const PETALS = [circle(50, 26, 18), circle(73, 43, 18), circle(64, 70, 18), circle(36, 70, 18), circle(27, 43, 18)];
const NOTE = [ellipse(30, 76, 14, 11), ellipse(72, 66, 14, 11), poly("39,74 45,74 45,30 86,20 86,64 80,64 80,32 45,40")];
const ARCS = ["M14 72 A36 36 0 0 1 86 72", "M24 72 A26 26 0 0 1 76 72", "M34 72 A16 16 0 0 1 66 72"];

const word = (value: string, bg: string, ink: string, size: number, y: number): StickerOp[] => [
  { d: rrect(3, 29, 94, 42, 21), fill: bg, stroke: W, sw: 7, strokeFirst: true },
  { text: { x: 50, y, value, size }, fill: ink },
];

export const STICKERS: Record<StickerKind, StickerOp[]> = {
  heart: [
    { d: HEART, fill: "#F48F68", stroke: W, sw: 9, strokeFirst: true },
    { d: "M26 26 C30 20 36 19 40 22", stroke: "#FFF6DE", sw: 5, cap: "round" },
  ],
  star: [
    { d: STAR, fill: "#FFE394", stroke: W, sw: 9, strokeFirst: true },
    { d: STAR, stroke: INK, sw: 2.5 },
  ],
  flower: [
    ...PETALS.map((d) => ({ d, fill: W, stroke: W, sw: 9 })),
    ...PETALS.map((d) => ({ d, fill: "#8BDFDD", stroke: INK, sw: 2.5 })),
    { d: circle(50, 50, 14), fill: "#FFE394", stroke: INK, sw: 2.5 },
  ],
  bolt: [
    { d: BOLT, fill: "#FFE394", stroke: W, sw: 9, strokeFirst: true },
    { d: BOLT, stroke: INK, sw: 2.5 },
  ],
  smiley: [
    { d: circle(50, 50, 42), fill: "#FFE394", stroke: W, sw: 9, strokeFirst: true },
    { d: circle(50, 50, 42), stroke: INK, sw: 2.5 },
    { d: ellipse(37, 40, 5, 8), fill: INK },
    { d: ellipse(63, 40, 5, 8), fill: INK },
    { d: "M29 58 Q50 80 71 58", stroke: INK, sw: 5, cap: "round" },
  ],
  note: [...NOTE.map((d) => ({ d, fill: W, stroke: W, sw: 10 })), ...NOTE.map((d) => ({ d, fill: INK }))],
  sparkle: [
    { d: SPARKLE, fill: "#8BDFDD", stroke: W, sw: 9, strokeFirst: true },
    { d: SPARKLE, stroke: INK, sw: 2.5 },
  ],
  rainbow: [
    ...ARCS.map((d) => ({ d, stroke: W, sw: 18, cap: "round" as const })),
    { d: ARCS[0], stroke: "#F48F68", sw: 10, cap: "round" },
    { d: ARCS[1], stroke: "#FFE394", sw: 10, cap: "round" },
    { d: ARCS[2], stroke: "#8BDFDD", sw: 10, cap: "round" },
  ],
  love: word("LOVE", "#F48F68", INK, 24, 58),
  playme: word("PLAY ME", "#8BDFDD", INK, 17, 56),
  xoxo: word("xoxo", "#FFE394", INK, 24, 58),
  foru: word("4 U", INK, "#FFE394", 26, 59),
};

/** Draw a sticker into a canvas context, filling a size x size square at the current origin. */
export function drawSticker(ctx: CanvasRenderingContext2D, kind: StickerKind, size: number, displayFont: string) {
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = "round";
  for (const op of STICKERS[kind]) {
    if (op.text) {
      ctx.fillStyle = op.fill || INK;
      ctx.font = `${op.text.size}px ${displayFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(op.text.value, op.text.x, op.text.y);
      continue;
    }
    const p = new Path2D(op.d);
    const stroke = () => {
      if (!op.stroke) return;
      ctx.strokeStyle = op.stroke;
      ctx.lineWidth = op.sw || 1;
      ctx.lineCap = op.cap || "butt";
      ctx.stroke(p);
    };
    const fill = () => {
      if (!op.fill) return;
      ctx.fillStyle = op.fill;
      ctx.fill(p);
    };
    if (op.strokeFirst) {
      stroke();
      fill();
    } else {
      fill();
      stroke();
    }
  }
  ctx.restore();
}
