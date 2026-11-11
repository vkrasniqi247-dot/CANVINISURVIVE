// src/scenes/day1b.js — DAY 1 after the test window (episode 60.2 → 105.4), ported from reference/v1/02_day1.js (d6–d12)
// at the new quality level: rigged Vini and infected, the pen draws every doodle, pages flip between notebook shots.
import { W, H, RED, INK, clamp, lerp, ease, alpha, rng, sm, so, pop, settle, armTrack, pick, camBegin, camEnd, punches, toScreen, camShake, note, arrowTo, bigText, fade, vignette, nightGrade, dayCounter, tracker, notebook, inkPath, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { drawZombie, drawRunner, strideSpeed } from '../zombie/zombie.js';
import { sY, hordeAt } from './hook.js';

export const DAY1B_SHOTS = [['d6', 60.2, 71.3], ['d7', 71.3, 78.2], ['d8', 78.2, 83.3], ['d9', 83.3, 91.0], ['d10', 91.0, 95.2], ['d11', 95.2, 101.9], ['d12', 101.9, 105.4]];
const DAY1 = 28.73;
let HUD = true; export const setHud = (v) => { HUD = v; };
const day = (g, gt) => { if (HUD) dayCounter(g, 1, gt, DAY1); };
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const wk = (gt, at, str, cps = 18) => clamp((gt - at) / Math.max(0.25, str.length / cps));
const drawK = (gt, at, dur = 0.5) => ease.out(clamp((gt - at + 0.08) / dur));

// ---------- d6: the streets are the most dangerous place — crashed cars, panicked crowds… crowds that bite ----------
const RUNNERS = [{ x0: 1020, y: 842, seed: 0.3, kind: 'runnerA' }, { x0: 930, y: 828, seed: 1.7, kind: 'runnerB' }];
const CROWD = [{ kind: 'worker', x: 900, y0: 812, seed: 0.4 }, { kind: 'office', x: 1015, y0: 826, seed: 1.1 }, { kind: 'teen', x: 1105, y0: 806, seed: 2.2 }, { kind: 'office', x: 815, y0: 800, seed: 3.3 }, { kind: 'teen', x: 965, y0: 790, seed: 4.4 }];
function d6(g, gt, A) { const t = gt - 60.2, dur = 11.1;
  const c = camBegin(g, A.bg.street, punches(gt, { z: lerp(1.15, 1.42, sm(t, 0, dur)), x: lerp(700, 1000, sm(t, 0, 6.5)), y: lerp(720, 770, sm(t, 0, dur)) }, [[69.85, 9, { z: 1.85, x: 960, y: 760 }]]));
  const items = [];
  // panicked people sprint across the road (feet planted: travel = stride × steps)
  for (const r of RUNNERS) { const s = sY(r.y), travel = strideSpeed(s, 2.3) * Math.max(0, gt - 67.2), x = r.x0 + travel; if (gt < 67.2 || x > 2100) continue;
    items.push([r.y, () => drawRunner(g, A.zombie, { kind: r.kind, x, y: r.y, s, t: gt, seed: r.seed, dir: 1, walkDist: travel / s })]); }
  // the crowd that bites: shambling in from the far road
  if (gt > 68.6) for (const z of CROWD) { const p = hordeAt({ ...z, start: 68.6 }, gt, 1.6); items.push([p.y, () => drawZombie(g, A.zombie, { kind: z.kind, ...p, t: gt, seed: z.seed, dir: 0, alpha: so(gt, 68.6, 69.1), expr: gt > 69.9 ? 'groan' : 'zombie' })]); }
  items.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
  camEnd(g);
  note(g, 'the most dangerous place', W * 0.5, H * 0.15, { size: 76, k: pop(gt, 63.0) * (1 - sm(gt, 65.9, 66.2)) });
  const [cx, cy] = toScreen(c, 430, 700), kc = pop(gt, 66.3) * (1 - sm(gt, 69.6, 69.85)); if (kc > 0) { note(g, 'crashed cars', cx + 40, cy - 190, { size: 66, k: kc }); arrowTo(g, cx + 40, cy - 150, cx, cy - 30, so(gt, 66.35, 66.75) * kc); }
  note(g, 'panicked crowds', W * 0.78, H * 0.58, { size: 66, k: pop(gt, 67.3) * (1 - sm(gt, 69.2, 69.5)), rot: 0.03 });
  note(g, '…that BITE', W * 0.52, H * 0.22, { size: 96, k: pop(gt, 69.9) });
  day(g, gt); vignette(g, 0.38); }

// ---------- notebook pieces ----------
function heading(g, gt, n, title, tN, tT) {
  writeOn(g, `RULE ${n}`, 360, 165, wk(gt, tN, `RULE ${n}`, 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [362, 216], [462, 220]], ease.out(clamp((gt - tN - 0.55) / 0.3)), 7, RED);
  writeOn(g, title, W * 0.6, 168, wk(gt, tT, title, 13), { size: 78, color: '#2a2622', font: 'Permanent Marker' }); }
// strokes drawn one after another by length, with the pen on the active tip (same as the RULE 1 page)
function penStrokes(g, strokes, k, col = INK) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w, col);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]); }
function waterFill(g, path, k, top, bottom, t) { if (k <= 0) return; g.save(); path(); g.clip(); const y = lerp(bottom, top, ease.out(clamp(k)));
  g.fillStyle = 'rgba(70,150,210,0.75)'; g.fillRect(-W, y, W * 3, H); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.beginPath(); for (let x = -400; x < 2400; x += 10) g.lineTo(x, y + Math.sin(x * 0.08 + t * 5) * 3 * (1 - clamp(k) * 0.6)); g.stroke(); g.restore(); }
