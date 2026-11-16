// src/scenes/market.js — motion test in a different place: the supermarket (12.6 s, scene time 0 → 12.6).
// Vini creeps down the aisle, freezes mid-step to look around, spots the trolley, walks to it, takes a tin out,
// admires it… then something CLANGS behind him: he spins round, clutches the tin and sinks down to hide.
// Built on kit/motion.js (armSpring, overlap, withAlive, trackSpring). Every function is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, sm, so, pop, settle, pick, track, camBegin, camEnd, punches, toScreen, camShake, note, fade, vignette } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { armSpring, overlap, withAlive, trackSpring, move } from '../kit/motion.js';

export const MARKET_T1 = 12.6;
const VS = 1.3, FLOOR = 930, STRIDE = 30;
// ---- the walk: 7 steps, a freeze, then 3 more to the trolley. Distance in v1 units; feet stay planted.
// The total ends a fraction into a step where the walk's hip offset is zero, so he settles without a pop.
const D1 = STRIDE * 7, D2 = STRIDE * 3.1087, WA = [0.4, 3.9], WB = [5.7, 7.3];
function seg(t, [a, b], D) { const T = b - a, e = 0.25, x = clamp(t - a, 0, T);     // eased start and stop, constant pace between
  const s = x < e ? x * x / (2 * e) : x > T - e ? (T - e) - (T - x) ** 2 / (2 * e) : x - e / 2; return D * s / (T - e); }
const dist = (t) => seg(t, WA, D1) + seg(t, WB, D2);
const X0 = 1245 - (D1 + D2) * VS, xAt = (t) => X0 + dist(t) * VS;
const speedK = (t) => clamp((dist(t + 0.05) - dist(t - 0.05)) / (0.1 * 62));
// ---- beats
const SPOT = 5.3, REACH = 7.85, GRAB = 8.22, CLANG = 9.9, HIDE = 10.9;
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const turnAt = (t) => track(t, [[4.15, 1], [4.55, 0.5], [5.2, 0.5], [5.55, 1], [CLANG + 0.1, 1], [CLANG + 0.5, -0.6]]);
const leanAt = (t) => -4.5 * speedK(t) - 9 * bump(t, REACH - 0.05, GRAB + 0.45) + 6 * startle(t - CLANG) - 3 * sm(t, HIDE, HIDE + 1.1);
const drive = (t) => xAt(t) + turnAt(t) * 30 - leanAt(t) * 4;
const lags = (t, k = 4) => ({ hairLag: clamp(-follow(drive, t, { freq: 2.6, damp: 0.3 }) * k, -14, 14), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * k * 0.7, -10, 10) });

// ---- the tin
const TIN = [1356, 645];                                   // where it sits in the trolley
function tin(g, x, y, s = 1, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#b9bdc0'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-15, -22, 30, 44, 4); g.fill(); g.stroke();
  g.fillStyle = '#c8262e'; g.fillRect(-15, -10, 30, 22); g.strokeRect(-15, -10, 30, 22);
  g.fillStyle = '#f2e6d0'; g.beginPath(); g.ellipse(0, 1, 8, 6, 0, 0, 7); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -18); g.lineTo(-10, 18); g.stroke(); g.restore(); }
// hand targets for the screen-right arm, from where the tin is: [x, y below shoulder, forward]
const REACH_HAND = [0, (TIN[1] - (FLOOR - 228 * VS)) / VS + 6, (TIN[0] - 1245) / VS];
const SHOW_HAND = [-2, -6, 62], CLUTCH_HAND = [-14, 34, 26];

