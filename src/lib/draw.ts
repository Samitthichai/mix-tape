import type { CassetteDesign, LabelKind, Side } from "./mixtape";
import { FONT } from "./fonts";

/* Canvas painters for every textured surface in the 3D scenes. Measurements mirror the
   design's container-query units: `U` is 1% of the surface width (1cqw). */

export const CASSETTE_ASPECT = 204 / 320;
export const DECK_ASPECT = 380 / 440;

const hex = (c: string) => {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
/** Mix `b` into `a` by `p` percent. */
export const mix = (a: string, b: string, p: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const t = p / 100;
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
};
export const rgba = (c: string, a: number) => {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${a})`;
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function spaced(ctx: CanvasRenderingContext2D, em: number, size: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${em * size}px`;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

const PACK_DARK = "#3a2a1d";
const PACK_RING = "#4b3826";
const PACK_EDGE = "#5e4a35";

function pack(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, U: number) {
  circle(ctx, x, y, r);
  ctx.fillStyle = PACK_DARK;
  ctx.fill();
  ctx.strokeStyle = PACK_RING;
  ctx.lineWidth = 0.18 * U;
  for (let rr2 = r * 0.35; rr2 < r - 0.4 * U; rr2 += 0.7 * U) {
    circle(ctx, x, y, rr2);
    ctx.globalAlpha = 0.35;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  circle(ctx, x, y, r - 0.15 * U);
  ctx.strokeStyle = PACK_EDGE;
  ctx.lineWidth = 0.3 * U;
  ctx.stroke();
}

function labelFill(ctx: CanvasRenderingContext2D, kind: LabelKind, x: number, y: number, w: number, h: number, U: number) {
  const base = kind === "kraft" ? "#CCAF6E" : kind === "ink" ? "#272727" : kind === "cream" || kind === "stripes" ? "#FFF6DE" : "#FFFFFF";
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  if (kind === "lined") {
    ctx.fillStyle = "rgba(39,39,39,.13)";
    for (let yy = y + 3.3 * U; yy < y + h; yy += 3.5 * U) ctx.fillRect(x, yy, w, 0.2 * U);
  } else if (kind === "grid") {
    ctx.fillStyle = "rgba(39,39,39,.09)";
    for (let yy = y; yy < y + h; yy += 2.6 * U) ctx.fillRect(x, yy, w, 0.22 * U);
    for (let xx = x; xx < x + w; xx += 2.6 * U) ctx.fillRect(xx, y, 0.22 * U, h);
  } else if (kind === "stripes") {
    const bands: [number, number, string][] = [
      [0.6, 0.68, "#F48F68"],
      [0.68, 0.76, "#FFE394"],
      [0.76, 0.84, "#8BDFDD"],
    ];
    for (const [a, b, c] of bands) {
      ctx.fillStyle = c;
      ctx.fillRect(x, y + h * a, w, h * (b - a) + 0.5);
    }
  }
  // paper grain
  ctx.fillStyle = "rgba(0,0,0,.018)";
  for (let xx = x; xx < x + w; xx += 0.75 * U) ctx.fillRect(xx, y, 0.25 * U, h);
}

const PENS = {
  marker: () => [FONT.marker, 6.2] as const,
  display: () => [FONT.display, 5.4] as const,
  type: () => [FONT.mono, 4.6] as const,
};

export interface FaceOpts {
  design: CassetteDesign;
  side: Side;
  title: string;
}

/** One face of the cassette (shell, label, window, packs, bottom bridge, screws). Reels and stickers are separate meshes. */
export function drawCassetteFace(canvas: HTMLCanvasElement, { design, side, title }: FaceOpts) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const U = W / 100;
  const c = design.shell;
  const clear = design.finish === "clear";
  const ink = design.label === "ink";
  const packL = (side === "A" ? 31 : 21) * U;
  const packR = (side === "A" ? 21 : 31) * U;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  rr(ctx, 0, 0, W, H, 3.6 * U);
  ctx.clip();

  // shell
  if (clear) {
    const g = ctx.createLinearGradient(0, 0, W * 0.17, H);
    g.addColorStop(0, rgba(c, 0.5));
    g.addColorStop(1, rgba(c, 0.72));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    pack(ctx, W * 0.315, H * 0.47, packL / 2, U);
    pack(ctx, W * 0.685, H * 0.47, packR / 2, U);
    for (const x of [W * 0.09 + 2 * U, W * 0.91 - 2 * U]) {
      const rg = ctx.createRadialGradient(x, H * 0.9 - 2 * U, 0, x, H * 0.9 - 2 * U, 2 * U);
      rg.addColorStop(0.25, "#FFFFFF");
      rg.addColorStop(0.3, "#DAD6CC");
      ctx.fillStyle = rg;
      circle(ctx, x, H * 0.9 - 2 * U, 2 * U);
      ctx.fill();
    }
    ctx.fillStyle = "#45321f";
    ctx.fillRect(W * 0.1, H * 0.904 - 0.8 * U, W * 0.8, 0.8 * U);
    ctx.fillStyle = rgba(c, 0.28);
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H);
  }
  // inner edge
  rr(ctx, 0, 0, W, H, 3.6 * U);
  ctx.strokeStyle = mix(c, "#000000", 42);
  ctx.lineWidth = 1 * U;
  ctx.stroke();
  // moulded inner rim
  rr(ctx, 1.5 * U, 1.5 * U, W - 3 * U, H - 3 * U, 2.6 * U);
  ctx.strokeStyle = "rgba(0,0,0,.06)";
  ctx.lineWidth = 0.3 * U;
  ctx.stroke();

  // label
  const lx = W * 0.065,
    ly = H * 0.065,
    lw = W * 0.87,
    lh = H * 0.63;
  ctx.save();
  rr(ctx, lx, ly, lw, lh, 1.8 * U);
  ctx.clip();
  labelFill(ctx, design.label, lx, ly, lw, lh, U);
  const labelInk = ink ? "#FFF6DE" : "#272727";
  // side badge
  const rowTop = ly + 2.4 * U;
  const bx = lx + 3 * U;
  rr(ctx, bx, rowTop + 0.5 * U, 7 * U, 7 * U, 1.2 * U);
  ctx.fillStyle = labelInk;
  ctx.fill();
  ctx.fillStyle = ink ? "#272727" : "#FFF6DE";
  ctx.font = `500 ${4.6 * U}px ${FONT.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(side, bx + 3.5 * U, rowTop + 4.15 * U);
  // title line
  const tx = bx + 7 * U + 2.4 * U;
  const tw = lx + lw - 3 * U - tx;
  ctx.fillStyle = ink ? "rgba(255,246,222,.4)" : "rgba(39,39,39,.35)";
  ctx.fillRect(tx, rowTop + 8 * U - 0.3 * U, tw, 0.3 * U);
  const [penFont, penSize] = PENS[design.pen]();
  ctx.save();
  ctx.translate(tx, rowTop + 8 * U - 0.9 * U);
  ctx.rotate((-1.2 * Math.PI) / 180);
  ctx.font = `${penSize * U}px ${penFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = labelInk;
  ctx.fillText(ellipsize(ctx, title || "Untitled mix", tw), 0, 0);
  ctx.restore();
  // footer
  ctx.font = `${1.9 * U}px ${FONT.mono}`;
  spaced(ctx, 0.1, 1.9 * U);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = labelInk;
  ctx.textBaseline = "alphabetic";
  const fy = ly + lh - 1.6 * U - 0.3 * U;
  ctx.textAlign = "left";
  ctx.fillText("NR ▢", lx + 3 * U, fy);
  ctx.textAlign = "center";
  ctx.fillText("TYPE I · NORMAL", lx + lw / 2, fy);
  ctx.textAlign = "right";
  ctx.fillText("C-90", lx + lw - 3 * U, fy);
  spaced(ctx, 0, 0);
  ctx.globalAlpha = 1;
  ctx.restore();

  // tape window
  const wx = W * 0.21,
    wy = H * 0.355,
    ww = W * 0.58,
    wh = H * 0.23;
  rr(ctx, wx - 0.6 * U, wy - 0.6 * U, ww + 1.2 * U, wh + 1.2 * U, 2.2 * U);
  ctx.fillStyle = clear ? mix(c, "#000000", 20) : c;
  ctx.fill();
  ctx.save();
  rr(ctx, wx, wy, ww, wh, 1.6 * U);
  ctx.clip();
  ctx.fillStyle = "#1f1d1b";
  ctx.fillRect(wx, wy, ww, wh);
  pack(ctx, wx + ww * 0.181, wy + wh / 2, packL / 2, U);
  pack(ctx, wx + ww * 0.819, wy + wh / 2, packR / 2, U);
  // centre viewing strip
  const sx = wx + ww * 0.36,
    sw = ww * 0.28,
    sy = wy + wh * 0.22,
    sh = wh * 0.56;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "rgba(255,255,255,.3)";
  for (let xx = sx; xx < sx + sw; xx += 1.3 * U) ctx.fillRect(xx, sy, 0.2 * U, sh);
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(sx, sy, 0.25 * U, sh);
  ctx.fillRect(sx + sw - 0.25 * U, sy, 0.25 * U, sh);
  ctx.globalAlpha = 1;
  // glass glint
  const gl = ctx.createLinearGradient(wx, wy, wx + ww * 0.4, wy + wh);
  gl.addColorStop(0, "rgba(255,255,255,.10)");
  gl.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = gl;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.restore();

  // bottom bridge
  const bxL = W * 0.19,
    bw = W * 0.62,
    bh = H * 0.21,
    by = H - bh;
  const bottom = mix(c, "#000000", 12);
  ctx.beginPath();
  ctx.moveTo(bxL + bw * 0.07, by);
  ctx.lineTo(bxL + bw * 0.93, by);
  ctx.lineTo(bxL + bw, H);
  ctx.lineTo(bxL, H);
  ctx.closePath();
  ctx.fillStyle = clear ? rgba(bottom, 0.75) : bottom;
  ctx.fill();
  const cy = by + bh / 2 + 0.5 * U;
  const parts = [3.4, 3.2, 7, 3.2, 3.4];
  const gap = 4 * U;
  const total = parts.reduce((a, b) => a + b * U, 0) + gap * 4;
  let px = W / 2 - total / 2;
  parts.forEach((p, i) => {
    const w = p * U;
    ctx.fillStyle = "#0d0c0b";
    if (i === 0 || i === 4) {
      circle(ctx, px + w / 2, cy, w / 2);
      ctx.fill();
    } else if (i === 2) {
      rr(ctx, px, cy - 1.2 * U, w, 2.4 * U, 0.4 * U);
      ctx.fill();
      ctx.fillStyle = "#c9b88a";
      rr(ctx, px + 1.2 * U, cy - 0.6 * U, 4.6 * U, 1.2 * U, 0.2 * U);
      ctx.fill();
    } else {
      rr(ctx, px, cy - 1.3 * U, w, 2.6 * U, 0.5 * U);
      ctx.fill();
    }
    px += w + gap;
  });

  // screws
  const screws: [number, number, number][] = [
    [3.4, 5.3, 20],
    [96.6, 5.3, -30],
    [3.4, 94.7, 60],
    [96.6, 94.7, 5],
    [50, 86, -45],
  ];
  for (const [sxp, syp, rot] of screws) {
    const x = (W * sxp) / 100,
      y = (H * syp) / 100;
    const g = ctx.createRadialGradient(x - 0.4 * U, y - 0.4 * U, 0, x, y, 1.5 * U);
    g.addColorStop(0, "#E4E4E4");
    g.addColorStop(1, "#A9A9A9");
    circle(ctx, x, y, 1.5 * U);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = "#555555";
    rr(ctx, -1.05 * U, -0.225 * U, 2.1 * U, 0.45 * U, 0.2 * U);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Reel hub: cream ring with six teeth. Drawn once and spun as a mesh. */
export function drawHub(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const S = canvas.width;
  const c = S / 2;
  ctx.clearRect(0, 0, S, S);
  circle(ctx, c, c, S / 2 - 1);
  ctx.fillStyle = "#EDE8DE";
  ctx.fill();
  const rin = S * 0.28;
  circle(ctx, c, c, rin);
  ctx.fillStyle = "#1a1816";
  ctx.fill();
  ctx.fillStyle = "#EDE8DE";
  for (let i = 0; i < 6; i++) {
    const a0 = (i * 60 * Math.PI) / 180 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, rin, a0, a0 + (14 * Math.PI) / 180);
    ctx.closePath();
    ctx.fill();
  }
  circle(ctx, c, c, rin * 0.62);
  ctx.fillStyle = "#1a1816";
  ctx.fill();
}

/* ---------------- cassette deck ---------------- */

/** Front plate of the deck. The tape well is cut out of the geometry, so it is left unpainted here. */
export function drawDeckFace(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height,
    U = W / 100;
  ctx.fillStyle = "#3B3B3D";
  ctx.fillRect(0, 0, W, H);
  // subtle vertical brushing
  ctx.fillStyle = "rgba(255,255,255,.015)";
  for (let x = 0; x < W; x += 0.6 * U) ctx.fillRect(x, 0, 0.2 * U, H);
  // silver top band
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.21);
  g.addColorStop(0, "#C4C4C6");
  g.addColorStop(1, "#939395");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.21);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  for (let x = 0; x < W; x += 0.5 * U) ctx.fillRect(x, 0, 0.15 * U, H * 0.21);
  ctx.fillStyle = "#2A2A2B";
  ctx.fillRect(0, H * 0.21, W, 0.6 * U);
  // LCD bezel
  rr(ctx, W * 0.05, H * 0.045, W * 0.54, H * 0.11, 1 * U);
  ctx.fillStyle = "#2A2A2B";
  ctx.fill();
  // MIC
  ctx.fillStyle = "#272727";
  circle(ctx, W * 0.81, H * 0.1, 0.6 * U);
  ctx.fill();
  ctx.font = `${2.4 * U}px ${FONT.mono}`;
  spaced(ctx, 0.08, 2.4 * U);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("MIC", W * 0.81 + 1.6 * U, H * 0.1);
  // mic grille holes
  ctx.fillStyle = "rgba(0,0,0,.35)";
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      circle(ctx, W * 0.81 + 1.8 * U + i * 1.6 * U, H * 0.14 + j * 1.4 * U, 0.35 * U);
      ctx.fill();
    }
  spaced(ctx, 0, 0);
  // well lip shading
  rr(ctx, W * 0.04 - 0.4 * U, H * 0.24 - 0.4 * U, W * 0.92 + 0.8 * U, H * 0.72 + 0.8 * U, 2.4 * U);
  ctx.strokeStyle = "#2A2A2B";
  ctx.lineWidth = 0.8 * U;
  ctx.stroke();
  // little feet hint along the bottom
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.fillRect(0, H - 0.8 * U, W, 0.8 * U);
}

