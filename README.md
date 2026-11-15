# Mixtape

Record a mixtape of YouTube and Spotify songs, decorate the cassette, and send it as a link.
Built from the Claude Design file `Mixtape.dc.html` with Next.js and Three.js (React Three Fiber).

## Run

```bash
npm install
npm run dev
```

## Flow

1. **Home** – a floating 3D cassette you can drag around.
2. **Create** – name the tape, write a note, record songs to side A/B, pick shell colour, finish (solid/translucent), label and pen, and drag stickers directly on the 3D cassette.
3. **Share** – copy a link. The whole mixtape is encoded in the URL hash (`#tape=…`), so there is no backend.
4. **Gift** – what the receiver sees: the note and the cassette.
5. **Player** – a 3D cassette deck. Click the tape to load it: the door swings open, the tape seats in it, the door shuts and the deck clunks. Piano keys (◀◀ ▶ ■ ▶▶ ▲ A/B) drive playback; flipping ejects the tape, turns it over to side B and reloads it.

## Code map

- `src/lib/mixtape.ts` – types, link encoding, YouTube/Spotify parsing.
- `src/lib/draw.ts` – canvas painters for the cassette face, reels, deck plate, LCD, door and keys.
- `src/lib/stickers.ts` – sticker artwork shared by the SVG picker and the 3D textures.
- `src/components/three/` – `Cassette3D`, `CassetteStage` (hero), `CassetteStudio` (sticker editor), `PlayerDeck`.
- `src/components/screens/` – the five screens and the record dialog.
