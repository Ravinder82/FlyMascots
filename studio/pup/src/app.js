import * as THREE from 'three';
import { buildPup, buildStudioScene, MOODS, POSES } from './mascot.js';

const params = new URLSearchParams(location.search);
const bare = params.get('ui') === '0';
const captureMode = params.get('capture') === '1';

if (bare) {
  document.querySelector('.rail').style.display = 'none';
  document.querySelector('.app').style.gridTemplateColumns = '1fr';
  document.querySelector('.stage-top').style.display = 'none';
  document.querySelector('.ref-strip').style.display = 'none';
  document.querySelector('.stage-foot').style.display = 'none';
  // dark studio sweep: a cream-on-cream frame has no silhouette separation
  const wrap = document.querySelector('.stage-wrap');
  if (params.get('alpha') !== '1') {
    wrap.style.background = 'radial-gradient(ellipse 70% 60% at 50% 32%, #3b3129 0%, #241c16 46%, #120e0b 100%)';
  }
}
if (params.get('alpha') === '1') {
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  const wrap = document.querySelector('.stage-wrap');
  wrap.style.background = 'transparent';
  wrap.style.setProperty('--x', '0');
  const style = document.createElement('style');
  style.textContent = '.stage-wrap::after{display:none}';
  document.head.appendChild(style);
}

/* ---------------- renderer ---------------- */

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// AgX holds hue into the highlights; ACES pulls warm tones toward yellow,
// which is the single biggest "CG plastic" tell on a golden character.
const TONEMAP = params.get('tm') || 'agx';
if (TONEMAP === 'aces') {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.84;
} else if (TONEMAP === 'neutral') {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
} else {
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 0.72;
}
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x000000, 0);

if (params.get('alpha') === '1') {
  // silhouette/alpha captures must not include the painted contact shadow
  requestAnimationFrame(() => {
    pup.root.children.forEach((c) => {
      if (c.isMesh && c.material && c.material.transparent) c.visible = false;
    });
  });
}

/* ---------------- pup ---------------- */

const pup = buildPup();
const { scene } = buildStudioScene(renderer, pup);

/* ---------------- camera ---------------- */

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
const rig = {
  yaw: 0,
  pitch: 0.10,
  dist: 4.55,
  targetYaw: 0,
  targetPitch: 0.10,
  targetDist: 4.55,
  lookY: 1.03,
  targetLookY: 1.03,
};

const ANGLES = {
  front: { label: 'Front', yaw: 0, pitch: 0.10, dist: 4.5 },
  'three-quarter': { label: '3/4 front', yaw: -0.62, pitch: 0.11, dist: 4.5 },
  side: { label: 'Side', yaw: -Math.PI / 2, pitch: 0.075, dist: 4.5 },
  'three-quarter-back': { label: '3/4 back', yaw: -(Math.PI - 0.66), pitch: 0.12, dist: 4.5 },
  back: { label: 'Back', yaw: Math.PI, pitch: 0.10, dist: 4.5 },
};

function setAngle(name, immediate = false) {
  const a = ANGLES[name] || ANGLES.front;
  rig.targetYaw = a.yaw;
  rig.targetPitch = a.pitch;
  rig.targetDist = a.dist;
  rig.lookY = 1.03;
  rig.targetLookY = 1.03;
  if (immediate) {
    rig.yaw = a.yaw;
    rig.pitch = a.pitch;
    rig.dist = a.dist;
  }
  state.angle = name;
  syncChips();
}

function placeCamera() {
  const cp = Math.cos(rig.pitch);
  camera.position.set(
    Math.sin(rig.yaw) * rig.dist * cp,
    rig.lookY + Math.sin(rig.pitch) * rig.dist,
    Math.cos(rig.yaw) * rig.dist * cp
  );
  camera.lookAt(0, rig.lookY, 0);
}

/* ---------------- UI ---------------- */

const state = {
  mood: 'happy',
  pose: 'stand',
  angle: 'front',
  turntable: false,
};

const moodIds = Object.keys(MOODS);
const poseIds = Object.keys(POSES);

const $angles = document.getElementById('angles');
const $moods = document.getElementById('moods');
const $poses = document.getElementById('poses');
const $refs = document.getElementById('refs');
const $toast = document.getElementById('toast');

function chip(label, pressed, onClick, cls = '') {
  const b = document.createElement('button');
  b.className = `chip ${cls}`.trim();
  b.type = 'button';
  b.textContent = label;
  b.setAttribute('aria-pressed', String(pressed));
  b.addEventListener('click', onClick);
  return b;
}

