# Verification Harness

Nothing goes to the user until it passes: numeric assertions → health check → pose renders → reference comparison → live capture.

## 1. Offline harness (same sources as the app)

Compile a tiny `main.swift` against the app's real mascot files — the harness must exercise production code, never a private copy:

```bash
swiftc -o <bin> GLBLoader.swift AxoMascot.swift <main.swift> \
  -framework SceneKit -framework AppKit -framework SwiftUI
```

Gotchas learned the hard way:
- The output name must not collide with an existing directory (`ld: open() failed … Is a directory`).
- zsh does not word-split quoted variables — expand paths directly in the command.
- macOS `SCNVector3` components are `CGFloat`; translations live in `m41–m43`.

## 2. Numeric mood assertions (the `moodtest` pattern)

Drive every mood through the real tick loop and assert the shipped numbers:

- `idle` baseline; `working` goggle `0.440`, arms `−0.48/+0.18`
- pause→`idle` goggle `0.000`; `think` armR `−0.780`, head yaw in `0.189…0.333`
- `sleep` eyes `0.080`; `celebrate` armL `< −0.40` (hands-outside-torso invariant), hop `0.167`
- **Boop test:** a mood change imparts velocity (spring kick present).
- **Rapid-cycle health check:** 60 mood transitions, then assert `pivotsFinite()` — no NaN, no vanished limbs.

## 3. Pose renders (anti-blink rule)

Snapshot through the app's production scene-builder (`AxoStageView.buildScene`-equivalent path) for each mood.

- Retry the snapshot until `eyesScaleY > 0.95` so a mid-blink frame never passes as the pose — exempt for `sleep`, where closed eyes *are* the pose.
- Output PNGs per mood (`stage_idle`, `stage_working`, `stage_think`, …) for the reference comparison.

## 4. Reference comparison (the quality bar)

- Place each pose render side-by-side with the user's reference images (their mascot-creator studio renders).
- The user's words are the contract: "clone it pixel by pixel same." Compare silhouette, proportions, colors, accessory position.
- Colors: **sample the reference render** (eyedropper on the studio PNG) — stage lighting shifts baked hex; the same material can read pale mint vs dark teal under different rigs.
- One root cause per iteration, harness re-run after every fix.

## 5. Live window capture (macOS)

```bash
osascript -e 'tell application "<App>" to activate'
# wincap: CGWindowListCopyWindowInfo → owner name, layer 0 → window id
screencapture -x -l<windowID> out.png
```

Plain `screencapture` grabs the wallpaper — always target the window id. Driving UI clicks: compute global point = window bounds origin + point offsets, post `CGEvent` down/up; re-activate the app if clicks stop landing.

## 6. Ship gate

- Project's own test suite green (`make selftest` on DayPilot: 8/8 incl. report-hygiene).
- Clean build, 0 warnings.
- Then — and only then — the archify diagram (SKILL.md step 8) and the user-facing review round.
