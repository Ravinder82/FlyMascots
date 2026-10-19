import * as THREE from 'three';
import {
  BAKED_MASCOT_CONFIG,
  createStudioEnvTexture,
  createSoftShadowMap,
  buildProceduralMascot,
} from './engine.js';

/* ------------------------------------------------------------------ *
 * Axo stage — the real MascotForge export, rendered for capture.
 * Geometry: exact mascot-engine.js build. Materials: sampled from the
 * 3D studio reference render (the quality bar), not the baked hex.
 * ------------------------------------------------------------------ */

const q = new URLSearchParams(location.search);
const BARE = q.get('ui') === '0';
const TRANSPARENT = q.get('bg') === 'transparent';
const CAPTURE = q.get('capture') === '1';
const BLINK_HOLD = Number(q.get('blinkhold')) || 0;
const DPR = Number(q.get('dpr')) || Math.min(window.devicePixelRatio || 1, 2);

if (BARE) document.body.classList.add('is-bare');
if (TRANSPARENT) document.body.classList.add('is-transparent');
if (CAPTURE) document.body.classList.add('is-capture');

/* Reference-sampled palette (Axo studio render). */
const THEME = {
  body: '#7dd1c3',
  bodyRoughness: 0.46,
  bodyClearcoat: 0.65,
  belly: '#f4f0e8',
  accent: '#41cbb7',
  accentRoughness: 0.24,
  visor: '#b7bae0',
  eye: '#0b0b12',
};

const MOODS = {
  idle: { label: 'idle', pose: 'idle', pitch: 0.0, work: 'breathing' },
  working: { label: 'working', pose: 'work', pitch: 0.06, work: 'goggles down' },
  think: { label: 'thinking', pose: 'think', pitch: 0.0, work: 'chin in hand' },
  celebrate: { label: 'celebrate', pose: 'celebrate', pitch: -0.05, work: 'hopping' },
  sleep: { label: 'sleeping', pose: 'idle', pitch: 0.15, work: 'eyes closed', asleep: true },
};

function normMood(value) {
  const v = String(value || '').toLowerCase();
  if (v === 'work') return 'working';
  if (v === 'thinking') return 'think';
  if (v === 'sleeping' || v === 'sleepy') return 'sleep';
  return MOODS[v] ? v : 'idle';
}

const INITIAL_MOOD = normMood(q.get('mood') || 'idle');
const INITIAL_T = q.get('t') !== null ? Number(q.get('t')) : null;

/* ------------------------------------------------------------------ *
 * Renderer + scene
 * ------------------------------------------------------------------ */

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
const CAM_YAW = Number(q.get('yaw')) || 0;
const CAM_DIST = Number(q.get('dist')) || 6.9;
const CAM_Y = Number(q.get('camy')) || 0.5;
const CAM_LOOK = q.get('looky') !== null ? Number(q.get('looky')) : 0.42;
camera.position.set(Math.sin(CAM_YAW) * CAM_DIST, CAM_Y, Math.cos(CAM_YAW) * CAM_DIST);
camera.lookAt(0, CAM_LOOK, 0);

const envMap = createStudioEnvTexture(renderer, 'softbox');
scene.environment = envMap;

/* Studio lights — the reference render is a bright soft-room, not the
   engine's dark rig. Env stays for reflections only. */
const hemi = new THREE.HemisphereLight(0xfff9f0, 0xcfc6b8, 2.1);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xfff4e6, 3.2);
keyLight.position.set(4.5, 6.5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xd9edff, 1.15);
fillLight.position.set(-6, 2.5, 4.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xcdeaff, 1.35);
rimLight.position.set(-3, 4.5, -6);
scene.add(rimLight);

const bounceLight = new THREE.DirectionalLight(0xffe6c9, 0.55);
bounceLight.position.set(0, -4, 4.5);
scene.add(bounceLight);

