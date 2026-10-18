# Platform Adapters

Same mascot, five integration targets. Pick per platform the user named; a multi-platform project may mix routes (see SKILL.md step 2).

## 1. Website (Three.js)

The native home of a MascotForge Pro export — `mascot-engine.js` is already a self-contained Three.js runtime.

- **Use the engine as-is:** `mascot-engine.js` exports `BAKED_MASCOT_CONFIG` and `buildProceduralMascot()` plus the studio lighting. Import it in a module script, add the returned group to a scene with a `PerspectiveCamera` framed on the character, and run the animation loop.
- **Or load the GLB:** `THREE.GLTFLoader` → `<mascot>.glb`, then apply the ported pose table from engine.js yourself (this is what native targets must do anyway — one pose table, two consumers).
- **Free-floating overlay:** fixed-position container in a page corner, `pointer-events: none` so it never blocks clicks; size ≥30% larger than the first draft once the user has seen it.
- **Studio look:** port engine.js's light rig (key/fill/rim + environment) rather than default ambient — the "creator render" quality depends on it.

## 2. macOS / iOS native (Swift + SceneKit) — the DayPilot pattern

Files to port into the project (see `daypilot-case-study.md` for what each did):

| File | Role |
|---|---|
| `GLBLoader.swift` | Dependency-free GLB reader; **applies the column-major→row-vector transpose** |
| `AxoMascot.swift` | Rig (pivots, materials), mood enum, spring system, tick, debug state |
| `AxoStageView.swift` | `SCNScene` builder: studio lighting, contact shadow, camera, snapshot support |
| Host integration | SwiftUI overlay (`NSViewRepresentable`/`SCNView`, `.allowsHitTesting(false)`) + mood call sites in the state model |

- Keep the GLB in `Resources/`; load by name, pin its hash in the project doc.
- The scene-builder must be callable from a test harness — that is what makes step 7 of the workflow possible.
- macOS: `SCNView` + `snapshot()` or offscreen `SCNRenderer` for pose captures.

## 3. React Native / Expo

- **Recommended for MascotForge exports: WebView route.** Wrap the Section-1 web runtime in a transparent `<WebView>` with `pointerEvents="none"` — the engine.js keeps working unchanged, one code path across web + mobile.
- **Route B procedural mascots:** `expo-three` / `expo-gl`, or `@react-three/fiber` in Expo Web. Follow `@ai-3d-mascot-studio` for that pipeline's own RN notes.
- Mood sync: expose `setMood(name)` via `window.postMessage` (WebView) or a prop (r3f) — keep the same enum names as every other platform.

## 4. Blogs / static pages (no-JS or low-JS)

- **No scripts allowed:** export a short loop as animated **SVG / Lottie / GIF** (mood = still frame variants). This adapter shows the pose table, not the springs.
- **Scripts allowed:** use the Section-1 web embed in its minimal form.
- Ask the user which constraint applies — never assume a blog can run Three.js.

## 5. Electron / desktop web

- Same as the website route with packaging notes: serve assets from local paths (never CDN), keep the GLB inside the app bundle, respect renderer context isolation (load the engine through the page's own module context, not a node context).
- Click-through overlay maps to a transparent `BrowserWindow` region if the mascot floats over other windows — same `pointer-events` principle.

## Cross-platform rules

- **One mood enum everywhere.** Identical names (`idle`, `working`, `think`, `sleep`, `celebrate`) across Swift, JS, WebView bridge — the state map in the host app is the single source of truth.
- **One pose table everywhere.** Extract engine.js targets into a shared doc/table; never re-derive values per platform.
- Assets local-only; no external runtime deps without explicit user approval.
