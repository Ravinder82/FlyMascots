<p align="center">
  <img src="assets/hero.png" width="900" alt="FlyMascots — give your App a mascot that feels alive. Axo, the mint axolotl with goggles, and Nicklas, the 24K Royal Gold St. Nick, side by side.">
</p>

# FlyMascots

**Give your App a mascot that feels alive.**

An agent skill that makes mascots with many moods — from an idea or an image.

It designs the character, rigs it, renders it, and checks it before you ever see it.

## How it works

Two steps, and then it breathes.

### 1. Add the skills

One command. Both skills land in your project — the pipeline and the studio that sculpts in 3D. No account, no key, nothing to sign.

```bash
npx skills add Ravinder82/FlyMascots
```

### 2. Bring a mascot

Start with an idea or an image. The skill starts building your mascot — the body, the rig, the five moods.

```
@flymascots add a mascot to <project> from this image — it should feel alive
and reflect my app's states
```

When it's done, your app sets one of five words — **idle, working, think, celebrate, sleep** — and the mascot does the rest.

```js
setMood("working")
```

## The cast

Two characters ship in the library, and both answer the same five words. The landing page lets you swap between them and the mood footage follows.

<p align="center">
  <img src="assets/mascot-axo.png" width="190" alt="Axo — the mint axolotl mascot with goggles">
  <img src="assets/mascot-nicklas.png" width="190" alt="Nicklas — the 24K Royal Gold St. Nick mascot holding a gift">
</p>

<sub><b>Axo</b> — the demo character, built in code by the skill itself · <b>Nicklas</b> — a 24K gold sculpt exported straight out of the studio</sub>

## Five moods, one word each

Real footage of the character, caught mid-mood.

<p align="center">
  <img src="assets/mood-idle.png" width="110" alt="idle">
  <img src="assets/mood-working.png" width="110" alt="working">
  <img src="assets/mood-think.png" width="110" alt="think">
  <img src="assets/mood-celebrate.png" width="110" alt="celebrate">
  <img src="assets/mood-sleep.png" width="110" alt="sleep">
</p>

<sub><b>idle</b> · <b>working</b> · <b>think</b> · <b>celebrate</b> · <b>sleep</b> — five moods, one word each</sub>

<p align="center">
  <img src="assets/nicklas-mood-idle.png" width="110" alt="Nicklas resting">
  <img src="assets/nicklas-mood-working.png" width="110" alt="Nicklas working">
  <img src="assets/nicklas-mood-think.png" width="110" alt="Nicklas thinking">
  <img src="assets/nicklas-mood-celebrate.png" width="110" alt="Nicklas celebrating">
  <img src="assets/nicklas-mood-sleep.png" width="110" alt="Nicklas sleeping">
</p>

## Where it lives

Your mascot ships wherever your app does — website, macOS & iOS, React Native, static pages, and Electron — all from the same five words. Details: [`skills/flymascots/references/platforms.md`](skills/flymascots/references/platforms.md).

## Install

```bash
# With the skills CLI
npx skills add Ravinder82/FlyMascots

# Or vendor the package
npm i flymascots   # v1.2.0, MIT
```

## Adding a character to the library

The library is one entry per character — [`site/src/mascots/index.js`](site/src/mascots/index.js). A new mascot is one entry plus one model file; the stage, the landing page and the capture rig all read from there, so nothing else has to change.

```js
export const MASCOTS = {
  axo: { kind: 'procedural', build: ({ envMap }) => buildProceduralMascot(config, envMap) },
  nicklas: { kind: 'glb', load: () => loadNicklasModel(url), build: ({ model }) => buildNicklasRig(model) },
};
```

A sculpt ships as a meshopt-compressed GLB plus a base64 wrapper, so it loads from `file://` as well as `http://`. The rigging runs at runtime — parts are addressed by mesh index and re-parented under pivots, so the head nods without touching the mesh.

```bash
# compress + package a sculpt, map its meshes, then shoot it
node marketing/tools/build-mascot-model.mjs <sculpt.glb> nicklas config.json
node marketing/tools/inspect-mascot.mjs  website/assets/mascots/nicklas/model.glb
node marketing/tools/capture-mascot.mjs   nicklas
node marketing/tools/capture-mood-loops.mjs nicklas
```

## License

[MIT](LICENSE) © Ravinder Poonia
