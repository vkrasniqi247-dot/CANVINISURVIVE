// src/scenes/s03_day3.js — DAY 3 "The supply run" (scene time 0 → DUR). Narration clips 02_day3a, 03_day3b, 04_day3c.
// Shots: A flat (food runs out) · B notebook RULE 3 + route map · C street (the sneak) · D supermarket (wrong things)
//        E notebook RULE 4 checklist · F supermarket (the trolley, BEANS, CLANG, mistake #1, the thing at the far end)
//        G street (out the back, tracker, Vini's own rule).
// Shot F is the owner-approved market.js action copied in and re-timed (same walk, hair, face and arm acting).
// Every function is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, mix, sm, so, pop, settle, track, camBegin, camEnd, punches, toScreen, camShake, note, arrowTo, bigText, fade, vignette, dayCounter, tracker, notebook, inkPath, tick, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow, boneScreen } from '../vini/rig.js';
import { drawZombie } from '../zombie/zombie.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';
import { sY, hordeAt } from './hook.js';
import { tin } from './props.js';

const V0 = 0.4, V1 = 65.5, V2 = 82.0;                      // narration clip starts (scene time)
export const DUR = 89.9;
export const VO = [['02_day3a', V0], ['03_day3b', V1], ['04_day3c', V2]];
const A1 = 12.45, B1 = 23.45, C1 = 35.05, D1 = 42.4, E1 = 56.9, F1 = 80.35;   // shot ends
export const SFX = [
  ['day_slam', 0.4], ['stomach_growl', 2.1], ['crisp_bag_crinkle', 4.3], ['spoon_in_jar', 5.75], ['frozen_thud', 7.3], ['whoosh_turn', 10.75],
  ['page_flip', 12.4], ['pen_write', 12.6], ['pen_write', 15.2], ['pen_scratch_map', 15.7], ['pop', 19.0], ['pop', 19.2], ['pop', 19.4], ['pop', 19.6], ['paper_stretch', 20.9],
  ['street_wind_amb', 23.45], ['sneak_footsteps', 23.5], ['gasp_small', 28.9], ['distant_groan', 31.4],
  ['supermarket_hum_amb', 35.05], ['sneak_footsteps', 35.1], ['pop', 37.6], ['pop', 38.35], ['pop', 39.35], ['flies_buzz', 40.3], ['marker_cross', 40.7], ['marker_cross', 41.0], ['marker_cross', 41.3],
  ['page_flip', 42.35], ['pen_write', 42.5], ['pen_tick', 46.2], ['pen_tick', 46.75], ['pen_tick', 47.3], ['pen_tick', 47.9], ['marker_cross', 49.6], ['pen_tick', 53.6], ['pen_tick', 54.35], ['pen_tick', 54.95], ['radio_static_blip', 55.6], ['pen_tick', 56.1],
  ['supermarket_hum_amb', 56.9], ['sneak_footsteps', 56.9], ['gasp_small', 58.15], ['sneak_footsteps', 58.9], ['trolley_rattle', 61.0], ['tin_grab', 61.22], ['triumph_sting', 62.4], ['elbow_bump_shelf', 63.94],
  ['CLANG', 64.3], ['tin_bounce', 64.62], ['tin_bounce', 64.84], ['tin_roll', 65.0], ['marker_slam', 65.6], ['whoosh_arrow', 67.5], ['clang_echo', 69.6], ['clang_echo', 70.5], ['clang_echo', 71.4], ['tin_tink_stop', 72.6],
  ['heartbeat', 74.2], ['zombie_groan_far', 76.4], ['dragging_footsteps', 76.8],
  ['street_wind_amb', 80.35], ['tracker_blip', 80.6], ['tracker_fill', 80.9], ['hurried_footsteps', 81.6], ['tins_rattle_in_bag', 82.0], ['pen_write', 85.7], ['pen_write', 87.3],
];

// ---------- shared helpers ----------
const STRIDE = 58, PACE = 96;                               // approved sneak walk: step length, units per second
const seg = (t, a, b, D) => { const T = b - a, e = 0.4, x = clamp(t - a, 0, T);    // eases in and out over 0.4 s, constant pace between
  const s = x < e ? x * x / (2 * e) : x > T - e ? (T - e) - (T - x) ** 2 / (2 * e) : x - e / 2; return D * s / (T - e); };
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
// hair barely moves (a stiff cap of hair); the backpack keeps its swing
const lagsOf = (drive, t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });
const wk = (t, at, str, cps = 18) => clamp((t - at) / Math.max(0.25, str.length / cps));
const drawK = (t, at, dur = 0.5) => ease.out(clamp((t - at + 0.08) / dur));
const SNEAK_L = [2, 60, 18], SNEAK_R = [6, 52, 30], BACK = [-30, 70, -34];
const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
const day = (g, t) => dayCounter(g, 3, t, V0);
// the running-gag label (also Day 7 and Day 18): red marker, slightly rotated, pops in, double underline
function mistake(g, n, x, y, t, t0) { const k = pop(t, t0, 0.32); if (k <= 0) return; const rot = -0.07 + settle(t, t0 + 0.3, 0.02, 16, 7);
  note(g, `MISTAKE #${n}`, x, y, { size: 128, rot, k });
  g.save(); g.translate(x, y); g.rotate(rot); inkPath(g, [[-300, 80], [0, 71], [300, 76]], so(t, t0 + 0.25, t0 + 0.55), 9, RED); inkPath(g, [[-250, 102], [20, 95], [270, 99]], so(t, t0 + 0.42, t0 + 0.7), 6, RED); g.restore(); }

