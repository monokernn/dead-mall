from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
lib=root/"assets/library/1k"
data=json.loads((lib/"manifest.json").read_text())
verified=data.get("validation",{}).get("hashes_verified",False)
lines=["# Meridian asset library — 1K","","A compact, locally stored asset library for the realism revision. The current mall loads a selected, optimized subset from public/assets/1k; its runtime manifest records the current size. This inventory describes the unchanged downloaded originals.","",
f'- Assets: {len(data["assets"])}.',
f'- Downloaded source files: {data.get("validation",{}).get("file_count","pending")}.',
f'- Total source size: {data["bytes"]/1048576:.2f} MiB ({data["bytes"]/1000000:.2f} MB).',
'- Resolution: all downloaded texture images are at most 1024 pixels on either axis; the HDRI is 1024 × 512.',
f'- Integrity and local glTF dependency validation: {"passed" if verified else "pending"}.',
'- The original user-supplied concrete/ and generator/ examples remain in their original folders.',
'',
'## Materials','',
'Each set contains albedo, OpenGL normal and ARM. ARM packs three separate data maps: red = ambient occlusion, green = roughness, blue = metalness. Albedo uses sRGB; normal and ARM must remain data textures. No displacement or duplicate DX normal files were downloaded.',
'',
'| Asset | Intended use | MiB |',
'| --- | --- | ---: |']
for a in data["assets"]:
 if a["kind"]=="material":lines.append(f'| [{a["name"]}]({a["source"]}) | {a["purpose"]} | {a["bytes"]/1048576:.2f} |')
lines += ["","## Models","","The glTF entry files and all their binary/image dependencies are present. Some assets contain multiple variants or modules: choose the required meshes during integration instead of placing every variant.","","| Asset | Intended use | glTF triangles (whole package) | MiB |","| --- | --- | ---: | ---: |"]
for a in data["assets"]:
 if a["kind"]=="model":lines.append(f'| [{a["name"]}]({a["source"]}) | {a["purpose"]} | {a.get("gltf_triangles","pending"):,} | {a["bytes"]/1048576:.2f} |' if isinstance(a.get("gltf_triangles"),int) else f'| [{a["name"]}]({a["source"]}) | {a["purpose"]} | pending | {a["bytes"]/1048576:.2f} |')
lines += ["","## Lighting","","- [Subway Entrance](https://polyhaven.com/a/subway_entrance): indoor HDRI, 1K, for fluorescent interior lighting and reflections.","",
"## Asset gaps","","No suitable ready-made escalator or mall fountain model was found in the searched Poly Haven model catalogue or ambientCG results. These remain explicit modeling tasks; this download does not claim to provide them. The mosaic and metal materials cover their future surface treatment.",
"",
"Before placement, inspect model labels for real-world branding and replace unsuitable lettering with original English mall artwork. Keep the roller-shutter clean variant. Retain the food court's single-chair composition. Use the generator, trash can and bag sparingly in the service area.",
"",
"## File layout","","- library/1k/materials/: 11 complete packed PBR sets.","- library/1k/models/: 10 glTF asset packages.","- library/1k/hdris/: 1 interior HDRI.","- library/1k/manifest.json: exact URLs, authors, roles, sizes, hashes and image dimensions.","- library/1k/browser-validation.json: results of loading every model with Three.js in Microsoft Edge.",
"",
"## Sources and reuse","","All newly downloaded source assets are from [Poly Haven](https://polyhaven.com/), under its [CC0 asset license](https://polyhaven.com/license). The user-provided concrete example originates from [ambientCG](https://ambientcg.com/view?id=Concrete042C), whose [asset license](https://docs.ambientcg.com/license/) is also CC0.",
"",
"Some Poly Haven .bin URLs include /8k/ because one geometry buffer is shared by all texture resolutions. These are geometry files; no 8K images were downloaded.",
"",
"## Recheck or restore","","Run from the project root (Python 3.10+ and Pillow):","","    python scripts/prepare-assets.py download","    python scripts/prepare-assets.py validate","","The downloader skips already verified files. To repeat the optional browser inspection, start the Vite server on port 5193 and run:","","    node scripts/verify-assets.mjs","","The browser inspector uses .runtime/verify-assets.html and leaves the mall scene untouched.",""]
(root/"assets/README.md").write_text("\n".join(lines),encoding="utf-8")
print("Wrote assets/README.md")
