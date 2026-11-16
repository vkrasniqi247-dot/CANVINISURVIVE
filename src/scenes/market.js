// src/scenes/market.js — motion test in a different place: the supermarket (12.6 s, scene time 0 → 12.6).
// Vini creeps down the aisle, freezes mid-step to look around, spots the trolley, walks to it, takes a tin out,
// admires it… then something CLANGS behind him: he spins round, clutches the tin and sinks down to hide.
// Built on kit/motion.js (armSpring, overlap, withAlive, trackSpring). Every function is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, sm, so, pop, settle, pick, track, camBegin, camEnd, punches, toScreen, camShake, note, fade, vignette } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';

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
const HALT = 3.9, SPOT = 5.3, REACH = 7.85, GRAB = 8.22, LOWER = 9.25, CLANG = 9.9, HIDE = 10.9;
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
// 3/4 view while he sneaks (the face stays readable), side-on only to reach, then round to face the noise
const turnAt = (t) => track(t, [[4.15, 0.72], [4.5, 0.4], [5.2, 0.4], [5.5, 0.72], [REACH - 0.45, 0.72], [REACH - 0.1, 1], [GRAB + 0.15, 1], [GRAB + 0.55, 0.55], [CLANG + 0.08, 0.55], [CLANG + 0.42, -0.7], [HIDE, -0.7], [HIDE + 0.5, -1]]);
const sneak = (t) => 1 - sm(t, SPOT, SPOT + 0.3);                      // hunched and careful until he spots the trolley
// lean: + = toward screen-left. He faces right until the clang, so forward = negative.
const leanAt = (t) => -4 * speedK(t) - 4 * sneak(t) + 7 * startle(t - HALT) - 7 * bump(t, SPOT + 0.05, SPOT + 1.0) - 15 * bump(t, REACH - 0.1, GRAB + 0.5)
  + trackSpring(t, [[0, 0], [GRAB + 0.3, 7], [CLANG, 0], [CLANG + 0.45, -7], [HIDE, 11]], { feel: 'heavy', windUp: 0.05 }) - 10 * startle(t - CLANG);
const crouchAt = (t) => 3 * sneak(t) + 5 * bump(t, HALT - 0.05, HALT + 0.5) + 4 * bump(t, SPOT, SPOT + 0.25) + 5 * bump(t, REACH, GRAB + 0.4) + 3 * bump(t, GRAB + 0.15, GRAB + 0.45)
  + 7 * startle(t - CLANG) + move(t, 0, 17, HIDE, { feel: 'heavy', windUp: 0.06 }) + Math.max(0, settle(t, WB[1] + 0.3, 2.5, 12, 7));
const drive = (t) => xAt(t) + turnAt(t) * 30 - leanAt(t) * 4;
// hair barely moves (a stiff cap of hair); the backpack keeps its swing
const lags = (t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });

// ---- the tin
const TIN = [1356, 645];                                   // where it sits in the trolley
function tin(g, x, y, s = 1, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#b9bdc0'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-15, -22, 30, 44, 4); g.fill(); g.stroke();
  g.fillStyle = '#c8262e'; g.fillRect(-15, -10, 30, 22); g.strokeRect(-15, -10, 30, 22);
  g.fillStyle = '#f2e6d0'; g.beginPath(); g.ellipse(0, 1, 8, 6, 0, 0, 7); g.fill();
  g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -18); g.lineTo(-10, 18); g.stroke(); g.restore(); }
// hand targets for the screen-right arm, from where the tin is: [x, y below shoulder, forward]
const REACH_HAND = [0, (TIN[1] - (FLOOR - 228 * VS)) / VS + 6, (TIN[0] - 1245) / VS];
const RAISE_HAND = [8, -84, 30], SHOW_HAND = [-2, -6, 62], CLUTCH_HAND = [-14, 34, 26];
const SNEAK_L = [2, 60, 18], SNEAK_R = [6, 52, 30], BACK = [-30, 70, -34];   // creeping hands; an arm thrown back for balance

