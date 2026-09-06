import * as THREE from 'three';
import { NORTH_GALLERY_SEGMENTS } from './movement.ts';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MallAssets } from './assets.ts';
import { physicalBox } from './details.ts';
import { random } from './art.ts';

export function decayDetails(scene:THREE.Scene,assets:MallAssets){
  const rng=random(91004);
  const ceiling=assets.material('peeling_painted_wall',.7,.7,0x9b9f93);
  const frame=assets.material('plastered_wall_04',.7,.7,0x575d55);
  const ceilingGeometry=physicalBox(1,.025,1);
  const railGeometry=new THREE.BoxGeometry(1,1,1);
  function suspendedCeiling(x:number,z:number,w:number,d:number,y:number){
    const nx=Math.ceil(w/1.2),nz=Math.ceil(d/1.2),cw=w/nx,cd=d/nz;
    const panels=new THREE.InstancedMesh(ceilingGeometry,ceiling,nx*nz),matrix=new THREE.Object3D(),tint=new THREE.Color();let count=0;
    for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
      if(rng()<.12)continue;
      matrix.position.set(x-w/2+(ix+.5)*cw,y,z-d/2+(iz+.5)*cd);
      matrix.rotation.set(0,0,0);
      if(rng()<.045){matrix.position.y-=.08;matrix.rotation.z=(rng()-.5)*.16;}
      matrix.scale.set(cw-.025,1,cd-.025);matrix.updateMatrix();panels.setMatrixAt(count,matrix.matrix);
      tint.setScalar(.65+rng()*.35);panels.setColorAt(count,tint);count++;
    }
    panels.count=count;panels.receiveShadow=true;panels.computeBoundingSphere();scene.add(panels);
    const grid=new THREE.InstancedMesh(railGeometry,frame,nx+nz+2);count=0;
    for(let ix=0;ix<=nx;ix++){matrix.position.set(x-w/2+ix*cw,y-.021,z);matrix.rotation.set(0,0,0);matrix.scale.set(.019,.028,d);matrix.updateMatrix();grid.setMatrixAt(count++,matrix.matrix);}
    for(let iz=0;iz<=nz;iz++){matrix.position.set(x,y-.021,z-d/2+iz*cd);matrix.scale.set(w,.028,.019);matrix.updateMatrix();grid.setMatrixAt(count++,matrix.matrix);}
    grid.receiveShadow=true;grid.computeBoundingSphere();scene.add(grid);
  }
  // The slabs above these panels remain solid; missing tiles reveal a dark ceiling cavity.
  for(const [x,z,w,d] of [[-16,0,8,44],[16,0,8,44],[0,16,24,12],[0,-17.5,24,9],...NORTH_GALLERY_SEGMENTS.map(([x,w])=>[x,-11.5,w,3])])suspendedCeiling(x,z,w,d,4.45);
  for(const [x,z,w,d] of [[-23,0,18,44],[23,0,18,44],[0,16,28,12],[0,-16,28,12]])suspendedCeiling(x,z,w,d,9.85);

  // A shared transparent stain texture adds gravity-driven runoff at actual architectural joints.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d')!;
  for(let i=0;i<190;i++){
    const x=rng()*512,length=40+Math.pow(rng(),2)*460,width=1+rng()*16;
    const gradient=ctx.createLinearGradient(0,0,0,length);gradient.addColorStop(0,'rgba(34,38,22,.7)');gradient.addColorStop(.35,'rgba(47,44,29,.34)');gradient.addColorStop(1,'rgba(45,41,25,0)');
    ctx.fillStyle=gradient;ctx.fillRect(x,0,width,length);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const stainMaterial=new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1});
  const stains:THREE.BufferGeometry[]=[];
  function leak(x:number,y:number,z:number,w:number,h:number,rotation=0){
    const geometry=new THREE.PlaneGeometry(w,h);geometry.rotateY(rotation);geometry.translate(x,y,z);stains.push(geometry);
  }
  for(const x of [-12.8,12.8])for(const z of [-14,0,14]){
    leak(x,7.6,z+.431,.85,4.2);leak(x,2.8,z+.431,.85,3.7);
    leak(x+(x<0?.431:-.431),6.8,z,.85,5.6,x<0?Math.PI/2:-Math.PI/2);
  }
  for(let z=-19;z<=19;z+=5.8){leak(-19.991,7.55,z,3.8,4.6,Math.PI/2);leak(19.991,7.55,z,3.8,4.6,-Math.PI/2);}
  for(const x of [-11.898,11.898])for(let z=-8;z<10;z+=4)leak(x,4.51,z,3.8,.58,x<0?Math.PI/2:-Math.PI/2);
  for(let x=-9;x<=9;x+=3.8)leak(x,4.51,10.103,3.8,.58);
  const stainGeometry=mergeGeometries(stains)!;stains.forEach(g=>g.dispose());scene.add(new THREE.Mesh(stainGeometry,stainMaterial));

  // Flat, irregular shards and a few larger broken ceiling pieces sit on real floor levels.
  const materials=[assets.material('plastered_wall_04',1,1,0x9c9a8c),assets.material('blue_floor_tiles_01',1,1,0x737e7b),assets.material('metal_plate_02',1,1,0x645d4b,.45)];
  const shardShape=new THREE.Shape();shardShape.moveTo(-.9,-.55);shardShape.lineTo(.35,-.8);shardShape.lineTo(.85,.4);shardShape.lineTo(-.15,.9);shardShape.lineTo(-.8,.25);shardShape.closePath();
  const shard=new THREE.ExtrudeGeometry(shardShape,{depth:1,bevelEnabled:false,steps:1});shard.rotateX(-Math.PI/2);shard.translate(0,-.5,0);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let batch=0;batch<3;batch++){
    const count=batch===0?640:batch===1?240:110,mesh=new THREE.InstancedMesh(shard,materials[batch],count);
    for(let i=0;i<count;i++){
      let x:number,z:number,y=0;const distribution=rng();
      if(distribution<.4){x=(rng()<.5?-1:1)*(17.7+rng()*1.85);z=-21+rng()*42;}
      else if(distribution<.73){const angle=[.5,2.5,4.8][Math.floor(rng()*3)]+(rng()-.5)*.65,r=3.55+rng()*1.2;x=Math.cos(angle)*r;z=4+Math.sin(angle)*r;}
      else if(distribution<.9){const angle=rng()*Math.PI*2,r=.85+rng()*1.9;x=Math.cos(angle)*r;z=4+Math.sin(angle)*r;y=.28;}
      else{x=-11+rng()*22;z=-19+rng()*39;}
      const size=.025+Math.pow(rng(),2)*.23;
      dummy.position.set(x,y+.015+size*.07,z);dummy.rotation.set((rng()-.5)*.2,rng()*6.28,(rng()-.5)*.2);dummy.scale.set(size,.012+rng()*.022,size*(.4+rng()*.8));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      color.setScalar(.5+rng()*.5);mesh.setColorAt(i,color);
    }
    mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();scene.add(mesh);
  }
  // Dry foliage: thin bowed stems and curled blades, sharing two draw calls.
  const stems:THREE.BufferGeometry[]=[],leaves:THREE.BufferGeometry[]=[];
  for(const x of [-9,9])for(let i=0;i<20;i++){
    const a=rng()*Math.PI*2,reach=.3+rng()*.65,tip=new THREE.Vector3(x+Math.cos(a)*reach,.85+rng()*.55,8+Math.sin(a)*reach);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.77,8),new THREE.Vector3(x+Math.cos(a)*reach*.3,1.45+rng()*.55,8+Math.sin(a)*reach*.3),tip]);
    stems.push(new THREE.TubeGeometry(curve,8,.006,3,false));
    for(let j=2;j<8;j++){
      const p=curve.getPoint(j/8),side=j%2?1:-1,geometry=new THREE.PlaneGeometry(.025,.19,1,3),pos=geometry.attributes.position;
      for(let k=0;k<pos.count;k++){const y=pos.getY(k);pos.setX(k,pos.getX(k)*(1-Math.abs(y)/.11));pos.setZ(k,Math.sin(y*18)*.025);}
      geometry.computeVertexNormals();geometry.rotateZ(side*.9);geometry.rotateY(-a);geometry.translate(p.x,p.y,p.z);leaves.push(geometry);
    }
  }
  const stemMesh=new THREE.Mesh(mergeGeometries(stems)!,new THREE.MeshStandardMaterial({color:0x4b422b,roughness:1}));scene.add(stemMesh);
  const leafMesh=new THREE.Mesh(mergeGeometries(leaves)!,new THREE.MeshStandardMaterial({color:0x665e3c,roughness:1,side:THREE.DoubleSide}));scene.add(leafMesh);stems.concat(leaves).forEach(g=>g.dispose());

  // One low-resolution reflected view, masked to sparse damp patches rather than a mirror floor.
  const reflector=new Reflector(new THREE.PlaneGeometry(40,44),{textureWidth:512,textureHeight:512,multisample:0,clipBias:.004,color:0x9ca8a7});
  const waterMaterial=reflector.material as THREE.ShaderMaterial;
  reflector.rotation.x=-Math.PI/2;reflector.position.y=.022;waterMaterial.transparent=true;waterMaterial.depthWrite=false;
  waterMaterial.vertexShader=waterMaterial.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec3 vWorld;').replace('vUv = textureMatrix','vWorld = (modelMatrix * vec4(position,1.0)).xyz; vUv = textureMatrix');
  waterMaterial.fragmentShader=waterMaterial.fragmentShader.replace('varying vec4 vUv;',`varying vec4 vUv; varying vec3 vWorld;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){return noise(p)*.55+noise(p*2.1)*.3+noise(p*4.2)*.15;}`)
    .replace('vec4 base = texture2DProj( tDiffuse, vUv );',`float wet=smoothstep(.55,.69,fbm(vWorld.xz*.52));
      wet*=1.0-smoothstep(13.0,20.0,length(vWorld.xz*vec2(.8,1.0)));
      if(wet<.015)discard;
      vec2 reflectionUv=vUv.xy/vUv.w;reflectionUv+=vec2(noise(vWorld.xz*5.0)-.5)*.0014;
      vec4 base=texture2D(tDiffuse,reflectionUv)*.5;
      base+=(texture2D(tDiffuse,reflectionUv+vec2(.0016,0))+texture2D(tDiffuse,reflectionUv-vec2(.0016,0))+texture2D(tDiffuse,reflectionUv+vec2(0,.0016))+texture2D(tDiffuse,reflectionUv-vec2(0,.0016)))*.125;`)
    .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float fresnel=pow(1.0-abs(normalize(cameraPosition-vWorld).y),3.0);
      gl_FragColor=vec4(base.rgb*.85,wet*(.1+.38*fresnel));`);
  // SSAO hides transparent objects before its depth pass, so reflections are rendered only with the beauty view.
  reflector.name='floor-reflection';scene.add(reflector);
  return {shards:990,reflectionResolution:512};
}