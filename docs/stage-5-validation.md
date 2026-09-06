# Stage 5: controls, optimization and release preparation

## Changes

- Either Shift increases speed from 1.8 to 4.5 units per second. Diagonal input is normalized. Collision substeps and ramp height checks remain active at sprint speed. Pause, pointer-lock exit and focus loss clear held keys.
- Base mouse sensitivity is 0.0016 radians per pixel, down from 0.002 (20%). Existing custom sensitivity multipliers are preserved; no input-lag-producing camera interpolation was added.
- Static views reuse the previous frame. Camera changes, lamp variation, short object responses, resize and settings changes invalidate it. Audio still runs while standing, but listener parameters and location text update only when the pose changes. Interaction queries run when the pose changes and test a cached opaque-mesh list.
- Static transforms are composed once; the responsive door handle retains its animated transform. Existing merged geometry, instanced debris and static shadow maps are retained.
- Balanced, High and Performance presets are persisted with backward-compatible validation. Pixel budgets are 1,440,000 / 3,686,400 / 576,000 respectively. Balanced keeps all visual effects. Performance disables SSAO and planar reflection while retaining PBR, shadows, bloom and color grading.
- Context MSAA is disabled because the composer already applies SMAA. The menu is a small entry module; the 3D runtime loads separately so the loading UI can appear first.
- Asset sources remain intact. No new texture/model downloads or larger textures were introduced.

## Evidence

15 unit tests passed, including exact sprint ratio, both Shift keys, diagonal speed, sprint ramp traversal/collision, preference migration and pixel budgets. All 9 browser scenarios passed across the full run and targeted audio rerun. These cover the full route, collision, all six readables, optional responses, smaller desktop menus, failed loading, audio lifecycle, saved controls/graphics, sprint release, reduced look gain and idle rendering.

The first audio check timed out because the software renderer advanced less than the 0.72-unit footstep interval in 20 seconds. Diagnostic samples showed active pointer lock, running audio and slow forward progress. The audio scenario now selects Performance before walking; it passes the original timeout and still validates real input, signal, steps, pause/mute and persistence. Balanced movement and sprint remain covered separately. No audio behavior was changed to satisfy the test.

Measured at the entrance with the same camera at a 1440×900 viewport:

| Metric | Balanced | Performance |
| --- | ---: | ---: |
| Drawing buffer | 1440×900 | 960×600 |
| Draw calls across all passes | 622 | 236 |
| Submitted triangles across all passes | 567,951 | 190,012 |
| SSAO / planar reflection | On | Off |

Performance uses 55.6% fewer drawing-buffer pixels and 62.1% fewer draw calls in this view. A stationary active view with steady lighting generated zero extra rendered frames over the 750 ms sampling window. These are workload observations from Edge/SwiftShader, not real-GPU FPS claims. See `stage-5-performance.json` and the balanced/performance screenshots.

Asset verification: 15 packages, 69 files, 55 images, 22,394,669 bytes (21.36 MiB); maximum image dimension 1024 pixels. All recorded hashes and byte counts match. See `stage-5-asset-validation.json`.

The TypeScript/Vite production build passes. Its entry JS is 5.89 kB (2.52 kB gzip), runtime JS 803.22 kB (236.07 kB gzip) and CSS 6.81 kB (2.30 kB gzip). Vite still emits the non-fatal 500 kB chunk advisory for the Three.js runtime; it has not been hidden. Assets dominate first-visit transfer.

Local production verification reports are `stage-5-production-edge.json` and `stage-5-production-chrome.json`. Build output is `dist/`; deployment instructions are in `release.md`. No external deployment was performed.
