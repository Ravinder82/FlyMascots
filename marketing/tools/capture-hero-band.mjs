/**
 * The README banner and the social card — both mascots, side by side.
 *
 * The site's own hero only ever shows one character at a time, so the
 * banner is composed here: the wordmark, the line, and both characters
 * standing together, rendered from the real viewer.
 *
 * Usage: node capture-hero-band.mjs
 * Output: assets/hero.png         (2400 x 1195, README banner)
 *         website/assets/og.png   (2400 x 1260, social card)
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PUBLIC = path.join(ROOT, 'marketing/videos/public');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ICON = readFileSync(path.join(ROOT, 'website/assets/icon.svg'), 'utf8');

/* The frames the film was built from — full body, transparent. Inlined as
   data URIs: a page loaded over about:blank is not allowed to pull file://
   images, and these are big enough that a missing one would be silent. */
function frame(mascot, index) {
  const p = path.join(PUBLIC, mascot, 'idle6', `f${String(index).padStart(4, '0')}.png`);
  if (!existsSync(p)) {
    throw new Error(`missing frame ${p} — run: node capture-frames.mjs ${mascot}`);
  }
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}

const AXO = frame('axo', 40);
const NICKLAS = frame('nicklas', 40);

const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const MONO = '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function page({ w, h, axo, nicklas, chip }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden;
    font-family: ${SANS};
    background: #F3F6F5;
    position: relative;
  }
  .glow {
    position: absolute; inset: 0;
    background:
      radial-gradient(52% 62% at 74% 46%, rgba(255,254,251,.98) 0%, rgba(255,254,251,0) 72%),
      radial-gradient(38% 44% at 14% 78%, rgba(42,181,162,.10) 0%, rgba(42,181,162,0) 70%);
  }
  .copy { position: absolute; left: 110px; top: 0; height: ${h}px; width: 600px; display: flex; flex-direction: column; justify-content: center; }
  .mark { display: flex; align-items: center; gap: 16px; margin-bottom: 54px; }
  .mark img { width: 64px; height: 64px; border-radius: 26%; display: block; }
  .mark span { font-size: 30px; font-weight: 600; letter-spacing: -.02em; color: #10201B; }
  h1 {
    font-size: 88px; line-height: 1.04; letter-spacing: -.035em; font-weight: 600;
    color: #10201B;
  }
  .lede { margin-top: 32px; font-size: 29px; line-height: 1.45; color: rgba(16,32,27,.64); max-width: 21ch; }
  .chip {
    margin-top: 42px; display: inline-flex; align-items: center; gap: 18px;
    background: #FFFFFF; border: 1px solid rgba(16,32,27,.10); border-radius: 999px;
    padding: 17px 22px 17px 28px; align-self: flex-start; white-space: nowrap;
  }
  .chip code { font-family: ${MONO}; font-size: 22px; color: #10201B; white-space: nowrap; }
  .chip em {
    font-style: normal; font-family: ${MONO}; font-size: 15px; letter-spacing: .14em;
    text-transform: uppercase; color: #0E7A6B; border-left: 1px solid rgba(16,32,27,.10);
    padding-left: 18px;
  }
  /* The cast: two characters, overlapping for depth, feet on the floor. */
  .cast { position: absolute; right: 0; top: 0; height: ${h}px; width: 66%; }
  .c { position: absolute; bottom: 0; }
  .c img { height: 88%; width: auto; display: block; }
  .c.a { left: 0; }
  .c.n { right: 0; z-index: 2; }
  .label {
    position: absolute; top: 1%; left: 50%; transform: translateX(-50%);
    font-family: ${MONO}; font-size: 17px; letter-spacing: .14em;
    text-transform: uppercase; color: rgba(16,32,27,.44); white-space: nowrap;
  }
</style></head>
<body>
  <div class="glow"></div>
  <div class="copy">
    <div class="mark"><img src="data:image/svg+xml;base64,${Buffer.from(ICON).toString('base64')}" alt=""><span>FlyMascots</span></div>
    <h1>Give your App<br>a mascot that<br>feels alive.</h1>
    <p class="lede">An agent skill that makes mascots with many moods — from an idea or an image.</p>
    ${chip ? `<div class="chip"><code>npx skills add Ravinder82/FlyMascots</code><em>copy</em></div>` : ''}
  </div>
  <div class="cast">
    <div class="c a"><img src="${axo}" alt=""><div class="label">Axo</div></div>
    <div class="c n"><img src="${nicklas}" alt=""><div class="label">Nicklas</div></div>
  </div>
</body></html>`;
}

const shots = [
  { name: 'hero', w: 2400, h: 1195, out: path.join(ROOT, 'assets/hero.png'), chip: true },
  { name: 'og', w: 2400, h: 1260, out: path.join(ROOT, 'website/assets/og.png'), chip: false },
];

mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
mkdirSync(path.join(ROOT, 'website/assets'), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu', '--force-device-scale-factor=1'],
});

for (const shot of shots) {
  const p = await browser.newPage();
  await p.setViewport({ width: shot.w, height: shot.h, deviceScaleFactor: 1 });
  await p.setContent(page({ w: shot.w, h: shot.h, axo: AXO, nicklas: NICKLAS, chip: shot.chip }), {
    waitUntil: 'load',
  });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => {
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : img.decode().catch(() => {}))),
    );
  });
  await p.screenshot({ path: shot.out });
  await p.close();
  console.log(`${shot.name} → ${shot.out} (${shot.w}×${shot.h})`);
}

await browser.close();
