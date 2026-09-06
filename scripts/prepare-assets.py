"""Prepare a compact 1K asset library. Does not modify or wire assets into the scene."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse, unquote
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, sys, time
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "assets" / "library" / "1k"
CACHE = ROOT / ".runtime" / "asset-metadata"
UA = {"User-Agent": "MeridianGalleria-AssetPreparation/1.0"}
MATERIALS = {
 "terrazzo_tiles": "Warm terrazzo tile for atrium floor and perimeter accents",
 "interior_tiles": "Food court and secondary ceramic floor",
 "white_plaster_02": "Main painted walls and columns",
 "plastered_wall_04": "Subtle aged plaster in secondary galleries",
 "ceiling_interior": "Fine ceiling surface finish; panel-grid geometry remains separate",
 "dirty_carpet": "Arcade carpet; tint to the scene palette",
 "marble_mosaic_tiles": "Dry fountain mosaic",
 "metal_plate_02": "Aged steel in service areas; not polished handrail metal",
 "painted_metal_shutter": "Painted metal and shutter variations",
 "rusty_painted_metal": "Localized worn metal in service areas",
 "denim_fabric_06": "Fine dark fabric weave for the photo-booth curtain; tint during integration",
}
MODELS = {
 "portable_generator": "Service alcove; keep switched off indoors",
 "rollershutter_window_01": "Wide closed storefront shutter; use clean material variant",
 "rollershutter_door": "Narrow shutter with top housing; use clean material variant",
 "mounted_fluorescent_lights": "Detailed fluorescent fixture kit",
 "plastic_monobloc_chair_01": "The one remaining food-court chair",
 "modular_street_seating": "Wood-and-metal bench modules for gallery seating",
 "CashRegister_01": "Optional vintage mechanical register for a closed-store display; not the primary 2004 food-court till",
 "metal_trash_can": "Service-area bin, not the primary decorative mall bin",
 "cardboard_box_01": "Sparse abandoned packaging",
 "trashbag": "One service-area refuse bag",
}
HDRIS = {"subway_entrance": "Indoor fluorescent lighting reference and reflections"}
CATALOG = {}
for kind in ("textures", "models"):
 p=ROOT/".runtime"/("polyhaven-"+kind+".json")
 if p.exists(): CATALOG.update(json.loads(p.read_text(encoding="utf-8-sig")))
def get_json(url):
 with urlopen(Request(url,headers=UA),timeout=45) as r: return json.load(r)
def metadata(asset):
 CACHE.mkdir(parents=True,exist_ok=True)
 p=CACHE/(asset+".json")
 if p.exists(): return json.loads(p.read_text())
 data=get_json("https://api.polyhaven.com/files/"+asset)
 p.write_text(json.dumps(data),encoding="utf-8");return data
def map_file(meta, key):
 choices=meta.get(key,{}).get("1k",{})
 for fmt in ("jpg","png"):
  if fmt in choices: return choices[fmt]
 return None
def record(asset,kind,purpose,meta):
 info=CATALOG.get(asset,{})
 return {"id":asset,"kind":kind,"name":info.get("name",asset.replace("_"," ").title()),
 "purpose":purpose,"source":"https://polyhaven.com/a/"+asset,"license":"CC0-1.0",
 "license_url":"https://polyhaven.com/license","authors":info.get("authors",{}),
 "resolution":"1k","source_polycount":info.get("polycount"),
 "source_dimensions_mm":info.get("dimensions"),"files":[]}
def file_record(meta,rel,role):
 if not meta: raise ValueError("Missing required map "+role)
 if meta["size"]>8*1024*1024: raise ValueError("Individual asset file is too large: "+rel)
 # Shared geometry may reside in the provider's /8k/ path. It contains no pixels.
 if Path(rel).suffix.lower() in (".jpg",".png",".hdr") and "_1k" not in Path(rel).stem:
  raise ValueError("Unexpected resolution: "+rel)
 return {"path":rel,"role":role,"url":meta["url"],"bytes":meta["size"],"md5":meta["md5"]}
def plan_one(item):
 asset,kind,purpose=item;meta=metadata(asset);out=record(asset,kind,purpose,meta)
 folder={"material":"materials","model":"models","hdri":"hdris"}[kind]+"/"+asset
 if kind=="material":
  for key,role in [("Diffuse","albedo"),("nor_gl","normal_gl"),("arm","ao_roughness_metalness")]:
   entry=map_file(meta,key)
   out["files"].append(file_record(entry,folder+"/"+Path(urlparse(entry["url"]).path).name,role))
  out["channel_mapping"]={"arm":{"R":"ambientOcclusion","G":"roughness","B":"metalness"}}
  out["color_space"]={"albedo":"sRGB","normal_gl":"linear data","ao_roughness_metalness":"linear data"}
 elif kind=="model":
  gltf=meta.get("gltf",{}).get("1k",{}).get("gltf")
  if not gltf: raise ValueError("No 1K glTF for "+asset)
  out["files"].append(file_record(gltf,folder+"/"+Path(urlparse(gltf["url"]).path).name,"gltf"))
  for rel,entry in gltf.get("include",{}).items():
   out["files"].append(file_record(entry,folder+"/"+rel,"buffer" if rel.endswith(".bin") else "texture"))
  out["entry"]=out["files"][0]["path"]
 else:
  entry=meta["hdri"]["1k"]["hdr"]
  out["files"].append(file_record(entry,folder+"/"+Path(urlparse(entry["url"]).path).name,"environment"))
 out["bytes"]=sum(f["bytes"] for f in out["files"])
 if out["bytes"]>10*1024*1024: raise ValueError("Package too large: "+asset)
 return out
def plan():
 items=[(k,"material",v) for k,v in MATERIALS.items()]+[(k,"model",v) for k,v in MODELS.items()]+[(k,"hdri",v) for k,v in HDRIS.items()]
 with ThreadPoolExecutor(max_workers=3) as pool: assets=list(pool.map(plan_one,items))
 total=sum(a["bytes"] for a in assets)
 if total>80*1024*1024: raise ValueError("Library exceeds 80 MiB staging budget")
 out={"version":1,"resolution_policy":"Only 1K source images; never download 2K/4K/8K maps",
 "notes":["ARM is three independent PBR maps packed into RGB, not a single color image.",
 "Provider /8k/ paths used for shared .bin geometry do not imply 8K textures.",
 "Library is staged outside public/ and is not loaded by the current scene."],
 "assets":assets,"bytes":total}
 LIB.mkdir(parents=True,exist_ok=True)
 (LIB/"manifest.json").write_text(json.dumps(out,indent=2),encoding="utf-8")
 for a in assets: print(f'{a["kind"]:8} {a["id"]:34} {a["bytes"]/1048576:5.2f} MiB / {len(a["files"])} files',flush=True)
 print(f"TOTAL {len(assets)} assets / {total/1048576:.2f} MiB",flush=True)
def safe_path(rel):
 path=(LIB/rel).resolve()
 if not path.is_relative_to(LIB.resolve()): raise ValueError("Asset path outside library: "+str(path)+" / "+str(LIB.resolve()))
 return path
def digest(path,algo="md5"):
 h=hashlib.new(algo)
 with path.open("rb") as f:
  for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
 return h.hexdigest()
def download_file(f):
 p=safe_path(f["path"])
 if p.is_file() and p.stat().st_size==f["bytes"] and digest(p)==f["md5"]: return
 p.parent.mkdir(parents=True,exist_ok=True)
 temp=p.with_suffix(p.suffix+".part")
 for attempt in range(3):
  try:
   size=0
   with urlopen(Request(f["url"],headers=UA),timeout=60) as r, temp.open("wb") as dest:
    while chunk:=r.read(131072):
     size+=len(chunk)
     if size>f["bytes"]: raise ValueError("Unexpected download size")
     dest.write(chunk)
   if size!=f["bytes"] or digest(temp)!=f["md5"]: raise ValueError("Checksum or size mismatch: "+f["path"])
   temp.replace(p);return
  except Exception:
   if attempt==2: raise
   time.sleep(1+attempt)
def download():
 data=json.loads((LIB/"manifest.json").read_text())
 for a in data["assets"]:
  for f in a["files"]: safe_path(f["path"]).parent.mkdir(parents=True,exist_ok=True)
  with ThreadPoolExecutor(max_workers=3) as pool: list(pool.map(download_file,a["files"]))
  print("Downloaded "+a["id"],flush=True)
 validate()
def validate():
 data=json.loads((LIB/"manifest.json").read_text());count=0;max_image=0
 for a in data["assets"]:
  for f in a["files"]:
   p=safe_path(f["path"]);assert p.is_file(),str(p)
   assert p.stat().st_size==f["bytes"] and digest(p)==f["md5"],str(p)
   f["sha256"]=digest(p,"sha256")
   if p.suffix.lower() in (".jpg",".png"):
    with Image.open(p) as image:
     image.verify()
    with Image.open(p) as image:
     assert max(image.size)<=1024,(str(p),image.size)
     f["dimensions"]=list(image.size);max_image=max(max_image,*image.size)
   if p.suffix==".hdr":
    import re
    dimensions=re.search(rb"-Y (\d+) \+X (\d+)",p.read_bytes()[:1024])
    assert dimensions,str(p)
    h,w=map(int,dimensions.groups());assert max(w,h)<=1024
    f["dimensions"]=[w,h]
   count+=1
  if a["kind"]=="model":
   p=safe_path(a["entry"]);g=json.loads(p.read_text())
   for obj in g.get("images",[])+g.get("buffers",[]):
    uri=obj.get("uri","")
    if not uri or uri.startswith("data:"):continue
    assert not urlparse(uri).scheme,"External glTF dependency"
    target=(p.parent/unquote(uri)).resolve()
    assert target.is_relative_to(p.parent.resolve()) and target.is_file(),str(target)
   tris=0
   for mesh in g.get("meshes",[]):
    for primitive in mesh["primitives"]:
     if primitive.get("mode",4)==4:
      idx=primitive.get("indices")
      tris+=(g["accessors"][idx]["count"] if idx is not None else g["accessors"][primitive["attributes"]["POSITION"]]["count"])//3
   a["gltf_triangles"]=tris;a["gltf_meshes"]=len(g.get("meshes",[]))
 data["validation"]={"file_count":count,"largest_image_dimension":max_image,"hashes_verified":True,"gltf_references_verified":True}
 (LIB/"manifest.json").write_text(json.dumps(data,indent=2),encoding="utf-8")
 print(f"VERIFIED {count} files; images <= {max_image}px; hashes and glTF dependencies OK",flush=True)
if __name__=="__main__":
 {"plan":plan,"download":download,"validate":validate}[sys.argv[1] if len(sys.argv)>1 else "plan"]()
