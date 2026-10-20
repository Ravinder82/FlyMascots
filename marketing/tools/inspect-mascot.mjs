/**
 * Inspect a mascot GLB: print every mesh with its world-space bounds and
 * material colour, so parts (head, arms, eyes, pedestal) can be mapped to
 * rig pivots.
 *
 * Usage: node inspect-mascot.mjs <path-to.glb>
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const buf = readFileSync(path);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await new Promise((resolve, reject) => {
  loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', resolve, reject);
});

const root = gltf.scene;
root.updateWorldMatrix(true, true);

const colorOf = (mat) => {
  const c = mat?.color;
  if (!c) return 'none';
  const hex = c.clone().convertLinearToSRGB().getHexString();
  return '#' + hex;
};

const rows = [];
let i = 0;
root.traverse((obj) => {
  if (!obj.isMesh) return;
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  rows.push({
    i: i++,
    path: (() => {
      const parts = [];
      let p = obj;
      while (p && p !== root) { parts.unshift(p.name || p.type); p = p.parent; }
      return parts.join('/') || '(root)';
    })(),
    color: colorOf(obj.material),
    center: [+c.x.toFixed(3), +c.y.toFixed(3), +c.z.toFixed(3)],
    size: [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)],
    verts: obj.geometry?.attributes?.position?.count ?? 0,
  });
});

const overall = new THREE.Box3().setFromObject(root);
const c = overall.getCenter(new THREE.Vector3());
const s = overall.getSize(new THREE.Vector3());

console.log('overall center', c.toArray().map((v) => +v.toFixed(3)), 'size', s.toArray().map((v) => +v.toFixed(3)));
console.log('meshes:', rows.length, 'total verts:', rows.reduce((a, r) => a + r.verts, 0));
console.log('');
for (const r of rows) {
  console.log(
    `${String(r.i).padStart(2)} ${r.color} ctr=${JSON.stringify(r.center)} size=${JSON.stringify(r.size)} v=${r.verts}  ${r.path}`
  );
}
