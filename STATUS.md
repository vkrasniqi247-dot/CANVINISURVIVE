# STATUS — Day 1 test (episode 28.6 → 60.2 s)

Target: visual quality ≥ 9.5/10. Each stage: what was done, the score, what's next. Decisions and why are logged under each stage.

## Stage 0 — setup and baseline ✅
- `npm install` OK. Rigby2D was already cloned at `../rigby2d` (develop, 002eb92) with its node_modules.
- `rig/mcp.mjs` and `rig/make_psd.mjs` already resolve Rigby2D at `../rigby2d` (env `RIGBY2D` overrides), so no path change was needed.
- `make_psd.mjs` needed Playwright's own Chromium (not installed). **Decision:** fall back to Remotion's bundled `chrome-headless-shell` (already on disk) instead of downloading another browser.
- Rendered `RigTest` and `Day1Test` (`out/day1_baseline.mp4`, ~60 s render with `--concurrency=8`).
- Contact sheet tool: `python tools/contact_sheet.py <video> <out.png>` (ffmpeg at 2 fps + Pillow, every tile stamped with episode time). Baseline sheet: `out/day1_baseline_contact.png`.

### AUDIT.md check (all 14 confirmed on the baseline render)
#1 front only / scissor walk ✔ (41.9–46.5 legs cross), #2 long still hold 35–41.8 ✔, #3 faces tiny in wides ✔, #4 no secondary motion ✔, #5 stiff sleep ✔, #6 weak walk ✔, #7 frog crouch on get-up ✔ (32.6), #8 boxy hoodie ✔, #9 doodle specks ✔ (55.6, 56.6, 58.1), #10 empty page 52.6–53.9 ✔, #11 phone low/small ✔, #12 6 s static freeze ✔, #13 hard cuts ✔, #14 placeholder sound ✔.

### New issues found
15. **`look` x was inverted** in `rig.js` (+1 looked screen-left), so in d3 he walks right while looking back over his shoulder.
16. **Phone arm** (d1 end, d2): the forearm folds back horizontally and the phone floats beside the elbow, not in front of the chest (35.5).
17. **Walk bob is upside down**: hips are lowest mid-step and highest at contact (should be the opposite).
18. **d4 freezes mid-stride** with the legs crossed, which reads as a glitch rather than a freeze-frame.
19. **Pen appears in the black margin** at 52.6–52.8 before the page has faded in.
20. **RigTest sheet was clipped** (top row of heads cut off by the canvas edge).

### Baseline score (honest, out of 10)
| category | score |
|---|---|
| character design | 7.0 |
| character motion | 6.0 |
| acting | 5.5 |
| camera | 6.0 |
| labels & notebook | 7.5 |
| **overall** | **7.0** |

