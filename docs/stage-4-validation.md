# Stage 4 — sound, interaction and atmosphere

Implemented for the English browser experience. Work stops after this stage for user review; broad hardware/browser tuning and release preparation remain stage 5.

## Sound

Original procedural Web Audio supplies ventilation, spatial fluorescent hum, quiet arcade electronics and slowly drifting ambient tones. A generated stereo impulse provides a restrained room tail, with a stronger send around the atrium. Footsteps depend on actual distance traveled and switch between tile, escalator metal and arcade carpet. Collisions do not create movement distance.

Audio is created and resumed on the Enter/Continue user gesture. Pausing, reading or losing focus clears movement and fades the master bus to silence, then suspends the audio context. Continuous nodes are created once per visit; short response and footstep nodes disconnect when finished. A compressor limits the combined output. There are no audio-file downloads, song samples or speech.

## Optional interactions

Look at a nearby item and press E. Selection checks distance (2.8 metres), view direction, the item's front face and scene occlusion.

Six readable panels: the October event poster, fountain maintenance, Soft Season relocation, token pricing, the food-court renovation promise and staff closing instructions. The token sign was moved clear of the last arcade cabinet so visitors can approach it without squeezing behind the machines.

The lit arcade start button gives a brief electronic response and small screen-brightness change. The staff-door handle moves briefly, accompanied by a soft mechanical response. Both display English text feedback and have a short repeat cooldown. There are no new objectives, inventory items or compulsory actions.

Reading uses a native modal dialog with a legible paper treatment, contained keyboard focus and a paused world. Continue exploring resumes on a user gesture; Esc returns to the pause menu. Initial focus is placed at the heading to keep the beginning visible on shorter screens.

## Settings

The English Sound & settings dialog offers master volume, mute, ambient music, mouse sensitivity and steady lighting. Values are bounded, validated and stored in localStorage; preferences still work for the current visit if storage is unavailable. Steady lighting defaults to on. Disabling it allows a smooth, small brightness variation in one gallery fixture, not full flashes.

## Verification

- Strict TypeScript and production build passed. Bundle: approximately 795 kB / 233 kB gzip, plus 6.63 kB CSS. The 24.15 MiB visual asset payload is unchanged; no audio payload was added.
- 12 unit tests passed: existing movement/collision behavior plus settings validation, footstep surfaces, interaction distance/facing/occlusion and English narrative content.
- Eight distinct browser scenarios passed across the regression run and targeted correction run. Seven passed initially; the readable-route test found the obscured token sign. After repositioning, the full six-note route and the smaller-window dialog scenario passed again.
- Browser checks cover actual audio signal generation after entry, footstep events, suspension on pause, silence when muted and saved settings after reload. Audio output is measured through an analyser; these checks are not a subjective assessment of the sound mix on headphones.
- All readables were visited on both floors. Both Continue and Escape paths were verified. Arcade and door feedback work without moving the player through the door.
- Existing walking routes, fountain/shop/rail collisions, pointer capture, pause/reset and asset-loading failure handling remain covered.
- Smaller desktop layout checked at 960 × 600, including scrolling to the settings action and restoring focus. Primary captures use 1440 × 900.
- Production smoke check passed for entry, pause and settings, with no page errors or failed HTTP responses. Development controls are absent from the build even with the test query string. See [the production record](stage4-production-validation.json).
- Final dialogs were inspected visually. See [reading](screenshots/stage4-reading.jpg), [settings](screenshots/stage4-settings.jpg) and [the live-browser/audio record](stage4-browser-validation.json).
- Product source, tests, HTML and documentation contain no Cyrillic text.

Headless Microsoft Edge with SwiftShader was used. Real-device frame rates, other browser engines, broader audio listening checks and final loading optimization remain for stage 5. Some visual geometry is still simplified; this stage does not claim to finish photorealistic art production.

## Reproduce

Run `npm test`, `npm run build` and `npm run test:browser`.

With the dev server on port 5193, `node scripts/capture-experience.mjs` creates the panel screenshots and live-browser audio record. With the production preview on port 5195, run `node scripts/verify-production.mjs docs/stage4-production-validation.json`.