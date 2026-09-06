# Meridian, 2004

An after-hours walk through Meridian Galleria, an abandoned fictional American mall frozen in October 2004.

Stages 1–5 are implemented: concept, a walkable browser mall, the 1K PBR visual revision, sound/interaction, and optimization with local release preparation. The entire experience is in English. The latest visual revision follows the darker, decayed mall reference: cold skylight, shadowed galleries, peeling paint, missing ceiling panels, debris and sparse wet-floor reflections. The production build is ready for static hosting; it has not been published.

## Deploy to Vercel

Import the GitHub repository `monokernn/dead-mall` into Vercel, keep the project root at the repository root, and select **Deploy**. If the repository is private, grant the Vercel GitHub integration access to it first.

The included `vercel.json` and package metadata configure:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Node.js | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None required |

All playable assets are committed under `public/assets/1k/` and copied into the build automatically. The build checks their presence and integrity before compiling. Keep `.vercelignore` paths anchored to the repository root: `/assets/` excludes only the source library; an unanchored `assets/` also excludes the playable assets. No asset download script, Python setup, Git LFS, external asset hosting or backend is needed for deployment. Open the deployed URL directly in a desktop browser, then click **Enter Meridian** to enable mouse control and audio.

## Run locally

Use Node.js 24. From this directory:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Select **Enter Meridian** to capture the mouse.

- WASD or arrow keys: walk.
- Hold either Shift while moving: run at 2.5× walking speed (4.5 vs 1.8 units per second).
- Mouse: look around, with 20% lower base sensitivity.
- E: read a nearby notice or interact with the object you are looking at.
- Esc: pause and release the pointer; while reading, return to the pause menu.
- Sound & settings: volume, mute, ambient music, mouse sensitivity, steady lighting and graphics quality.
- Return to the entrance: reset your position from the pause menu.

The main target is a desktop browser with a keyboard, mouse and WebGL 2. Use the local server; opening index.html directly is not supported.

## Explore

Both levels are connected by two stopped escalators. Walk the ring of galleries, look into the dry mosaic fountain, visit Orbit Amusements, find the photo booth and explore the empty food court.

The visual environment includes original English storefront identities, autumn posters, a directory, period menus with dollar prices, detailed arcade cabinets, ceiling fixtures, worn materials and a single food-court chair.

Listen for ventilation, nearby fluorescent lamps and distant arcade electronics. An original, restrained ambient bed and room reverberation accompany surface-dependent steps on tile, carpet and escalators. Audio starts only after selecting Enter Meridian and fades out when pausing, reading or leaving the tab.

Six optional readables reveal small traces of the mall's last days: an event poster, a fountain notice, a relocation notice, token pricing, a renovation promise and a closing checklist. Look at an item within reach and press E. The illuminated arcade's start button and the staff-door handle have brief responses. There is no inventory or objective checklist.

Sound, controls and graphics preferences are stored locally in this browser. Steady lighting is on by default; disabling it permits a gentle variation in one gallery light.

## Graphics

Balanced is the default: it keeps PBR materials, shadows, half-resolution SSAO, bloom and wet-floor reflections, with at most 1.44 million drawing-buffer pixels. High increases the pixel budget to 3.69 million and allows up to 1.25× device pixel ratio. Performance limits the buffer to 0.576 million pixels and disables SSAO and planar reflections; materials, shadows and bloom remain.

With steady lighting enabled, standing still reuses the last rendered frame. Moving, looking, interacting, changing settings or resizing redraws the scene. Pause and inactive tabs stop movement and release held sprint keys.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

Browser tests use the installed Microsoft Edge in headless mode and their own server on port 5194. That port must be free. On a machine without Edge, install Playwright Chromium and remove the channel option in playwright.config.ts.

The tests cover sprint speed and release, normalized diagonal movement, render budgets, idle rendering, quality persistence, movement and collision, the full mall route, readable access, optional interactions, audio output and pause/mute behavior, persisted settings, English text and smaller desktop layouts.

Test screenshots are written to .runtime/. Reviewed visual captures are in docs/screenshots/. See [stage 5 validation](docs/stage-5-validation.md) and [release instructions](docs/release.md). See docs/reference-visual-validation.md for the latest visual revision and docs/stage-4-validation.md for sound and interaction validation.

## Build

```sh
npm run build
npm run preview
```

Output goes to dist/. All runtime assets are served locally from public/assets/1k; no external API, account or web font is needed. The selected asset payload is approximately 21.36 MiB, with no texture larger than 1024 pixels. The first visit loads this payload before entry; the menu reports progress.

The original developer workspace keeps downloaded originals in `assets/library/1k/`, plus the user examples in `concrete/` and `generator/`. Those source binaries are excluded from Git and Vercel; their inventory is retained in `assets/library/1k/manifest.json`. A fresh clone already includes all optimized runtime assets and can build immediately. `python scripts/publish-assets.py` is only for reprocessing the full local source library (Python, Pillow and those originals required).

## Source

- src/scene.ts: environment, lighting, prop placement, collision and merged static geometry.
- src/art.ts: original English signage, posters, menus, screen artwork and subtle floor decals.
- src/assets.ts: local PBR, glTF and HDRI loading with bounded concurrency.
- src/decay.ts: damaged ceiling grids, runoff stains, instanced shards, dried foliage and a masked 512-pixel planar reflection.
- src/details.ts: physical-size UVs, beveled geometry and continuous escalator rails.
- src/postprocessing.ts: half-resolution SSAO, bloom, SMAA, tone mapping and a subtle grain/vignette finish.
- src/audio.ts: procedural sound, spatial emitters, footsteps and audio pause lifecycle.
- src/interactions.ts: the eight optional interactions, English copy and selection rules.
- src/settings.ts: validated, locally saved preferences.
- src/movement.ts: walkable surfaces, ramps, collision and location names.
- src/main.ts: lightweight English menu and deferred runtime import.
- src/runtime.ts: renderer, camera, controls and pause lifecycle.
- src/graphics.ts: graphics profiles and drawing-buffer budgets.
- src/style.css: menu and minimal HUD.
- docs/concept.md: experience and stage boundaries.
- docs/assets.md: asset provenance.

Development-only test controls are exposed with ?test. Production builds exclude them.
