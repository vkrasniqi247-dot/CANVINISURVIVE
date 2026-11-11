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

## HUMAN TASKS
(kept up to date; see the end of the file)
