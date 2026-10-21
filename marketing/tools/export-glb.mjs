import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const out = process.argv[2] || 'studio/pup/sunny.glb';
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'shell',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 1200 });
await p.goto('http://127.0.0.1:8766/studio/pup/index.html?ui=0', { waitUntil: 'networkidle0' });
await p.waitForFunction('window.__SUNNY_READY===true', { timeout: 30000 });
await p.evaluate(() => window.SunnyStage.still({ angle: 'front', mood: 'happy', pose: 'stand', t: 2.2 }));
const url = await p.evaluate(() => window.SunnyStage.exportGLB());
if (!url || !url.startsWith('data:')) throw new Error('export failed');
const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
fs.writeFileSync(out, buf);
console.log('wrote', out, (buf.length / 1024).toFixed(0) + ' KB');
await b.close();
