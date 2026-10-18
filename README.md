# AI Mascot Creator

An agent skill that takes a mascot from **an idea, a static image, or a MascotForge Pro export** to a live, high-definition character whose states are synced with your app — the exact pipeline that built **Axo** for [DayPilot](https://github.com/Ravinder82/DayPilot), generalized for any project.

**Every run ends with an interactive [@archify](https://github.com/tt-a1i/archify) process diagram** you can follow along — coding, refining and syncing, spelled out for *your* project.

## What's inside

| | |
|---|---|
| **5 platform adapters** | Websites (Three.js) · macOS/iOS (Swift/SceneKit) · React Native/Expo · Blogs/static · Electron |
| **Spring physics, not lerps** | 120 Hz damped springs, mood boops, breathing, randomized blinks, gaze saccades, never-vanishing hands |
| **Verified, not vibes** | Offline harness compiled from app sources, numeric mood assertions, NaN/vanish health checks, reference-image comparison |
| **Two asset routes** | A: MascotForge Pro (`GLB` + `mascot-engine.js`) — the proven Axo path · B: `@ai-3d-mascot-studio` from idea/image |
| **Mood sync** | One enum, one mapping — your app's states drive the mascot's states |

## Install

```bash
npx skills add Ravinder82/AI-Mascot-Creator@ai-mascot-creator
```

Or via npm (once published): `npm i -g ai-mascot-creator`

## Use

```
@ai-mascot-creator add a mascot to <project> from this image — it should feel alive and reflect my app's states
```

Triggers: *"add a mascot"*, *"create a mascot from this idea/image"*, *"port my MascotForge GLB"*, *"make the mascot feel alive"*, *"sync the mascot with app states"*, *"clone my mascot reference exactly"*.

## Contents

```
skills/ai-mascot-creator/
  SKILL.md                     # the pipeline (9 steps + guardrails)
  references/
    platforms.md               # 5 integration adapters
    animation-physics.md       # springs, mood pose table, invariants
    verification.md            # harness, assertions, snapshot, capture
    daypilot-case-study.md     # the Axo reference implementation, file by file
diagrams/
  mascot-pipeline.html         # the @archify pipeline diagram — open in a browser
```

## The pipeline at a glance

Open the interactive diagram: [`diagrams/mascot-pipeline.html`](diagrams/mascot-pipeline.html)

## Publishing

The npm name `ai-mascot-creator` is reserved-free and ready. To publish:

```bash
npm login
npm publish
```

## License

[MIT](LICENSE) © Ravinder Poonia
