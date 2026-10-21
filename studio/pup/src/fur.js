import * as THREE from 'three';

/**
 * Shell-texture fur.
 *
 * One draw call per fur mesh, N instanced shells offset along the object-space
 * normal, alpha-tested into individual strands. Opaque + depthWrite so the
 * shells occlude each other correctly without any per-shell sorting.
 *
 * The anisotropy is the important part: the noise is sampled with a squashed
 * Y frequency, so the cells come out elongated along the comb direction. That
 * is what separates "fur" from "felt".
 */

export const FUR = {
  shells: 28,
  length: 0.020,
  comb: new THREE.Vector3(0, -0.55, 0.18),
  rootTint: new THREE.Vector3(0.52, 0.50, 0.48),
  tipTint: new THREE.Vector3(1.10, 1.12, 1.16),
};

const NOISE = /* glsl */ `
float furHash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float furNoise(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(furHash13(i),                furHash13(i + vec3(1,0,0)), f.x),
        mix(furHash13(i + vec3(0,1,0)),  furHash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(furHash13(i + vec3(0,0,1)),  furHash13(i + vec3(1,0,1)), f.x),
        mix(furHash13(i + vec3(0,1,1)),  furHash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

/**
 * Patch a MeshPhysicalMaterial (or a clone of one) into a shell-fur material.
 * `length` is in world units and is divided by the mesh's world scale at build
 * time, so a scaled ear still gets the right pile height.
 */
export function makeFurShellMaterial(base, { length = FUR.length, comb = FUR.comb, mask = null } = {}) {
  const mat = base.clone();
  mat.alphaTest = 0.5;
  mat.transparent = false;
  mat.depthWrite = true;
  mat.side = THREE.FrontSide;
  // fur scatters more than the flat skin; push the sheen a little
  mat.sheen = Math.min(1, (mat.sheen ?? 0) + 0.35);
  mat.sheenRoughness = Math.max(0.45, (mat.sheenRoughness ?? 0.9) * 0.7);

  const uniforms = {
    uFurLen: { value: length },
    uComb: { value: comb.clone() },
    uRootTint: { value: FUR.rootTint.clone() },
    uTipTint: { value: FUR.tipTint.clone() },
    // face mask: pile length fades to zero near two object-space points, so
    // socket strands stop speckling the eyes (radius 0 disables the fade)
    uMaskA: { value: mask ? mask.a.clone() : new THREE.Vector3() },
    uMaskB: { value: mask ? mask.b.clone() : new THREE.Vector3() },
    uMaskR: { value: mask ? mask.r : 0 },
    uMaskFeather: { value: mask ? (mask.feather ?? 0.08) : 0 },
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aShell;
         uniform float uFurLen;
         uniform vec3 uComb;
         uniform vec3 uMaskA, uMaskB;
         uniform float uMaskR, uMaskFeather;
         varying float vH;
         varying vec3 vRest;`
      )
      .replace(
        '#include <project_vertex>',
        `
         float h = aShell;
         float maskK = 1.0;
         if (uMaskR > 0.0) {
           float inner = uMaskR - uMaskFeather;
           maskK  = smoothstep(inner, uMaskR, distance(position, uMaskA));
           maskK *= smoothstep(inner, uMaskR, distance(position, uMaskB));
         }
         vec3 furN = normalize(objectNormal);
         transformed += furN * (h * uFurLen * maskK)
                      + uComb * (h * h * uFurLen * 0.55 * maskK);
         vH = h;
         vRest = position;
         #include <project_vertex>`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uRootTint, uTipTint;
         varying float vH;
         varying vec3 vRest;
         ${NOISE}`
      )
      .replace(
        '#include <alphatest_fragment>',
        `
         // cells squashed on Y => strands run down the body
         vec3 q = vRest * vec3(240.0, 76.0, 240.0);
         float n = furNoise(q) * 0.62 + furNoise(q * 2.65) * 0.38;
         float rad = mix(1.00, 0.52, vH);
         float d = abs(n - 0.5) * 2.0;
         float strand = 1.0 - smoothstep(rad * 0.50, rad, d);
         // thin the very tip so the silhouette frays instead of ending flat
         strand *= 1.0 - smoothstep(0.90, 1.0, vH);
         diffuseColor.a *= strand;
         #include <alphatest_fragment>`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         diffuseColor.rgb *= mix(uRootTint, uTipTint, smoothstep(0.0, 0.85, vH));`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor *= mix(1.0, 0.62, vH);`
      );
  };

  // colour, plain and masked variants share this function body; without an
  // explicit key three.js caches them together and one gets the wrong shader
  mat.customProgramCacheKey = () =>
    `fur-${length.toFixed(4)}-${base.vertexColors ? 'vc' : 'flat'}-${mask ? 'm' : '-'}`;

  return mat;
}

/**
 * Turn a fur mesh into a shell cloud. The original mesh stays as the dark
 * undercoat (so gaps never show the background), and N instanced copies are
 * parented to it so they inherit its full transform chain.
 */
export function shellify(mesh, material, shells = FUR.shells) {
  if (mesh.userData.__shellified) return null;
  // Only the big fur masses. A 0.02 offset on a thin brow arc or a toe turns
  // a crisp detail into a dark fuzzy crust.
  mesh.geometry.computeBoundingSphere();
  if ((mesh.geometry.boundingSphere?.radius ?? 0) < 0.105) return null;
  mesh.userData.__shellified = true;

  const geo = mesh.geometry;
  if (!geo.getAttribute('aShell')) {
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(shells), 1);
    for (let i = 0; i < shells; i++) attr.setX(i, (i + 0.5) / shells);
    geo.setAttribute('aShell', attr);
  }

  // undercoat: darken and roughen the base so the gaps read as depth
  const under = mesh.material.clone();
  under.color = under.color ? under.color.clone().multiplyScalar(0.90) : under.color;
  if (under.vertexColors) under.color = new THREE.Color(0x6b5442);
  mesh.userData.__coat = mesh.material;
  mesh.material = under;

  const inst = new THREE.InstancedMesh(geo, material, shells);
  // InstancedMesh leaves instanceMatrix zeroed — every shell would collapse
  // to the origin and vanish.
  const id = new THREE.Matrix4();
  for (let i = 0; i < shells; i++) inst.setMatrixAt(i, id.identity());
  inst.instanceMatrix.needsUpdate = true;
  inst.name = (mesh.name || 'fur') + 'Shells';
  inst.castShadow = false;
  // shells are offset off the skin; letting them receive shadows turns the
  // whole coat into shadow-acne speckle
  inst.receiveShadow = false;
  inst.frustumCulled = false;
  inst.renderOrder = 1;
  mesh.add(inst);

  return inst;
}
