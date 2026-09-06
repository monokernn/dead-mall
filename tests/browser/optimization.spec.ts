import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
test('sprint releases safely, look gain is reduced, and graphics avoid idle rendering',async({page})=>{
 test.setTimeout(150000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?test');await expect(page.locator('#enter')).toBeEnabled({timeout:90000});
 const state=()=>page.evaluate(()=>(window as any).__mall.state());
 await page.locator('#enter').click();await expect(page.locator('#overlay')).toBeHidden();
 await page.waitForTimeout(500);
 const idleBefore=await state();await page.waitForTimeout(750);const idleAfter=await state();
 expect(idleAfter.frames).toBe(idleBefore.frames);
 for(const shift of ['ShiftLeft','ShiftRight']){
  await page.keyboard.down(shift);expect((await state()).speed).toBe(4.5);
  const before=await state();await page.keyboard.down('KeyW');
  await expect.poll(async()=>(await state()).z,{timeout:15000}).toBeLessThan(before.z-.3);
  await page.keyboard.up('KeyW');await page.keyboard.up(shift);expect((await state()).speed).toBe(1.8);
 }
 await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:40,movementY:20})));
 const look=await state();expect(look.yaw).toBeCloseTo(-.064,8);expect(look.pitch).toBeCloseTo(-.067,8);
 await page.keyboard.down('ShiftLeft');await page.keyboard.press('Escape');expect((await state()).speed).toBe(1.8);await page.keyboard.up('ShiftLeft');
 await page.evaluate(()=>{(window as any).__mall.reset();});
 await page.waitForTimeout(500);const balanced=await state();
 expect(balanced.occlusion).toBe(true);expect(balanced.reflections).toBe(true);
 await page.locator('#sound-settings').click();await page.locator('#quality').selectOption('performance');
 await expect.poll(async()=>(await state()).renderWidth).toBe(960);
 const performance=await state();expect(performance.renderHeight).toBe(600);
 expect(performance.occlusion).toBe(false);expect(performance.reflections).toBe(false);expect(performance.calls).toBeLessThan(balanced.calls);
 await page.locator('#close-settings').click();await page.locator('#enter').click();
 await page.screenshot({path:'docs/screenshots/stage-5-performance.jpg',quality:85});
 await page.keyboard.press('Escape');await page.locator('#sound-settings').click();await page.locator('#quality').selectOption('high');
 await expect.poll(async()=>(await state()).occlusion).toBe(true);expect((await state()).reflections).toBe(true);
 await page.locator('#quality').selectOption('balanced');await page.locator('#close-settings').click();await page.locator('#enter').click();
 await page.screenshot({path:'docs/screenshots/stage-5-balanced.jpg',quality:85});
 await page.keyboard.press('Escape');await page.locator('#sound-settings').click();await page.locator('#quality').selectOption('performance');
 await page.reload();await expect(page.locator('#enter')).toBeEnabled({timeout:90000});expect((await state()).settings.quality).toBe('performance');
 expect(errors).toEqual([]);
 const metrics=(s:any)=>({calls:s.calls,triangles:s.triangles,width:s.renderWidth,height:s.renderHeight,occlusion:s.occlusion,reflections:s.reflections});
 await writeFile('docs/stage-5-performance.json',JSON.stringify({browser:'Edge headless / SwiftShader (not a hardware FPS benchmark)',idleRedraws:idleAfter.frames-idleBefore.frames,walk:1.8,sprint:4.5,lookRadiansPerPixel:.0016,balanced:metrics(balanced),performance:metrics(performance),errors},null,2)+'\n');
});
