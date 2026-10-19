# FlyMascots — marketing design system

Derived from the product itself: the Axo stage (cream studio, mint vinyl,
lavender glass) is the brand. Every asset in this kit is generated from the
real viewer at `site/axo-stage.html` and the real pipeline diagram — no
mockups, no invented UI.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#F6F1E7` | film and card background (warm studio) |
| `snow` | `#FFFEFB` | stage highlight, terminal text on dark |
| `ink` | `#15241F` | text, dark sections, buttons |
| `ink-soft` | `rgba(21,36,31,.62)` | secondary copy, captions |
| `ink-faint` | `rgba(21,36,31,.34)` | mono micro-labels, rules |
| `mint` | `#2AB5A2` | accent — dots, marks, cursor, chips |
| `mint-deep` | `#0F7D6F` | accent text on light, link color |
| `lavender` | `#B7BAE0` | the visor — used sparingly as the "glass" accent |
| `sand` | `#EDE4D3` | soft button fill, card wells |
| `hairline` | `rgba(21,36,31,.10)` | 1px borders |

Mascot palette is fixed by the reference render: body `#7DD1C3`, belly
`#F4F0E8`, accents `#41CBB7`, visor/lenses `#B7BAE0`, eyes `#0B0B12`.

## Type

- Display / UI: `-apple-system, "SF Pro Display"` — Semibold 600 for
  headlines and wordmark, Medium 500 for captions.
- Mono: `"SF Mono", ui-monospace` — commands, state readouts, micro-labels.
- Micro-labels: 10–12 px, `letter-spacing: .16–.24em`, uppercase, `ink-faint`.
- Headlines: 64–132 px on 1920 wide, line-height 1.02, tracking −0.02em.
- No serif anywhere. No more than two type sizes per scene.

## Space & shape

- 8 px base grid; film margins 120 px (16:9) / 88 px (9:16).
- Radii: pills `999px`, cards `28px`, terminal `20px`.
- Shadows: one soft ambient per surface,
  `0 60px 120px -50px rgba(21,36,31,.35)`; never stacked.
- Rules: 1px hairlines only.

## Motion

- Springs, never lerps: Remotion `spring({ damping: 12–14, stiffness: 90–120 })`.
- Entrances pop on the beat; nothing fades in slower than 12 frames.
- Screen text: 2-line stagger of 8–9 frames, 24–40 px rise, opacity snap.
- Mascot motion comes from the real stage footage (30 fps, engine springs).
- One texture move per film: dark "proof" section (ink background).

## Voice

Short declarative lines. No hype adjectives. Real, checkable claims only —
moods, springs, platforms, verification commands. See
`../skills/flymascots/` for the source of every claim.

## Film storyboards

Both cuts share one beat grid from `sound/music/close-up.mp3`
(105.469 BPM → beat 0.5689 s, bar 2.2756 s).

**Launch reel — 24.0 s (720 @ 30fps), cuts on bars:**
`hook → reveal → blink → work → think → celebrate → sleep → mood map
→ verification → install → brand`

**Story cut — 34.1 s (1024 frames):** same spine, slower: adds the process
diagram, the five platforms, and a two-bar install and brand close.

## Asset map (all generated, nothing hand-drawn)

| Asset | Source |
| --- | --- |
| stage stills + mood strip | `site/axo-stage.html` via `marketing/tools/capture-*.mjs` |
| film mascot footage | same viewer, deterministic frame seeks |
| pipeline stills | `diagrams/mascot-pipeline.html` own SVG export |
| films | `marketing/videos` (Remotion), footage + music + SFX |
| cards | `marketing/stills/cards.html` rendered headless |
