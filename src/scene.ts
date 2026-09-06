import * as THREE from 'three';
import { addObstacle, HEIGHT, obstacles, ESCALATOR_CENTERS, NORTH_GALLERY_SEGMENTS } from './movement.ts';
import { signage, notice, fallPoster, directory, menu, arcadeScreen, clockFace, softShadow, scuffs, random, type Artwork } from './art.ts';

import { decayDetails } from './decay.ts';
import { MallAssets } from './assets.ts';
import { physicalBox, fountainRing, escalatorSide } from './details.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildMall(scene: THREE.Scene, assets:MallAssets) {
  obstacles.length=0;
  const text: string[]=[];
  let arcadeMaterial:THREE.MeshStandardMaterial|undefined;
  const liveTubes:THREE.MeshStandardMaterial[]=[];let responseTime=0,elapsed=0;
  const tileMap='floor_tiles_06', carpetMap='dirty_carpet';
  const wall=assets.material('peeling_painted_wall',.38,.38,0xc4c9c0);
  const pale=assets.material('plastered_wall_04',.6,.6,0xb0b7ac);
  const teal=assets.material('plastered_wall_04',.7,.7,0x424f48);
  const mauve=assets.material('plastered_wall_04',.7,.7,0x5b5550);
  const dark=assets.material('plastered_wall_04',.7,.7,0x252c2a);
  const metal=new THREE.MeshStandardMaterial({color:0x767e7b,roughness:.54,metalness:.85});
  const gold=new THREE.MeshStandardMaterial({color:0x74746a,roughness:.57,metalness:.75});
  const rust=assets.material('metal_plate_02',1,1,0x8e7e68,.85);
  const white=assets.material('plastered_wall_04',1,1,0xd3d3c3);
  const bulb=new THREE.MeshStandardMaterial({color:0xf4ead0,emissive:0xdce9d8,emissiveIntensity:2.1});
  const deadBulb=new THREE.MeshStandardMaterial({color:0x77796c,roughness:.84});
  const glass=new THREE.MeshStandardMaterial({color:0x6c7870,transparent:true,opacity:.22,roughness:.48,metalness:.15,depthWrite:false});
  const boxes: THREE.Mesh[]=[];
  function box(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,solid=false) {
    const rounded=Math.min(w,h,d)>.12&&Math.max(w,h,d)<4;
    const mesh=new THREE.Mesh(physicalBox(w,h,d,rounded),material);mesh.position.set(x,y,z);
    const uv=mesh.geometry.attributes.uv,normals=mesh.geometry.attributes.normal;
    for(let i=0;i<uv.count;i++){
      const nx=Math.abs(normals.getX(i)),ny=Math.abs(normals.getY(i)),nz=Math.abs(normals.getZ(i));
      uv.setXY(i,uv.getX(i)+(nx>=ny&&nx>=nz?z:x),uv.getY(i)+(ny>nx&&ny>=nz?z:y));
    }
    mesh.receiveShadow=true;mesh.castShadow=solid;scene.add(mesh);boxes.push(mesh);
    if(solid)addObstacle(x,z,w,d,y-h/2,y+h/2);
    return mesh;
  }
  function cylinder(x:number,y:number,z:number,rTop:number,rBottom:number,h:number,material:THREE.Material,segments=24) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,h,segments),material);
    mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;scene.add(mesh);return mesh;
  }
  function art(artwork:Artwork,x:number,y:number,z:number,w:number,h:number,rotation=0,emission=.08){
    text.push(...artwork.text);
    const mat=new THREE.MeshStandardMaterial({map:artwork.texture,roughness:.85,emissive:0xffffff,emissiveMap:artwork.texture,emissiveIntensity:emission*.35});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
    mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);return mesh;
  }
  const signCache=new Map<string,Artwork>();
  function sign(title:string,sub:string,x:number,y:number,z:number,w:number,h:number,rotation=0,style=0,emission=.2) {
    const key=title+sub+style+w/h;
    if(!signCache.has(key))signCache.set(key,signage(title,sub,style,w/h));
    return art(signCache.get(key)!,x,y,z,w,h,rotation,emission);
  }
  function floorMaterial(w:number,d:number,source=tileMap,period=2.4) {
    const material=assets.material(source,w/period,d/period);
    if(source===tileMap){material.color.setHex(0xb4bab4);material.roughness=.82;material.normalScale.set(.45,.45);}
    return material;
  }

  function horizontal(x:number,y:number,z:number,w:number,d:number,material:THREE.Material) {
    const mesh=new THREE.Mesh<THREE.BufferGeometry,THREE.Material>(new THREE.PlaneGeometry(w,d),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  const shadowMaterial=new THREE.MeshBasicMaterial({map:softShadow(),transparent:true,opacity:.48,depthWrite:false,toneMapped:false});
  function contact(x:number,y:number,z:number,w:number,d:number,opacity=.48){
    const mat=shadowMaterial.clone();mat.opacity=opacity;horizontal(x,y+.013,z,w,d,mat);
  }
  const scuffMat=new THREE.MeshBasicMaterial({map:scuffs(),transparent:true,depthWrite:false,opacity:.65});
  function scuff(x:number,y:number,z:number,w:number,d:number){horizontal(x,y+.019,z,w,d,scuffMat);}
  function pipe(from:THREE.Vector3,to:THREE.Vector3,r:number,material:THREE.Material){
    const direction=to.clone().sub(from);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),8),material);
    mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    mesh.castShadow=true;scene.add(mesh);return mesh;
  }

  scene.background=new THREE.Color(0x3d4749);scene.fog=new THREE.FogExp2(0x394342,.009);
  scene.environment=assets.environment;scene.environmentIntensity=.19;scene.environmentRotation.y=.6;
  scene.add(new THREE.HemisphereLight(0xd4dddf,0x53544c,.28));
  const sun=new THREE.DirectionalLight(0xd2e2e6,1.35);sun.position.set(-4,26,6);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-34,right:34,top:32,bottom:-32,near:1,far:75});
  sun.shadow.bias=-.0004;sun.shadow.normalBias=.045;sun.shadow.radius=3;scene.add(sun);
  function pool(x:number,y:number,z:number,color:number,intensity:number,reach:number){
    const light=new THREE.PointLight(color,intensity,reach,2);light.position.set(x,y,z);scene.add(light);return light;
  }
  pool(0,7.8,3,0xc4d8d9,30,22);pool(2,8.1,-16,0xd7decd,20,12);
  pool(-24,2.8,1,0x779bb5,9,10);pool(24,3.3,8,0xc9d4c5,9,9);
  pool(-16,3.8,-9,0xc1d7bf,18,12);const galleryLight=pool(16,3.8,12,0xcfddc8,22,12);
  pool(-16,3.8,15,0xd5dfce,17,12);pool(16,3.8,-9,0xc8d4c1,16,12);
  const courtLight=new THREE.SpotLight(0xcbdcdf,290,28,1.13,.82,2);
  courtLight.position.set(1,9.85,4);courtLight.target.position.set(0,0,4);courtLight.castShadow=true;
  courtLight.shadow.mapSize.set(1024,1024);courtLight.shadow.bias=-.00015;courtLight.shadow.normalBias=.025;scene.add(courtLight,courtLight.target);

  box(0,-.18,0,64,.36,48,pale);horizontal(0,.006,0,64,48,floorMaterial(64,48));
  for(const x of [-11,11])box(x,.012,0,.44,.012,44,mauve);
  for(const z of [-14,14])box(0,.014,z,22,.013,.44,mauve);
  for(const x of [-11.34,11.34])box(x,.017,0,.07,.008,44,gold);
  scuff(0,0,15,10,7);scuff(-16,0,1,7,22);scuff(16,0,8,7,22);

  // The circulation footprint is unchanged from the tested spatial prototype.
  box(0,5.1,-22.3,64,10.2,.6,wall,true);box(0,5.1,22.3,64,10.2,.6,wall,true);
  box(-30.3,5.1,0,.6,10.2,44,wall,true);box(30.3,5.1,0,.6,10.2,44,wall,true);
  box(-25,2.4,-14,10,4.8,16,wall,true);box(-25,2.4,15,10,4.8,14,wall,true);
  box(25,2.4,-9,10,4.8,26,wall,true);box(25,2.4,17,10,4.8,10,wall,true);box(29,2.4,8,2,4.8,8,wall,true);
  for(const z of [-6.1,8.1])box(-25,2.4,z,10,4.8,.2,wall,true);
  for(const z of [3.9,12.1])box(25,2.4,z,10,4.8,.2,wall,true);
  box(-25,7.5,0,10,5.4,44,wall,true);box(25,7.5,0,10,5.4,44,wall,true);
  for(const y of [.22,5.02])for(const x of [-19.82,19.82])box(x,y,0,.13,.28,44,teal);
  const slabs=[[-16,0,8,44],[16,0,8,44],[0,16,24,12],[0,-17.5,24,9],...NORTH_GALLERY_SEGMENTS.map(([x,w])=>[x,-11.5,w,3])];
  for(const [x,z,w,d] of slabs){
    box(x,HEIGHT-.1,z,w,.2,d,dark).castShadow=true;horizontal(x,HEIGHT+.005,z,w,d,floorMaterial(w,d));
  }
  for(const [x,z,w,d] of [[-23,0,18,44],[23,0,18,44],[0,16,28,12],[0,-16,28,12]]){
    box(x,10.12,z,w,.16,d,dark).castShadow=true;
  }
  const skylight=new THREE.MeshBasicMaterial({color:0xb7c7cc,toneMapped:false});
  box(0,10.8,0,28,.08,20,skylight);
  for(const z of [-10.1,10.1])box(0,10.3,z,28,.9,.24,wall);
  for(let z=-10;z<=10;z+=2.5)box(0,10.25,z,28,.22,.12,teal);
  for(let x=-12;x<=12;x+=4)box(x,10.3,0,.12,.24,20,teal);
  for(const x of [-12.8,12.8])for(const z of [-14,0,14]){
    box(x,4.85,z,.85,9.7,.85,wall,true);box(x,.82,z,.9,1.64,.9,wall);
    box(x,.09,z,1.04,.18,1.04,dark);box(x,1.65,z,1.01,.09,1.01,gold);
    box(x,4.6,z,1.05,.3,1.05,wall);box(x,4.79,z,1.1,.08,1.1,metal);
    contact(x,0,z,2.6,2.6,.58);contact(x,HEIGHT,z,2.3,2.3,.4);
  }
  // Slab fascia and the brass line make the void readable from both floors.
  for(const x of [-12,12]){
    box(x,4.54,0,.18,.65,20,wall);box(x,4.29,0,.22,.06,20,gold);
  }
  box(0,4.54,10,24,.65,.18,wall);box(0,4.29,10,24,.06,.22,gold);
  function rail(x:number,z:number,w:number,d:number){
    box(x,HEIGHT+.52,z,w,1.04,d,glass,true);box(x,HEIGHT+1.1,z,w+.04,.065,d+.04,gold);
    const count=Math.ceil(Math.max(w,d)/2.4);
    for(let i=0;i<=count;i++){const t=i/count-.5;box(x+(w>d?t*w:0),HEIGHT+.55,z+(d>w?t*d:0),.055,1.1,.055,metal);}
    box(x,HEIGHT+.12,z,w,.04,d,dark);
  }
  rail(-12,0,.12,20);rail(12,0,.12,20);rail(0,10,24,.12);
  for(const [x,w] of NORTH_GALLERY_SEGMENTS)rail(x,-10,w,.12);

  for(const x of ESCALATOR_CENTERS){
    for(let i=0;i<40;i++){
      const h=(i+1)/40*HEIGHT,z=-3-(i+.5)*.25;
      box(x,h-.065,z,2.1,.13,.25,metal);
      box(x,h+.008,-3-i*.25-.02,2,.016,.025,metal);
      for(let k=-13;k<=13;k++)box(x+k*.072,h+.012,z,.01,.008,.21,dark);
    }
    for(const side of [-1,1]){
      scene.add(escalatorSide(x+side*1.2,metal,dark,glass));
      addObstacle(x+side*1.2,-8,.18,10.4,0,HEIGHT+1);

    }
    box(x,.03,-2.65,2.1,.06,.7,dark);box(x,HEIGHT+.025,-13.4,2.1,.05,.8,dark);
    for(let j=-5;j<=5;j++)box(x+j*.18,.066,-2.65,.05,.012,.65,metal);
    contact(x,0,-2.5,3.5,2.5,.42);
  }

  // Store identities are fictional. Typography is drawn locally, so signs remain legible.
  function shop(x:number,z:number,title:string,sub:string,y=0,style=0,window=false){
    const facing=x<0?1:-1,rotation=facing*Math.PI/2;
    box(x,y+2,z,.18,4,6.05,style===1?mauve:teal);
    box(x+facing*.11,y+1.8,z,.08,3.5,5.55,window?dark:metal);
    if(!window){
      const shutter=assets.model('rollershutter_window_01',['rollershutter_window_01']);
      const bounds=new THREE.Box3().setFromObject(shutter).getSize(new THREE.Vector3());
      shutter.scale.set(5.5/bounds.x,3.46/bounds.y,1);
      shutter.traverse(object=>{if(object instanceof THREE.Mesh){
        const material=(object.material as THREE.MeshStandardMaterial).clone();material.color.setHex(0x545c57);material.roughness=.84;object.material=material;
      }});
      shutter.rotation.y=rotation;shutter.position.set(x+facing*.39,y+.045,z);scene.add(shutter);

    }else{
      for(const dz of [-1.75,0,1.75]){
        box(x+facing*.17,y+.9,z+dz,.12,.75,1.2,pale);
        if(title.includes('Records')){
          cylinder(x+facing*.3,y+1.47,z+dz,.2,.2,.045,dark,32).rotation.z=Math.PI/2;
        }else box(x+facing*.28,y+1.42,z+dz,.16,.23,.35,metal);
      }
      box(x+facing*.36,y+1.8,z,.04,3.35,5.5,glass);
      for(const dz of [-2.7,0,2.7])box(x+facing*.4,y+1.8,z+dz,.05,3.4,.045,gold);
    }
    box(x+facing*.02,y+4.01,z,.38,.86,6.1,dark);
    sign(title,sub,x+facing*.225,y+4.02,z,5.85,.78,rotation,style,style===2?.42:.13);
    sign('CLOSED','Thank you for shopping with us',x+facing*.58,y+1.8,z,.85,.24,rotation,3,.02);
    contact(x-facing*.8,y,z,4,7,.35);
  }
  shop(-19.85,-18,'Sunvale Records','Tapes · compact discs',0,3,true);
  shop(-19.85,-10,'Dayframe Photo','One-hour developing',0,2,true);
  shop(-19.85,12,'Cedar & Thread','Everyday essentials',0,0);
  shop(-19.85,19,'Soft Season','Something just for you',0,1);
  shop(19.85,-18,'Halfstep','Shoes for the way ahead',0,1);
  shop(19.85,-10,'Homeward','Make yourself at home',0,2);
  shop(19.85,-2,'Paper Parade','Cards · gifts · stationery',0,0);
  shop(19.85,18,'Sundial Optics','A brighter outlook',0,3);
  shop(-19.85,-5,'Velvet Hour','Fashion accessories',HEIGHT,1);
  shop(-19.85,9,'Small Wonders','Gifts for everyone',HEIGHT,2);
  shop(19.85,-5,'North & Willow','Outfit your everyday',HEIGHT,0);
  shop(19.85,9,'Sunday Shoes','Find your next step',HEIGHT,3);

  // Entrance doors, framed autumn campaign and freestanding directory.
  box(0,1.65,21.8,5.4,3.3,.15,dark);
  for(const x of [-1.3,1.3]){
    box(x,1.7,21.68,2.45,3,.06,glass);
    for(const side of [-1,1])box(x+side*1.22,1.7,21.58,.07,3,.08,gold);
    box(x,1.1,21.56,2.4,.06,.09,metal);
    box(x,.1,21.56,2.5,.2,.1,metal);
  }
  sign('EXIT','Main entrance',0,3.8,21.6,2.2,.5,Math.PI,0,.55);
  sign('MERIDIAN','G A L L E R I A',0,7.3,21.93,11,1.65,Math.PI,0,.16);
  horizontal(0,.027,19.4,5.4,2.5,new THREE.MeshStandardMaterial({color:0x3f4f47,roughness:1}));
  for(const x of [-5.5,5.5]){
    box(x,2,21.7,1.55,2.25,.18,gold);
    art(fallPoster(),x,2,21.59,1.39,2.09,Math.PI);
  }
  box(-6.7,.6,16.7,.9,1.2,.6,teal,true);box(-6.7,1.65,16.7,1.45,1.95,.22,gold,true);
  art(directory(),-6.7,1.65,16.83,1.32,1.78);
  contact(-6.7,0,16.7,2.3,2,.5);
  // Hanging signs and suspension wires.
  for(const [x,z,title,sub] of [[-9.5,12,'CENTER COURT','Food court ↑  /  Orbit Amusements ←'],[-15,-6,'WEST GALLERY','Orbit Amusements ↑'],[15,5,'EAST GALLERY','Photo booth ↑  /  Exit ↓']] as const){
    const y=3.7,w=3.5;
    box(x,y,z,w,.65,.14,dark);
    sign(title,sub,x,y,z+.08,w-.08,.56,0,0,.17);
    for(const dx of [-w*.36,w*.36])box(x+dx,(y+4.48)/2,z,.018,4.48-y,.018,metal);
  }
  art(notice('WE HAVE MOVED',['Our next chapter','is just around the corner.','','Thank you for 12 years.'],'SOFT SEASON / OCTOBER 2004'),-19.25,2.1,18.3,.63,.85,Math.PI/2,.02);

  // Octagonal mosaic fountain with mineral stains, coins and dry nozzles.
  const basinMat=assets.material('blue_floor_tiles_01',1.8,.8,0x7b969c);
  const stone=assets.material('plastered_wall_04',1.6,1.6,0x898e83);
  cylinder(0,.13,4,3.1,3.1,.26,basinMat,8);
  contact(0,0,4,8.7,8.7,.66);
  const basinWall=fountainRing(3.43,3.02,.49,basinMat);basinWall.position.set(0,.28,4);scene.add(basinWall);
  const basinLip=fountainRing(3.49,2.96,.095,stone);basinLip.position.set(0,.79,4);scene.add(basinLip);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    cylinder(Math.sin(a)*1.9,.29,4+Math.cos(a)*1.9,.04,.06,.18,rust,12);
  }
  const dryFloor=horizontal(0,.264,4,5.8,5.8,assets.material('blue_floor_tiles_01',5,2.5,0x738e93));
  dryFloor.geometry.dispose();dryFloor.geometry=new THREE.CircleGeometry(3.03,8);
  scuff(0,.265,4,5.8,5.8);
  addObstacle(0,4,6.7,6.7,0,.92);
  const pedestal=new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.77,.27),new THREE.Vector2(.8,.32),new THREE.Vector2(.8,.42),new THREE.Vector2(.68,.5),
    new THREE.Vector2(.48,1.76),new THREE.Vector2(.57,1.86),new THREE.Vector2(.57,1.96),new THREE.Vector2(0,1.96)
  ],32),stone);pedestal.geometry.scale(1,.38,1);pedestal.geometry.translate(0,.17,0);pedestal.position.z=4;pedestal.castShadow=true;pedestal.receiveShadow=true;scene.add(pedestal);
  const rng=random(2004);
  const coinGeometry=new THREE.CylinderGeometry(.033,.033,.008,10),coins=new THREE.InstancedMesh(coinGeometry,gold,62),dummy=new THREE.Object3D();
  for(let i=0;i<62;i++){const a=rng()*Math.PI*2,r=1+rng()*1.75;dummy.position.set(Math.sin(a)*r,.267,4+Math.cos(a)*r);dummy.rotation.set(0,rng()*6,0);dummy.updateMatrix();coins.setMatrixAt(i,dummy.matrix);}
  scene.add(coins);
  art(notice('PARDON OUR APPEARANCE',['The fountain is temporarily','out of service.','','Please do not enter.'],'THANK YOU / MALL MANAGEMENT'),0,.51,7.29,.78,.58,0,.02);

  // Two dry decorative planters stay clear of the tested circulation path.
  function planter(x:number,z:number){
    cylinder(x,.38,z,.56,.43,.76,pale,16);cylinder(x,.76,z,.5,.5,.045,dark,16);
    addObstacle(x,z,1.13,1.13,0,.8);contact(x,0,z,2.2,2.2,.5);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.525,.045,8,32),pale);rim.rotation.x=Math.PI/2;rim.position.set(x,.76,z);scene.add(rim);

  }
  planter(-9,8);planter(9,8);
  for(const x of [-18.5,18.5]){
    cylinder(x,.47,15,.3,.32,.94,metal,16);cylinder(x,.95,15,.32,.32,.04,dark,16);
    addObstacle(x,15,.65,.65,0,1);contact(x,0,15,1.2,1.2);
  }

  // A quiet arcade: differently shaped cabinets, CRT glass, controls and original game art.
  horizontal(-25,.028,1,10,14,floorMaterial(10,14,carpetMap,3));
  sign('ORBIT','A M U S E M E N T S',-19.72,3.95,1,9,.84,Math.PI/2,1,.7);
  box(-25,4.4,1,10,.18,14,dark);
  for(let i=0;i<5;i++){
    const z=-3.4+i*2.2,h=i===0?2.15:1.95,w=i===4?1.15:.92,on=i===2;
    const skin=i%2?mauve:teal;
    box(-28.3,h/2,z,1.08,h,w,dark,true);
    box(-28.04,h/2,z,1.1,h,w+.05,skin);
    box(-27.43,1.34,z,.1,.85,w-.12,dark);
    const crt=art(arcadeScreen(on),-27.365,1.38,z,w-.25,.64,Math.PI/2,on?1.3:.01);
    crt.rotation.z=-.07;if(on)arcadeMaterial=crt.material;
    box(-27.32,.9,z,.55,.13,w,metal);
    addObstacle(-27.7,z,1.4,w+.05,0,h);
    for(const dz of [-.18,.18]){
      cylinder(-27.16,1.05,z+dz,.05,.05,.08,dark,12);
      const ball=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),dz<0?rust:gold);ball.position.set(-27.16,1.13,z+dz);scene.add(ball);
    }
    const names=['NIGHT CIRCUIT','LUNAR PATROL','STAR DRIFTER','BLOCK PARADE','RALLY 98'];
    sign(names[i],'ONE TOKEN / ONE PLAY',-27.36,h-.08,z,w,.27,Math.PI/2,i%4,on?.8:.12);
    sign('25¢','INSERT COIN',-27.36,.48,z,.27,.24,Math.PI/2,3,.02);
    contact(-28,0,z,2.5,1.5,.7);
  }
  art(notice('TOKENS',['4 tokens for $1.00','','No cash value.','No refunds.'],'ORBIT AMUSEMENTS'),-29.93,2.1,7,1,1.2,Math.PI/2,.08);

  // Period photo booth with a folded curtain, output tray and sample-strip window.
  box(26.5,1.18,8,1.8,2.36,2.2,dark,true);
  box(25.56,1.16,8,.08,2.24,2.1,metal);
  const curtainGeometry=new THREE.PlaneGeometry(.94,1.65,32,8);
  const curtainPositions=curtainGeometry.attributes.position;
  for(let i=0;i<curtainPositions.count;i++)curtainPositions.setZ(i,Math.sin((curtainPositions.getX(i)+.47)*Math.PI*22)*.027);
  curtainGeometry.computeVertexNormals();
  const cloth=assets.material('denim_fabric_06',2,3,0xa6a0b1).clone();cloth.side=THREE.DoubleSide;
  const curtain=new THREE.Mesh(curtainGeometry,cloth);curtain.rotation.y=-Math.PI/2;curtain.position.set(25.4,1.05,7.83);scene.add(curtain);
  pipe(new THREE.Vector3(25.35,1.91,7.32),new THREE.Vector3(25.35,1.91,8.34),.018,gold);
  sign('DAYFRAME','4 PHOTOS / $3.00',25.37,2.15,8,2,.4,-Math.PI/2,2,.28);
  box(25.43,.73,8.65,.14,.11,.38,dark);box(25.41,.66,8.65,.27,.03,.43,metal);
  art(notice('MAKE A MEMORY',['Sit down.','Draw the curtain.','Look into the lens.'],'FOUR POSES / ONE STRIP'),25.405,1.35,8.68,.4,.68,-Math.PI/2,.06);
  contact(26.3,0,8,3.6,3.8,.7);
  box(27.84,1.25,10.9,.12,2.5,1.15,teal);
  sign('STAFF ONLY','No public access',27.765,1.8,10.9,.8,.3,-Math.PI/2,0,.03);
  const doorHandle=box(27.73,1.04,10.52,.13,.045,.18,metal);boxes.pop();
  art(notice('BEFORE YOU LEAVE',['Switch off advertising lights.','Leave the east corridor on.'],'OPERATIONS / CLOSING CHECKLIST'),27.74,2.2,10.9,.6,.43,-Math.PI/2,.02);

  // Empty food court: illuminated menu boards and the one remaining chair.
  const vendors=['Golden Fold','NOODLE No. 2','MOON SODA'];
  for(let i=0;i<3;i++){
    const x=(i-1)*10,skin=[mauve,teal,pale][i];
    box(x,HEIGHT+.6,-20,7,1.2,1.4,skin,true);box(x,HEIGHT+1.24,-20,7.25,.1,1.65,metal);
    for(let k=-5;k<=5;k++)box(x+k*.56,HEIGHT+.59,-19.285,.022,1.08,.025,gold);
    box(x,HEIGHT+2.03,-21.84,7,1.47,.2,dark);
    art(menu(i),x,HEIGHT+2.04,-21.72,6.7,1.4,0,.57);
    box(x,HEIGHT+3.38,-21.8,7.2,.9,.35,dark);
    sign(vendors[i],['BAKERY & COFFEE','FRESH FROM THE WOK','FOUNTAIN DRINKS & FLOATS'][i],x,HEIGHT+3.38,-21.6,7,.75,0,i,.35);
    box(x-2,HEIGHT+1.37,-20,.56,.15,.45,dark);
    const register=box(x-2,HEIGHT+1.59,-20.12,.5,.36,.28,metal);register.rotation.x=-.2;
    sign('0.00','TOTAL',x-2,HEIGHT+1.62,-19.935,.38,.16,0,3,.12);
    for(let key=0;key<5;key++)box(x-2.16+key*.08,HEIGHT+1.46,-19.88,.055,.018,.09,white);
    box(x+2.2,HEIGHT+1.46,-20.2,.35,.35,.35,white);
    contact(x,HEIGHT,-19.6,8,3,.56);
  }
  const chairX=2,chairZ=-16.5;
  const chair=assets.model('plastic_monobloc_chair_01');chair.position.set(chairX,HEIGHT,chairZ);chair.rotation.y=.42;scene.add(chair);
  addObstacle(chairX,chairZ,.66,.66,HEIGHT,HEIGHT+.9);
  contact(chairX,HEIGHT,chairZ,1.9,1.8,.65);scuff(0,HEIGHT,-16.5,20,5);
  for(const x of [-7,-2,7])for(const z of [-16,-18]){
    const mark=new THREE.Mesh(new THREE.RingGeometry(.21,.24,24),new THREE.MeshBasicMaterial({color:0x6b6253,transparent:true,opacity:.15,depthWrite:false}));
    mark.rotation.x=-Math.PI/2;mark.position.set(x,HEIGHT+.016,z);scene.add(mark);
  }
  art(notice('COMING THIS NOVEMBER',['A fresh new food court.','More choice. More to enjoy.','','Good things are on the way.'],'MERIDIAN GALLERIA / FALL 2004'),-18.7,HEIGHT+2.1,-21.94,1.25,1.6,0,.05);
  sign('FOOD COURT','Good food. Good company.',0,9.2,-21.87,8,.68,0,0,.2);

  const clock=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.1,48),gold);clock.rotation.x=Math.PI/2;clock.position.set(0,8.1,21.7);scene.add(clock);
  art(clockFace(),0,8.1,21.63,1.13,1.13,Math.PI,.15).material.transparent=true;
  for(const y of [4.39,9.8])for(const x of [-16,16])for(const z of [-17,-9,-1,7,15]){
    const isOff=(z===7&&x<0)||(z===-17&&y<5);
    const fixture=assets.model('mounted_fluorescent_lights',['mounted_fluorescent_lights_a']);
    fixture.scale.setScalar(1.85);fixture.rotation.z=Math.PI;fixture.position.set(x,y,z);
    fixture.traverse(object=>{if(object instanceof THREE.Mesh){
      const material=(object.material as THREE.MeshStandardMaterial).clone();
      if(material.emissiveMap){material.emissive.set(0xdce9d8);material.emissiveIntensity=isOff?0:3;}
      object.material=material;object.castShadow=false;
      if(x===16&&z===15&&y<5&&material.emissiveMap)liveTubes.push(material);
    }});scene.add(fixture);

  }
  for(const z of [-18,17])for(const x of [-7,0,7])box(x,9.79,z,1.8,.045,.25,z===-18?bulb:deadBulb);
  // Air returns and a discolored ceiling tile establish the age without visual clutter.
  for(const x of [-16,16])for(const z of [-13,3,19]){
    box(x,4.41,z,.7,.04,.7,dark);
    for(let i=0;i<8;i++)box(x-.3+i*.085,4.38,z,.025,.035,.65,metal);
  }

  // Select only the assembled bench, without the extra kit components.
  const benchParts=['crossbar','legs_double','legs_single','suspended_support_01','back_support_r','back_support_l','arm_rest_01','arm_rest_02','seat','seat_back'];
  for(const [x,z,angle] of [[-10,3,Math.PI/2],[10,3,-Math.PI/2]]){
    const bench=assets.model('modular_street_seating',benchParts);bench.position.set(x,0,z);bench.rotation.y=angle;scene.add(bench);
    addObstacle(x,z,.85,2.5,0,1);contact(x,0,z,1.7,3.5,.35);
  }
  // Equipment left beside the staff door. The generator is switched off.
  for(const [id,x,z,angle] of [['portable_generator',27,11,.7],['cardboard_box_01',26.9,5,.1],['trashbag',27.35,5.6,1.8]] as const){
    const prop=assets.model(id);prop.position.set(x,0,z);prop.rotation.y=angle;scene.add(prop);
    const bounds=new THREE.Box3().setFromObject(prop),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    addObstacle(center.x,center.z,size.x,size.z,0,size.y);contact(x,0,z,size.x*1.8,size.z*1.8,.35);
  }
  // Small abandoned receipts, kept away from the main route.
  const paper=assets.material('plastered_wall_04',1,1,0xc7bea4);
  for(const [x,z,angle] of [[-17,12,.8],[17.5,-3,2.1],[3,8,.3],[-2,-15,1.5]]){
    const receipt=horizontal(x,z===-15?HEIGHT+.023:.025,z,.13,.24,paper);receipt.rotation.z=angle;
  }
  const sconceGlass=new THREE.MeshStandardMaterial({color:0xf3d2a0,emissive:0xffb563,emissiveIntensity:2.4,roughness:.6});
  for(const x of [-12.8,12.8])for(const z of [-14,0,14])for(const y of [2.55,7.35]){
    box(x,y,z+.47,.17,.42,.13,dark);box(x,y,z+.55,.1,.31,.04,sconceGlass);
    for(const dx of [-.065,.065])box(x+dx,y,z+.582,.014,.34,.025,metal);
  }
  for(const x of [-12.8,12.8])pool(x,2.55,14.8,0xffb56b,5,4);
  const decay=decayDetails(scene,assets);
  // Merge static box geometry while retaining physical-size UVs.
  const batches=new Map<string,THREE.Mesh[]>();
  for(const mesh of boxes){
    const material=mesh.material as THREE.Material;if(material.transparent)continue;
    const key=material.uuid+mesh.castShadow;
    if(!batches.has(key))batches.set(key,[]);batches.get(key)!.push(mesh);
  }
  for(const meshes of batches.values()){
    if(meshes.length<3)continue;
    const transformed=meshes.map(mesh=>{mesh.updateMatrix();const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();return geometry.applyMatrix4(mesh.matrix);});
    const geometry=mergeGeometries(transformed);if(!geometry)throw new Error('Static geometry could not be merged');
    const batch=new THREE.Mesh(geometry,meshes[0].material);batch.castShadow=meshes[0].castShadow;batch.receiveShadow=true;
    meshes.forEach(mesh=>{scene.remove(mesh);mesh.geometry.dispose();});transformed.forEach(geometry=>geometry.dispose());scene.add(batch);
  }
  // Static local transforms need no per-pass recomposition; the door handle remains animated.
  scene.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=object===doorHandle;});
  scene.updateMatrixWorld(true);
  let doorTime=0;
  return {objects:scene.children.length,text,decay,
    react(kind:'arcade'|'door'){if(kind==='arcade')responseTime=.45;else doorTime=.45;},
    update(dt:number,steadyLighting:boolean){
      const responding=responseTime>0||doorTime>0,previousLight=galleryLight.intensity;
      elapsed+=dt;responseTime=Math.max(0,responseTime-dt);doorTime=Math.max(0,doorTime-dt);
      if(arcadeMaterial)arcadeMaterial.emissiveIntensity=1.3+Math.min(1,responseTime*4)*.35;
      doorHandle.rotation.x=doorTime>0?Math.sin(doorTime/.45*Math.PI)*.3:0;
      const variation=steadyLighting?1:.96+.04*Math.sin(elapsed*1.7)*Math.sin(elapsed*.63);
      galleryLight.intensity=22*variation;liveTubes.forEach(material=>material.emissiveIntensity=3*variation);
      return responding||previousLight!==galleryLight.intensity;
    }
  };
}