function buildChips() {
  for (const key of Object.keys(ANGLES)) {
    const el = chip(ANGLES[key].label, key === state.angle, () => setAngle(key));
    el.dataset.angle = key;
    $angles.appendChild(el);
  }
  for (const key of moodIds) {
    const el = chip(MOODS[key].label, key === state.mood, () => setMood(key), 'mood');
    el.dataset.mood = key;
    $moods.appendChild(el);
  }
  for (const key of poseIds) {
    const el = chip(POSES[key].label, key === state.pose, () => setPose(key));
    el.dataset.pose = key;
    $poses.appendChild(el);
  }

  const refOrder = ['front', 'three-quarter', 'side', 'three-quarter-back', 'back'];
  for (const key of refOrder) {
    const b = document.createElement('button');
    b.className = 'ref';
    b.type = 'button';
    b.dataset.angle = key;
    b.setAttribute('aria-pressed', String(key === state.angle));
    b.setAttribute('aria-label', `Reference ${ANGLES[key].label}`);
    b.innerHTML = `<img src="renders/ref-${key}.png" alt="" loading="lazy" /><span>${ANGLES[key].label}</span>`;
    b.addEventListener('click', () => setAngle(key));
    $refs.appendChild(b);
  }
}

function syncChips() {
  document.querySelectorAll('[data-angle]').forEach((el) => {
    if (el.classList.contains('chip') || el.classList.contains('ref')) {
      el.setAttribute('aria-pressed', String(el.dataset.angle === state.angle));
    }
  });
  document.querySelectorAll('[data-mood]').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.mood === state.mood));
  });
  document.querySelectorAll('[data-pose]').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.pose === state.pose));
  });
  const rm = document.getElementById('r-mood');
  const rp = document.getElementById('r-pose');
  if (rm) rm.textContent = MOODS[state.mood]?.label || state.mood;
  if (rp) rp.textContent = POSES[state.pose]?.label || state.pose;
}

function setMood(name) {
  if (!MOODS[name]) return;
  state.mood = name;
  pup.setMood(name);
  syncChips();
}

function setPose(name) {
  if (!POSES[name]) return;
  state.pose = name;
  pup.setPose(name);
  syncChips();
}

let toastTimer = 0;
function toast(text) {
  $toast.textContent = text;
  $toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('on'), 700);
}

function boop() {
  pup.triggerBoop();
  if (state.mood === 'sad' || state.mood === 'calm') setMood('happy');
  toast('boop');
}

/* ---------------- pointer ---------------- */

const pointer = { down: false, moved: 0, lastX: 0, lastY: 0, nx: 0, ny: 0 };

