"""Check the published payload, hashes and 1K image budget without changing assets."""
import hashlib,json,re
from pathlib import Path
from PIL import Image
root=Path('public/assets/1k').resolve()
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
total=0;count=0;images=0;largest=0
for asset in manifest['assets']:
 size=0
 for entry in asset['files']:
  path=(root/entry['path']).resolve()
  assert path.is_relative_to(root),str(path)
  data=path.read_bytes();assert len(data)==entry['bytes'],str(path)
  assert hashlib.sha256(data).hexdigest()==entry['sha256'],str(path)
  size+=len(data);count+=1
  if path.suffix.lower() in ('.jpg','.jpeg','.png'):
   with Image.open(path) as image:
    assert max(image.size)<=1024,str(path)
    largest=max(largest,*image.size);images+=1
  elif path.suffix.lower()=='.hdr':
   match=re.search(rb'[-+]Y (\d+) [-+]X (\d+)',data[:1024]);assert match,str(path)
   dimensions=[int(n) for n in match.groups()];assert max(dimensions)<=1024,str(path)
   largest=max(largest,*dimensions);images+=1
 assert size==asset['bytes'],asset['id']
 total+=size
assert total==manifest['bytes']
assert total<=25*1024*1024,'Runtime asset budget exceeded'
report={'packages':len(manifest['assets']),'files':count,'images':images,'largestImageDimension':largest,'bytes':total,'budgetBytes':25*1024*1024,'allHashesValid':True}
Path('docs/stage-5-asset-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
