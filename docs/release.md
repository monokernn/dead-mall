# Release preparation

For Vercel, import `monokernn/dead-mall` with the repository root as Root Directory. `vercel.json` defines the Vite preset, `npm ci`, `npm run build` and `dist`. No environment variables are required. All runtime assets are committed; source asset libraries are excluded. See the README for deployment settings.

Build with the existing lockfile using Node.js 24:

```sh
npm ci
npm test
npm run build
npm run preview
```

Open the address printed by Vite. The production output is the entire `dist/` directory, including `assets/1k/manifest.json` and all referenced model buffers and images. Serve it over HTTP or HTTPS; double-clicking the HTML file does not work. No backend, API keys, external font requests or asset CDN is required.

The default build targets the root of a static site. For a subdirectory, rebuild with the matching base, for example `npm run build -- --base=/mall/`, and serve the output at `/mall/`. Keep asset paths and filename case intact. Enable normal gzip/Brotli delivery for JavaScript, CSS and JSON when the host supports it. Hashed JavaScript/CSS can be cached immutably; the HTML and unhashed `assets/1k/` files need revalidation when releasing updates.

## Verification

```sh
npm run test:browser
python scripts/check-runtime-assets.py
```

Browser tests need installed Edge and free port 5194. Asset verification needs Python with Pillow and validates SHA-256, file sizes, the 1K image limit and a 25 MiB asset budget without modifying source files.

For the production smoke test, start a local preview on port 5195:

```sh
npm run preview -- --port 5195 --strictPort
node scripts/verify-production.mjs docs/stage-5-production-edge.json msedge
node scripts/verify-production.mjs docs/stage-5-production-chrome.json chrome
```

Checks cover entry, pointer capture, pause, settings, graphics preset selection, asset/console errors and absence of development controls. Edge and Chrome checks use software rendering. Actual hardware frame rate, Safari, Firefox and touch controls are not certified by these checks. The intended experience is desktop keyboard and mouse with WebGL 2.

Before public release, inspect the intended host and walk the scene on the target GPU. This stage prepares a local build only; nothing has been deployed.
