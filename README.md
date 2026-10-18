# FlyMascots

Give your project a mascot that feels alive — a character that breathes, blinks, reacts, and changes mood as your app changes state. The same pipeline that built **Axo** for [DayPilot](https://github.com/Ravinder82/DayPilot), turned into a skill your AI coding agent can use on any project.

**Every run ends with an interactive process diagram** you can open in a browser and follow along, step by step.

## What's inside

Written for everyone:

- **It works in 5 kinds of projects** — a website, a Mac or iPhone app, a React Native app, a blog, or a desktop (Electron) app. Pick yours and follow the guide.
- **It moves like a real pet, not a robot** — it breathes, blinks whenever it feels like it, looks around, and its arms and accessories bounce with springy physics instead of sliding.
- **Your app controls its mood** — press play and it gets to work, hit pause and it relaxes. You write the rules that say which app moment means which mood.
- **It's tested before you ever see it** — a test lab checks every pose automatically and catches glitches (like a hand disappearing) before you do.
- **You can start from 3 places** — an idea in your head, a picture you like, or a character you already exported from MascotForge Pro.

## Install

```bash
npx skills add Ravinder82/FlyMascots
```

Or via npm (once published): `npm i -g flymascots`

## Use

```
@flymascots add a mascot to <project> from this image — it should feel alive and reflect my app's states
```

Triggers: *"add a mascot"*, *"create a mascot from this idea/image"*, *"port my MascotForge GLB"*, *"make the mascot feel alive"*, *"sync the mascot with app states"*, *"clone my mascot reference exactly"*.

## Contents

```
skills/flymascots/
  SKILL.md                     # the pipeline (9 steps + guardrails)
  references/
    platforms.md               # 5 integration guides (one per kind of project)
    animation-physics.md       # how it moves + the mood poses
    verification.md            # the test lab: checks, snapshots, screenshots
    daypilot-case-study.md     # how Axo was actually built, file by file
diagrams/
  mascot-pipeline.html         # the process diagram — open it in a browser
```

## See the pipeline

Open the interactive diagram: [`diagrams/mascot-pipeline.html`](diagrams/mascot-pipeline.html)

## Publishing

The npm name `flymascots` is free and ready. To publish:

```bash
npm login
npm publish
```

## License

[MIT](LICENSE) © Ravinder Poonia
