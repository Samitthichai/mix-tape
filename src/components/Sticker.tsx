import type { StickerKind } from "@/lib/mixtape";
import { STICKERS } from "@/lib/stickers";

/** 2D sticker artwork for buttons and pickers (same source art as the 3D textures). */
export function Sticker({ kind }: { kind: StickerKind }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      style={{ width: "100%", height: "100%", overflow: "visible", display: "block", filter: "drop-shadow(0 1.5px 1.5px rgba(0,0,0,.35))" }}
    >
      {STICKERS[kind].map((op, i) =>
        op.text ? (
          <text
            key={i}
            x={op.text.x}
            y={op.text.y}
            textAnchor="middle"
            style={{ fontFamily: "var(--display)", fontSize: op.text.size, fill: op.fill }}
          >
            {op.text.value}
          </text>
        ) : (
          <path
            key={i}
            d={op.d}
            fill={op.fill || "none"}
            stroke={op.stroke}
            strokeWidth={op.sw}
            strokeLinejoin="round"
            strokeLinecap={op.cap}
            paintOrder={op.strokeFirst ? "stroke" : undefined}
          />
        )
      )}
    </svg>
  );
}