function bath(g, x, y, k, w, t) { const P = () => { g.beginPath(); g.moveTo(x - 150, y - 50); g.lineTo(x + 150, y - 50); g.quadraticCurveTo(x + 150, y + 70, x + 90, y + 70); g.lineTo(x - 90, y + 70); g.quadraticCurveTo(x - 150, y + 70, x - 150, y - 50); g.closePath(); };
  waterFill(g, P, w, y - 40, y + 70, t); penStrokes(g, [[[[x - 160, y - 50], [x + 160, y - 50]], 7], [[[x - 150, y - 50], [x - 150, y + 20], [x - 120, y + 65], [x + 120, y + 65], [x + 150, y + 20], [x + 150, y - 50]], 7], [[[x - 110, y + 68], [x - 120, y + 95]], 7], [[[x + 110, y + 68], [x + 120, y + 95]], 7], [[[x + 120, y - 50], [x + 120, y - 110], [x + 90, y - 110]], 7]], k); }
function sink(g, x, y, k, w, t) { const P = () => { g.beginPath(); g.moveTo(x - 90, y - 30); g.lineTo(x + 90, y - 30); g.quadraticCurveTo(x + 80, y + 60, x, y + 60); g.quadraticCurveTo(x - 80, y + 60, x - 90, y - 30); g.closePath(); };
  waterFill(g, P, w, y - 24, y + 60, t); penStrokes(g, [[[[x - 100, y - 30], [x + 100, y - 30]], 7], [[[x - 90, y - 30], [x - 70, y + 40], [x, y + 60], [x + 70, y + 40], [x + 90, y - 30]], 7], [[[x, y + 60], [x, y + 120]], 7], [[[x + 40, y - 30], [x + 40, y - 80], [x + 10, y - 80]], 7]], k); }
function pan(g, x, y, k, w, t) { const P = () => { g.beginPath(); g.rect(x - 80, y - 40, 160, 90); };
  waterFill(g, P, w, y - 30, y + 50, t); penStrokes(g, [[[[x - 80, y - 40], [x - 80, y + 50], [x + 80, y + 50], [x + 80, y - 40]], 7], [[[x + 80, y - 20], [x + 170, y - 30]], 9]], k); }
function bottle(g, x, y, k, w, t) { const P = () => { g.beginPath(); g.roundRect(x - 40, y - 60, 80, 140, 14); };
  waterFill(g, P, w, y - 50, y + 80, t); penStrokes(g, [[[[x - 18, y - 100], [x - 18, y - 80], [x - 40, y - 60], [x - 40, y + 80], [x + 40, y + 80], [x + 40, y - 60], [x + 18, y - 80], [x + 18, y - 100], [x - 18, y - 100]], 7]], k); }
// the page lands with a slight untwist each time it flips in
function page(g, gt, t0, body) { const land = so(gt, t0 - 0.25, t0 + 0.25); g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03 * (1 - land) + settle(gt, t0 + 0.25, 0.005, 11, 6)); g.translate(-W / 2 + 50 * (1 - land), -H / 2 + 22 * (1 - land)); notebook(g, gt); body(); g.restore(); vignette(g, 0.2); }

