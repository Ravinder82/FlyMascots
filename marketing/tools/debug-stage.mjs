/** Quick debug: load the stage, print console errors, screenshot. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
  defaultViewport: { width: 1440, height: 1180, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('file:///Users/ravinderpoonia/Developer/FlyMascots/site/axo-stage.html?t=2.4', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
console.log('ready:', await page.evaluate(() => window.__AXO_READY));
console.log('stage:', await page.evaluate(() => !!window.AxoStage));
await page.screenshot({ path: '/private/var/folders/nc/k_wj79mj0jz_fv0hwzlm4l3h0000gn/T/opencode/stage-debug.png' });
await browser.close();
