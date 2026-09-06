import * as THREE from 'three';
import { MallAudio } from './audio.ts';
import { loadSettings, saveSettings } from './settings.ts';
import { renderPixelRatio } from './graphics.ts';
import { interactions, pickInteraction, type Interaction } from './interactions.ts';
import { MallAssets } from './assets.ts';
import { createPostprocessing } from './postprocessing.ts';
import { buildMall } from './scene.ts';
import { move, zone, SPAWN, movementSpeed, movementDelta, LOOK_SENSITIVITY, type Position } from './movement.ts';

const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const overlay=document.querySelector<HTMLElement>('#overlay')!;
const hud=document.querySelector<HTMLElement>('#hud')!;
const enter=document.querySelector<HTMLButtonElement>('#enter')!;
const enterLabel=document.querySelector<HTMLElement>('#enter-label')!;
const reset=document.querySelector<HTMLButtonElement>('#reset')!;
const status=document.querySelector<HTMLElement>('#status')!;
const zoneLabel=document.querySelector<HTMLElement>('#zone')!;
const floorLabel=document.querySelector<HTMLElement>('#floor')!;
let renderer: THREE.WebGLRenderer;
try {
  renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
  void start(renderer).catch(error=>{
    enterLabel.textContent='Unable to load the mall';
    status.textContent='Some scene files could not be loaded. Check your connection and reload to try again.';
    console.error(error);
  });
} catch(error) {
  enterLabel.textContent='Unable to open the mall';
  status.textContent='This walk needs WebGL 2 and hardware acceleration. Please update your browser and reload the page.';
  console.error(error);
}
async function start(renderer:THREE.WebGLRenderer) {
  const settings=loadSettings();
  renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio,settings.quality));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.01;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.08,110);
  camera.rotation.order='YXZ';
  const assets=new MallAssets();
  await assets.load(renderer,(loaded,total)=>{
    enterLabel.textContent=`Opening the doors… ${Math.round(loaded/total*100)}%`;
    status.textContent='Preparing the lights and materials. First visit may take a moment.';
  });
  const world=buildMall(scene,assets);
  const audio=new MallAudio(settings);
  const settingsButton=document.querySelector<HTMLButtonElement>('#sound-settings')!;
  const settingsDialog=document.querySelector<HTMLDialogElement>('#settings-dialog')!;
  const reading=document.querySelector<HTMLDialogElement>('#reading-dialog')!;
  const prompt=document.querySelector<HTMLElement>('#interaction-prompt')!;
  const feedback=document.querySelector<HTMLElement>('#feedback')!;
  const inputs={volume:document.querySelector<HTMLInputElement>('#volume')!,muted:document.querySelector<HTMLInputElement>('#muted')!,
    music:document.querySelector<HTMLInputElement>('#music')!,sensitivity:document.querySelector<HTMLInputElement>('#sensitivity')!,steady:document.querySelector<HTMLInputElement>('#steady-lighting')!,quality:document.querySelector<HTMLSelectElement>('#quality')!};
  const audioNote=document.querySelector<HTMLElement>('#audio-note')!;
  function refreshSettings(){
    inputs.volume.value=String(Math.round(settings.volume*100));inputs.muted.checked=settings.muted;inputs.music.checked=settings.music;
    inputs.sensitivity.value=String(settings.sensitivity);inputs.steady.checked=settings.steadyLighting;inputs.quality.value=settings.quality;
    document.querySelector('#volume-value')!.textContent=`${Math.round(settings.volume*100)}%`;
    document.querySelector('#sensitivity-value')!.textContent=`${settings.sensitivity.toFixed(1)}×`;
  }
  refreshSettings();
  for(const input of Object.values(inputs))input.addEventListener('input',()=>{
    settings.volume=Number(inputs.volume.value)/100;settings.muted=inputs.muted.checked;settings.music=inputs.music.checked;
    settings.sensitivity=Number(inputs.sensitivity.value);settings.steadyLighting=inputs.steady.checked;
    const quality=inputs.quality.value;
    if(quality!==settings.quality){settings.quality=quality==='high'||quality==='performance'?quality:'balanced';resizeGraphics();}
    saveSettings(settings);audio.configure(settings);world.update(0,settings.steadyLighting);dirty=true;refreshSettings();
  });
  settingsButton.addEventListener('click',()=>{settingsDialog.showModal();document.querySelector<HTMLElement>('#settings-title')!.focus({preventScroll:true});settingsDialog.scrollTop=0;});
  function closeSettings(){settingsDialog.close();settingsButton.focus();}
  document.querySelector('#close-settings')!.addEventListener('click',closeSettings);
  settingsDialog.addEventListener('cancel',event=>{event.preventDefault();closeSettings();});
  let readingOpen=false,interaction:Interaction|undefined,feedbackUntil=0,lastInteraction=-Infinity;
  const raycaster=new THREE.Raycaster(),direction=new THREE.Vector3(),target=new THREE.Vector3();
  const occluders:THREE.Object3D[]=[];
  scene.traverse(object=>{if(object instanceof THREE.Mesh&&[object.material].flat().some(material=>!material.transparent))occluders.push(object);});
  function currentInteraction(){
    camera.getWorldDirection(direction);
    return pickInteraction(camera.position,direction,(item,distance)=>{
      target.set(...item.position).sub(camera.position).normalize();raycaster.set(camera.position,target);raycaster.far=distance-.08;
      return !raycaster.intersectObjects(occluders,false).some(hit=>{
        const mesh=hit.object as THREE.Mesh;
        return mesh.material&&[mesh.material].flat().some(material=>!material.transparent);
      });
    });
  }
  function updateInteraction(){
    const next=currentInteraction();prompt.hidden=!next;
    if(next&&next.id!==interaction?.id)prompt.querySelector('span')!.textContent=next.label;
    interaction=next;
  }
  function showReading(item:Interaction){
    readingOpen=true;active=false;keys.clear();audio.setActive(false);overlay.hidden=true;hud.hidden=true;
    document.querySelector('#reading-title')!.textContent=item.title;document.querySelector('#reading-byline')!.textContent=item.byline!;
    document.querySelector('#reading-body')!.replaceChildren(...item.paragraphs!.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
    if(document.pointerLockElement===canvas)document.exitPointerLock();reading.showModal();document.querySelector<HTMLElement>('#reading-title')!.focus({preventScroll:true});reading.scrollTop=0;
  }
  function closeReading(){readingOpen=false;reading.close();pause();}
  reading.addEventListener('cancel',event=>{event.preventDefault();closeReading();});
  document.querySelector('#close-reading')!.addEventListener('click',()=>{closeReading();void lock();});
  function interact(){
    if(!active)return;const item=currentInteraction();if(!item)return;
    if(item.kind==='read'){showReading(item);return;}
    if(performance.now()-lastInteraction<800)return;lastInteraction=performance.now();
    audio.effect(item.kind);world.react(item.kind);feedback.textContent=`${item.title} — ${item.paragraphs![0]}`;
    feedbackUntil=performance.now()+3500;feedback.hidden=false;
  }
  const post=createPostprocessing(renderer,scene,camera);post.quality(settings.quality);post.resize();
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  let position:Position={...SPAWN},yaw=0,pitch=-.035,active=false,visited=false,requesting=false;
  const keys=new Set<string>();
  let dirty=true,promptDirty=true,audioPoseDirty=true;
  function updateCamera(){
    if(camera.position.x===position.x&&camera.position.y===position.y+1.65&&camera.position.z===position.z&&camera.rotation.x===pitch&&camera.rotation.y===yaw)return false;
    dirty=true;promptDirty=true;audioPoseDirty=true;
    camera.position.set(position.x,position.y+1.65,position.z);
    camera.rotation.set(pitch,yaw,0);
    const location=zone(position),floor=position.y>4.6?'LEVEL 2':position.y>.2?'BETWEEN LEVELS':'LEVEL 1';
    if(zoneLabel.textContent!==location)zoneLabel.textContent=location;
    if(floorLabel.textContent!==floor)floorLabel.textContent=floor;
    return true;
  }
  function pause(){
    active=false;keys.clear();audio.setActive(false);prompt.hidden=true;feedback.hidden=true;overlay.hidden=readingOpen;hud.hidden=true;
    enterLabel.textContent=visited?'Continue exploring':'Enter Meridian';
    reset.hidden=!visited;
    document.querySelector('#eyebrow')!.textContent=visited?'TAKE A MOMENT':'AFTER HOURS';
  }
  async function lock(){
    if(requesting)return;
    requesting=true;status.textContent='';
    void audio.unlock().catch(()=>{audioNote.textContent='Sound is unavailable in this browser. You can still explore.';});
    try{await canvas.requestPointerLock();}
    catch {pause();status.textContent='Mouse control could not start. Try again, or open this page in a separate tab.';}
    finally{requesting=false;}
  }
  enter.addEventListener('click',lock);
  reset.addEventListener('click',()=>{position={...SPAWN};yaw=0;pitch=-.035;updateCamera();status.textContent='You are back at the main entrance.';});
  document.addEventListener('pointerlockchange',()=>{
    active=document.pointerLockElement===canvas;
    keys.clear();
    if(active){visited=true;overlay.hidden=true;hud.hidden=false;status.textContent='';audio.setActive(true);audioPoseDirty=true;updateInteraction();}
    else pause();
  });
  document.addEventListener('pointerlockerror',()=>{status.textContent='Your browser blocked mouse control. Open this page in a separate tab and try again.';});
  document.addEventListener('mousemove',event=>{
    if(!active)return;
    yaw-=event.movementX*LOOK_SENSITIVITY*settings.sensitivity;pitch=Math.max(-1.35,Math.min(1.35,pitch-event.movementY*LOOK_SENSITIVITY*settings.sensitivity));
  });
  const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'];
  document.addEventListener('keydown',event=>{
    if(settingsDialog.open||reading.open)return;
    if(event.code==='Escape'){if(document.pointerLockElement===canvas)document.exitPointerLock();pause();return;}
    if(!active)return;
    if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interact();return;}
    if(movementKeys.includes(event.code)){event.preventDefault();keys.add(event.code);}
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  function loseFocus(){keys.clear();if(document.pointerLockElement===canvas)document.exitPointerLock();pause();}
  window.addEventListener('blur',loseFocus);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
  function resizeGraphics(){
    dirty=true;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,devicePixelRatio,settings.quality));renderer.setSize(innerWidth,innerHeight);
    post.quality(settings.quality);post.resize();
  }
  window.addEventListener('resize',resizeGraphics);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();renderer.setAnimationLoop(null);loseFocus();enter.disabled=true;
    status.textContent='The graphics connection was lost. Reload the page to return to the mall.';
  });
  world.update(0,settings.steadyLighting);updateCamera();post.render();dirty=false;status.textContent='';
  enter.disabled=false;settingsButton.disabled=false;enterLabel.textContent='Enter Meridian';
  let last=performance.now(),lastPrompt=0;
  renderer.setAnimationLoop(now=>{
    const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;
    if(active){
      const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const delta=movementDelta(forward,side,yaw,dt,movementSpeed(keys));
      if(delta.x||delta.z){const before=position;position=move(position,delta.x,delta.z);audio.walk(before,position);}
      updateCamera();
      if(audioPoseDirty){audio.listener(position,yaw,pitch);audioPoseDirty=false;}
      if(world.update(dt,settings.steadyLighting))dirty=true;
      if(promptDirty&&now-lastPrompt>100){updateInteraction();lastPrompt=now;promptDirty=false;}
      if(now>feedbackUntil)feedback.hidden=true;
    }
    if(dirty){post.render();dirty=false;}
  });
  // Test controls exist only in the development server and never in the production build.
  if(import.meta.env.DEV && new URLSearchParams(location.search).has('test')){
    Object.assign(window,{__mall:{
      state:()=>({...position,active,speed:movementSpeed(keys),yaw,pitch,zone:zone(position),objects:world.objects,decay:world.decay,...post.stats(),materials:assets.maps.size,models:assets.models.size,environment:!!scene.environment,text:[...world.text,...interactions.flatMap(item=>[item.label,item.title,item.byline??'',...(item.paragraphs??[])])],audio:audio.debug(),settings:{...settings},interaction:interaction?.id??null,reading:readingOpen}),
      move:(dx:number,dz:number)=>{position=move(position,dx,dz);updateCamera();return {...position};},
      look:(nextYaw:number,nextPitch=0)=>{yaw=nextYaw;pitch=nextPitch;updateCamera();},
      reset:()=>{position={...SPAWN};yaw=0;pitch=-.035;updateCamera();}
    }});
  }
}
