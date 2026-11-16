# Motion rules (read before writing or changing any character animation)

Code-driven animation looks robotic by default. These rules stop that. Helpers live in `src/kit/motion.js`
(time is in seconds, like everything else in the kit).

## 1. Nothing arrives at a pose and stops dead
- Arm poses: use `armSpring(t, keys, opts)` instead of `armTrack`. Same keys. The hand winds up, overshoots, settles and travels in an arc.
- Scalar acting moves (lean, head tilt, crouch): use `move()` or `trackSpring()` instead of `track()` / `sm()` when the move should have weight.
- Pick the feel on purpose: `snappy` for hands, heads and reactions; `arm` (default) for arm poses; `heavy` for the torso and landings; `soft` when overshoot would look wrong (holding a prop to the chest, careful moves).
- `turn` stays on `track()`: overshoot there can flip the 3/4 and side art at the 0.35 / 0.8 thresholds.
- Camera moves keep `sm()` / `ease.inOut`. Never linear.

## 2. No two body parts start or stop on the same frame
- Give one arm a `delay` of 0.04-0.06 s.
- The head follows the chest late: add `overlap(leanFn, t, 0.09, 0.7)` to `headTilt` (write the lean as a function of time first).
- Hair and backpack keep using `lags()` / `follow()`.
- Order of motion: eyes, head, chest, arms, then hair and backpack.

## 3. He is never frozen
- Wrap the opts of every `drawVini` call in `withAlive(opts, t, { energy })`: weight shift, head drift, eye darts.
- `energy`: 1 normal, 0.4 hiding or holding his breath, 0 for a deliberate freeze-frame, up to 1.8 when panicking.
- Fade it in after a big action (`energy: sm(t, a, b)`) so it never fights the move.
- Keep `breath` on in every shot.

## 4. Poses and timing
- Every key pose must read as a silhouette: hands away from the body.
- Hold a key pose at least 0.3 s. Fast actions take 0.12-0.25 s.
- Push each pose 20-30% further than feels natural.

## 5. Technical
- Pure functions of time only. No `Math.random`, no `Date.now`, no rounding of positions or angles.
- One frame rate (30 fps).

## 6. Checking a shot (required before calling it done)
1. Render the shot to MP4. Do not judge from the studio preview.
2. Every-frame strip of each new move (30 fps, cropped on him), next to the old version.
3. `python tools/contact_sheet.py` over the whole shot to check nothing else broke.
4. Say plainly what could not be verified. Stills cannot show whether the timing feels right: the human watches the MP4.
