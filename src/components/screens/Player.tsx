"use client";

import { embedOf, pad, parseLink, platformOf, type CassetteDesign, type Mix } from "@/lib/mixtape";
import { INSERT_SPEED, type PlayerState } from "@/lib/player";
import { PlayerDeck } from "../three/lazy";
import type { DeckKey } from "../three/PlayerDeck";
import { shareLine } from "./Share";

interface Actions {
  insert: () => void;
  eject: () => void;
  play: () => void;
  stop: () => void;
  step: (d: number) => void;
  flip: () => void;
  pick: (i: number) => void;
}

export function Player({ mix, design, player: s, actions }: { mix: Mix; design: CassetteDesign; player: PlayerState; actions: Actions }) {
  const cur = mix[s.side === "A" ? "a" : "b"];
  const track = s.idx >= 0 ? cur[s.idx] : null;
  const embed = embedOf(track ? parseLink(track.u) : null, true);
  const other = s.side === "A" ? "B" : "A";

  const keys: DeckKey[] = [
    { name: "Previous", label: "◀◀", onClick: () => actions.step(-1) },
    { name: "Play", label: "▶", onClick: actions.play, down: s.playing },
    { name: "Stop", label: "■", onClick: actions.stop },
    { name: "Next", label: "▶▶", onClick: () => actions.step(1) },
    { name: "Eject", label: "▲", onClick: actions.eject },
    { name: "Flip side", label: "A/B", onClick: actions.flip },
  ];

  const lcdTop = s.inserted
    ? s.moving
      ? "LOADING…"
      : `SIDE ${s.side}  ${pad(Math.max(s.idx + 1, cur.length ? 1 : 0))}/${pad(cur.length)}`
    : "NO TAPE";
  const lcdBottom = s.inserted
    ? track && s.playing
      ? track.t
      : cur.length
        ? "READY — PRESS ▶"
        : "SIDE IS BLANK"
    : "INSERT CASSETTE";

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "8px clamp(16px,4vw,40px) 80px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
        gap: 40,
        alignItems: "start",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", position: "relative" }}>
        <div style={{ width: "100%", aspectRatio: "560 / 700" }}>
          <PlayerDeck
            className="canvas-fill"
            design={design}
            title={mix.title}
            side={s.side}
            inserted={s.inserted}
            playing={s.playing}
            speed={INSERT_SPEED}
            keys={keys}
            lcdTop={lcdTop}
            lcdBottom={lcdBottom}
            onTapeClick={actions.insert}
          />
        </div>
        {!s.inserted && !s.moving && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <span
              className="fade"
              style={{
                padding: "6px 12px",
                background: "var(--ink)",
                color: "var(--cream)",
                borderRadius: 999,
                fontSize: 12,
                letterSpacing: ".06em",
              }}
            >
              Click the tape to put it in
            </span>
          </div>
        )}
        {/* keyboard / screen-reader access to the 3D transport keys */}
        <div className="sr-only" role="group" aria-label="Deck controls">
          {!s.inserted && <button onClick={actions.insert}>Insert tape</button>}
          {keys.map((k) => (
            <button key={k.name} onClick={k.onClick} aria-pressed={k.down}>
              {k.name}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {lcdTop} {lcdBottom}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="display" style={{ fontSize: "clamp(30px,3.6vw,44px)", lineHeight: 1.05 }}>
            {mix.title || "A mixtape for you"}
          </h1>
          <span style={{ fontSize: 13 }}>{shareLine(mix)}</span>
        </div>
        <div className="card" style={{ borderRadius: 16, boxShadow: "5px 5px 0 var(--ink)", overflow: "hidden" }}>
          <div className="side-head" style={{ background: s.side === "A" ? "var(--teal)" : "var(--butter)", padding: "12px 16px" }}>
            <span className="display" style={{ fontSize: 22, whiteSpace: "nowrap" }}>
              Side {s.side}
            </span>
            <button className="btn" style={{ padding: "7px 12px", fontSize: 12, borderRadius: 8 }} onClick={actions.flip}>
              Flip to side {other} ↻
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "6px 0" }}>
            {!cur.length && <div style={{ padding: 16, fontSize: 13 }}>Nothing recorded on this side.</div>}
            {cur.map((x, i) => {
              const p = platformOf(x.u);
              const active = s.idx === i;
              return (
                <button key={`${x.u}-${i}`} className="play-row" style={{ background: active ? "var(--butter)" : "#fff" }} onClick={() => actions.pick(i)}>
                  <span style={{ flex: "none", width: 22, fontSize: 12 }}>{active && s.playing ? "▶" : pad(i + 1)}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.t}</span>
                  <span className="plat" style={{ background: p.platBg }}>
                    {p.plat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {s.playing && embed.src && (
          <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 8, animationDuration: ".35s" }}>
            <span className="eyebrow">Now playing</span>
            <iframe
              key={embed.src}
              src={embed.src}
              title="Now playing"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                aspectRatio: embed.aspect,
                height: embed.h,
                border: "2.5px solid var(--ink)",
                borderRadius: 14,
                background: "var(--ink)",
              }}
            />
            <span style={{ fontSize: 12 }}>If it doesn’t start on its own, press play inside the player.</span>
          </div>
        )}
      </div>
    </main>
  );
}
