/**
 * Capture the five moods at square, transparent-free size for review
 * and for the README mood strip / launch cards.
 *
 * Usage: node capture-moods.mjs [outdir] [yaw] [dpr]
 *   dpr 2 → 2000×2000 files for 2× card exports.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = process.argv[2] || path.join(ROOT, 'marketing/stills/media');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STAGE = `file://${ROOT}/site/axo-stage.html`;
const YAW = Number(process.argv[3] || 0);
const DPR = Number(process.argv[4] || 1);

const MOODS = [
  { id: 'idle', t: 2.6 },
  { id: 'working', t: 2.8 },
  { id: 'think', t: 3.2 },
  { id: 'celebrate', t: 2.35 },
  { id: 'sleep', t: 3.0 },
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: 1000, height: 1000, deviceScaleFactor: DPR },
});

const page = await browser.newPage();
await page.goto(`${STAGE}?ui=0&capture=1${YAW ? `&yaw=${YAW}` : ''}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 30000 });

for (const mood of MOODS) {
  const info = await page.evaluate(
    (m) => window.AxoStage.still({ mood: m.id, t: m.t }),
    mood
  );
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: path.join(OUT, `mood-${mood.id}.png`) });
  console.log('captured', mood.id, info);
}

await browser.close();