/* Soft contact shadow (engine's own gradient sprite). */
const shadowTex = createSoftShadowMap();
const shadowMat = new THREE.MeshBasicMaterial({
  map: shadowTex,
  transparent: true,
  opacity: 0.32,
  depthWrite: false,
});
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.5), shadowMat);
shadow.rotation.x = -Math.PI / 2;
shadow.position.set(0, -1.5, 0.1);
scene.add(shadow);

/* ------------------------------------------------------------------ *
 * Mascot
 * ------------------------------------------------------------------ */

const CONFIG = {
  ...BAKED_MASCOT_CONFIG,
  pose: 'idle',
  trackCursor: true,
  levitation: 0.2,
  breathSpeed: 2,
};

let root = null;
let pivots = null;
let eyesGroup = null;
let lensGroup = null;
let simTime = 0;
let mood = INITIAL_MOOD;
let timeline = null;
let timelineIndex = 0;
let sleepEase = 0;
let blinkHoldFrames = 0;

let pitch = 0;
let pitchVel = 0;
let gazeX = 0;
let gazeY = 0;
let gazeTargetX = 0;
let gazeTargetY = 0;

function applyTheme(mascot) {
  const { materials, pivots: p } = mascot.userData;

  materials.primaryMat.color.set(THEME.body);
  materials.primaryMat.roughness = THEME.bodyRoughness;
  materials.primaryMat.metalness = 0.02;
  materials.primaryMat.clearcoat = THEME.bodyClearcoat;
  materials.primaryMat.clearcoatRoughness = 0.26;
  materials.primaryMat.envMapIntensity = 0.55;

  materials.bellyMat.color.set(THEME.belly);
  materials.bellyMat.roughness = 0.62;
  materials.bellyMat.metalness = 0.0;
  materials.bellyMat.clearcoat = 0.35;
  materials.bellyMat.envMapIntensity = 0.3;

  materials.accentMat.color.set(THEME.accent);
  materials.accentMat.roughness = THEME.accentRoughness;
  materials.accentMat.metalness = 0.1;
  materials.accentMat.clearcoat = 0.6;
  materials.accentMat.envMapIntensity = 0.7;

  materials.visorGlassMat.color.set('#b0b5dd');
  materials.visorGlassMat.roughness = 0.05;
  materials.visorGlassMat.metalness = 0.0;
  materials.visorGlassMat.clearcoat = 1.0;
  materials.visorGlassMat.clearcoatRoughness = 0.02;
  materials.visorGlassMat.envMapIntensity = 1.0;
  materials.visorGlassMat.transparent = true;
  materials.visorGlassMat.opacity = 0.94;
  materials.visorGlassMat.needsUpdate = true;

  materials.eyeGlowMat.color.set(THEME.eye);
  materials.eyeGlowMat.emissive.set(0x000000);
  materials.eyeGlowMat.emissiveIntensity = 0;
  materials.eyeGlowMat.roughness = 0.12;
  materials.eyeGlowMat.needsUpdate = true;

  // The engine puts the eyes on headPivot; find the group by position.
  for (const child of p.headPivot.children) {
    if (child.isGroup && child.position.z > 0.9) {
      eyesGroup = child;
      break;
    }
  }

  // Give the goggle lenses their own slightly lighter glass.
  lensGroup = p.gogglesPivot;
  p.gogglesPivot.scale.setScalar(1.12);
  p.gogglesPivot.position.y -= 0.065;
  p.gogglesPivot.position.z += 0.045;
  p.gogglesPivot.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.geometry.type === 'SphereGeometry') {
      const lensMat = materials.visorGlassMat.clone();
      lensMat.color.set('#b3b8de');
      lensMat.opacity = 0.96;
      lensMat.envMapIntensity = 1.8;
      lensMat.needsUpdate = true;
      obj.material = lensMat;
    }
  });

  return { materials, pivots: p };
}

