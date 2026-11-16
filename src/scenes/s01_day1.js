// src/scenes/s01_day1.js — DAY 1 re-timed to the script-v2 narration (clip 01_day1). The pictures are the existing Day 1
// shots (day1.js + day1b.js, built to the old placeholder voice); WARP maps new scene time → the old episode time sentence by
// sentence, so every shot still lands on its line. Playback runs about 10–20% faster than it was animated.
import { pageTurn, dayCounter, fade } from '../kit/kit.js';
import { whipPan } from '../kit/transitions.js';
import { drawDay1, T1 as D1_T1 } from './day1.js';
import { drawDay1b, setHud } from './day1b.js';
const WARP = [[0, 28.6], [0.5, 28.73], [1.78, 30.22], [7.22, 36.62], [9.62, 39.34], [11.7, 41.89], [15.3, 46.77], [16.9, 48.8], [20.66, 52.78], [24.58, 55.83], [28.58, 60.39], [33.62, 66.31], [39.06, 71.52], [42.34, 74.5], [46.34, 78.36], [50.58, 83.43], [57.22, 91.1], [61.22, 95.4], [64.98, 99.9], [67.06, 101.97], [69.86, 105.3]];   // [scene second, old episode second], one key per sentence start
export const DUR = 69.86;
export const VO = [['01_day1', 0.5]];
export const SFX = [['shout_distant', 7.22], ['groan_crowd', 36.02], ['groan_single', 64.98], ['groan_crowd', 67.06]];
const warp = (t) => { if (t <= 0) return WARP[0][1]; for (let i = 1; i < WARP.length; i++) if (t < WARP[i][0]) { const [a, A] = WARP[i - 1], [b, B] = WARP[i]; return A + (B - A) * (t - a) / (b - a); } return WARP[WARP.length - 1][1]; };
const at = (g, gt, A) => { g.save(); if (gt < D1_T1) drawDay1(g, gt, A); else drawDay1b(g, gt, A); g.restore(); };
const hud = (g, gt) => dayCounter(g, 1, gt, 28.73);
const WHIPS = [[60.2, 0.16], [91.0, 0.16]], FLIPS = [71.3, 78.2, 83.3];
export function draw(g, t, A) { const gt = warp(t);
  for (const [c, h] of WHIPS) if (Math.abs(gt - c) < h) { setHud(false); whipPan(g, gt, c, h, (og, tt) => at(og, tt, A), (g2, tt) => { setHud(true); if (tt >= c) hud(g2, tt); }); return; }
  setHud(true);
  for (const c of FLIPS) if (gt > c - 0.25 && gt < c + 0.25) return pageTurn(g, (gt - c + 0.25) / 0.5, () => at(g, Math.min(gt, c - 0.01), A), () => at(g, Math.max(gt, c), A));
  at(g, gt, A);
  if (gt > 95.0 && gt < 95.4) fade(g, 1 - Math.abs(gt - 95.2) / 0.2);
  fade(g, 1 - Math.min(1, t / 0.3)); fade(g, Math.max(0, (t - (DUR - 0.4)) / 0.4)); }
