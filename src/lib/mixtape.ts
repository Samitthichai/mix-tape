export type Side = "A" | "B";
export type Finish = "solid" | "clear";
export type LabelKind = "cream" | "lined" | "stripes" | "grid" | "kraft" | "ink";
export type PenKind = "marker" | "display" | "type";

export type StickerKind =
  | "heart"
  | "star"
  | "flower"
  | "bolt"
  | "smiley"
  | "note"
  | "sparkle"
  | "rainbow"
  | "love"
  | "playme"
  | "xoxo"
  | "foru";

export const STICKER_KINDS: StickerKind[] = [
  "heart",
  "star",
  "flower",
  "bolt",
  "smiley",
  "note",
  "sparkle",
  "rainbow",
  "love",
  "playme",
  "xoxo",
  "foru",
];

/** x/y are percentages of the cassette face, r is degrees (clockwise), s is scale. */
export interface PlacedSticker {
  id: number;
  k: StickerKind;
  x: number;
  y: number;
  r: number;
  s: number;
}

export interface Track {
  t: string;
  u: string;
}

export interface Mix {
  title: string;
  from: string;
  to: string;
  note: string;
  shell: string | null;
  finish: Finish;
  label: LabelKind;
  pen: PenKind;
  stickers: PlacedSticker[];
  a: Track[];
  b: Track[];
}

export interface CassetteDesign {
  shell: string;
  finish: Finish;
  label: LabelKind;
  pen: PenKind;
  stickers: PlacedSticker[];
}

export const COLORS = {
  cream: "#FFF6DE",
  ink: "#272727",
  coral: "#F48F68",
  teal: "#8BDFDD",
  butter: "#FFE394",
  white: "#FFFFFF",
} as const;

export const SHELLS = ["#8BDFDD", "#F48F68", "#FFE394", "#FFF6DE", "#272727"];
export const DEFAULT_SHELL = "#F48F68";
export const MAX_TRACKS = 12;
export const MAX_STICKERS = 24;

export const blankMix = (): Mix => ({
  title: "",
  from: "",
  to: "",
  note: "",
  shell: null,
  finish: "solid",
  label: "cream",
  pen: "marker",
  stickers: [],
  a: [],
  b: [],
});

export const designOf = (mix: Mix): CassetteDesign => ({
  shell: mix.shell || DEFAULT_SHELL,
  finish: mix.finish || "solid",
  label: mix.label || "cream",
  pen: mix.pen || "marker",
  stickers: mix.stickers || [],
});

export const DEMO_DESIGN: CassetteDesign = {
  shell: "#8BDFDD",
  finish: "clear",
  label: "cream",
  pen: "marker",
  stickers: [
    { id: 1, k: "star", x: 90, y: 78, r: 12, s: 1.1 },
    { id: 2, k: "flower", x: 8, y: 16, r: -8, s: 0.9 },
  ],
};

/* ---------- share-link encoding (compatible with the design prototype) ---------- */

type Encoded = {
  n: string;
  f: string;
  t: string;
  m: string;
  c: string;
  fi: Finish;
  l: LabelKind;
  p: PenKind;
  s: [StickerKind, number, number, number, number][];
  a: [string, string][];
  b: [string, string][];
};

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64Url = (s: string) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
};

export function encodeMix(mix: Mix): string {
  const o: Encoded = {
    n: mix.title,
    f: mix.from,
    t: mix.to,
    m: mix.note,
    c: mix.shell || DEFAULT_SHELL,
    fi: mix.finish,
    l: mix.label,
    p: mix.pen,
    s: mix.stickers.map((s) => [s.k, s.x, s.y, s.r, s.s]),
    a: mix.a.map((x) => [x.t, x.u]),
    b: mix.b.map((x) => [x.t, x.u]),
  };
  return toB64Url(JSON.stringify(o));
}

export function decodeMix(s: string): Mix | null {
  try {
    const o = JSON.parse(fromB64Url(s)) as Partial<Encoded>;
    const tr = (l?: [string, string][]) => (l || []).map((x) => ({ t: x[0], u: x[1] }));
    return {
      title: o.n || "",
      from: o.f || "",
      to: o.t || "",
      note: o.m || "",
      shell: o.c || null,
      finish: o.fi || "solid",
      label: o.l || "cream",
      pen: o.p || "marker",
      stickers: (o.s || []).map((a, i) => ({ id: i + 1, k: a[0], x: a[1], y: a[2], r: a[3], s: a[4] })),
      a: tr(o.a),
      b: tr(o.b),
    };
  } catch {
    return null;
  }
}

/* ---------- YouTube / Spotify links ---------- */

export type ParsedLink = { p: "yt"; id: string } | { p: "sp"; kind: string; id: string };

export function parseLink(u: string): ParsedLink | null {
  u = (u || "").trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { p: "yt", id: m[1] };
  m =
    u.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/) ||
    u.match(/^spotify:(track|album|playlist|episode):([A-Za-z0-9]+)/);
  if (m) return { p: "sp", kind: m[1], id: m[2] };
  return null;
}

export function embedOf(x: ParsedLink | null, autoplay: boolean) {
  if (!x) return { src: "", aspect: "auto", h: "0px" };
  if (x.p === "yt")
    return { src: `https://www.youtube.com/embed/${x.id}?rel=0${autoplay ? "&autoplay=1" : ""}`, aspect: "16/9", h: "auto" };
  return {
    src: `https://open.spotify.com/embed/${x.kind}/${x.id}?utm_source=generator`,
    aspect: "auto",
    h: x.kind === "track" || x.kind === "episode" ? "152px" : "352px",
  };
}

export function platformOf(u: string) {
  const x = parseLink(u);
  return x && x.p === "sp" ? { plat: "Spotify", platBg: COLORS.teal } : { plat: "YouTube", platBg: COLORS.coral };
}

export async function fetchTitle(url: string, x: ParsedLink): Promise<string> {
  const e = encodeURIComponent(url.trim());
  const tries =
    x.p === "sp"
      ? [`https://open.spotify.com/oembed?url=${e}`, `https://noembed.com/embed?url=${e}`]
      : [`https://noembed.com/embed?url=${e}`, `https://www.youtube.com/oembed?format=json&url=${e}`];
  for (const q of tries) {
    try {
      const j = await (await fetch(q)).json();
      if (j && j.title) return j.title as string;
    } catch {
      /* try next provider */
    }
  }
  return "";
}

export const pad = (n: number) => String(n).padStart(2, "0");
