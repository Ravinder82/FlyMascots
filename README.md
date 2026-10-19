<p align="center">
  <img src="assets/axo-stage.png" width="900" alt="FlyMascots — Axo on the live stage viewer, with the five mood buttons below">
</p>

# FlyMascots

**Give your project a mascot that feels alive.**

An agent skill that takes a mascot from an idea, an image, or a MascotForge export and turns it into a breathing, blinking character that changes mood with your app — verified before you ever see it.

<p align="center">
  <video src="assets/launch-16x9.mp4" poster="assets/launch-poster.png" width="720" controls muted loop playsinline></video>
</p>

<sub>The whole thing, in twenty-four seconds. Every frame is a screen recording of the real site — nothing is a mockup.</sub>

## How it works

Three steps, and the third is a word.

### 1. Add the skill
It lives beside your coding agent, ready whenever you want a character in your product.

```
npx skills add Ravinder82/FlyMascots
```

### 2. Bring a mascot
Start with an idea in a sentence, an image you already have, or a MascotForge export. The skill builds it into a real, jointed character.

### 3. Say the word
Your app sets one of five words — **idle, working, think, celebrate, sleep** — and the mascot does the rest.

```js
setMood("working")
```

## Install & run

```bash
# With the skills CLI
npx skills add Ravinder82/FlyMascots

# Or vendor the package
npm i flymascots   # v1.0.1, MIT
```

Then ask your agent:

```
@flymascots add a mascot to <project> from this image — it should feel alive
and reflect my app's states
```

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

## Where it lives

Your mascot ships wherever your app does — website, macOS & iOS, React Native, static pages, and Electron — all from the same five words. Details: [`skills/flymascots/references/platforms.md`](skills/flymascots/references/platforms.md).

## License

[MIT](LICENSE) © Ravinder Poonia
