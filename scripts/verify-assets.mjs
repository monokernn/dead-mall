import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:730}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5193/.runtime/verify-assets.html');
 await page.waitForFunction(()=>window.assetReview?.ready,{},{timeout:120000});
 const results=await page.evaluate(()=>window.assetReview.results);
 if(errors.length)throw new Error(errors.join('\n'));
 await fs.writeFile('assets/library/1k/browser-validation.json',JSON.stringify({browser:'Microsoft Edge',results,errors},null,2));
 for(const id of ['CashRegister_01','modular_street_seating','rollershutter_window_01','mounted_fluorescent_lights']){
  await page.evaluate(id=>window.assetReview.show(id),id);
  await page.screenshot({path:'.runtime/asset-'+id+'.jpg',quality:80});
 }
 const manifest=JSON.parse(await fs.readFile('assets/library/1k/manifest.json','utf8'));
 const cells=manifest.assets.filter(a=>a.kind==='material').map(a=>'<div><img src="http://127.0.0.1:5193/assets/library/1k/'+a.files.find(f=>f.role==='albedo').path+'"><p>'+a.id+'</p></div>').join('');
 await page.setContent('<html lang="en"><style>body{background:#202622;color:#e0ddcf;font:14px Arial;margin:24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}img{width:100%;aspect-ratio:1;object-fit:cover}p{margin:8px 0 18px}</style><h1>Meridian / 1K material library</h1><div class="grid">'+cells+'</div></html>');
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'.runtime/asset-materials.jpg',quality:80,fullPage:true});
 console.log(JSON.stringify({verified:results.length,models:results},null,2));
}finally{await browser.close();}
