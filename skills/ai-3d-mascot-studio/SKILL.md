---
name: ai-3d-mascot-studio
description: Design, sculpt, rig, and ship Rive-parity interactive 2D and 3D app mascots from scratch using AI concept generation, Laya System 1 reflex routing, Universal BYOK AI providers, and the img2threejs 8-pass procedural Three.js pipeline. Use whenever the user asks to create a mascot, brand character, 3D companion, animated avatar, Rive-style state machine character, paywall companion, or interactive Three.js / React Native / Expo / Web character for an app or project, mentions img2threejs, or builds the FlyMascots studio web app.
---

# AI 3D Mascot Studio (img2threejs + Rive-Parity + Laya System 1)

Transform an idea, app description, or rough sketch into a production-ready interactive 2D and 3D mascot with Rive-level expressiveness (Virtual 2D Joystick, 1D Timeline Scrubbing, ViewModels data binding, Spring-Bone secondary physics) without manual keyframe labor.

## Preconditions (verified on this machine)

- Base skill `img2threejs` + plugin `img2-character` (animated-character profile) installed; skill root = `~/.config/opencode/skills/img2threejs`.
- Health check: `npx --yes img2threejs@latest doctor` and `img2 doctor`. Repair plugin: `img2 add character --yes`.
- One-time setup on other machines: `npx --yes img2threejs@latest install`, `npx --yes @img2threejs/img2@latest install --yes`, `img2 add character --yes`.
- Read `references/rive-parity-and-laya-routing.md` BEFORE writing Rive-parity controllers, spring-bone solvers, or Laya System 1 telemetry routers. It holds drop-in TypeScript templates.

## 5-Stage pipeline

1. **Stage 1 - Mascot DNA Discovery (zero to concept)**: brand personality, silhouette rules, color psychology.
2. **Stage 2 - 2D studio reference sheet**: multi-angle orthographic concept sheet ready for 3D translation.
3. **Stage 3 - 8-pass img2threejs + Rive-parity procedural 3D**: rigged, PBR-shaded, spring-bone animated `THREE.Group`, zero runtime `.glb` dependency.
4. **Stage 4 - Laya System 1 reflex router + Universal BYOK AI**: sub-35ms local mood/intervene routing plus client-side BYOK provider router.
5. **Stage 5 - Apple HIG v5.0 Pure-Stage studio + dual-runtime export**: distraction-free studio viewport, 1-click `.zip` with `.glb`, Three.js/R3F components, RN/Expo bridges, StoreKit 2 / RevenueCat paywall hooks.

---

### Stage 1 - Mascot DNA Discovery (no reference image yet)

Lock the Mascot DNA Profile before writing code.

- **Archetype selection**:
  - Anthropomorphic creature: owl, fox, cat, red panda, axolotl, bear, each with one signature accessory (captain peaked cap, aviator goggles, headphones, scarf).
  - Living object or spirit: floating elemental wisp, expressive crystal core, desk companion, coffee-cup sprite.
  - Mecha companion: rounded friendly mini robot (Astro Bot, Eve, Baymax proportions), glowing visor eyes, articulated floating limbs.
- **Silhouette and proportion rules**:
  - Enforce 2-head chibi proportions (head about 45 percent of total height) so expressions read at `64x64px` navbar size and at hero viewport size.
  - Include 1 to 2 unmistakable silhouette anchors (ear tufts, cap visor, halo ring, copper goggles, tail plume) that survive a pure black silhouette test.
- **3-color PBR surface palette**:
  - Primary surface (70 percent): warm tactile base (plush velvet `#7C5338`, matte ceramic `#F4F1EA`, brushed titanium `#1E293B`).
  - Secondary or apparel (20 percent): high-contrast garment or shell (navy wool `#1B2A4A`, cream knit `#F3E5AB`, anodized slate `#334155`).
  - Accent, emissive, hardware (10 percent): specular trim and focal glow (gold bullion `#D4AF37`, sky blue LED `#38BDF8`, emerald status core `#10B981`).

### Stage 2 - 2D concept art and reference sheet

Use this prompt formula for the 2D blueprint (internal image generator or BYOK provider):

