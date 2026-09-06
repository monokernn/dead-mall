import { renderPixelRatio, graphicsProfiles } from '../src/graphics.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSettings, defaults } from '../src/settings.ts';
import { walkingSurface } from '../src/audio.ts';
import { interactions, pickInteraction } from '../src/interactions.ts';

test('invalid persisted preferences fall back safely; numeric values stay bounded',()=>{
 assert.deepEqual(sanitizeSettings(null),defaults);
 assert.deepEqual(sanitizeSettings({volume:Infinity,sensitivity:'fast',music:'yes',muted:null}),defaults);
 assert.deepEqual(sanitizeSettings({volume:-1,sensitivity:30,music:false,muted:true,steadyLighting:false}),{volume:0,sensitivity:2,music:false,muted:true,steadyLighting:false,quality:'balanced'});
});
test('footsteps select carpet, escalator metal and upper-floor tile',()=>{
 assert.equal(walkingSurface({x:-25,y:0,z:1}),'carpet');
 assert.equal(walkingSurface({x:1.55,y:2.4,z:-8}),'metal');
 assert.equal(walkingSurface({x:5,y:4.8,z:-15}),'tile');
 assert.equal(walkingSurface({x:0,y:0,z:10}),'tile');
});
test('a nearby front-facing readable can be selected',()=>{
 const item=interactions.find(item=>item.id==='fall-poster')!;
 assert.equal(pickInteraction({x:5.5,y:2,z:19.59},{x:0,y:0,z:1})?.id,item.id);
});
test('interaction rejects distance, looking away, back faces and occlusion',()=>{
 assert.equal(pickInteraction({x:5.5,y:2,z:17},{x:0,y:0,z:1}),undefined);
 assert.equal(pickInteraction({x:5.5,y:2,z:19.59},{x:0,y:0,z:-1}),undefined);
 assert.equal(pickInteraction({x:5.5,y:2,z:23},{x:0,y:0,z:-1}),undefined);
 assert.equal(pickInteraction({x:5.5,y:2,z:19.59},{x:0,y:0,z:1},()=>false),undefined);
});
test('the narrative contains six readables and two optional responses, all in English',()=>{
 assert.equal(interactions.filter(item=>item.kind==='read').length,6);
 assert.equal(interactions.filter(item=>item.kind!=='read').length,2);
 assert.equal(new Set(interactions.map(item=>item.id)).size,8);
 assert.doesNotMatch(JSON.stringify(interactions),/[\u0400-\u04ff]/u);
});
test('graphics preferences migrate safely and drawing buffers stay within each pixel budget',()=>{
 assert.equal(sanitizeSettings({quality:'ultra'}).quality,'balanced');
 assert.equal(sanitizeSettings({quality:'performance'}).quality,'performance');
 assert.equal(sanitizeSettings({quality:'high'}).quality,'high');
 for(const quality of ['balanced','high','performance'] as const){
  for(const [width,height,dpr] of [[1440,900,1],[3840,2160,2],[960,600,1],[0,0,1]]){
   const ratio=renderPixelRatio(width,height,dpr,quality);
   assert.ok(Number.isFinite(ratio)&&ratio>0&&ratio<=dpr);
   assert.ok(width*height*ratio*ratio<=graphicsProfiles[quality].pixels+1e-6);
  }
 }
 assert.equal(renderPixelRatio(1440,900,1,'balanced'),1);
});
