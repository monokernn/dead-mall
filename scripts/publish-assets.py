"""Publish local 1K assets, preserving source files and optimizing browser JPEGs."""
import hashlib, io, json, pathlib, shutil
from PIL import Image
root=pathlib.Path('assets/library/1k'); dest=pathlib.Path('public/assets/1k')
ids={'floor_tiles_06','peeling_painted_wall','plastered_wall_04','dirty_carpet','blue_floor_tiles_01','denim_fabric_06','metal_plate_02','portable_generator','rollershutter_window_01','mounted_fluorescent_lights','plastic_monobloc_chair_01','modular_street_seating','cardboard_box_01','trashbag','subway_entrance'}
m=json.loads((root/'manifest.json').read_text()); selected=[a for a in m['assets'] if a['id'] in ids]
assert len(selected)==len(ids)
previous=json.loads((dest/'manifest.json').read_text()) if (dest/'manifest.json').exists() else {'assets':[]}
retained={f['path'] for a in selected for f in a['files']}
# Only retire generated files recorded by the previous runtime manifest; never source assets.
for a in previous['assets']:
 for f in a['files']:
  if f['path'] not in retained:
   retired=(dest/f['path']).resolve()
   assert retired.is_relative_to(dest.resolve()), str(retired)
   if retired.is_file():retired.unlink()
source_bytes=sum(a['bytes'] for a in selected)
for a in selected:
 for f in a['files']:
  source=root/f['path']; target=dest/f['path']; target.parent.mkdir(parents=True,exist_ok=True)
  data=source.read_bytes()
  if source.suffix.lower() in ('.jpg','.jpeg'):
   with Image.open(io.BytesIO(data)) as image:
    assert max(image.size)<=1024, f'Oversize texture: {source}'
    color=any(token in source.name for token in ('_diff_','_emission_'))
    output=io.BytesIO()
    image.convert('RGB').save(output,format='JPEG',quality=88 if color else 95,subsampling=2 if color else 0,optimize=True)
    if len(output.getvalue())<len(data):data=output.getvalue()
  target.write_bytes(data)
  for key in ('bytes','md5','sha256'):f['source_'+key]=f[key]
  f['bytes']=len(data);f['md5']=hashlib.md5(data).hexdigest();f['sha256']=hashlib.sha256(data).hexdigest()
 a['source_bytes']=a['bytes'];a['bytes']=sum(f['bytes'] for f in a['files'])
dest.mkdir(parents=True,exist_ok=True)
total=sum(a['bytes'] for a in selected)
(dest/'manifest.json').write_text(json.dumps({'processing':'JPEG quality 88 color / 95 data, full chroma for normal and ARM maps; only keep smaller output. Dimensions unchanged. Originals preserved outside public.', 'bytes':total,'assets':selected},indent=2)+'\n',encoding='utf8')
print(f'Published {len(selected)} assets: {source_bytes/1048576:.2f} -> {total/1048576:.2f} MiB ({100*(1-total/source_bytes):.1f}% smaller)')