// ---------- d7: RULE 2 — fill everything with water ----------
function d7(g, gt) { page(g, gt, 71.3, () => {
  heading(g, gt, 2, 'FILL EVERYTHING', 71.4, 72.3); writeOn(g, 'with water', W * 0.6, 252, wk(gt, 73.5, 'with water', 18), { size: 60, color: '#2a6ab8', pen: gt > 73.5 });
  const items = [[430, 'the bath', 74.75, bath], [820, 'the sink', 75.38, sink], [1190, 'every pan', 76.42, pan], [1530, 'every bottle', 76.9, bottle]];
  for (const [x, str, at, fn] of items) { fn(g, x, 560, drawK(gt, at - 0.1, 0.45), sm(gt, at + 0.35, at + 1.6), gt); writeOn(g, str, x, 790, wk(gt, at + 0.1, str, 26), { size: 56, pen: false }); } }); }

// ---------- d8: the taps are often one of the first things to go ----------
function d8(g, gt) { page(g, gt, 78.2, () => {
  const x = 860, y = 380, k = drawK(gt, 78.3, 0.6);
  penStrokes(g, [[[[x - 260, y - 60], [x - 60, y - 60], [x + 40, y - 40], [x + 80, y + 10], [x + 80, y + 60]], 12], [[[x - 260, y - 10], [x - 60, y - 10], [x + 20, y + 10], [x + 30, y + 60]], 12], [[[x - 120, y - 60], [x - 120, y - 120]], 12], [[[x - 180, y - 130], [x - 60, y - 130]], 14]], k);
  const flow = 1 - sm(gt, 81.2, 82.3), mx = x + 55, my = y + 62;
  if (k >= 1) { if (flow > 0.02) { g.fillStyle = 'rgba(70,150,210,0.85)'; g.fillRect(mx - 14 * flow, my, 28 * flow, 380); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const yy = my + ((gt * 600 + i * 70) % 380); g.beginPath(); g.moveTo(mx - 6 * flow, yy); g.lineTo(mx - 6 * flow, yy + 26); g.stroke(); } }
    for (let i = 0; i < 3; i++) { const p = ((gt - 81.6) * 0.9 + i * 0.33) % 1; if (gt > 81.6 && gt < 83.1 && p > 0) { g.fillStyle = 'rgba(70,150,210,0.9)'; g.beginPath(); g.ellipse(mx, my + p * 380, 9, 13, 0, 0, 7); g.fill(); } } }
  inkPath(g, [[x - 260, 850], [x + 400, 850]], k, 6);
  writeOn(g, 'when a city breaks down…', W * 0.5, 165, wk(gt, 78.4, 'when a city breaks down…', 26), { size: 66, pen: k >= 1 });
  note(g, 'one of the FIRST things to go', 1360, 560, { size: 66, k: pop(gt, 81.3), rot: -0.03 }); cross(g, mx, my + 20, 70, so(gt, 82.75, 83.15)); }); }

// ---------- d9: 2 litres a day… a full bath holds 100+ litres ----------
function d9(g, gt, A) { page(g, gt, 83.3, () => {
  const kL = sm(gt, 83.4, 83.9); g.save(); g.globalAlpha = kL; drawVini(g, A.vini, { x: 470, y: 760, s: 1.05, t: gt, expr: pick(gt, [[0, 'neutral'], [87.9, 'shock'], [89.6, 'happy']]), arms: ['down', armTrack(gt, [[0, 'down'], [84.6, 'out'], [85.6, 'down']])], turn: 0.3, look: [0.6, 0], shadow: false, breath: breathe(gt, 3) }); g.restore();
  for (let i = 0; i < 2; i++) bottle(g, 680 + i * 110, 640, drawK(gt, 84.7 + i * 0.3, 0.3), sm(gt, 84.9 + i * 0.3, 85.6 + i * 0.3), gt);
  writeOn(g, '2 litres a day', 600, 850, wk(gt, 84.75, '2 litres a day', 22), { size: 66, pen: false }); note(g, '(at LEAST)', 600, 915, { size: 46, k: pop(gt, 85.6), glow: false });
  inkPath(g, [[960, 300], [960, 900]], sm(gt, 86.9, 87.4), 4, alpha(INK, 0.4));
  const wf = sm(gt, 87.8, 90.1); bath(g, 1400, 620, drawK(gt, 87.5, 0.5), wf, gt);
  bigText(g, `${Math.round(lerp(0, 150, wf))} L`, 1400, 420, { size: 120, k: pop(gt, 87.9), color: '#4a9ad8', stroke: '#e9e2cf' });
  writeOn(g, 'a full bath = 100+ litres', 1400, 850, wk(gt, 89.6, 'a full bath = 100+ litres', 28), { size: 62 }); }); }