```text
3D character design reference sheet of [Character Name and Species/Archetype], [chibi 2-head proportions], wearing [signature accessories and apparel]. Front view and three-quarter view turnaround. Tactile Pixar and Nintendo Switch toy aesthetic, [primary material texture, e.g. soft flocked velvet and polished brass], expressive oversized eyes with dual white catchlights, studio softbox rim lighting, clean neutral dark-slate background (#0F172A), ultra-crisp silhouette, 8k octane render style.
```

### Stage 3 - 8-pass img2threejs + Rive-parity procedural 3D

Never ship raw unsculpted primitives (a `SphereGeometry` glued to a `ConeGeometry` with visible seams) and never snap poses with raw `if/else`. Full pass table, construction rules, and img2threejs commands: `references/pipeline.md`.

- **Continuous lofted bodies**: `CapsuleGeometry(radius, length, 24, 48)` or `LatheGeometry` spline profiles so neck flows into shoulders and belly with no hard intersection crease.
- **Extruded apparel and props**: `new THREE.Shape()` with `bezierCurveTo` plus `ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 5 })` for hats, visors, collars, wings, tails, badges.
- **Layered facial relief, no flat decals**: recessed muzzle and cheek plates, 3D sclera domes, iris discs, pupil cores, and dual pure-white `MeshBasicMaterial` catchlights offset in local z (`+0.015` to `+0.03`) to avoid z-fighting.
- **Procedural studio environment map**: always build an inline `PMREMGenerator` softbox environment so gold, clearcoat vinyl, and glossy eyes never render black. Zero external `.hdr` requests.
- **Spring-bone secondary physics**: zero-dependency verlet or damped-harmonic solver for ears, tails, hat brims, capes, antennae so they lag, sway, and bounce with overshoot.
- **Rive-parity state machine and data binding**:
  - Exponential cross-fade: `THREE.MathUtils.damp(current, target, lambda, delta)` on every pivot, never a snap.
  - 2D virtual joystick: `setLookTarget(nx, ny, weight)` maps normalized pointer, touch, or gyro coordinates to iris tracking (100 percent), head yaw and pitch (65 percent), torso lean (25 percent), ear or hat counter-tilt (minus 15 percent).
  - 1D timeline scrubbing: `scrub(channel, progress0to1)` drives posture from 0.0 to 1.0 (pull-to-refresh tension, upload progress, password strength, onboarding step).
  - Declarative view model: `mascot.userData.bindViewModel({ progress, mood, isTyping, errorCount, streakDays, posture })` so React, SwiftUI, or Expo state drives the rig.

The 8 passes, in order: `blockout`, `structural-pass`, `form-refinement`, `material-pass`, `surface-pass`, `lighting-pass`, `interaction-pass`, `polish-pass`.

### Stage 4 - Laya System 1 reflex router + Universal BYOK AI

**4.1 Laya System 1 reflex mood and telemetry router (under 35ms local)**

Never spend an 800ms to 2500ms System 2 LLM call to decide how the mascot reacts to a click, a form error, an idle timeout, or a paywall hover. Route through a Laya System 1 reflex router (`layaMascotRouter.ts`, inspired by NandhaKishorM/laya and mizorewww/laya-mlx, 7 to 35ms locally, or deterministic fast-path heuristics):

- **noul gate (`should_intervene`, probability 0.0 to 1.0)**: `P(should_intervene)` from telemetry such as `typingVelocity`, `errorBurst`, `idleSeconds`, `paywallHoverMs`. If `P < 0.60` the mascot stays in calm breathing idle (never Clippy-annoying).
- **score intensity (0 to 4 ordinal)**: maps urgency to animation amplitude (0 subtle eye glance, 1 gentle nod, 2 expressive gesture, 3 full body bounce plus prop pulse, 4 celebratory jump plus confetti burst).
- **choice mood selection (fewer than 20 typed labels)**: picks the exact rig state in constant time: `idle`, `listen`, `scan`, `thinking`, `celebrate`, `empathize`, `wave`, `paywall-plea`, `streak-fire`, `sleepy`.

**4.2 Universal BYOK AI provider router**

Never hardcode one vendor or proxy keys through your own backend. Implement a Universal BYOK router:

