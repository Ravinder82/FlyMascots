# Rive-parity controllers, spring-bone physics, and Laya System 1 routing

Drop-in TypeScript templates. Read this before writing any Rive-parity controller, spring-bone solver, or telemetry router.

## 1. Rive-parity runtime API on `THREE.Group`

```ts
import * as THREE from "three";

export type MascotMood =
  | "idle" | "listen" | "scan" | "thinking" | "celebrate"
  | "empathize" | "wave" | "paywall-plea" | "streak-fire" | "sleepy";

export interface MascotViewModel {
  progress?: number;      // 0..1 scrub channel
  mood?: MascotMood;
  isTyping?: boolean;
  errorCount?: number;
  streakDays?: number;
  posture?: "portrait" | "book-left-wing" | "book-right-wing" | "tent-standby";
}

export interface MascotRig {
  root: THREE.Group;
  pivots: {
    bodyRoot: THREE.Group; headPivot: THREE.Group;
    leftArmPivot: THREE.Group; rightArmPivot: THREE.Group;
    leftFootPivot: THREE.Group; rightFootPivot: THREE.Group;
    tailOrCapePivot: THREE.Group; propPivot: THREE.Group;
    eyeLeft: THREE.Object3D; eyeRight: THREE.Object3D;
  };
  springs: { node: THREE.Object3D; rest: THREE.Vector3; vel: THREE.Vector3 }[];
  state: {
    mood: MascotMood; target: Partial<Record<keyof THREE.Euler, number>>;
    look: { x: number; y: number; w: number };
    scrub: Record<string, number>;
    vm: MascotViewModel; boop: number; phase: number;
  };
}
```

### Damped cross-fade (never snap a pose)

```ts
const LAMBDA = 6; // higher = snappier, 3..8 feels Rive-like

export function applyMood(rig: MascotRig, mood: MascotMood, delta: number) {
  rig.state.mood = mood;
  const t = MOOD_TARGETS[mood];              // per-mood euler targets
  for (const [key, value] of Object.entries(t)) {
    const euler = rig.pivots.bodyRoot.rotation as unknown as Record<string, number>;
    euler[key] = THREE.MathUtils.damp(euler[key], value, LAMBDA, delta);
  }
}
```

### 2D virtual joystick (pointer, touch, or gyro)

```ts
export function setLookTarget(rig: MascotRig, nx: number, ny: number, weight = 1) {
  rig.state.look = { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1), w: clamp(weight, 0, 1) };
}

export function applyLook(rig: MascotRig) {
  const { x, y, w } = rig.state.look;
  const iris = rig.pivots.eyeLeft.position.x;
  rig.pivots.eyeLeft.position.x = THREE.MathUtils.damp(iris, x * 0.012 * w, 10, 1 / 60);
  rig.pivots.eyeRight.position.x = rig.pivots.eyeLeft.position.x;
  rig.pivots.eyeLeft.position.y = THREE.MathUtils.damp(rig.pivots.eyeLeft.position.y, y * 0.008 * w, 10, 1 / 60);
  rig.pivots.eyeRight.position.y = rig.pivots.eyeLeft.position.y;

  rig.pivots.headPivot.rotation.y = x * 0.38 * w;   // 65% of 0.6 rad
  rig.pivots.headPivot.rotation.x = -y * 0.30 * w;
  rig.pivots.bodyRoot.rotation.z = -x * 0.07 * w;  // torso lean 25%
  rig.pivots.propPivot.rotation.z = x * 0.10 * w;  // hat/ear counter-tilt -15%
}
```

### 1D timeline scrubbing

```ts
export function scrub(rig: MascotRig, channel: string, progress0to1: number) {
  rig.state.scrub[channel] = clamp(progress0to1, 0, 1);
}

export function applyScrub(rig: MascotRig) {
  const t = rig.state.scrub.posture ?? 0;
  rig.pivots.bodyRoot.rotation.x = THREE.MathUtils.damp(
    rig.pivots.bodyRoot.rotation.x, -t * 0.25, 6, 1 / 60);
  rig.pivots.leftArmPivot.rotation.x = THREE.MathUtils.damp(
    rig.pivots.leftArmPivot.rotation.x, t * 1.2, 6, 1 / 60);
}
```

