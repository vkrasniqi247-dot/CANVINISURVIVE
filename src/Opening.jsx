// src/Opening.jsx — the whole opening (hook + Day 1, episode 0 → 105.4 s) at the new quality level.
// 0–28.6 hook (scenes/hook.js), 28.6–60.2 the Day 1 test (scenes/day1.js), 60.2–105.4 the rest of Day 1 (scenes/day1b.js).
// Sound (placeholder): the v1 voice track, with the v1 Day 1 mix (voice + music + sfx) in its window, plus the groans.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneCanvas } from './SceneCanvas.jsx';
import { drawHook } from './scenes/hook.js';
import { drawDay1, T0 as D1_T0, T1 as D1_T1 } from './scenes/day1.js';
import { drawDay1b, setHud } from './scenes/day1b.js';
import { pageTurn, dayCounter, fade } from './kit/kit.js';
import { whipPan } from './kit/transitions.js';
export const OPENING_FRAMES = Math.round(105.4 * 30);
const at = (g, gt, A) => { g.save(); if (gt < D1_T0) drawHook(g, gt, A); else if (gt < D1_T1) drawDay1(g, gt, A); else drawDay1b(g, gt, A); g.restore(); };
const hud = (g, gt) => dayCounter(g, 1, gt, 28.73);
const WHIPS = [[60.2, 0.16], [91.0, 0.16]], FLIPS = [71.3, 78.2, 83.3];
function drawOpening(g, gt, A) {
  for (const [c, h] of WHIPS) if (Math.abs(gt - c) < h) { setHud(false); return whipPan(g, gt, c, h, (og, t) => at(og, t, A), (g2, t) => { setHud(true); if (t >= c) hud(g2, t); }); }
  setHud(true);
  for (const c of FLIPS) if (gt > c - 0.25 && gt < c + 0.25) return pageTurn(g, (gt - c + 0.25) / 0.5, () => at(g, Math.min(gt, c - 0.01), A), () => at(g, Math.max(gt, c), A));
  at(g, gt, A);
  if (gt > 95.0 && gt < 95.4) fade(g, 1 - Math.abs(gt - 95.2) / 0.2);          // dip to black into midnight
}
const SFX = [['groan_single', 15.0, 0.55], ['groan_single', 20.9, 0.55], ['groan_crowd', 68.7, 0.5], ['groan_single', 100.3, 0.6], ['groan_crowd', 101.95, 0.6]];
export const Opening = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig(), d0 = Math.round(D1_T0 * fps), d1 = Math.round(D1_T1 * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <SceneCanvas t={frame / fps} draw={drawOpening} frame={frame} />
      <Audio src={staticFile('audio/vo_opening_placeholder.wav')} volume={(f) => (f >= d0 && f < d1 ? 0 : 1)} />
      <Sequence from={d0} durationInFrames={d1 - d0}><Audio src={staticFile('audio/day1_v1mix.wav')} /></Sequence>
      {SFX.map(([n, t, v], i) => <Sequence key={i} from={Math.round(t * fps)}><Audio src={staticFile(`audio/${n}.wav`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
