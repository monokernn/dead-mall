import {test,expect,type Page} from '@playwright/test';
async function open(page:Page){await page.goto('/?test');await expect(page.locator('#enter')).toBeEnabled({timeout:90000});}
const state=(page:Page)=>page.evaluate(()=>(window as any).__mall.state());
async function enter(page:Page){await page.locator('#enter').click();await expect(page.locator('#overlay')).toBeHidden();}
async function aim(page:Page,route:number[][],target:number[]){
 await page.evaluate(({route,target})=>{
  const m=(window as any).__mall;
  for(const [x,z] of route){const p=m.state();const next=m.move(x-p.x,z-p.z);if(Math.hypot(next.x-x,next.z-z)>.15)throw new Error(`Blocked route to ${x}, ${z}`);}
  const p=m.state(),dx=target[0]-p.x,dy=target[1]-(p.y+1.65),dz=target[2]-p.z;
  m.look(Math.atan2(-dx,-dz),Math.atan2(dy,Math.hypot(dx,dz)));
 },{route,target});
}

test('six notes can be reached and read; escaping never leaves walking active',async({page})=>{
 test.setTimeout(180000);await open(page);await enter(page);
 const items=[
  {id:'fall-poster',route:[[5.5,19]],target:[5.5,2,21.59],title:'Fall into something wonderful.'},
  {id:'fountain-notice',route:[[0,19],[0,9.3]],target:[0,.51,7.29],title:'Pardon our appearance.'},
  {id:'relocation',route:[[0,19],[-17.2,19],[-17.2,18.3]],target:[-19.25,2.1,18.3],title:'We have moved.'},
  {id:'tokens',route:[[-16,18.3],[-16,7],[-27.6,7]],target:[-29.93,2.1,7],title:'Four tokens for one dollar.'},
  {id:'renovation',route:[[-24,7],[-24,-1],[-16,-1],[1.55,-1],[1.55,-15],[-18.7,-15],[-18.7,-19.8]],target:[-18.7,6.9,-21.94],title:'Good things are on the way.'},
  {id:'closing-note',route:[[-18.7,-15],[1.55,-15],[1.55,-1],[16,-1],[16,10.9],[25.8,10.9]],target:[27.74,2.2,10.9],title:'Before you leave.'},
 ];
 for(const item of items){
  await aim(page,item.route,item.target);
  await expect.poll(async()=>(await state(page)).interaction,{timeout:15000}).toBe(item.id);
  await page.keyboard.press('KeyE');await expect(page.locator('#reading-dialog')).toBeVisible();
  await expect(page.locator('#reading-title')).toHaveText(item.title);expect((await state(page)).active).toBe(false);
  if(item.id==='fountain-notice')await page.screenshot({path:'.runtime/reading-panel.jpg',quality:85});
  if(item.id==='fall-poster'){await page.locator('#close-reading').click();await expect(page.locator('#reading-dialog')).not.toBeVisible();await expect(page.locator('#overlay')).toBeHidden();}
  else{await page.keyboard.press('Escape');await expect(page.locator('#reading-dialog')).not.toBeVisible();await expect(page.locator('#overlay')).toBeVisible();await enter(page);}
 }
 await page.keyboard.press('Escape');expect((await state(page)).reading).toBe(false);
});

test('arcade and locked door respond without objectives or movement through the door',async({page})=>{
 await open(page);await enter(page);
 await aim(page,[[8,19],[8,-1],[-16,-1],[-24,-1],[-25.3,1]],[-27.16,1.05,1]);
 await expect.poll(async()=>(await state(page)).interaction,{timeout:15000}).toBe('arcade');
 await page.keyboard.press('KeyE');await expect(page.locator('#feedback')).toContainText('NO CREDIT');expect((await state(page)).audio.effect).toBe('arcade');
 await aim(page,[[-24,1],[-16,1],[-16,19],[16,19],[16,10.7],[25.8,10.7]],[27.73,1.04,10.52]);
 await expect.poll(async()=>(await state(page)).interaction,{timeout:15000}).toBe('staff-door');
 const before=await state(page);await page.keyboard.press('KeyE');await expect(page.locator('#feedback')).toContainText('LOCKED');
 const after=await state(page);expect(after.audio.effect).toBe('door');expect(after.x).toBe(before.x);expect(after.z).toBe(before.z);
});

test('audio starts on entry, produces a signal, pauses, mutes, and saves preferences',async({page})=>{
 test.setTimeout(150000);await open(page);expect((await state(page)).audio.state).toBe('uninitialized');
 // This checks audio, so use the low-cost graphics preset on the software-rendered test browser.
 // Balanced graphics, walking and sprinting are exercised separately in the visual/control scenarios.
 await page.locator('#sound-settings').click();await page.locator('#quality').selectOption('performance');await page.locator('#close-settings').click();await enter(page);
 await expect.poll(async()=>(await state(page)).audio.state,{timeout:15000}).toBe('running');
 await expect.poll(async()=>(await state(page)).audio.rms,{timeout:15000}).toBeGreaterThan(.00001);
 await page.keyboard.down('KeyW');await expect.poll(async()=>(await state(page)).audio.steps,{timeout:20000}).toBeGreaterThan(0);await page.keyboard.up('KeyW');
 expect((await state(page)).audio.surface).toBe('tile');
 await page.keyboard.press('Escape');await expect.poll(async()=>(await state(page)).audio.state).toBe('suspended');
 await page.locator('#sound-settings').click();await expect(page.locator('#settings-dialog')).toBeVisible();
 await page.locator('#muted').check();await page.locator('#music').uncheck();
 await page.locator('#volume').fill('27');await page.locator('#sensitivity').fill('1.4');await page.locator('#steady-lighting').uncheck();
 await page.screenshot({path:'.runtime/settings-panel.jpg',quality:85});
 await page.keyboard.press('Escape');await expect(page.locator('#sound-settings')).toBeFocused();await enter(page);
 await expect.poll(async()=>(await state(page)).audio.rms,{timeout:10000}).toBeLessThan(.000001);
 const saved=(await state(page)).settings;expect(saved).toEqual({volume:.27,music:false,muted:true,sensitivity:1.4,steadyLighting:false,quality:'performance'});
 await page.reload();await expect(page.locator('#enter')).toBeEnabled({timeout:90000});expect((await state(page)).settings).toEqual(saved);
 expect((await state(page)).audio.state).toBe('uninitialized');
});