/**
 * Sunny — a golden retriever pup, built from the character sheet.
 *
 * Studio track, Route B: image → procedural sculpt. Every part below is a
 * deliberate pass of the 8-pass build, in order:
 *
 *   blockout        → torso lathe, head mass, leg stubs
 *   structural      → muzzle, cheeks, chin, brow ridge, ear roots
 *   form refinement → ear lobes, tail taper, paw toes, haunch
 *   material pass   → plush fur sheen, velvet ear, glossy eye, brushed gold
 *   surface pass    → vertex-colour chest blaze, muzzle tone, toe pads
 *   lighting pass   → inline PMREM softbox, 3-point rig, contact shadow
 *   interaction     → look-at, boop, blink, springs, pose table
 *   polish          → catchlights, gold tag relief, fur rim, breathing
 *
 * The rig is hard-coded to the skeleton in SPEC below, so there is one tick
 * contract and every mood/pose is a target table, never an if/else chain.
 */

import * as THREE from 'three';
import { makeFurShellMaterial, shellify } from './fur.js';

const TAU = Math.PI * 2;
const { clamp, lerp, damp, smoothstep } = THREE.MathUtils;

/* ------------------------------------------------------------------ */
/* Palette — sampled from the character sheet                          */
/* ------------------------------------------------------------------ */

export const PALETTE = {
  fur: '#C98A44',
  furLight: '#EBC894',
  furShade: '#C79A5E',
  muzzle: '#EBC79C',
  nose: '#3B2418',
  noseHi: '#7A5540',
  eyeBase: '#F7F1E6',
  iris: '#4A2A12',
  pupil: '#0A0503',
  tongue: '#EF8A90',
  tongueDark: '#D96E78',
  mouth: '#2E1015',
  collar: '#1B6B4E',
  collarDark: '#14513C',
  gold: '#C99A32',
  goldBright: '#E8C25C',
  pad: '#4A2C1E',
  ball: '#B9D62E',
  ballDark: '#93AE1C',
};

/* ------------------------------------------------------------------ */
/* Spring — damped semi-implicit, substepped at 120 Hz                 */
/* ------------------------------------------------------------------ */

