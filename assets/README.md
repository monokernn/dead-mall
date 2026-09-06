# Meridian asset library — 1K

A compact, locally stored asset library for the realism revision. The current mall loads a selected, optimized subset from public/assets/1k; its runtime manifest records the current size. This inventory describes the unchanged downloaded originals.

- Assets: 25.
- Downloaded source files: 112.
- Total source size: 54.87 MiB (57.53 MB).
- Resolution: all downloaded texture images are at most 1024 pixels on either axis; the HDRI is 1024 × 512.
- Integrity and local glTF dependency validation: passed.
- The original user-supplied concrete/ and generator/ examples remain in their original folders.

## Materials

Each set contains albedo, OpenGL normal and ARM. ARM packs three separate data maps: red = ambient occlusion, green = roughness, blue = metalness. Albedo uses sRGB; normal and ARM must remain data textures. No displacement or duplicate DX normal files were downloaded.

| Asset | Intended use | MiB |
| --- | --- | ---: |
| [Terrazzo Tiles](https://polyhaven.com/a/terrazzo_tiles) | Warm terrazzo tile for atrium floor and perimeter accents | 1.64 |
| [Interior Tiles](https://polyhaven.com/a/interior_tiles) | Food court and secondary ceramic floor | 1.60 |
| [White Plaster 02](https://polyhaven.com/a/white_plaster_02) | Main painted walls and columns | 1.31 |
| [Plastered Wall 04](https://polyhaven.com/a/plastered_wall_04) | Subtle aged plaster in secondary galleries | 0.90 |
| [Ceiling Interior](https://polyhaven.com/a/ceiling_interior) | Fine ceiling surface finish; panel-grid geometry remains separate | 2.45 |
| [Dirty Carpet](https://polyhaven.com/a/dirty_carpet) | Arcade carpet; tint to the scene palette | 2.98 |
| [Marble Mosaic Tiles](https://polyhaven.com/a/marble_mosaic_tiles) | Dry fountain mosaic | 2.65 |
| [Metal Plate 02](https://polyhaven.com/a/metal_plate_02) | Aged steel in service areas; not polished handrail metal | 1.80 |
| [Painted Metal Shutter](https://polyhaven.com/a/painted_metal_shutter) | Painted metal and shutter variations | 1.87 |
| [Rusty Painted Metal](https://polyhaven.com/a/rusty_painted_metal) | Localized worn metal in service areas | 1.27 |
| [Denim Fabric 06](https://polyhaven.com/a/denim_fabric_06) | Fine dark fabric weave for the photo-booth curtain; tint during integration | 2.89 |
| [Peeling Painted Wall](https://polyhaven.com/a/peeling_painted_wall) | Peeling off-white wall finish and exposed substrate | 2.03 |
| [Blue Floor Tiles 01](https://polyhaven.com/a/blue_floor_tiles_01) | Weathered blue ceramic for the dry fountain | 1.39 |
| [Floor Tiles 06](https://polyhaven.com/a/floor_tiles_06) | Muted stone tile pattern for the atrium | 0.51 |

## Models

The glTF entry files and all their binary/image dependencies are present. Some assets contain multiple variants or modules: choose the required meshes during integration instead of placing every variant.

| Asset | Intended use | glTF triangles (whole package) | MiB |
| --- | --- | ---: | ---: |
| [Portable Generator](https://polyhaven.com/a/portable_generator) | Service alcove; keep switched off indoors | 26,419 | 3.28 |
| [Rollershutter Window 01](https://polyhaven.com/a/rollershutter_window_01) | Wide closed storefront shutter; use clean material variant | 1,104 | 2.13 |
| [Rollershutter Door](https://polyhaven.com/a/rollershutter_door) | Narrow shutter with top housing; use clean material variant | 1,104 | 2.23 |
| [Mounted Fluorescent Lights](https://polyhaven.com/a/mounted_fluorescent_lights) | Detailed fluorescent fixture kit | 17,820 | 1.75 |
| [Plastic Monobloc Chair 01](https://polyhaven.com/a/plastic_monobloc_chair_01) | The one remaining food-court chair | 3,356 | 1.86 |
| [Modular Street Seating](https://polyhaven.com/a/modular_street_seating) | Wood-and-metal bench modules for gallery seating | 25,156 | 7.27 |
| [Cash Register 01](https://polyhaven.com/a/CashRegister_01) | Optional vintage mechanical register for a closed-store display; not the primary 2004 food-court till | 9,927 | 0.99 |
| [Metal Trash Can](https://polyhaven.com/a/metal_trash_can) | Service-area bin, not the primary decorative mall bin | 13,960 | 4.76 |
| [Cardboard Box 01](https://polyhaven.com/a/cardboard_box_01) | Sparse abandoned packaging | 16,952 | 2.07 |
| [Trashbag](https://polyhaven.com/a/trashbag) | One service-area refuse bag | 4,482 | 1.62 |

## Lighting

- [Subway Entrance](https://polyhaven.com/a/subway_entrance): indoor HDRI, 1K, for fluorescent interior lighting and reflections.

## Asset gaps

No suitable ready-made escalator or mall fountain model was found in the searched Poly Haven model catalogue or ambientCG results. These remain explicit modeling tasks; this download does not claim to provide them. The mosaic and metal materials cover their future surface treatment.

Before placement, inspect model labels for real-world branding and replace unsuitable lettering with original English mall artwork. Keep the roller-shutter clean variant. Retain the food court's single-chair composition. Use the generator, trash can and bag sparingly in the service area.

## File layout

- library/1k/materials/: 11 complete packed PBR sets.
- library/1k/models/: 10 glTF asset packages.
- library/1k/hdris/: 1 interior HDRI.
- library/1k/manifest.json: exact URLs, authors, roles, sizes, hashes and image dimensions.
- library/1k/browser-validation.json: results of loading every model with Three.js in Microsoft Edge.

## Sources and reuse

All newly downloaded source assets are from [Poly Haven](https://polyhaven.com/), under its [CC0 asset license](https://polyhaven.com/license). The user-provided concrete example originates from [ambientCG](https://ambientcg.com/view?id=Concrete042C), whose [asset license](https://docs.ambientcg.com/license/) is also CC0.

Some Poly Haven .bin URLs include /8k/ because one geometry buffer is shared by all texture resolutions. These are geometry files; no 8K images were downloaded.

## Recheck or restore

Run from the project root (Python 3.10+ and Pillow):

    python scripts/prepare-assets.py download
    python scripts/prepare-assets.py validate

The downloader skips already verified files. To repeat the optional browser inspection, start the Vite server on port 5193 and run:

    node scripts/verify-assets.mjs

The browser inspector uses .runtime/verify-assets.html and leaves the mall scene untouched.
