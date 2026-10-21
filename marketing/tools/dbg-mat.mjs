import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'shell', args: ['--use-gl=angle','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({width:900,height:900});
await p.goto('http://127.0.0.1:8766/studio/pup/index.html?ui=0',{waitUntil:'networkidle0'});
await p.waitForFunction('window.__SUNNY_READY===true',{timeout:30000});
const out = await p.evaluate(() => {
  const r = [];
  window.SunnyStage.pup.root.traverse(o=>{
    if(!o.isMesh) return;
    const m = o.material;
    if (m && m.bumpMap && r.length < 4) r.push({
      name:o.name||o.type, mat:m.type, bump:!!m.bumpMap,
      img: m.bumpMap.image ? [m.bumpMap.image.width, m.bumpMap.image.height] : null,
      scale: m.bumpScale ?? m.normalScale?.x, sheen: m.sheen,
      hasUV: !!o.geometry.attributes.uv, repeat: m.bumpMap?.repeat?.toArray?.(),
      vc: m.vertexColors
    });
  });
  return r;
});
console.log(JSON.stringify(out,null,1));
await b.close();
