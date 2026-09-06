# Reference-driven visual revision

The user supplied a darker, heavily decayed mall reference. This pass changes the material treatment, lighting and atrium composition toward that reference. It is an interactive browser rendering, not a replacement background image or a claim of matching every detail in the supplied image.

## Visual changes

- Paired escalators now sit at x = -1.55 and +1.55 metres. Their meshes, collision ramps, upper-floor openings, railing and ceiling layout share the same coordinates. The fountain stays outside the route to the stairs.
- Cold skylight and restrained local fluorescents replace the broad warm fill. Opaque floor/roof slabs now cast shadows, giving the lower galleries proper shelter from the sky. Small warm wall fittings provide local contrast.
- Peeling coating replaces the uniform mottled wall finish. The source pink paint is remapped to off-white in the material shader while preserving exposed substrate, normal and packed PBR maps. Runoff follows columns and slab edges.
- Suspended ceiling panels are instanced, with seeded missing and slightly displaced panels exposing the darker cavity above. The actual upper floor remains intact and walkable.
- Stone floor tiles have reduced color/contrast and physical repeating scale. Sparse damp patches share one masked, softly filtered 512 × 512 planar reflection. There is no uniformly mirrored floor or full-resolution reflection buffer.
- The fountain uses weathered ceramic and a low central pedestal. Bright decorative rings were removed. Its basin, nearby wall edges and selected floor areas contain 990 instanced shards; dry plants occupy the existing planters.
- Shutters, handrails, signs and trims are muted. The large center sign has moved to the side of the approach, leaving the central composition unobstructed. Product language, audio, settings and the six readable items remain English.

## Assets and budget

Three new CC0 Poly Haven sets were downloaded at 1K: Peeling Painted Wall, Blue Floor Tiles 01 and Floor Tiles 06. Exact provenance and hashes are recorded in the library manifests and [inventory](../assets/README.md).

The runtime subset now has 15 packages / 69 files totaling 22,394,669 bytes (21.36 MiB). This is smaller than the preceding 24.15 MiB subset. Seven PBR surface sets, seven model packages and one HDRI are loaded. Replaced runtime copies were removed only from paths recorded by the previous generated manifest; original downloads and the user's concrete/generator folders remain intact.

No downloaded texture exceeds 1024 pixels on either axis. All production file hashes and local glTF dependencies were verified. Decal masks, debris and foliage are generated locally.

## Verification

- Strict TypeScript and the production build pass. JavaScript is approximately 806 kB / 237 kB gzip. Vite's standard large-chunk warning remains.
- Twelve unit tests pass, including ascent/descent on both relocated ramps, blocked side entry, collision and the continuous upper gallery.
- Five browser scenarios passed for the visual revision: all six readables, entry/walking/pause/reset, both-floor circulation, collision and the smaller desktop layout.
- After moving the escalators together, the three affected browser scenarios passed again: readable routes, full two-floor circulation and fountain/shop/rail collision.
- Browser rendering and final captures are recorded in [the visual report](decay-browser-validation.json). Production entry, pause/settings and console/WebGL errors are checked in [the production report](decay-production-validation.json).
- The live preview runs at http://127.0.0.1:5193/. No external API is needed at runtime.

## Captures

- [Reference-style composition](screenshots/decay-reference.jpg)
- [Entrance view](screenshots/decay-atrium.jpg)
- [Peeling wall and shutter](screenshots/decay-storefront.jpg)
- [Fountain close-up](screenshots/decay-fountain.jpg)

Regenerate with `node scripts/capture-realism.mjs decay` while the development server runs on port 5193.

## Limits

The reference still contains richer structural irregularity, uniquely modeled damage and much denser small-scale detail. Some store and arcade geometry remains simplified. Shadowed galleries, wet reflections and improved materials bring the scene closer in mood; they do not by themselves make the entire mall photorealistic.

Functional/visual checks use headless Microsoft Edge with software rendering. They do not establish hardware frame rates. One additional low-resolution scene render is used for wet-floor reflections; final device benchmarking and release optimization remain separate work.

This visual pass stops for user review.