function build() {
  if (root) {
    scene.remove(root);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material?.dispose?.();
      }
    });
  }
  root = buildProceduralMascot({ ...CONFIG }, envMap);
  const themed = applyTheme(root);
  pivots = themed.pivots;
  scene.add(root);
  simTime = 0;
  timelineIndex = 0;
  sleepEase = 0;
  blinkHoldFrames = 0;
  pitch = 0;
  pitchVel = 0;
  gazeX = 0;
  gazeY = 0;
  gazeTargetX = 0;
  gazeTargetY = 0;
  root.userData.pointerX = 0;
  root.userData.pointerY = 0;
  updateReadout();
}

/* ------------------------------------------------------------------ *
 * Simulation
 * ------------------------------------------------------------------ */

function stepSim(dt) {
  const m = MOODS[mood];
  const state = { ...CONFIG, pose: m.pose };

  gazeX += (gazeTargetX - gazeX) * Math.min(1, dt * 6);
  gazeY += (gazeTargetY - gazeY) * Math.min(1, dt * 6);
  root.userData.pointerX = gazeX;
  root.userData.pointerY = gazeY;

  root.userData.tick(dt, simTime, state);

  // Head pitch spring (k70/d11, the shipped Swift constants).
  const targetPitch = m.pitch + gazeY * 0.1;
  const h = dt / 2;
  for (let i = 0; i < 2; i++) {
    pitchVel += (-70 * (pitch - targetPitch) - 11 * pitchVel) * h;
    pitch += pitchVel * h;
  }
  pivots.headPivot.rotation.x = pitch;

  // Sleep overrides the engine's blink target with a fast, soft close.
  const targetSleep = m.asleep ? 1 : 0;
  sleepEase += (targetSleep - sleepEase) * Math.min(1, dt * 8);
  if (eyesGroup) {
    if (sleepEase > 0.002) {
      const eased = sleepEase * sleepEase * (3 - 2 * sleepEase);
      eyesGroup.scale.y = THREE.MathUtils.lerp(eyesGroup.scale.y, 1 - eased * 0.92, 0.65);
    }
  }

  // Capture mode can hold a blink closed for a readable beat on film.
  if (BLINK_HOLD > 0) {
    const u = root.userData;
    if (u.isBlinking) {
      if (blinkHoldFrames < Math.round(BLINK_HOLD * 60)) {
        blinkHoldFrames++;
        u.blinkTimer = 0.05;
      }
    } else {
      blinkHoldFrames = 0;
    }
  }

  // Shadow reacts to levitation.
  const bodyY = pivots.bodyRoot.position.y;
  const lift = Math.max(0, bodyY - 0.2);
  shadow.scale.set(1 + lift * 0.1, 1 + lift * 0.1, 1);
  shadowMat.opacity = 0.32 - lift * 0.1;
}

function stepUntil(target) {
  const step = 1 / 60;
  let guard = 0;
  while (simTime + step <= target + 1e-6 && guard++ < 40000) {
    if (timeline) {
      while (timelineIndex < timeline.length && timeline[timelineIndex].t <= simTime + 1e-6) {
        const entry = timeline[timelineIndex++];
        if (entry.mood) setMood(entry.mood);
        if (entry.boop && root) root.userData.boop();
      }
    }
    stepSim(step);
    simTime += step;
  }
  render();
}

function render() {
  renderer.render(scene, camera);
}

/* ------------------------------------------------------------------ *
 * Public API — the UI uses it; the capture rig uses it.
 * ------------------------------------------------------------------ */

function setMood(next, silent = false) {
  const m = normMood(next);
  if (!MOODS[m]) return;
  mood = m;
  if (!silent && root) root.userData.boop();
  document.querySelectorAll('.mood-pill').forEach((pill) => {
    pill.setAttribute('aria-pressed', String(pill.dataset.mood === m));
  });
  updateReadout();
}

function updateReadout() {
  const m = MOODS[mood];
  const readout = document.getElementById('readout');
  const tag = document.getElementById('mood-tag-label');
  if (readout) readout.innerHTML = `<b>mood</b> ${m.label} · <b>state</b> ${m.work} · <b>springs</b> k70/d11`;
  if (tag) tag.textContent = m.label;
}