- Providers: Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`, `imagen-3.0-generate-002`), OpenAI (`gpt-4.1`, `o4-mini`, `gpt-image-1`), Anthropic Claude (`claude-sonnet-4-20250514`, browser CORS header `anthropic-dangerous-direct-browser-access: true`), OpenAI-compatible gateways (OpenRouter, NVIDIA NIM, DeepSeek, `deepseek/deepseek-r1`, `meta-llama/llama-4-maverick`), and local Ollama or Apple Silicon MLX (`http://localhost:11434/v1/chat/completions`, `qwen2.5-coder:32b`, `laya-mlx`) for zero-cost offline generation. Verify current model IDs against the provider before shipping; pins go stale.
- Client-side key vault: keys in `localStorage` (or WebCrypto AES-GCM encrypted storage) with a clear "Stored locally in your browser, never sent to a middleman server" badge.
- Six built-in Instant Studio Presets so the studio works on first launch with zero API key.
- Structured JSON `MascotCharacterSpec` from the LLM: `archetype`, `name`, `primaryColor`, `secondaryColor`, `accentColor`, `glowColor`, `headScale`, `bodyChubbiness`, `earScale`, `eyeScale`, `expression`, `hatStyle`, `propType`, `surfacePreset`, `clearcoat`, `roughness`, `metalness`, `springStiffness`, `springDamping`, feeding the deterministic `buildProceduralMascot(spec)` compiler for sub-50ms live updates.

### Stage 5 - Pure-Stage studio, mobile runtimes, `.zip` export

- **Pure-Stage viewport (over 85 percent unobstructed 3D)**: WebGL canvas plus radial backdrop switcher (Obsidian Dark, Warm Cinema, Neutral Clay, Alpha Checkerboard) and a unified left command sidebar of 380px to 420px, or 4 translucent floating chrome zones with `backdrop-filter: blur(24px)`: brand header plus Export Asset ZIP CTA, stage mode and archetype deck, the 7-module LED inspector (Anatomy, Face and Prop, 8K PBR, Lighting, Lens and LUT, Rive rig and spring physics, Paywall and Laya telemetry), and a bottom pose and camera deck.
- **Mobile tiers**: Tier A `ExpoMascotWebView.tsx` (react-native-webview, bidirectional `postMessage` and `injectJavaScript` for `setMood`, `setLookTarget`, `scrub`, `bindViewModel`, zero native build complexity, 60fps). Tier B `MascotNativeR3F.tsx` (`@react-three/fiber/native` with `expo-gl` and `expo-three`) for graphics-intensive iOS 27 and iPhone Duo dual-screen apps. Posture awareness adapts camera framing and lean angle across `portrait`, `book-left-wing`, `book-right-wing`, `tent-standby`.
- **StoreKit 2 and RevenueCat paywall choreography**: `onTrialToggle` to joyful nod plus badge glow, `onPlanSelect('annual')` to star eyes plus crown or halo equip, `onPurchaseSuccess` to celebratory jump plus spring-bone confetti boop, `onCancelAttempt` to gentle empathetic head tilt.
- **1:1 fidelity `.zip` export** via `JSZip` plus `THREE.GLTFExporter`, containing zero placeholder code: `models/<slug>.glb` with baked `THREE.AnimationClip` tracks (Idle, Scan, Think, Celebrate), `src/mascot-engine.js` and `src/createMascotModel.ts`, `src/layaMascotRouter.ts`, `src/ExpoMascotWebView.tsx`, `renders/<slug>-2d-concept-sheet.png` and `renders/<slug>-3d-studio-render.png`, plus `mascot-config.json` and `README-CODING-AGENT.md`. Full manifest and studio module spec: `references/studio-and-export.md`. Drop-in R3F wrapper and WebView bridge code: `references/shipping.md`.

## Gotchas

- **Silhouette before surface**: material polish cannot fix wrong proportions. Lock head-to-body ratio and silhouette in `blockout`.
- **Clean reference first**: clutter, heavy bloom, or busy backgrounds make the vision gates read shadows as geometry.
- **Always expose the Rive-parity API**: `setMood`, `setLookTarget`, `scrub`, `bindViewModel`, `triggerBoop`, `updateSpringBone`, plus a looping `userData.tick(delta, elapsed)` idle (breathing, blinking, subtle head tilt).
- **Intervene rarely**: the noul gate must keep the mascot calm most of the time. A mascot that reacts to everything is noise.
- **Never expose API keys through a backend proxy**; BYOK means the key never leaves the client.
- **Ship the export bundle complete**: a truncated factory or missing spring-bone solver in the `.zip` is a broken deliverable even if the studio preview looks right.
