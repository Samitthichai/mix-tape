"use client";

import { useState } from "react";
import {
  MAX_TRACKS,
  SHELLS,
  STICKER_KINDS,
  type CassetteDesign,
  type Finish,
  type LabelKind,
  type Mix,
  type PenKind,
  type Side,
  type StickerKind,
} from "@/lib/mixtape";
import { Sticker } from "../Sticker";
import { CassetteStudio } from "../three/lazy";
import { TrackRows } from "./TrackRows";

const FINISHES: [Finish, string][] = [
  ["solid", "Solid"],
  ["clear", "Translucent"],
];
const LABELS: [LabelKind, string, string][] = [
  ["cream", "Cream", "#FFF6DE"],
  ["lined", "Lined", "repeating-linear-gradient(180deg,#FFFFFF 0 4px,#27272733 4px 5px)"],
  ["stripes", "Stripes", "linear-gradient(180deg,#FFF6DE 0 35%,#F48F68 35% 55%,#FFE394 55% 75%,#8BDFDD 75%)"],
  [
    "grid",
    "Grid",
    "linear-gradient(#27272733 1px,transparent 1px) 0 0/5px 5px,linear-gradient(90deg,#27272733 1px,transparent 1px) 0 0/5px 5px,#FFFFFF",
  ],
  ["kraft", "Kraft", "#CCAF6E"],
  ["ink", "Ink", "#272727"],
];
const PENS: [PenKind, string, string][] = [
  ["marker", "Marker", "var(--marker)"],
  ["display", "Fancy", "var(--display)"],
  ["type", "Typewriter", "var(--mono)"],
];

interface Props {
  mix: Mix;
  design: CassetteDesign;
  err: string;
  previewSide: Side;
  sel: number | null;
  setSel: (id: number | null) => void;
  setMix: (p: Partial<Mix>) => void;
  addSticker: (k: StickerKind) => void;
  moveSticker: (id: number, x: number, y: number) => void;
  rotate: (deg: number) => void;
  resize: (d: number) => void;
  peel: () => void;
  clearStickers: () => void;
  openModal: (side: Side) => void;
  removeTrack: (key: "a" | "b", i: number) => void;
  finish: () => void;
}