// =====================================================================================================
// A — the flat: food is running out (0 → 12.45)
// =====================================================================================================
function crispBag(g, x, y, s, k) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(s * k, s * k); g.rotate(-0.12);
  g.fillStyle = '#d8572a'; g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  poly(g, [[-60, 8], [-52, -14], [-30, -8], [-6, -22], [22, -10], [50, -20], [62, 6], [44, 12], [20, 6], [-8, 14], [-34, 8]]); g.fill(); g.stroke();
  g.fillStyle = '#f2d24a'; g.beginPath(); g.ellipse(4, -5, 15, 8, -0.2, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = alpha(INK, 0.5); g.lineWidth = 2; for (const [a, b, c, d] of [[-40, -8, -30, 6], [28, -8, 34, 6], [-16, -14, -12, 8]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.fillStyle = '#e8c070'; g.strokeStyle = INK; g.lineWidth = 2; for (const [cx, cy] of [[74, 10], [86, 4], [-70, 12]]) { g.beginPath(); g.ellipse(cx, cy, 6, 3, 0.4, 0, 7); g.fill(); g.stroke(); }   // the last crumbs
  g.restore(); }
function mayoJar(g, x, y, s, k) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(s * k, s * k); g.lineJoin = 'round';
  g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(4, -20); g.lineTo(26, -78); g.stroke();              // the spoon
  g.fillStyle = '#c9ccce'; g.beginPath(); g.ellipse(28, -84, 8, 11, 0.35, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
  g.fillStyle = alpha('#dfe8e8', 0.85); g.lineWidth = 3.5; g.beginPath(); g.roundRect(-24, -52, 48, 52, 7); g.fill(); g.stroke();          // glass
  g.fillStyle = '#f3ecc4'; g.beginPath(); g.roundRect(-21, -26, 42, 24, 5); g.fill();                                                    // half a jar left
  g.fillStyle = '#3f6fb0'; g.fillRect(-24, -40, 48, 13); g.strokeRect(-24, -40, 48, 13);
  g.strokeStyle = alpha('#ffffff', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(-17, -48); g.lineTo(-17, -6); g.stroke(); g.restore(); }
function frozenLump(g, x, y, s, k, t) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(s * k, s * k); g.lineJoin = 'round';
  g.fillStyle = '#8d9396'; g.strokeStyle = INK; g.lineWidth = 3.5; poly(g, [[-38, 0], [-42, -16], [-26, -32], [-4, -28], [10, -38], [32, -26], [40, -8], [34, 0]]); g.fill(); g.stroke();
  g.fillStyle = '#a9b0b3'; poly(g, [[-30, -14], [-20, -27], [-4, -22], [-12, -8]]); g.fill();
  g.fillStyle = '#6d7376'; for (const [cx, cy, r] of [[14, -20, 5], [-2, -10, 4], [24, -8, 3]]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); }
  g.strokeStyle = alpha('#e8f4ff', 0.8); g.lineWidth = 2; for (let i = 0; i < 3; i++) { const p = (t * 0.35 + i / 3) % 1, fx = -24 + i * 24 + Math.sin(t * 2 + i * 2) * 4;   // cold mist coming off it
    g.globalAlpha = Math.sin(Math.PI * p) * 0.8; g.beginPath(); g.moveTo(fx, -40 - p * 34); g.quadraticCurveTo(fx + 7, -50 - p * 34, fx, -60 - p * 34); g.stroke(); }
  g.restore(); }
function shotA(g, t, A) {
  const VX = 1300, VY = 988, VS = 1.36, GO = 10.72, EAT = 4.2;
  const tb = sm(t, EAT - 0.5, EAT + 0.35) * (1 - sm(t, 10.3, 10.95));                      // push in on the coffee table while the list is read
  const base = { z: lerp(1.16, 1.24, sm(t, 0, A1)) + 0.34 * tb + 0.1 * sm(t, 6.9, 9.9) * tb, x: lerp(1010, 965, sm(t, 0, 4)) - 85 * tb + 300 * sm(t, GO - 0.1, GO + 1.0), y: 650 + 22 * tb };
  const c = camBegin(g, A.bg.flat, punches(t, base, [[2.15, 0.8, { z: 1.85, x: VX - 40, y: 640 }, 0.45], [GO + 0.3, 0.75, { z: 1.95, x: VX + 70, y: 590 }, 0.5]]));
  const kb = pop(t, 4.3, 0.3), km = pop(t, 5.75, 0.3), kl = pop(t, 7.3, 0.3);
  crispBag(g, 578, 752, 1.2, kb); frozenLump(g, 816, 752, 0.95, kl, t); mayoJar(g, 958, 757, 1.05, km);
  // slumped, a hand on his empty stomach; he follows the list with his eyes, recoils from the lump; then decides
  const turn = track(t, [[GO - 0.05, -0.5], [GO + 0.45, 0.72]]);
  const leanAt = (tt) => trackSpring(tt, [[0, 8], [7.35, 3], [8.6, 8], [GO, -4]], { feel: 'heavy', windUp: 0.05 }) - 5 * startle(tt - 7.35) + 3 * bump(tt, 2.1, 3.3);
  const crouch = trackSpring(t, [[0, 7], [GO, 0]], { feel: 'heavy', windUp: 0.08 }) + 3 * bump(t, 2.1, 3.2) + 3 * startle(t - 7.35) + 4 * bump(t, GO - 0.1, GO + 0.3);
  const expr = exprTrack(t, [[0, 'exhausted'], [2.1, 'worried'], [4.4, 'exhausted'], [5.85, 'worried'], [7.4, 'shock'], [8.1, 'scared'], [9.6, 'worried'], [GO, 'determined']]);
  const look = t < 4.2 ? [-0.3, 0.6] : t < 5.7 ? [-0.9, 0.5] : t < 7.25 ? [-0.75, 0.5] : t < GO - 0.1 ? [-0.85, 0.45] : [lerp(-0.85, 0.95, so(t, GO - 0.1, GO + 0.03)), -0.05];
  const rub = Math.sin(t * 7) * (1 - sm(t, 3.4, 4.0)) * sm(t, 1.5, 2.0);
  const armL = armSpring(t, [[0, 'relaxed'], [7.38, 'out'], [8.3, [40, 30, 50]], [9.7, 'relaxed'], [GO + 0.1, 'hips']], { feel: 'snappy', windUp: 0.05 });
  const armR = armSpring(t, [[0, 'relaxed'], [1.7, [-20, 50, 22]], [4.2, 'relaxed'], [7.4, 'chest'], [9.6, 'relaxed'], [GO + 0.3, 'point'], [GO + 1.2, [14, 30, 40]]], { delay: 0.04 });
  armR[1][0] += rub * 5; armR[1][1] += Math.cos(t * 7) * 3 * (1 - sm(t, 3.4, 4.0)) * sm(t, 1.5, 2.0);
  const drive = (tt) => VX + track(tt, [[GO - 0.05, -0.5], [GO + 0.45, 0.72]]) * 30 - leanAt(tt) * 4;
  drawVini(g, A.vini, withAlive({ x: VX, y: VY, s: VS, t, turn, expr, look, lean: leanAt(t), headTilt: trackSpring(t, [[0, 9], [GO, -2]], { feel: 'snappy' }) + overlap(leanAt, t, 0.09, 0.8) - 5 * bump(t, 7.4, 8.3),
    crouch, squash: startle(t - 7.35), shake: 0.4 * startle(t - 7.35), arms: [armL, armR], breath: breathe(t, t < GO ? 3.4 : 2.2, t < GO ? 1 : 0.6), ...lagsOf(drive, t) }, t, { energy: 1 - 0.6 * bump(t, GO - 0.1, GO + 0.7) }));
  camEnd(g);
  // labels
  const [sx, sy] = toScreen(c, VX - 62, VY - 215 * VS); note(g, '*grrrrowl*', sx - 150 + Math.sin(t * 30) * 3, sy + 20, { size: 54, k: pop(t, 2.15) * (1 - sm(t, 3.5, 3.8)), rot: -0.1 });
  note(g, 'food left:', W * 0.3, H * 0.2, { size: 70, k: pop(t, 2.6) * (1 - sm(t, 10.2, 10.5)), color: '#2a2622' });
  const fo = 1 - sm(t, 10.25, 10.6);
  const [bx, by] = toScreen(c, 578, 740), [mx, my] = toScreen(c, 962, 700), [lx, ly] = toScreen(c, 816, 720);
  if (kb > 0) { note(g, 'family bag', bx - 150, by - 215, { size: 58, k: kb * fo }); note(g, '(all of it)', bx - 150, by - 160, { size: 44, k: pop(t, 4.9) * fo }); arrowTo(g, bx - 120, by - 125, bx - 20, by - 45, so(t, 4.4, 4.75) * fo, RED, -20); }
  if (km > 0) { note(g, 'half a jar of mayo', mx + 170, my - 165, { size: 54, k: km * fo, rot: 0.03 }); note(g, '(with a spoon)', mx + 185, my - 113, { size: 42, k: pop(t, 6.4) * fo, rot: 0.03 }); arrowTo(g, mx + 130, my - 82, mx + 50, my - 20, so(t, 5.85, 6.2) * fo, RED, 20); }
  if (kl > 0) { note(g, '???', lx - 10 + Math.sin(t * 26) * 3 * (1 - sm(t, 9.3, 9.9)), ly - 215, { size: 120, k: pop(t, 9.25) * fo }); note(g, 'back of the freezer', lx - 20, ly - 320, { size: 50, k: pop(t, 7.9) * fo }); arrowTo(g, lx - 15, ly - 150, lx, ly - 62, so(t, 8.0, 8.35) * fo, RED, 0); }
  const [dx, dy] = toScreen(c, 1790, 520);
  if (t > GO + 0.2) { note(g, 'he has to go OUT', dx - 420, dy - 270, { size: 76, k: pop(t, GO + 0.25) }); arrowTo(g, dx - 260, dy - 220, dx - 40, dy - 60, so(t, GO + 0.45, GO + 0.8), RED, 30); }
  day(g, t); vignette(g, 0.34); fade(g, 1 - sm(t, 0, 0.35)); }

// =====================================================================================================
// notebook pieces (same look as the RULE 1 / RULE 2 pages)
// =====================================================================================================
function heading(g, t, n, title, tN, tT) {
  writeOn(g, `RULE ${n}`, 360, 165, wk(t, tN, `RULE ${n}`, 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [362, 216], [462, 220]], ease.out(clamp((t - tN - 0.55) / 0.3)), 7, RED);
  writeOn(g, title, W * 0.6, 168, wk(t, tT, title, 13), { size: 78, color: '#2a2622', font: 'Permanent Marker' }); }
function penStrokes(g, strokes, k, col = INK) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w, col);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]); }
function page(g, t, t0, body) { const land = so(t, t0 - 0.25, t0 + 0.25); g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03 * (1 - land) + settle(t, t0 + 0.25, 0.005, 11, 6)); g.translate(-W / 2 + 50 * (1 - land), -H / 2 + 22 * (1 - land)); notebook(g, t); body(); g.restore(); vignette(g, 0.2); }
const RC = (a, b, c, d) => [[a, b], [c, b], [c, d], [a, d], [a, b]];
const EL = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 18) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
// a doodle = flat colour fills that fade in under pen strokes drawn one after another
function doodle(g, x, y, sc, k, fk, spec, penOn = true) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(sc, sc);
  if (fk > 0) { g.globalAlpha = clamp(fk); for (const [col, pts] of spec.fill) { g.fillStyle = col; poly(g, pts); g.fill(); } g.globalAlpha = 1; }
  if (penOn) penStrokes(g, spec.ink, k); else spec.ink.forEach(([p, w]) => inkPath(g, p, k, w)); g.restore(); }

// =====================================================================================================
// B — RULE 3: move at the quietest time, plan your route (12.45 → 23.45)
// =====================================================================================================
const HOUSE = { fill: [['#c9805a', RC(-60, -30, 60, 60)], ['#7a4a3a', [[-74, -30], [0, -92], [74, -30]]], ['#3f6fb0', RC(-16, 12, 16, 60)]],
  ink: [[[[-60, 60], [-60, -30], [60, -30], [60, 60], [-60, 60]], 6], [[[-74, -30], [0, -92], [74, -30]], 6], [[[-16, 60], [-16, 12], [16, 12], [16, 60]], 5], [RC(28, -12, 48, 8), 4]] };
const SHOP = { fill: [['#d9d2bd', RC(-80, -40, 80, 60)], ['#c8262e', RC(-88, -66, 88, -40)], ['#8fb6c9', RC(-60, -14, -10, 30)], ['#6a5a4a', RC(14, -6, 54, 60)]],
  ink: [[[[-80, 60], [-80, -40], [80, -40], [80, 60], [-80, 60]], 6], [RC(-88, -66, 88, -40), 6], [RC(-60, -14, -10, 30), 4], [[[14, 60], [14, -6], [54, -6], [54, 60]], 5]] };
