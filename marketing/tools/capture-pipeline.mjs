/**
 * Capture the FlyMascots pipeline diagram from the real flowviewer page.
 * Uses the viewer's own export menu (SVG + raster), then renders the SVG
 * at 2x with headless Chrome. No mockups.
 *
 * Usage: node capture-pipeline.mjs
 * Output: marketing/stills/media/pipeline-{dark,light}.{svg/png}
 *         marketing/stills/media/pipeline-app-dark.png (with viewer chrome)
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SOURCE = path.join(ROOT, 'diagrams/mascot-pipeline.html');
const OUT = path.join(ROOT, 'marketing/stills/media');
const DL = path.join(OUT, 'downloads');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

mkdirSync(OUT, { recursive: true });
rmSync(DL, { recursive: true, force: true });
mkdirSync(DL, { recursive: true });

const launch = (viewport) =>
  puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: viewport,
  });

const waitForNewFile = async (before, timeoutMs = 25000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const fresh = readdirSync(DL).filter((f) => !before.has(f) && !f.endsWith('.crdownload'));
    if (fresh.length) return fresh[0];
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('download timeout');
};

// ---- 1. Use the viewer's own export menu ----
const browser = await launch({ width: 2200, height: 1400, deviceScaleFactor: 2 });
const page = await browser.newPage();
await page.goto(`file://${SOURCE}?theme=dark`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.FlowViewer && window.FlowViewer.exportMenu, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const client = await page.createCDPSession();
await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });

const downloaded = {};
for (const fmt of ['svg-dark', 'svg-light', 'png']) {
  const before = new Set(readdirSync(DL));
  await page.evaluate((f) => window.FlowViewer.exportMenu.run(f), fmt);
  const file = await waitForNewFile(before);
  downloaded[fmt] = path.join(DL, file);
  console.log('exported', fmt, '→', file);
}

// Real viewer chrome screenshot at 2x.
await page.goto(`file://${SOURCE}?theme=dark`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.FlowViewer && window.FlowViewer.exportMenu, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: path.join(OUT, 'pipeline-app-dark.png') });
await browser.close();

// ---- 2. Render the exported SVGs to PNG at 2x ----
const dimsFromSvg = (svg) => {
  const wm = svg.match(/\swidth="([\d.]+)(?:px)?"/);
  const hm = svg.match(/\sheight="([\d.]+)(?:px)?"/);
  if (wm && hm) return { w: parseFloat(wm[1]), h: parseFloat(hm[1]) };
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  if (vb) {
    const [, , w, h] = vb[1].trim().split(/\s+/).map(Number);
    return { w, h };
  }
  return { w: 1900, h: 1200 };
};

for (const theme of ['dark', 'light']) {
  const svgPath = downloaded[`svg-${theme}`];
  if (!svgPath) continue;
  const svg = readFileSync(svgPath, 'utf8');
  writeFileSync(path.join(OUT, `pipeline-${theme}.svg`), svg);
  const { w, h } = dimsFromSvg(svg);
  console.log(theme, 'svg natural size', w, h);

  const b = await launch({ width: Math.ceil(w), height: Math.ceil(h), deviceScaleFactor: 2 });
  const p = await b.newPage();
  const wrap = path.join(DL, `wrap-${theme}.html`);
  writeFileSync(
    wrap,
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`
  );
  await p.goto(`file://${wrap}`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
  await p.screenshot({ path: path.join(OUT, `pipeline-${theme}.png`) });
  await b.close();
}

// Keep the viewer's own PNG export too.
if (downloaded.png) {
  writeFileSync(path.join(OUT, 'pipeline-viewer-export.png'), readFileSync(downloaded.png));
}

console.log('done →', OUT);
