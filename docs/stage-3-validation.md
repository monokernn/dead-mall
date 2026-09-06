# Stage 3 — PBR visual revision

This revision replaces the flat surface treatment with local 1K PBR materials, an interior HDR environment and selected glTF props. It establishes the material and lighting foundation; the whole mall is not yet a photorealistic final environment.

## Implemented

- Nine material sets with albedo, OpenGL normal and packed AO/roughness/metalness maps. Physical-size UVs keep wall and floor textures from stretching across large blocks.
- Local HDRI prefiltered with PMREM; restrained environmental illumination, point lights, a shadowed court spotlight and static shadow reuse. ACES Filmic tone mapping and sRGB output.
- Half-resolution SSAO, restrained bloom, SMAA antialiasing and subtle static grain/vignette. Glass and transparent decals do not contribute opaque AO occluders.
- Clean shutter models, actual fluorescent fixtures, assembled benches, the lone plastic chair, a switched-off generator, a torn box and a trash bag.
- Continuous rounded escalator handrails and side panels; beveled octagonal fountain rim, turned pedestal, dry nozzles and coins. These are custom geometry, not downloaded models.
- Modeled ceiling grid, textured booth curtain, floor scuffs and small receipts.
- Static architecture is merged by material. The paused scene redraws only on changes. All product text stays English.
- Loading progress and a recoverable error message if assets are unavailable. Entry remains disabled until the scene is ready.

## Verification

- `npm run build`: passed, including strict TypeScript checking.
- `npm test`: 7 movement tests passed.
- `npm run test:browser`: 5 scenarios passed on the final scene, including entry/movement/pause/reset, the full two-floor route, collisions, a smaller desktop window and failed asset loading.
- Browser test coverage: headless Microsoft Edge with SwiftShader; 1440 × 900 and 960 × 600 viewports.
- Browser-test and live-preview dependency caches are isolated. The smaller-window scenario was checked again while visual captures ran on the live preview; both passed without module cache errors.
- `node scripts/capture-realism.mjs`: final visual captures and [browser report](realism-browser-validation.json), no page errors or failed HTTP responses.
- `node scripts/verify-production.mjs`: [production report](realism-production-validation.json), entry and pause work; all assets load; development controls are absent even with the test query string.
- All 75 files in the built runtime subset match their manifest SHA-256 and byte counts. Every glTF buffer/image reference exists locally. All texture images remain at or below 1024 pixels on either axis.
- No Cyrillic was found in product source, tests, documentation or HTML metadata.
- Captures were inspected directly. Corrections included incompatible geometry indexing during merging, old shop panels obscuring the new shutter slats, glass/decal occlusion, excessive ceiling normals and postprocess edge aliasing.

## Reviewed captures

- [Atrium](screenshots/realism-atrium.jpg)
- [Storefront close-up](screenshots/realism-storefront.jpg)
- [Fountain and escalators](screenshots/realism-fountain.jpg)
- [Food court](screenshots/realism-foodcourt.jpg)

Reproduce these with `node scripts/capture-realism.mjs` while the development server runs on port 5193. The production smoke script expects a Vite preview on port 5195.

## Size and remaining work

The browser subset contains 17 packages and 25,318,016 bytes (24.15 MiB), reduced from 39.80 MiB without increasing or changing texture dimensions. Original downloads remain untouched. The production JavaScript bundle is approximately 779 kB / 227 kB gzip. Vite's standard chunk-size warning remains; broader loading/performance tuning belongs to final polish.

Software rendering verifies behavior and appearance, not hardware frame rates. Other browsers and hardware profiles have not been benchmarked. The main arcade bodies, some counter details and parts of the architecture are still simplified. Fluorescent lighting is currently static; audio, interactions and user settings remain for the next stage. No mobile or touch control is implemented.

Work stops here for user review before the next stage.