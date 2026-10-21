import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--use-gl=angle','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1100 });
page.on('pageerror', e => console.log('ERR', e.message));
page.on('console', m => { if(m.type()==='error') console.log('CONSOLE', m.text()); });
await page.goto('http://127.0.0.1:8766/studio/pup/index.html?capture=1&ui=0&angle=front&mood=happy&pose=stand&t=2.4', { waitUntil:'load' });
await page.waitForFunction('window.__SUNNY_READY === true', { timeout: 20000 });
const info = await page.evaluate(() => {
  const S = window.SunnyStage;
  const box = new (Object.getPrototypeOf(S.pup.root).constructor)();
  const THREEbox = S.pup.root;
  const b = { min:{x:1e9,y:1e9,z:1e9}, max:{x:-1e9,y:-1e9,z:-1e9} };
  THREEbox.updateWorldMatrix(true,true);
  THREEbox.traverse(o => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    b.min.x=Math.min(b.min.x,bb.min.x); b.min.y=Math.min(b.min.y,bb.min.y); b.min.z=Math.min(b.min.z,bb.min.z);
    b.max.x=Math.max(b.max.x,bb.max.x); b.max.y=Math.max(b.max.y,bb.max.y); b.max.z=Math.max(b.max.z,bb.max.z);
  });
  const c = S.camera;
  const cv = S.renderer.domElement;
  const gl = S.renderer.getContext();
  const px = new Uint8Array(4);
  gl.readPixels(Math.floor(cv.width/2), Math.floor(cv.height/2), 1,1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return {
    children: S.scene.children.length,
    cam: c.position.toArray(), look: [0, 1.03, 0],
    bounds: b,
    canvasCSS: [cv.clientWidth, cv.clientHeight, cv.width, cv.height],
    pixelCenter: Array.from(px),
    bareClass: document.querySelector('.stage-wrap').getAttribute('style'),
    grid: getComputedStyle(document.querySelector('.app')).gridTemplateColumns,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
