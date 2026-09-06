import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute} from 'node:path';

// Fail deployment before publishing a menu whose scene files were filtered out.
const root=resolve('public/assets/1k');
let manifest;
try{manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));}
catch{throw new Error('Runtime asset manifest is missing or invalid: public/assets/1k/manifest.json. Check .vercelignore and the Git asset files.');}
if(!Array.isArray(manifest.assets)||manifest.assets.length===0)throw new Error('The runtime asset manifest is empty.');
let count=0;
for(const asset of manifest.assets){
  for(const file of asset.files){
    const path=resolve(root,file.path),local=relative(root,path);
    if(local.startsWith('..')||isAbsolute(local))throw new Error(`Asset path escapes the runtime folder: ${file.path}`);
    let data;
    try{data=readFileSync(path);}catch{throw new Error(`Missing runtime asset: ${file.path}. Ensure public/assets/1k is included in the deployment.`);}
    if(data.length!==file.bytes||createHash('sha256').update(data).digest('hex')!==file.sha256)throw new Error(`Runtime asset failed integrity validation: ${file.path}`);
    count++;
  }
}
console.log(`Verified ${count} runtime asset files before building.`);
