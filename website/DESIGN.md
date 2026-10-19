# FlyMascots — landing page design system v2

This page will become the real app's front door. Decisions here are made to
survive that transition: neutral surfaces, one accent, product-first.

## Color

Light mode leaves the all-cream page (it flattened the mascot into its own
background) for a cool porcelain that makes the warm-cream character pop:

| Token | Value | Role |
| --- | --- | --- |
| porcelain | `#F3F6F5` | page (cool, faint mint cast) |
| snow | `#FFFFFF` | surfaces |
| pine | `#10201B` | text (deep, brand-green undertone) |
| mint | `#1FA893` / bright `#2AB5A2` | accent + interactive |
| mint-deep | `#0E7A6B` | links / accent text on light |
| tile | `#F7F2E9` | the mascot's warm studio cream — every mood loop is filmed on it |

Dark mode drops the green-black the client rejected for neutral graphite
with a blue-slate tint (true greys read dead on screens):

| Token | Value | Role |
| --- | --- | --- |
| graphite | `#141719` | page |
| slate-800 | `#1C2124` | surfaces |
| frost | `#E9EDEE` | text |
| mint-bright | `#3FD2BD` | accent on dark |

The only green anywhere in dark mode is the mascot and the accent — never
the background. Depth comes from the real 3D lighting and a single soft
spotlight, not gradient decoration or glass panels.

## Type

System SF Pro, sentence case everywhere. No uppercase eyebrows, no
decorative labels, no arrows glued to links. Monospace appears only on real
commands and measured numbers — data, not ornament.

## Layout (mobile-first)

- 360 → base. Breakpoints at 640 / 960 / 1180.
- Hero: centered stack on mobile; split (copy left, mascot right) from 960,
  both fully inside the first viewport.
- The mascot is **unframed**: the stage iframe is bare + transparent, so the
  character stands on the page's own spotlight. No card inside a card, no
  nested viewer chrome.
- Mood tiles: warm studio loops (real captures of the viewer) — horizontal
  snap row on mobile, five-up grid from 1180. In dark mode they read as
  lightbox portraits on a dark wall.

## Motion

One orchestrated moment: the hero settles in on load (copy rises once,
mascot fades up, controls arrive last). After that the page is still —
sections do not fade-slide as you scroll. Motion belongs to the mascot:
the live 3D hero (breathing, blinking, gaze following your pointer) and
the five mood loops. `prefers-reduced-motion` gets everything static.

## Icon

The goggles: two separated mint lens rings with a bridge on a graphite
tile — the accessory that drops when the mascot gets to work. Designed
small-size-first; legible at 16px. Dark surfaces get the inverted tile
(mint tile, ink goggles).
