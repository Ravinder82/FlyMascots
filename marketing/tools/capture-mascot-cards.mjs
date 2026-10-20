/**
 * Capture the card thumbnail for every mascot in the library — the portrait
 * that sits on the landing page's cast row.
 *
 *   node capture-mascot-cards.mjs
 *
 * Writes website/assets/mascot-<id>.png, assets/mascot-<id>.png and
 * marketing/stills/media/mascot-<id>.png — a square, transparent-backed
 * shot of the character, framed tight for a 72px tile.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STAGE = `file://${ROOT}/website/assets/stage.html`;
const SIZE = 1000;
const OUT = 320;

/* Each character gets its own portrait framing — a sculpt and a procedural
 * build are not the same shape, so the camera is not the same either. */
const CAST = [
  { id: 'axo', dist: 4.5, camy: 0.62, looky: 0.62, mood: 'idle', t: 2.6 },
  { id: 'nicklas', dist: 5.6, camy: 0.9, looky: 0.72, mood: 'idle', t: 2.6 },
];

const TARGETS = [
  path.join(ROOT, 'website/assets'),
  path.join(ROOT, 'assets'),
  path.join(ROOT, 'marketing/stills/media'),
];

for (const dir of TARGETS) mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: SIZE, height: SIZE, deviceScaleFactor: 1 },
});

for (const member of CAST) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('  page exception:', e.message));
  await page.goto(
    `${STAGE}?ui=0&capture=1&bg=transparent&mascot=${member.id}` +
    `&dist=${member.dist}&camy=${member.camy}&looky=${member.looky}`,
    { waitUntil: 'networkidle0' }
  );
  await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 60000 });

  const who = await page.evaluate(() => window.AxoStage.mascot);
  await page.evaluate(
    (m) => window.AxoStage.still({ mood: m.mood, t: m.t }),
    member
  );
  await new Promise((r) => setTimeout(r, 200));

  const raw = path.join(ROOT, `marketing/videos/public/card-${member.id}.png`);
  mkdirSync(path.dirname(raw), { recursive: true });
  await page.screenshot({ path: raw, omitBackground: true });
  await page.close();

  for (const dir of TARGETS) {
    const file = path.join(dir, `mascot-${member.id}.png`);
    execFileSync('ffmpeg', [
      '-y', '-i', raw,
      '-vf', `scale=${OUT}:${OUT}`,
      '-frames:v', '1', file,
    ], { stdio: 'pipe' });
  }
  console.log('card captured —', who);
}

await browser.close();
execFileSync('rm', ['-rf', path.join(ROOT, 'marketing/videos/public')]);
console.log('done →', TARGETS.join(', '));
