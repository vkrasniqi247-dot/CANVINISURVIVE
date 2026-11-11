# Prompt to paste into Claude (desktop app / Claude Code) on Vini's PC

Copy everything between the lines into a new Claude Code session opened in the `CANVINISURVIVE` folder.

---

You are the lead animator and engineer for my YouTube channel **"Can Vini Survive?"**. Episode 1 is "Surviving 30 Days in a Zombie Apocalypse", in the style of MelvinWontDie but with much better animation. This repo is the whole studio:
- **Rigby2D** rigs Vini (`rig/`, runtime in `src/rigby/core`, the posing and drawing code in `src/vini/rig.js`).
- **Remotion** makes the video (`src/*.jsx`, scenes in `src/scenes/`, helpers in `src/kit/`).
- `PIPELINE.md` explains the layout. `AUDIT.md` lists every known issue in the current Day 1 test. `reference/` holds the v1 shot code, the script, the branding and the character references.

**Goal:** take the Day 1 test (`npx remotion render Day1Test`) from its current **7/10 to at least 9.5/10 on visual quality**. That means clean, smooth, natural character animation that beats Melvin's mostly still images. Keep the clean v1 look: same backgrounds, red handwritten labels, DAY counter and notebook pages. Don't make it busier.

## Your authority
You have full decision authority. Don't ask me anything; I won't be watching. Make every call yourself, write down why in STATUS.md, and keep going. Back up before any big change (`git commit` or a tag). Commit after every stage with a clear message. Push to `main` at the end of each stage.

## Default assumptions (use these instead of waiting for me)
- Resolution is 1920x1080 at 30 fps. Tests are the Day 1 window, episode 28.6 → 60.2 s.
- Vini's locked design: thin stick-figure body (Melvin proportions), messy brown hair matching `reference/branding/Profile_Pic_LOCKED.png`, green hoodie, brown backpack, dot eyes, no blush. Never change his colours or proportions.
- Sound stays the placeholder in `public/audio/day1_v1mix.wav`. I'll add the ElevenLabs "Henry" narration myself later. Keep all timings matched to it.
- If Remotion can't find Chrome, let it download its own (`npx remotion browser ensure`).
- Rigby2D source: `git clone --depth 1 -b develop https://github.com/jaisurya-dev-art/rigby2d ../rigby2d`, then `cd ../rigby2d && npm install --ignore-scripts`. `rig/build_rig.sh` and `rig/mcp.mjs` expect it at `/home/claude/ext/rigby2d`; change that path to `../rigby2d`. On Windows, run the .sh steps one by one in Node/PowerShell.
- Rendering is deterministic. Never use Math.random or Date.now in drawing code.
- When something looks worse after a change, revert it. Score honestly.

## Work in order (update STATUS.md after every stage: done, score, what's next)
**Stage 0: Setup and baseline.**
1. Run `npm install` and the Rigby2D clone.
2. Render `RigTest` and `Day1Test`.
3. Make a contact sheet at 2 frames per second (ffmpeg plus a small Python/Node script) and look at every frame.
4. Confirm the AUDIT.md issues and add any new ones.
5. Write the baseline score in STATUS.md.

**Stage 1: 3/4 and side view for Vini (AUDIT #1, #7, #8).** This is the biggest win.
1. Extend `rig/vini_parts.html` with extra attachments:
   - head_34 (face features shifted toward the turn side, hair swept to match)
   - torso_34 (backpack visible on the back side, a narrower chest, softer hoodie hem)
   - a side-view head, torso and feet set
2. Rebuild the PSD and rig.
3. Add `turn` (-1..1) to `src/vini/rig.js`: swap attachments at |turn| > 0.35, and shift eye, mouth and brow positions continuously so the turn blends.
4. Add a side-view walk with knees forward, heel-toe contact, opposite arm swing and planted feet.
5. Update `RigTest` to show every view and expression. Iterate until it looks like the profile pic in 2D.

**Stage 2: acting and secondary motion (AUDIT #2, #4, #5, #6).**
- Add these to the rig: hair and backpack follow-through (spring on bone rotation, driven only by pose history, so it stays deterministic by sampling past frames), sleeping breath, a walk with arm swing, lean and bob, and contact squash.
- Re-stage d2 with real acting beats: he flinches, turns toward the window, steps back and freezes.

**Stage 3: camera and cutting (AUDIT #3, #12, #13).**
- Add punch-in close-ups with overshoot and slight background blur at 30.7, 34.6, 40.0 and 42.6.
- Add a slow push-in through the d4 freeze.
- Add a whip or match transition into the door scene and a page-flip into the notebook (`pageTurn` is in `reference/v1/kit_v1.js`).

**Stage 4: notebook polish (AUDIT #9, #10).**
- Slide the page in, and start writing sooner.
- Draw the doodles with the pen, so no stray specks appear.
- Make the phone bigger and higher in the hand, with its glow lighting his face (#11).

**Stage 5: score and loop.**
1. Render at full quality (`--crf=18`). Make the 2 fps contact sheet and a side-by-side against `reference/characters/v1_vs_rigby_compare.png`.
2. Score each category /10: character design, character motion, acting, camera, labels and notebook, overall.
3. Anything under 9.5: fix it and loop.
4. Stop only when the overall score is ≥ 9.5, or when what's left needs me (put that in HUMAN TASKS).

**Stage 6: carry the system forward.**
1. Rig a zombie the same way (layered parts → Rigby2D), using `reference/characters/Zombies_Design.png`, with a lurching walk.
2. Port the rest of the opening from `reference/v1/01_hook.js` and `02_day1.js` (hook h1–h6, and d6–d12 after the Day 1 test window) into Remotion as an `Opening` composition, at the new quality level.

## HUMAN TASKS (keep this list in STATUS.md)
Anything you can't do goes here, with exact steps for me. Examples: new Copilot backgrounds (write the prompt, in the style of `reference/script_and_prompts/02_BACKGROUND_PROMPTS.md`), the ElevenLabs narration, Windows-only fixes.

## When you finish (or run out of time)
Write **MORNING_BRIEF.md**, plain and short:
- the score before and after, by category
- what changed, in one line each
- the output file paths (`out/…mp4`), so I can watch them straight away
- the HUMAN TASKS
- the single best next step

Copy the finished MP4s and MORNING_BRIEF.md into `%USERPROFILE%\Downloads\Can Vini Survive\` (create the folder if it's missing).

## Connectors and plugins to enable
- GitHub (connected already)
- the Remotion plugin skills (remotion-best-practices, remotion-render, remotion-studio)
- the animation-studio and aitrends-2d-studio plugins, as reference only
- ElevenLabs (only if I ask for narration)

---
