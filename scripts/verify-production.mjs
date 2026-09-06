import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const channel=process.argv[3]||'msedge';
const origin=process.argv[4]||'http://127.0.0.1:5195';
const browser=await chromium.launch({channel,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)failed.push(`${response.status()} ${response.url()}`);});
 await page.goto(new URL('/?test',origin).href);
 await page.waitForFunction(()=>!document.querySelector('#enter').disabled,{},{timeout:90000});
 const hooks=await page.evaluate(()=>typeof window.__mall);
 if(hooks!=='undefined')throw new Error('Development controls leaked into production');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>document.querySelector('#overlay').hidden);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('#overlay').hidden);
 await page.locator('#sound-settings').click();await page.waitForFunction(()=>document.querySelector('#settings-dialog').open);
 await page.locator('#quality').selectOption('performance');
 await page.locator('#close-settings').click();
 const report={settings:true,browser:channel+' / SwiftShader',quality:'performance',origin,entry:true,pause:true,developmentHooks:hooks,errors,failed};
 await fs.writeFile(process.argv[2]||'docs/realism-production-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 if(errors.length||failed.length)throw new Error('Production browser errors');
}finally{await browser.close();}