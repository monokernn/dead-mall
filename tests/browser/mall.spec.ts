import { test, expect, type Page } from '@playwright/test';
async function open(page:Page){
 await page.goto('/?test');await expect(page.locator('#enter')).toBeEnabled({timeout:90000});
}
async function state(page:Page){return page.evaluate(()=>(window as any).__mall.state());}
async function waypoint(page:Page,x:number,z:number){
 const p=await page.evaluate(({x,z})=>{const m=(window as any).__mall;const p=m.state();return m.move(x-p.x,z-p.z);},{x,z});
 expect(p.x).toBeCloseTo(x,1);expect(p.z).toBeCloseTo(z,1);return p;
}
test('renders a scene and enters, walks, pauses, and resets',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',response=>{if(response.url().includes('/assets/1k/')&&!response.ok())errors.push(`${response.status()} ${response.url()}`);});
 await open(page);
 await page.screenshot({path:'.runtime/entrance.jpg',quality:85});
 const initial=await state(page);
 expect(initial.triangles).toBeGreaterThan(10000);
 expect(initial.materials).toBe(7);expect(initial.models).toBe(7);expect(initial.environment).toBe(true);
 expect(await page.locator('html').getAttribute('lang')).toBe('en');
 expect(await page.title()).toBe('Meridian, 2004');
 expect((await state(page)).text.join(' ')).not.toMatch(/[\u0400-\u04ff]/u);
 await page.locator('#enter').click();await expect(page.locator('#overlay')).toBeHidden();
 await page.keyboard.down('KeyW');await expect.poll(async()=>(await state(page)).z,{timeout:15000}).toBeLessThan(18.7);await page.keyboard.up('KeyW');
 expect((await state(page)).z).toBeLessThan(18.9);
 await page.mouse.move(820,420);await page.screenshot({path:'.runtime/atrium.jpg',quality:85});
 await page.keyboard.press('Escape');await expect(page.locator('#overlay')).toBeVisible();
 const paused=await state(page);await page.keyboard.down('KeyW');await page.waitForTimeout(150);await page.keyboard.up('KeyW');
 expect((await state(page)).z).toBe(paused.z);
 await page.locator('#reset').click();expect((await state(page)).z).toBe(19);
 expect(errors).toEqual([]);
});
test('complete real-scene route through both floors and side rooms',async({page})=>{
 await open(page);
 for(const [x,z] of [[8,19],[8,-1],[1.55,-1],[1.55,-15]])await waypoint(page,x,z);
 expect((await state(page)).y).toBeCloseTo(4.8);
 await waypoint(page,1.55,-14.5);
 await page.evaluate(()=>(window as any).__mall.look(.4,-.08));
 await page.locator('#overlay').evaluate(el=>(el as HTMLElement).hidden=true);
 await page.screenshot({path:'.runtime/foodcourt.jpg',quality:85});
 for(const [x,z] of [[1.55,-15],[-16,-15],[-16,16],[16,16],[16,-15],[-1.55,-15]])await waypoint(page,x,z);
 await page.evaluate(()=>(window as any).__mall.look(Math.PI));
 await page.screenshot({path:'.runtime/balcony.jpg',quality:85});
 await waypoint(page,-1.55,-1);expect((await state(page)).y).toBeCloseTo(0);
 for(const [x,z] of [[-16,-1],[-24,-1]])await waypoint(page,x,z);
 expect((await state(page)).zone).toBe('Orbit Amusements');
 await page.evaluate(()=>(window as any).__mall.look(Math.PI/2,-.03));await page.screenshot({path:'.runtime/arcade.jpg',quality:85});
 for(const [x,z] of [[-16,-1],[-16,19],[16,19],[16,8],[24,8]])await waypoint(page,x,z);
 expect((await state(page)).zone).toBe('Photo booth');
 await page.evaluate(()=>(window as any).__mall.look(-Math.PI/2,-.03));await page.screenshot({path:'.runtime/photo-booth.jpg',quality:85});
 for(const [x,z] of [[16,8],[16,19],[0,19]])await waypoint(page,x,z);
 expect((await state(page)).zone).toBe('Main entrance');
});
test('fountain, shop masses and balcony rails stop the player',async({page})=>{
 await open(page);
 await waypoint(page,0,12);
 const blocked=await page.evaluate(()=>(window as any).__mall.move(0,-10));
 expect(blocked.z).toBeGreaterThan(7.6);
 await page.evaluate(()=>(window as any).__mall.reset());
 await waypoint(page,16,19);
 const shop=await page.evaluate(()=>(window as any).__mall.move(10,0));expect(shop.x).toBeLessThan(20);
 await page.evaluate(()=>(window as any).__mall.reset());
 for(const [x,z] of [[8,19],[8,-1],[1.55,-1],[1.55,-15],[16,-15],[16,0]])await waypoint(page,x,z);
 const rail=await page.evaluate(()=>(window as any).__mall.move(-10,0));
 expect(rail.x).toBeGreaterThan(12);expect(rail.y).toBeCloseTo(4.8);
});
test('menu remains usable in a smaller desktop window',async({page})=>{
 await page.setViewportSize({width:960,height:600});await open(page);
 await expect(page.locator('#enter')).toBeInViewport();
 await expect(page.locator('.footer')).toBeInViewport();
 const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
 expect(dimensions.width).toBe(dimensions.viewport);
 await page.locator('#sound-settings').click();await expect(page.locator('#settings-title')).toBeInViewport();
 await page.locator('#close-settings').scrollIntoViewIfNeeded();await expect(page.locator('#close-settings')).toBeInViewport();
 await page.locator('#close-settings').click();await expect(page.locator('#sound-settings')).toBeFocused();
});


test('failed asset loading keeps entry disabled and gives a recovery message',async({page})=>{
 await page.route('**/assets/1k/manifest.json',route=>route.fulfill({status:503,body:'Unavailable'}));
 await page.goto('/?test');
 await expect(page.locator('#enter-label')).toHaveText('Unable to load the mall');
 await expect(page.locator('#enter')).toBeDisabled();
 await expect(page.locator('#status')).toContainText('reload to try again');
});