export function drawMarket(g, t, A) {
  const x = xAt(t), fl = startle(t - CLANG), held = t >= GRAB, hide = sm(t, HIDE, HIDE + 1.1);
  const wide = { z: lerp(1.28, 1.4, sm(t, 0, 7.3)) + 0.12 * hide, x: lerp(905, 1180, sm(t, 0.4, 7.3)) - 60 * sm(t, CLANG, CLANG + 0.8), y: lerp(700, 690, sm(t, 0, 7)) + 20 * hide };
  const c = camBegin(g, A.bg.supermarket, punches(t, wide, [[SPOT + 0.02, 0.3, { z: 2.1, x: x + 60, y: 600 }, 0.4], [8.62, 0.95, { z: 2.3, x: 1300, y: 610 }, 0.4]]), camShake(t, 5, CLANG, 0.4));
  if (!held) tin(g, TIN[0], TIN[1], 0.95, 0.06);
  const turn = turnAt(t), walking = speedK(t) > 0.02;
  const expr = pick(t, [[0, 'worried'], [SPOT, 'shock'], [SPOT + 0.45, 'determined'], [GRAB + 0.3, 'happy'], [CLANG, 'shock'], [CLANG + 0.9, 'scared']]);
  const look = t < 3.95 ? [0.5, 0.1] : t < 4.75 ? [lerp(0.5, -0.9, sm(t, 3.95, 4.1)), 0] : t < SPOT ? [lerp(-0.9, 0.9, sm(t, 4.75, 4.9)), -0.25] : t < REACH ? [0.7, 0.15]
    : t < CLANG ? [0.65, lerp(0.5, -0.1, sm(t, GRAB, GRAB + 0.4))] : [lerp(0.65, -0.9, so(t, CLANG + 0.02, CLANG + 0.14)), 0];
  // screen-left arm: guards his chest while he looks around, throws up at the clang
  const armL = armSpring(t, [[0, 'relaxed'], [4.0, 'chest'], [5.62, 'relaxed'], [CLANG, 'face'], [CLANG + 0.7, 'chest']], { feel: t > CLANG - 0.2 ? 'snappy' : 'arm' });
  // screen-right arm: points at the trolley, reaches in, shows the tin, clutches it
  const armR = armSpring(t, [[0, 'relaxed'], [SPOT + 0.12, 'point'], [SPOT + 0.85, 'relaxed'], [REACH, REACH_HAND], [GRAB + 0.12, SHOW_HAND], [CLANG + 0.05, CLUTCH_HAND]], { delay: 0.04 });
  const crouch = 2.2 * fl + 3 * bump(t, REACH, GRAB + 0.4) + move(t, 0, 13, HIDE, { feel: 'heavy', windUp: 0.05 }) + Math.max(0, settle(t, WB[1] + 0.3, 2.5, 12, 7));
  const energy = (1 - 0.7 * speedK(t)) * (t > CLANG ? 0.4 : 1);
  drawVini(g, A.vini, withAlive({ x, y: FLOOR, s: VS, t, turn, expr, look, lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.7) - 5 * fl + 3 * bump(t, 4.75, SPOT), hipX: 3 * fl, crouch,
    walkDist: dist(t), stride: STRIDE, lift: 13, walkMix: 1 - sm(t, WB[1] + 0.05, WB[1] + 0.45), ...lags(t), breath: breathe(t, t > CLANG ? 0.8 : 1.4, t > CLANG ? 0.8 : 0.5),
    shake: t > CLANG ? 0.25 + 0.45 * fl : 0, arms: [armL, armR], armSwing: walking ? 1 : 0,
    props: { right: held ? (g2, h, info) => tin(g2, h[0] + 2, h[1] - 14 * info.s, 0.95 * info.s / VS * 1.0, 0.1 - 0.5 * fl) : null } }, t, { energy }));
  camEnd(g);
  const [tx, ty] = toScreen(c, 1352, 520), ks = pop(t, SPOT + 0.15) * (1 - sm(t, 7.0, 7.3));
  if (ks > 0) note(g, 'supplies?', tx + 150, ty - 70, { size: 60, k: ks });
  if (t > 8.75 && t < CLANG) note(g, 'BEANS!!', W * 0.72, H * 0.24, { size: 96, k: pop(t, 8.78) * (1 - sm(t, CLANG - 0.25, CLANG)) });
  if (t > CLANG) note(g, 'CLANG', 250 + Math.sin(t * 34) * 4 * (1 - sm(t, CLANG, CLANG + 0.8)), 420, { size: 130, k: pop(t, CLANG), rot: -0.08 });
  if (t > HIDE + 0.5) note(g, '…don’t. move.', W * 0.7, H * 0.2, { size: 64, color: '#2a2622', k: pop(t, HIDE + 0.55) });
  vignette(g, 0.36 + 0.14 * sm(t, CLANG, CLANG + 1)); fade(g, sm(t, MARKET_T1 - 0.35, MARKET_T1)); fade(g, 1 - sm(t, 0, 0.3));
}
