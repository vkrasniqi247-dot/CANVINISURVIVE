# Day 1 test: audit (11 Nov 2026)

Current score: **7/10** (about the same as v1). Target: **9.5/10**.
Each issue is ranked by how much it costs the score. Times are episode seconds.

## A. Character (biggest gap)
1. **Front view only.** Vini can't turn, so walking across the room (41.9–46.5) is a front-facing scissor step with the legs crossing. v1 had a 3/4 turn. Fix: add 3/4 layers (head with the face shifted, torso with the backpack showing on one side, turned feet) to `rig/vini_parts.html`. Rebuild with `rig/build_rig.sh` and add a `turn` option (-1..1) to `src/vini/rig.js` that swaps or blends the attachments. Also add a proper side-view walk.
2. **Long still holds with no acting.** From 35 to 41.8 he barely moves for about 7 s. Fix: add acting beats. He looks at the phone, flinches at the shout (36.8), and turns his head and body to the window. He takes a small step back, then freezes at the silence (40.0).
3. **Faces are too small to read in wide shots.** Fix: add punch-in close-ups at key moments: wake-up shock (30.7), EMERGENCY ALERT (34.6), "…silence" (40.0), and determined (42.6). Use a quick zoom with overshoot, and blur the background a little.
4. **No secondary motion.** Fix: give the hair and backpack a slight lag and settle on the get-up landing, the flinch and the walk stop. Keep the breathing.
5. **Sleeping is stiff.** Fix: add a slow, visible chest rise and fall, and a small shift before he wakes.
6. **Walk is weak.** Fix: add arm swing opposite to the legs, a body lean that builds as he speeds up, a head bob, and a contact squash on each step. Feet must stay planted, and steps must match the footstep sounds (every 0.49 s).
7. **Crouch bows the knees outward like a frog** (front-view IK). Fix: keep crouch small in front view, or use the 3/4 layers.
8. **The hoodie reads slightly boxy** next to the profile pic. Fix: give it a softer hem curve and slightly tapered sleeves.

## B. Scenes
9. **Notebook doodles start as stray specks.** inkPath begins drawing for a few frames before the shape reads (around 55.6, 56.6 and 58.1). Fix: draw doodles with the pen, faster at the start, so a shape appears straight away.
10. **The notebook page sits nearly empty for about 1.3 s** (52.6–53.9). Fix: slide the page in with a slight rotation and start writing sooner.
11. **The phone in hand sits low and small in d2.** Fix: raise it to chest height, a touch larger, with the screen glow lighting his face.
12. **d4 freeze lasts 6 s.** Fix: add a slow push-in during the freeze so the frame keeps moving.
13. **Transitions are hard cuts everywhere.** Fix: add a match cut or whip-pan into the door scene, and a page-flip into the notebook.

## C. Sound
14. The sound is the v1 placeholder mix. The real ElevenLabs "Henry" narration comes from Vini. Once it arrives, re-time every cue to it. Foley (sofa creak, phone pick-up, footsteps) must land on the frame.

## Score ceiling
Fixes 2–6 and 9–13 are code-only and should take this to about 8.5. Fix 1 (3/4 and side layers) is what gets it to 9+. 9.5 also needs the real narration and tight foley.
