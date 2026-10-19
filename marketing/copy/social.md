# Social copy

Ready to paste. Assets to attach are named per item (all in `stills/out/` and
`renders/`). Voice: quiet, concrete, first person, no hype — see
`positioning.md`. Always link the repo; always say it is your own.

---

## X / Twitter thread (6 posts)

**1 — hook + film**
> I built an agent skill that gives your project a mascot that feels alive.
>
> 24 seconds, no mockups — that's the real engine on screen:
>
> 🎬 `renders/flymascots-reel-16x9.mp4` (or 9:16)
> `stills/out/launch-16x9.png`

**2 — the run**
> It's a pipeline, not a prompt: idea or image → rig → spring physics → mood
> sync → verification harness → integration.
>
> Every run ends with a diagram of the pipeline it actually ran.
>
> 🖼 `stills/out/pipeline-16x9.png`

**3 — the character**
> The character breathes, blinks on its own timer and moves on springs — 70 k /
> 11 d on the head. Your app drives one mood enum: start → working, pause →
> idle, stop → think, quit → celebrate.
>
> 🖼 `stills/out/moods-16x9.png`

**4 — verification**
> Skipping this is why AI characters look fake: the skill verifies itself.
>
> Per-mood numeric assertions (working goggle 0.440, think armR −0.780, sleep
> eyes 0.080), a 60-transition NaN/vanish check, and pose renders compared with
> your reference image.
>
> 🖼 `stills/out/yt-thumb-b.png`

**5 — platforms + case study**
> One pose table, five homes: website (Three.js), macOS/iOS (SceneKit), React
> Native, static pages, Electron.
>
> It was built and shipped first on Axo in DayPilot.
>
> 🖼 `stills/out/platforms-square.png`

**6 — install**
> Free and MIT.
>
> npx skills add Ravinder82/FlyMascots
> npm i flymascots
>
> github.com/Ravinder82/FlyMascots
>
> 🖼 `stills/out/og-card.png`

---

## Reddit — r/ClaudeAI

**Title:** I built an agent skill that gives any app a mascot that feels alive
(Three.js / SceneKit) — and verifies it before you see it

**Body:**

> Spent the last stretch building **FlyMascots** — a Claude-style agent skill
> (SKILL.md + references) that takes a mascot from an idea, a reference image,
> or a MascotForge Pro export to a live character in your project.
>
> What it actually does in a run:
>
> - reads your reference image / idea and picks a rig route
> - ports a pose table (idle, working, think, celebrate, sleep) with spring
>   physics — 70 k / 11 d on the head, no lerps
> - wires the moods to your app's states (one enum)
> - **verifies**: per-mood numeric assertions, a 60-transition NaN / vanished-
>   limb check, pose renders compared against your reference with sampled
>   colours
> - ends with a process diagram of the pipeline it just ran
>
> Platforms: website (Three.js), macOS/iOS (Swift + SceneKit), React Native,
> static pages (SVG/Lottie), Electron. It was built and proven first on Axo —
> the mascot in my macOS app DayPilot.
>
> Demo (24 s, real engine): link in the repo — `github.com/Ravinder82/FlyMascots`
> Install: `npx skills add Ravinder82/FlyMascots` (MIT, also `npm i flymascots`)
>
> Happy to answer anything about the pipeline — especially the verification
> side, which I think is the part most mascot work skips.

---

## Reddit — r/webdev

**Title:** Making a 3D mascot feel alive on the web: springs, deterministic
captures, and a harness that catches NaN limbs

**Body:**

> Sharing the technical side of a mascot pipeline I built for a macOS app and
> ported to the web (`mascot-engine.js`, Three.js).
>
> Things that made the biggest difference:
>
> 1. **Springs, not lerps.** Every mood is a target pose; the character eases
>    with `k`/`d` per part (head 70/11) so transitions overshoot slightly and
>    read as alive. Blinks run on their own 3.6 s timer.
> 2. **One pose table, many consumers.** Poses are data. The web engine and the
>    native SceneKit port read the same numbers, so macOS and the web look the
>    same.
> 3. **Deterministic captures.** The viewer takes `?capture=1` + `resetFilm()`
>    + `seekTo(t)` so any frame can be reproduced exactly — that's how the
>    launch film is rendered frame by frame from the real engine instead of a
>    separate animation.
> 4. **A verification harness.** Numeric per-mood assertions, then 60 rapid
>    mood transitions asserting `pivotsFinite()` — it catches the NaN /
>    vanished-limb bugs that otherwise show up as a hand disappearing mid-hop.
>
> Demo + film: github.com/Ravinder82/FlyMascots (MIT)
>
> The whole thing is packaged as an agent skill so a coding agent can run the
> pipeline on your project. Curious what you'd poke at first.

---

## Skill directories

**skills.sh / `npx skills find`** — indexed from the repo automatically; make
sure the repo has the GitHub topics below and a clean `SKILL.md`. Then the
page at `skills.sh/<owner>/<repo>` can be customised (docs: skills.sh/docs).

**Short description (≤ 200 chars — npm / directory listing):**

> Give any project a mascot that feels alive — from an idea, image or
> MascotForge export to a spring-animated, state-synced character that's
> verified automatically.

**Long description (directory pages, awesome-list entries):**

> FlyMascots is an agent skill that builds an animated app mascot end to end:
> rig and pose table, spring physics (never lerps), blink and gaze behaviour,
> mood sync with your app's states, five platform routes (website/Three.js,
> macOS+iOS/SceneKit, React Native, static pages, Electron), and a verification
> harness that asserts every mood numerically, health-checks 60 transitions for
> NaN/vanish bugs, and compares pose renders against your reference. Every run
> ends with an interactive process diagram. Proven on Axo (DayPilot, macOS).
> MIT.

**GitHub topics to set on the repo:**
`agent-skills`, `claude-skills`, `ai-agents`, `mascot`, `threejs`, `scenekit`,
`spring-physics`, `character-animation`, `mit`

---

## YouTube Shorts / Instagram Reels

**Title options**
- Add a mascot that feels alive (24 s)
- Your app's mascot, but it breathes
- One enum, five moods, no lerps

**Caption**

> An agent skill that builds a mascot for your app — springs, blinks, mood
> sync — and verifies every pose before you ship it.
> Real engine, real frames, 24 seconds.
>
> npx skills add Ravinder82/FlyMascots · MIT
> github.com/Ravinder82/FlyMascots
>
> #buildinpublic #devtools #threejs #gamedev #indiedev

**Upload assets:** `renders/flymascots-reel-9x16.mp4` (primary),
`renders/qc/poster-reel-9x16.png` (cover),
`renders/flymascots-story-9x16.mp4` (pinned follow-up / second upload).
