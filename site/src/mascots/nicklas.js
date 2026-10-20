/**
 * Nicklas — 24K Royal Gold St. Nick
 * A ready-made mascot loaded from a sculpt (GLB) instead of built in code.
 *
 * The sculpt ships as a meshopt-compressed GLB plus a base64 wrapper so it
 * loads from file:// as well as http://. Parts are addressed by mesh index
 * (the sculpt's nodes carry no semantic names), and rig pivots are created at
 * runtime — re-parenting a part under a pivot keeps its world position, so
 * the head can nod without the mesh surgery.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/* Studio config that produced the sculpt (MascotForge / img2threejs v7). */
export const NICKLAS_CONFIG = {
  name: 'Nicklas — 24K Royal Gold St. Nick',
  suitColor: '#470000',
  furColor: '#665200',
  skinColor: '#b84300',
  blushColor: '#ff0026',
  beltColor: '#27272A',
  goldColor: '#FBBF24',
  headScale: 1.06,
  bodyChubbiness: 1.04,
  beardScale: 0.72,
  hatScale: 0.82,
  clearcoat: 0.04,
  roughness: 0.86,
  metalness: 0.2,
  eyeScale: 1,
  eyeSquint: 0.24,
  cheekPuff: 1.17,
  noseScale: 0.75,
  mouthSmile: 0.92,
  glassesMode: 'hidden',
  propMode: 'gift',
  furRoughness: 0.94,
  velvetSheen: 0.25,
  goldAnisotropy: 1,
  glowIntensity: 1.8,
  lightAzimuth: -85,
  lightElevation: 3.6,
  keyIntensity: 1.05,
  cameraFov: 55,
  exposure: 0.75,
  snowSpeed: 0.35,
  animSpeed: 0.6,
  springStiffness: 260,
  springDamping: 11.5,
  windForce: 0.2,
  trackCursor: true,
  autoOrbit: false,
  wireframe: false,
};

/* Mesh index → part. From the sculpt's world-space bounds:
 * 0-3 pedestal, 4-9 boots, 10-15 coat/belt, 16 beard, 17/19 sideburns,
 * 18/20 blush, 21-28 eyes, 29/30 brows, 31 nose, 32/33 chest ruff, 34/35
 * forearms, 36 mouth, 37/38 moustache, 39 head, 40 hat, 41 pom, 42-49 right
 * arm + gift, 50-52 left arm, 53-64 sparkles. */
const EYES = [21, 22, 23, 24, 25, 26, 27, 28];
const HEAD = [16, 17, 18, 19, 20, 29, 30, 31, 36, 37, 38, 39, 40, 41];
const RIGHT_ARM = [34, 42, 43, 44, 45, 46, 47, 48, 49];
const LEFT_ARM = [35, 50, 51, 52];

/* Pivot anchors in model space (the sculpt stands on y = -1.59). */
const NECK = new THREE.Vector3(0, 0.52, 0.04);
const EYE_MID = new THREE.Vector3(-0.22, 0.9, 0.86);
const RIGHT_SHOULDER = new THREE.Vector3(-0.76, 0.26, 0.06);
const LEFT_SHOULDER = new THREE.Vector3(0.78, 0.24, 0.06);

export const NICKLAS = {
  id: 'nicklas',
  label: 'Nicklas',
  subtitle: '24K Royal Gold St. Nick',
  kind: 'glb',
  modelUrl: 'mascots/nicklas/model.js',
  config: NICKLAS_CONFIG,
  camera: { dist: 8.2, camy: 0.62, looky: 0.46, fov: 38 },
  plinth: true,
};

/* ------------------------------------------------------------------ *
 * Loading — the model rides in a classic script as base64 so it works
 * from file:// (no fetch, no CORS, no decoder download).
 * ------------------------------------------------------------------ */

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function loadModelScript(url, id) {
  return new Promise((resolve, reject) => {
    const registry = (window.__FLYMASCOT_MODELS__ = window.__FLYMASCOT_MODELS__ || {});
    if (registry[id]) return resolve(registry[id]);
    // The stage ships in two places (website/assets and the site/ build
    // copy) — try both so the model resolves wherever the stage lives.
    // Order matters: the wrong path logs a 404 in the console, so try the
    // one that matches this build first.
    const inSiteBuild = /\/site\//.test(location.pathname);
    const candidates = inSiteBuild
      ? [`../website/assets/${url}`, url]
      : [url, `../website/assets/${url}`];
    let attempt = 0;
    const tryNext = () => {
      if (attempt >= candidates.length) {
        reject(new Error(`model "${id}" could not be loaded`));
        return;
      }
      const script = document.createElement('script');
      script.src = candidates[attempt++];
      script.onload = () => {
        if (registry[id]) resolve(registry[id]);
        else tryNext();
      };
      script.onerror = () => tryNext();
      document.head.appendChild(script);
    };
    tryNext();
  });
}

/* One load per page — the stage and a click can both ask for the model. */
let modelPromise = null;

