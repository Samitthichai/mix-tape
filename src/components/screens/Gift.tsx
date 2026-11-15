"use client";

import type { CassetteDesign, Mix } from "@/lib/mixtape";
import { CassetteStage } from "../three/lazy";

export function Gift({ mix, design, onListen }: { mix: Mix; design: CassetteDesign; onListen: () => void }) {
  return (
    <main
      className="fade"
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "24px clamp(16px,4vw,40px) 80px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
        gap: 48,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase" }}>Someone made you a mixtape</div>
        <h1 className="display" style={{ fontSize: "clamp(40px,5.6vw,68px)", textWrap: "balance" }}>
          {mix.title || "A mixtape for you"}
        </h1>
        <div
          className="card"
          style={{
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            transform: "rotate(-1deg)",
            backgroundImage: "repeating-linear-gradient(#FFFFFF 0 31px,#8BDFDD66 31px 32px)",
          }}
        >
          <span className="display" style={{ fontSize: 22 }}>
            To {mix.to || "you"},
          </span>
          {mix.note.trim() && (
            <p style={{ margin: 0, fontSize: 15, lineHeight: "32px", whiteSpace: "pre-wrap", textWrap: "pretty" }}>{mix.note}</p>
          )}
          <span className="display" style={{ fontSize: 20, alignSelf: "flex-end" }}>
            — {mix.from || "a friend"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <button className="btn-hero" onClick={onListen}>
            Let’s Listen ▶
          </button>
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", aspectRatio: "520 / 400" }}>
        <CassetteStage className="canvas-fill" design={design} title={mix.title} tilt={5} spinning={false} />
      </div>
    </main>
  );
}
