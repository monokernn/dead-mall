import { test } from 'node:test';
import assert from 'node:assert/strict';
import { move, floorAt, obstacles, addObstacle, HEIGHT, SPAWN, ESCALATOR_CENTERS, SPEED, movementSpeed, movementDelta } from '../src/movement.ts';

test('spawn stands on the ground floor',()=>assert.equal(floorAt(SPAWN.x,SPAWN.z,SPAWN.y),0));
test('exterior boundary stops a large displacement',()=>{
 const p=move(SPAWN,100,0);assert.ok(p.x<19.74 && p.x>19.5);assert.equal(p.y,0);
});
test('both escalators connect floors smoothly in both directions',()=>{
 for(const x of ESCALATOR_CENTERS){
  let p={x,y:0,z:-2};
  for(let i=0;i<280;i++){const next=move(p,0,-.05);assert.ok(Math.abs(next.y-p.y)<.03);p=next;}
  assert.ok(Math.abs(p.z+16)<.01);assert.equal(p.y,HEIGHT);
  for(let i=0;i<280;i++)p=move(p,0,.05);
  assert.ok(Math.abs(p.z+2)<.01);assert.equal(p.y,0);
 }
});
test('balcony void cannot be entered from the upper floor',()=>{
 const p=move({x:15,y:HEIGHT,z:0},-12,0);
 assert.ok(p.x>=12.26);assert.equal(p.y,HEIGHT);
});
test('a ramp cannot be entered through its elevated side',()=>{
 const center=ESCALATOR_CENTERS[1];const p=move({x:center+3,y:0,z:-8},-3,0);assert.ok(p.x>center+1.05);assert.equal(p.y,0);
});
test('substeps prevent tunnelling and allow sliding along an obstacle',()=>{
 const before=obstacles.length;
 try {
  addObstacle(5,15,.2,5,0,3);
  const p=move({x:3,y:0,z:15},10,2);
  assert.ok(p.x<4.65);assert.ok(p.z>16.8);
 }finally{obstacles.length=before;}
});
test('the full upper ring has continuous walking surfaces',()=>{
 let p={x:-16,y:HEIGHT,z:-16};
 for(const [x,z] of [[-16,16],[16,16],[16,-16],[-16,-16]]){
  p=move(p,x-p.x,z-p.z);assert.ok(Math.abs(p.x-x)<.01 && Math.abs(p.z-z)<.01);assert.equal(p.y,HEIGHT);
 }
});

test('either Shift runs at exactly 2.5 times walk speed without a diagonal boost',()=>{
 const walk=movementSpeed(new Set<string>());
 assert.equal(walk,SPEED);
 for(const shift of ['ShiftLeft','ShiftRight']){
  const sprint=movementSpeed(new Set([shift]));assert.equal(sprint,walk*2.5);
  for(const [forward,side] of [[1,0],[0,-1],[1,1],[-1,1]]){
   const delta=movementDelta(forward,side,.7,.05,sprint);
   assert.ok(Math.abs(Math.hypot(delta.x,delta.z)-sprint*.05)<1e-12);
  }
 }
 const keys=new Set(['ShiftLeft','ShiftRight']);keys.delete('ShiftLeft');assert.equal(movementSpeed(keys),4.5);
 keys.clear();assert.equal(movementSpeed(keys),1.8);
 assert.deepEqual(movementDelta(0,0,0,.05,4.5),{x:0,z:0});
});
test('sprinting crosses both ramps smoothly and cannot tunnel through a wall',()=>{
 for(const x of ESCALATOR_CENTERS){
  let p={x,y:0,z:-2};
  for(let i=0;i<65;i++){const next=move(p,0,-4.5*.05);assert.ok(Math.abs(next.y-p.y)<.12);p=next;}
  assert.equal(p.y,HEIGHT);
  for(let i=0;i<65;i++)p=move(p,0,4.5*.05);
  assert.equal(p.y,0);assert.ok(Math.abs(p.z+2)<1e-8);
 }
 const wall={x1:7,x2:7.1,z1:17,z2:20,bottom:0,top:3};obstacles.push(wall);
 try{let p={...SPAWN};for(let i=0;i<90;i++)p=move(p,4.5*.05,0);assert.ok(p.x<6.74);}finally{obstacles.splice(obstacles.indexOf(wall),1);}
});