class Spring {
  constructor(value = 0, stiffness = 110, damping = 14) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.k = stiffness;
    this.d = damping;
  }

  set(target) {
    this.target = target;
    return this;
  }

  snap(value = this.target) {
    this.value = this.target = value;
    this.velocity = 0;
    return this;
  }

  step(dt) {
    const h = 1 / 120;
    let remaining = clamp(dt, 0, 0.1);
    while (remaining > 1e-6) {
      const s = Math.min(h, remaining);
      const accel = -this.k * (this.value - this.target) - this.d * this.velocity;
      this.velocity += accel * s;
      this.value += this.velocity * s;
      remaining -= s;
    }
    return this.value;
  }
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Vertex-colour a geometry from a function of its local position. */
function paint(geometry, fn) {
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    fn(v, c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Smoothly sample a [[t, radius], ...] table. */
function sampleProfile(profile, t) {
  if (t <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    if (t <= profile[i][0]) {
      const [t0, r0] = profile[i - 1];
      const [t1, r1] = profile[i];
      const u = (t - t0) / (t1 - t0 || 1);
      return lerp(r0, r1, u * u * (3 - 2 * u));
    }
  }
  return profile[profile.length - 1][1];
}

/** Tapered tube along a Catmull-Rom curve — the tail, and any plume. */
function taperedTube(points, r0, r1, tubular = 72, radial = 20, radiusFn = null, capEnd = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'catmullrom',
    0.5
  );
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  let tipR = 0;
  const tipP = new THREE.Vector3();
  const tipT = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    const N0 = frames.normals[i];
    const B0 = frames.binormals[i];
    const r = radiusFn ? radiusFn(t) : lerp(r0, r1, Math.pow(t, 0.85));
    if (i === tubular) { tipR = r; tipP.copy(P); tipT.copy(frames.tangents[i]); }
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const sin = Math.sin(a);
      const cos = -Math.cos(a);
      N.copy(N0).multiplyScalar(cos).addScaledVector(B0, sin).normalize();
      pos.push(P.x + r * N.x, P.y + r * N.y, P.z + r * N.z);
      nor.push(N.x, N.y, N.z);
      uv.push(t, j / radial);
    }
  }
  for (let i = 1; i <= tubular; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const d = (radial + 1) * (i - 1) + j;
      idx.push(a, b, d, b, c, d);
    }
  }

  // A tube has no end. Without this the tail finished on an open ring and
  // needed a separate tip sphere, which is exactly the step we kept seeing.
  if (capEnd && tipR > 0.002) {
    const CAP = 5;
    const prevStart = tubular * (radial + 1);
    let prevStartIdx = prevStart;
    for (let k = 1; k <= CAP; k++) {
      const phi = (k / CAP) * (Math.PI / 2);
      const rk = tipR * Math.cos(phi);
      const off = tipR * Math.sin(phi);
      const cx = tipP.x + tipT.x * off;
      const cy = tipP.y + tipT.y * off;
      const cz = tipP.z + tipT.z * off;
      const start = pos.length / 3;
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * TAU;
        const sin = Math.sin(a);
        const cos = -Math.cos(a);
        N.copy(frames.normals[tubular]).multiplyScalar(cos).addScaledVector(frames.binormals[tubular], sin);
        const vx = cx + rk * N.x;
        const vy = cy + rk * N.y;
        const vz = cz + rk * N.z;
        pos.push(vx, vy, vz);
        // spherical normal, so the tip shades as a round cap
        N.set(vx - tipP.x, vy - tipP.y, vz - tipP.z).normalize();
        nor.push(N.x, N.y, N.z);
        uv.push(1, j / radial);
      }
      if (k === 1) {
        for (let j = 1; j <= radial; j++) {
          const a = prevStart + (j - 1);
          const b = prevStart + j;
          const c = start + j;
          const d = start + (j - 1);
          idx.push(a, b, d, b, c, d);
        }
      } else {
        for (let j = 1; j <= radial; j++) {
          const a = prevStartIdx + (j - 1);
          const b = prevStartIdx + j;
          const c = start + j;
          const d = start + (j - 1);
          idx.push(a, b, d, b, c, d);
        }
      }
      prevStartIdx = start;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

/** A floppy ear: rings stacked straight down, so the cross-section can
 *  never twist the way a Frenet-framed tube does. Widest ~40% down. */
function earLobe(halfW, halfD, length, rings = 26, radial = 22) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const w = halfW * Math.sin(Math.PI * (0.16 + 0.84 * t));
    const d = halfD * (0.45 + 0.55 * Math.sin(Math.PI * (0.16 + 0.84 * t)));
    const y = 0.04 - length * t;
    const drift = 0.05 * Math.sin(Math.PI * t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      pos.push(Math.cos(a) * w + drift, y, Math.sin(a) * d);
      uv.push(j / radial, t);
    }
  }
  for (let i = 1; i <= rings; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const dd = (radial + 1) * (i - 1) + j;
      idx.push(a, b, dd, b, c, dd);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** Fine procedural fur grain — a bump map, so the plush reads at any distance. */
function makeFurTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // A painted height field, not drawn strokes: overlapping translucent lines
  // average back to flat grey. Three octaves of noise squashed on Y give the
  // directional nap that reads as pile rather than sandpaper.
  const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const cc = hash(xi, yi + 1), dd = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (cc * (1 - u) + dd * u) * v;
  };
  // Integer hash: Math.sin-based noise is ~5x slower and this runs a million
  // times at startup.
  const ih = (x, y, z) => {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)) | 0;
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const sm3 = (t) => t * t * (3 - 2 * t);
  const noise3 = (x, y, z) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = sm3(x - ix), fy = sm3(y - iy), fz = sm3(z - iz);
    const c = (a, b, d) => ih(ix + a, iy + b, iz + d);
    const x00 = c(0, 0, 0) + (c(1, 0, 0) - c(0, 0, 0)) * fx;
    const x10 = c(0, 1, 0) + (c(1, 1, 0) - c(0, 1, 0)) * fx;
    const x01 = c(0, 0, 1) + (c(1, 0, 1) - c(0, 0, 1)) * fx;
    const x11 = c(0, 1, 1) + (c(1, 1, 1) - c(0, 1, 1)) * fx;
    const y0 = x00 + (x10 - x00) * fy;
    const y1 = x01 + (x11 - x01) * fy;
    return y0 + (y1 - y0) * fz;
  };

  const H = new Float32Array(size * size);
  const TAU = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      // Sample on a cylinder so u wraps seamlessly. Every octave stays strongly
      // anisotropic (horizontal ~16x vertical) so cells read as hanging fibres;
      // matched octaves are what made this look like stucco.
      const a = (x / size) * TAU;
      const ca = Math.cos(a), sa = Math.sin(a);
      let n = noise3(ca * 54, sa * 54, v * 21) * 0.52;
      n += noise3(ca * 115, sa * 115, v * 44) * 0.31;
      n += noise3(ca * 232, sa * 232, v * 88) * 0.17;
      H[y * size + x] = n;
    }
  }
  // Encode the height field as a tangent-space normal map. A bump map of the
  // same data produced no visible relief: micro-normals only read when the
  // specular lobe is broken up, and a normal map perturbs it directly.
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const K = 2.1;
  const at = (x, y) => H[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * K;
      const dy = (at(x, y - 1) - at(x, y + 1)) * K;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = ((dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 16;
  return tex;
}
function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ------------------------------------------------------------------ */
/* Studio environment — inline PMREM, zero external HDR                */
/* ------------------------------------------------------------------ */

function makeStudioEnvironment(renderer) {
  const scene = new THREE.Scene();

  // Warm sky dome, cool floor — the gradient that keeps fur from going flat.
  const domeGeo = new THREE.SphereGeometry(12, 32, 24);
  const domeMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
  });
  paint(domeGeo, (v, c) => {
    const t = clamp(v.y / 12 * 0.5 + 0.5, 0, 1);
    const warm = new THREE.Color(0xfff2dd);
    const mid = new THREE.Color(0xd8d2c8);
    const cool = new THREE.Color(0x8f9aa8);
    if (t > 0.5) c.copy(mid).lerp(warm, (t - 0.5) * 2);
    else c.copy(cool).lerp(mid, t * 2);
    c.multiplyScalar(0.55 + t * 0.55);
  });
  scene.add(new THREE.Mesh(domeGeo, domeMat));

  // Four softboxes: key, fill, rim, bounce.
  const panel = new THREE.PlaneGeometry(1, 1);
  const box = (color, intensity, pos, scale, lookAt) => {
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    mat.color.set(color).multiplyScalar(intensity);
    const m = new THREE.Mesh(panel, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.lookAt(...lookAt);
    scene.add(m);
    return m;
  };
  box(0xfff6e8, 9.0, [4.2, 5.4, 4.0], [5.0, 4.0, 1], [0, 0, 0]);
  box(0xd6e6ff, 3.2, [-5.0, 2.6, 2.2], [4.0, 3.2, 1], [0, 0, 0]);
  box(0xffe7c2, 5.0, [-1.0, 3.4, -5.6], [4.5, 3.0, 1], [0, 0, 0]);
  box(0xfff4e4, 1.6, [0, -3.2, 2.4], [5.0, 2.4, 1], [0, 0, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  domeGeo.dispose();
  domeMat.dispose();
  panel.dispose();
  return target.texture;
}

/* ------------------------------------------------------------------ */
/* SPEC — every proportion in one place, so iteration is one number     */
/* ------------------------------------------------------------------ */

const SPEC = {
  hipY: 0.62,
  headY: 1.575,
  // Measured off the sheet: broad skull, but still round in profile.
  head: { rx: 0.498, ry: 0.405, rz: 0.445 },

  torso: { base: 0.52, height: 0.84, scaleX: 1.0, scaleZ: 0.92 },
  // Pear-shaped: widest at the belly, tapering into a real neck. The old
  // profile held r=0.396 from y 0.164 to 0.395, which is why the body read
  // as a featureless tube no matter how good the light got.
  torsoProfile: [
    [0.001, -0.115],
    [0.135, -0.104],
    [0.230, -0.080],
    [0.300, -0.046],
    [0.352, 0.000],
    [0.392, 0.058],
    [0.404, 0.130],
    [0.406, 0.212],
    [0.406, 0.318],
    [0.400, 0.396],
    [0.372, 0.474],
    [0.308, 0.548],
    [0.262, 0.616],
    [0.214, 0.678],
    [0.172, 0.732],
    [0.140, 0.780],
    [0.118, 0.818],
    [0.001, 0.840],
  ],

  // sheet: muzzle width = 0.64 of head width, height = 0.50 of head height,
  // and it wraps the lower face instead of protruding like a snout. rz raised
  // so the profile has a snout at all — in side view it was almost flat.
  muzzle: { x: 0, y: -0.208, z: 0.300, rx: 0.322, ry: 0.184, rz: 0.158 },
  chin: { x: 0, y: -0.330, z: 0.230, rx: 0.145, ry: 0.075, rz: 0.115 },

  // sheet: eye separation 0.44 of head width, diameter 0.19. Pulled back on
  // z so the balls stop bulging past the snout and reading as goggles.
  eye: { x: 0.212, y: 0.010, z: 0.388, r: 0.098 },

  shoulder: { x: 0.218, y: 0.520, z: 0.150 },
  hip: { x: 0.250, y: 0.520, z: -0.224 },
  // The leg is ONE lathe now — socket flare, shin, paw swell, closed foot.
  // Separate root/paw spheres gave two hard steps per limb ("boot cuffs"),
  // which is what made the legs read as tubes stuck under a blob.
  leg: { r: 0.138, len: 0.150, pawY: -0.368 },
  paw: { rx: 0.138, ry: 0.084, rz: 0.138 },

  tail: {
    points: [
      [0.000, 0.720, -0.330],
      [0.000, 0.790, -0.450],
      [0.000, 0.900, -0.530],
      [0.006, 1.010, -0.545],
      [0.014, 1.090, -0.500],
      [0.016, 1.135, -0.430],
    ],
    r0: 0.095,
    r1: 0.010,
    // Rooted low and fat, this read as a teardrop dangling between the hind
    // legs. A retriever's tail is a bottle brush: slim where it leaves the
    // rump, firing out into a plume, then a soft point.
    profile: [
      // A dog plume is slender where it leaves the rump and swells toward the
      // tip. Fat at both ends reads as a flat paddle from behind.
      [0.00, 0.042], [0.15, 0.060], [0.35, 0.084], [0.55, 0.108],
      [0.72, 0.125], [0.85, 0.118], [0.94, 0.078], [1.00, 0.012],
    ],
  },

  collar: { y: 1.108, r: 0.276, h: 0.118, tilt: -0.05 },
  tag: { y: 1.012, z: 0.374, r: 0.074 },
};

/* ------------------------------------------------------------------ */
/* Moods — the sheet's own seven expression labels                     */
/* ------------------------------------------------------------------ */

export const MOODS = {
  happy: {
    label: 'Happy', eye: 1, squint: 0.08, brow: 0.06, browTilt: 0,
    mouth: 0.9, tongue: 1, smile: 0.62, earBack: 0, earLift: 0,
    headRoll: 0, headPitch: 0, headYaw: 0, bounce: 0.035,
  },
  wink: {
    label: 'Wink', eye: 1, squint: 0.08, wink: -1, brow: 0.14, browTilt: 0,
    mouth: 0.82, tongue: 0.95, smile: 0.55, earBack: 0.04, earLift: 0,
    headRoll: 0.045, headPitch: 0.01, headYaw: -0.03, bounce: 0.02,
  },
  excited: {
    label: 'Excited', eye: 1.08, squint: 0, brow: 0.34, browTilt: 0,
    mouth: 1, tongue: 0.95, smile: 0.7, earBack: 0.42, earLift: 0.16,
    headRoll: 0.05, headPitch: -0.03, headYaw: 0, bounce: 0.1,
  },
  calm: {
    label: 'Calm', eye: 0.82, squint: 0.24, brow: -0.06, browTilt: 0,
    mouth: 0, tongue: 0, smile: 0.6, earBack: 0, earLift: 0,
    headRoll: 0.025, headPitch: 0.02, headYaw: 0, bounce: 0.02,
  },
  curious: {
    label: 'Curious', eye: 1.06, squint: 0, brow: 0.52, browTilt: -0.25,
    mouth: 0.12, tongue: 0.15, smile: 0.3, earBack: -0.04, earLift: 0.5,
    headRoll: -0.22, headPitch: -0.04, headYaw: 0.16, bounce: 0.03,
  },
  sad: {
    label: 'Sad', eye: 1.02, squint: 0, brow: -0.5, browTilt: 1,
    mouth: 0, tongue: 0, smile: -0.55, earBack: -0.12, earLift: -0.3,
    headRoll: -0.05, headPitch: 0.1, headYaw: 0.02, bounce: 0.012,
  },
  playful: {
    label: 'Playful', eye: 0.17, squint: 0, brow: 0.1, browTilt: 0,
    mouth: 1, tongue: 1, smile: 0.72, earBack: 0.12, earLift: 0.04,
    headRoll: 0.1, headPitch: -0.02, headYaw: 0, bounce: 0.075,
  },
};

/* ------------------------------------------------------------------ */
/* Poses — the sheet's seven action labels                             */
/* ------------------------------------------------------------------ */

export const POSES = {
  stand: {
    label: 'Stand', rootY: 0, pitch: 0, headPitch: 0, headYaw: 0,
    fl: [0, 0.03], fr: [0, -0.03], hl: [0, 0.03], hr: [0, -0.03],
    tail: [0, 0, 0], ball: 0, bounceScale: 1,
  },
  sit: {
    label: 'Sit', rootY: -0.115, pitch: -0.30, headPitch: 0.04, headYaw: 0,
    fl: [-0.10, 0.02], fr: [-0.10, -0.02], hl: [1.02, 0.10], hr: [1.02, -0.10],
    tail: [0.28, 0, 0], ball: 0, bounceScale: 0.8,
  },
  lie: {
    label: 'Lie down', rootY: -0.30, pitch: -0.02, headPitch: -0.16, headYaw: 0,
    fl: [1.16, 0.30], fr: [1.16, -0.30], hl: [1.34, 0.42], hr: [1.34, -0.42],
    tail: [0.2, -0.2, 0], ball: 0, bounceScale: 0.6,
  },
  walk: {
    label: 'Walk', rootY: 0.005, pitch: 0.03, headPitch: -0.02, headYaw: 0,
    fl: [-0.44, 0.04], fr: [0.34, -0.04], hl: [0.38, 0.05], hr: [-0.34, -0.05],
    tail: [-0.05, 0.14, 0], ball: 0, bounceScale: 1.2,
  },
  run: {
    label: 'Run', rootY: 0.035, pitch: 0.16, headPitch: -0.02, headYaw: 0,
    fl: [-0.78, 0.05], fr: [0.62, -0.05], hl: [0.72, 0.06], hr: [-0.62, -0.06],
    tail: [-0.18, 0.16, 0.06], ball: 0, bounceScale: 1.7,
  },
  playbow: {
    label: 'Play bow', rootY: 0.055, pitch: 0.42, headPitch: -0.30, headYaw: 0,
    fl: [1.02, 0.10], fr: [1.02, -0.10], hl: [-0.44, 0.12], hr: [-0.44, -0.12],
    tail: [0.34, 0.05, 0], ball: 0, bounceScale: 1.1,
  },
  jump: {
    label: 'Jump', rootY: 0.34, pitch: -0.06, headPitch: -0.12, headYaw: 0,
    fl: [-0.58, 0.42], fr: [-0.58, -0.42], hl: [-0.34, 0.34], hr: [-0.34, -0.34],
    tail: [-0.2, 0.1, 0], ball: 0, bounceScale: 0.6,
  },
  ball: {
    label: 'With ball', rootY: 0.0, pitch: -0.03, headPitch: -0.16, headYaw: 0,
    fl: [0, 0.03], fr: [0, -0.03], hl: [0, 0.03], hr: [0, -0.03],
    tail: [0.1, 0.22, 0], ball: 1, bounceScale: 1,
  },
};

/* ------------------------------------------------------------------ */
/* The build                                                           */
/* ------------------------------------------------------------------ */

export function buildPup(options = {}) {
  const { envMap = null } = options;

  const root = new THREE.Group();
  root.name = 'sunnyRoot';

  // bodyRoot sits at the hip so pitch is a real pivot, not the floor.
  const bodyRoot = new THREE.Group();
  bodyRoot.name = 'bodyRoot';
  bodyRoot.position.y = SPEC.hipY;
  root.add(bodyRoot);

  const parts = new THREE.Group();
  parts.name = 'parts';
  parts.position.y = -SPEC.hipY - 0.058; // children are authored on the ground plane
  bodyRoot.add(parts);

  /* ---------------- materials ---------------- */

  const mats = {};
  const furTex = makeFurTexture();

  mats.fur = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    color: 0xffffff,
    roughness: 0.91,
    metalness: 0,
    clearcoat: 0,
    sheen: 1.0,
    sheenColor: new THREE.Color('#FFD79E'),
    sheenRoughness: 0.46,
    normalMap: furTex,
    normalScale: new THREE.Vector2(1.15, 1.15),
    envMap,
    envMapIntensity: 0.34,
  });

  mats.furPlain = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.fur),
    roughness: 1.0,
    metalness: 0,
    clearcoat: 0,
    sheen: 1.0,
    sheenColor: new THREE.Color('#FFD79E'),
    sheenRoughness: 0.46,
    normalMap: furTex,
    normalScale: new THREE.Vector2(1.15, 1.15),
    envMap,
    envMapIntensity: 0.32,
  });

  mats.muzzle = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.muzzle),
    roughness: 0.93,
    metalness: 0,
    clearcoat: 0,
    sheen: 1.0,
    sheenColor: new THREE.Color('#FFEFD4'),
    sheenRoughness: 0.46,
    normalMap: furTex,
    normalScale: new THREE.Vector2(0.8, 0.8),
    envMap,
    envMapIntensity: 0.28,
  });

  mats.cream = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.furLight),
    roughness: 0.94,
    metalness: 0,
    clearcoat: 0,
    sheen: 1.0,
    sheenColor: new THREE.Color('#FFF4E0'),
    sheenRoughness: 0.46,
    normalMap: furTex,
    normalScale: new THREE.Vector2(1.0, 1.0),
    envMap,
    envMapIntensity: 0.26,
  });

  mats.nostril = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#241309'),
    roughness: 0.92,
    metalness: 0,
  });

  mats.nose = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.nose),
    roughness: 0.66,
    metalness: 0,
    // wet leathery nose: rough base + a clearcoat sheen sitting on top of it
    clearcoat: 0.45,
    clearcoatRoughness: 0.35,
    envMap,
    envMapIntensity: 0.7,
  });

  mats.eye = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.eyeBase),
    roughness: 0.20,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.10,
    envMap,
    envMapIntensity: 1.15,
  });

  mats.iris = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.iris),
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    envMap,
    envMapIntensity: 0.9,
  });

  mats.pupil = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.pupil) });

  mats.glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  mats.glintSoft = new THREE.MeshBasicMaterial({
    color: 0xfff6ea,
    transparent: true,
    opacity: 0.75,
  });

  mats.tongue = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.tongue),
    roughness: 0.62,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
    envMap,
    envMapIntensity: 0.5,
  });

  mats.mouth = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.mouth),
    roughness: 0.85,
    clearcoat: 0,
    envMap,
    envMapIntensity: 0.2,
  });

  mats.collar = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.collar),
    roughness: 0.52,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    envMap,
    envMapIntensity: 0.7,
  });

  mats.gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.gold),
    roughness: 0.28,
    metalness: 0.92,
    clearcoat: 0.4,
    envMap,
    envMapIntensity: 1.3,
  });

  mats.goldBright = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.goldBright),
    roughness: 0.24,
    metalness: 0.9,
    envMap,
    envMapIntensity: 1.4,
  });

  mats.pad = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.pad),
    roughness: 0.72,
    envMap,
    envMapIntensity: 0.35,
  });

  mats.ball = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PALETTE.ball),
    roughness: 0.44,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    envMap,
    envMapIntensity: 0.8,
  });

  const sphere = (rx, ry, rz, mat, seg = 40) => {
    const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
    g.scale(rx, ry, rz);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  /* ---------------- PASS 1 — blockout: torso ---------------- */

  const torsoGeo = new THREE.LatheGeometry(
    SPEC.torsoProfile.map(([r, y]) => new THREE.Vector2(r, y)),
    72
  );
  torsoGeo.scale(SPEC.torso.scaleX, 1, SPEC.torso.scaleZ);

  // A lathe is rotationally symmetric, so the body was a perfect egg: no
  // chest-to-rump taper and nothing for the tail to root into. Sweep the
  // lower mass rearwards and out a little, which is what reads as haunches.
  {
    const p = torsoGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y < 0.16) {
        const t = clamp((0.16 - y) / 0.275, 0, 1);
        p.setZ(i, p.getZ(i) - 0.070 * t * t);
        p.setX(i, p.getX(i) * (1 + 0.045 * t));
      }
    }
    p.needsUpdate = true;
    torsoGeo.computeVertexNormals();
  }

  // Surface pass: the cream blaze is vertex colour, so it never reads as a sticker.
  const furC = new THREE.Color(PALETTE.fur);
  const lightC = new THREE.Color(PALETTE.furLight);
  paint(torsoGeo, (v, out) => {
    const y = v.y;
    const ang = Math.abs(Math.atan2(v.x / SPEC.torso.scaleX, v.z / SPEC.torso.scaleZ));
    // The blaze had grown into a white bib covering the whole front of the
    // barrel. Narrower in angle, capped much lower on the chest, and pulled
    // back in strength so it stays cream rather than white.
    const front = 1 - smoothstep(ang, 0.26, 0.70);
    const belly = 1 - smoothstep(y, 0.010, 0.115);
    const chest = front * (0.30 + 0.42 * (1 - smoothstep(y, 0.14, 0.42)));
    const m = clamp(Math.max(chest, belly * 0.74), 0, 1);
    // a whisper of shade in the undercut so the form reads even in flat light
    const shade = 1 - 0.07 * smoothstep(ang, 1.5, 2.7) * (1 - smoothstep(y, 0.1, 0.5));
    out.copy(furC).lerp(lightC, m * 0.50).multiplyScalar(shade);
  });

  const torso = new THREE.Mesh(torsoGeo, mats.fur);
  torso.position.y = SPEC.torso.base;
  torso.castShadow = true;
  torso.receiveShadow = true;
  parts.add(torso);

  /* ---------------- body: haunches ---------------- */

  // No separate shoulder/root spheres any more. Those were closed volumes
  // intersecting a closed torso, which is exactly what drew a hard line
  // where each limb met the body. The leg lathe now flares into the belly
  // instead, so the socket is part of the same surface.

  /* ---------------- PASS 2 — structural: neck fill ---------------- */

  // Tucked down so the collar's top edge covers it. At r 0.278 it poked out
  // above the collar and drew the white ring under the chin.
  const neck = sphere(0.248, 0.126, 0.230, mats.cream);
  neck.position.set(0, 1.190, 0.030);
  parts.add(neck);

  /* ---------------- legs ---------------- */

  // ASCENDING y. LatheGeometry winds faces from the profile order, so a
  // descending list produces inward normals and the shins grow their hair
  // inside the mesh.
  //
  // ONE continuous profile per limb: it flares at the top until it meets the
  // belly surface, tapers through a genuinely thin shin, swells into the paw
  // and closes over the sole. Peak radius 0.138 (was 0.168 plus a separate
  // 0.190 paw sphere — those two steps were the "boot cuffs").
  const legGeo = new THREE.LatheGeometry(
    [
      // foot bottom, closed
      [0.001, -0.452], [0.060, -0.448], [0.098, -0.436],
      // paw
      [0.122, -0.418], [0.134, -0.394], [0.138, -0.368],
      [0.136, -0.342],
      // ankle into a thin shin
      [0.128, -0.316], [0.116, -0.286], [0.106, -0.240],
      [0.100, -0.180], [0.098, -0.110], [0.100, -0.040],
      // Socket flare, kept slim and buried deep in the torso. A wide flare
      // stops flush with the belly and draws a hard flap edge in profile.
      // No outward flare: anything wider than the body half-width pokes past
      // the belly surface and the socket rim draws a hard annulus. Keep the
      // socket a hair narrower than the shin and rely on the torso overlapping
      // it, so the limb leaves the body along a soft, fur-covered curve.
      [0.104, 0.020], [0.110, 0.062], [0.114, 0.104],
      [0.110, 0.142],
      [0.001, 0.176],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    32
  );

  function makeLeg(side, hind) {
    const pivot = new THREE.Group();
    pivot.name = side > 0 ? 'leftArmPivot' : 'rightArmPivot';

    const upper = new THREE.Mesh(legGeo, mats.furPlain);
    upper.castShadow = true;
    upper.receiveShadow = true;
    // the haunch is broader than the foreleg, but only across — the foot
    // must stay on the floor
    if (hind) upper.scale.set(1.12, 1, 1.06);
    pivot.add(upper);

    // three toes, small and seated on the front of the paw swell
    for (let i = -1; i <= 1; i++) {
      const toe = sphere(0.040, 0.038, 0.042, mats.furPlain, 20);
      toe.position.set(i * 0.052, -0.406, 0.106);
      toe.rotation.y = -i * 0.22;
      pivot.add(toe);
    }

    // back pad, only visible from behind — the sheet's 3/4 back view shows it
    const padGeo = new THREE.CircleGeometry(0.055, 20);
    const pad = new THREE.Mesh(padGeo, mats.pad);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(0, -0.446, -0.008);
    pad.scale.set(1, 1.05, 1);
    pivot.add(pad);

    return pivot;
  }

  const legs = {};
  for (const [key, s] of [
    ['fl', SPEC.shoulder],
    ['fr', SPEC.shoulder],
    ['hl', SPEC.hip],
    ['hr', SPEC.hip],
  ]) {
    const side = key.endsWith('l') ? 1 : -1;
    const leg = makeLeg(side, key.startsWith('h'));
    leg.position.set(s.x * side, s.y, s.z);
    if (key === 'fl') leg.name = 'leftArmPivot';
    if (key === 'fr') leg.name = 'rightArmPivot';
    parts.add(leg);
    legs[key] = leg;
  }

  /* ---------------- PASS 3 — form refinement: tail ---------------- */

  const tailPivot = new THREE.Group();
  tailPivot.name = 'tailPivot';
  tailPivot.position.set(0, 0.72, -0.33);
  parts.add(tailPivot);

  // One continuous tube with a bulging plume profile and a capped tip. The
  // old tail was a flat straight taper that ended on an open ring, which is
  // why it needed a separate tip sphere and read as a blade.
  const tailGeo = taperedTube(
    SPEC.tail.points, SPEC.tail.r0, SPEC.tail.r1, 80, 24,
    (t) => sampleProfile(SPEC.tail.profile, t),
    true
  );
  tailGeo.translate(0, -0.72, 0.33);
  const tail = new THREE.Mesh(tailGeo, mats.furPlain);
  tail.castShadow = true;
  tail.receiveShadow = true;
  tailPivot.add(tail);

  /* ---------------- PASS 4 — head mass ---------------- */

  const headPivot = new THREE.Group();
  headPivot.name = 'headPivot';
  headPivot.position.set(0, SPEC.headY, 0);
  parts.add(headPivot);

  const head = new THREE.Group();
  headPivot.add(head);

  const skullGeo = new THREE.SphereGeometry(1, 64, 48);
  // Deform: flatten the crown a touch, fill the cheeks, narrow the jaw.
  {
    const pos = skullGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const yn = v.y; // -1..1
      const crown = smoothstep(yn, 0.10, 1.0);
      const jaw = smoothstep(-yn, 0.30, 0.98);
      const cheek = Math.exp(-Math.pow((yn + 0.16) / 0.36, 2));
      let sx = 1 - crown * 0.055 + cheek * 0.045;
      let sz = 1 - crown * 0.065 + cheek * 0.018;
      sx *= 1 - jaw * 0.20;
      sz *= 1 - jaw * 0.10;
      v.x *= sx;
      v.z *= sz;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    skullGeo.computeVertexNormals();
  }
  skullGeo.scale(SPEC.head.rx, SPEC.head.ry, SPEC.head.rz);
  const skull = new THREE.Mesh(skullGeo, mats.furPlain);
  skull.name = 'skull';
  skull.castShadow = true;
  skull.receiveShadow = true;
  head.add(skull);

  // cheek pads
  for (const s of [-1, 1]) {
    const cheek = sphere(0.064, 0.056, 0.052, mats.furPlain, 32);
    cheek.position.set(0.208 * s, -0.238, 0.186);
    head.add(cheek);
  }

  // The brow shelf is in the skull deformation — a separate ridge reads as a
  // seam under raking light, so there is no geometry here.

  /* ---------------- muzzle, nose, chin ---------------- */

  const M = SPEC.muzzle;
  const muzzle = sphere(M.rx, M.ry, M.rz, mats.muzzle, 48);
  muzzle.position.set(M.x, M.y, M.z);
  const muzzleMat = mats.muzzle.clone();
  muzzleMat.vertexColors = true;
  muzzleMat.color = new THREE.Color(0xffffff);
  muzzle.material = muzzleMat;
  const FUR_C = new THREE.Color(PALETTE.fur);
  const MUZ_C = new THREE.Color(PALETTE.muzzle);
  paint(muzzle.geometry, (v, c) => {
    const front = clamp((v.z / M.rz) * 0.5 + 0.5, 0, 1);
    const side = clamp(1 - Math.abs(v.x) / M.rx, 0, 1);
    const t = smoothstep(0.24, 0.90, front) * (0.55 + 0.45 * side);
    c.copy(FUR_C).lerp(MUZ_C, t);
  });
  head.add(muzzle);

  const chin = sphere(SPEC.chin.rx, SPEC.chin.ry, SPEC.chin.rz, mats.muzzle, 32);
  chin.position.set(SPEC.chin.x, SPEC.chin.y, SPEC.chin.z);
  head.add(chin);

  // muzzle bridge — ties the nose back into the skull
  const bridge = sphere(0.118, 0.080, 0.092, mats.muzzle, 32);
  bridge.position.set(0, -0.090, 0.330);
  head.add(bridge);

  const nose = sphere(0.104, 0.062, 0.050, mats.nose, 40);
  nose.position.set(0, -0.166, 0.492);
  head.add(nose);

  // nose wings, so the front reads as the sheet's rounded triangle
  for (const s of [-1, 1]) {
    const wing = sphere(0.042, 0.034, 0.036, mats.nose, 20);
    wing.visible = false;
    head.add(wing);
  }

  // nostrils: without these the nose is a glossy bean with no anatomy
  for (const s of [-1, 1]) {
    const nostril = sphere(0.017, 0.013, 0.010, mats.nostril, 16);
    nostril.position.set(0.042 * s, -0.200, 0.534);
    nostril.rotation.z = -0.34 * s;
    nostril.rotation.x = 0.30;
    head.add(nostril);
  }

  // philtrum groove
  const philtrum = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0095, 0.042, 4, 8),
    mats.mouth
  );
  philtrum.position.set(0, -0.238, 0.520);
  philtrum.visible = false;
  head.add(philtrum);

  // nose highlight
  const noseHi = sphere(0.025, 0.016, 0.012, mats.glintSoft, 16);
  noseHi.visible = false;
  noseHi.position.set(-0.032, -0.122, 0.562);
  head.add(noseHi);

  /* ---------------- eyes ---------------- */

  const eyes = {};
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.name = s > 0 ? 'eyeLeft' : 'eyeRight';
    g.position.set(SPEC.eye.x * s, SPEC.eye.y, SPEC.eye.z);
    g.name = s > 0 ? 'eyeL' : 'eyeR';

    const R = SPEC.eye.r;
    const base = new THREE.Mesh(new THREE.SphereGeometry(R, 44, 32), mats.eye);
    base.castShadow = true;
    g.add(base);

    // Iris and pupil are caps that hug the sclera at 0.4 % and 0.8 % radius,
    // with their pole rotated onto +Z. Layering them inside an opaque eyeball
    // hides them entirely; a flat disc floats off the curve.
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.004, 48, 34, 0, Math.PI * 2, 0, 1.30), mats.iris);
    iris.rotation.x = Math.PI / 2 + 0.10;
    g.add(iris);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.010, 40, 26, 0, Math.PI * 2, 0, 0.44), mats.pupil);
    pupil.rotation.x = Math.PI / 2 + 0.10;
    g.add(pupil);

    // The sheet's eye is a white sclera with a large dark iris sitting on the
    // front of it — not a black bead. Both are tucked just inside the cornea
    // radius so they can never poke through it.


    // Without a rim the eyeball meets the skull on a hard circle and reads
    // as a marble pressed into dough.
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.998, 0.0058, 8, 44), mats.furPlain);
    rim.position.z = 0.006;
    rim.userData.noFur = true;
    g.add(rim);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0145, 20, 16), mats.glint);
    glint.position.set(0.022 * s, 0.026, SPEC.eye.r * 0.86);
    g.add(glint);

    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 16, 12), mats.glintSoft);
    glint2.position.set(-0.020 * s, -0.024, SPEC.eye.r * 0.88);
    g.add(glint2);

    // A lid is what stops an eyeball reading as a marble pushed into dough.
    // A cap of the coat, hinged over the top of the sphere.
    // Upper and lower lids are caps around the pole, not a band swung across
    // the front: the opening has to straddle the forward pole to read as an
    // aperture. 0.92 rad each leaves ~71 degrees of visible eye.
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(SPEC.eye.r * 1.07, 40, 24, 0, Math.PI * 2, 0, 0.02),
      mats.furPlain
    );
    lid.rotation.x = -0.10;
    lid.position.set(0, 0.004, -0.004);
    lid.castShadow = false;
    lid.receiveShadow = true;
    lid.userData.noFur = true;
    g.add(lid);

    const lower = new THREE.Mesh(
      new THREE.SphereGeometry(SPEC.eye.r * 1.05, 40, 20, 0, Math.PI * 2, 0, 0.02),
      mats.furPlain
    );
    lower.rotation.x = Math.PI + 0.10;
    lower.position.set(0, -0.004, -0.004);
    lower.castShadow = false;
    lower.receiveShadow = true;
    lower.userData.noFur = true;
    g.add(lower);

    head.add(g);
    eyes[s > 0 ? 'left' : 'right'] = g;
  }

  /* ---------------- brows ---------------- */

  const brows = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(0.196 * s, 0.236, 0.382);
    pivot.visible = false;   // reads as a fur lump on the skull, not a brow
    const geo = new THREE.TorusGeometry(0.058, 0.0135, 8, 16, 1.35);
    const brow = new THREE.Mesh(geo, mats.furPlain);
    brow.rotation.z = s > 0 ? -Math.PI * 0.70 : -Math.PI * 0.30;
    brow.rotation.y = -0.20 * s;
    brow.position.set(-0.014 * s, 0.0, 0);
    pivot.add(brow);
    head.add(pivot);
    brows[s > 0 ? 'left' : 'right'] = pivot;
  }

  /* ---------------- mouth ---------------- */

  const mouthGroup = new THREE.Group();

  // A smile is an arc, not a bar. Torus segment centred on the bottom of the
  // circle so the middle dips and the corners lift.

  mouthGroup.position.set(0, -0.318, 0.404);
  head.add(mouthGroup);

  // A smile is an arc, not a bar. The cavity used to be a plain ellipsoid, so
  // an open mouth read as a flat oval "gasp". Squeezing the lower half in x
  // makes the opening a rounded triangle — wide across the top lip and
  // narrowing into the chin — which is what a laughing plush mouth is.
  const cavityGeo = new THREE.SphereGeometry(1, 40, 28);
  {
    const p = cavityGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y < 0) p.setX(i, p.getX(i) * (1 - 0.46 * -y));
    }
    p.needsUpdate = true;
    cavityGeo.computeVertexNormals();
  }
  const cavity = new THREE.Mesh(cavityGeo, mats.mouth);
  mouthGroup.add(cavity);

  // Tongue: a wide soft lozenge that fills the floor of the opening and just
  // breaks the lower lip, instead of a pink dot floating in a dark oval.
  const tongueGroup = new THREE.Group();
  tongueGroup.position.set(0, -0.018, 0.024);
  const tongue = sphere(0.060, 0.028, 0.024, mats.tongue, 32);
  tongue.position.y = -0.004;
  tongueGroup.add(tongue);
  const tongueTip = sphere(0.044, 0.016, 0.016, mats.tongue, 24);
  tongueTip.position.set(0, -0.028, 0.006);
  tongueGroup.add(tongueTip);
  const tongueGroove = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0062, 0.058, 4, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.tongueDark) })
  );
  tongueGroove.position.set(0, -0.046, 0.045);
  tongueGroove.visible = false;
  tongueGroup.add(tongueGroove);
  mouthGroup.add(tongueGroup);

  // The closed-mouth line: three prebuilt arcs laid on the muzzle surface,
  // cross-faded by opacity.
  const mouthLines = [];
  const muzzleSurfaceZ = (x, y) => {
    const under = 1 - (x / M.rx) ** 2 - ((y - M.y) / M.ry) ** 2;
    return M.z + M.rz * Math.sqrt(Math.max(0, under));
  };
  for (const curve of [1, 0.15, -1]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = lerp(-0.108, 0.108, t);
      const y = -0.300 + curve * 0.044 * (1 - (Math.abs(x) / 0.108) ** 2);
      pts.push(new THREE.Vector3(x, y, muzzleSurfaceZ(x, y) + 0.004));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 26, 0.0095, 8, false);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5A2A24'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    head.add(mesh);
    mouthLines.push(mesh);
  }

  /* ---------------- ears ---------------- */

  // Ear: a tapered sphere. Closed surface, so normals are always right and
  // the tip stays round instead of sharpening to a point like a loft does.
  const earGeo = new THREE.SphereGeometry(1, 36, 28);
  {
    const pos = earGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Narrow at the root, fullest through the middle, easing off again near
      // the tip so the sphere's own convergence is spread over a long run and
      // the lobe ends ROUND. A linear taper left it sharpening into a blade.
      const u = (y + 1) / 2;
      const taper = 0.50 + 0.50 * Math.sin(Math.PI * u * 0.92);
      // Depth was 0.092, so in profile the ear collapsed to a flat fin.
      pos.setXYZ(i, x * taper * 0.200, y * 0.285, z * taper * 0.135);
    }
    earGeo.translate(0, -0.285, 0); // root at the pivot, lobe hangs below
    earGeo.computeVertexNormals();
  }

  const ears = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = s > 0 ? 'earLeft' : 'earRight';
    pivot.position.set(0.396 * s, 0.235, 0.000);
    pivot.rotation.set(0.42, 0.10 * s, -0.16 * s);

    // A plush ear is a stitched two-tone patch, not a flat blade. The inner
    // tone sits a hair proud of the lobe so it reads as a seam, not a bump.
    const innerEarMat = mats.furPlain.clone();
    innerEarMat.color = new THREE.Color('#B4734048'.slice(0,7));
    const inner = sphere(0.050, 0.106, 0.018, innerEarMat, 24);
    inner.position.set(0.004 * s, -0.158, 0.062);
    inner.rotation.z = -0.10 * s;
    inner.castShadow = false;
    pivot.add(inner);

    const lobe = new THREE.Mesh(earGeo, mats.furPlain);
    if (s < 0) lobe.rotation.y = Math.PI;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    pivot.add(lobe);
    head.add(pivot);
    ears[s > 0 ? 'left' : 'right'] = pivot;
  }

  /* ---------------- collar + tag ---------------- */

  const collarGeo = new THREE.CylinderGeometry(
    SPEC.collar.r * 1.0,
    SPEC.collar.r * 1.035,
    SPEC.collar.h,
    64,
    1,
    true
  );
  collarGeo.scale(1, 1, 0.90);
  const collar = new THREE.Mesh(collarGeo, mats.collar);
  collar.position.set(0, SPEC.collar.y, 0.012);
  collar.rotation.x = SPEC.collar.tilt;
  collar.castShadow = true;
  parts.add(collar);

  const tag = new THREE.Group();
  tag.position.set(0, SPEC.tag.y, SPEC.tag.z);
  tag.rotation.x = -0.10;
  parts.add(tag);

  const tagRing = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.010, 10, 20), mats.gold);
  tagRing.position.set(0, 0.078, -0.008);
  tag.add(tagRing);

  const tagDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(SPEC.tag.r, SPEC.tag.r, 0.024, 40),
    mats.gold
  );
  tagDisc.rotation.x = Math.PI / 2;
  tagDisc.castShadow = true;
  tag.add(tagDisc);

  // paw-print relief: one pad + four toes, raised in bright gold
  const padMain = sphere(0.031, 0.024, 0.011, mats.goldBright, 18);
  padMain.position.set(0, -0.013, 0.017);
  tag.add(padMain);
  const toeAngles = [-0.62, -0.21, 0.21, 0.62];
  for (const a of toeAngles) {
    const t = sphere(0.0125, 0.0145, 0.010, mats.goldBright, 14);
    t.position.set(Math.sin(a) * 0.036, 0.015 + Math.cos(a) * 0.013, 0.017);
    tag.add(t);
  }

  /* ---------------- ball prop ---------------- */

  const ball = new THREE.Group();
  ball.position.set(0.0, -0.238, 0.70);
  ball.visible = false;
  head.add(ball);
  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.135, 32, 24), mats.ball);
  ballMesh.castShadow = true;
  ball.add(ballMesh);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.008, 6, 40), mats.ballDark);
  seam.rotation.y = 0.5;
  ball.add(seam);
  const seam2 = seam.clone();
  seam2.rotation.set(1.2, 0.9, 0);
  ball.add(seam2);

  // A bite dimple where the ball meets the muzzle.
  const bite = sphere(0.085, 0.075, 0.05, mats.mouth, 20);
  bite.position.set(0, -0.255, 0.60);
  bite.visible = false;
  head.add(bite);

  /* ---------------- contact shadow ---------------- */

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(40,26,12,0.62)');
  grad.addColorStop(0.45, 'rgba(40,26,12,0.30)');
  grad.addColorStop(1, 'rgba(40,26,12,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.008;
  shadow.renderOrder = -1;
  root.add(shadow);

  /* ---------------- rig state ---------------- */

  const state = {
    mood: 'happy',
    pose: 'stand',
    pointerX: 0,
    pointerY: 0,
    lookX: 0,
    lookY: 0,
    boop: 0,
    boopVel: 0,
    blinkTimer: 3.4,
    blinking: false,
    blinkAmount: 1,
    time: 0,
    paused: false,
  };

  const S = {
    eye: new Spring(1, 150, 16),
    squint: new Spring(0.08, 120, 15),
    brow: new Spring(0.06, 120, 15),
    browTilt: new Spring(0, 120, 15),
    mouth: new Spring(0.9, 150, 16),
    tongue: new Spring(1, 130, 15),
    smile: new Spring(0.62, 130, 16),
    earBack: new Spring(0, 90, 13),
    earLift: new Spring(0, 90, 13),
    headRoll: new Spring(0, 80, 12),
    headPitch: new Spring(0, 80, 12),
    headYaw: new Spring(0, 80, 12),
    bounce: new Spring(0.035, 80, 12),
    rootY: new Spring(0, 110, 15),
    pitch: new Spring(0, 110, 15),
    tailX: new Spring(0, 60, 11),
    tailY: new Spring(0, 60, 11),
    tailZ: new Spring(0, 60, 11),
    legs: {
      fl: { x: new Spring(0, 130, 16), z: new Spring(0.03, 130, 16) },
      fr: { x: new Spring(0, 130, 16), z: new Spring(-0.03, 130, 16) },
      hl: { x: new Spring(0, 130, 16), z: new Spring(0.03, 130, 16) },
      hr: { x: new Spring(0, 130, 16), z: new Spring(-0.03, 130, 16) },
    },
    // posed head offsets from the pose table, kept separate from mood
    poseHeadPitch: new Spring(0, 90, 13),
    poseHeadYaw: new Spring(0, 90, 13),
    ball: new Spring(0, 120, 15),
  };

  function applyMood(mood) {
    const m = MOODS[mood] || MOODS.happy;
    state.mood = mood in MOODS ? mood : 'happy';
    S.eye.set(m.eye ?? 1);
    S.squint.set(m.squint ?? 0);
    S.brow.set(m.brow ?? 0);
    S.browTilt.set(m.browTilt ?? 0);
    S.mouth.set(m.mouth ?? 0);
    S.tongue.set(m.tongue ?? 0);
    S.smile.set(m.smile ?? 0.4);
    S.earBack.set(m.earBack ?? 0);
    S.earLift.set(m.earLift ?? 0);
    S.headRoll.set(m.headRoll ?? 0);
    S.headPitch.set(m.headPitch ?? 0);
    S.headYaw.set(m.headYaw ?? 0);
    S.bounce.set(m.bounce ?? 0.03);
    state.wink = m.wink || 0;
    state.earAsym = m.earAsym || 0;
  }

  function applyPose(pose, immediate = false) {
    const p = POSES[pose] || POSES.stand;
    state.pose = pose in POSES ? pose : 'stand';
    const put = (spring, v) => (immediate ? spring.snap(v) : spring.set(v));
    put(S.rootY, p.rootY ?? 0);
    put(S.pitch, p.pitch ?? 0);
    put(S.poseHeadPitch, p.headPitch ?? 0);
    put(S.poseHeadYaw, p.headYaw ?? 0);
    put(S.tailX, p.tail?.[0] ?? 0);
    put(S.tailY, p.tail?.[1] ?? 0);
    put(S.tailZ, p.tail?.[2] ?? 0);
    put(S.ball, p.ball ?? 0);
    for (const k of ['fl', 'fr', 'hl', 'hr']) {
      const v = p[k] || [0, 0];
      put(S.legs[k].x, v[0]);
      put(S.legs[k].z, v[1]);
    }
    state.bounceScale = p.bounceScale ?? 1;
  }

  /* ---------------- tick ---------------- */

  function tick(dt, elapsed) {
    state.time = elapsed;

    // cursor smoothing
    state.lookX = damp(state.lookX, state.pointerX, 7, dt);
    state.lookY = damp(state.lookY, state.pointerY, 7, dt);

    // blink: random 2.8–5.4s, with the occasional double
    state.blinkTimer -= dt;
    if (!state.blinking && state.blinkTimer <= 0) {
      state.blinking = true;
      state.blinkPhase = 0;
      state.blinkTimer = 2.8 + Math.random() * 2.6 - (state.blinkDouble ? 0.0 : 0);
      state.blinkDouble = Math.random() < 0.24;
    }
    let blink = 1;
    if (state.blinking) {
      state.blinkPhase += dt;
      const p = state.blinkPhase;
      const dur = state.blinkDouble ? 0.34 : 0.19;
      if (p < dur) {
        const t = p / dur;
        blink = 1 - Math.sin(Math.PI * Math.min(1, t / (state.blinkDouble ? 0.42 : 0.5))) * 0.96;
        if (state.blinkDouble && p > dur * 0.55 && p < dur * 0.78) blink = 0.04;
      } else {
        state.blinking = false;
      }
    }

    const eye = clamp(S.eye.step(dt), 0.02, 1.25);
    const squint = clamp(S.squint.step(dt), 0, 1);
    const brow = S.brow.step(dt);
    const browTilt = S.browTilt.step(dt);
    const mouth = clamp(S.mouth.step(dt), 0, 1);
    const tongue = clamp(S.tongue.step(dt), 0, 1);
    const smile = clamp(S.smile.step(dt), -1, 1);
    const earBack = S.earBack.step(dt);
    const earLift = S.earLift.step(dt);
    const headRoll = S.headRoll.step(dt);
    const headPitch = S.headPitch.step(dt);
    const headYaw = S.headYaw.step(dt);
    const bounce = S.bounce.step(dt);
    const rootY = S.rootY.step(dt);
    const pitch = S.pitch.step(dt);
    const poseHeadPitch = S.poseHeadPitch.step(dt);
    const poseHeadYaw = S.poseHeadYaw.step(dt);
    const ballMix = clamp(S.ball.step(dt), 0, 1);

    // boop: a spring impulse, never a snap
    state.boopVel += -state.boop * 170 * dt;
    state.boopVel *= Math.exp(-9 * dt);
    state.boop += state.boopVel * dt;

    const breathe = Math.sin(elapsed * 1.75) * 0.011;
    const sway = Math.sin(elapsed * 0.83) * 0.006;
    const bob = Math.abs(Math.sin(elapsed * 2.3)) * bounce * state.bounceScale;

    bodyRoot.position.y = SPEC.hipY + rootY + bob + state.boop * 0.09;
    bodyRoot.rotation.x = pitch + Math.sin(elapsed * 1.1) * 0.008;
    bodyRoot.rotation.z = sway * 0.6;
    bodyRoot.scale.set(
      1 + breathe * 0.35 + state.boop * 0.05,
      1 + breathe + bob * 0.05,
      1 + breathe * 0.35 + state.boop * 0.05
    );

    // head: look-at yaw/pitch plus mood tilt plus pose offset
    const lookYaw = state.lookX * 0.30;
    const lookPitch = -state.lookY * 0.20;
    headPivot.rotation.y = damp(headPivot.rotation.y, headYaw + poseHeadYaw + lookYaw, 9, dt);
    headPivot.rotation.x = damp(headPivot.rotation.x, headPitch + poseHeadPitch + lookPitch, 9, dt);
    headPivot.rotation.z = damp(headPivot.rotation.z, headRoll + Math.sin(elapsed * 0.7) * 0.012, 8, dt);

    // eyes — wink: -1 closes the character's right eye, +1 its left
    const wink = state.wink || 0;
    const openL = wink > 0 ? 0.045 : 1;
    const openR = wink < 0 ? 0.045 : 1;
    const baseOpen = blink * eye;

    eyes.left.scale.y = damp(
      eyes.left.scale.y,
      Math.max(0.04, baseOpen * openL * (1 - squint * 0.55)),
      24,
      dt
    );
    eyes.right.scale.y = damp(
      eyes.right.scale.y,
      Math.max(0.04, baseOpen * openR * (1 - squint * 0.55)),
      24,
      dt
    );
    for (const e of [eyes.left, eyes.right]) {
      e.rotation.y = state.lookX * 0.18;
      e.rotation.x = -state.lookY * 0.11;
    }

    // brows
    brows.left.position.y = 0.170 + brow * 0.024;
    brows.right.position.y = 0.170 + brow * 0.024;
    brows.left.rotation.z = browTilt * 0.42;
    brows.right.rotation.z = -browTilt * 0.42;
    brows.left.rotation.x = -0.10 + browTilt * 0.10;
    brows.right.rotation.x = -0.10 + browTilt * 0.10;

    // mouth: open cavity + tongue, or the closed line
    const open = mouth;
    cavity.scale.set(0.134, 0.006 + open * 0.054, 0.012 + open * 0.030);
    cavity.visible = open > 0.04;

    tongueGroup.visible = tongue > 0.04 && open > 0.15;
    tongueGroup.scale.set(
      0.86 + tongue * 0.18,
      0.55 + tongue * 0.55,
      0.82 + tongue * 0.18
    );
    tongueGroup.position.y = 0.004 - tongue * 0.020;
    tongueGroup.rotation.x = 0.16 + tongue * 0.18;

    // line: cross-fade smile / neutral / frown, and fade out as the mouth opens
    const lineMix = clamp(1 - open * 2.6, 0, 1);
    const smilePos = clamp(smile, 0, 1);
    const frownPos = clamp(-smile, 0, 1);
    const neutralPos = clamp(1 - smilePos - frownPos, 0, 1);
    mouthLines[0].material.opacity = lineMix * smilePos;
    mouthLines[1].material.opacity = lineMix * neutralPos * 0.9;
    mouthLines[2].material.opacity = lineMix * frownPos;

    // ears: spring sway, back-sweep, lift
    const earSway = Math.sin(elapsed * 1.35) * 0.018 + Math.sin(elapsed * 0.61) * 0.010;
    const lift = earLift;
    for (const s of [1, -1]) {
      const e = s > 0 ? ears.left : ears.right;
      const swing = Math.sin(elapsed * 1.6 + s * 0.7) * 0.02;
      e.rotation.z = s * (0.30 - lift * 0.34 + earBack * 0.04) + earSway * s;
      e.rotation.x = 0.10 + earBack * 0.72 - lift * 0.18 + swing;
      e.rotation.y = s * (0.14 + earBack * 0.14);
    }

    // tail
    const tailX = S.tailX.step(dt);
    const tailY = S.tailY.step(dt);
    const tailZ = S.tailZ.step(dt);
    const wag = Math.sin(elapsed * 4.1) * 0.055 + Math.sin(elapsed * 2.2) * 0.02;
    const happyWag = state.mood === 'excited' ? 1.9 : state.mood === 'playful' ? 1.5 : 1;
    tailPivot.rotation.x = tailX + Math.sin(elapsed * 1.2) * 0.02;
    tailPivot.rotation.y = tailY + wag * happyWag;
    tailPivot.rotation.z = tailZ + Math.sin(elapsed * 3.1) * 0.015;

    // legs
    for (const k of ['fl', 'fr', 'hl', 'hr']) {
      const leg = legs[k];
      const sx = S.legs[k].x.step(dt);
      const sz = S.legs[k].z.step(dt);
      leg.rotation.x = sx;
      leg.rotation.z = sz;
    }
    // keep paws off the floor in a jump by pitching the legs out
    legs.fl.rotation.y = 0;
    legs.fr.rotation.y = 0;

    // ball prop
    ball.visible = ballMix > 0.02;
    ball.scale.setScalar(0.6 + ballMix * 0.4);
    bite.visible = ballMix > 0.5;

    // shadow follows the root lift so a jump looks airborne
    shadow.scale.setScalar(clamp(1 + rootY * 0.35, 0.6, 1.4));
    shadow.material.opacity = clamp(0.85 - rootY * 0.55, 0.18, 0.9);

    return state;
  }

  /* ---------------- public API (Rive parity) ---------------- */

  applyMood(state.mood);
  applyPose(state.pose, true);

  // An eye casting a shadow onto the shelled skull turns that shadow into a
  // speckled crust where the strands are sparse.
  root.traverse((o) => {
    if (o.isMesh && o.material === mats.eye) o.castShadow = false;
  });

  /* ---------------- shell fur ---------------- */
  // Painted torso keeps its vertex colours; every other fur mesh uses the
  // flat variant. Both get the same strand model so the coat reads as one pelt.
  const shellVC = makeFurShellMaterial(mats.fur, { length: 0.028 });
  const shellFlat = makeFurShellMaterial(mats.furPlain, { length: 0.016 });
  // The skull needs a face mask: unmasked socket strands grow straight over the
  // eye rims and speckle them (the "shadow on shells = crust" trap, restated).
  // Fur length fades to zero within 0.07 of each eye centre, fully back by 0.17.
  const shellHead = makeFurShellMaterial(mats.furPlain, {
    length: 0.016,
    mask: {
      a: new THREE.Vector3(SPEC.eye.x, SPEC.eye.y, SPEC.eye.z),
      b: new THREE.Vector3(-SPEC.eye.x, SPEC.eye.y, SPEC.eye.z),
      r: 0.17,
      feather: 0.10,
    },
  });
  const SHELL_FUR = true;
  if (SHELL_FUR) {
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.__shellified || o.userData.noFur) return;
      if (o.name === 'skull') shellify(o, shellHead);
      else if (o.material === mats.fur) shellify(o, shellVC);
      else if (o.material === mats.furPlain) shellify(o, shellFlat);
    });
  }
  mats.eye.envMapIntensity = 0.55;

  const api = {
    root,
    pivots: {
      bodyRoot,
      headPivot,
      eyesGroup: eyes.left,
      leftArmPivot: legs.fl,
      rightArmPivot: legs.fr,
      tailPivot,
    },
    parts: { torso, skull, ears, eyes, brows, tail, collar, tag },
    materials: mats,
    moods: MOODS,
    poses: POSES,

    setMood(name) {
      applyMood(name);
      return api;
    },
    setPose(name, immediate = false) {
      applyPose(name, immediate);
      return api;
    },
    setLookTarget(nx, ny, weight = 1) {
      state.pointerX = clamp(nx, -1, 1) * weight;
      state.pointerY = clamp(ny, -1, 1) * weight;
      return api;
    },
    scrub(channel, t) {
      const v = clamp(t, 0, 1);
      if (channel === 'posture' || channel === 'progress') {
        S.pitch.set(lerp(-0.05, 0.2, v));
        S.rootY.set(lerp(0.02, -0.05, v));
        S.headPitch.set(lerp(-0.1, 0.14, v));
      } else if (channel === 'mouth') {
        S.mouth.set(v);
      } else {
        S.eye.set(lerp(0.3, 1, v));
      }
      return api;
    },
    bindViewModel(vm = {}) {
      if (vm.mood && MOODS[vm.mood]) applyMood(vm.mood);
      if (vm.pose && POSES[vm.pose]) applyPose(vm.pose);
      if (typeof vm.progress === 'number') api.scrub('posture', vm.progress);
      if (typeof vm.posture === 'number') api.scrub('posture', vm.posture);
      return api;
    },
    triggerBoop() {
      state.boopVel = 0.9;
      return api;
    },
    boop() {
      state.boopVel = 0.9;
      return api;
    },
    updateSpringBone(dt) {
      return tick(dt, state.time + dt);
    },
    blink() {
      state.blinking = true;
      state.blinkPhase = 0;
      return api;
    },
    tick,
    get state() {
      return state;
    },
  };

  root.userData = api;
  root.userData.tick = tick;

  return api;
}

/* ------------------------------------------------------------------ */
/* Scene rig — lights, camera helpers, renderer settings               */
/* ------------------------------------------------------------------ */

export function buildStudioScene(renderer, pup) {
  const scene = new THREE.Scene();
  scene.environment = makeStudioEnvironment(renderer);
  // the PMREM floods both sides; pulling it back is what gives a form shadow
  scene.environmentIntensity = 0.62;

  const key = new THREE.DirectionalLight(0xfff1dc, 1.55);
  key.position.set(4.2, 4.6, 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.022;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -3;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce9ff, 0.22);
  fill.position.set(-4.2, 2.4, 2.6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe4b8, 3.20);
  rim.position.set(-2.8, 2.6, -4.2);
  scene.add(rim);

  const bounceLight = new THREE.HemisphereLight(0xfff1de, 0x2a1d12, 0.10);
  scene.add(bounceLight);

  scene.add(pup.root);
  return { scene, lights: { key, fill, rim, bounceLight } };
}

export { SPEC };
