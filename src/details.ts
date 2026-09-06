import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function physicalBox(w:number,h:number,d:number,rounded=false){
  const geometry=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(.045,w*.12,h*.12,d*.12)):new THREE.BoxGeometry(w,h,d);
  const pos=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<pos.count;i++){
    const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i));
    if(nx>=ny&&nx>=nz)uv.setXY(i,pos.getZ(i),pos.getY(i));
    else if(ny>=nz)uv.setXY(i,pos.getX(i),pos.getZ(i));
    else uv.setXY(i,pos.getX(i),pos.getY(i));
  }
  return geometry;
}

export function fountainRing(outer:number,inner:number,height:number,material:THREE.Material){
  const shape=new THREE.Shape(),hole=new THREE.Path();
  for(let i=0;i<=8;i++){
    const angle=i/8*Math.PI*2+Math.PI/8;
    const x=Math.cos(angle),y=Math.sin(angle);
    if(i===0){shape.moveTo(x*outer,y*outer);hole.moveTo(x*inner,-y*inner);}
    else{shape.lineTo(x*outer,y*outer);hole.lineTo(x*inner,-y*inner);}
  }
  shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:1});
  geometry.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function escalatorSide(x:number,metal:THREE.Material,rubber:THREE.Material,glass:THREE.Material){
  const group=new THREE.Group();
  const shape=new THREE.Shape();
  shape.moveTo(2.62,.22);shape.lineTo(2.62,.72);shape.quadraticCurveTo(2.62,.96,3.05,.96);
  shape.lineTo(13.1,5.77);shape.lineTo(13.62,5.77);shape.quadraticCurveTo(13.95,5.77,13.95,5.49);
  shape.lineTo(13.95,4.83);shape.lineTo(13.15,4.83);shape.lineTo(3.15,.22);shape.closePath();
  const panel=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1}),glass);
  panel.rotation.y=Math.PI/2;panel.position.x=x-.025;group.add(panel);
  const points=[[2.66,.40],[2.56,.70],[2.72,.94],[3.12,1.005],[13.12,5.81],[13.62,5.81],[13.98,5.63],[13.99,5.28],[13.63,5.14],[13.18,5.10],[3.15,.35],[2.88,.31]];
  const curve=new THREE.CatmullRomCurve3(points.map(([z,y])=>new THREE.Vector3(x,y,-z)),true,'centripetal');
  const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,128,.066,8,true),rubber);rail.castShadow=true;group.add(rail);
  const skirt=new THREE.Shape();skirt.moveTo(2.68,.08);skirt.lineTo(2.68,.28);skirt.lineTo(13.16,5.08);skirt.lineTo(13.89,5.08);skirt.lineTo(13.89,4.69);skirt.lineTo(13.12,4.69);skirt.lineTo(3.1,.08);skirt.closePath();
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(skirt,{depth:.18,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1}),metal);base.rotation.y=Math.PI/2;base.position.x=x-.09;base.castShadow=true;base.receiveShadow=true;group.add(base);
  return group;
}