# Stage 5 reference: Pure-Stage studio, mobile runtimes, and the `.zip` export

## 5.1 Pure-Stage viewport layout (over 85 percent unobstructed 3D)

- **Stage**: interactive WebGL canvas, over 85 percent of the viewport, with a radial studio backdrop switcher: `Obsidian Dark`, `Warm Cinema`, `Neutral Clay`, `Alpha Checkerboard`.
- **Chrome**: either one unified left command sidebar of 380px to 420px, or 4 translucent floating zones using `backdrop-filter: blur(24px)`.

Zone 1, brand header plus primary export CTA:
- Mascot title, active shader telemetry badge, `Export Asset ZIP` button.

Zone 2, stage mode and archetype deck:
- `3D Stage | 2D Sheet | Split 2D+3D` segmented bar, base archetype selector, 1-click directive macros.

Zone 3, 7-module LED inspector:

| Module | Controls |
| --- | --- |
| `01 Anatomy` | Colorway swatches, chibi head/torso/ear/wing/foot proportion sliders, `32/64/72-Seg` subdivision toggle |
| `02 Face/Prop` | LED eye expression morphs (`neutral`, `happy`, `focused`, `star`, `wink`, `sleepy`, `empathize`), goggles/hat position, handheld prop (`pad`, `orb`, `macbook`, `spyglass`, `none`) |
| `03 8K PBR` | Shader presets (`Glossy Vinyl`, `Matte Clay`, `Midnight Titanium`, `Frosted Glass`, `Pearl Ceramic`, `24K Gold`), clearcoat/roughness/metalness/iridescence sliders |
| `04 Lighting` | Studio rig (`Softbox`, `Apple Keynote`, `Cyberpunk Neon`, `Golden Hour`), turntable plinth style, key and rim light angles |
| `05 Lens/LUT` | Cinema grade (`Neutral`, `Warm Octane`, `Kodak Vision3`, `Noir`), focal length (`24mm/35mm/50mm/85mm`), ACES exposure |
| `06 Rive Rig & Spring Physics` | Virtual 2D joystick pad, `0..1` 1D timeline scrubber, spring-bone stiffness and damping sliders, click-to-boop impulse tester |
| `07 Paywall & Laya Telemetry` | StoreKit 2 / RevenueCat conversion simulator (`trial-toggle-celebrate`, `plan-tier-hover`, `purchase-unlock-party`, `streak-saver-plea`), iPhone Duo split-screen posture toggle (`left-wing`, `right-wing`, `floating-pill`) |

Zone 4, bottom pose and camera deck:
- Instant mood triggers (`Idle`, `Scan`, `Think`, `Joy`, `Plea`), plus `Look` (cursor joystick), `Orbit`, `Wire`, `Re-Cam`, and `PNG` snapshot.

## 5.2 React Native / Expo tiers

Tier A, zero native bloat (`ExpoMascotWebView.tsx`, default for fast shipping):
- Wraps the self-contained Three.js runtime in `react-native-webview`.
- Bidirectional bridge: `postMessage` inbound, `injectJavaScript` outbound.
- Channel names: `setMood`, `setLookTarget`, `scrub`, `bindViewModel`, `triggerBoop`.
- 60fps on iOS and Android, no native C++ or GL build step.

Tier B, native GPU (`MascotNativeR3F.tsx`):
- `@react-three/fiber/native` with `expo-gl` and `expo-three`, direct shared-memory WebGL.
- Use for graphics-intensive iOS 27 and iPhone Duo dual-screen apps.

Posture awareness: adapt camera framing and mascot lean angle as `posture` switches between `portrait`, `book-left-wing`, `book-right-wing`, and `tent-standby`.

## 5.3 StoreKit 2 and RevenueCat paywall choreography

| Event | Mascot reaction |
| --- | --- |
| `onTrialToggle` | Joyful nod plus badge glow |
| `onPlanSelect('annual')` | Star eyes plus crown or halo equip |
| `onPurchaseSuccess` | Celebratory jump plus spring-bone confetti boop |
| `onCancelAttempt` | Gentle empathetic head tilt |

Wire these as `mascot.userData` callbacks so both web and mobile tiers share one mapping. Every new paywall state needs a binding and a mood test.

## 5.4 Export Asset ZIP manifest (1:1 fidelity, zero placeholders)

Build client-side with `JSZip` plus `THREE.GLTFExporter`.

```
models/<slug>.glb                        binary glTF 2.0, baked AnimationClips: Idle, Scan, Think, Celebrate
src/mascot-engine.js                     complete procedural geometry, PBR, spring-bone, Rive-parity factory
src/createMascotModel.ts                 same factory as TypeScript source
src/layaMascotRouter.ts                  sub-35ms reflex mood and intervention router
src/ExpoMascotWebView.tsx                RN/Expo component with StoreKit 2 and RevenueCat props
renders/<slug>-2d-concept-sheet.png      2D concept sheet render
renders/<slug>-3d-studio-render.png      studio render
mascot-config.json                       exact parameter spec
README-CODING-AGENT.md                   copy-paste integration guide for Cursor and Claude Code
```

Checklist before shipping the archive:
- `createMascotModel.toString()` in the bundle matches the studio build, no truncation.
- The `.glb` animates standalone in Blender, Xcode Reality Composer, and `<model-viewer>`.
- No placeholder comments, no `TODO`, no missing spring-bone solver.
- The `.glb` is reference only; the code-only contract still holds for the runtime path.

## 5.5 Preview inside the conversation

Generate both the 2D studio concept image and an interactive 3D preview (or a copy-pasteable single-file Three.js playground) so the user can judge a mascot concept immediately, before the full pipeline runs.
