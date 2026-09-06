# Vercel asset loading fix

The initial deployment served the menu and compiled JavaScript, but `/assets/1k/manifest.json` returned HTTP 404. The browser reported `The asset manifest could not be loaded.`

The unanchored `assets/` entry in `.vercelignore` excluded both the source library and `public/assets/1k/`. The prior clean-checkout build did not apply Vercel's ignore rules and therefore missed the deployment failure.

Ignore patterns are now anchored to the repository root. `/assets/` excludes the source library while preserving all public assets. Build scripts are included, and `npm run build` first checks all 69 runtime files against the manifest's byte counts and SHA-256 hashes. Missing or damaged assets now fail the build before publication.

Validation: the old ignore patterns matched all 70 runtime paths (69 asset files plus the manifest); the fixed patterns matched none. A source copy with the deployment filter applied passed `npm ci` and `npm run build`. Negative fixtures verified that the build guard rejects both a missing manifest and a manifest with missing files.

The production smoke test accepts a deployed origin as its fourth argument:

```sh
node scripts/verify-production.mjs .runtime/vercel-validation.json msedge https://dead-mall.vercel.app
```