// ---------- d10: weeks of water, sitting right there (tracker appears) ----------
function d10(g, gt, A) { const t = gt - 91.0;
  camBegin(g, A.bg.flat, { z: lerp(1.3, 1.42, sm(t, 0, 4.2)), x: 800, y: 690 });
  const proud = settle(gt, 91.35, 1, 9, 5);
  drawVini(g, A.vini, { x: 780, y: 988, s: 1.36, t: gt, expr: 'happy', arms: [armTrack(gt, [[0, 'down'], [91.3, 'hips']]), armTrack(gt, [[0, 'down'], [91.3, 'hips']])], turn: 0.2, look: [0.2, -0.2],
    crouch: Math.max(0, proud) * 2, headTilt: -proud * 3, breath: breathe(gt, 2.6, 1), hairLag: proud * 3, packLag: proud * 2 });
  camEnd(g);
  tracker(g, gt, 91.2, [sm(gt, 91.4, 92.6), 0.3, 0], { labels: ['WEEKS', '3 DAYS', 'NONE'] });
  note(g, 'weeks of water', W * 0.68, H * 0.28, { size: 76, k: pop(gt, 91.9) });
  day(g, gt); vignette(g, 0.32); }

// ---------- d11: midnight — the shouting has turned into something else. A low groan. ----------
function d11(g, gt, A) { const t = gt - 95.2;
  const c = camBegin(g, A.bg.flat, punches(gt, { z: lerp(1.25, 1.55, sm(t, 0, 6.7)), x: lerp(520, 420, sm(t, 0, 6.7)), y: 640 }, [[100.7, 9, { z: 2.3, x: 450, y: 610 }]]), camShake(gt, 2, 100.7, 0.9));
  const jolt = Math.max(0, Math.sin(Math.PI * clamp((gt - 100.7) / 0.3)));
  drawVini(g, A.vini, { x: 410, y: 988, s: 1.36, t: gt, expr: pick(gt, [[0, 'worried'], [100.7, 'terror']]), arms: [armTrack(gt, [[0, 'down'], [96.6, 'reach'], [100.7, 'chest']], 0.2), armTrack(gt, [[0, 'down'], [100.7, 'cold']], 0.2)],
    turn: -0.85, look: [-1, -0.3], shake: gt > 100.7 ? 0.8 : 0, lean: 2 * sm(gt, 96.6, 97.4) - jolt * 5, crouch: jolt * 3, breath: gt > 100.7 ? breathe(gt, 0.9, 0.9) : breathe(gt, 3.2), hairLag: -jolt * 6, packLag: -jolt * 4 });
  camEnd(g);
  nightGrade(g, 1, [[...toScreen(c, 250, 330), 620, '#9fb4e8', 0.32], [...toScreen(c, 560, 800), 420, '#9fb4e8', 0.12]]);
  note(g, 'MIDNIGHT', W * 0.75, H * 0.2, { size: 84, k: pop(gt, 95.69), color: '#d8e0ff', glow: false });
  if (gt > 100.3) note(g, 'a low groan…', W * 0.72, H * 0.33, { size: 62, k: pop(gt, 100.35), color: '#d8e0ff', glow: false });
  day(g, gt); vignette(g, 0.5); }

// ---------- d12: hundreds of them ----------
const NIGHT_HORDE = (() => { const r = rng(42), out = []; for (let i = 0; i < 44; i++) out.push({ kind: ['office', 'worker', 'teen'][i % 3], x: 520 + r() * 900, y0: 745 + r() * 230, start: 101.0 - r() * 2, seed: r() * 6 }); return out; })();
function d12(g, gt, A) { const t = gt - 101.9;
  camBegin(g, A.bg.street, { z: lerp(1.35, 1.15, sm(t, 0, 3.5)), x: 960, y: 760 });
  const zs = NIGHT_HORDE.map((z) => ({ ...z, ...hordeAt(z, gt, 0.6) })).filter((z) => z.y < 1120).sort((a, b) => a.y - b.y);
  for (const z of zs) drawZombie(g, A.zombie, { kind: z.kind, x: z.x, y: z.y, s: z.s, t: gt, seed: z.seed, dir: 0, expr: z.seed > 3 ? 'groan' : 'zombie' });
  camEnd(g);
  nightGrade(g, 1, [[W * 0.5, H * 0.3, 700, '#8fa8e0', 0.18]]);
  bigText(g, 'HUNDREDS', W / 2, H * 0.2, { size: 130, k: pop(gt, 101.95, 0.3), color: '#ff4a3a' });
  vignette(g, 0.55); fade(g, sm(t, 2.6, 3.5)); }

const FN = { d6, d7, d8, d9, d10, d11, d12 };
export function drawDay1b(g, gt, A) { const s = DAY1B_SHOTS.find(([, a, b]) => gt >= a && gt < b) || DAY1B_SHOTS[DAY1B_SHOTS.length - 1]; g.save(); FN[s[0]](g, gt, A); g.restore(); }