### Declarative view model binding

```ts
export function bindViewModel(rig: MascotRig, vm: MascotViewModel) {
  rig.state.vm = { ...rig.state.vm, ...vm };
  if (vm.mood) applyMood(rig, vm.mood, 1 / 60);
  if (typeof vm.progress === "number") scrub(rig, "posture", vm.progress);
  if (vm.posture) applyPosture(rig, vm.posture);
}
```

### Boop impulse

```ts
export function triggerBoop(rig: MascotRig, impulse = 1) {
  rig.state.boop = Math.min(1.6, rig.state.boop + impulse);
}
```

## 2. Spring-bone secondary physics (zero dependency)

Verlet integration with a rest pose, attached to ears, tails, hat brims, capes, antennae.

```ts
export function updateSpringBone(rig: MascotRig, delta: number) {
  const dt = Math.min(delta, 1 / 30);
  for (const s of rig.springs) {
    const world = s.node.getWorldPosition(new THREE.Vector3());
    const local = s.node.parent!.worldToLocal(world.clone());
    const target = s.rest.clone().applyQuaternion(s.node.parent!.quaternion).add(s.node.position);
    const deltaV = target.clone().sub(local).multiplyScalar(24 * dt); // stiffness
    s.vel.add(deltaV).multiplyScalar(Math.pow(0.12, dt * 60));       // damping
    s.node.position.add(s.vel.clone().multiplyScalar(dt));
  }
}
```

Tune stiffness and damping per part from the spec (`springStiffness`, `springDamping`). Ears and hat brims should overshoot; the tail should lag the torso by a frame or two.

## 3. Laya System 1 reflex router (`layaMascotRouter.ts`)

Fast path first, optional Laya backend for harder cases. Keep the whole decision under 35ms.

```ts
export interface MascotTelemetry {
  typingVelocity?: number;   // chars per second
  errorBurst?: number;        // errors in the last window
  idleSeconds?: number;
  paywallHoverMs?: number;
  eventKind?: "click" | "form_error" | "idle" | "paywall_hover" | "typing";
}

export interface ReflexDecision {
  shouldIntervene: number;   // noul: P(true) 0..1
  intensity: number;          // score: 0..4
  mood: MascotMood;           // choice: < 20 labels
}

const INTERVENE_THRESHOLD = 0.60;

export function decideReflex(t: MascotTelemetry): ReflexDecision {
  // noul: calibrated P(should_intervene)
  let p = 0.05;
  p += Math.min(0.35, (t.errorBurst ?? 0) * 0.18);
  p += Math.min(0.25, Math.max(0, (t.idleSeconds ?? 0) - 8) * 0.01);
  p += Math.min(0.30, (t.paywallHoverMs ?? 0) / 4000);
  if (t.eventKind === "click") p += 0.15;
  if (t.typingVelocity && t.typingVelocity > 2) p -= 0.2; // never nag a typing user
  const shouldIntervene = Math.max(0, Math.min(1, p));

  // score: 0..4 amplitude
  const intensity = shouldIntervene < INTERVENE_THRESHOLD
    ? 0
    : Math.min(4, Math.round((shouldIntervene - INTERVENE_THRESHOLD) * 10));

  // choice: mood, constant time
  const mood: MascotMood =
    t.eventKind === "paywall_hover" ? "paywall-plea"
    : t.eventKind === "form_error" ? "empathize"
    : t.eventKind === "idle" ? "sleepy"
    : intensity >= 4 ? "celebrate"
    : intensity >= 3 ? "wave"
    : intensity >= 2 ? "scan"
    : intensity >= 1 ? "listen"
    : "idle";

  return { shouldIntervene, intensity, mood };
}
```

### Optional real Laya backend (server side, `laya-serve` or `laya-client`)

