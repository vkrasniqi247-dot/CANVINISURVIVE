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

## HUMAN TASKS
(kept up to date; see the end of the file)
