"""Extend the local source library with the reference-driven 1K material selection."""
import importlib.util,json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
spec=importlib.util.spec_from_file_location('prepare',Path(__file__).with_name('prepare-assets.py'));p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
requests=[('peeling_painted_wall','material','Peeling off-white wall finish and exposed substrate'),('blue_floor_tiles_01','material','Weathered blue ceramic for the dry fountain'),('floor_tiles_06','material','Muted stone tile pattern for the atrium')]
data=json.loads((p.LIB/'manifest.json').read_text())
for request in requests:
 if any(a['id']==request[0] for a in data['assets']):continue
 a=p.plan_one(request)
 for f in a['files']:p.safe_path(f['path']).parent.mkdir(parents=True,exist_ok=True)
 with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(p.download_file,a['files']))
 data['assets'].append(a);data['bytes']=sum(asset['bytes'] for asset in data['assets']);(p.LIB/'manifest.json').write_text(json.dumps(data,indent=2),encoding='utf8');print('Added '+a['id'],flush=True)
data['bytes']=sum(a['bytes'] for a in data['assets'])
(p.LIB/'manifest.json').write_text(json.dumps(data,indent=2),encoding='utf8');p.validate()