canvas.addEventListener('pointerdown', (e) => {
  pointer.down = true;
  pointer.moved = 0;
  pointer.lastX = e.clientX;
  pointer.lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.nx = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.ny = ((e.clientY - r.top) / r.height) * 2 - 1;
  pup.setLookTarget(pointer.nx, pointer.ny, pointer.down ? 0.35 : 1);

  if (pointer.down) {
    const dx = e.clientX - pointer.lastX;
    const dy = e.clientY - pointer.lastY;
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
    pointer.moved += Math.abs(dx) + Math.abs(dy);
    rig.targetYaw -= dx * 0.0075;
    rig.targetPitch = THREE.MathUtils.clamp(rig.targetPitch + dy * 0.0045, -0.35, 0.72);
    rig.yaw = rig.targetYaw;
    rig.pitch = rig.targetPitch;
    state.turntable = false;
    document.getElementById('turntable').setAttribute('aria-pressed', 'false');
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (pointer.down && pointer.moved < 6) boop();
  pointer.down = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
});

canvas.addEventListener('pointerleave', () => {
  pointer.down = false;
  pup.setLookTarget(0, 0, 1);
});

document.getElementById('boop').addEventListener('click', boop);

document.getElementById('turntable').addEventListener('click', (e) => {
  state.turntable = !state.turntable;
  e.currentTarget.setAttribute('aria-pressed', String(state.turntable));
});

window.addEventListener('keydown', (e) => {
  const n = Number(e.key);
  if (n >= 1 && n <= 7) setMood(moodIds[n - 1]);
  const angleKeys = ['q', 'w', 'e', 'r', 't'];
  const ai = angleKeys.indexOf(e.key.toLowerCase());
  if (ai >= 0) setAngle(Object.keys(ANGLES)[ai]);
  if (e.key.toLowerCase() === 'b') boop();
  if (e.code === 'Space') {
    e.preventDefault();
    state.turntable = !state.turntable;
    document.getElementById('turntable').setAttribute('aria-pressed', String(state.turntable));
  }
});

/* ---------------- resize ---------------- */

let FIXED_RES = null;
function resize() {
  if (FIXED_RES) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ro = new ResizeObserver(resize);
ro.observe(canvas.parentElement);
resize();

/* ---------------- loop ---------------- */

const clock = new THREE.Clock();
let simTime = 0;
let frame = 0;
let triangleText = '';

function step(dt) {
  simTime += dt;
  pup.tick(dt, simTime);

  if (state.turntable) {
    rig.targetYaw += dt * 0.55;
    rig.yaw = rig.targetYaw;
  } else {
    rig.yaw = THREE.MathUtils.damp(rig.yaw, rig.targetYaw, 6, dt);
    rig.pitch = THREE.MathUtils.damp(rig.pitch, rig.targetPitch, 6, dt);
  }
  rig.dist = THREE.MathUtils.damp(rig.dist, rig.targetDist, 5, dt);
  placeCamera();

  // a barely-there camera breath, so a still screen still feels alive
  camera.position.x += Math.sin(simTime * 0.44) * 0.006;
  camera.position.y += Math.cos(simTime * 0.37) * 0.005;
  camera.lookAt(0, rig.lookY, 0);
}

function render() {
  renderer.render(scene, camera);
  frame++;
  if (frame % 12 === 0) {
    const tris = renderer.info.render.triangles;
    const t = `${(tris / 1000).toFixed(1)}k`;
    if (t !== triangleText) {
      triangleText = t;
      const el = document.getElementById('r-tris');
      if (el) el.textContent = t;
    }
  }
}

function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  step(dt);
  render();
  requestAnimationFrame(loop);
}

/* ---------------- deterministic capture API ---------------- */

function still({ mood = state.mood, pose = state.pose, angle = state.angle, t = 2.2 } = {}) {
  setMood(mood);
  setPose(pose);
  setAngle(angle, true);
  rig.yaw = rig.targetYaw;
  rig.pitch = rig.targetPitch;
  rig.dist = rig.targetDist;
  simTime = 0;
  const h = 1 / 60;
  for (let i = 0; i < Math.round(t / h); i++) step(h);
  render();
  return { mood: state.mood, pose: state.pose, angle: state.angle, time: simTime };
}

function seekTo(time, mood = state.mood, pose = state.pose) {
  setMood(mood);
  setPose(pose);
  simTime = 0;
  const h = 1 / 60;
  for (let i = 0; i < Math.round(time / h); i++) step(h);
  render();
  return { mood: state.mood, time: simTime };
}

window.SunnyStage = {
  setMood,
  setPose,
  setAngle,
  boop,
  still,
  seekTo,
  render,
  // Offscreen full-resolution capture: the canvas keeps its CSS size so the
  // page never reflows, but the drawing buffer grows to w x h. toDataURL then
  // reads the full buffer.
  setResolution(w, h) {
    FIXED_RES = { w, h };
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // a 16:9 hero wants the subject filling the frame, not floating in it
    rig.dist = camera.aspect > 1.4 ? 3.48 : rig.targetDist;
    rig.targetDist = rig.dist;
    placeCamera();
    render();
  },
  // Hand the built character to Blender. Keeps materials, vertex colours and
  // the pivot hierarchy, so Blender is only responsible for fur and rendering.
  async exportGLB() {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    // The blink damps eyes.scale.y to 0.04; exporting mid-blink bakes a
    // squashed eyeball into the GLB and every still then looks sleepy.
    // The blink loop keeps re-writing eyes.scale.y on rAF, and the exporter
    // reads the cached matrix, so both the value and the matrix have to be
    // frozen for the duration of the export.
    const thawed = [];
    pup.root.traverse((o) => {
      if (o.name === 'eyeL' || o.name === 'eyeR') {
        o.scale.y = 1;
        o.updateMatrix();
        o.matrixAutoUpdate = false;
        thawed.push(o);
      }
    });
    const glb = await exporter.parseAsync(pup.root, { binary: true, onlyVisible: true });
    for (const o of thawed) o.matrixAutoUpdate = true;
    const blob = new Blob([glb], { type: 'model/gltf-binary' });
    return await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });
  },
  get state() { return { ...state, time: simTime }; },
  get mood() { return state.mood; },
  get pose() { return state.pose; },
  get angle() { return state.angle; },
  pup,
  camera,
  scene,
  renderer,
};

/* ---------------- boot ---------------- */

buildChips();
setMood(params.get('mood') || 'happy');
setPose(params.get('pose') || 'stand');
setAngle(params.get('angle') || 'front', true);

if (captureMode) {
  const t = Number(params.get('t') || 2.2);
  still({ mood: state.mood, pose: state.pose, angle: state.angle, t });
  window.__SUNNY_READY = true;
} else {
  loop();
  // warm up a beat so the first frame is already settled, then flag ready
  for (let i = 0; i < 30; i++) step(1 / 60);
  render();
  window.__SUNNY_READY = true;
}

window.parent !== window &&
  window.parent.postMessage({ type: 'flymascots', ready: true, mascot: 'sunny' }, '*');