const CLOCK = { fill: [['#f4f1ea', EL(0, 0, 46, 46)]], ink: [[EL(0, 0, 46, 46, -1.57, 4.72), 6], [[[0, 0], [0, -30]], 5], [[[0, 0], [18, 12]], 5]] };
function shotB(g, t) { page(g, t, A1, () => {
  heading(g, t, 3, 'MOVE WHEN IT’S QUIET', 12.58, 13.4);
  doodle(g, 1585, 300, 0.8, drawK(t, 14.45, 0.4), sm(t, 14.7, 15.0), CLOCK, false); writeOn(g, '4 a.m.', 1585, 372, wk(t, 14.75, '4 a.m.', 22), { size: 44, pen: false });
  writeOn(g, '…and plan your route before you leave', 870, 262, wk(t, 15.25, '…and plan your route before you leave', 20), { size: 58, color: '#2a6ab8' });
  // the map: HOME → 4 streets → SHOP. It stretches when four streets "has never felt so far".
  const st = sm(t, 20.85, 22.5), MY = 640, hx = 410, sx = (i) => 640 + i * 165 * (1 + 0.36 * st), shx = 1330 + 300 * st, shs = lerp(0.9, 0.5, st);
  doodle(g, hx, MY, 0.95, drawK(t, 15.75, 0.4), sm(t, 16.0, 16.3), HOUSE, t < 17.1); writeOn(g, 'HOME', hx, MY + 105, wk(t, 16.05, 'HOME', 20), { size: 54, pen: false });
  for (let i = 0; i < 4; i++) { const k = drawK(t, 16.3 + i * 0.16, 0.3), x = sx(i);                                 // streets (two kerb lines each)
    inkPath(g, [[x - 20, MY - 190], [x - 22, MY + 150]], k, 5, alpha(INK, 0.75)); inkPath(g, [[x + 22, MY - 190], [x + 20, MY + 150]], k, 5, alpha(INK, 0.75));
    g.save(); g.setLineDash([14, 14]); inkPath(g, [[x, MY - 180], [x, MY + 140]], k, 3, alpha(INK, 0.35)); g.restore();
    const kn = pop(t, 19.0 + i * 0.22, 0.25); if (kn > 0) { g.save(); g.translate(x, MY - 235); g.scale(kn, kn); g.fillStyle = RED; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.restore(); note(g, `${i + 1}`, x, MY - 233, { size: 46, color: '#f4efe2', glow: false, k: kn, rot: 0 }); } }
  doodle(g, shx, MY - 10, shs, drawK(t, 17.0, 0.4), sm(t, 17.25, 17.55), SHOP, t < 17.5); writeOn(g, 'SHOP', shx, MY + 105 - 40 * st, wk(t, 18.1, 'SHOP', 16), { size: lerp(58, 40, st), pen: false, color: RED });
  // the route, dashed in red, zig-zagging through the back streets
  const R = [[hx + 70, MY + 40], [sx(0), MY + 40], [sx(0), MY - 110], [sx(1), MY - 110], [sx(2), MY - 110], [sx(2), MY + 70], [sx(3), MY + 70], [shx - 80 * shs - 12, MY + 70 - 30 * st]];
  const rk = sm(t, 17.5, 18.75); g.save(); g.setLineDash([22, 16]); inkPath(g, R, rk, 8, RED); g.restore();
  if (rk > 0 && rk < 1) { const u = rk * (R.length - 1), i = Math.min(R.length - 2, Math.floor(u)), f = u - i; pen(g, lerp(R[i][0], R[i + 1][0], f), lerp(R[i][1], R[i + 1][1], f)); }
  note(g, '4 streets', lerp(880, 1010, st), MY + 235, { size: 70, k: pop(t, 19.75) });
  g.save(); g.translate(lerp(880, 1010, st), MY + 285); inkPath(g, [[-(250 + 215 * st), 0], [250 + 215 * st, 0]], so(t, 19.85, 20.2), 5, RED); for (const sd of [-1, 1]) inkPath(g, [[sd * (250 + 215 * st), -16], [sd * (250 + 215 * st), 16]], so(t, 20.1, 20.3), 5, RED); g.restore();
  note(g, '(feels like 40)', lerp(880, 1010, st), MY + 335, { size: 54, k: pop(t, 21.9), rot: 0.02 }); }); }

// =====================================================================================================
// C — the street: creeping past the abandoned car (23.45 → 35.05)
// =====================================================================================================
const CY = 955, CS = 1.12, CWA = [22.9, 26.93], CD = STRIDE * 6, CX0 = 800 - CD * CS;
const cDist = (t) => seg(t, CWA[0], CWA[1], CD), cX = (t) => CX0 + cDist(t) * CS, cSpeed = (t) => clamp((cDist(t + 0.05) - cDist(t - 0.05)) / (0.1 * PACE));
const ALARM = 28.9, DROP = 30.1, THEM = 31.35, DUCK = 31.95;
const FAR = [{ kind: 'office', x: 1050, y0: 792, start: THEM - 0.2, seed: 1.3 }, { kind: 'teen', x: 1125, y0: 778, start: THEM - 0.2, seed: 4.1 }];
function shotC(g, t, A) {
  const x = cX(t), duck = sm(t, DUCK, DUCK + 0.9);
  const wide = { z: lerp(1.3, 1.22, sm(t, 23.4, 28)) + 0.1 * sm(t, THEM - 0.3, THEM + 2.5), x: lerp(700, 800, sm(t, 23.4, 27.5)) + 130 * sm(t, THEM - 0.4, THEM + 0.8), y: 770 - 20 * sm(t, THEM - 0.4, THEM + 0.8) };
  const c = camBegin(g, A.bg.street, punches(t, wide, [[ALARM + 0.05, 0.55, { z: 1.8, x: x - 60, y: 730 }, 0.4], [DUCK - 0.2, 0.6, { z: 2.0, x: 960, y: 770 }, 0.5]]));
  if (t > THEM - 0.2) for (const z of FAR) { const p = hordeAt(z, t, 1.2); drawZombie(g, A.zombie, { kind: z.kind, ...p, t, seed: z.seed, dir: 0, alpha: so(t, THEM, THEM + 0.5), b: 0.8 }); }
  const turnAt = (tt) => track(tt, [[ALARM, 0.72], [ALARM + 0.28, 0.42], [THEM + 0.1, 0.42], [THEM + 0.45, 0.72]]);
  const sneak = 1 - 0.4 * sm(t, CWA[1], CWA[1] + 0.5);
  const leanAt = (tt) => -4 * cSpeed(tt) - 4 + 7 * startle(tt - CWA[1]) - 9 * startle(tt - ALARM) + trackSpring(tt, [[0, 0], [ALARM + 0.2, -5], [DROP, 0], [DUCK, -8]], { feel: 'heavy', windUp: 0.05 });
  const crouch = 1.2 * sneak + 5 * bump(t, CWA[1] - 0.05, CWA[1] + 0.5) + 6 * startle(t - ALARM) + 3 * bump(t, DROP, DROP + 0.5) + 6 * startle(t - THEM - 0.25) + move(t, 0, 17, DUCK, { feel: 'heavy', windUp: 0.06 });
  const expr = exprTrack(t, [[0, 'worried'], [25.95, 'scared'], [26.95, 'worried'], [ALARM, 'terror'], [ALARM + 0.7, 'scared'], [DROP, 'worried'], [THEM + 0.3, 'shock'], [DUCK + 0.3, 'scared']]);
  const look = t < 25.9 ? [0.5, 0.15] : t < 27.3 ? [lerp(0.5, -0.95, so(t, 25.9, 26.02)), 0] : t < ALARM ? [lerp(-0.95, 0.6, so(t, 27.3, 27.42)), 0.1] : t < DROP ? [lerp(0.6, -0.95, so(t, ALARM + 0.02, ALARM + 0.12)), 0.15]
    : t < THEM + 0.25 ? [lerp(-0.95, 0.1, so(t, DROP, DROP + 0.12)), 0.75] : [lerp(0.1, 0.55, so(t, THEM + 0.25, THEM + 0.37)), -0.7];
  const armL = armSpring(t, [[0, SNEAK_L], [CWA[1] - 0.02, 'out'], [CWA[1] + 0.3, 'chest'], [ALARM, 'out'], [ALARM + 0.5, SNEAK_L], [DROP, [-8, 30, 34]], [THEM + 0.3, 'face'], [DUCK + 0.5, [-10, 38, 22]]], { feel: 'snappy', windUp: 0.05 });
  const armR = armSpring(t, [[0, SNEAK_R], [CWA[1], 'out'], [CWA[1] + 0.35, SNEAK_R], [ALARM, 'up'], [ALARM + 0.55, SNEAK_R], [DROP, [-8, 30, 34]], [THEM + 0.32, 'chest'], [DUCK + 0.4, [-12, 36, 24]]], { delay: 0.04 });
  const step = cDist(t) / STRIDE, wkk = cSpeed(t);
  for (const [h, ph] of [[armL[1], 0], [armR[1], 1]]) { const sw = Math.sin(Math.PI * (step + ph)) * wkk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }
  const drive = (tt) => cX(tt) + turnAt(tt) * 30 - leanAt(tt) * 4;
  const fl = startle(t - ALARM);
  drawVini(g, A.vini, withAlive({ x, y: CY, s: CS, t, turn: turnAt(t), expr, look, lean: leanAt(t), headTilt: -1.2 * Math.sin(2 * Math.PI * step) * wkk + overlap(leanAt, t, 0.09, 0.8) + 5 * bump(t, 25.9, 27.2) + 6 * bump(t, DROP, DROP + 1.1) - 5 * duck,
    hipX: -3 * fl, crouch, walkDist: cDist(t), stride: STRIDE, lift: 14, smoothGait: true, walkSquash: 0.25, walkMix: 1 - sm(t, CWA[1] + 0.05, CWA[1] + 0.45), ...lagsOf(drive, t),
    breath: breathe(t, t > THEM ? 0.8 : 1.4, t > THEM ? 0.9 : 0.5), squash: 0.8 * startle(t - CWA[1]) + fl, shake: 0.5 * fl + (t > DUCK ? 0.3 : 0), arms: [armL, armR] }, t, { energy: (1 - 0.7 * cSpeed(t)) * (t > DUCK ? 0.4 : 1) }));
  camEnd(g);
  const [ox, oy] = toScreen(c, 655, 745), fo = 1 - sm(t, ALARM - 0.4, ALARM - 0.1);
  if (t > 25.8) { note(g, 'doors still open', ox + 120, oy - 330, { size: 62, k: pop(t, 25.9) * fo }); arrowTo(g, ox + 90, oy - 285, ox + 10, oy - 80, so(t, 26.0, 26.35) * fo, RED, -30); }
  note(g, 'abandoned', W * 0.2, H * 0.3, { size: 60, k: pop(t, 24.6) * (1 - sm(t, 27.6, 28.0)), rot: -0.06 });
  const [kx, ky] = toScreen(c, 420, 690), f2 = 1 - sm(t, 34.6, 35.0);
  if (t > ALARM) { note(g, 'car alarm?', kx + 20, ky - 250 + Math.sin(t * 30) * 3 * (1 - sm(t, ALARM, ALARM + 0.8)), { size: 84, k: pop(t, ALARM) * f2 }); arrowTo(g, kx + 10, ky - 195, kx, ky - 40, so(t, ALARM + 0.1, ALARM + 0.45) * f2, RED, -20); }
  const [vx, vy] = toScreen(c, x, CY - 150 * CS);
  if (t > DROP) { const kd = pop(t, DROP) * (1 - sm(t, THEM - 0.1, THEM + 0.2)); note(g, 'one dropped tin?', vx + 330, vy - 150, { size: 64, k: kd, rot: 0.04 }); if (kd > 0.05) { g.save(); g.globalAlpha = clamp(kd); tin(g, vx + 330, vy - 60, 1.5, 0.5 + Math.sin(t * 5) * 0.12); g.restore(); } }
  const lead = hordeAt(FAR[0], t, 1.2), [zx, zy] = toScreen(c, lead.x + 20, lead.y - lead.s * 290);
  if (t > THEM + 0.4) { note(g, 'everything on this street', W * 0.67, H * 0.2, { size: 64, k: pop(t, THEM + 0.45) * f2 }); arrowTo(g, W * 0.64, H * 0.25, zx + 20, zy - 12, so(t, THEM + 0.6, THEM + 1.0) * f2, RED, 30); note(g, '…knows where he is', W * 0.72, H * 0.28, { size: 56, k: pop(t, 33.0) * f2, rot: 0.02 }); }
  day(g, t); vignette(g, 0.38 + 0.08 * sm(t, THEM, THEM + 1)); }

