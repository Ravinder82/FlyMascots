import fs from 'node:fs';
/**
 * Screenshot the Sunny studio headlessly.
 *
 * Usage:
 *   node marketing/tools/shot-pup.mjs --out studio/pup/renders/front.png \
 *     --angle front --mood happy --pose stand --w 1200 --h 1100 [--alpha 1]
 *
 * --ui 0 strips the sidebar/chrome so the frame is the character alone.
 * --alpha 1 drops the cream stage for a transparent PNG.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const out = arg('out', 'studio/pup/renders/shot.png');
const angle = arg('angle', 'front');
const mood = arg('mood', 'happy');
const pose = arg('pose', 'stand');
const w = Number(arg('w', 1200));
const h = Number(arg('h', 1100));
const ui = arg('ui', '0');
const t = arg('t', '2.4');
const alpha = arg('alpha', '0') === '1';

const url =
  `http://127.0.0.1:8766/studio/pup/index.html?capture=1&ui=${ui}` +
  `&angle=${encodeURIComponent(angle)}&mood=${encodeURIComponent(mood)}` +
  `&pose=${encodeURIComponent(pose)}&t=${encodeURIComponent(t)}` +
  (alpha ? '&alpha=1' : '');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--use-gl=angle'],
});

const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('favicon')) console.error('[page]', m.text());
});
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('window.__SUNNY_READY === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 350));

const res = arg('res');
if (res) {
  const [rw, rh] = res.split('x').map(Number);
  await page.evaluate(([w, h]) => window.SunnyStage.setResolution(w, h), [rw, rh]);
  await new Promise((r) => setTimeout(r, 400));
  const url = await page.evaluate(() =>
    document.getElementById('stage').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
} else {
  await page.screenshot({ path: out, omitBackground: alpha });
}

const stats = await page.evaluate(() => {
  const r = window.SunnyStage?.renderer;
  return {
    tris: r?.info?.render?.triangles ?? null,
    calls: r?.info?.render?.calls ?? null,
    size: r ? [r.domElement.width, r.domElement.height] : null,
  };
});
console.log(JSON.stringify({ out, angle, mood, pose, ...stats }));
await browser.close();
