import * as THREE from 'three';
import { graphicsProfiles, type GraphicsQuality } from './graphics.ts';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export function createPostprocessing(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.PerspectiveCamera){
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const ao=new SSAOPass(scene,camera,innerWidth/2,innerHeight/2,12);
  ao.kernelRadius=.55;ao.minDistance=.001;ao.maxDistance=.075;
  // Keep occlusion buffers at half resolution, including after composer resizing.
  const resizeAO=ao.setSize.bind(ao);
  ao.setSize=(width:number,height:number)=>resizeAO(Math.max(1,Math.floor(width/2)),Math.max(1,Math.floor(height/2)));
  // Transparent glass and floor decals must not become solid AO occluders.
  const transparent:THREE.Object3D[]=[];
  scene.traverse(object=>{if(object instanceof THREE.Mesh&&[object.material].flat().some(m=>m.transparent))transparent.push(object);});
  const renderAO=ao.render.bind(ao);
  ao.render=(...args:Parameters<typeof ao.render>)=>{
    const visible=transparent.filter(object=>object.visible);
    visible.forEach(object=>object.visible=false);
    try{renderAO(...args);}finally{visible.forEach(object=>object.visible=true);}
  };
  composer.addPass(ao);
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.16,.4,1.05);
  composer.addPass(bloom);composer.addPass(new OutputPass());composer.addPass(new SMAAPass());
  const finish=new ShaderPass({
    uniforms:{tDiffuse:{value:null}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){
        vec3 color=texture2D(tDiffuse,vUv).rgb;
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
        float edge=smoothstep(.22,.78,distance(vUv,vec2(.5,.48)));
        float luminance=dot(color,vec3(.2126,.7152,.0722));
        color=mix(vec3(luminance),color,.78);
        color=mix(color*vec3(.94,1.0,1.015),color,smoothstep(.15,.65,luminance));
        color=color*(1.0-edge*.16)+grain*.008;
        gl_FragColor=vec4(color,1.0);
      }`
  });
  composer.addPass(finish);
  renderer.info.autoReset=false;
  let calls=0,triangles=0,frames=0;
  return {
    render(){frames++;renderer.info.reset();composer.render();calls=renderer.info.render.calls;triangles=renderer.info.render.triangles;},
    resize(){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);},
    quality(quality:GraphicsQuality){
      const profile=graphicsProfiles[quality];ao.enabled=profile.occlusion;
      const reflection=scene.getObjectByName('floor-reflection');if(reflection)reflection.visible=profile.reflections;
    },
    stats(){const size=renderer.getDrawingBufferSize(new THREE.Vector2());return {calls,triangles,frames,renderWidth:size.x,renderHeight:size.y,occlusion:ao.enabled,reflections:scene.getObjectByName('floor-reflection')?.visible??false};}
  };
}