// =====================================================================================================
// D — inside the supermarket: the wrong things (35.05 → 42.4)
// =====================================================================================================
const MVS = 1.3, FLOOR = 930;
const DWA = [34.75, 36.96], DD = STRIDE * 3, dDist = (t) => seg(t, DWA[0], DWA[1], DD), dX = (t) => 706 - (DD - dDist(t)) * MVS, dSpeed = (t) => clamp((dDist(t + 0.05) - dDist(t - 0.05)) / (0.1 * PACE));
const OFF = 40.2;                                              // "All of it goes off within days"
const sticker = (g, x, y, r) => { g.fillStyle = alpha('#000', 0.35); g.beginPath(); g.arc(x + 6, y + 9, r, 0, 7); g.fill(); g.fillStyle = '#ece6d6'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); };
function mould(g, pts, m, t, seed) { if (m <= 0) return; g.fillStyle = alpha('#3f5a2a', 0.85 * m); for (const [px, py, r] of pts) { g.beginPath(); g.ellipse(px, py, r * m, r * 0.8 * m, seed + px, 0, 7); g.fill(); }
  g.fillStyle = alpha('#9fb66a', 0.9 * m); for (const [px, py, r] of pts) { g.beginPath(); g.arc(px - r * 0.2, py - r * 0.2, r * 0.35 * m, 0, 7); g.fill(); }
  g.strokeStyle = alpha('#6f8a3a', 0.8 * m); g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const sx2 = -50 + i * 50, w = Math.sin(t * 3 + i + seed) * 8; g.beginPath(); g.moveTo(sx2, -92); g.quadraticCurveTo(sx2 + 14 + w, -112, sx2, -130); g.quadraticCurveTo(sx2 - 14 - w, -146, sx2, -160); g.stroke(); }   // stink lines
  for (let i = 0; i < 3; i++) { const a = t * (3.1 + i * 0.7) + i * 2.1 + seed, fx = Math.cos(a) * (95 + 12 * Math.sin(a * 1.7)), fy = Math.sin(a * 1.3) * 62 - 20; g.fillStyle = alpha(INK, m); g.beginPath(); g.arc(fx, fy, 5, 0, 7); g.fill();   // flies
    g.strokeStyle = alpha('#ffffff', 0.7 * m); g.lineWidth = 2.5; const wf = Math.sin(t * 60 + i) * 4; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx - 7, fy - 7 - wf); g.moveTo(fx, fy); g.lineTo(fx + 7, fy - 7 + wf); g.stroke(); } }
function bread(g, m) { g.lineJoin = 'round'; g.fillStyle = mix('#d9a45a', '#8a9a52', m * 0.7); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-74, 46); g.lineTo(-74, -6); g.bezierCurveTo(-92, -64, -30, -66, -22, -36); g.bezierCurveTo(-10, -70, 34, -70, 30, -36); g.bezierCurveTo(46, -66, 96, -52, 76, -4); g.lineTo(76, 46); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = mix('#f1dcae', '#b9c486', m * 0.7); g.beginPath(); g.roundRect(-62, -8, 126, 44, 8); g.fill(); g.strokeStyle = alpha(INK, 0.4); g.lineWidth = 3; for (const lx of [-24, 26]) { g.beginPath(); g.moveTo(lx, -40); g.lineTo(lx, 44); g.stroke(); } }
function meat(g, m) { g.lineJoin = 'round'; g.fillStyle = '#e8e4da'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-84, -40, 168, 92, 12); g.fill(); g.stroke();
  g.fillStyle = mix('#c8423a', '#6f7a4a', m * 0.75); g.beginPath(); g.moveTo(-56, 6); g.bezierCurveTo(-66, -40, 4, -34, 22, -22); g.bezierCurveTo(70, -30, 72, 34, 28, 36); g.bezierCurveTo(-10, 46, -50, 40, -56, 6); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = mix('#f4d8d0', '#c4c8a0', m); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, 2); g.quadraticCurveTo(-4, -14, 22, 4); g.moveTo(-12, 22); g.quadraticCurveTo(14, 14, 40, 18); g.stroke(); }
function milk(g, m) { g.lineJoin = 'round'; g.fillStyle = mix('#f4f4f0', '#c9d08e', m * 0.7); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-36, 66); g.lineTo(-36, -22); g.quadraticCurveTo(-34, -46, -16, -54); g.lineTo(-16, -72); g.lineTo(16, -72); g.lineTo(16, -54); g.quadraticCurveTo(34, -46, 36, -22); g.lineTo(36, 66); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#3f6fb0'; g.fillRect(-18, -84, 36, 14); g.strokeRect(-18, -84, 36, 14); g.fillStyle = mix('#3f6fb0', '#5a6a3a', m * 0.6); g.fillRect(-36, -8, 72, 40); g.strokeRect(-36, -8, 72, 40);
  g.fillStyle = '#f4f1ea'; g.font = '700 26px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MILK', 0, 13); }
const WRONG = [['bread', 37.6, 890, bread, [[-40, 10, 16], [20, -30, 13], [44, 22, 15], [-10, 28, 10]]], ['fresh meat', 38.35, 1200, meat, [[-30, -6, 15], [26, 12, 16], [0, 26, 10]]], ['milk', 39.35, 1510, milk, [[-14, 36, 12], [16, -30, 10], [10, 50, 11]]]];
function shotD(g, t, A) {
  const x = dX(t), LOOKUP = 37.5;
  const wide = { z: lerp(1.1, 1.24, sm(t, C1, D1)), x: lerp(860, 930, sm(t, C1, D1)), y: lerp(640, 610, sm(t, C1, 39)) };
  camBegin(g, A.bg.supermarket, wide, camShake(t, 3, OFF + 0.5, 0.3));
  const turnAt = (tt) => track(tt, [[LOOKUP - 0.2, 0.72], [LOOKUP + 0.2, 0.45]]);
  const leanAt = (tt) => -4 * dSpeed(tt) - 4 * (1 - sm(tt, LOOKUP - 0.2, LOOKUP + 0.2)) + 6 * startle(tt - DWA[1]) + trackSpring(tt, [[0, 0], [LOOKUP, 4], [OFF + 0.2, 7]], { feel: 'heavy', windUp: 0.05 });
  const expr = exprTrack(t, [[0, 'worried'], [LOOKUP, 'neutral'], [38.4, 'happy'], [OFF + 0.15, 'shock'], [OFF + 0.9, 'exhausted']]);
  const look = t < LOOKUP - 0.15 ? [0.5, 0.15] : t < 38.3 ? [lerp(0.5, 0.2, so(t, LOOKUP - 0.15, LOOKUP)), -0.8] : t < 39.3 ? [lerp(0.2, 0.6, so(t, 38.3, 38.42)), -0.8] : [lerp(0.6, 0.9, so(t, 39.3, 39.42)), -0.75];
  const armL = armSpring(t, [[0, SNEAK_L], [DWA[1], 'relaxed'], [OFF + 0.2, 'face']], { feel: 'snappy', windUp: 0.05 });
  const armR = armSpring(t, [[0, SNEAK_R], [DWA[1] + 0.1, 'relaxed'], [38.4, 'reach'], [OFF + 0.15, 'chest']], { delay: 0.04 });
  const step = dDist(t) / STRIDE, wkk = dSpeed(t);
  for (const [h, ph] of [[armL[1], 0], [armR[1], 1]]) { const sw = Math.sin(Math.PI * (step + ph)) * wkk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }
  const drive = (tt) => dX(tt) + turnAt(tt) * 30 - leanAt(tt) * 4;
  drawVini(g, A.vini, withAlive({ x, y: FLOOR, s: MVS, t, turn: turnAt(t), expr, look, lean: leanAt(t), headTilt: -1.2 * Math.sin(2 * Math.PI * step) * wkk + overlap(leanAt, t, 0.09, 0.8) + 7 * sm(t, LOOKUP - 0.1, LOOKUP + 0.25),
    crouch: 1.2 * (1 - sm(t, LOOKUP - 0.2, LOOKUP + 0.2)) + 5 * bump(t, DWA[1] - 0.05, DWA[1] + 0.5) + 5 * startle(t - OFF - 0.15), walkDist: dDist(t), stride: STRIDE, lift: 14, smoothGait: true, walkSquash: 0.25, walkMix: 1 - sm(t, DWA[1] + 0.05, DWA[1] + 0.45),
    ...lagsOf(drive, t), breath: breathe(t, 1.6, 0.6), squash: startle(t - OFF - 0.15), arms: [armL, armR] }, t, { energy: 1 - 0.7 * dSpeed(t) }));
  camEnd(g);
  note(g, 'what everyone grabbed:', W * 0.625, H * 0.085, { size: 70, k: pop(t, 36.0), color: '#ece6d6', glow: false });
  WRONG.forEach(([name, at, ix, fn, spots], i) => { const k = pop(t, at, 0.3); if (k <= 0) return; const m = sm(t, OFF + i * 0.28, OFF + 0.9 + i * 0.28), iy = 300 + Math.sin(t * 1.3 + i * 2) * 5;
    g.save(); g.translate(ix, iy); g.rotate([-0.05, 0.03, -0.02][i] + settle(t, at + 0.25, 0.05, 15, 7)); g.scale(k, k); sticker(g, 0, 0, 130); g.save(); g.scale(1.15, 1.15); fn(g, m); g.restore(); mould(g, spots.map(([a, b, r]) => [a * 1.15, b * 1.15, r * 1.2]), m, t, i * 1.7); g.restore();
    note(g, name, ix, iy + 172, { size: 62, k, color: m > 0.5 ? '#9fb66a' : '#ece6d6', glow: false });
    cross(g, ix, iy, 105, so(t, OFF + 0.5 + i * 0.3, OFF + 0.8 + i * 0.3)); });
  note(g, 'the WRONG things', W * 0.625, H * 0.3, { size: 84, k: pop(t, 36.55) * (1 - sm(t, 37.3, 37.6)) });
  note(g, 'all off within DAYS', W * 0.64, H * 0.6, { size: 84, k: pop(t, 41.0), rot: 0.02 });
  day(g, t); vignette(g, 0.4); }