/** LCD readout. */
export function drawLcd(canvas: HTMLCanvasElement, top: string, bottom: string, lit: boolean) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height,
    U = W / 54; // canvas spans 54 deck-cqw
  rr(ctx, 0, 0, W, H, 1 * U);
  ctx.fillStyle = lit ? "#FFE394" : "#E8D38A";
  ctx.fill();
  ctx.strokeStyle = "#2A2A2B";
  ctx.lineWidth = 1 * U;
  ctx.stroke();
  // pixel grid
  ctx.fillStyle = "rgba(39,39,39,.04)";
  for (let x = 0; x < W; x += 0.5 * U) ctx.fillRect(x, 0, 0.12 * U, H);
  ctx.fillStyle = "#272727";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${2.3 * U}px ${FONT.mono}`;
  spaced(ctx, 0.06, 2.3 * U);
  ctx.fillText(top, 2.4 * U, H * 0.34);
  spaced(ctx, 0, 0);
  ctx.font = `${2.3 * U}px ${FONT.mono}`;
  ctx.fillText(ellipsize(ctx, bottom, W - 4.8 * U), 2.4 * U, H * 0.7);
}

/** Cassette door: tinted glass, printed legend and the grey panel with the reel window. */
export function drawDoor(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height,
    U = W / 92; // door spans 92 deck-cqw
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  rr(ctx, 0, 0, W, H, 2 * U);
  ctx.clip();
  ctx.fillStyle = "rgba(40,40,42,.42)";
  ctx.fillRect(0, 0, W, H);
  // legend
  ctx.fillStyle = "#FFF6DE";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `${2.2 * U}px ${FONT.mono}`;
  spaced(ctx, 0.08, 2.2 * U);
  ctx.fillText("STEREO CASSETTE", W * 0.04, H * 0.03);
  ctx.fillText("PLAYER", W * 0.04, H * 0.03 + 2.9 * U);
  spaced(ctx, 0, 0);
  ctx.textAlign = "right";
  ctx.font = `${4.6 * U}px ${FONT.display}`;
  ctx.fillText("Mixtape", W * 0.96, H * 0.02);
  // grey panel with a pill window
  const by = H * 0.32,
    bh = H * 0.44;
  const ox = W * 0.235,
    ow = W * 0.53,
    oy = by + bh * 0.16,
    oh = bh * 0.45;
  ctx.beginPath();
  ctx.rect(0, by, W, bh);
  ctx.roundRect(ox, oy, ow, oh, oh / 2);
  ctx.fillStyle = "#BDBDBF";
  ctx.fill("evenodd");
  ctx.beginPath();
  ctx.roundRect(ox, oy, ow, oh, oh / 2);
  ctx.strokeStyle = "#9D9D9F";
  ctx.lineWidth = 0.5 * U;
  ctx.stroke();
  // speaker dots
  ctx.fillStyle = "#6E6E70";
  const sx = W * 0.95 - 9 * U,
    sy = by + bh * 0.3;
  for (let x = 0; x < 6; x++)
    for (let y = 0; y < 4; y++) {
      circle(ctx, sx + x * 1.5 * U + 0.75 * U, sy + y * 1.5 * U + 0.75 * U, 0.3 * U);
      ctx.fill();
    }
  ctx.restore();
}

/** Front of a piano key. */
export function drawKey(canvas: HTMLCanvasElement, label: string, play: boolean) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height;
  if (play) {
    ctx.fillStyle = "#F48F68";
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#D4D4D6");
    g.addColorStop(1, "#9A9A9C");
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.fillRect(0, 0, W, H * 0.06);
  ctx.fillStyle = "#272727";
  ctx.font = `500 ${H * 0.36}px ${FONT.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, W / 2, H * 0.5);
}

/** Dashed selection frame for the sticker editor. */
export function drawSelection(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const S = canvas.width;
  ctx.clearRect(0, 0, S, S);
  ctx.setLineDash([S * 0.05, S * 0.035]);
  ctx.lineWidth = S * 0.025;
  ctx.strokeStyle = "#272727";
  rr(ctx, S * 0.02, S * 0.02, S * 0.96, S * 0.96, S * 0.1);
  ctx.stroke();
}
