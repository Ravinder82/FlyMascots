/**
 * Capture the landing page — the site is the set, so every still in the kit
 * starts here. Deterministic: the page's window.CAPTURE API + ?capture=1
 * freeze motion so two runs produce identical pixels.
 *
 * Usage:
 *   node capture-site.mjs review          # full-page light/dark + mobile (QC)
 *   node capture-site.mjs <name> [...]    # named asset shots (see SHOTS)
 * Output: marketing/stills/site-review/ or marketing/stills/media/site/
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SITE = `file://${ROOT}/website/index.html`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REVIEW = path.join(ROOT, 'marketing/stills/site-review');
const OUT = path.join(ROOT, 'marketing/stills/media/site');

const ARGS = ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'];

/** Named asset shots: viewport, query, full page? */
const SHOTS = {
  hero:        { w: 1600, h: 1000, q: 'capture=1&shot=hero' },
  'hero-dark': { w: 1600, h: 1000, q: 'capture=1&shot=hero&theme=dark' },
  stage:       { w: 1600, h: 1200, q: 'capture=1&shot=stage' },
  moods:       { w: 1600, h: 1000, q: 'capture=1&shot=moods' },
  proof:       { w: 1600, h: 1200, q: 'capture=1&shot=proof' },
  film:        { w: 1600, h: 1200, q: 'capture=1&shot=film' },
  install:     { w: 1600, h: 1000, q: 'capture=1&shot=install' },
  og:          { w: 1200, h: 630,  q: 'capture=1&shot=hero' },
  mobile:      { w: 390,  h: 844,  q: 'capture=1&shot=hero', dpr: 2 },
};

/**
 * Full-page review shot. Chrome's own full-page capture repaints the top of
 * the page over the bottom on this site (WebGL in the stage iframe), so we
 * tile it ourselves: scroll, shoot each viewport, stitch with PIL.
 */
async function shootFull(browser, { file, w, h, q, dpr = 2 }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  await page.goto(`${SITE}?${q}`, { waitUntil: 'networkidle0' });
  await prepare(page);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const tiles = Math.ceil(total / h);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'fm-tiles-'));
  // The last tile clamps to the document bottom — paste every tile at the
  // exact scroll offset it was shot from, or content doubles.
  const offsets = [];
  for (let i = 0; i < tiles; i++) {
    const y = Math.min(i * h, Math.max(0, total - h));
    offsets.push(y);
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await new Promise((r) => setTimeout(r, 130));
    await page.screenshot({ path: path.join(dir, `t${String(i).padStart(3, '0')}.png`) });
  }
  await page.close();
  const py = [
    'from PIL import Image',
    'import glob, sys',
    'd, out = sys.argv[1], sys.argv[2]',
    'offs = [int(v) for v in sys.argv[3].split(",")]',
    'ims = [Image.open(f) for f in sorted(glob.glob(d + "/t*.png"))]',
    'w = ims[0].width',
    'H = offs[-1] + ims[-1].height',
    'canvas = Image.new("RGB", (w, H))',
    'for im, y in zip(ims, offs):',
    '    canvas.paste(im, (0, y))',
    'canvas.save(out)',
  ].join('\n');
  execFileSync('python3', ['-c', py, dir, file, offsets.map((v) => v * dpr).join(',')]);
  rmSync(dir, { recursive: true, force: true });
  return file;
}

/** Walk the page so every lazy asset loads, wait for the stage, settle. */
async function prepare(page) {
  await page.evaluate(async () => {
    const step = Math.max(600, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 45));
    }
    window.scrollTo(0, 0);
  });
  await page
    .evaluate(() => Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => {}))))
    .catch(() => {});
  // Wait for the stage frame to announce itself (or time out quietly).
  await page
    .waitForFunction(() => window.__SITE_READY === true, { timeout: 8000 })
    .catch(() => {});
  await new Promise((r) => setTimeout(r, 1400)); // mascot settles + reveals done
}

async function shoot(browser, { file, w, h, q, dpr = 2 }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  await page.goto(`${SITE}?${q}`, { waitUntil: 'networkidle0' });
  await prepare(page);
  await page.screenshot({ path: file, omitBackground: false });
  await page.close();
  return file;
}

const wanted = process.argv.slice(2);
const review = wanted.length === 0 || wanted.includes('review');
const names = wanted.filter((n) => n !== 'review');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ARGS });
const done = [];

if (review) {
  mkdirSync(REVIEW, { recursive: true });
  const jobs = [
    { file: path.join(REVIEW, 'full-light.png'), w: 1440, h: 900, q: 'capture=1' },
    { file: path.join(REVIEW, 'full-dark.png'),  w: 1440, h: 900, q: 'capture=1&theme=dark' },
  ];
  for (const job of jobs) done.push(await shootFull(browser, job));
  const folds = [
    { file: path.join(REVIEW, 'fold-light.png'), w: 1440, h: 900, q: 'capture=1&shot=hero' },
    { file: path.join(REVIEW, 'mobile-light.png'), w: 390, h: 844, q: 'capture=1&shot=hero', dpr: 2 },
  ];
  for (const job of folds) done.push(await shoot(browser, job));
}

for (const name of names) {
  const shot = SHOTS[name];
  if (!shot) { console.error(`unknown shot: ${name}`); continue; }
  mkdirSync(OUT, { recursive: true });
  done.push(await shoot(browser, { file: path.join(OUT, `${name}.png`), ...shot }));
}

await browser.close();
done.forEach((f) => console.log('shot', path.relative(ROOT, f)));