// =====================================================================================================
// E — RULE 4: grab food that lasts + the things nobody thinks of (42.4 → 56.9)
// =====================================================================================================
const D_TIN = { fill: [['#b9bdc0', RC(-42, -58, 42, 58)], ['#c8262e', RC(-42, -22, 42, 30)], ['#f2e6d0', EL(0, 4, 17, 13)]], ink: [[RC(-42, -58, 42, 58), 6], [[[-42, -22], [42, -22]], 5], [[[-42, 30], [42, 30]], 5], [[[-42, -44], [42, -44]], 3]] };
const D_RICE = { fill: [['#e6dcc0', [[-50, 60], [-58, -10], [-30, -44], [-14, -40], [-20, -62], [20, -62], [14, -40], [30, -44], [58, -10], [50, 60]]], ['#c8262e', RC(-30, -4, 30, 30)]],
  ink: [[[[-50, 60], [-58, -10], [-30, -44], [-14, -40], [-20, -62], [20, -62], [14, -40], [30, -44], [58, -10], [50, 60], [-50, 60]], 6], [[[-16, -41], [16, -41]], 5], [RC(-30, -4, 30, 30), 4]] };
const D_PASTA = { fill: [['#e2b64a', RC(-42, -62, 42, 62)], ['#f4ecd0', RC(-28, -22, 28, 36)]], ink: [[RC(-42, -62, 42, 62), 6], [[[-42, -44], [42, -44]], 4], [RC(-28, -22, 28, 36), 4], [[[-18, 0], [-9, -10], [0, 0], [9, -10], [18, 0]], 4], [[[-18, 20], [-9, 10], [0, 20], [9, 10], [18, 20]], 4]] };
const D_PB = { fill: [['#b9834a', [[-40, -42], [-44, -30], [-44, 58], [44, 58], [44, -30], [40, -42]]], ['#c8262e', RC(-36, -62, 36, -42)], ['#f2e6d0', RC(-30, -14, 30, 32)]],
  ink: [[[[-40, -42], [-44, -30], [-44, 58], [44, 58], [44, -30], [40, -42]], 6], [RC(-36, -62, 36, -42), 6], [RC(-30, -14, 30, 32), 4]] };
const D_FRIDGE = { fill: [['#cfd6da', RC(-40, -72, 40, 72)]], ink: [[RC(-40, -72, 40, 72), 6], [[[-40, -22], [40, -22]], 5], [[[26, -54], [26, -36]], 6], [[[26, -8], [26, 22]], 6]] };
const D_BATT = { fill: [['#2a2a2e', RC(-40, -40, -12, 52)], ['#d08a3a', RC(-40, -40, -12, -12)], ['#2a2a2e', RC(12, -40, 40, 52)], ['#d08a3a', RC(12, -40, 40, -12)], ['#b9bdc0', RC(-32, -50, -20, -40)], ['#b9bdc0', RC(20, -50, 32, -40)]],
  ink: [[RC(-40, -40, -12, 52), 6], [RC(-32, -50, -20, -40), 4], [[[-40, -12], [-12, -12]], 4], [RC(12, -40, 40, 52), 6], [RC(20, -50, 32, -40), 4], [[[12, -12], [40, -12]], 4]] };
const D_TORCH = { fill: [['#f5d76a', [[40, -24], [104, -56], [104, 56], [40, 24]]], ['#3a4a5a', RC(-70, -15, 4, 15)], ['#6a7a8a', [[4, -15], [26, -30], [40, -30], [40, 30], [26, 30], [4, 15]]]],
  ink: [[RC(-70, -15, 4, 15), 6], [[[4, -15], [26, -30], [40, -30], [40, 30], [26, 30], [4, 15]], 6], [RC(-46, -8, -30, 2), 3], [[[48, -22], [98, -48]], 4], [[[50, 0], [104, 0]], 4], [[[48, 22], [98, 48]], 4]] };
const D_KIT = { fill: [['#f4f1ea', RC(-58, -32, 58, 52)], ['#c8262e', RC(-9, -14, 9, 34)], ['#c8262e', RC(-24, 1, 24, 19)]], ink: [[RC(-58, -32, 58, 52), 6], [[[-18, -32], [-18, -52], [18, -52], [18, -32]], 6], [[[-58, -18], [58, -18]], 3]] };
const D_RADIO = { fill: [['#8a5a3a', RC(-78, -30, 78, 60)], ['#3a3a3a', EL(-34, 16, 28, 28)], ['#f5d76a', RC(8, -14, 62, 6)], ['#e9e2cf', EL(36, 34, 13, 13)]],
  ink: [[RC(-78, -30, 78, 60), 6], [EL(-34, 16, 28, 28), 5], [EL(-34, 16, 14, 14), 3], [RC(8, -14, 62, 6), 4], [[[22, -14], [22, 6]], 3], [EL(36, 34, 13, 13), 4], [[[54, -30], [92, -104]], 5], [[[-60, -30], [-60, -46], [-20, -46], [-20, -30]], 5]] };
const FOOD = [['tins', 45.6, 400, D_TIN], ['rice', 46.15, 665, D_RICE], ['pasta', 46.7, 930, D_PASTA], ['peanut butter', 47.3, 1195, D_PB]];
const KITS = [['batteries', 53.0, 420, D_BATT], ['a torch', 53.75, 730, D_TORCH], ['first aid kit', 54.35, 1050, D_KIT]];
const RADIO_T = 55.45;
function shotE(g, t) { const zk = sm(t, RADIO_T + 0.35, RADIO_T + 0.95);                        // the page pushes in on the radio (it matters on Day 24)
  g.save(); g.translate(W / 2, H / 2); g.scale(1 + 0.2 * zk, 1 + 0.2 * zk); g.translate(-W / 2 - 160 * zk, -H / 2 - 90 * zk);
  page(g, t, D1, () => {
    heading(g, t, 4, 'FOOD THAT LASTS', 42.52, 43.55);
    writeOn(g, '(the stuff that keeps for months)', W * 0.6, 252, wk(t, 44.45, '(the stuff that keeps for months)', 30), { size: 56, color: '#2a6ab8' });
    const busy = (at) => t > at - 0.1 && t < at + 0.45;
    for (const [str, at, x, spec] of FOOD) { doodle(g, x, 400, 1.05, drawK(t, at, 0.42), sm(t, at + 0.22, at + 0.5), spec, busy(at)); writeOn(g, str, x, 512, wk(t, at + 0.12, str, 30), { size: 54, pen: false }); tick(g, x + 92, 345, 30, ease.out(clamp((t - at - 0.52) / 0.22))); }
    const FR = 48.3; doodle(g, 1530, 395, 1.0, drawK(t, FR, 0.45), sm(t, FR + 0.25, FR + 0.55), D_FRIDGE, busy(FR)); writeOn(g, 'no fridge needed', 1530, 512, wk(t, FR + 0.3, 'no fridge needed', 22), { size: 50, pen: false, color: RED }); cross(g, 1530, 395, 78, so(t, 49.55, 49.95));
    inkPath(g, [[300, 572], [1700, 566]], sm(t, 50.3, 50.8), 3, alpha(INK, 0.35));
    writeOn(g, '+ the things nobody thinks of:', 650, 628, wk(t, 50.55, '+ the things nobody thinks of:', 15), { size: 62, color: '#2a6ab8' });
    for (const [str, at, x, spec] of KITS) { doodle(g, x, 780, 1.05, drawK(t, at, 0.42), sm(t, at + 0.22, at + 0.5), spec, busy(at)); writeOn(g, str, x, 892, wk(t, at + 0.12, str, 30), { size: 54, pen: false }); tick(g, x + 100, 722, 30, ease.out(clamp((t - at - 0.52) / 0.22))); }
    const rx = 1440, ry = 770; doodle(g, rx, ry, 1.3, drawK(t, RADIO_T, 0.5), sm(t, RADIO_T + 0.3, RADIO_T + 0.6), D_RADIO, busy(RADIO_T));
    writeOn(g, 'a battery radio', rx - 10, 918, wk(t, RADIO_T + 0.2, 'a battery radio', 28), { size: 60, pen: false }); tick(g, rx + 185, 770, 34, ease.out(clamp((t - RADIO_T - 0.62) / 0.22)));
    for (let i = 0; i < 3; i++) { const p = ((t - RADIO_T - 0.6) * 1.1 + i / 3) % 1; if (t > RADIO_T + 0.6) { g.strokeStyle = alpha(RED, Math.sin(Math.PI * p) * 0.9); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(rx + 120, ry - 136, 18 + p * 46, -1.2, 0.35); g.stroke(); } }   // it's picking something up
    const kr = pop(t, RADIO_T + 0.75); if (kr > 0) { note(g, 'remember this one', rx - 10, 990, { size: 54, k: kr, rot: -0.02, glow: false }); inkPath(g, EL(rx - 5, ry + 12, 150, 112, -1.9, 4.6, 30), so(t, RADIO_T + 0.8, RADIO_T + 1.25), 6, RED); } });
  g.restore(); }

