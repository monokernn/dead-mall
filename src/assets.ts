import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

type Asset = { id:string; kind:string; files:{path:string;role:string}[] };
type Maps = {color:THREE.Texture;normal:THREE.Texture;arm:THREE.Texture};
const base=`${import.meta.env.BASE_URL}assets/1k/`;
export class MallAssets {
  readonly maps=new Map<string,Maps>();
  readonly models=new Map<string,THREE.Group>();
  environment!:THREE.Texture;
  private materials=new Map<string,THREE.MeshStandardMaterial>();
  async load(renderer:THREE.WebGLRenderer, progress:(loaded:number,total:number)=>void) {
    const response=await fetch(base+'manifest.json');
    if(!response.ok)throw new Error('The asset manifest could not be loaded.');
    const {assets}=await response.json() as {assets:Asset[]};
    const loader=new THREE.TextureLoader(),gltf=new GLTFLoader();
    let loaded=0;
    // Three workers keep initial network/decode pressure bounded on laptops.
    const queue=[...assets];
    const results=await Promise.allSettled(Array.from({length:3},async()=>{
      while(queue.length){
        const asset=queue.shift()!;
        const path=(role:string)=>base+asset.files.find(f=>f.role===role)!.path;
        if(asset.kind==='material'){
          const [color,normal,arm]=await Promise.all(['albedo','normal_gl','ao_roughness_metalness'].map(role=>loader.loadAsync(path(role))));
          color.colorSpace=THREE.SRGBColorSpace;
          for(const map of [color,normal,arm]){map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
          this.maps.set(asset.id,{color,normal,arm});
        }else if(asset.kind==='model'){
          const model=(await gltf.loadAsync(path('gltf'))).scene;
          model.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
          this.models.set(asset.id,model);
        }else{
          const hdr=await new HDRLoader().loadAsync(path('environment'));
          const pmrem=new THREE.PMREMGenerator(renderer);
          this.environment=pmrem.fromEquirectangular(hdr).texture;
          hdr.dispose();pmrem.dispose();
        }
        progress(++loaded,assets.length);
      }
    }));
    const failed=results.find(result=>result.status==='rejected');
    if(failed?.status==='rejected')throw failed.reason;
  }
  material(id:string,repeatX=.5,repeatY=.5,color=0xffffff,metalness=0){
    const key=[id,repeatX,repeatY,color,metalness].join(':');
    if(this.materials.has(key))return this.materials.get(key)!;
    const source=this.maps.get(id)!;
    const [map,normalMap,arm]=[source.color,source.normal,source.arm].map(t=>{const clone=t.clone();clone.repeat.set(repeatX,repeatY);return clone;});
    const material=new THREE.MeshStandardMaterial({map,normalMap,aoMap:arm,roughnessMap:arm,metalnessMap:arm,
      color,roughness:1,metalness,aoMapIntensity:.75,normalScale:new THREE.Vector2(.6,.6)});
    if(id==='floor_tiles_06'){
      material.onBeforeCompile=shader=>{
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          diffuseColor.rgb=diffuse*mix(sampledDiffuseColor.rgb,vec3(.32,.33,.31),.38);`);
      };
      material.customProgramCacheKey=()=> 'muted-stone-tiles-v1';
    }
    if(id==='peeling_painted_wall'){
      // Repaint the pink source coating as old off-white, retaining the exposed substrate and all PBR maps.
      material.onBeforeCompile=shader=>{
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float coating=smoothstep(.035,.115,sampledDiffuseColor.r-sampledDiffuseColor.g);
          float grain=dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722));
          diffuseColor.rgb=diffuse*mix(vec3(.15,.14,.115)*(grain*2.2+.3),vec3(.58,.61,.56)*(grain*1.5+.5),coating);`);
      };
      material.customProgramCacheKey=()=> 'aged-off-white-coating-v1';material.normalScale.set(.85,.85);
    }
    this.materials.set(key,material);return material;
  }
  model(id:string,only?:string[]){
    const source=this.models.get(id)!;
    const group=new THREE.Group();
    for(const child of source.children)if(!only||only.includes(child.name))group.add(child.clone(true));
    if(!group.children.length)throw new Error(`No selected mesh in ${id}`);
    group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
    for(const child of group.children)child.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
    return group;
  }
}