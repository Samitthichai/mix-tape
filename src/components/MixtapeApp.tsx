"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_STICKERS,
  MAX_TRACKS,
  blankMix,
  decodeMix,
  designOf,
  encodeMix,
  fetchTitle,
  parseLink,
  type Mix,
  type PlacedSticker,
  type Side,
  type StickerKind,
} from "@/lib/mixtape";
import { INSERT_SPEED, freshPlayer, type PlayerState } from "@/lib/player";
import { Home } from "./screens/Home";
import { Create } from "./screens/Create";
import { Share } from "./screens/Share";
import { Gift } from "./screens/Gift";
import { Player } from "./screens/Player";
import { RecordModal, type ModalState } from "./screens/RecordModal";

export type Screen = "home" | "create" | "share" | "gift" | "player";

const AUTOPLAY = true;
const DRAFT_KEY = "mixtape-draft";

export default function MixtapeApp() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [mix, setMixState] = useState<Mix>(blankMix);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [lastSide, setLastSide] = useState<Side>("A");
  const [err, setErr] = useState("");
  const [link, setLink] = useState("");
  const [player, setPlayer] = useState<PlayerState>(freshPlayer);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const titleTok = useRef(0);
  const mixRef = useRef(mix);
  const playerRef = useRef(player);
  useEffect(() => {
    mixRef.current = mix;
    playerRef.current = player;
  }, [mix, player]);

  /* ---------- boot: shared link or saved draft ----------
     Read after hydration because the URL hash and localStorage only exist in the browser. */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const readHash = () => {
      const m = (location.hash || "").match(/tape=([^&]+)/);
      return m ? decodeMix(m[1]) : null;
    };
    const shared = readHash();
    if (shared) {
      setMixState(shared);
      setScreen("gift");
    } else {
      try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (d) setMixState({ ...blankMix(), ...d });
      } catch {
        /* ignore corrupt drafts */
      }
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // a tape link pasted into an already-open tab only changes the hash
    const onHash = () => {
      const tape = readHash();
      if (!tape) return;
      setMixState(tape);
      setPlayer(freshPlayer());
      setScreen("gift");
    };
    window.addEventListener("hashchange", onHash);
    const all = timers.current;
    return () => {
      window.removeEventListener("hashchange", onHash);
      all.forEach(clearTimeout);
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const setMix = useCallback((p: Partial<Mix> | ((m: Mix) => Partial<Mix>)) => {
    setMixState((m) => {
      const next = { ...m, ...(typeof p === "function" ? p(m) : p) };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
      return next;
    });
    setErr("");
  }, []);

  const go = (s: Screen, resetPlayer = false) => {
    if (resetPlayer) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPlayer(freshPlayer());
    }
    setScreen(s);
    window.scrollTo(0, 0);
  };

  /* ---------- recording ---------- */
  const openModal = (side: Side) => setModal({ side, url: "", title: "", touched: false, loading: false, tried: false });

  const onUrl = (url: string) => {
    setModal((md) => (md ? { ...md, url } : md));
    const x = parseLink(url);
    if (!x || modal?.touched) return;
    const tok = ++titleTok.current;
    setModal((md) => (md ? { ...md, loading: true } : md));
    fetchTitle(url, x).then((title) => {
      if (tok !== titleTok.current) return;
      setModal((md) => (md ? { ...md, loading: false, title: md.touched ? md.title : title || md.title } : md));
    });
  };

  const addTrack = () => {
    const md = modal;
    if (!md) return;
    const x = parseLink(md.url);
    if (!x) {
      setModal({ ...md, tried: true });
      return;
    }
    const key = md.side === "A" ? "a" : "b";
    if (mix[key].length >= MAX_TRACKS) {
      setModal(null);
      setErr(`Side ${md.side} is full (${MAX_TRACKS} songs).`);
      return;
    }
    const u = md.url.trim();
    const pending = !md.title.trim();
    const t = md.title.trim() || (x.p === "yt" ? "YouTube track" : "Spotify track");
    setMix((m) => ({ [key]: [...m[key], { t, u }] }));
    titleTok.current++;
    setModal({ ...md, url: "", title: "", touched: false, loading: false, tried: false });
    setLastSide(md.side);
    if (pending)
      fetchTitle(u, x).then((title) => {
        if (title) setMix((m) => ({ [key]: m[key].map((tr) => (tr.u === u ? { ...tr, t: title } : tr)) }));
      });
  };

  const removeTrack = (key: "a" | "b", i: number) => setMix((m) => ({ [key]: m[key].filter((_, j) => j !== i) }));

  /* ---------- stickers ---------- */
  const [sel, setSel] = useState<number | null>(null);
  const addSticker = (k: StickerKind) => {
    const list = mix.stickers;
    if (list.length >= MAX_STICKERS) return;
    const id = list.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    const st: PlacedSticker = {
      id,
      k,
      x: +(20 + Math.random() * 60).toFixed(1),
      y: +(14 + Math.random() * 20).toFixed(1),
      r: Math.round(Math.random() * 30 - 15),
      s: 1,
    };
    setMix({ stickers: [...list, st] });
    setSel(id);
  };
  const updSel = (fn: (s: PlacedSticker) => PlacedSticker) => {
    if (sel == null) return;
    setMix((m) => ({ stickers: m.stickers.map((s) => (s.id === sel ? fn(s) : s)) }));
  };
  const moveSticker = useCallback(
    (id: number, x: number, y: number) => setMix((m) => ({ stickers: m.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)) })),
    [setMix]
  );

  /* ---------- share ---------- */
  const finish = () => {
    if (!mix.a.length && !mix.b.length) {
      setErr("Record at least one song first.");
      return;
    }
    setLink(location.href.split("#")[0] + "#tape=" + encodeMix(mix));
    go("share");
  };

  /* ---------- player ---------- */
  const tracksOf = (side: Side) => mixRef.current[side === "A" ? "a" : "b"];

  /** The tape settles once the door has shut; autoplay kicks in then. */
  const land = (force: boolean) =>
    later(() => {
      setPlayer((s) => {
        const play = (force || AUTOPLAY) && tracksOf(s.side).length > 0;
        return { ...s, moving: false, ...(play ? { playing: true, idx: s.idx < 0 ? 0 : s.idx } : {}) };
      });
    }, INSERT_SPEED * 1000);
  const insert = (force = false) => {
    const p = playerRef.current;
    if (p.inserted || p.moving) return;
    setPlayer((s) => ({ ...s, inserted: true, moving: true }));
    land(force);
  };
  const eject = () => {
    const p = playerRef.current;
    if (!p.inserted || p.moving) return;
    setPlayer((s) => ({ ...s, inserted: false, playing: false }));
  };
  const play = () => {
    const p = playerRef.current;
    if (!p.inserted) return insert(true);
    if (p.moving || !tracksOf(p.side).length) return;
    setPlayer((s) => ({ ...s, playing: true, idx: s.idx < 0 ? 0 : s.idx }));
  };
  const step = (d: number) => {
    const p = playerRef.current;
    const n = tracksOf(p.side).length;
    if (!p.inserted || p.moving || !n) return;
    setPlayer((s) => ({ ...s, idx: ((s.idx < 0 ? 0 : s.idx) + d + n) % n, playing: true }));
  };
  const flip = () => {
    const p = playerRef.current;
    if (p.moving) return;
    const wasIn = p.inserted;
    setPlayer((s) => ({ ...s, inserted: false, playing: false, moving: true }));
    later(() => {
      setPlayer((s) => ({ ...s, side: s.side === "A" ? "B" : "A", idx: -1 }));
      later(() => {
        setPlayer((s) => ({ ...s, inserted: wasIn, moving: wasIn }));
        if (wasIn) land(false);
      }, 700);
    }, wasIn ? INSERT_SPEED * 800 : 0);
  };
  const pick = (i: number) => {
    const p = playerRef.current;
    if (!p.inserted) {
      setPlayer((s) => ({ ...s, idx: i }));
      insert(true);
      return;
    }
    if (p.moving) return;
    setPlayer((s) => ({ ...s, idx: i, playing: true }));
  };
  const stop = () => setPlayer((s) => ({ ...s, playing: false }));

  const design = designOf(mix);
  const stepIdx = screen === "share" ? 2 : 0;

  return (
    <div className="page">
      <header className="header">
        <button className="logo" onClick={() => go("home", true)}>
          <span className="logo-mark" aria-hidden>
            <span />
            <span />
          </span>
          Mixtape
        </button>
        {(screen === "create" || screen === "share") && (
          <div className="steps">
            {["1 · Record", "2 · Note", "3 · Send"].map((label, i) => (
              <span
                key={label}
                style={{
                  background: stepIdx === 2 ? (i === 2 ? "var(--coral)" : "var(--teal)") : i < 2 ? "var(--butter)" : "transparent",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </header>

      {ready && screen === "home" && <Home onStart={() => go("create")} />}

      {ready && screen === "create" && (
        <Create
          mix={mix}
          design={design}
          err={err}
          previewSide={modal ? modal.side : lastSide}
          sel={sel}
          setSel={setSel}
          setMix={setMix}
          addSticker={addSticker}
          moveSticker={moveSticker}
          rotate={(d) => updSel((x) => ({ ...x, r: x.r + d }))}
          resize={(d) => updSel((x) => ({ ...x, s: Math.min(2.4, Math.max(0.5, +(x.s + d).toFixed(1))) }))}
          peel={() => {
            setMix((m) => ({ stickers: m.stickers.filter((x) => x.id !== sel) }));
            setSel(null);
          }}
          clearStickers={() => {
            setMix({ stickers: [] });
            setSel(null);
          }}
          openModal={openModal}
          removeTrack={removeTrack}
          finish={finish}
        />
      )}

      {ready && screen === "share" && (
        <Share
          mix={mix}
          design={design}
          link={link}
          onPreview={() => go("gift", true)}
          onEdit={() => go("create")}
          onNew={() => {
            setMix(blankMix());
            setLink("");
            go("create");
          }}
        />
      )}

      {ready && screen === "gift" && <Gift mix={mix} design={design} onListen={() => go("player", true)} />}

      {ready && screen === "player" && (
        <Player
          mix={mix}
          design={design}
          player={player}
          actions={{ insert: () => insert(), eject, play, stop, step, flip, pick }}
        />
      )}

      {modal && (
        <RecordModal
          modal={modal}
          mix={mix}
          onClose={() => setModal(null)}
          onSide={(side) => setModal({ ...modal, side })}
          onUrl={onUrl}
          onAdd={addTrack}
          removeTrack={removeTrack}
        />
      )}
    </div>
  );
}