// =====================================================================================================
// F — the trolley, BEANS, CLANG, mistake #1 (56.9 → 80.35). market.js action, re-timed and extended.
// =====================================================================================================
const WA = [54.7, 58.1], WB = [58.9, 60.5], FD1 = STRIDE * 5, FD2 = STRIDE * 2;
const fDist = (t) => seg(t, WA[0], WA[1], FD1) + seg(t, WB[0], WB[1], FD2);
const FX0 = 1245 - (FD1 + FD2) * MVS, fX = (t) => FX0 + fDist(t) * MVS, fSpeed = (t) => clamp((fDist(t + 0.05) - fDist(t - 0.05)) / (0.1 * PACE));
const SPOT = 58.15, REACH = 60.85, GRAB = 61.22, RAISE = 62.3, SWING = 63.82, HIT = 63.94, CLANG = 64.3, ROLL = 69.45, STILL = 74.2, COME = 76.0;
const fTurn = (t) => track(t, [[REACH - 0.45, 0.72], [REACH - 0.1, 1], [GRAB + 0.15, 1], [GRAB + 0.55, 0.55], [RAISE - 0.12, 0.55], [RAISE + 0.24, -0.5]]);
const fSneak = (t) => 1 - sm(t, SPOT, SPOT + 0.3);
const fLean = (t) => -4 * fSpeed(t) - 4 * fSneak(t) + 7 * startle(t - SPOT) - 7 * bump(t, SPOT + 0.15, SPOT + 1.0) - 15 * bump(t, REACH - 0.1, GRAB + 0.5)
  + trackSpring(t, [[0, 0], [GRAB + 0.3, 4], [RAISE, -6], [SWING, -11], [CLANG + 0.1, -7]], { feel: 'heavy', windUp: 0.05 }) - 4 * startle(t - CLANG);
const fCrouch = (t) => 1.2 * fSneak(t) + 5 * bump(t, SPOT - 0.05, SPOT + 0.45) + 5 * bump(t, REACH, GRAB + 0.4) + 3 * bump(t, GRAB + 0.15, GRAB + 0.45) + 4 * bump(t, RAISE - 0.14, RAISE + 0.1)
  + 5 * startle(t - CLANG) + 3 * sm(t, CLANG, CLANG + 0.5) + Math.max(0, settle(t, WB[1] + 0.3, 2.5, 12, 7));
const fDrive = (t) => fX(t) + fTurn(t) * 30 - fLean(t) * 4;
const TIN = [1356, 645];                                   // where the tin sits in the trolley
const REACH_HAND = [0, (TIN[1] - (FLOOR - 228 * MVS)) / MVS + 6, (TIN[0] - 1245) / MVS];
const SHOW_HAND = [-2, -6, 62], RAISE_HAND = [30, -86, 0], ELBOW_OUT = [46, -52, -10];
const SHELF_TIN = [1436, 487], LAND = [1392, 962];           // the tin his elbow knocks off, and where it hits the floor
const mY = (y) => 0.00247 * (y - 409);                       // aisle perspective: character scale at floor y
function fOpts(t) {
  const x = fX(t), fl = startle(t - CLANG), held = t >= GRAB, frozen = sm(t, CLANG + 0.3, CLANG + 1.0);
  const expr = exprTrack(t, [[0, 'worried'], [SPOT, 'shock'], [SPOT + 0.5, 'happy'], [SPOT + 0.95, 'determined'], [GRAB + 0.2, 'shock'], [GRAB + 0.75, 'happy'], [CLANG, 'terror'], [CLANG + 1.3, 'scared'], [COME + 0.75, 'terror']]);
  // eyes lead every move; after the clang they are the only thing that moves
  const look = t < SPOT ? [0.5, 0.15] : t < REACH ? [0.75, 0.2] : t < GRAB + 0.1 ? [0.7, 0.5] : t < RAISE ? [0.65, 0.2] : t < CLANG ? [lerp(0.65, 0.5, so(t, RAISE, RAISE + 0.12)), -0.85]
    : t < 67.4 ? [lerp(0.5, 0.9, so(t, CLANG + 0.02, CLANG + 0.12)), 0.8] : t < ROLL ? [lerp(0.9, 0.75, so(t, 67.4, 67.5)), -0.6] : t < STILL ? [lerp(0.75, -0.6, sm(t, ROLL, ROLL + 2.6)), 0.55]
    : t < COME + 0.6 ? [track(t, [[STILL, -0.6], [STILL + 0.1, 0.9], [STILL + 0.75, 0.9], [STILL + 0.85, -0.9], [STILL + 1.5, -0.9], [STILL + 1.6, 0.2]]), 0.1] : [lerp(0.2, -1, so(t, COME + 0.6, COME + 0.72)), -0.1];
  const armL = armSpring(t, [[0, SNEAK_L], [SPOT - 0.02, 'out'], [SPOT + 0.25, 'chest'], [SPOT + 0.9, 'relaxed'], [REACH, BACK], [GRAB + 0.25, [-4, 14, 50]], [RAISE - 0.02, 'hips'], [CLANG, 'out']], { feel: 'snappy', windUp: 0.05 });
  const armR = armSpring(t, [[0, SNEAK_R], [SPOT, 'out'], [SPOT + 0.14, 'point'], [SPOT + 0.9, 'relaxed'], [REACH, REACH_HAND], [GRAB + 0.12, SHOW_HAND], [RAISE, RAISE_HAND], [SWING, ELBOW_OUT]], { delay: 0.04 });
  const step = fDist(t) / STRIDE, wkk = fSpeed(t);
  for (const [h, ph] of [[armL[1], 0], [armR[1], 1]]) { const sw = Math.sin(Math.PI * (step + ph)) * wkk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }
  const adm = Math.sin((t - GRAB) * 5) * 2 * sm(t, GRAB + 0.5, GRAB + 0.8) * (1 - sm(t, RAISE - 0.2, RAISE)); armR[1][1] += adm; armL[1][1] -= adm;      // he turns the tin over, admiring it
  const headTilt = -1.2 * Math.sin(2 * Math.PI * step) * wkk + overlap(fLean, t, 0.09, 0.8) + 8 * bump(t, GRAB + 0.2, RAISE - 0.1) - 7 * sm(t, RAISE, RAISE + 0.25) * (1 - sm(t, CLANG, CLANG + 0.15)) - 6 * fl;
  const energy = (1 - 0.7 * fSpeed(t)) * (1 - frozen);
  return withAlive({ x, y: FLOOR, s: MVS, t, turn: fTurn(t), expr, look, lean: fLean(t), headTilt, hipX: 4 * fl - 2 * startle(t - SPOT), crouch: fCrouch(t),
    walkDist: fDist(t), stride: STRIDE, lift: 12, smoothGait: true, walkSquash: 0.25, walkMix: 1 - sm(t, WB[1] + 0.05, WB[1] + 0.45), ...lagsOf(fDrive, t),
    breath: t > CLANG ? 0.5 * (1 - frozen) : breathe(t, 1.4, 0.5), squash: 0.8 * startle(t - SPOT) + fl + 0.6 * startle(t - HIT), shake: t > CLANG ? 0.5 * fl + 0.16 * (1 - sm(t, STILL - 0.4, STILL)) : 0.25 * startle(t - SPOT), arms: [armL, armR],
    props: { right: held ? (g2, h, info) => tin(g2, h[0] + 2, h[1] - 14 * info.s, 0.95 * info.s / MVS, 0.1 - 0.25 * fl + 0.02 * Math.sin((t - GRAB) * 5) * (t < RAISE ? 1 : 0)) : null } }, t, { energy });
}
// the knocked tin: tips off the shelf, drops, bounces twice, then rolls away down the aisle (into depth)
function fallenTin(t) { const dt = t - HIT; if (dt <= 0) return { x: SHELF_TIN[0], y: SHELF_TIN[1], s: 0.95, rot: 0 };
  const T0 = CLANG - HIT, [lx, ly] = LAND;
  if (t < CLANG) { const u = dt / T0; return { x: lerp(SHELF_TIN[0], lx, ease.out(u) * 0.9 + u * 0.1), y: lerp(SHELF_TIN[1], ly, u * u), s: 0.95 + 0.1 * u, rot: -u * u * 3.6 }; }
  const d = t - CLANG, b1 = 0.32, b2 = 0.22;
  const hop = d < b1 ? 95 * Math.sin(Math.PI * d / b1) : d < b1 + b2 ? 34 * Math.sin(Math.PI * (d - b1) / b2) : 0;
  const r = 1 - Math.exp(-Math.max(0, d - 0.25) * 0.42), yy = lerp(ly, 742, r), xx = lerp(lx - 46 * clamp(d / 0.5), 1010, r);          // rolling away, slower and slower
  const spin = d < b1 + b2 ? -3.6 - (Math.PI / 2 - 3.6 + Math.PI * 2) * -1 * clamp(d / (b1 + b2)) : 0;
  return { x: xx, y: yy - hop * mY(yy) / mY(ly), s: 1.05 * mY(yy) / mY(ly), rot: d < b1 + b2 ? lerp(-3.6, -Math.PI * 1.5, ease.out(d / (b1 + b2))) : -Math.PI * 1.5 + Math.sin(d * 9) * 0.05 * Math.exp(-d * 0.5), rolling: d > b1 + b2, r, spin }; }
