"use client";

import { useEffect, useState } from "react";
import { FONT } from "./fonts";

let ready = false;
let pending: Promise<void> | null = null;

function loadFonts() {
  if (!pending) {
    pending = Promise.all([
      document.fonts.load(`20px ${FONT.display}`),
      document.fonts.load(`20px ${FONT.marker}`),
      document.fonts.load(`20px ${FONT.mono}`),
      document.fonts.load(`500 20px ${FONT.mono}`),
    ])
      .catch(() => undefined)
      .then(() => {
        ready = true;
      });
  }
  return pending;
}

/** Canvas text can only use web fonts once they are loaded; textures redraw when this flips. */
export function useFontsReady() {
  const [ok, setOk] = useState(ready);
  useEffect(() => {
    if (ok) return;
    let alive = true;
    loadFonts().then(() => alive && setOk(true));
    return () => {
      alive = false;
    };
  }, [ok]);
  return ok;
}
