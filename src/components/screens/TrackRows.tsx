import { pad, platformOf, type Track } from "@/lib/mixtape";

export function TrackRows({ tracks, onRemove, empty }: { tracks: Track[]; onRemove: (i: number) => void; empty: string }) {
  if (!tracks.length) return <div style={{ padding: 14, fontSize: 13 }}>{empty}</div>;
  return (
    <>
      {tracks.map((x, i) => {
        const p = platformOf(x.u);
        return (
          <div className="track" key={`${x.u}-${i}`}>
            <span style={{ fontSize: 12, flex: "none" }}>{pad(i + 1)}</span>
            <span className="t" title={x.t}>
              {x.t}
            </span>
            <span className="plat" style={{ background: p.platBg }}>
              {p.plat}
            </span>
            <button className="x" aria-label={`Remove ${x.t}`} onClick={() => onRemove(i)}>
              ×
            </button>
          </div>
        );
      })}
    </>
  );
}
