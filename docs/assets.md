# Asset provenance

The current scene combines original mall architecture and English artwork with locally stored Poly Haven assets under CC0. The complete source inventory, authors and provider links are in [assets/README.md](../assets/README.md) and its source manifest. No paid service or generated image was needed.

## Runtime materials

Seven 1K PBR sets cover weathered stone tile, peeling paint, plaster, carpet, fountain ceramic, worn steel and curtain fabric. The three new source sets are Peeling Painted Wall, Blue Floor Tiles 01 and Floor Tiles 06. The paint shader remaps the source pink coating to aged off-white while preserving exposed substrate and its normal/ARM maps. Each set supplies an sRGB albedo, an OpenGL normal map and an ARM map (R = ambient occlusion, G = roughness, B = metalness). Normal/ARM maps use data color space. Separate map slots read the appropriate channels; these are not color-only materials.

Architecture uses UV coordinates scaled in metres; floor and ceiling planes repeat each map consistently. Dielectric surfaces have zero metalness. Uniform polished brass, stainless trim and clear glass use their respective physical material parameters rather than inappropriate rust textures.

## Models and environment

- Rollershutter Window 01: only the clean variant, fitted to the shop fronts.
- Mounted Fluorescent Lights: one fixture variant, with emissive and unlit instances.
- Modular Street Seating: assembled bench components only.
- Plastic Monobloc Chair 01: the single food-court chair.
- Portable Generator, Cardboard Box 01 and Trashbag: the staff-door area.
- Subway Entrance: 1024 × 512 HDRI, prefiltered for environmental lighting and reflections. The photographed station is not displayed as the background.

All glTF textures and binary dependencies resolve locally. The generator is switched off. Downloaded models not used in this revision stay outside the runtime folder.

The escalators and fountain are original custom geometry, not downloaded models. They have continuous rounded rails, extruded side panels, modeled steps, a beveled octagonal basin, a turned pedestal, dry nozzles and coins. The ceiling grid, architecture, arcade cabinets, signs and booth remain project-created geometry.

## English artwork

Store identities, game titles, autumn posters, directory, notices, dollar-priced menus and the clock face are created locally. No real storefront brands are introduced. Runoff decals, contact-shadow masks, debris, damaged ceiling layout and dry foliage are also created in code. Wet patches share one 512 × 512 reflected view; the shader masks and softly filters it so the floor is not uniformly mirrored.

## Size and reproduction

The source inventory now includes 25 packages. The current 15-package browser subset is 21.36 MiB after JPEG optimization (34.09 MiB before publishing), with unchanged dimensions at or below 1024 pixels. Superseded runtime files are retired only when recorded in the previous generated manifest; their original downloads remain in the source library. Normal and ARM recompression retains full chroma resolution. A recompressed file is used only when smaller than its source.

Run `python scripts/publish-assets.py` to reproduce the runtime subset. `public/assets/1k/manifest.json` records derivative hashes and sizes alongside the original source hashes and license metadata. `assets/library/1k`, `concrete` and `generator` remain unchanged by this publishing step.

## Stage 4 sound

All audio is original procedural Web Audio: generated noise, oscillators, filters, positional emitters and a generated stereo reverberation impulse. There are no third-party recordings, song samples, speech, extra audio downloads or external audio services. The 1K visual asset payload remains unchanged.
