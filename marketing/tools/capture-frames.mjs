/**
 * Capture the mascot footage for the films — deterministic frame seeks from
 * the real viewer, transparent background, one folder per shot.
 *
 * Usage: node capture-frames.mjs [shotId ...]
 * Output: marketing/videos/public/axo/<shot>/f0000.png …
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'marketing/videos/public/axo');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STAGE = `file://${ROOT}/site/axo-stage.html`;
const FPS = 30;

/** Every mascot shot the two cuts use. `lead` = idle lead-in before the switch. */
const SHOTS = [
  { id: 'idle6', seconds: 6.0 },
  { id: 'idle-close6', seconds: 6.0, params: { dist: 4.4, camy: 1.15, looky: 1.15, blinkhold: 0.22 } },
  { id: 'sw-work', seconds: 3.6, timeline: [{ t: 1.0, mood: 'working' }] },
  { id: 'sw-think', seconds: 3.6, timeline: [{ t: 1.0, mood: 'think' }] },
  { id: 'sw-celebrate', seconds: 3.6, timeline: [{ t: 1.0, mood: 'celebrate' }] },
  { id: 'sw-sleep', seconds: 4.2, timeline: [{ t: 1.0, mood: 'sleep' }] },
];

const wanted = process.argv.slice(2);
const shots = wanted.length ? SHOTS.filter((s) => wanted.includes(s.id)) : SHOTS;

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: 1000, height: 1000, deviceScaleFactor: 1 },
});

for (const shot of shots) {
  const dir = path.join(OUT, shot.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const params = new URLSearchParams({
    ui: '0',
    capture: '1',
    bg: 'transparent',
    dpr: '1',
    ...(shot.params || {}),
  });
  const page = await browser.newPage();
  await page.goto(`${STAGE}?${params}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 30000 });
  await page.evaluate((tl) => window.AxoStage.resetFilm(tl), shot.timeline || null);

  const frames = Math.round(shot.seconds * FPS);
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.AxoStage.seekTo(t), i / FPS);
    await page.screenshot({
      path: path.join(dir, `f${String(i).padStart(4, '0')}.png`),
      omitBackground: true,
    });
    if (i % 30 === 0) process.stdout.write(`\r${shot.id}: ${i}/${frames}`);
  }
  const bytes = readdirSync(dir).reduce((n, f) => n + statSync(path.join(dir, f)).size, 0);
  console.log(
    `\r${shot.id}: ${frames} frames, ${(bytes / 1024 / 1024).toFixed(1)} MB, ${(
      (Date.now() - started) / 1000
    ).toFixed(1)}s`
  );
  await page.close();
}

await browser.close();
console.log('done →', OUT);
