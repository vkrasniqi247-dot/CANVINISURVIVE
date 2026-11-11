# Can Vini Survive? — animation pipeline

- **Vini rig:** `rig/` holds the layered art (`vini.psd`) and the scripts that rig it with Rigby2D (`build_rig.sh`). The exported rig lives in `public/vini/`.
- **Runtime:** `src/rigby/core` is the Rigby2D JS runtime. `src/vini/rig.js` poses and draws Vini each frame (arm presets, faces, planted-feet walking, crouch, hand props).
- **Scenes:** `src/scenes/*.js` draw one stretch of the episode as a pure function of episode time. `src/kit/kit.js` has the camera, labels, DAY counter, supply tracker, notebook and write-on helpers.
- **Video:** Remotion compositions live in `src/*.jsx`.

```
npm install
npx remotion studio                                   # preview
npx remotion render Day1Test out/day1_test.mp4 --browser-executable=/usr/bin/google-chrome
npx remotion still RigTest out/rigtest.png            # rig check sheet
```

Sound in `public/audio/day1_v1mix.wav` is a placeholder (the v1 mix), until the real narration is in.