function shotF(g, t, A) {
  const x = fX(t), o = fOpts(t), aft = t - CLANG;
  let view, shake = [0, 0];
  if (t < CLANG) view = punches(t, { z: lerp(1.3, 1.4, sm(t, E1, 60.5)) - 0.06 * sm(t, RAISE - 0.2, RAISE + 0.4), x: lerp(1010, 1180, sm(t, E1, 60.5)), y: 692 - 34 * sm(t, RAISE - 0.2, RAISE + 0.4) },
    [[SPOT + 0.02, 0.32, { z: 2.1, x: x + 60, y: 600 }, 0.4], [60.12, 0.5, { z: 2.3, x: 1340, y: 640 }, 0.4], [GRAB + 0.3, 0.6, { z: 2.05, x: 1290, y: 580 }, 0.4]]);
  else if (t < ROLL) { view = punches(t, { z: lerp(1.34, 1.28, sm(t, CLANG, ROLL)), x: lerp(1180, 1140, sm(t, CLANG, CLANG + 1)), y: lerp(658, 690, sm(t, CLANG, CLANG + 0.5)) }, [[CLANG + 0.5, 0.45, { z: 2.2, x: 1262, y: 585 }, 0.45], [67.45, 0.8, { z: 2.1, x: 1350, y: 520 }, 0.5]]); shake = camShake(t, 9, CLANG, 0.45); }
  else if (t < STILL) view = { z: lerp(1.0, 1.12, sm(t, ROLL, STILL)), x: lerp(960, 1010, sm(t, ROLL, STILL)), y: lerp(600, 640, sm(t, ROLL, STILL)) };                      // CUT: the whole aisle, the sound rolling down it
  else if (t < COME) view = { z: lerp(2.15, 2.3, sm(t, STILL, COME)), x: 1262, y: lerp(580, 572, sm(t, STILL, COME)), blur: 2.5 };                                         // CUT: close on Vini. Only his eyes move.
  else view = { z: lerp(2.0, 1.42, sm(t, COME + 0.9, F1 - 0.3)), x: lerp(985, 1085, sm(t, COME + 0.9, F1 - 0.3)), y: lerp(610, 668, sm(t, COME + 0.9, F1 - 0.3)) };      // CUT: the far end of the aisle
  const c = camBegin(g, A.bg.supermarket, view, shake);
  // sound rolling down the aisle: rings on the floor that travel into depth
  const ft = fallenTin(t);
  if (aft > 0 && t < STILL) for (let i = 0; i < 4; i++) { const p = aft * 1.6 - i * 0.22; if (p > 0 && p < 1) { g.strokeStyle = alpha('#f4efe2', 0.75 * (1 - p)); g.lineWidth = 5; g.beginPath(); g.ellipse(LAND[0], LAND[1] + 6, 60 + p * 300, 14 + p * 62, 0, 0, 7); g.stroke(); } }
  if (t > ROLL - 0.1 && t < STILL) for (let i = 0; i < 6; i++) { const p = ((t - ROLL) * 0.42 + i / 6) % 1, yy = lerp(905, 668, ease.out(p)), sc = mY(yy) / mY(930), a = Math.sin(Math.PI * p) * 0.7 * sm(t, ROLL - 0.1, ROLL + 0.3) * (1 - sm(t, STILL - 0.5, STILL));
    g.strokeStyle = alpha('#f4efe2', a); g.lineWidth = 2 + 5 * sc; g.beginPath(); g.ellipse(lerp(1150, 980, ease.out(p)), yy, 430 * sc, 60 * sc, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); }
  // the thing at the far end: dark against the lit freezer, then closer
  if (t > COME + 0.2) { const zy = 409 + (656 - 409) * Math.exp(0.082 * Math.max(0, t - COME - 0.9)), zk = clamp((t - COME - 0.9) / 3.4);
    drawZombie(g, A.zombie, { kind: 'worker', x: 968 + 16 * zk, y: zy, s: mY(zy), t, seed: 2.3, dir: 0, walk: t > COME + 0.9, alpha: so(t, COME + 0.25, COME + 0.8), b: lerp(0.2, 0.62, zk), expr: t > COME + 2 ? 'groan' : 'zombie', headTurn: 0.5 * (1 - sm(t, COME + 0.6, COME + 1.0)) }); }
  if (t < GRAB) tin(g, TIN[0], TIN[1], 0.95, 0.06);
  tin(g, 1476, 487, 0.95, 0);                                 // its neighbour stays on the shelf
  if (ft.rolling || t < HIT + 0.001) drawTinAt(g, ft, t);     // on the shelf / rolling away: behind Vini
  drawVini(g, A.vini, o);
  if (!ft.rolling && t >= HIT + 0.001) drawTinAt(g, ft, t);   // falling and bouncing: in front
  if (t > HIT && t < HIT + 0.25) { const k = (t - HIT) / 0.25; g.strokeStyle = alpha('#f4efe2', 1 - k); g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = -2.4 + i * 0.5; g.beginPath(); g.moveTo(1418 + Math.cos(a) * (14 + k * 18), 500 + Math.sin(a) * (14 + k * 18)); g.lineTo(1418 + Math.cos(a) * (28 + k * 36), 500 + Math.sin(a) * (28 + k * 36)); g.stroke(); } }
  if (aft > 0 && aft < 0.3) { const k = aft / 0.3; g.strokeStyle = alpha('#ffffff', 1 - k); g.lineWidth = 7; g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; g.beginPath(); g.moveTo(LAND[0] + Math.cos(a) * (30 + k * 50), LAND[1] + Math.sin(a) * (22 + k * 36)); g.lineTo(LAND[0] + Math.cos(a) * (60 + k * 110), LAND[1] + Math.sin(a) * (44 + k * 80)); g.stroke(); } }
  /*DBG*/ for (const [bn, col] of [['forearm_r', '#f00'], ['hand_r', '#00f'], ['upperarm_r', '#ff0']]) { const [qx2, qy2] = boneScreen(A.vini, o, bn); g.fillStyle = col; g.beginPath(); g.arc(qx2, qy2, 5, 0, 7); g.fill(); } for (let gx = 1200; gx <= 1500; gx += 50) { g.fillStyle = '#0ff'; g.fillRect(gx, 400, 1, 250); } for (let gy = 400; gy <= 650; gy += 50) g.fillRect(1200, gy, 300, 1);
  camEnd(g);
  // ---- overlays
  const [tx, ty] = toScreen(c, 1352, 520), ks = pop(t, SPOT + 0.17) * (1 - sm(t, 59.7, 60.0));
  if (ks > 0) note(g, 'supplies?', tx + 150, ty - 70, { size: 60, k: ks });
  const [bx, by] = toScreen(c, TIN[0], TIN[1]);
  if (t > 60.1 && t < GRAB + 0.1) { const kb = pop(t, 60.14) * (1 - sm(t, GRAB - 0.2, GRAB + 0.05)); note(g, 'beans.', bx - 250, by - 150, { size: 84, k: kb }); arrowTo(g, bx - 190, by - 110, bx - 40, by - 20, so(t, 60.2, 60.5) * kb, RED, -20); }
  if (t > 61.3 && t < RAISE + 0.1) note(g, 'ACTUAL beans.', W * 0.3, H * 0.3, { size: 84, k: pop(t, 61.35) * (1 - sm(t, RAISE - 0.3, RAISE)), rot: -0.05 });
  if (t > RAISE && t < CLANG) { note(g, 'BEANS!!', W * 0.27, H * 0.3, { size: 120, k: pop(t, RAISE + 0.35) * (1 - sm(t, CLANG - 0.12, CLANG)), rot: -0.06 }); note(g, '(like a trophy)', W * 0.27, H * 0.42, { size: 52, k: pop(t, 63.0) * (1 - sm(t, CLANG - 0.12, CLANG)), color: '#ece6d6', glow: false }); }
  if (t >= CLANG && t < ROLL) bigText(g, 'CLANG', W * 0.3 + Math.sin(t * 34) * 7 * (1 - sm(t, CLANG, CLANG + 0.8)), H * 0.27, { size: 230, k: pop(t, CLANG, 0.22) * (1 - sm(t, V1 - 0.25, V1 + 0.05)), rot: -0.08, color: '#ff4a3a' });
  if (t >= V1 && t < ROLL) mistake(g, 1, W * 0.27, H * 0.24, t, V1 + 0.12);
  if (t > 67.4 && t < ROLL) { const [ex, ey] = toScreen(c, ...boneScreen(A.vini, o, 'forearm_l')), ke = 1 - sm(t, ROLL - 0.3, ROLL); note(g, 'his elbow', ex - 330, ey + 170, { size: 70, k: pop(t, 67.5) * ke }); arrowTo(g, ex - 250, ey + 130, ex - 26, ey + 16, so(t, 67.55, 67.9) * ke, RED, -30);
    const [qx, qy] = toScreen(c, 1436, 500); note(g, 'the shelf', qx + 200, qy - 150, { size: 64, k: pop(t, 68.1) * ke, rot: 0.04 }); arrowTo(g, qx + 170, qy - 110, qx + 30, qy - 10, so(t, 68.15, 68.5) * ke, RED, 30); }
  if (t >= ROLL && t < STILL) { const [rx, ry] = toScreen(c, ft.x, ft.y); note(g, 'one tin.', rx + 210, ry - 60, { size: 64, k: pop(t, ROLL + 0.2) * (1 - sm(t, 71.4, 71.8)) }); arrowTo(g, rx + 150, ry - 40, rx + 36, ry - 6, so(t, ROLL + 0.3, ROLL + 0.6) * (1 - sm(t, 71.4, 71.8)), RED, 10);
    [[0.6, 500, 500, 86], [1.5, 690, 400, 62], [2.4, 835, 330, 44], [3.3, 930, 290, 30]].forEach(([d, ex, ey, sz], i) => note(g, i === 3 ? 'clang…' : 'clang', ex, ey, { size: sz, k: pop(t, ROLL + d) * (1 - sm(t, ROLL + d + 1.5, ROLL + d + 2.3)), color: '#ece6d6', glow: false, rot: -0.1 + i * 0.03 }));
    note(g, 'every aisle in the shop', W * 0.7, H * 0.2, { size: 70, k: pop(t, 72.1) * (1 - sm(t, STILL - 0.3, STILL)), rot: 0.03 }); }
  if (t >= STILL && t < COME) note(g, '…don’t. move.', W * 0.26, H * 0.36, { size: 84, k: pop(t, STILL + 0.15), color: '#ece6d6', glow: false, rot: -0.04 });
  if (t >= COME + 0.9) { const [zx, zy] = toScreen(c, 975, 600), kz = pop(t, COME + 1.3); note(g, 'something', zx - 330, zy - 190, { size: 76, k: kz, rot: -0.05 }); arrowTo(g, zx - 250, zy - 150, zx - 50, zy - 40, so(t, COME + 1.4, COME + 1.8), RED, -30);
    note(g, '(walking towards the noise)', W * 0.3, H * 0.9, { size: 56, k: pop(t, 78.4), color: '#ece6d6', glow: false }); }
  day(g, t); vignette(g, t < CLANG ? 0.36 : 0.5 + 0.08 * sm(t, COME, F1)); }
