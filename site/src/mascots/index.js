/**
 * Mascot registry — every character on the site is one entry here.
 *
 * kind: 'procedural'  → built in code (Axo)
 *       'glb'         → a ready-made sculpt, loaded from a model file
 *
 * A new mascot is: one entry + one model file. The stage, the landing page
 * and the capture rig all read from here, so nothing else has to change.
 */
import { BAKED_MASCOT_CONFIG, buildProceduralMascot } from '../engine.js';
import { NICKLAS, buildNicklasRig, loadNicklasModel } from './nicklas.js';

export const MASCOTS = {
  axo: {
    id: 'axo',
    label: 'Axo',
    subtitle: 'Cyber Axolotl Synthesizer',
    kind: 'procedural',
    blurb: 'The demo character — a mint axolotl with goggles, built in code by the skill itself.',
    camera: { dist: 6.9, camy: 0.5, looky: 0.42, fov: 40 },
    load: async () => null,
    build: ({ envMap }) => buildProceduralMascot(
      { ...BAKED_MASCOT_CONFIG, pose: 'idle', trackCursor: true, levitation: 0.2, breathSpeed: 2 },
      envMap
    ),
  },

  nicklas: {
    ...NICKLAS,
    blurb: 'A ready-made sculpt — 24K gold, a gift in one hand, exported straight out of the studio.',
    load: () => loadNicklasModel(NICKLAS.modelUrl),
    build: ({ model }) => buildNicklasRig(model),
  },
};

export const MASCOT_ORDER = ['axo', 'nicklas'];

export function getMascot(id) {
  return MASCOTS[id] || MASCOTS.axo;
}

export function normMascot(value) {
  const v = String(value || '').toLowerCase();
  return MASCOTS[v] ? v : 'axo';
}
