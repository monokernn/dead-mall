import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const prefix=process.argv[2]||'realism';
const browser=await chromium.launch({channel:'msedge',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)failed.push(`${response.status()} ${response.url()}`);});
 await page.goto('http://127.0.0.1:5193/?test');
 await page.waitForFunction(()=>window.__mall&& !document.querySelector('#enter').disabled,{},{timeout:90000});
 await page.locator('#overlay').evaluate(element=>element.hidden=true);
 await fs.mkdir('docs/screenshots',{recursive:true});
 async function view(name,route,yaw,pitch=0){
  await page.evaluate(({route,yaw,pitch})=>{const mall=window.__mall;mall.reset();for(const [x,z] of route){const p=mall.state();mall.move(x-p.x,z-p.z);}mall.look(yaw,pitch);},{route,yaw,pitch});
  // Two animation frames allow the paused renderer to process the camera change.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`docs/screenshots/${name.replace('realism',prefix)}.jpg`,quality:88});
 }
 await view('realism-atrium',[[0,16.5]],0,-.035);
 await view('realism-storefront',[[16,19],[16,16]],-Math.PI/2,-.01);
 await view('realism-fountain',[[8,19],[8,8]],1.03,-.2);
 await view('realism-foodcourt',[[8,19],[8,-1],[1.55,-1],[1.55,-15],[1.55,-14.5]],.4,-.08);
 await view('realism-reference',[[8,19],[8,9.5],[3.6,9.5]],.13,.045);
 const stats=await page.evaluate(()=>window.__mall.state());
 const manifest=JSON.parse(await fs.readFile('public/assets/1k/manifest.json','utf8'));
 await fs.writeFile(`docs/${prefix}-browser-validation.json`,JSON.stringify({browser:'Microsoft Edge / SwiftShader',viewport:[1440,900],errors,failed,stats,assetBytes:manifest.bytes},null,2)+'\n');
 console.log(JSON.stringify({errors,failed,objects:stats.objects,triangles:stats.triangles,decay:stats.decay,assetBytes:manifest.bytes}));
 if(errors.length||failed.length)throw new Error('Browser validation failed');
}finally{await browser.close();}