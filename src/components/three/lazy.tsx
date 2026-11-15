"use client";

import dynamic from "next/dynamic";

const Loading = () => <div className="three-placeholder">Loading tape…</div>;

/* WebGL scenes only exist in the browser. */
export const CassetteStage = dynamic(() => import("./CassetteStage"), { ssr: false, loading: Loading });
export const CassetteStudio = dynamic(() => import("./CassetteStudio"), { ssr: false, loading: Loading });
export const PlayerDeck = dynamic(() => import("./PlayerDeck"), { ssr: false, loading: Loading });
