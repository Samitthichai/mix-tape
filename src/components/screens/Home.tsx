"use client";

import { DEMO_DESIGN } from "@/lib/mixtape";
import { CassetteStage } from "../three/lazy";

export function Home({ onStart }: { onStart: () => void }) {
  return (
    <main
      className="fade"
      style={{
        minHeight: "calc(100vh - 84px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "8px clamp(16px,4vw,40px) 80px",
      }}
    >
      <div style={{ width: "min(100%, 620px)", aspectRatio: "620 / 440" }}>
        <CassetteStage className="canvas-fill" design={DEMO_DESIGN} title="For you ♡" tilt={-4} speed={3} />
      </div>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, textAlign: "center" }}>Drag the tape to spin it around.</p>
      <button className="btn-hero" onClick={onStart}>
        Let’s create your mix tape
      </button>
    </main>
  );
}
