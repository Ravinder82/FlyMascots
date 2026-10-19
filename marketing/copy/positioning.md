# Positioning & claims

Every line used in the kit traces to a file in this repo. Nothing here is
aspirational — if a claim cannot be checked, it does not ship.

## One-liners

| Use | Line |
| --- | --- |
| Name | FlyMascots |
| Short | Give your project a mascot that feels alive. |
| One sentence | An agent skill that takes a mascot from an idea, image or MascotForge export to a spring-animated character synced to your app's state — and verified before you see it. |
| Tagline | Mascots that feel alive. |
| Install | `npx skills add Ravinder82/FlyMascots` |
| Package | `npm i flymascots` — v1.0.0, MIT |

## Claims and their sources

| Claim | Source |
| --- | --- |
| Five moods — idle, working, think, celebrate, sleep | `skills/flymascots/references/verification.md` §2 |
| Springs, not lerps | `skills/flymascots/SKILL.md` step 6; `references/animation-physics.md` |
| Numeric mood assertions (goggle 0.440, armR −0.780, eyes 0.080, hop 0.167 …) | `references/verification.md` §2, "the `moodtest` pattern" |
| 60-transition NaN / vanish health check (`pivotsFinite()`) | `references/verification.md` §2 |
| Pose renders compared with your reference, colour-sampled | `references/verification.md` §3–4 |
| Five platforms — website (Three.js), macOS/iOS (SceneKit), React Native/Expo, static pages, Electron | `references/platforms.md` |
| Every run ends with an interactive process diagram | `SKILL.md` intro + step 9 |
| Proven on Axo (DayPilot, macOS/SceneKit) | `references/daypilot-case-study.md` |
| MIT licence, v1.0.0 published | `LICENSE`, `package.json`, npm registry |

## Never say

- "the best", "revolutionary", "10× faster" — nothing to check it against.
- Anything about GitHub stars, downloads or user counts.
- "AI-generated mascot in one click" — a run is a pipeline with verification,
  and the films say so.

## Voice

Quiet, concrete, a little technical. Short declaratives. Numbers when they
are real. The audience is people who build apps and use coding agents.
