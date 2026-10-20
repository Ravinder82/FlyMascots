/**
 * Capture the five mood loops for the landing page — deterministic frame
 * seeks from the real viewer, transparent PNG sequence, flattened onto the
 * card's studio cream and encoded to mp4 + webm. Real motion, never faked.
 *
 * Usage: node capture-mood-loops.mjs [mascot]
 * Output: website/media/moods/<mascot-><mood>.mp4|.webm
 *         website/assets/mood-<mascot-><mood>-poster.png
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const STAGE = `file://${ROOT}/site/axo-stage.html`;
const FRAMES = path.join(ROOT, 'marketing/videos/public/moodloops');
const OUT = path.join(ROOT, 'website/media/moods');
const POSTERS = path.join(ROOT, 'website/assets');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30;
const W = 560;
const H = 700;
const CARD_BG = '0xF7F2E9'; // the tile's studio cream — matches the site card

/* Any mascot in the library. Axo keeps the plain names it always had. */
const MASCOT = (process.argv[2] || 'axo').toLowerCase();
const SLUG = MASCOT === 'axo' ? '' : `${MASCOT}-`;

const LOOPS = [
  { mood: 'idle', seconds: 4.0, timeline: null },
  { mood: 'working', seconds: 4.0, timeline: [{ t: 0.8, mood: 'working' }] },
  { mood: 'think', seconds: 4.0, timeline: [{ t: 0.8, mood: 'think' }] },
  { mood: 'celebrate', seconds: 4.0, timeline: [{ t: 0.8, mood: 'celebrate' }] },
  { mood: 'sleep', seconds: 4.6, timeline: [{ t: 0.8, mood: 'sleep' }] },
];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

for (const loop of LOOPS) {
  const dir = path.join(FRAMES, loop.mood);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('  page exception:', e.message));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`${STAGE}?ui=0&capture=1&bg=transparent&dpr=1&mascot=${MASCOT}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 60000 });
  await page.evaluate((tl) => window.AxoStage.resetFilm(tl), loop.timeline);

  const frames = Math.round(loop.seconds * FPS);
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.AxoStage.seekTo(t), i / FPS);
    await page.screenshot({
      path: path.join(dir, `f${String(i).padStart(4, '0')}.png`),
      omitBackground: true,
    });
    if (i % 45 === 0) process.stdout.write(`\r${MASCOT} ${loop.mood}: ${i}/${frames}`);
  }
  await page.close();
  console.log(`\r${MASCOT} ${loop.mood}: ${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`);

  // Flatten onto the card cream and encode both formats.
  const base = ['-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png')];
  const filter = `color=c=${CARD_BG}:s=${W}x${H}:r=${FPS}[bg];[bg][0]overlay=shortest=1`;
  execFileSync('ffmpeg', [
    '-y', ...base, '-f', 'lavfi', '-i', `color=c=${CARD_BG}:s=${W}x${H}:r=${FPS}`,
    '-filter_complex', filter,
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-t', String(loop.seconds),
    path.join(OUT, `${SLUG}${loop.mood}.mp4`),
  ], { stdio: 'pipe' });
  execFileSync('ffmpeg', [
    '-y', ...base, '-f', 'lavfi', '-i', `color=c=${CARD_BG}:s=${W}x${H}:r=${FPS}`,
    '-filter_complex', filter,
    '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p',
    '-t', String(loop.seconds),
    path.join(OUT, `${SLUG}${loop.mood}.webm`),
  ], { stdio: 'pipe' });

  // Poster = flattened first frame, sized for the tile.
  execFileSync('ffmpeg', [
    '-y', '-i', path.join(dir, 'f0000.png'),
    '-f', 'lavfi', '-i', `color=c=${CARD_BG}:s=${W}x${H}`,
    '-filter_complex', '[1][0]overlay=shortest=1',
    '-frames:v', '1', path.join(POSTERS, `mood-${SLUG}${loop.mood}-poster.png`),
  ], { stdio: 'pipe' });
}

await browser.close();
rmSync(FRAMES, { recursive: true, force: true });
console.log('done →', OUT);
