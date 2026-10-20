/**
 * Capture stills for any mascot in the library.
 *
 *   node capture-mascot.mjs <mascot> [outdir] [dpr] [yaw]
 *
 * Writes the review-size stills straight from the live stage — the same
 * pixels a visitor sees — plus the two export sizes the repo keeps:
 *
 *   marketing/stills/media/<slug>mood-<mood>.png        1000×1000
 *   marketing/stills/media/2x/<slug>mood-<mood>.png     2000×2000
 *   assets/<slug>mood-<mood>.png                         300×300
 *
 * Axo keeps the plain names it always had; every other mascot is prefixed.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const MASCOT = (process.argv[2] || 'nicklas').toLowerCase();
const OUT = process.argv[3] || path.join(ROOT, 'marketing/stills/media');
const DPR = Number(process.argv[4] || 1);
const YAW = Number(process.argv[5] || 0);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STAGE = `file://${ROOT}/website/assets/stage.html`;

/* Axo's files were shipped without a prefix — keep them that way. */
const SLUG = MASCOT === 'axo' ? '' : `${MASCOT}-`;

const MOODS = [
  { id: 'idle', t: 2.6 },
  { id: 'working', t: 2.8 },
  { id: 'think', t: 3.2 },
  { id: 'celebrate', t: 2.35 },
  { id: 'sleep', t: 3.0 },
];

const EXPORTS = [
  { dir: OUT, size: 1000 },
  { dir: path.join(ROOT, 'marketing/stills/media/2x'), size: 2000 },
  { dir: path.join(ROOT, 'assets'), size: 300 },
];

for (const target of EXPORTS) mkdirSync(target.dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: 1000, height: 1000, deviceScaleFactor: DPR },
});

const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.log('  page error:', m.text());
});
page.on('pageerror', (e) => console.log('  page exception:', e.message));

await page.goto(`${STAGE}?ui=0&capture=1&mascot=${MASCOT}${YAW ? `&yaw=${YAW}` : ''}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 60000 });

const who = await page.evaluate(() => window.AxoStage.mascot);
console.log('stage ready — mascot:', who);

for (const mood of MOODS) {
  const info = await page.evaluate((m) => window.AxoStage.still({ mood: m.id, t: m.t }), mood);
  await new Promise((r) => setTimeout(r, 150));

  const raw = path.join(OUT, `.raw-${SLUG}mood-${mood.id}.png`);
  await page.screenshot({ path: raw });
  for (const target of EXPORTS) {
    execFileSync('ffmpeg', [
      '-y', '-i', raw,
      '-vf', `scale=${target.size}:${target.size}`,
      '-frames:v', '1',
      path.join(target.dir, `${SLUG}mood-${mood.id}.png`),
    ], { stdio: 'pipe' });
  }
  console.log('captured', mood.id, info);
}

await browser.close();
for (const mood of MOODS) {
  rmSync(path.join(OUT, `.raw-${SLUG}mood-${mood.id}.png`), { force: true });
}
console.log('done →', EXPORTS.map((t) => t.dir).join(', '));
