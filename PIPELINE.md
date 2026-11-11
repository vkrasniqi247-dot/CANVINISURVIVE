# Can Vini Survive? — animation pipeline

- **Vini rig:** `rig/` holds the layered art (`vini.psd`) and the scripts that rig it with Rigby2D (`build_rig.sh`). The exported rig lives in `public/vini/`.
- **Runtime:** `src/rigby/core` is the Rigby2D JS runtime. `src/vini/rig.js` poses and draws Vini each frame (arm presets, faces, planted-feet walking, crouch, hand props).
- **Scenes:** `src/scenes/*.js` draw one stretch of the episode as a pure function of episode time. `src/kit/kit.js` has the camera, labels, DAY counter, supply tracker, notebook and write-on helpers.
- **Zombies:** `rig/zombie_parts.html` → `node rig/build_rig.mjs zombie` → `public/zombie/`; drawn by `src/zombie/zombie.js` with the same runtime.
- **Rebuild a rig (Windows OK):** `node rig/build_rig.mjs vini` or `node rig/build_rig.mjs zombie` (needs Rigby2D at `../rigby2d`).
- **Video:** Remotion compositions live in `src/*.jsx`: `Day1Test` (28.6–60.2), `Opening` (0–105.4), `RigTest` (5 check sheets, frames 0–4).
- **Contact sheet:** `python tools/contact_sheet.py out/day1_test.mp4 out/sheet.png` (2 fps, time-stamped).

```
npm install
npx remotion studio                                   # preview
npx remotion render Day1Test out/day1_test.mp4 --crf=18
npx remotion render Opening out/opening.mp4 --crf=18
npx remotion still RigTest out/rigtest.png --frame=0   # rig check sheets (frames 0-4)
```

Sound in `public/audio/day1_v1mix.wav` is a placeholder (the v1 mix), until the real narration is in.
