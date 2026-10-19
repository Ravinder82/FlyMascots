# Sound — licenses

All audio in this folder is cleared for commercial use. No track here is
AI-generated: every file is a real recording with a documented license,
downloaded once and frozen (path, size, SHA-256) so a re-render is
byte-reproducible.

## Music

| File | Track | Artist | Source | License |
| --- | --- | --- | --- | --- |
| `music/close-up.mp3` | Close Up | Michael Ramir C. | [Mixkit](https://mixkit.co/free-stock-music/) (id 1167) | Mixkit Stock Music Free License — free for commercial use, no attribution required |
| `music/infinity-alt.mp3` | Infinity | Arulo | [Mixkit](https://mixkit.co/free-stock-music/) (id 440) | Mixkit Stock Music Free License (alternate, not used in the cuts) |

Grid (measured with `librosa` 1.0, full analysis in `plots/closeup/`):

- 105.469 BPM, beat = 0.56888 s, bar (4/4) = 2.27552 s
- kick peaks sit on the beat grid; measured median offset `+0.046 s`,
  applied to the grid before the edits were built (`plots/grid-1167.json`).

Twelve candidate tracks were auditioned; the two above are the ones kept.
The candidate downloads were cleaned up after the cuts were frozen (the
measured grids stay in `plots/` for provenance).

## Sound effects

All from [Freesound](https://freesound.org), all **CC0 1.0 (public domain)** —
no attribution required, documented anyway. Files were trimmed of leading
silence and loudness-normalized to −18 LUFS (True peak ≤ −6 dBTP) via
`ffmpeg loudnorm`.

| File | Source | Freesound ID | License |
| --- | --- | --- | --- |
| `sfx/whoosh-soft.wav` | "Stick - Whoosh 7 (Soft)" | 802465 | CC0 1.0 |
| `sfx/pop.wav` | "The Best Bubble Pop Sound For Game and UI" | 669918 | CC0 1.0 |
| `sfx/click-coarse.wav` | "Coarse Click_Minimal UI Sounds" | 370845 | CC0 1.0 |
| `sfx/clack.wav` | "Clack_Minimal UI Sounds" | 370849 | CC0 1.0 |
| `sfx/riser-subtle.wav` | "Cinematic Riser #3 subtle" | 859482 | CC0 1.0 |
| `sfx/impact-soft.wav` | "soft-hit.wav" | 653910 | CC0 1.0 |
| `sfx/chime.wav` | "Bubbling Water Notification – UI Alert" | 844241 | CC0 1.0 |

Raw downloads are kept in `sfx/raw/` for provenance.