## Stage 1 — 3/4 and side view (AUDIT #1, #7, #8) ✅
- `rig/vini_parts.html`: new hidden layers `torso_t34`, `torso_side`, `backpack_t34`, `backpack_side`, `hair_t34`, `hair_side`, `foot_l_side`, `foot_r_side`. Hoodie: tapered sleeves and a rounded hem (#8).
- `rig/build_rig.mjs` (Node, works on Windows) replaces the .sh steps; `rig/patch_views.mjs` folds each variant (`rig/variants.json`) into its base slot as an alternate image. **Decision:** variants share the base slot instead of getting their own bones, because every layer is drawn on the same 900×1400 canvas, so a variant lines up exactly with the base attachment's offset and the skeleton stays identical (checked: bones unchanged within 2 px).
- **Decision:** no head variant: the head is a circle, so the face slides round it instead (eyes, brows, mouth shift continuously with `turn`, the far eye/brow hide past 0.8).
- `src/vini/rig.js`: `turn` (-1..1). Body treated as a thin 3D figure (x = L·cos a + F·sin a), so shoulders, hips, feet and hands move continuously; art swaps at |turn| 0.35 (3/4) and 0.8 (side); far arm and far leg go behind the body; left turns mirror him. Arm presets got a forward value so poses read in profile.
- Side walk: knees forward, feet kept level with heel-toe roll, arms swing opposite their own leg, hips lowest at contact (fixes new #17), contact squash.
- Fixed new #15 (`look` x inverted) and #16 (phone now held in front of the chest, bigger).
- Scenes: get-up swings through 3/4 (no frog knees, #7); d3 turns to the door and walks there in side view; the d4 freeze is a clean profile pose pointing at the door (#18).
- `RigTest` now has 4 frames: views, expressions per view, side walk cycle + crouches, big heads.

Score after Stage 1: design 8.3 · motion 7.4 · acting 6.0 · camera 6.0 · labels & notebook 7.5 · **overall 7.6**.
Next: Stage 2 (follow-through, breathing, d2 acting beats).

## Stage 2 — acting and secondary motion (AUDIT #2, #4, #5, #6) ✅
- `follow()` in `rig.js`: a damped spring driven by the history of a driver function (convolution of the driver's acceleration with the spring's impulse response over the last 1.6 s, fixed 1/120 s samples). Any frame renders on its own and always gives the same answer, no state, no randomness.
- Hair slides over the skull (rotates about the head centre) and the backpack swings about its top; a light quick spring for hair, a heavy slow one for the pack. Drivers: d1 = head position along his body axis (he starts lying down), d2 = startle hop + step back + turn, d3 = walk travel + turn.
- **Decision:** `lean`, `headTilt`, `hipX`, `hairLag`, `packLag` are screen-space (+ = toward screen-left) and are negated when he's mirrored, so nothing pops when `turn` crosses 0.
- Sleep: slow visible breath (2.9 s), a stir as the phone starts buzzing (30.2), a jolt when his eyes open (30.7); faster panicked breathing after. Landing squash on the get-up.
- d2 re-staged: reads the alert → flinches at the shout (36.85, hand to face, body jerks away) → eyes, head, body turn to the window → curious lean in → backs off a step (38.95) and closes his feet → gasps and freezes at the silence (40.0, breath held, idle slowed to 12 %) → turns back to us (41.0–41.6). d3 starts from where the step left him.
- Walk (from Stage 1): arm swing tied to the steps, lean that builds with speed, hips lowest at contact, contact squash.

Score after Stage 2: design 8.3 · motion 8.0 · acting 7.4 · camera 6.0 · labels & notebook 7.5 · **overall 8.0**.
Next: Stage 3 (punch-ins, d4 push-in, transitions).

## Stage 3 — camera and cutting (AUDIT #3, #12, #13) ✅
- `kit.js`: `punchK` / `punchView` / `punches`: a 0.24 s zoom with an outBack overshoot, a hold, and a 0.45 s ease out; the background (painted plate only) blurs up to 3.5 px while the character stays sharp, which reads as a shallow depth of field.
- Punch-ins: wake-up shock 30.7 (z 2.75 on his face, out before "47 missed calls"), EMERGENCY ALERT 34.6 (held to the cut, so the cut to the d2 wide acts as the pull-back), "…silence" 40.0 (z 2.5), determined 42.6 (z 2.3, tracks him while he walks, out before the "instinct" label at 43.7).
- d4 freeze: a slow 6 s sine push-in (+24 % zoom, drifting toward him); labels are anchored to the scene so they ride the push.
- Whip pan d2 → d3 at 41.8 (±0.16 s): shot rendered offscreen, slid left with a growing 12-tap running-average smear and a 10 % zoom so no edge shows; the DAY counter stays steady on top. **Decision:** whip rather than a match cut, because he changes screen position and direction between the shots, and a whip in his travel direction sells the "instinct" impulse.
- Page flip d4 → d5 (52.42–52.92): v1's `pageTurn` ported into `kit.js`; replaces the fade from black.

Score after Stage 3: design 8.3 · motion 8.0 · acting 7.6 · camera 8.6 · labels & notebook 7.6 · **overall 8.4**.
Next: Stage 4 (notebook polish, phone glow).

## Stage 4 — notebook polish and phone (AUDIT #9, #10, #11) ✅
- The page flips in over the freeze, slides 60 px and untwists 2° as it lands with a tiny settle; "RULE 1" starts writing at 52.62 (was 52.78) at 12 cps and gets a red underline, so the page is never empty (#10). STAY INSIDE moved 0.1 s earlier, still on the voice.
- Doodles are drawn by the pen, stroke by stroke in order (door frame, then handle; window frame, then the cross), with an ease-out so the first stroke goes down fast and a shape reads at once: no stray specks (#9). Only one pen is ever on the page: the text pen hides while a doodle is being drawn.
- Phone: held at chest height, larger (Stage 1); its screen light now spills over his face and hoodie (screen blend, pulsing with the alert) (#11). The rig passes each prop the face position.
- Full-quality render: `out/day1_test.mp4` (`--crf=18`), sheet `out/day1_contact.png`.

## Stage 5 — score and loop ✅ (loop 1 done)
Full render `out/day1_test.mp4` (crf 18), sheet `out/day1_contact.png`, side-by-side with the reference `out/compare_v1_rigby_new.png` (left two columns = the reference v1 / old Rigby frames, right column = now).

Loop 1 fixes (things the first scoring pass flagged):
- d2 was a wide where his acting was too small to read → medium shot (z 1.42→1.62) that keeps him and the window both in frame.
- Front-view dips (flinch, landing) still bowed the knees → in front view the legs now **foreshorten** (knees toward camera) instead of bending sideways.
- Blinks were a fixed 3.4 s metronome → hashed blink times per 2.6 s cell plus occasional double blinks (still a pure function of time).
- Phone light on his face was too hot in the close-up → toned down.
- The green ticks still started as a speck → ease-out ticks; text under each doodle starts 0.12 s sooner.

### Score (honest, /10)
| category | baseline | now |
|---|---|---|
| character design | 7.0 | 8.8 |
| character motion | 6.0 | 8.7 |
| acting | 5.5 | 8.4 |
| camera | 6.0 | 8.9 |
| labels & notebook | 7.5 | 8.8 |
| **overall** | **7.0** | **8.7** |

What still holds it under 9.5:
1. **Sound** — the placeholder v1 mix. Timing, foley and the punch-ins can only be locked to the real narration (HUMAN TASK 1). AUDIT.md's own ceiling note says the same.
2. Profile-view hair and the lying-down wake-up are still the weakest drawings (the face reads sideways while he lies on the sofa, same staging as v1).
3. d4's 6 s freeze is now moving (push-in) but is still the longest beat without character motion; with the real narration it may want trimming.
**Decision:** stop looping on Day 1 here and move on to Stage 6, because the remaining points need the real voice track; more code polish without it risks re-timing everything twice.

## Stage 6 — carry the system forward ✅
- **Zombie rig:** `rig/zombie_parts.html` (same canvas and skeleton landmarks as Vini) → `node rig/build_rig.mjs zombie` → `public/zombie/`. Office worker (base), hi-vis worker and hoodie teen outfits from `Zombies_Design.png` (grey-green skin, blank pale eyes, stained ragged clothes), plus clean `_jacket` / `_coat` clothes and `_human` head, eyes and hair for the panicking runners. `build_rig.mjs`, `make_psd.mjs`, `patch_views.mjs` now take the character name.
- **Decision:** one runtime for every character: `rig.js` picks `<part><outfit><view>` with fallbacks, so the zombie reuses the turn system; it has no profile torso art, so its front torso is narrowed when turned (cheap and fine at street distance).
- Lurch (`src/zombie/zombie.js`): walking at camera = `march` (steps in place, the scene moves and scales him): hips sway over the standing foot and dip on the dragged right leg; in profile = planted-feet walk with `drag`; head loll with an occasional jerk, reaching arms that sway, forward lean. Check sheet: `RigTest` frame 4.
- **Opening** composition (`src/Opening.jsx`, 105.4 s): hook h1–h6 (`scenes/hook.js`), the Day 1 test (`scenes/day1.js`), d6–d12 (`scenes/day1b.js`). Same timings and labels as v1. Upgrades over v1: rigged characters throughout, punch-ins (h2 "question", d6 "…that BITE", d11 terror), every notebook doodle drawn by the pen, page flips between notebook pages, whip pans into the street (60.2) and back into the flat (91.0), a dip to black into MIDNIGHT. Sound: v1 placeholder voice, the v1 Day 1 mix in its window, and the groan files at their cues.
- Render: `out/opening.mp4` (crf 18, 4 m 50 s on this PC), sheet `out/opening_contact.png`.
- Opening score (honest): about **8.3** overall: the Day 1 window is the 8.7 above; the hook and d6–d12 got the rig and transitions but not the same per-beat acting pass (d6 opens on ~3 s of empty street, as in v1).

## HUMAN TASKS
1. **Narration (blocks 9.5).** Record the ElevenLabs "Henry" narration from the script (`reference/script_and_prompts/01_SCRIPT_Surviving_30_Days.md`), export one WAV for 0–105.4 s, put it in `public/audio/` (e.g. `vo_opening_henry.wav`) and run the follow-up prompt: every cue gets re-timed to it.
2. **Foley/music stems.** The v1 synthesized sfx (pop, hit, whoosh, footsteps, phone buzz) only exist inside `day1_v1mix.wav`, so the Opening outside 28.6–60.2 has voice + groans only. If you want them, export the v1 sfx as separate WAVs into `public/audio/sfx/` (names as in `reference/v1/shots_opening.json`) and I'll place them on their cues.
3. **Two missing backgrounds** (README says 6 of 8 done): generate them in Copilot with the prompts already in `reference/script_and_prompts/02_BACKGROUND_PROMPTS.md`, save as PNG into `public/bg/`; the follow-up prompt crops, colour-matches and grains them.
4. Watch `Downloads\Can Vini Survive\day1_test.mp4` and say if the punch-ins or the whip feel too much; they're one number each in `src/scenes/day1.js`.
