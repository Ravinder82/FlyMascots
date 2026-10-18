# Animation Physics & Moods

The difference between a mascot that "moves" and one that "feels alive": springs instead of lerps, exact source-engine targets, and a body that never breaks its own invariants.

## Spring system (the core)

Damped semi-implicit springs, substepped at **120 Hz** (`h = 1/120`) so frame rate never changes the feel:

```
a = k · (target − value) − d · velocity
velocity += a · h
value    += velocity · h
```

Starting config (tune per rig, these shipped on Axo):

| Channel | Stiffness k | Damping d |
|---|---|---|
| Goggles / accessory sweeps | 120 | 15 |
| Arms | 90 | 12 |
| Head / gaze | 70 | 11 |

**Mood-change boop:** when the target mood changes, kick the spring instead of teleporting: `boopVelocity += 0.22 · springStiffness`. The state change reads as a physical nudge.

## Ambient life (always on)

- **Breathing:** subtle sinusoidal body scale, ~0.5–1.0% amplitude.
- **Blinking:** random interval 2.8–5.4 s, occasional double-blink bursts; eyes = `scaleY` on the eyes group.
- **Gaze saccades:** eyes jump to small random targets every few seconds, spring-damped — never a smooth doll stare.

## Pose table (port from engine.js, do not invent)

| Mood | Key targets (Axo values) |
|---|---|
| `idle` | goggle `0.0` (up on forehead), arms neutral, slow drift |
| `working` | goggle drop `0.44` **onto the eyes**, arms `−0.48 / +0.18` |
| `think` | chin-hand arm `−0.78`, head roll `−0.15`, yaw `0.22`, gaze saccades |
| `sleep` | eyes `scaleY 0.08`, slow breathing |
| `celebrate` | wave arm `−0.62 ± 0.16`, hop `0.167` |

## Invariants (assert these — they are what broke in the field)

1. **Hands never vanish.** Any arm target must keep the hand *outside* the torso shell (Axo: celebrate wave fixed from `+0.55` → `−0.62`, asserted `< −0.40`). A hand that enters the body is a wrong sign, not a style choice.
2. **Accessories arc over geometry.** A goggle sweep across the head dome needs an arc-lift: `z += sin(progress · π) · 0.16` on the assembly — otherwise it tunnels through the skull.
3. **Every pivot stays finite.** After any rapid mood cycling, assert no NaN/∞ in any rotation or position (60-transition health check).
4. **Hands/goggles are state, not decoration.** Goggles ON eyes when working, UP on forehead when idle — driven by the spring target, not a swap.

## Debug output

- Read **eulers** for assertions and debug state; `simdRotation` returns misleading values on some rigs (axis/angle getter quirk).
- Expose `animationDebugState()` (mood, spring values, eye scale) and `pivotsFinite()` from the mascot class — the harness depends on them.

## Sync with host states

- One enum, one mapping table, documented in the archify diagram (user owns the mapping).
- DayPilot reference: start/resume→`working`, pause→`idle`, stop→`think`, quit-while-tracking→`celebrate`.
- Adding a host state later = add binding + one mood assertion. No silent drift.
