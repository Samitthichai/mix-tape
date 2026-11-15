"use client";

import { useEffect } from "react";
import { MAX_TRACKS, embedOf, parseLink, type Mix, type Side } from "@/lib/mixtape";
import { TrackRows } from "./TrackRows";

export interface ModalState {
  side: Side;
  url: string;
  title: string;
  touched: boolean;
  loading: boolean;
  tried: boolean;
}

interface Props {
  modal: ModalState;
  mix: Mix;
  onClose: () => void;
  onSide: (s: Side) => void;
  onUrl: (u: string) => void;
  onAdd: () => void;
  removeTrack: (key: "a" | "b", i: number) => void;
}

export function RecordModal({ modal: md, mix, onClose, onSide, onUrl, onAdd, removeTrack }: Props) {
  const x = parseLink(md.url);
  const em = embedOf(x, false);
  const key = md.side === "A" ? "a" : "b";
  const bad = !x && (md.tried || md.url.trim().length > 8);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rec-title" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 id="rec-title" className="display" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--coral)",
                border: "2px solid var(--ink)",
                animation: "pulse-dot 1.2s ease-in-out infinite",
              }}
            />
            Record a song
          </h2>
          <button className="icon-btn" style={{ width: 36, height: 36 }} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow">Record onto</span>
          <div className="seg">
            <button onClick={() => onSide("A")} style={{ fontSize: 18, padding: 12, background: md.side === "A" ? "var(--teal)" : undefined }}>
              Side A · {mix.a.length}
            </button>
            <button onClick={() => onSide("B")} style={{ fontSize: 18, padding: 12, background: md.side === "B" ? "var(--butter)" : undefined }}>
              Side B · {mix.b.length}
            </button>
          </div>
        </div>

        <label className="field">
          <span className="eyebrow">YouTube or Spotify link</span>
          <input
            className="input"
            autoFocus
            value={md.url}
            onChange={(e) => onUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            placeholder="https://youtu.be/…  or  https://open.spotify.com/track/…"
            style={{ background: "#fff", fontSize: 14 }}
          />
          {x && (
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: 12,
                padding: "4px 10px",
                border: "1.5px solid var(--ink)",
                borderRadius: 999,
                background: x.p === "sp" ? "var(--teal)" : "var(--coral)",
              }}
            >
              ✓ {x.p === "yt" ? "YouTube" : "Spotify"} link{md.loading ? " · fetching title…" : md.title ? ` · ${md.title}` : ""}
            </span>
          )}
          {bad && <span style={{ fontSize: 12 }}>That doesn’t look like a YouTube or Spotify link.</span>}
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span className="eyebrow">Songs on side {md.side}</span>
            <span style={{ fontSize: 12 }}>
              {mix[key].length}/{MAX_TRACKS}
            </span>
          </div>
          <div style={{ background: "#fff", border: "2px solid var(--ink)", borderRadius: 12, maxHeight: 220, overflow: "auto", padding: "4px 0" }}>
            <TrackRows tracks={mix[key]} onRemove={(i) => removeTrack(key, i)} empty="Blank tape — paste a link and hit record." />
          </div>
        </div>

        {x && (
          <iframe
            src={em.src}
            title="Preview"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ width: "100%", aspectRatio: em.aspect, height: em.h, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--ink)" }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={onClose}>
            Done
          </button>
          <button className="btn-rec" style={{ opacity: x ? 1 : 0.45 }} onClick={onAdd}>
            Record to side {md.side}
          </button>
        </div>
      </div>
    </div>
  );
}