export async function loadNicklasModel(modelUrl = NICKLAS.modelUrl) {
  if (!modelPromise) {
    modelPromise = (async () => {
      const base64 = await loadModelScript(modelUrl, NICKLAS.id);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const buffer = decodeBase64(base64);
      const gltf = await new Promise((resolve, reject) => {
        loader.parse(buffer, '', resolve, reject);
      });
      return gltf.scene;
    })();
  }
  return modelPromise;
}

/* ------------------------------------------------------------------ *
 * Rig — pivots without touching the sculpt's vertices.
 * ------------------------------------------------------------------ */

/** Move `mesh` under `pivot`, keeping its world transform. */
function reparent(mesh, pivot, pivotPos) {
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  mesh.updateWorldMatrix(true, false);
  mesh.matrixWorld.decompose(worldPos, worldQuat, worldScale);
  mesh.parent?.remove(mesh);
  pivot.add(mesh);
  mesh.position.copy(worldPos).sub(pivotPos);
  mesh.quaternion.copy(worldQuat);
  mesh.scale.copy(worldScale);
}

function makePivot(parent, position) {
  const pivot = new THREE.Group();
  pivot.position.copy(position);
  parent.add(pivot);
  return pivot;
}

export function buildNicklasRig(source) {
  // Clone per build: the rig re-parents parts, so the cached model has to
  // stay pristine for the next rebuild (mood resets, captures).
  const modelScene = source.clone(true);
  const meshes = [];
  modelScene.updateWorldMatrix(true, true);
  modelScene.traverse((obj) => {
    if (obj.isMesh) meshes.push(obj);
  });

  const bodyRoot = new THREE.Group();
  bodyRoot.name = 'bodyRoot';
  const modelRoot = new THREE.Group();
  modelRoot.name = 'modelRoot';
  bodyRoot.add(modelRoot);

  const sceneRoot = modelScene;
  modelRoot.add(sceneRoot);

  // The sculpt sits on its own plinth; drop it so the stage floor reads.
  const plinth = new THREE.Group();
  plinth.name = 'plinthGroup';
  modelRoot.add(plinth);
  for (const index of [0, 1, 2, 3]) {
    const mesh = meshes[index];
    if (mesh) reparent(mesh, plinth, new THREE.Vector3());
  }

  const eyesPivot = makePivot(sceneRoot, EYE_MID);
  eyesPivot.name = 'eyesGroup';
  for (const index of EYES) {
    const mesh = meshes[index];
    if (mesh) reparent(mesh, eyesPivot, EYE_MID);
  }

  const headPivot = makePivot(sceneRoot, NECK);
  headPivot.name = 'headPivot';
  for (const index of HEAD) {
    const mesh = meshes[index];
    if (mesh) reparent(mesh, headPivot, NECK);
  }
  // The eyes ride under the head pivot, so the anchor is the neck.
  reparent(eyesPivot, headPivot, NECK);

  const rightArmPivot = makePivot(sceneRoot, RIGHT_SHOULDER);
  rightArmPivot.name = 'rightArmPivot';
  for (const index of RIGHT_ARM) {
    const mesh = meshes[index];
    if (mesh) reparent(mesh, rightArmPivot, RIGHT_SHOULDER);
  }

  const leftArmPivot = makePivot(sceneRoot, LEFT_SHOULDER);
  leftArmPivot.name = 'leftArmPivot';
  for (const index of LEFT_ARM) {
    const mesh = meshes[index];
    if (mesh) reparent(mesh, leftArmPivot, LEFT_SHOULDER);
  }

  /* Studio finish: the sculpt keeps its own palette, we only tune how it
   * takes the stage's light. */
  for (const mesh of meshes) {
    const material = mesh.material;
    if (!material || !material.isMeshStandardMaterial) continue;
    material.envMapIntensity = 0.85;
    material.roughness = Math.min(1, material.roughness ?? 0.7);
    material.needsUpdate = true;
  }

  const state = {
    boopVelocity: 0,
    boopOffset: 0,
    blinkTimer: 1.6,
    isBlinking: false,
    pointerX: 0,
    pointerY: 0,
    headYaw: 0,
    headRoll: 0,
    armSwing: 0,
  };

  const speed = NICKLAS_CONFIG.animSpeed || 1;

  function tick(dt, time, sim) {
    const pose = sim.pose || 'idle';
    const d = Math.min(dt, 0.1);
    const gazeX = state.pointerX || 0;
    const gazeY = state.pointerY || 0;

    // Breathing — the chest lifts, the whole body follows a touch.
    const breathRate = pose === 'work' ? 3.4 : pose === 'sleep' ? 0.9 : 1.9;
    const breath = Math.sin(time * breathRate * speed);
    const breathDepth = pose === 'sleep' ? 0.035 : 0.018;

    // Blinking.
    state.blinkTimer += d;
    if (!state.isBlinking && state.blinkTimer > 3.2) {
      state.isBlinking = true;
      state.blinkTimer = 0;
    } else if (state.isBlinking && state.blinkTimer > 0.11) {
      state.isBlinking = false;
      state.blinkTimer = 0;
    }
    const blinkScale = state.isBlinking ? 0.08 : 1;
    eyesPivot.scale.y += (blinkScale - eyesPivot.scale.y) * Math.min(1, d * 22);

    // Boop impulse (a small squash-and-stretch pop).
    state.boopOffset += state.boopVelocity;
    state.boopVelocity -= state.boopOffset * 16 * d;
    state.boopVelocity *= 0.86;

    let y = 0;
    let rotZ = 0;
    let rotY = 0;
    let headYaw = gazeX * 0.32;
    let headRoll = 0;
    let armZ = 0;
    let armX = 0;

    if (pose === 'idle') {
      y = Math.sin(time * 1.9 * speed) * 0.018;
      rotZ = Math.sin(time * 1.05 * speed) * 0.014;
      headYaw += Math.sin(time * 0.75 * speed) * 0.1;
      headRoll = Math.cos(time * 1.15 * speed) * 0.028;
      armZ = Math.sin(time * 1.8 * speed) * 0.05;
    } else if (pose === 'work') {
      y = Math.sin(time * 4.2 * speed) * 0.012;
      rotZ = Math.sin(time * 2.6 * speed) * 0.008;
      headYaw += Math.sin(time * 1.6 * speed) * 0.08;
      armZ = Math.sin(time * 3.4 * speed) * 0.03;
      armX = 0.06;
    } else if (pose === 'think') {
      y = Math.sin(time * 1.4 * speed) * 0.01;
      headYaw += 0.26 + Math.sin(time * 0.9 * speed) * 0.05;
      headRoll = -0.13 + Math.sin(time * 0.7 * speed) * 0.03;
      armX = 0.18;
      armZ = -0.06;
    } else if (pose === 'celebrate') {
      const hop = Math.abs(Math.sin(time * 5.4 * speed));
      y = hop * 0.2 + state.boopOffset;
      rotZ = Math.sin(time * 5.4 * speed) * 0.05;
      rotY = Math.sin(time * 3.4 * speed) * 0.16;
      headYaw += Math.sin(time * 3.2 * speed) * 0.16;
      armZ = -0.55 - Math.sin(time * 9 * speed) * 0.18;
      armX = -0.35;
    } else {
      // Sleepy — long breath, drooped head, arms in.
      y = Math.sin(time * 0.85 * speed) * 0.01;
      headYaw += Math.sin(time * 0.35 * speed) * 0.04;
      headRoll = 0.09;
      armZ = 0.04;
      armX = 0.04;
    }

    const damp = (current, target, lambda) =>
      current + (target - current) * Math.min(1, d * lambda);

    bodyRoot.position.y = damp(bodyRoot.position.y, y, 14);
    bodyRoot.rotation.z = damp(bodyRoot.rotation.z, rotZ, 10);
    bodyRoot.rotation.y = damp(bodyRoot.rotation.y, rotY, 8);
    bodyRoot.scale.set(
      damp(bodyRoot.scale.x, 1 + breath * breathDepth * 0.4, 12),
      damp(bodyRoot.scale.y, 1 + breath * breathDepth, 12),
      damp(bodyRoot.scale.z, 1 + breath * breathDepth * 0.4, 12)
    );

    state.headYaw = damp(state.headYaw, headYaw, 7);
    state.headRoll = damp(state.headRoll, headRoll, 7);
    headPivot.rotation.y = state.headYaw;
    headPivot.rotation.z = state.headRoll;

    state.armSwing = damp(state.armSwing, armZ, 8);
    rightArmPivot.rotation.z = state.armSwing;
    leftArmPivot.rotation.z = -state.armSwing;
    rightArmPivot.rotation.x = damp(rightArmPivot.rotation.x, armX, 8);
    leftArmPivot.rotation.x = damp(leftArmPivot.rotation.x, armX * 0.8, 8);
  }

  bodyRoot.userData = {
    ...state,
    tick,
    boop() {
      state.boopVelocity = 0.16;
    },
  };

  // The stage reads userData.pointerX/pointerY for gaze.
  Object.defineProperty(bodyRoot.userData, 'pointerX', {
    get: () => state.pointerX,
    set: (v) => { state.pointerX = v; },
  });
  Object.defineProperty(bodyRoot.userData, 'pointerY', {
    get: () => state.pointerY,
    set: (v) => { state.pointerY = v; },
  });
  Object.defineProperty(bodyRoot.userData, 'isBlinking', {
    get: () => state.isBlinking,
    set: (v) => { state.isBlinking = v; },
  });
  Object.defineProperty(bodyRoot.userData, 'blinkTimer', {
    get: () => state.blinkTimer,
    set: (v) => { state.blinkTimer = v; },
  });

  return {
    root: bodyRoot,
    eyesGroup: eyesPivot,
    pivots: {
      bodyRoot,
      headPivot,
      eyesGroup: eyesPivot,
      leftArmPivot,
      rightArmPivot,
      plinthGroup: plinth,
    },
  };
}
