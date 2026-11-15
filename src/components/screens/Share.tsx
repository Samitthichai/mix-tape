"use client";

import { useEffect, useRef, useState } from "react";
import type { CassetteDesign, Mix } from "@/lib/mixtape";
import { CassetteStage } from "../three/lazy";

export const shareLine = (mix: Mix) =>
  [mix.to && `To ${mix.to}`, mix.from && `from ${mix.from}`].filter(Boolean).join(", ") + ` · ${mix.a.length} + ${mix.b.length} songs`;

interface Props {
  mix: Mix;
  design: CassetteDesign;
  link: string;
  onPreview: () => void;
  onEdit: () => void;
  onNew: () => void;
}

export function Share({ mix, design, link, onPreview, onEdit, onNew }: Props) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      ta.remove();
    }
    setCopied(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main
      className="fade"
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "8px clamp(16px,4vw,40px) 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        textAlign: "center",
      }}
    >
      <div style={{ width: "min(100%, 480px)", aspectRatio: "480 / 340" }}>
        <CassetteStage className="canvas-fill" design={design} title={mix.title} tilt={-4} speed={3} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 className="display" style={{ fontSize: "clamp(34px,5vw,54px)" }}>
          Your mixtape is ready.
        </h1>
        <p style={{ margin: 0, fontSize: 15 }}>{shareLine(mix)}</p>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            readOnly
            value={link}
            aria-label="Share link"
            onFocus={(e) => e.target.select()}
            className="input"
            style={{ flex: 1, minWidth: 0, padding: "14px 16px", border: "2.5px solid var(--ink)", borderRadius: 12, background: "#fff", fontSize: 14 }}
          />
          <button
            onClick={copy}
            className="btn-hero"
            style={{ flex: "none", minWidth: 110, padding: "0 20px", fontSize: 18, justifyContent: "center", boxShadow: "3px 3px 0 var(--coral)" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <span style={{ fontSize: 13 }}>Copy and send a link to your favorite person</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn teal" onClick={onPreview}>
          Preview as receiver
        </button>
        <button className="btn" onClick={onEdit}>
          Edit tape
        </button>
        <button className="btn" onClick={onNew}>
          Make a new one
        </button>
      </div>
    </main>
  );
}
