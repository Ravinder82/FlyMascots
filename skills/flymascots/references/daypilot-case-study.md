# DayPilot Case Study — "Axo" (the reference implementation)

How this skill was proven: the Cyber Axolotl mascot added to the DayPilot macOS app (Oct 2026), from raw MascotForge export to shipped, spring-animated, mood-synced character.

## What the user provided (raw inputs)

| Input | Path |
|---|---|
| Mascot model | `axo.glb` (1.5 MB, SHA pinned in project docs) |
| Source runtime | `mascot-engine.js` (531 lines: `BAKED_MASCOT_CONFIG`, `buildProceduralMascot()`, studio lighting, pose values) |
| TS variant | `daypilot_mascot.ts` |
| Quality bar | Studio render PNGs from the creator tool + "clone pixel by pixel same" |
| Behavior spec | idle / play(goggles ON eyes) / pause(goggles UP forehead) / stop(thinking); "physics of hands, movement, expressions, accessories — make it feel alive"; hands must never vanish |

## Files that were used (all in DayPilot repo)

| File | What it does |
|---|---|
| `Sources/App/Views/3D/GLBLoader.swift` | Zero-dependency GLB → SceneKit reader. **Carries the glTF column-major → SceneKit row-vector transpose** — without it every mood rendered wrong. |
| `Sources/App/Views/3D/AxoMascot.swift` | The character: pivot rig (`bodyRoot, headPivot, gogglesPivot, leftArmPivot, rightArmPivot, eyesGroup`), materials (0 primary, 1 belly, 2 accent, 3 eye, 4 visor, 5–6 catchlights), `MascotMood` enum (idle/working/think/sleep/celebrate), spring system (substep `h=1/120`), tick loop, breathing, blink, gaze saccades, `animationDebugState()`, `pivotsFinite()`, `AxoStageView.buildScene`, studio environment, contact shadow (`ShadowDeck`). |
| `Sources/App/Views/ReportEditorView.swift` | Free-floating SwiftUI overlay: `AxoStageView` 195×195 (bumped +30% from 150), `.allowsHitTesting(false)` — floats over every debrief's report area. |
| `Sources/App/AppModel.swift` | The mood sync: start/resume→`.working`, pause→`.idle`, stop→`.think`, quit-while-tracking→`.celebrate`. |
| `Resources/axo.glb` | The asset, local-only. |
| `Sources/App/Views/MainWindowView.swift` | (Adjacent UI fix in same era: title-bar status pill `fixedSize` overflow fix.) |

## What happened, in order

1. Chrono (old mascot) deleted — zero external SwiftPM deps; custom GLB loader built after the matrix-convention bug.
2. Rig discovered by listing GLB nodes; pivots/materials recorded (step 3 of the workflow).
3. First port: pose values from engine.js applied by lerp — worked, felt dead.
4. **Spring rewrite:** damped semi-implicit springs (goggle k120/d15, arms k90/d12, head k70/d11, 120 Hz substeps) + mood-change boop `+0.22·k` — state changes got a physical bounce.
5. Ambient life added: breathing scale, randomized blink 2.8–5.4 s with double bursts, gaze saccades.
6. **Field fixes (each caught by render→compare→assert):**
   - Vanishing hands: celebrate arm `+0.55` had swung *inside* the torso → outward wave `−0.62±0.16`, test asserts `< −0.40`.
   - Goggles tunneled through the head mid-sweep → arc-lift `sin(progress·π)·0.16`.
   - `simdRotation` debug values made no sense → assert eulers instead.
   - Size: 150→195 px overlay (+30%) chosen over camera zoom (zoom caused clipping/levitation).
7. Verification: `moodtest` 9/9 (incl. 60-transition NaN/vanish check), pose renders for every mood through the production scene-builder, live window capture, `make selftest` 8/8, install to `/Applications`.

## Debug/test API the harness relies on

- `animationDebugState()` → mood, goggle position, arm/head eulers, eye scaleY, hop.
- `pivotsFinite()` → NaN/∞ guard for rapid-cycling health checks.
- These are the pattern to replicate in every new mascot class.

## Repo hygiene notes (DayPilot-specific)

- `make build / selftest / install / run` targets all kept; `make install` needs the app quit; never ad-hoc sign; never `--stress-test`/`--integration-test` with a Keychain key.
- Session cleanup operations (purging `session_events`, moving reports to `Reports/Trash/`) were separate app-maintenance tasks — not part of the mascot pipeline.
