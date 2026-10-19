/** QA the redesigned landing page: full-page + above-fold shots at
 *  360 / 768 / 1440, light and dark, frozen stage for exact pixels.
 *  Usage: node qa-site-v2.mjs [label]  → marketing/stills/site-review/v2-<label>-*.png
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SITE = `file://${ROOT}/website/index.html`;
const OUT = path.join(ROOT, 'marketing/stills/site-review');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const label = process.argv[2] || 'v2';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const THEMES = ['light', 'dark'];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const page = await browser.newPage();
    await page.setViewport({ ...vp, deviceScaleFactor: 1 });
    await page.goto(`${SITE}?capture=1&theme=${theme}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.__SITE_READY === true', { timeout: 30000 });
    await page.evaluate(() => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));

    // above the fold
    const fold = path.join(OUT, `${label}-${theme}-${vp.name}-fold.png`);
    await page.screenshot({ path: fold });

    // tiled full page (WebGL-safe stitch)
    const tiles = await page.evaluate(() => {
      const H = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const out = [];
      for (let y = 0; y < total; y += H) out.push(y);
      window.__total = total;
      return { H, total, ys: out };
    });
    const files = [];
    let lastY = -1;
    const ys = [];
    for (let i = 0; i < tiles.ys.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), tiles.ys[i]);
      await new Promise((r) => setTimeout(r, 260));
      const actual = await page.evaluate(() => Math.round(window.scrollY));
      if (actual === lastY) break; // clamped — page bottom already captured
      lastY = actual;
      const f = path.join(OUT, `${label}-${theme}-${vp.name}-t${i}.png`);
      await page.screenshot({ path: f });
      files.push(f);
      ys.push(actual);
    }
    const fs = await import('node:fs');
    fs.writeFileSync(path.join(OUT, `${label}-${theme}-${vp.name}.json`),
      JSON.stringify({ viewportH: tiles.H, ys }));
    await page.close();
    console.log(`${theme}/${vp.name}: fold + ${files.length} tiles (total ${tiles.total}px)`);
  }
}

await browser.close();
console.log('stitched tiles in', OUT);