Laya is a Python package (`pip install laya`); in JS it runs as `laya-ts` (local ONNX) or through a `laya-serve` HTTP endpoint. Keep the browser on the fast path and escalate only when the fast path is unsure.

```ts
export async function refineWithLaya(text: string, endpoint: string) {
  const res = await fetch(`${endpoint}/v1/systemone`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      state: { body: text },
      questions: {
        should_intervene: { type: "noul", instructions: "Does the mascot need to intervene now?" },
        intensity: { type: "score", instructions: "How intense should the reaction be?",
                     criteria: ["subtle eye glance", "gentle nod", "expressive gesture",
                                "full body bounce", "celebratory jump"] },
        mood: { type: "choice", instructions: "Which rig state fits?",
                criteria: { idle: "calm breathing", listen: "attentive", scan: "active scan",
                            thinking: "pondering", celebrate: "joy", empathize: "sympathetic",
                            wave: "greeting", "paywall-plea": "asking", "streak-fire": "streak",
                            sleepy: "resting" } }
      }
    })
  });
  return res.json();
}
```

Constraints that keep this honest: choice schemas stay under 20 labels (use two-step `predict_shortlist` coarse-to-fine filtering if more are needed), apply scalar temperature calibration to the returned probabilities, and the `noul` threshold stays at 0.60 so the mascot stays calm most of the time.

## 4. Universal BYOK provider router (client side only)

```ts
export interface ProviderConfig {
  id: "gemini" | "openai" | "anthropic" | "openrouter" | "nim" | "deepseek" | "ollama";
  baseUrl: string;
  model: string;
  apiKey?: string;
}

const KEY_VAULT_KEY = "mascot-studio.byok.v1";

export function saveKey(providerId: string, key: string) {
  const vault = JSON.parse(localStorage.getItem(KEY_VAULT_KEY) ?? "{}");
  vault[providerId] = key;
  localStorage.setItem(KEY_VAULT_KEY, JSON.stringify(vault));
  // UI must state: "Stored locally in your browser, never sent to any middleman server"
}

export async function chat(cfg: ProviderConfig, prompt: string, json = false) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cfg.id === "anthropic") {
    headers["x-api-key"] = cfg.apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true"; // browser CORS
  } else if (cfg.apiKey) {
    headers.authorization = `Bearer ${cfg.apiKey}`;
  }
  const body = cfg.id === "anthropic"
    ? { model: cfg.model, max_tokens: 4096, messages: [{ role: "user", content: prompt }] }
    : { model: cfg.model, messages: [{ role: "user", content: prompt }], ...(json ? { response_format: { type: "json_object" } } : {}) };

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${cfg.id} ${res.status}: ${await res.text()}`);
  return res.json();
}
```

Ship 6 Instant Studio Presets so the studio runs with zero API key on first launch. Verify current model IDs against each provider before shipping; pins go stale.

## 5. `MascotCharacterSpec` schema feeding `buildProceduralMascot(spec)`

```ts
export interface MascotCharacterSpec {
  archetype: "creature" | "object" | "mecha";
  name: string;
  primaryColor: string;   // 70%
  secondaryColor: string; // 20%
  accentColor: string;    // 10%
  glowColor: string;
  headScale: number;      // chibi: about 0.45 of total height
  bodyChubbiness: number;
  earScale: number;
  eyeScale: number;
  expression: "neutral" | "happy" | "focused" | "star" | "wink" | "sleepy" | "empathize";
  hatStyle: "none" | "cap" | "beanie" | "hood" | "crown";
  propType: "none" | "pad" | "orb" | "macbook" | "spyglass";
  surfacePreset: "glossy-vinyl" | "matte-clay" | "midnight-titanium" | "frosted-glass" | "pearl-ceramic" | "24k-gold";
  clearcoat: number; roughness: number; metalness: number;
  springStiffness: number; springDamping: number;
}
```

The compiler `buildProceduralMascot(spec)` is deterministic: same spec, same rig, under 50ms. It must reuse the 8-pass construction rules in `references/pipeline.md`.
