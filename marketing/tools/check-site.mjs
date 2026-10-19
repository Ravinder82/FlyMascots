import puppeteer from 'puppeteer-core';
import path from 'node:path';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = '/Users/ravinderpoonia/Developer/FlyMascots';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()); });
page.on('pageerror', e => console.log('PAGE EXCEPTION:', e.message));
await page.goto(`file://${ROOT}/website/index.html?capture=1&shot=stage`, { waitUntil: 'networkidle0' });
await page.evaluate(() => Promise.all(Array.from(document.images).map(i => i.decode().catch(() => {}))));
await new Promise(r => setTimeout(r, 1500));

// 1. the stage announced itself to the parent
const ready = await page.evaluate(() => window.__SITE_READY === true);
console.log('site ready:', ready);

// 2. click "think" on the page, check the pill state and the stage mood
await page.click('[data-mood="think"]');
await new Promise(r => setTimeout(r, 2200));
const state = await page.evaluate(() => {
  const on = document.querySelector('.mood-buttons button.on');
  return { activePill: on && on.getAttribute('data-mood') };
});
console.log('after click:', state);
await page.screenshot({ path: '/tmp/mood-think.png' });

// 3. drive via CAPTURE.pose from a "capture script" (what films will do)
await page.evaluate(() => window.CAPTURE.pose('celebrate'));
await new Promise(r => setTimeout(r, 1600));
await page.screenshot({ path: '/tmp/mood-celebrate.png' });

// 4. freeze + determinism: two stills must match byte-for-byte
await page.evaluate(() => window.CAPTURE.pose('sleep'));
await new Promise(r => setTimeout(r, 1200));
const a = await page.screenshot({ path: '/tmp/still-a.png' });
await new Promise(r => setTimeout(r, 900));
const b = await page.screenshot({ path: '/tmp/still-b.png' });
console.log('two stills identical (frozen page):', Buffer.compare(a, b) === 0);
const { execFileSync } = await import('node:child_process');
console.log(execFileSync('python3', ['-c', `
from PIL import Image, ImageChops
a = Image.open('/tmp/still-a.png').convert('RGB')
b = Image.open('/tmp/still-b.png').convert('RGB')
diff = ImageChops.difference(a, b)
bbox = diff.getbbox()
print('diff bbox:', bbox)
if bbox:
    import numpy as np
    arr = np.asarray(diff)
    print('max delta:', int(arr.max()), 'changed px:', int((arr.sum(axis=2) > 0).sum()))
`]).toString());

// 5. dark theme via CAPTURE.state
await page.evaluate(() => window.CAPTURE.state('theme=dark&mood=working'));
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: '/tmp/mood-dark-working.png' });
console.log('done');
await browser.close();
