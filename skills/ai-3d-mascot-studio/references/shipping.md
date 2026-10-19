# Shipping Matrix — embedding the mascot factory

The deliverable is always: `createMascotModel.ts` (returns `THREE.Group`, with `userData.tick` and named pivots) + `object-sculpt-spec.json` (provenance). Land both files inside the consuming project (e.g. `src/mascots/<name>/`).

## Web / Next.js / React Three Fiber

```tsx
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { createMascotModel } from "@/mascots/atlas/createMascotModel";

export function Mascot({ mood = "idle" }: { mood?: MascotMood }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => { const g = createMascotModel(); ref.current = g; }, []);
  useFrame((_, delta) => ref.current?.userData.tick(delta, performance.now() / 1000, mood));
  return ref.current ? <primitive object={ref.current} dispose={null} /> : null;
}
```

- React-diffable by construction (code-only output). Keep `object-sculpt-spec.json` beside the factory as the source record for future rebuilds (`img2threejs` regenerates from specs deterministically-ish).
- Dark / light mode: switch environment lighting presets, not the model.

## React Native / Expo (iOS + Android)

Two supported shells, pick by app budget:

1. **expo-gl + expo-three canvas** — native GL context, lowest latency, more boilerplate.
2. **Self-contained HTML/Three.js WebView** — one local HTML file (Three.js bundled, no CDN/asset downloads), `postMessage({ type: "setMood", mood: "celebrate" })` from RN; 60fps, tiny footprint. Preferred default for Expo.

WebView state contract:

```js
// RN side
webViewRef.current?.injectJavaScript(`
  window.setMood && window.setMood(${JSON.stringify(mood)});
`);
```

```js
// HTML side — respond to state triggers
window.setMood = (mood) => mascot.setState(mood); // idle | happy | thinking | scan | celebrate | rest
```

## iOS / native (Storyboard / SwiftUI)

Three.js platform is Web — for true native targets prefer a WebView shell (above). If a `.glb`/mesh file is genuinely required (rare — violates the code-only contract), STOP and get explicit user approval to opt in to `img2 add img2glb` (hosted TRELLIS route); it changes the output contract and must be a deliberate decision.

## Instant conversation preview

- 2D concept: studio concept image.
- 3D: copy-pasteable single-file `preview.html` (Three.js from a CDN import map, orbits, tick loop running) written next to the factory — user opens it in a browser immediately.

## Render hygiene for screenshots / App Store

Save renders at 2x, transparent background (`alpha: true`), and re-apply the `lighting-pass` preset rather than screen-recording the review sheet — review sheets are evidence, not product art.