export function drawMarket(g, t, A) {
  const x = xAt(t), fl = startle(t - CLANG), held = t >= GRAB, hide = sm(t, HIDE, HIDE + 1.1);
  const wide = { z: lerp(1.28, 1.4, sm(t, 0, 7.3)) + 0.16 * hide, x: lerp(905, 1180, sm(t, 0.4, 7.3)) - 60 * sm(t, CLANG, CLANG + 0.8), y: lerp(700, 690, sm(t, 0, 7)) + 30 * hide };
  const c = camBegin(g, A.bg.supermarket, punches(t, wide, [[HALT + 0.08, 0.5, { z: 2.0, x: x + 20, y: 610 }, 0.4], [SPOT + 0.02, 0.3, { z: 2.1, x: x + 60, y: 600 }, 0.4], [8.55, 0.95, { z: 2.05, x: 1290, y: 570 }, 0.4], [CLANG + 0.42, 0.42, { z: 2.25, x: 1215, y: 595 }, 0.45]]), camShake(t, 6, CLANG, 0.4));
  if (!held) tin(g, TIN[0], TIN[1], 0.95, 0.06);
  // the face: brows travel and overshoot, most changes pass through a blink, shock and terror pop the eyes
  const expr = exprTrack(t, [[0, 'worried'], [HALT, 'scared'], [4.8, 'worried'], [SPOT, 'shock'], [SPOT + 0.5, 'happy'], [5.95, 'determined'], [GRAB + 0.2, 'happy'], [CLANG, 'terror'], [CLANG + 0.85, 'scared']]);
  // eyes lead every turn: they get there first, then the head, then the body
  const look = t < HALT ? [0.5, 0.15] : t < 4.75 ? [lerp(0.5, -0.9, so(t, HALT + 0.05, HALT + 0.17)), 0] : t < SPOT ? [lerp(-0.9, 0.9, so(t, 4.75, 4.87)), -0.3] : t < REACH ? [0.75, 0.2]
    : t < GRAB + 0.1 ? [0.7, 0.5] : t < LOWER ? [0.45, -0.8] : t < CLANG ? [0.7, lerp(-0.8, 0.15, so(t, LOWER, LOWER + 0.25))] : [lerp(0.7, -0.95, so(t, CLANG + 0.02, CLANG + 0.12)), 0.05 * hide];
  // screen-left arm: creeps, flares at the halt, guards his chest; thrown back for balance on the reach; a fist pump; then onto the tin
  const armL = armSpring(t, [[0, SNEAK_L], [HALT - 0.02, 'out'], [HALT + 0.25, 'chest'], [SPOT + 0.2, 'relaxed'], [REACH, BACK], [GRAB + 0.25, 'up'], [LOWER - 0.1, 'relaxed'], [CLANG, 'face'], [CLANG + 0.6, [-10, 38, 22]]], { feel: 'snappy', windUp: 0.05 });
  // screen-right arm: creeps, flares, points at the trolley, reaches in, lifts the tin high, lowers it to look, clutches it
  const armR = armSpring(t, [[0, SNEAK_R], [HALT, 'out'], [HALT + 0.3, SNEAK_R], [SPOT + 0.12, 'point'], [SPOT + 0.9, 'relaxed'], [REACH, REACH_HAND], [GRAB + 0.12, RAISE_HAND], [LOWER, SHOW_HAND], [CLANG + 0.05, CLUTCH_HAND]], { delay: 0.04 });
  const headTilt = overlap(leanAt, t, 0.09, 0.8) + 5 * bump(t, HALT + 0.2, 4.75) - 6 * bump(t, 4.75, SPOT) + 8 * bump(t, GRAB + 0.2, LOWER + 0.3) - 6 * fl + 9 * hide;
  const energy = (1 - 0.7 * speedK(t)) * (t > CLANG ? 0.35 : 1);
  drawVini(g, A.vini, withAlive({ x, y: FLOOR, s: VS, t, turn: turnAt(t), expr, look, lean: leanAt(t), headTilt, hipX: 4 * fl - 2 * startle(t - HALT), crouch: crouchAt(t),
    walkDist: dist(t), stride: STRIDE, lift: t < 5 ? 17 : 12, walkMix: 1 - sm(t, WB[1] + 0.05, WB[1] + 0.45), ...lags(t), breath: breathe(t, t > CLANG ? 0.7 : 1.4, t > CLANG ? 0.9 : 0.5),
    squash: 0.8 * startle(t - HALT) + fl, shake: t > CLANG ? 0.3 + 0.5 * fl : 0.25 * startle(t - HALT), arms: [armL, armR],
    props: { right: held ? (g2, h, info) => tin(g2, h[0] + 2, h[1] - 14 * info.s, 0.95 * info.s / VS, 0.1 - 0.5 * fl) : null } }, t, { energy }));
  camEnd(g);
  const [tx, ty] = toScreen(c, 1352, 520), ks = pop(t, SPOT + 0.15) * (1 - sm(t, 7.0, 7.3));
  if (ks > 0) note(g, 'supplies?', tx + 150, ty - 70, { size: 60, k: ks });
  if (t > 8.65 && t < CLANG) note(g, 'BEANS!!', W * 0.74, H * 0.3, { size: 96, k: pop(t, 8.68) * (1 - sm(t, CLANG - 0.25, CLANG)) });
  if (t > CLANG) note(g, 'CLANG', 250 + Math.sin(t * 34) * 4 * (1 - sm(t, CLANG, CLANG + 0.8)), 420, { size: 130, k: pop(t, CLANG), rot: -0.08 });
  if (t > HIDE + 0.5) note(g, '…don’t. move.', W * 0.7, H * 0.2, { size: 64, color: '#2a2622', k: pop(t, HIDE + 0.55) });
  vignette(g, 0.36 + 0.14 * sm(t, CLANG, CLANG + 1)); fade(g, sm(t, MARKET_T1 - 0.35, MARKET_T1)); fade(g, 1 - sm(t, 0, 0.3));
}
