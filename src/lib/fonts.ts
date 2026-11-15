import { DM_Mono, Fascinate, Permanent_Marker } from "next/font/google";

export const fascinate = Fascinate({ weight: "400", subsets: ["latin"], variable: "--font-display" });
export const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker" });
export const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

/** Font stacks usable directly in canvas `ctx.font` strings. */
export const FONT = {
  display: fascinate.style.fontFamily,
  marker: marker.style.fontFamily,
  mono: dmMono.style.fontFamily,
};
