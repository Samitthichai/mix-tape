import type { Side } from "./mixtape";

/** Seconds the deck takes to swallow a tape. */
export const INSERT_SPEED = 1.1;

export interface PlayerState {
  inserted: boolean;
  moving: boolean;
  side: Side;
  idx: number;
  playing: boolean;
}

export const freshPlayer = (): PlayerState => ({ inserted: false, moving: false, side: "A", idx: -1, playing: false });
