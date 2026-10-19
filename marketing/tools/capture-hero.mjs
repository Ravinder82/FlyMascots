/**
 * Capture the README hero stage + mood strip sources from the real viewer.
 * Usage: node capture-hero.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'assets');
const MEDIA = path.join(ROOT, 'marketing/stills/media');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STAGE = `file://${ROOT}/site/axo-stage.html`;
const LAUNCH_ARGS = ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'];

mkdirSync(OUT, { recursive: true });

const launch = (viewport) =>
  puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: LAUNCH_ARGS,
    defaultViewport: viewport,
  });

/* Hero — the framed stage with mood pills. */
{
  const browser = await launch({ width: 1240, height: 1060, deviceScaleFactor: 2 });
  const page = await browser.newPage();
  await page.goto(`${STAGE}?mood=idle&t=2.6`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT, 'axo-stage.png') });
  await browser.close();
  console.log('hero → assets/axo-stage.png');
}

/* Celebrate hero candidate. */
{
  const browser = await launch({ width: 1240, height: 1060, deviceScaleFactor: 2 });
  const page = await browser.newPage();
  await page.goto(`${STAGE}?mood=celebrate&t=2.35`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__AXO_READY === true, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(MEDIA, 'hero-celebrate.png') });
  await browser.close();
  console.log('hero candidate → marketing/stills/media/hero-celebrate.png');
}

/* Copy the best square mood stills for the README strip. */
for (const mood of ['idle', 'working', 'think', 'celebrate', 'sleep']) {
  const src = path.join(MEDIA, `mood-${mood}.png`);
  try {
    copyFileSync(src, path.join(OUT, `mood-${mood}.png`));
  } catch {}
}
console.log('moods copied to assets/');