export function Create(p: Props) {
  const { mix, design, setMix } = p;
  const [tab, setTab] = useState<"style" | "stickers">("style");
  const hasSel = p.sel != null && design.stickers.some((x) => x.id === p.sel);

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "16px clamp(16px,4vw,40px) 80px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
        gap: 40,
        alignItems: "start",
      }}
    >
      <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 className="display" style={{ fontSize: "clamp(34px,4.4vw,52px)" }}>
          Record your mixtape
        </h1>
        <div className="studio">
          <div style={{ width: "100%", aspectRatio: "320 / 220" }}>
            <CassetteStudio
              className="canvas-fill"
              design={design}
              title={mix.title}
              side={p.previewSide}
              editing={{
                selectedId: p.sel,
                onSelect: (id) => {
                  p.setSel(id);
                  if (id != null) setTab("stickers");
                },
                onMove: p.moveSticker,
              }}
            />
          </div>
        </div>
        <div className="seg">
          <button onClick={() => setTab("style")} style={{ background: tab === "style" ? "var(--butter)" : undefined }}>
            Tape style
          </button>
          <button onClick={() => setTab("stickers")} style={{ background: tab === "stickers" ? "var(--butter)" : undefined }}>
            Stickers · {design.stickers.length}
          </button>
        </div>

        {tab === "style" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="opt-row">
              <span className="eyebrow">Shell</span>
              <div style={{ gap: 10 }}>
                {SHELLS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Shell ${c}`}
                    aria-pressed={c === design.shell}
                    onClick={() => setMix({ shell: c })}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "2.5px solid var(--ink)",
                      background: c,
                      padding: 0,
                      cursor: "pointer",
                      boxShadow: c === design.shell ? "0 0 0 3px var(--cream), 0 0 0 5.5px var(--ink)" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="opt-row">
              <span className="eyebrow">Finish</span>
              <div>
                {FINISHES.map(([v, label]) => (
                  <button key={v} className="pill" aria-pressed={design.finish === v} onClick={() => setMix({ finish: v })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="opt-row">
              <span className="eyebrow">Label</span>
              <div>
                {LABELS.map(([v, name, swatch]) => (
                  <button
                    key={v}
                    className="pill"
                    aria-pressed={design.label === v}
                    onClick={() => setMix({ label: v })}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px" }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--ink)", background: swatch }} />
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="opt-row">
              <span className="eyebrow">Pen</span>
              <div>
                {PENS.map(([v, name, font]) => (
                  <button
                    key={v}
                    className="pill"
                    aria-pressed={design.pen === v}
                    onClick={() => setMix({ pen: v })}
                    style={{ borderRadius: 10, fontFamily: font, fontSize: 16, padding: "7px 14px" }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "stickers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(56px,1fr))", gap: 8 }}>
              {STICKER_KINDS.map((k) => (
                <button key={k} className="sticker-btn" aria-label={`Add ${k} sticker`} onClick={() => p.addSticker(k)}>
                  <Sticker kind={k} />
                </button>
              ))}
            </div>
            {hasSel && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="eyebrow" style={{ marginRight: 4 }}>
                  Selected
                </span>
                <button className="icon-btn" aria-label="Rotate left" onClick={() => p.rotate(-15)}>
                  ↺
                </button>
                <button className="icon-btn" aria-label="Rotate right" onClick={() => p.rotate(15)}>
                  ↻
                </button>
                <button className="icon-btn" aria-label="Smaller" onClick={() => p.resize(-0.2)}>
                  −
                </button>
                <button className="icon-btn" aria-label="Bigger" onClick={() => p.resize(0.2)}>
                  +
                </button>
                <button className="btn" style={{ background: "var(--coral)", height: 40, padding: "0 14px" }} onClick={p.peel}>
                  Peel off
                </button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, lineHeight: 1.5 }}>Tap a sticker to add it, then drag it around the tape.</span>
              {design.stickers.length > 0 && (
                <button className="btn" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }} onClick={p.clearStickers}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          Side A · {mix.a.length} songs · Side B · {mix.b.length} songs
        </p>
      </div>

      <div className="card" style={{ padding: "clamp(18px,3vw,32px)", display: "flex", flexDirection: "column", gap: 22 }}>
        <label className="field">
          <span className="eyebrow">Mixtape name</span>
          <input
            className="input"
            value={mix.title}
            onChange={(e) => setMix({ title: e.target.value })}
            maxLength={40}
            placeholder="e.g. Songs for the long drive"
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          <label className="field">
            <span className="eyebrow">To</span>
            <input className="input" value={mix.to} onChange={(e) => setMix({ to: e.target.value })} maxLength={30} placeholder="Their name" />
          </label>
          <label className="field">
            <span className="eyebrow">From</span>
            <input className="input" value={mix.from} onChange={(e) => setMix({ from: e.target.value })} maxLength={30} placeholder="Your name" />
          </label>
        </div>
        <label className="field">
          <span className="eyebrow">Note</span>
          <textarea
            className="input"
            value={mix.note}
            onChange={(e) => setMix({ note: e.target.value })}
            maxLength={500}
            rows={4}
            placeholder="Write something for them to read before they press play…"
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 16 }}>
          {(["A", "B"] as const).map((side) => {
            const key = side === "A" ? "a" : "b";
            return (
              <div className="side-box" key={side}>
                <div className="side-head" style={{ background: side === "A" ? "var(--teal)" : "var(--butter)" }}>
                  <span className="display">Side {side}</span>
                  <span style={{ fontSize: 12 }}>
                    {mix[key].length}/{MAX_TRACKS}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: "6px 0", minHeight: 64 }}>
                  <TrackRows tracks={mix[key]} onRemove={(i) => p.removeTrack(key, i)} empty="Blank tape." />
                </div>
                <button className="btn-rec" style={{ margin: "0 12px 12px" }} onClick={() => p.openModal(side)}>
                  Record to side {side}
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 16,
            flexWrap: "wrap",
            borderTop: "2px dashed var(--ink)",
            paddingTop: 20,
          }}
        >
          {p.err && (
            <span role="alert" style={{ fontSize: 13, marginRight: "auto", padding: "6px 10px", background: "var(--coral)", borderRadius: 8 }}>
              {p.err}
            </span>
          )}
          <button className="btn-coral" onClick={p.finish}>
            Finish tape →
          </button>
        </div>
      </div>
    </main>
  );
}