function still(options = {}) {
  const m = normMood(options.mood || mood);
  const t = options.t != null ? options.t : 2.4;
  resetForCapture(m);
  stepUntil(t);
  return { mood: m, time: simTime };
}

function resetForCapture(startMood) {
  build();
  setMood(startMood, true);
  simTime = 0;
  render();
}

function seekTo(t, nextTimeline) {
  if (nextTimeline) timeline = nextTimeline;
  if (t < simTime - 1e-6) resetForCapture(mood);
  stepUntil(t);
  return { mood, time: simTime };
}

function resetFilm(nextTimeline) {
  timeline = nextTimeline || null;
  const first = timeline && timeline.length ? timeline[0].mood : mood;
  resetForCapture(first);
  stepUntil(0);
  return { mood, time: simTime };
}

function boop() {
  if (root) root.userData.boop();
}

window.AxoStage = {
  setMood,
  boop,
  still,
  seekTo,
  resetFilm,
  debug: () => ({
    blinking: root?.userData?.isBlinking,
    blinkTimer: root?.userData?.blinkTimer,
    eyeY: eyesGroup?.scale.y,
    simTime,
    hold: blinkHoldFrames,
  }),
  get mood() {
    return mood;
  },
  get time() {
    return simTime;
  },
  render: render,
};

/* ------------------------------------------------------------------ *
 * Sizing + live loop
 * ------------------------------------------------------------------ */

const stageCard = document.querySelector('.stage-card');

function resize() {
  const rect = stageCard.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  render();
}

new ResizeObserver(resize).observe(stageCard);
resize();

build();
setMood(INITIAL_MOOD, true);

// Warm-up so the first frame is settled and shader-compiled.
stepUntil(0.9);

const frozen = INITIAL_T !== null || CAPTURE;
if (frozen) {
  const t = INITIAL_T !== null ? INITIAL_T : 2.4;
  resetForCapture(INITIAL_MOOD);
  stepUntil(t);
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    simTime += dt;
    stepSim(dt);
    render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* UI */

document.querySelectorAll('.mood-pill').forEach((pill) => {
  pill.addEventListener('click', () => setMood(pill.dataset.mood));
});

document.getElementById('boop')?.addEventListener('click', () => {
  boop();
});

canvas.addEventListener('click', () => boop());

window.addEventListener('pointermove', (event) => {
  const rect = stageCard.getBoundingClientRect();
  const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  gazeTargetX = THREE.MathUtils.clamp(nx, -1, 1) * 0.85;
  gazeTargetY = THREE.MathUtils.clamp(ny, -1, 1) * 0.7;
});

window.addEventListener('pointerleave', () => {
  gazeTargetX = 0;
  gazeTargetY = 0;
});

window.addEventListener('keydown', (event) => {
  const order = ['idle', 'working', 'think', 'celebrate', 'sleep'];
  const index = Number(event.key) - 1;
  if (order[index]) setMood(order[index]);
  if (event.key === 'b' || event.key === 'B') boop();
});

/* The host page drives the stage (site mood buttons, capture scripts).
 * Works across frames — the stage never reaches into its parent. */
window.addEventListener('message', (event) => {
  const data = event && event.data;
  if (!data || data.type !== 'flymascots') return;
  if (data.freeze === true) {
    // Deterministic pose: reset + step to the same sim time every time.
    still({ mood: data.mood || mood });
    return;
  }
  if (typeof data.seek === 'number') {
    seekTo(data.seek, data.mood || mood);
    return;
  }
  if (data.mood) setMood(data.mood);
  if (data.boop) boop();
});

window.__AXO_READY = true;
render();

/* Tell a host page (the landing page, a capture script) we can take orders. */
if (window.parent !== window) {
  window.parent.postMessage({ type: 'flymascots', ready: true, mood }, '*');
}
