# FlyMascots — launch kit

Everything here is generated from the product itself. There are no mockups:
the stills and film frames come out of the real stage viewer
(`site/axo-stage.html`), the pipeline image is exported by the diagram's own
menu, and every film cut sits on a measured bar of a licensed track.

```
marketing/
  design.md               the design system the kit was built to
  copy/                   all launch copy (positioning, cards, social)
  stills/
    cards.html            one card per section; ?card=<name> selects it
    render.sh             headless Chrome, 2×, → out/
    media/                source stills (viewer captures, pipeline export)
      media/2x/           2000×2000 mood captures for card exports
    out/                  rendered cards (launch, OG, thumbnails, cover)
  videos/                 Remotion project — the two cuts, both formats
    src/film/timeline.ts  the bar grid and the scene map
    src/film/Film.tsx     the scenes
    public/               mascot frame sequences, music, SFX, pipeline still
  renders/                film masters + posters + QC sheets
  sound/
    music/                licensed track used by the cuts (grid in plots/)
    sfx/                  CC0 effects, trimmed + normalised
    LICENSES.md           every audio file, its source and licence
  tools/                  capture + render tooling (see below)
```

## The films

| File | Cut | Format | Length |
| --- | --- | --- | --- |
| `renders/flymascots-reel-16x9.mp4` | launch reel | 1920×1080 | 24.000 s |
| `renders/flymascots-reel-9x16.mp4` | launch reel | 1080×1920 | 24.000 s |
| `renders/flymascots-story-16x9.mp4` | story cut | 1920×1080 | 34.133 s |
| `renders/flymascots-story-9x16.mp4` | story cut | 1080×1920 | 34.133 s |

Music: *Close Up* (Mixkit 1167) — 105.46875 BPM, beat 0.5689 s, bar 2.2756 s,
measured with librosa (`sound/plots/`). Every cut is `round(bar × fps)`;
events land on the beat. SFX are CC0 and normalised; licences in
`sound/LICENSES.md`.

Scene map (reel): `hook · reveal · blink · work · think · celebrate · sleep ·
mood map · verification · install · brand`. The story cut adds the process
diagram, the five platforms, and a two-bar install + brand close.

## Regenerating everything

```bash
# 1. rebuild the viewer from its sources
node marketing/tools/build-stage.mjs

# 2. stills + pipeline (needs Google Chrome)
node marketing/tools/capture-pipeline.mjs
node marketing/tools/capture-moods.mjs            # 1000², README strip
node marketing/tools/capture-moods.mjs marketing/stills/media/2x 0 2   # 2000², cards
node marketing/tools/capture-hero.mjs

# 3. film footage — deterministic frame seeks of the same viewer
node marketing/tools/capture-frames.mjs           # ~810 PNGs, transparent bg

# 4. films
cd marketing/videos
mkdir -p public/music public/sfx public/pipeline
cp ../sound/music/close-up.mp3 public/music/
cp ../sound/sfx/*.wav public/sfx/
cp ../stills/media/pipeline-light.png public/pipeline/
npm i                                             # remotion 4.0.474 (see package.json)
npx remotion render src/index.ts Reel-Wide   ../renders/flymascots-reel-16x9.mp4  --crf=18
npx remotion render src/index.ts Reel-Vertical ../renders/flymascots-reel-9x16.mp4 --crf=18
npx remotion render src/index.ts Story-Wide  ../renders/flymascots-story-16x9.mp4 --crf=18
npx remotion render src/index.ts Story-Vertical ../renders/flymascots-story-9x16.mp4 --crf=18
cd ../..

# 5. sound pass (two-pass loudnorm on the exported MP4s) + QC extractions
python3 marketing/tools/sound-pass.py
bash marketing/tools/qc-films.sh

# 6. cards
bash marketing/stills/render.sh
```

`marketing/videos/public/` (the frame sequences, plus the generated copies of
music, SFX and the diagram still) and `marketing/videos/out/` are generated —
they are gitignored and rebuilt by steps 3–4. The videos in `renders/` and the
cards in `stills/out/` are committed: they are the deliverables.

## QC results (last pass)

- Duration, video stream: 24.000 s / 34.133 s exactly.
- Loudness, measured on the exported MP4s (`ffmpeg ebur128`):
  reel −16.5 LUFS, true peak −4.0 dBFS; story −16.4 LUFS, −4.6 dBFS
  (target ≈ −16 LUFS, peaks under −4). Full report:
  `renders/sound-pass-measurements.json`.
- Flipbook + boundary frames: `renders/qc/` — the reel read as a book
  (one still every 0.8 s) and the first frames of every scene by number.
- Cards: rendered at 2× (e.g. 3200×1800 for the 16:9 launch card).

## Notes

- The viewer is the single source of truth for the character: poses come from
  the shipped engine, materials were sampled from the reference render, and
  `capture=1` freezes the sim deterministically (`resetFilm` + `seekTo`) so a
  frame in a film can be reproduced exactly.
- Sleep is a stage feature (`blinkhold` holds a blink closed for a readable
  beat); the other four poses are the engine's shipped values.
- The launch card uses `media/hero-card.png`, a crop of the real viewer with
  its mood pills.
