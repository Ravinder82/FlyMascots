---
name: ai-mascot-creator
description: "Build and ship a hyper-quality animated mascot in any project — from a mascot idea, static image, or MascotForge Pro GLB + mascot-engine.js export, through asset creation, platform integration (website Three.js, macOS/iOS Swift/SceneKit, React Native/Expo, static blog, Electron), spring-physics animation, app-state mood syncing, offline render verification, and pixel-by-pixel reference matching. Use this skill when the user says: add a mascot to my app, website, or blog; create a mascot from an idea or image; port a MascotForge GLB export; make the mascot feel alive with hands, expressions and accessories; sync mascot moods with app states; clone my mascot reference exactly. Every run must end with an @archify process diagram."
---
# AI Mascot Creator

Take a mascot from nothing — an idea, a static image, or a MascotForge Pro export — to a live, high-definition character whose states are synced with the host app. Proven on Axo (DayPilot, macOS/SceneKit); the other four platform adapters are documented variants of the same pipeline. Port the source engine's exact pose values, drive them with springs (never lerps), verify with an offline harness, and finish every run with an @archify diagram of this project's mascot pipeline.

## When to Use

- "Add/create a mascot for `<project>`" — whether the user holds an idea, a static image, a `.glb`, or a `mascot-engine.js`.
- "Make the mascot feel alive" — physics of hands, movement, expressions, accessories.
- "Sync/bind the mascot to app states" — mood ↔ state mapping.
- "Clone this mascot reference pixel by pixel" — quality-matching iteration.
- Mentions of: Axo, MascotForge, mascot-engine.js, mascot moods, goggles, a mascot that must never vanish.

## Workflow

1. **Intake — ask, never assume.** (a) Which target platforms? (b) What are the host app's semantic states, and which mascot mood maps to each — the user owns this mapping. (c) What exists already: idea / static image / GLB + engine.js? (d) Where are the reference renders that define "good"? (e) Placement and size (e.g. free-floating overlay, click-through, ≥30% bigger than first draft). Record answers before writing code.
2. **Choose the creation route.**
   - **Route A — MascotForge Pro export** (`<mascot>.glb` + `mascot-engine.js`): the proven Axo path. The engine file holds the exact pose table, baked config, and studio lighting to port.
   - **Route B — from idea or static image:** invoke `@ai-3d-mascot-studio` (img2threejs pipeline) to sculpt a procedural Three.js mascot.
   - Platforms can split the routes (web = Route B code, native = Route A GLB). For Swift/SceneKit the asset must end as a GLB — if only an image exists, ask the user to run their MascotForge Pro export or an GLB export, then continue with Route A mechanics.
3. **Inventory the asset before coding.** List GLB nodes/pivots and material slots, pin the file hash, and copy engine.js's pose targets into a project reference doc. Example (Axo): pivots `bodyRoot, headPivot, gogglesPivot, leftArmPivot, rightArmPivot, eyesGroup`; materials `0 primary, 1 belly, 2 accent, 3 eye, 4 visor, 5–6 catchlights`.
4. **Integrate the platform adapter** from `references/platforms.md` (web embed, Swift/SceneKit DayPilot pattern, RN/Expo, static blog, Electron). Assets stay local (`Resources/`, `assets/`); zero external runtime dependencies unless the user approves one.
5. **Animate with springs, not lerps.** Port the engine's targets exactly (working goggle drop `0.44`, think chin-hand arm `−0.78`, sleep eyes `0.08`, celebrate wave `−0.62±0.16`). Damped semi-implicit springs substepped at 120 Hz — start `k120/d15` goggles, `k90/d12` arms, `k70/d11` head. Add mood-change boop impulse, breathing scale, randomized blink (2.8–5.4 s with double bursts), gaze saccades, and arc-lifts on any accessory that sweeps across the body so it never clips. Hands must never vanish: keep arms outside the torso shell and assert it numerically. Full recipes: `references/animation-physics.md`.
6. **Sync moods with the host.** One mood enum, one call-site list — DayPilot: start/resume→working, pause→idle, stop→think, quit-while-tracking→celebrate. Every new app state gets a binding and a mood test.
7. **Verify before showing the user** (`references/verification.md`): an offline harness compiled from the same sources as the app; numeric per-mood assertions; a 60-transition NaN/vanish health check; snapshots taken through the production scene-builder with anti-blink retry; pose renders compared side-by-side with the user's reference images; live window capture.
8. **MANDATORY — diagram with @archify.** Invoke `@archify` and produce a workflow (or architecture) diagram of THIS project's mascot pipeline — intake → asset → integration → animation → verification → sync — in `.archify/workflow-<slug>-<timestamp>/`, then deliver the clickable HTML link. Regenerate whenever the pipeline changes. The diagram is the user's follow-along document; the skill run is not complete without it.
9. **Iterate to the quality bar.** The user's reference images are the contract ("clone it pixel by pixel same"). Each round: render → compare against the reference → fix one root cause → re-run the harness. Known traps already solved live in `references/daypilot-case-study.md`: arm swinging inside the torso, goggles clipping the head dome, wrong matrix convention, stage light washing out baked colors (sample the reference render, do not trust baked hex).

## Guardrails

- Assert eulers in debug/test output — SceneKit's `simdRotation` getter returns misleading values on some rigs.
- glTF matrices are column-major; SceneKit expects row-vector — transpose at load time or every mood renders subtly wrong.
- Verification renders must go through the app's real scene-builder, never a private re-implementation.
- Never let a snapshot catch a blink: retry until `eyesScaleY > 0.95` (the sleep pose is the exception).
- Swift harness gotchas: the output binary name must not collide with an existing directory; zsh does not word-split quoted variables; `make install` requires the app to be quit first.
- The quality bar and the mood↔state map are user decisions — if references or mappings are missing, ask instead of inventing.
- Ship assets locally and keep the pipeline reproducible: same source files, same harness, same assertions, every project.
