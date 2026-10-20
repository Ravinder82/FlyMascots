/**
 * Set up marketing/videos/public — the folder Remotion serves its static
 * assets from (staticFile()).
 *
 * It holds three kinds of thing:
 *   icon.svg / icon-dark.svg   the brand mark, light and dark
 *   music/, sfx/               the soundtrack and the one-shots
 *   <mascot>/<shot>/*.png      the captured frames, written by capture-frames.mjs
 *
 * This script only ever ADDS the brand and sound assets. The captured frames
 * are left alone — they are expensive and they get rewritten by the capture
 * tools, not by this one.
 *
 * Usage: node setup-videos-public.mjs
 */
import { mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PUBLIC = path.join(ROOT, 'marketing/videos/public');

mkdirSync(PUBLIC, { recursive: true });

/** The brand mark: mint tile for dark scenes, dark tile for light ones. */
const ICONS = [
  ['website/assets/icon.svg', 'icon.svg'],
  ['website/assets/icon-dark.svg', 'icon-dark.svg'],
];

for (const [from, to] of ICONS) {
  const src = path.join(ROOT, from);
  if (!existsSync(src)) {
    console.warn('missing', from);
    continue;
  }
  copyFileSync(src, path.join(PUBLIC, to));
  console.log('icon  →', to);
}

/** Soundtrack and one-shots, mirrored from marketing/sound. */
const SOUND = [
  ['marketing/sound/music/close-up.mp3', 'music/close-up.mp3'],
  ['marketing/sound/sfx/chime.wav', 'sfx/chime.wav'],
  ['marketing/sound/sfx/clack.wav', 'sfx/clack.wav'],
  ['marketing/sound/sfx/click-coarse.wav', 'sfx/click-coarse.wav'],
  ['marketing/sound/sfx/impact-soft.wav', 'sfx/impact-soft.wav'],
  ['marketing/sound/sfx/pop.wav', 'sfx/pop.wav'],
  ['marketing/sound/sfx/riser-subtle.wav', 'sfx/riser-subtle.wav'],
  ['marketing/sound/sfx/whoosh-soft.wav', 'sfx/whoosh-soft.wav'],
];

for (const [from, to] of SOUND) {
  const src = path.join(ROOT, from);
  if (!existsSync(src)) {
    console.warn('missing', from);
    continue;
  }
  const dest = path.join(PUBLIC, to);
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log('sound →', to);
}

const shots = existsSync(path.join(PUBLIC, 'axo'))
  ? readdirSync(path.join(PUBLIC, 'axo')).join(', ')
  : '(none yet — run capture-frames.mjs)';
console.log('frames:', shots);
console.log('public ready →', PUBLIC);
