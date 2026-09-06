import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5193/?test');await page.waitForFunction(()=>window.__mall&&!document.querySelector('#enter').disabled,{},{timeout:90000});
 await page.locator('#enter').click();await page.waitForFunction(()=>window.__mall.state().active);
 await page.evaluate(()=>{window.__mall.move(0,-9.7);window.__mall.look(0,Math.atan2(-1.14,2.01));});
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>document.querySelector('#reading-dialog').open);
 await page.screenshot({path:'docs/screenshots/stage4-reading.jpg',quality:88});
 await page.keyboard.press('Escape');await page.locator('#sound-settings').click();
 await page.screenshot({path:'docs/screenshots/stage4-settings.jpg',quality:88});
 await page.locator('#close-settings').click();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__mall.state().audio.rms>.00001);
 const audio=await page.evaluate(()=>window.__mall.state().audio);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__mall.state().audio.state==='suspended');
 await fs.writeFile('docs/stage4-browser-validation.json',JSON.stringify({browser:'Microsoft Edge / SwiftShader',errors,audio,paused:(await page.evaluate(()=>window.__mall.state().audio)).state},null,2)+'\n');
 console.log(JSON.stringify({errors,audio}));if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}