function drawTinAt(g, ft, t) { if (ft.rolling) { g.fillStyle = 'rgba(25,20,16,0.3)'; g.beginPath(); g.ellipse(ft.x, ft.y + 15 * ft.s, 26 * ft.s, 6 * ft.s, 0, 0, 7); g.fill(); }
  tin(g, ft.x, ft.y - (ft.rolling ? 0 : 22 * ft.s), ft.s, ft.rot);
  if (ft.rolling && ft.r < 0.93) { const v = 1 - ft.r; g.strokeStyle = alpha('#f4efe2', 0.6 * v); g.lineWidth = 3 * ft.s; g.lineCap = 'round'; for (const dy of [-8, 8]) { g.beginPath(); g.moveTo(ft.x + 30 * ft.s, ft.y + (dy + 26) * ft.s); g.lineTo(ft.x + (30 + 46 * v) * ft.s, ft.y + (dy + 26 + 20 * v) * ft.s); g.stroke(); } } }

// =====================================================================================================
// G — out the back and home: tracker, the bag, the radio, Vini's own rule (80.35 → 89.9)
// =====================================================================================================
const GY = 968, GS = sY(GY), GSPD = 150, GT0 = 81.45, gDist = (t) => GSPD * Math.max(0, t - GT0), gX = (t) => 2060 - gDist(t) * GS;
function radioProp(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(22, -40); g.lineTo(40, -112); g.stroke(); g.fillStyle = '#c8262e'; g.beginPath(); g.arc(40, -114, 5, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#8a5a3a'; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-34, -44, 68, 62, 6); g.fill(); g.stroke();
  g.fillStyle = '#3a3a3a'; g.beginPath(); g.arc(-12, -14, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f5d76a'; g.fillRect(8, -34, 20, 10); g.strokeRect(8, -34, 20, 10); g.fillStyle = '#e9e2cf'; g.beginPath(); g.arc(18, -8, 6, 0, 7); g.fill(); g.stroke(); g.restore(); }
function shotG(g, t, A) {
  const x = gX(t), d = gDist(t), step = d / STRIDE, RULE = 87.3;
  const c = camBegin(g, A.bg.street, { z: lerp(1.2, 1.3, sm(t, F1, DUR)), x: lerp(1080, 820, sm(t, 81.5, DUR)), y: 716 });
  const leanAt = (tt) => 9 + 2 * Math.sin(2 * Math.PI * gDist(tt) / STRIDE);                    // leaning into it (he faces screen-left)
  const hug = (ph) => [-17, 37 + Math.sin(Math.PI * step * 2 + ph) * 2.5, 33];
  const expr = exprTrack(t, [[0, 'scared'], [84.0, 'worried'], [RULE + 0.2, 'determined']]);
  const look = t < 83.4 ? [-0.7, 0.1] : t < 84.3 ? [lerp(-0.7, 0.9, so(t, 83.4, 83.52)), 0] : t < RULE ? [lerp(0.9, -0.7, so(t, 84.3, 84.42)), 0.1] : [lerp(-0.7, -0.2, so(t, RULE, RULE + 0.12)), 0.7];
  const o = withAlive({ x, y: GY, s: GS, t, turn: -0.72, expr, look, lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) + 3 - 6 * bump(t, 83.4, 84.4) + 5 * sm(t, RULE, RULE + 0.3), crouch: 2.2,
    walkDist: -d, stride: STRIDE, lift: 17, smoothGait: true, walkSquash: 0.25, hairLag: clamp(1.5 + Math.sin(2 * Math.PI * step) * 1, -2.5, 2.5), packLag: -4 + Math.sin(2 * Math.PI * step + 0.8) * 3.5,
    breath: breathe(t, 0.7, 0.8), arms: [hug(0), hug(0.6)], props: { left: (g2, h, info) => tin(g2, h[0] - 4 * info.s, h[1] - 8 * info.s, 1.05 * info.s / MVS * 1.25, -0.12 + Math.sin(2 * Math.PI * step) * 0.04) } }, t, { energy: 0.3 });
  const [px, py] = boneScreen(A.vini, o, 'chest'), bob = Math.sin(2 * Math.PI * step + 0.8) * 0.06;
  radioProp(g, px + 62 * GS, py - 96 * GS, GS * 0.95, 0.22 + bob);                                // the radio pokes out of the top of the bag
  tin(g, px + 96 * GS, py - 92 * GS, GS * 0.8, 0.5 + bob, { color: '#3f6fb0' });
  drawVini(g, A.vini, o);
  camEnd(g);
  g.save(); g.translate(-470 * sm(t, 86.0, 86.5), 0);
  tracker(g, t, F1 + 0.2, [1, lerp(0.3, 0.86, sm(t, F1 + 0.55, F1 + 1.5)), 0.5 * sm(t, F1 + 0.9, F1 + 1.7)], { labels: ['BATH FULL', t < F1 + 1.0 ? '3 DAYS' : '3 WEEKS', t < F1 + 1.3 ? 'NONE' : '8'] }); g.restore();
  const kt = pop(t, F1 + 0.6) * (1 - sm(t, 82.9, 83.3)); note(g, 'food: 3 WEEKS', 640, H - 150, { size: 64, k: kt }); note(g, 'batteries: 8', 620, H - 84, { size: 54, k: pop(t, F1 + 1.3) * (1 - sm(t, 82.9, 83.3)) });
  const [sx, sy] = toScreen(c, px + 62 * GS, py - 60 * GS);
  if (t > 84.3) { const kb = pop(t, 84.35) * (1 - sm(t, 86.6, 86.9)); note(g, 'the bag', sx + 230, sy + 130, { size: 62, k: kb }); arrowTo(g, sx + 170, sy + 110, sx + 30, sy + 60, so(t, 84.45, 84.75) * kb, RED, 20); }
  if (t > 85.1) { const kr = pop(t, 85.15) * (1 - sm(t, 86.6, 86.9)); note(g, 'the radio', sx + 250, sy - 150, { size: 62, k: kr, rot: 0.04 }); arrowTo(g, sx + 200, sy - 115, sx + 40, sy - 70, so(t, 85.25, 85.55) * kr, RED, 20); }
  // Vini's own rule: a scrap of notebook paper
  const kc = pop(t, 85.75, 0.35); if (kc > 0) { g.save(); g.translate(1010, 196); g.rotate(-0.025 + settle(t, 86.05, 0.02, 14, 6)); g.scale(0.6 + 0.4 * kc, 0.6 + 0.4 * kc); g.globalAlpha = clamp(kc * 2);
    g.fillStyle = alpha('#000', 0.4); g.fillRect(-500 + 10, -112 + 14, 1000, 224); g.fillStyle = '#e9e2cf'; g.fillRect(-500, -112, 1000, 224); g.strokeStyle = alpha('#6a8fb8', 0.35); g.lineWidth = 2; for (const ly of [-52, 6, 64]) { g.beginPath(); g.moveTo(-480, ly); g.lineTo(480, ly); g.stroke(); }
    g.strokeStyle = alpha(RED, 0.45); g.lineWidth = 3; g.beginPath(); g.moveTo(-410, -112); g.lineTo(-410, 112); g.stroke();
    writeOn(g, 'VINI’S RULE:', -385, -56, wk(t, 85.9, 'VINI’S RULE:', 14), { size: 70, color: RED, font: 'Permanent Marker', align: 'left', rot: -0.01 });
    const s1 = 'hold things with ', s2 = 'TWO', s3 = ' hands'; g.font = '700 82px "Patrick Hand", sans-serif'; const w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, x0 = -385;
    writeOn(g, s1, x0, 46, wk(t, RULE, s1, 16), { size: 82, align: 'left', rot: 0 }); writeOn(g, s2, x0 + w1, 46, wk(t, RULE + 1.0, s2, 9), { size: 82, align: 'left', rot: 0, color: RED }); writeOn(g, s3, x0 + w1 + w2, 46, wk(t, RULE + 1.35, s3, 16), { size: 82, align: 'left', rot: 0 });
    inkPath(g, [[x0 + w1 - 4, 90], [x0 + w1 + w2 + 6, 86]], so(t, RULE + 1.4, RULE + 1.65), 7, RED); g.restore(); }
  day(g, t); vignette(g, 0.38); fade(g, sm(t, DUR - 0.45, DUR)); }

// =====================================================================================================
export function draw(g, t, A) { g.save();
  if (t < A1) shotA(g, t, A); else if (t < B1) shotB(g, t); else if (t < C1) shotC(g, t, A); else if (t < D1) shotD(g, t, A); else if (t < E1) shotE(g, t); else if (t < F1) shotF(g, t, A); else shotG(g, t, A);
  g.restore(); }
