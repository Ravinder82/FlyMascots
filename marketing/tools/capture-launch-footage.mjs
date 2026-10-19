/**
 * Record the launch film's site footage — real-time CDP screencast of the
 * live, redesigned page at 1920×1080. Two takes:
 *
 *   hero    — entrance settles, pointer sweeps the mascot (it looks), then
 *             real pill clicks: working → celebrate → idle (stage reacts).
 *   journey — smooth scroll hero → the five-face section, hold while the
 *             mood loops play in view.
 *
 * Frames are timestamped as they arrive and encoded through the concat
 * demuxer, so the clip plays back at true speed. Output:
 *   marketing/videos/public/site/{hero,journey}.mp4
 *
 * Usage: node capture-launch-footage.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SITE = `file://${ROOT}/website/index.html?theme=light`;
const OUT_DIR = path.join(ROOT, 'marketing/videos/public/site');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1920;
const H = 1080;

mkdirSync(OUT_DIR, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const TAKE = {
  hero: {
    settle: 1700, // let the entrance finish before rolling
    seconds: 6.6,
    async script(page) {
      const sweep = async (pts, stepMs = 180) => {
        for (const [x, y] of pts) {
          await page.mouse.move(x, y, { steps: 12 });
          await wait(stepMs);
        }
      };
      await sweep([[1450, 320], [1180, 560], [1330, 430]]); // gaze follows
      await wait(250);
      await page.click('[data-mood="working"]');
      await wait(1450); // goggles drop + settle
      await sweep([[1250, 380], [1400, 520]], 150);
      await page.click('[data-mood="celebrate"]');
      await wait(1450); // hop + wave
      await page.click('[data-mood="idle"]');
      await wait(900);
    },
  },
  journey: {
    settle: 1500,
    seconds: 7.8,
    async script(page) {
      // smooth scroll hero → moods, then hold while the loops play
      await page.evaluate(() => {
        const target = Math.max(0, document.getElementById('moods').offsetTop - 48);
        return new Promise((res) => {
          const start = performance.now();
          const from = window.scrollY;
          const dur = 1700;
          const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
          const tick = () => {
            const t = Math.min(1, (performance.now() - start) / dur);
            window.scrollTo(0, from + (target - from) * ease(t));
            if (t < 1) requestAnimationFrame(tick);
            else res(undefined);
          };
          requestAnimationFrame(tick);
        });
      });
      await wait(4400); // tiles preload + play in view
    },
  },
};

for (const [name, take] of Object.entries(TAKE)) {
  const workDir = path.join(OUT_DIR, `.frames-${name}`);
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu'],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(SITE, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__SITE_READY === true', { timeout: 30000 });
  await wait(take.settle);

  const client = await page.createCDPSession();
  const frames = [];
  let firstTs = null;
  client.on('Page.screencastFrame', async (f) => {
    try {
      await client.send('Page.screencastFrameAck', { sessionId: f.sessionId });
    } catch {}
    if (firstTs === null) firstTs = f.metadata.timestamp;
    frames.push({ t: (f.metadata.timestamp - firstTs) / 1000, data: f.data });
  });
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 95,
    maxWidth: W,
    maxHeight: H,
    everyNthFrame: 1,
  });

  const started = Date.now();
  await take.script(page);
  const remaining = take.seconds * 1000 - (Date.now() - started);
  if (remaining > 0) await wait(remaining);

  await client.send('Page.stopScreencast').catch(() => {});
  await wait(300); // drain in-flight frames
  await browser.close();

  frames.sort((a, b) => a.t - b.t);
  frames.forEach((f, i) =>
    writeFileSync(path.join(workDir, `f${String(i).padStart(4, '0')}.jpg`), f.data, 'base64')
  );

  // concat list with true inter-frame durations
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    lines.push(`file '${path.join(workDir, `f${String(i).padStart(4, '0')}.jpg`)}'`);
    const dur = i < frames.length - 1 ? frames[i + 1].t - frames[i].t : 1 / 30;
    lines.push(`duration ${Math.max(dur, 1 / 60).toFixed(4)}`);
  }
  lines.push(`file '${path.join(workDir, `f${String(frames.length - 1).padStart(4, '0')}.jpg`)}'`);
  const listPath = path.join(workDir, 'list.txt');
  writeFileSync(listPath, lines.join('\n') + '\n');

  const out = path.join(OUT_DIR, `${name}.mp4`);
  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
    '-r', '30', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: 'pipe' });

  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'csv=p=0', out]).toString().trim();
  rmSync(workDir, { recursive: true, force: true });
  console.log(`${name}: ${frames.length} frames → ${out} (${dur}s)`);
}
console.log('done');
