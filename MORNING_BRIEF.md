# Morning brief — Can Vini Survive? Day 1

## Score (Day 1 test, out of 10)
| category | before | after |
|---|---|---|
| character design | 7.0 | 8.8 |
| character motion | 6.0 | 8.7 |
| acting | 5.5 | 8.4 |
| camera | 6.0 | 8.9 |
| labels & notebook | 7.5 | 8.8 |
| **overall** | **7.0** | **8.7** |

It's not at 9.5 yet. What's left mostly needs the real narration: timing, foley and the punch-ins can only be locked to the final voice. The full Opening (0–105 s) scores about 8.3.

## What changed
- Vini can turn: 3/4 and side views with a smooth face slide; left turns mirror him.
- Real side-view walk: knees forward, heel-toe, planted feet, arm swing, lean, contact squash.
- Hoodie: tapered sleeves and a rounded hem. The crouch no longer bows out like a frog.
- Hair and backpack follow-through, still deterministic.
- Visible sleep breathing, a stir, a wake-up jolt. Natural blinks.
- d2 has real acting: he flinches, turns to the window, steps back and holds his breath.
- Punch-in close-ups with overshoot and background blur at 30.7, 34.6, 40.0 and 42.6.
- The d4 freeze slowly pushes in. A whip pan into the door scene and a page flip into the notebook.
- Notebook: the page flips in and settles, writing starts sooner, the pen draws every doodle, and there are no stray specks.
- The phone sits at chest height, bigger, and its light falls on his face.
- New zombie rig (office, hi-vis, hoodie teen, plus the human runners) with a lurching, dragged-leg walk.
- New `Opening` composition: hook + all of Day 1 (0–105.4 s) at the new level.
- The rig build works on Windows: `node rig/build_rig.mjs vini|zombie`.

## Watch these
- `Downloads\Can Vini Survive\day1_test.mp4` is the Day 1 test (28.6–60.2), also at `out/day1_test.mp4`.
- `Downloads\Can Vini Survive\opening.mp4` is the whole opening (0–105.4), also at `out/opening.mp4`.
- Check sheets: `out/day1_contact.png`, `out/opening_contact.png`, `out/compare_v1_rigby_new.png`, `out/rig_0.png` … `out/rig_4.png`.

## HUMAN TASKS
1. **Record the narration** (this is what blocks 9.5). Use ElevenLabs "Henry" with the script in `reference/script_and_prompts/01_SCRIPT_Surviving_30_Days.md`. Export one WAV covering 0–105.4 s into `public/audio/`, then paste `prompts/FOLLOW_UP_PROMPT.md`.
2. **Export the sfx (optional).** Outside 28.6–60.2 the Opening only has voice and groans. Export the v1 sound effects as separate WAVs into `public/audio/sfx/` if you want them placed on their cues.
3. **Make the 2 missing backgrounds** with the prompts in `reference/script_and_prompts/02_BACKGROUND_PROMPTS.md`, and drop them into `public/bg/`.
4. Watch the Day 1 test and tell me if the punch-ins or the whip pan feel like too much.

## Single best next step
Record the Henry narration and drop it in `public/audio/`. Everything else is tuned and waiting to be re-timed to it.
