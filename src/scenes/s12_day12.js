// src/scenes/s12_day12.js — DAY 12 "The taps run dry" (script v2). Scene time t runs 0 → DUR seconds.
// Narration: 07_day12a at 0.4 (ends 30.4), a 2.5 s hole for *Silence… CRASH*, then 08_day12b at 32.9.
// Shots: flat → tap insert → bath gauge → RULE 7 page → rooftop rain → tarp drag → the rig → bucket slip / bounce →
// five-floor drop → frozen silence + CRASH → eyes over the parapet → street fills and empties → RULE 8 page →
// dirty glass page → rolling boil → germ vs zombie → tracker. Every function is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, mix, rng, linGrad, radGrad, sm, so, pop, settle, track, camBegin, camEnd, punches, pageTurn, toScreen, camShake,
  note, arrowTo, bigText, fade, vignette, dayCounter, tracker, notebook, inkPath, tick, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow, boneScreen } from '../vini/rig.js';
import { KINDS } from '../zombie/zombie.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';
import { sY } from './hook.js';

const A0 = 0.4, B0 = 32.9;                       // narration clip starts
export const DUR = 63.0;
export const VO = [['07_day12a', A0], ['08_day12b', B0]];
export const SFX = [
  ['day_slam', 0.4], ['pipe_gurgle', 1.9], ['tap_cough', 2.5], ['tap_splutter', 3.15], ['tap_splutter', 3.38], ['pipe_groan_stop', 4.15], ['drip', 4.75],
  ['water_drain_gurgle', 5.0], ['alarm_low_blip', 6.0], ['page_flip', 7.0], ['pen_scribble', 7.25], ['pen_scribble', 9.7],
  ['rain_start', 11.6], ['rain_loop', 12.4], ['rain_heavy', 14.6], ['thunder_distant', 14.7], ['tarp_drag', 17.3], ['grunt_effort', 18.2],
  ['rain_on_tarp', 19.9], ['water_stream_into_barrel', 20.4], ['footsteps_wet', 23.7], ['boot_skid_wet', 25.48], ['gasp', 25.6], ['whoosh_small', 25.75],
  ['metal_clonk', 26.75], ['metal_clonk_small', 27.15], ['metal_scrape_teeter', 27.3], ['falling_whistle', 28.15], ['(silence: rain out)', 30.4],
  ['metal_crash_street', 31.75], ['body_drop_gravel', 32.75], ['rain_loop_quiet', 32.9], ['zombie_groans_gathering', 35.2], ['zombie_shuffle', 35.6],
  ['clock_tick_fast', 35.3], ['zombie_groans_fading', 38.5], ['pigeon_flap_coo', 39.9], ['page_flip', 40.9], ['pen_scribble', 41.1], ['page_flip', 45.6],
  ['water_trickle', 46.3], ['plop', 48.6], ['pigeon_flap_coo', 48.9], ['splat', 49.5], ['plop_gloopy', 50.25], ['gas_stove_hiss', 50.9], ['water_boiling', 51.3],
  ['timer_ticking', 51.9], ['bubble_pop', 52.6], ['bubble_pop', 53.3], ['bubble_pop', 53.9], ['timer_ding', 54.6], ['page_flip', 55.9], ['zombie_groan_single', 57.0],
  ['evil_giggle_tiny', 58.4], ['tracker_blip', 59.9], ['rain_loop', 59.7],
];

// ---------- small helpers ----------
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
// distance along a walk that eases in and out over e seconds, constant pace between (from market.js)
function seg(t, [a, b], D, e = 0.4) { const T = b - a, x = clamp(t - a, 0, T); const s = x < e ? x * x / (2 * e) : x > T - e ? (T - e) - (T - x) ** 2 / (2 * e) : x - e / 2; return D * s / (T - e); }
// stiff hair, swinging backpack (market.js choices)
const lagsOf = (drive, t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });
const RS = (y) => 1.7 * (y - 618) / 232;         // rooftop perspective: Vini's scale with his feet at ground y (BG06)
const day = (g, t) => dayCounter(g, 12, t, A0);
const wk = (t, at, str, cps = 18) => clamp((t - at) / Math.max(0.25, str.length / cps));
const drawK = (t, at, dur = 0.5) => ease.out(clamp((t - at + 0.08) / dur));
const PAL = { water: '#5aa8d8', metal: '#9aa3a8', metalD: '#5f686d', tarp: '#2c4a7c', tarpL: '#4a6ea8' };

// ---------- rain: fixed seeded streaks that scroll with t ----------
const RAIN = (() => { const r = rng(1207), a = []; for (let i = 0; i < 320; i++) a.push([r(), r(), 1500 + r() * 900, 28 + r() * 44, r()]); return a; })();
function rain(g, t, k = 1, slant = 0.14) { if (k <= 0) return; const n = Math.min(RAIN.length, 120 * k), span = H + 220;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const [px, ph, sp, len, a] = RAIN[i], y = ((ph * span + t * sp) % span) - 110, x = px * (W + 360) - 40 - y * slant;
    g.strokeStyle = alpha('#dfe8f0', (0.14 + a * 0.3) * clamp(n - i)); g.lineWidth = 1.6 + a * 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * slant, y + len); g.stroke(); }
  g.restore(); }
// little rings where drops hit the floor (drawn in background coordinates)
function splashes(g, t, k, x0, x1, y0, y1, n = 30, seed = 5) { if (k <= 0) return; const r = rng(seed); g.save(); g.lineWidth = 2;
  for (let i = 0; i < n * Math.min(1.6, k); i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), per = 0.5 + r() * 0.6, p = ((t + r() * 3) % per) / per, sc = 0.5 + (y - y0) / (y1 - y0 + 1);
    g.strokeStyle = alpha('#e4eef4', 0.5 * (1 - p)); g.beginPath(); g.ellipse(x, y, (4 + 16 * p) * sc, (1.5 + 5 * p) * sc, 0, 0, 7); g.stroke(); }
  g.restore(); }
function drop(g, x, y, r, col = PAL.water, stretch = 1.35) { g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.22); g.beginPath(); g.moveTo(x, y - r * stretch * 1.3);
  g.bezierCurveTo(x + r * 0.5, y - r * 0.5, x + r, y, x + r, y + r * 0.35); g.arc(x, y + r * 0.35, r, 0, Math.PI); g.bezierCurveTo(x - r, y, x - r * 0.5, y - r * 0.5, x, y - r * stretch * 1.3); g.fill(); g.stroke();
  g.fillStyle = alpha('#ffffff', 0.7); g.beginPath(); g.ellipse(x - r * 0.35, y + r * 0.2, r * 0.18, r * 0.3, 0.4, 0, 7); g.fill(); }

// ---------- props ----------
// galvanised bucket; origin = centre of its base. o.dent, o.water (0..1), o.handle (angle of the bail: 0 = up)
function bucket(g, x, y, s = 1, rot = 0, o = {}) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * (o.sx ?? 1), s * (o.sy ?? 1));
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 3.5;
  if (o.handle != null) { g.save(); g.translate(0, -62); g.scale(1, Math.cos(o.handle)); g.beginPath(); g.ellipse(0, 0, 32, 40, 0, Math.PI, 0); g.stroke(); g.restore(); }
  g.fillStyle = PAL.metal; g.beginPath(); g.moveTo(-23, 0); g.lineTo(-32, -62); g.lineTo(32, -62); g.lineTo(23, 0); g.quadraticCurveTo(0, 7, -23, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = alpha('#000', 0.16); g.beginPath(); g.moveTo(6, 3); g.lineTo(12, -62); g.lineTo(32, -62); g.lineTo(23, 0); g.closePath(); g.fill();
  if (o.dent) { g.fillStyle = alpha('#000', 0.28); g.beginPath(); g.ellipse(-6, -30, 12, 15, 0.3, 0, 7); g.fill(); g.beginPath(); g.moveTo(-18, -34); g.lineTo(-4, -22); g.lineTo(8, -38); g.stroke(); }
  g.strokeStyle = alpha(INK, 0.55); g.lineWidth = 2.5; for (const yy of [-50, -13]) { g.beginPath(); g.moveTo(-30 + (62 + yy) * 0.14, yy); g.quadraticCurveTo(0, yy + 5, 30 - (62 + yy) * 0.14, yy); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 3.5; g.fillStyle = PAL.metalD; g.beginPath(); g.ellipse(0, -62, 32, 8, 0, 0, 7); g.fill(); g.stroke();
  if (o.water > 0) { g.fillStyle = alpha(PAL.water, 0.9); g.beginPath(); g.ellipse(0, -62 + 4, 27 * o.water + 3, 6 * o.water + 0.5, 0, 0, 7); g.fill(); }
  g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-23, -52); g.lineTo(-18, -10); g.stroke();
  g.restore(); }
function glass(g, x, y, s, rot = 0, fill = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  if (fill > 0) { g.fillStyle = alpha(PAL.water, 0.8); g.beginPath(); g.moveTo(-13, 0); g.lineTo(-13 - 3 * fill, -44 * fill); g.lineTo(13 + 3 * fill, -44 * fill); g.lineTo(13, 0); g.closePath(); g.fill(); }
  g.fillStyle = alpha('#dfeef2', 0.28); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-13, 0); g.lineTo(-17, -48); g.lineTo(17, -48); g.lineTo(13, 0); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.7); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-9, -40); g.lineTo(-7, -8); g.stroke(); g.restore(); }
function mug(g, x, y, s, t, steam = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.beginPath(); g.arc(17, -16, 10, -1.2, 1.2); g.stroke(); g.fillStyle = '#c9c2ae'; g.beginPath(); g.roundRect(-16, -34, 32, 36, 5); g.fill(); g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.6); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -28); g.lineTo(-10, -4); g.stroke();
  for (let i = 0; i < 2; i++) { const p = ((t * 0.7 + i * 0.5) % 1); g.strokeStyle = alpha('#f0f0f0', 0.5 * steam * Math.sin(Math.PI * p)); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); const bx = -6 + i * 12;
    for (let j = 0; j <= 8; j++) { const yy = -40 - p * 40 - j * 5, xx = bx + Math.sin(j * 0.9 + t * 3 + i) * 5; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  g.restore(); }
function germ(g, x, y, r, t, o = {}) { const n = 9, col = o.col || '#86b848'; g.save(); g.translate(x, y); g.rotate(Math.sin(t * 2.3 + (o.seed || 0)) * 0.15);
  g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = r * (i % 2 ? 0.74 : 1.06 + 0.07 * Math.sin(t * 6 + i + (o.seed || 0))); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = Math.max(2.5, r * 0.09); g.lineJoin = 'round'; g.fill(); g.stroke();
  g.fillStyle = alpha('#ffffff', 0.3); g.beginPath(); g.ellipse(-r * 0.3, -r * 0.38, r * 0.2, r * 0.12, -0.5, 0, 7); g.fill();
  if (o.face !== false) { for (const sx of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sx * r * 0.26, -r * 0.1, r * 0.17, r * 0.2, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(sx * r * 0.26 + r * 0.04, -r * 0.06, r * 0.07, 0, 7); g.fill();
      g.beginPath(); g.moveTo(sx * r * 0.48, -r * 0.42); g.lineTo(sx * r * 0.1, -r * 0.27); g.stroke(); }
    g.fillStyle = '#3a1418'; g.beginPath(); g.moveTo(-r * 0.3, r * 0.22); g.quadraticCurveTo(0, r * (0.34 + 0.22 * (o.grin ?? 0.5)), r * 0.3, r * 0.22); g.quadraticCurveTo(0, r * 0.3, -r * 0.3, r * 0.22); g.fill(); g.stroke(); }
  g.restore(); }
function pigeon(g, x, y, s, dir, t, o = {}) { g.save(); g.translate(x, y); g.scale(s * dir, s); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.lineCap = 'round';
  const bob = Math.sin(t * 5) > 0.6 ? 3 : 0, flap = o.flap || 0;
  g.beginPath(); g.moveTo(-6, 0); g.lineTo(-6, 16); g.moveTo(6, 0); g.lineTo(6, 16); g.strokeStyle = '#c8605a'; g.stroke(); g.strokeStyle = INK;
  g.fillStyle = '#6d737c'; g.beginPath(); g.moveTo(-26, -14); g.lineTo(-56, -6); g.lineTo(-30, 0); g.closePath(); g.fill(); g.stroke();                       // tail
  g.fillStyle = '#8d939c'; g.beginPath(); g.ellipse(0, -18, 32, 21, -0.15, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#5c8a6e'; g.beginPath(); g.ellipse(20, -32, 11, 13, 0.3, 0, 7); g.fill();
  g.fillStyle = '#8d939c'; g.beginPath(); g.arc(26 + bob, -46, 13, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#d8962e'; g.beginPath(); g.moveTo(37 + bob, -48); g.lineTo(50 + bob, -44); g.lineTo(37 + bob, -41); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e87830'; g.beginPath(); g.arc(29 + bob, -48, 4, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(29.5 + bob, -48, 1.8, 0, 7); g.fill();
  g.fillStyle = '#6d737c'; g.save(); g.translate(-4, -22); g.rotate(-flap * 1.3); g.beginPath(); g.ellipse(-6, flap ? -14 : 2, 24, flap ? 20 : 12, flap ? 0.9 : 0.2, 0, 7); g.fill(); g.stroke(); g.restore();
  g.restore(); }

// ---------- notebook pieces (same look as day1.js / day1b.js) ----------
function heading(g, t, n, title, tN, tT, size = 78) {
  writeOn(g, `RULE ${n}`, 360, 165, wk(t, tN, `RULE ${n}`, 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [362, 216], [462, 220]], ease.out(clamp((t - tN - 0.55) / 0.3)), 7, RED);
  writeOn(g, title, W * 0.6, 168, wk(t, tT, title, 15), { size, color: '#2a2622', font: 'Permanent Marker' }); }
function penStrokes(g, strokes, k, col = INK) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w, col);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]); }
function page(g, t, t0, body) { const land = so(t, t0 - 0.25, t0 + 0.25); g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03 * (1 - land) + settle(t, t0 + 0.25, 0.005, 11, 6)); g.translate(-W / 2 + 50 * (1 - land), -H / 2 + 22 * (1 - land)); notebook(g, t); body(); g.restore(); vignette(g, 0.2); }
function waterFill(g, path, k, top, bottom, t, col = 'rgba(70,150,210,0.75)') { if (k <= 0) return; g.save(); path(); g.clip(); const y = lerp(bottom, top, clamp(k));
  g.fillStyle = col; g.fillRect(-W, y, W * 3, H); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.beginPath(); for (let x = -400; x < 2400; x += 10) g.lineTo(x, y + Math.sin(x * 0.08 + t * 5) * 3); g.stroke(); g.restore(); }

// ---------- insert backdrop: a grim bathroom wall of tiles (drawn; there is no bathroom background) ----------
function tiles(g, t, z = 1, cx = W / 2, cy = H / 2) { g.fillStyle = '#1d2422'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy);
  g.fillStyle = linGrad(g, 0, -100, 0, H + 100, ['#93a69f', '#7b8f88']); g.fillRect(-300, -300, W + 600, H + 600);
  const T = 172; g.lineWidth = 5;
  for (let x = -344; x < W + 344; x += T) { g.strokeStyle = alpha('#3f4f4a', 0.55); g.beginPath(); g.moveTo(x, -300); g.lineTo(x, H + 300); g.stroke(); g.strokeStyle = alpha('#c4d2cc', 0.35); g.beginPath(); g.moveTo(x + 5, -300); g.lineTo(x + 5, H + 300); g.stroke(); }
  for (let y = -300; y < H + 300; y += T) { g.strokeStyle = alpha('#3f4f4a', 0.55); g.beginPath(); g.moveTo(-300, y); g.lineTo(W + 300, y); g.stroke(); g.strokeStyle = alpha('#c4d2cc', 0.35); g.beginPath(); g.moveTo(-300, y + 5); g.lineTo(W + 300, y + 5); g.stroke(); }
  const r = rng(31); for (let i = 0; i < 14; i++) { g.fillStyle = alpha('#2e3a30', 0.1); g.beginPath(); g.ellipse(r() * W, r() * H, 60 + r() * 160, 40 + r() * 90, r() * 3, 0, 7); g.fill(); } }
const tilesEnd = (g) => g.restore();

// =====================================================================================================
// 0.0 – 1.72  the flat: "Day twelve."
// =====================================================================================================
function sFlat(g, t, A) { camBegin(g, A.bg.barricade, { z: lerp(1.26, 1.36, sm(t, 0, 1.8)), x: lerp(860, 900, sm(t, 0, 1.8)), y: 690 });
  const armR = armSpring(t, [[0, [-4, 40, 34]], [1.25, [-10, 28, 40]]], { feel: 'soft' });
  drawVini(g, A.vini, withAlive({ x: 900, y: 990, s: 1.36, t, turn: 0.42, expr: exprTrack(t, [[0, 'neutral'], [1.2, 'worried']]), look: [0.35, 0.6], arms: ['relaxed', armR], breath: breathe(t, 1.6, 0.6), headTilt: -3 * sm(t, 1.1, 1.5),
    props: { right: (g2, h, info) => glass(g2, h[0] + 3, h[1] - 2, 1.05 * info.s / 1.36, 0.08) } }, t, { energy: 1 }));
  camEnd(g); day(g, t); vignette(g, 0.36); fade(g, 1 - sm(t, 0, 0.3)); }

// =====================================================================================================
// 1.72 – 4.82  the tap: cough, splutter… stop
// =====================================================================================================
const COUGH = 2.5, SPLUT = 3.15, SPLUT2 = 3.38, STOPT = 4.15, BEAD = 4.25, DRIP = 4.52, TAPX = 700, TAPY = 770, TAPS = 1.3, OUT = [TAPX + 232 * TAPS, TAPY - 96 * TAPS];
const tapAmp = (t) => 0.5 * bump(t, 1.85, 2.42) + 1.6 * bump(t, COUGH - 0.06, COUGH + 0.3) + 1.2 * bump(t, SPLUT - 0.05, SPLUT + 0.18) + 1.3 * bump(t, SPLUT2 - 0.04, SPLUT2 + 0.22) + 0.9 * bump(t, STOPT - 0.1, STOPT + 0.16);
function tapDraw(g, t) { const a = tapAmp(t), bulge = bump(t, COUGH - 0.12, COUGH + 0.12) + 0.7 * bump(t, SPLUT - 0.1, SPLUT + 0.1) + 0.7 * bump(t, SPLUT2 - 0.08, SPLUT2 + 0.1);
  g.save(); g.translate(TAPX, TAPY); g.scale(TAPS, TAPS); g.rotate(Math.sin(t * 75) * 0.016 * a); g.translate(Math.sin(t * 91) * 2.5 * a, 0);
  g.scale(1 + 0.03 * bulge, 1 - 0.035 * bulge + 0.02 * bump(t, COUGH - 0.3, COUGH - 0.1));
  const chrome = '#aab4b9', dark = '#77828a', hi = '#eef3f4'; g.lineJoin = 'round'; g.lineCap = 'butt';
  const spout = () => { g.beginPath(); g.moveTo(10, -232); g.lineTo(150, -232); g.quadraticCurveTo(232, -232, 232, -150); g.lineTo(232, -108); };
  spout(); g.strokeStyle = INK; g.lineWidth = 66 + 6 * bulge; g.stroke(); spout(); g.strokeStyle = chrome; g.lineWidth = 58 + 6 * bulge; g.stroke();
  g.beginPath(); g.moveTo(30, -246); g.lineTo(150, -246); g.quadraticCurveTo(218, -246, 218, -160); g.strokeStyle = hi; g.lineWidth = 7; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.moveTo(40, -214); g.lineTo(150, -214); g.quadraticCurveTo(246, -206, 248, -130); g.strokeStyle = alpha(dark, 0.8); g.lineWidth = 8; g.stroke();
  g.strokeStyle = INK; g.lineWidth = 4;
  g.fillStyle = chrome; g.beginPath(); g.roundRect(-36, -300, 72, 284, 16); g.fill(); g.stroke();
  g.fillStyle = alpha(dark, 0.7); g.beginPath(); g.roundRect(8, -292, 22, 268, 8); g.fill(); g.fillStyle = hi; g.beginPath(); g.roundRect(-24, -286, 9, 250, 5); g.fill();
  g.fillStyle = chrome; g.beginPath(); g.roundRect(-74, -26, 148, 28, 9); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(232 - 38, -116, 76, 24, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.ellipse(232, -92, 24, 5, 0, 0, 7); g.fill();
  g.fillStyle = chrome; g.beginPath(); g.rect(-11, -338, 22, 40); g.fill(); g.stroke();
  g.save(); g.translate(0, -352); g.rotate(0.12 * Math.sin(t * 40) * a); g.beginPath(); g.roundRect(-84, -15, 168, 30, 15); g.fill(); g.stroke(); g.fillStyle = hi; g.beginPath(); g.roundRect(-70, -9, 60, 6, 3); g.fill();
  g.fillStyle = RED; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.stroke(); g.restore();
  g.restore(); }
const SPITS = (() => { const r = rng(77), mk = (t0, n, size, spread, v) => Array.from({ length: n }, () => [t0 + r() * 0.05, (r() - 0.5) * spread, v * (0.4 + r() * 0.8), size * (0.55 + r() * 0.6)]);
  return [...mk(COUGH, 6, 19, 260, 420), ...mk(SPLUT, 4, 13, 420, 300), ...mk(SPLUT2, 5, 11, 520, 260), ...mk(STOPT, 1, 9, 20, 120)]; })();
function sTap(g, t, A) { const z = lerp(1.0, 1.07, sm(t, 1.72, 4.82)), BAS = 978;
  g.save(); const sh = camShake(t, 5, COUGH, 0.3); g.translate(sh[0], sh[1]);
  tiles(g, t, z, 990, 560);
  // the sink: back rim, basin, plughole
  g.strokeStyle = INK; g.lineWidth = 5; g.fillStyle = '#d5d9d2'; g.beginPath(); g.roundRect(240, TAPY - 4, 1300, 420, 26); g.fill(); g.stroke();
  g.fillStyle = '#b3bab3'; g.beginPath(); g.roundRect(420, TAPY + 78, 1040, 420, 60); g.fill(); g.stroke();
  g.fillStyle = alpha('#ffffff', 0.5); g.beginPath(); g.roundRect(270, TAPY + 12, 1240, 10, 5); g.fill();
  g.fillStyle = '#3a3f3c'; g.beginPath(); g.ellipse(OUT[0], BAS + 26, 40, 13, 0, 0, 7); g.fill(); g.stroke();
  // Vini leans in from the right: hopeful, then less so
  const lean = (tt) => 7 + trackSpring(tt, [[0, 0], [COUGH + 0.02, -5], [3.62, 3], [STOPT + 0.25, -1]], { feel: 'heavy', windUp: 0.08 });
  const vx = move(t, 2380, 1590, 1.62, { feel: 'heavy', windUp: 0 }) + 70 * startle(t - COUGH) + 40 * startle(t - SPLUT2) - 50 * sm(t, 3.6, 3.95);
  drawVini(g, A.vini, withAlive({ x: vx, y: 1345, s: 3.0, t, turn: track(t, [[4.3, -0.5], [4.6, -0.2]]), shadow: false, lean: lean(t), headTilt: 5 + overlap(lean, t, 0.09, 0.8) - 7 * startle(t - COUGH),
    expr: exprTrack(t, [[0, 'happy'], [COUGH, 'shock'], [2.9, 'worried'], [SPLUT2 + 0.02, 'scared'], [3.75, 'worried'], [STOPT + 0.28, 'neutral']]),
    look: t < STOPT + 0.3 ? [-0.75, 0.45] : [lerp(-0.75, 0.1, so(t, STOPT + 0.3, STOPT + 0.42)), lerp(0.45, 0.05, so(t, STOPT + 0.3, STOPT + 0.42))], breath: breathe(t, 1.3, 0.6), arms: ['down', 'down'],
    hairLag: clamp(-6 * startle(t - COUGH), -2.5, 2.5) }, t, { energy: 0.7 }));
  // spits of water, in time with the words
  const G = 2600;
  for (const [t0, vx0, vy0, r] of SPITS) { const dt = t - t0; if (dt < 0) continue; const x = OUT[0] + vx0 * dt, y = OUT[1] + 10 + vy0 * dt + 0.5 * G * dt * dt;
    if (y < BAS + 20) drop(g, x, y, r, PAL.water, 1.2 + Math.min(1, dt * 3)); else { const p = clamp((dt - (-vy0 + Math.sqrt(vy0 * vy0 + 2 * G * (BAS + 10 - OUT[1]))) / G) / 0.3); if (p < 1) { g.strokeStyle = alpha('#e8f2f6', 0.9 * (1 - p)); g.lineWidth = 4; g.beginPath(); g.ellipse(x, BAS + 22, r * (1 + 3 * p), r * 0.35 * (1 + 2 * p), 0, 0, 7); g.stroke(); } } }
  // the very last drop: hangs, stretches, lets go
  if (t > BEAD) { const hang = clamp((t - BEAD) / (DRIP - BEAD)), dt = t - DRIP; if (dt < 0) drop(g, OUT[0], OUT[1] + 12 + 16 * hang * hang, 5 + 9 * hang, PAL.water, 1.2 + hang); else { const y = OUT[1] + 28 + 0.5 * G * dt * dt; if (y < BAS + 20) drop(g, OUT[0], y, 14, PAL.water, 1.9); } }
  tapDraw(g, t);
  tilesEnd(g); g.restore();
  note(g, '*cough*', 430, 330 + Math.sin(t * 40) * 3 * bump(t, COUGH, COUGH + 0.4), { size: 92, k: pop(t, COUGH), rot: -0.07 });
  note(g, '*splutter*', 400, 470, { size: 80, k: pop(t, SPLUT), rot: 0.04 });
  note(g, '…', 420, 590, { size: 120, color: '#2a2622', k: pop(t, STOPT + 0.05) });
  day(g, t); vignette(g, 0.4); }

// =====================================================================================================
// 4.82 – 7.1  the bath: Day 1 it was full. Now: LOW
// =====================================================================================================
function sBath(g, t) { const z = lerp(1.0, 1.06, sm(t, 4.82, 7.1)), k = sm(t, 5.0, 6.45), yFull = 448, yLow = 716, lev = lerp(yFull, yLow, k);
  tiles(g, t + 3, z, 960, 580);
  const outer = () => { g.beginPath(); g.moveTo(300, 380); g.lineTo(1320, 380); g.lineTo(1320, 410); g.lineTo(1296, 410); g.quadraticCurveTo(1290, 790, 1150, 790); g.lineTo(470, 790); g.quadraticCurveTo(330, 790, 324, 410); g.lineTo(300, 410); g.closePath(); };
  const inner = () => { g.beginPath(); g.moveTo(352, 408); g.lineTo(1268, 408); g.quadraticCurveTo(1262, 762, 1140, 762); g.lineTo(480, 762); g.quadraticCurveTo(358, 762, 352, 408); g.closePath(); };
  g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round';
  for (const fx of [470, 1150]) { g.fillStyle = '#8b7a4a'; g.beginPath(); g.moveTo(fx - 26, 786); g.lineTo(fx - 40, 850); g.lineTo(fx + 40, 850); g.lineTo(fx + 26, 786); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = alpha('#000', 0.25); g.beginPath(); g.ellipse(810, 856, 520, 16, 0, 0, 7); g.fill();
  outer(); g.fillStyle = '#e6e8e1'; g.fill(); g.stroke(); inner(); g.fillStyle = '#bfc6bf'; g.fill(); g.lineWidth = 4; g.stroke();
  waterFill(g, inner, 1, lev, lev, t, alpha(PAL.water, 0.86));
  // tide marks left behind as it drops
  g.save(); inner(); g.clip(); g.strokeStyle = alpha('#6f7a72', 0.5); g.lineWidth = 3; for (let i = 0; i < 4; i++) { const yy = yFull + i * 62; if (yy < lev - 8) { g.beginPath(); g.moveTo(340, yy); g.lineTo(1290, yy + 2); g.stroke(); } } g.restore();
  // rubber duck rides the water down
  { const dx = 760 + Math.sin(t * 1.3) * 26, dy = lev - 4 + Math.sin(t * 4) * 3; g.save(); g.translate(dx, dy); g.rotate(Math.sin(t * 2.2) * 0.08 + 0.2 * sm(t, 6.3, 6.6)); g.strokeStyle = INK; g.lineWidth = 4; g.fillStyle = '#e8c234';
    g.beginPath(); g.ellipse(0, -16, 46, 28, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(34, -52, 24, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#e07a28'; g.beginPath(); g.moveTo(54, -56); g.lineTo(78, -50); g.lineTo(54, -42); g.closePath(); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(40, -58, 4, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-30, -20); g.quadraticCurveTo(-8, -4, 12, -20); g.stroke(); g.restore(); }
  // bath taps on the rim
  g.fillStyle = '#aab4b9'; g.lineWidth = 4; g.beginPath(); g.roundRect(1196, 300, 26, 82, 6); g.fill(); g.stroke(); g.beginPath(); g.roundRect(1120, 296, 100, 24, 10); g.fill(); g.stroke(); g.beginPath(); g.roundRect(1176, 270, 66, 18, 9); g.fill(); g.stroke();
  // gauge
  const gx = 1470; g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.fillStyle = '#ece6d6'; g.beginPath(); g.roundRect(gx - 26, 400, 52, 380, 10); g.fill(); g.stroke();
  g.fillStyle = alpha(RED, 0.85); g.beginPath(); g.roundRect(gx - 23, 676, 46, 101, 8); g.fill();
  g.lineWidth = 4; for (let i = 0; i <= 8; i++) { const yy = 420 + i * 42; g.beginPath(); g.moveTo(gx - 26, yy); g.lineTo(gx - (i % 2 ? 10 : 0), yy); g.stroke(); }
  g.fillStyle = INK; g.beginPath(); g.moveTo(gx - 34, lev); g.lineTo(gx - 74, lev - 22); g.lineTo(gx - 74, lev + 22); g.closePath(); g.fill();
  g.setLineDash([16, 12]); g.strokeStyle = alpha('#2a2622', 0.75); g.lineWidth = 4; g.beginPath(); g.moveTo(360, yFull); g.lineTo(gx - 30, yFull); g.stroke(); g.setLineDash([]);
  tilesEnd(g);
  note(g, 'Day 1: full', 560, 318, { size: 62, color: '#2a2622', k: pop(t, 4.95), rot: -0.02 });
  arrowTo(g, 520, 350, 480, 432, so(t, 5.0, 5.3), '#2a2622', -16);
  const blink = 0.75 + 0.25 * Math.sin(t * 16);
  note(g, 'LOW', 1690, 716, { size: 150 * (1 + 0.06 * settle(t, 5.95, 1, 14, 5)), k: pop(t, 5.92) * blink, rot: 0.05 });
  arrowTo(g, 1620, 720, 1512, 722, so(t, 6.0, 6.3), RED, 14);
  note(g, 'the bath', 820, 950, { size: 60, color: '#2a2622', k: pop(t, 4.9) });
  day(g, t); vignette(g, 0.4); }

// =====================================================================================================
// 7.1 – 11.1  RULE 7: when the taps stop, LOOK UP
// =====================================================================================================
function sRule7(g, t, A) { page(g, t, 7.1, () => {
  heading(g, t, 7, 'WHEN THE TAPS STOP', 7.22, 8.3, 72);
  const up = 9.7; writeOn(g, 'LOOK UP', 900, 560, wk(t, up, 'LOOK UP', 9), { size: 200, color: RED, font: 'Permanent Marker', rot: -0.03 });
  penStrokes(g, [[[[1480, 900], [1480, 420]], 16], [[[1400, 520], [1480, 408], [1560, 520]], 16]], drawK(t, 10.15, 0.45), RED);
  // a rain cloud at the top of the arrow
  const ck = pop(t, 10.5, 0.3); if (ck > 0) { g.save(); g.translate(1480, 310); g.scale(ck, ck); g.fillStyle = '#b9c2ca'; g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round';
    g.beginPath(); g.arc(-70, 10, 42, Math.PI * 0.5, Math.PI * 1.5); g.arc(-28, -28, 46, Math.PI, Math.PI * 1.8); g.arc(38, -22, 52, Math.PI * 1.2, Math.PI * 0.05); g.arc(74, 22, 30, -Math.PI * 0.5, Math.PI * 0.5); g.closePath(); g.fill(); g.stroke(); g.restore();
    for (let i = 0; i < 3; i++) { const p = ((t * 1.3 + i * 0.33) % 1); g.globalAlpha = clamp(ck) * (1 - p * 0.6); drop(g, 1420 + i * 60, 372 + p * 46, 9); g.globalAlpha = 1; } }
  // a small Vini does as he is told
  const vk = sm(t, 8.9, 9.3); if (vk > 0) { g.save(); g.globalAlpha = vk;
    drawVini(g, A.vini, withAlive({ x: 400, y: 965, s: 1.5, t, shadow: false, expr: exprTrack(t, [[0, 'worried'], [up + 0.25, 'shock'], [10.5, 'happy']]), look: [0.25, lerp(0.3, -1, so(t, up + 0.1, up + 0.25))],
      headTilt: -7 * move(t, 0, 1, up + 0.2, { feel: 'snappy' }), arms: ['down', armSpring(t, [[0, 'down'], [10.2, 'up']], { feel: 'snappy' })], breath: breathe(t, 1.6, 0.6) }, t, { energy: 0.6 })); g.restore(); }
}); }

// =====================================================================================================
// 11.1 – 17.2  the roof: rain. Britain is not short of rain.
// =====================================================================================================
const RAIN0 = 11.55, POUR = 14.6;
// drips coming off a soaked Vini: [x, y] in his own units (from the feet), falling in a loop
const DRIPS = [[-34, -262], [34, -262], [-45, -176], [46, -172], [-33, -138], [34, -134], [-20, -118], [22, -118], [0, -240], [-38, -230], [38, -226]];
function drips(g, t, x, y, s, k) { if (k <= 0) return; DRIPS.forEach(([ux, uy], i) => { const per = 0.55 + (i % 4) * 0.13, p = ((t + i * 0.37) % per) / per, fall = p * p * 120 * s;
    g.globalAlpha = clamp(k) * (1 - p * 0.5) * (i < 8 || k > 1.2 ? 1 : 0); drop(g, x + ux * s, y + uy * s + fall, (2.6 + (i % 3)) * s * 0.8, alpha('#bfe0f2', 0.95), 1.5); }); g.globalAlpha = 1; }
function sRain(g, t, A) { const rk = sm(t, RAIN0, RAIN0 + 1.1) * 0.9 + sm(t, POUR, POUR + 0.5) * 1.5, VX = 770, VY = 852, s = RS(VY);
  const c = camBegin(g, A.bg.rooftop, punches(t, { z: lerp(1.5, 1.62, sm(t, 11.1, 17.2)), x: lerp(660, 640, sm(t, 11.1, 17.2)), y: lerp(600, 630, sm(t, 11.1, 14)) }, [[15.15, 1.3, { z: 2.5, x: VX + 10, y: 480 }, 0.5]]));
  splashes(g, t, rk, 80, 1300, 740, 1060, 34);
  const pk = sm(t, 12.6, 16.5); if (pk > 0) { g.fillStyle = alpha('#aebfcb', 0.22 * pk); g.beginPath(); g.ellipse(VX, VY + 6, 150 * pk * s / 1.7, 26 * pk * s / 1.7, 0, 0, 7); g.fill(); }
  const armL = armSpring(t, [[0, 'down'], [12.05, [62, 14, 46]], [14.75, 'down']], { feel: 'soft' });
  drawVini(g, A.vini, withAlive({ x: VX, y: VY, s, t, turn: 0.18, expr: exprTrack(t, [[0, 'worried'], [12.3, 'happy'], [POUR + 0.12, 'neutral']], 0.25),
    look: t < POUR ? [lerp(0, 0.5, sm(t, 12, 12.4)), lerp(-1, t < 12.4 ? -1 : -0.2, sm(t, 12.2, 12.6))] : [lerp(0.5, 0, so(t, POUR + 0.1, POUR + 0.25)), lerp(-0.2, 0, so(t, POUR + 0.1, POUR + 0.25))],
    headTilt: -5 * (1 - sm(t, 12.2, 12.7)) + 2.5 * sm(t, POUR, POUR + 0.5), lean: -1.5 * sm(t, POUR, POUR + 0.6), crouch: 2.2 * move(t, 0, 1, POUR + 0.05, { feel: 'heavy' }), arms: [armL, 'down'], breath: breathe(t, 1.9, 0.6), squash: 0.5 * sm(t, POUR, POUR + 0.4) }, t, { energy: t < POUR ? 0.9 : 0.25 }));
  drips(g, t, VX, VY, s, sm(t, 12.7, 13.6) + sm(t, POUR + 0.2, POUR + 0.8));
  // rain bouncing off his head once it pours
  if (t > POUR) { for (let i = 0; i < 5; i++) { const p = ((t * 2.6 + i * 0.21) % 1), hx = VX + (i - 2) * 16 * s, hy = VY - 306 * s; g.strokeStyle = alpha('#eaf4f8', 0.8 * (1 - p)); g.lineWidth = 2.5; g.beginPath(); g.moveTo(hx, hy - 2); g.lineTo(hx + (i - 2) * 5 * p, hy - 4 - 16 * p); g.stroke(); } }
  camEnd(g);
  rain(g, t, rk);
  note(g, 'free. clean. everywhere.', W * 0.7, H * 0.2, { size: 70, k: pop(t, 12.75) * (1 - sm(t, 14.2, 14.5)) });
  note(g, 'Britain: 150+ rainy days a year', W * 0.6, H * 0.14, { size: 74, k: pop(t, 14.85) * (1 - sm(t, 16.9, 17.15)) });
  const [hx, hy] = toScreen(c, VX, VY - 300 * s); if (t > 15.2 && t < 16.75) note(g, '(soaked)', hx + 330, hy + 120, { size: 58, color: '#2a2622', k: pop(t, 15.5), rot: 0.04 });
  day(g, t); vignette(g, 0.38 + 0.08 * sm(t, POUR, POUR + 1)); }

// =====================================================================================================
// 17.2 – 19.9  dragging the tarp up to the roof (walking backwards, leaning into it)
// =====================================================================================================
const DG = [16.9, 20.1], DG_D = 232, DG_STR = 42;
const dgDist = (t) => seg(t, DG, DG_D) + 6.5 * Math.sin((t - DG[0]) * 6.6) * sm(t, DG[0], DG[0] + 0.6);
const dgX = (t) => 440 + dgDist(t) * RS(852);
const dgPull = (t) => 0.5 + 0.5 * Math.cos((t - DG[0]) * 6.6);                  // 1 = mid-heave
const dgLean = (t) => -8 - 7 * dgPull(t);
function tarpBundle(g, hx, hy, fy, t, pull, s) { const u = s / 1.7, w = (i) => Math.sin(t * 5 + i * 1.7) * 5 * u, P = [[-104, -40 - 12 * pull], [-170, -74], [-246, -50], [-318, -66], [-392, -36], [-452, -6]].map(([x, y], i) => [hx + x * u, fy + y * u + w(i)]);
  const path = () => { g.beginPath(); g.moveTo(hx + 8 * u, hy - 12 * u); g.quadraticCurveTo(hx - 50 * u, hy + 20 * u, P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) { const m = [(P[i - 1][0] + P[i][0]) / 2, (P[i - 1][1] + P[i][1]) / 2 - 16 * u]; g.quadraticCurveTo(m[0], m[1], P[i][0], P[i][1]); }
    g.lineTo(hx - 470 * u, fy + 8 * u); g.lineTo(hx - 110 * u, fy + 8 * u); g.quadraticCurveTo(hx - 40 * u, fy - 30 * u, hx + 12 * u, hy + 14 * u); g.closePath(); };
  g.fillStyle = alpha('#000', 0.25); g.beginPath(); g.ellipse(hx - 280 * u, fy + 10 * u, 210 * u, 12 * u, 0, 0, 7); g.fill();
  path(); g.fillStyle = PAL.tarp; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
  g.save(); path(); g.clip(); g.lineCap = 'round';
  g.strokeStyle = alpha('#16284a', 0.9); g.lineWidth = 3; for (const [a, b, c, d] of [[-90, -30, -150, 4], [-200, -56, -230, 0], [-300, -54, -340, 2], [-30, 0, -110, -30], [-400, -24, -430, 4]]) { g.beginPath(); g.moveTo(hx + a * u, fy + b * u); g.quadraticCurveTo(hx + (a + c) / 2 * u - 12 * u, fy + (b + d) / 2 * u, hx + c * u, fy + d * u); g.stroke(); }
  g.strokeStyle = alpha(PAL.tarpL, 0.9); g.lineWidth = 4; for (const [a, b, c] of [[-150, -60, 34], [-290, -52, 30], [-380, -28, 26]]) { g.beginPath(); g.moveTo(hx + a * u, fy + b * u); g.lineTo(hx + (a - c) * u, fy + (b + 8) * u); g.stroke(); }
  g.restore();
  g.fillStyle = '#c9c2ae'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.arc(hx - 16 * u, hy + 6 * u, 5 * u, 0, 7); g.fill(); g.stroke(); }
function sDrag(g, t, A) { const x = dgX(t), VY = 852, s = RS(VY), pull = dgPull(t);
  const c = camBegin(g, A.bg.rooftop, { z: lerp(1.52, 1.6, sm(t, 17.2, 19.9)), x: lerp(600, 655, sm(t, 17.2, 19.9)), y: 612 });
  splashes(g, t, 1.2, 0, 1300, 740, 1060, 34);
  const hand = (k) => [4 + 2 * k, 46 + 10 * k - 8 * pull, 78 - 12 * k - 18 * pull];
  drawVini(g, A.vini, withAlive({ x, y: VY, s, t, turn: -0.72, walkDist: dgDist(t), stride: DG_STR, lift: 9, smoothGait: true, walkSquash: 0.25, lean: dgLean(t), headTilt: overlap(dgLean, t, 0.09, 0.8) + 3,
    crouch: 5 + 3 * pull, expr: exprTrack(t, [[0, 'determined'], [18.55, 'exhausted'], [19.2, 'determined']]), look: [-0.6, 0.35], arms: [hand(0), hand(1)], breath: breathe(t, 0.8, 0.9), ...lagsOf(dgX, t),
    props: { left: (g2, h) => tarpBundle(g2, h[0], h[1], VY + 4, t, pull, s) } }, t, { energy: 0.25 }));
  drips(g, t, x, VY, s, 0.9);
  // effort marks behind his head
  for (let i = 0; i < 3; i++) { const p = ((t * 1.6 + i * 0.3) % 1), a = -0.5 - i * 0.35; g.strokeStyle = alpha('#f4efe2', 0.85 * pull * (1 - p)); g.lineWidth = 4; g.lineCap = 'round'; const bx = x + 60 * s / 1.7, by = VY - 300 * s;
    g.beginPath(); g.moveTo(bx + Math.cos(a) * (40 + 20 * p), by + Math.sin(a) * (40 + 20 * p)); g.lineTo(bx + Math.cos(a) * (62 + 26 * p), by + Math.sin(a) * (62 + 26 * p)); g.stroke(); }
  camEnd(g); rain(g, t, 1.5);
  const [tx, ty] = toScreen(c, x - 330, VY - 90); note(g, 'one tarp', tx - 20, ty - 150, { size: 66, k: pop(t, 17.75) * (1 - sm(t, 19.6, 19.85)) }); arrowTo(g, tx - 20, ty - 112, tx + 10, ty - 10, so(t, 17.85, 18.2) * (1 - sm(t, 19.6, 19.85)));
  note(g, '(heavier than it looks)', W * 0.7, H * 0.2, { size: 56, color: '#2a2622', k: pop(t, 18.6) * (1 - sm(t, 19.6, 19.85)), rot: 0.03 });
  day(g, t); vignette(g, 0.4); }

// =====================================================================================================
// 19.9 – 23.6  the rig: four poles, a sagging tarp, rain running into the barrel and buckets
// (the painted rig in BG06; the running water, drips and fill levels are drawn on top)
// =====================================================================================================
const LOWPT = [1684, 474], BARREL = [1684, 566];
function rigWater(g, t, k) { if (k <= 0) return; g.save(); g.lineCap = 'round';
  // runnels sliding down the tarp to the low corner
  const paths = [[[1400, 322], [1560, 402], LOWPT], [[1870, 300], [1790, 410], LOWPT], [[1600, 300], [1650, 400], LOWPT], [[1760, 290], [1720, 390], LOWPT]];
  paths.forEach((P, i) => { for (let j = 0; j < 3; j++) { const u = ((t * 0.9 + i * 0.27 + j / 3) % 1), q = (v) => [(1 - v) ** 2 * P[0][0] + 2 * (1 - v) * v * P[1][0] + v * v * P[2][0], (1 - v) ** 2 * P[0][1] + 2 * (1 - v) * v * P[1][1] + v * v * P[2][1]], a = q(u), b = q(Math.min(1, u + 0.07));
      g.strokeStyle = alpha('#cfe6f4', 0.75 * k * Math.sin(Math.PI * u)); g.lineWidth = 3.5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } });
  // the stream off the low corner into the barrel
  const sw = 7 * k + 2 * Math.sin(t * 23); g.strokeStyle = alpha(INK, 0.5); g.lineWidth = sw + 4; g.beginPath(); g.moveTo(LOWPT[0], LOWPT[1]); g.lineTo(BARREL[0] + Math.sin(t * 9) * 1.5, BARREL[1]); g.stroke();
  g.strokeStyle = alpha('#7fc0e6', 0.95); g.lineWidth = sw; g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.85); g.lineWidth = 2.2; for (let i = 0; i < 4; i++) { const p = ((t * 3.2 + i * 0.25) % 1), yy = lerp(LOWPT[1], BARREL[1] - 14, p); g.beginPath(); g.moveTo(LOWPT[0] - 1.5, yy); g.lineTo(LOWPT[0] - 1.5, yy + 12); g.stroke(); }
  for (let i = 0; i < 3; i++) { const p = ((t * 2.2 + i / 3) % 1); g.strokeStyle = alpha('#e6f2f8', 0.85 * (1 - p) * k); g.lineWidth = 2.5; g.beginPath(); g.ellipse(BARREL[0], BARREL[1] + 4, 10 + 46 * p, 2 + 9 * p, 0, 0, 7); g.stroke(); }
  for (let i = 0; i < 5; i++) { const p = ((t * 2.6 + i * 0.2) % 1), a = -Math.PI / 2 + (i - 2) * 0.5; g.fillStyle = alpha('#d8ecf6', 0.9 * (1 - p) * k); g.beginPath(); g.arc(BARREL[0] + Math.cos(a) * 34 * p, BARREL[1] + Math.sin(a) * 30 * p + 30 * p * p, 3, 0, 7); g.fill(); }
  // drips off the front edge into the two buckets underneath, and their water rising
  for (const [bx, y0, y1, rw, i] of [[1478, 404, 690, 40, 0], [1534, 424, 704, 50, 1]]) { for (let j = 0; j < 2; j++) { const p = ((t * 1.5 + i * 0.4 + j * 0.5) % 1); g.globalAlpha = k; drop(g, bx, lerp(y0, y1 - 6, p * p), 5.5, alpha('#a8d4ee', 0.95), 1.6); g.globalAlpha = 1; }
    const f = sm(t, 20.2, 23.4); g.fillStyle = alpha(PAL.water, 0.75 * f * k); g.beginPath(); g.ellipse(bx, y1 + 2, rw * (0.7 + 0.2 * f), 7 * (0.6 + 0.4 * f), 0, 0, 7); g.fill();
    const p = ((t * 1.5 + i * 0.4) % 1); g.strokeStyle = alpha('#ffffff', 0.7 * (1 - p) * f * k); g.lineWidth = 2; g.beginPath(); g.ellipse(bx, y1 + 2, rw * 0.6 * p, 4 * p, 0, 0, 7); g.stroke(); }
  g.restore(); }
function sRig(g, t, A) { const VX = 1135, VY = 872, s = RS(VY);
  const c = camBegin(g, A.bg.rooftop, punches(t, { z: lerp(1.1, 1.2, sm(t, 19.9, 23.6)), x: lerp(1100, 1200, sm(t, 19.9, 23.6)), y: lerp(580, 600, sm(t, 19.9, 23.6)) }, [[21.45, 1.35, { z: 2.1, x: 1560, y: 560 }, 0.5]]));
  splashes(g, t, 1.3, 300, 1500, 740, 1060, 36); rigWater(g, t, 1);
  const proud = settle(t, 20.35, 1, 9, 5);
  drawVini(g, A.vini, withAlive({ x: VX, y: VY, s, t, turn: 0.5, expr: exprTrack(t, [[0, 'exhausted'], [20.3, 'happy']]), look: [0.7, -0.25], crouch: Math.max(0, proud) * 2, headTilt: -proud * 3,
    arms: [armSpring(t, [[0, 'down'], [20.3, 'hips']]), armSpring(t, [[0, 'down'], [20.3, 'hips'], [21.3, 'point'], [22.9, 'hips']], { delay: 0.05 })], breath: breathe(t, 1.2, 0.8) }, t, { energy: 0.8 }));
  drips(g, t, VX, VY, s, 1);
  camEnd(g); rain(g, t, 1.7);
  const [px, py] = toScreen(c, 1400, 300); note(g, 'four poles', px - 250, py - 120, { size: 68, k: pop(t, 20.1) * (1 - sm(t, 21.2, 21.45)) }); arrowTo(g, px - 190, py - 84, px - 20, py + 10, so(t, 20.15, 20.5) * (1 - sm(t, 21.2, 21.45)));
  const [bx, by] = toScreen(c, 1684, 600); if (t > 21.7) { note(g, 'rain barrel', bx - 330, by - 40, { size: 70, k: pop(t, 21.9) * (1 - sm(t, 23.3, 23.55)) }); arrowTo(g, bx - 220, by - 20, bx - 90, by + 20, so(t, 21.95, 22.3) * (1 - sm(t, 23.3, 23.55)), RED, -20); }
  day(g, t); vignette(g, 0.38); }

// =====================================================================================================
// 23.6 – 28.15 carrying the last bucket… skid… it leaves his hands… CLONK on the parapet… over it goes
// 30.4 – 32.9  the same shot, closer: frozen silence, then the CRASH from the street
// =====================================================================================================
const SKID = 25.48, REL = 25.75, CLONK = 26.75, C2 = 27.15, TIP = 27.82, FALLCUT = 28.15, STILL = 30.4, CRASH = 31.75, DROPT = 32.42;
const SL_VY = 852, SL_S = RS(SL_VY), SL_STR = 58, SL_A = 23.5, SL_V = 100;
const slDist = (t) => { const x = clamp(Math.min(t, SKID) - SL_A, 0, 99), e = 0.4; return SL_V * (x < e ? x * x / (2 * e) : x - e / 2); };
const slSlide = (t) => 54 * so(t, SKID, SKID + 0.32);                                         // both feet skate forward on the wet roof
const slX = (t) => 455 + slDist(t) * SL_S + slSlide(t);
const slSpeed = (t) => clamp((slDist(t + 0.05) - slDist(t - 0.05)) / (0.1 * SL_V));
// lean: + = toward screen-left = backwards (he faces right). A dip forward, then he goes over backwards, then lunges after it.
const slLean = (t) => -4 * slSpeed(t) + trackSpring(t, [[0, 0], [SKID, 19], [REL + 0.16, -12], [C2 + 0.05, -15], [TIP + 0.05, -9]], { feel: 'heavy', windUp: 0.22, windUpDur: 0.14 }) + 5 * startle(t - CRASH) + move(t, 0, -30, DROPT, { feel: 'heavy', windUp: 0.05 });
const slCrouch = (t) => 8 * bump(t, SKID - 0.08, SKID + 0.34) + move(t, 0, 8, REL + 0.16, { feel: 'heavy' }) + 9 * startle(t - CRASH) + move(t, 0, 62, DROPT, { feel: 'heavy', windUp: 0.06 });
const slDrive = (t) => slX(t) - slLean(t) * 5;
function slipOpts(t) { const frozen = t > FALLCUT && t < CRASH, tt = frozen ? FALLCUT : t, fl = startle(t - CRASH);
  const CARRY_L = [6, 58, 34], CARRY_R = [2, 60, 44];
  const armL = armSpring(t, [[0, CARRY_L], [SKID + 0.03, [26, -66, 6]], [REL + 0.14, [34, 22, -40]], [CLONK - 0.25, [8, -18, 84]], [CRASH + 0.02, [0, -34, 30]], [DROPT, [4, -52, 22]]], { feel: 'snappy', windUp: 0.1 });
  const armR = armSpring(t, [[0, CARRY_R], [SKID, [16, -92, 26]], [REL + 0.1, [26, -46, 100]], [CLONK - 0.2, [22, -40, 104]], [C2 + 0.2, [18, -30, 108]], [CRASH, [-4, -30, 30]], [DROPT, [0, -50, 24]]], { feel: 'snappy', windUp: 0.1, delay: 0.04 });
  // the carried bucket swings his hands a little with each step
  const step = slDist(t) / SL_STR, wkk = slSpeed(t) * (t < SKID ? 1 : 0); for (const h of [armL[1], armR[1]]) { h[1] += Math.abs(Math.sin(Math.PI * step)) * 3 * wkk; h[2] += Math.sin(2 * Math.PI * step) * 3 * wkk; }
  const expr = exprTrack(t, [[0, 'happy'], [SKID - 0.02, 'shock'], [REL + 0.12, 'terror'], [CLONK + 0.2, 'scared'], [C2 + 0.15, 'worried'], [TIP - 0.02, 'terror'], [CRASH + 0.5, 'scared']]);
  const bp = bucketAt(Math.min(t, TIP + 0.25)), x = slX(t), eye = [x + 30, SL_VY - 270 * SL_S];
  const look = t < SKID ? [0.5, 0.25] : t < CRASH ? [clamp((bp ? bp[0] - eye[0] : 300) / 260, -1, 1), clamp((bp ? bp[1] - eye[1] : 0) / 240, -1, 1)] : [lerp(0.9, 0.2, so(t, CRASH, CRASH + 0.1)), lerp(0.1, 0.9, so(t, CRASH, CRASH + 0.1))];
  return withAlive({ x, y: SL_VY, s: SL_S, t: tt, turn: 0.72, expr, look, lean: slLean(t), headTilt: overlap(slLean, t, 0.09, 0.8) - 6 * bump(t, SKID, REL + 0.2) - 5 * fl, hipX: -3 * bump(t, SKID, SKID + 0.4),
    crouch: slCrouch(t), walkDist: slDist(t), stride: SL_STR, lift: 13, smoothGait: true, walkSquash: 0.25, ...lagsOf(slDrive, t), breath: frozen ? 1 : breathe(t, t > SKID ? 0.7 : 1.4, 0.6), blink: !frozen && t < SKID,
    squash: 0.9 * startle(t - SKID) + fl, shake: frozen ? 0 : t > CRASH ? 0.5 + 0.6 * fl : t > CLONK ? 0.3 : 0, arms: [armL, armR] }, tt, { energy: t < SKID ? 0.3 : t < CRASH ? 0 : 0.2 }); }
// where the bucket is: [x, y, rot, scale, squashY] (y = its base centre), or null once it has gone over
const PAR = [1012, 577], PAR2 = [1078, 577], BG_G = 1700;
let REL_P = null;                                 // where the bucket leaves his hands: a constant, worked out once from the rig
function heldPos(A, t) { const o = slipOpts(t), a = boneScreen(A.vini, o, 'hand_l'), b = boneScreen(A.vini, o, 'hand_r'); return [(a[0] + b[0]) / 2 + 14, (a[1] + b[1]) / 2 + 58]; }
function bucketAt(t) { if (!REL_P || t < REL) return null; const P0 = REL_P;
  if (t < CLONK) { const T = CLONK - REL, u = t - REL, vy = (PAR[1] - P0[1] - 0.5 * BG_G * T * T) / T; return [lerp(P0[0], PAR[0], u / T), P0[1] + vy * u + 0.5 * BG_G * u * u, -0.25 + (Math.PI * 2 + 0.6) * (u / T), lerp(1.28, 0.98, u / T), 1]; }
  if (t < C2) { const T = C2 - CLONK, u = t - CLONK, vy = -0.5 * BG_G * T; return [lerp(PAR[0], PAR2[0], u / T), PAR[1] + vy * u + 0.5 * BG_G * u * u, 0.35 - 0.75 * (u / T) + 0.5 * Math.sin(Math.PI * u / T), 0.98, 1 - 0.22 * Math.exp(-u * 26)]; }
  if (t < TIP) { const u = t - C2; return [PAR2[0] + 10 * sm(t, C2 + 0.2, TIP), PAR2[1], -0.4 * Math.cos(u * 10.5) * Math.exp(-u * 1.5) + 0.42 * ease.in(clamp(u / (TIP - C2))), 0.98, 1 - 0.18 * Math.exp(-u * 26)]; }
  const u = t - TIP; return [PAR2[0] + 10 + 46 * so(t, TIP, TIP + 0.3), PAR2[1] + 0.5 * 1500 * u * u, 0.42 + 4.2 * u, 0.98, 1]; }
function slipWorld(g, t, A) { // everything in background coordinates
  if (!REL_P) { REL_P = [0, 0]; REL_P = heldPos(A, REL); }
  splashes(g, t, 1.2, 0, 1300, 740, 1060, 34);
  // skid marks and spray under his boots
  const sk = t - SKID; if (sk > 0 && sk < 1.3) { const x = slX(t), a = 1 - clamp(sk / 1.3); g.strokeStyle = alpha('#e8f2f6', 0.75 * a); g.lineWidth = 4; g.lineCap = 'round';
    for (const off of [-52, 66]) { g.beginPath(); g.moveTo(slX(SKID) + off - 10, SL_VY + 5); g.lineTo(x + off - 12, SL_VY + 5); g.stroke(); }
    if (sk < 0.4) for (let i = 0; i < 6; i++) { const p = sk / 0.4, ang = -0.4 - i * 0.22; g.fillStyle = alpha('#dcecf4', 0.9 * (1 - p)); g.beginPath(); g.arc(x + 80 + Math.cos(ang) * 90 * p, SL_VY - 4 + Math.sin(ang) * 70 * p + 60 * p * p, 4.5 * (1 - p * 0.5), 0, 7); g.fill(); } }
  const o = slipOpts(t); drawVini(g, A.vini, o); drips(g, t > FALLCUT && t < CRASH ? FALLCUT : t, o.x, SL_VY, SL_S, 0.8);
  if (t < REL) { const h = heldPos(A, t); bucket(g, h[0], h[1], 1.28, -0.05 + 0.1 * Math.sin(Math.PI * slDist(t) / SL_STR) * slSpeed(t) - 0.5 * so(t, SKID, REL), { handle: 1.25 }); }
  else { const b = bucketAt(t); if (b) { g.save(); if (t >= TIP) { g.beginPath(); g.rect(0, 0, W, PAR2[1] + 2); g.clip(); }
      if (t < CLONK) { g.fillStyle = alpha('#000', 0.16 * sm(t, CLONK - 0.3, CLONK)); g.beginPath(); g.ellipse(PAR[0], PAR[1] + 2, 26, 5, 0, 0, 7); g.fill(); }
      bucket(g, b[0], b[1], b[3], b[2], { sy: b[4], sx: 2 - b[4], handle: 1.3 }); g.restore();
      // motion streaks while it flies
      if (t < CLONK) { const p = bucketAt(t - 0.05); if (p) { g.strokeStyle = alpha('#f4efe2', 0.5); g.lineWidth = 4; g.lineCap = 'round'; for (const d of [-18, 16]) { g.beginPath(); g.moveTo(p[0] + d, p[1] - 40 + d); g.lineTo(lerp(p[0], b[0], -1.1) + d, lerp(p[1], b[1], -1.1) - 40 + d); g.stroke(); } } }
      for (const [tc, big] of [[CLONK, 1], [C2, 0.6]]) { const p = (t - tc) / 0.28; if (p > 0 && p < 1) { g.strokeStyle = alpha('#fff6d8', 1 - p); g.lineWidth = 5; g.lineCap = 'round'; const [cx, cy] = tc === CLONK ? PAR : PAR2;
          for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * (30 + 40 * p) * big, cy + Math.sin(a) * (16 + 34 * p) * big); g.lineTo(cx + Math.cos(a) * (48 + 62 * p) * big, cy + Math.sin(a) * (26 + 52 * p) * big); g.stroke(); } } } } }
}
function sSlip(g, t, A) { const x = slX(t);
  const wide = { z: lerp(1.5, 1.44, sm(t, SKID, REL + 0.3)), x: clamp(lerp(560, 660, sm(t, 23.6, 25.6)), 0, 665), y: lerp(612, 560, sm(t, SKID - 0.1, REL + 0.35)) + 40 * sm(t, CLONK - 0.25, CLONK + 0.1) };
  const c = camBegin(g, A.bg.rooftop, punches(t, wide, [[C2 + 0.12, 9, { z: 2.05, x: 838, y: 568 }]]), camShake(t, 7, CLONK, 0.3));
  slipWorld(g, t, A); camEnd(g); rain(g, t, 1.5);
  note(g, 'the last bucket', W * 0.66, H * 0.2, { size: 66, k: pop(t, 24.0) * (1 - sm(t, 25.2, 25.4)) });
  const [cx, cy] = toScreen(c, PAR[0], PAR[1]);
  if (t > CLONK && t < C2 + 0.15) note(g, 'CLONK', cx + 190 + Math.sin(t * 40) * 4, cy - 150, { size: 120, k: pop(t, CLONK, 0.16), rot: 0.07 });
  if (t > TIP - 0.5 && t < TIP + 0.1) note(g, 'no no no no', W * 0.3, H * 0.18, { size: 70, color: '#2a2622', k: pop(t, TIP - 0.48), rot: -0.04 });
  day(g, t); vignette(g, 0.4); }
function sStill(g, t, A) { const k = sm(t, STILL, CRASH), dr = sm(t, DROPT, DROPT + 0.5);
  camBegin(g, A.bg.rooftop, { z: lerp(1.92, 1.99, k) - 0.25 * dr, x: 860, y: lerp(575, 580, k) + 70 * dr }, camShake(t, 15, CRASH, 0.55));
  slipWorld(g, t, A); camEnd(g);
  rain(g, t < CRASH ? STILL + (t - STILL) * 0.12 : STILL + (CRASH - STILL) * 0.12 + (t - CRASH), 1.2);                     // the rain all but hangs in the air while he waits
  if (t > CRASH) { const kk = pop(t, CRASH, 0.16); bigText(g, 'CRASH', W * 0.5 + Math.sin(t * 46) * 8 * (1 - sm(t, CRASH, CRASH + 0.7)), H * 0.8 - 30 * so(t, CRASH, CRASH + 0.25), { size: 260, color: '#fff3d0', k: kk * (1 - sm(t, 32.55, 32.85)), rot: -0.05 });
    note(g, '(five floors down)', W * 0.5, H * 0.94, { size: 54, k: pop(t, CRASH + 0.35) * (1 - sm(t, 32.55, 32.85)), rot: 0.01 }); fade(g, 0.5 * (1 - so(t, CRASH, CRASH + 0.2)), '#ffffff'); }
  day(g, t); vignette(g, 0.5 - 0.1 * sm(t, CRASH, CRASH + 0.3)); }

// =====================================================================================================
// 28.15 – 30.4  five floors: 5 · 4 · 3 · 2 · 1
// =====================================================================================================
const FH = 600, FALL_T = 2.2, FALL_G = 2 * (5 * FH + 140) / (FALL_T * FALL_T);
function sFall(g, t, A) { const u = Math.max(0, t - FALLCUT), wy = -40 + 0.5 * FALL_G * u * u, sy = lerp(250, 1290, ease.in(clamp(u / (FALL_T - 0.02)))), cam = wy - sy, speed = FALL_G * u, WALL = 1090, bx = 1330;
  const Y = (w) => w - cam;
  g.fillStyle = linGrad(g, 0, 0, 0, H, ['#3d3f45', '#6b6d72']); g.fillRect(0, 0, W, H);
  // far rooftops rising slowly on the right
  { const r = rng(9), base = 1500 - cam * 0.16; g.fillStyle = '#34353a'; for (let x = WALL - 40; x < W + 80; x += 86) { const h = 90 + r() * 240; g.fillRect(x, base - h, 80, 2400); if (r() > 0.5) g.fillRect(x + 20, base - h - 34, 16, 36); } g.fillStyle = '#2b2c30'; g.fillRect(WALL, base + 60, W, 3000); }
  // the roof he is standing on
  if (Y(-20) > -500) { g.save(); g.beginPath(); g.rect(0, 0, W, Y(-52)); g.clip(); drawVini(g, A.vini, { x: 800, y: Y(40), s: 1.5, t: FALLCUT, turn: 0.72, expr: 'terror', look: [0.9, 0.8], arms: [[8, -18, 84], [22, -40, 104]], lean: -12, crouch: 8, shadow: false, blink: false }); g.restore(); }
  // the wall
  g.fillStyle = '#6f392c'; g.fillRect(-10, Y(-50), WALL + 10, 6000);
  const blur = clamp(speed / 2600);
  g.strokeStyle = alpha('#2e1c17', 0.55 * (1 - blur * 0.75)); g.lineWidth = 3; const C = 40, first = Math.floor((cam - 60) / C) * C;
  for (let w = Math.max(-40, first); w < cam + H + 60; w += C) { g.beginPath(); g.moveTo(0, Y(w)); g.lineTo(WALL, Y(w)); g.stroke(); if (blur < 0.5) { g.globalAlpha = 1 - blur * 2; const off = (Math.round(w / C) % 2) * 60; for (let x = off; x < WALL; x += 120) { g.beginPath(); g.moveTo(x, Y(w)); g.lineTo(x, Y(w + C)); g.stroke(); } g.globalAlpha = 1; } }
  if (blur > 0.1) { const r = rng(3); g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = r() * WALL, ph = r(), len = 120 + 500 * blur * r(), yy = ((ph * 1500 - cam * 1.0) % 1500 + 1500) % 1500 - 200; g.strokeStyle = alpha(r() > 0.5 ? '#8a4a3a' : '#4a261d', 0.5 * blur); g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy + len); g.stroke(); } }
  for (let n = 5; n >= 1; n--) { const top = (5 - n) * FH + 70, y0 = Y(top); if (y0 > H + 100 || y0 < -FH - 100) continue;
    g.fillStyle = '#857b6c'; g.strokeStyle = INK; g.lineWidth = 4; g.fillRect(-10, y0 - 14, WALL + 10, 28); g.strokeRect(-10, y0 - 14, WALL + 10, 28);
    for (const wx of [150, 560]) { g.fillStyle = '#d2cab8'; g.beginPath(); g.rect(wx, y0 + 150, 300, 330); g.fill(); g.stroke(); g.fillStyle = n === 3 && wx === 150 ? '#c9a850' : '#1f262b'; g.fillRect(wx + 18, y0 + 168, 264, 294); g.strokeRect(wx + 18, y0 + 168, 264, 294);
      g.beginPath(); g.moveTo(wx + 150, y0 + 168); g.lineTo(wx + 150, y0 + 462); g.moveTo(wx + 18, y0 + 300); g.lineTo(wx + 282, y0 + 300); g.stroke(); g.fillStyle = '#b9b1a0'; g.fillRect(wx - 14, y0 + 480, 328, 20); g.strokeRect(wx - 14, y0 + 480, 328, 20);
      if ((n + wx) % 2 === 0) { g.fillStyle = '#5d4a36'; for (const [a, b] of [[190, 0.05], [330, -0.04]]) { g.save(); g.translate(wx + 150, y0 + a + 40); g.rotate(b); g.fillRect(-170, -22, 340, 44); g.strokeRect(-170, -22, 340, 44); g.restore(); } } }
    g.save(); g.font = '400 210px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = alpha('#efe6d2', 0.9); g.strokeStyle = alpha(INK, 0.8); g.lineWidth = 10; g.lineJoin = 'round'; g.strokeText(String(n), 985, y0 + 320); g.fillText(String(n), 985, y0 + 320); g.restore(); }
  g.fillStyle = '#4c5257'; g.strokeStyle = INK; g.lineWidth = 4; g.fillRect(WALL - 60, Y(-30), 26, 6000); g.strokeRect(WALL - 60, Y(-30), 26, 6000);
  g.fillStyle = '#5c5a56'; g.fillRect(-10, Y(-72), WALL + 40, 44); g.strokeRect(-10, Y(-72), WALL + 40, 44);
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(WALL, Y(-28)); g.lineTo(WALL, H + 20); g.stroke();
  // the bucket, tumbling, with speed lines above it
  g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const dx = (i - 2) * 26, len = (80 + 190 * blur) * (0.6 + 0.4 * Math.sin(i * 2.1 + t * 30)); g.strokeStyle = alpha('#f4efe2', 0.25 + 0.4 * blur); g.lineWidth = 5; g.beginPath(); g.moveTo(bx + dx, sy - 150); g.lineTo(bx + dx, sy - 150 - len); g.stroke(); }
  bucket(g, bx + Math.sin(u * 5) * 16, sy, 2.5, 0.42 + u * 7.5, { handle: 1.3 + Math.sin(u * 20) * 0.3 });
  rain(g, t, 1.4, 0.05);
  // ticking floor counter
  const tn = (n) => FALLCUT + Math.sqrt(2 * Math.max(0, (5 - n) * FH + 110) / FALL_G); let cur = 5; for (let n = 5; n >= 1; n--) if (t >= tn(n)) cur = n;
  note(g, 'FLOOR', 1640, 210, { size: 70, k: pop(t, FALLCUT + 0.05), rot: 0 });
  bigText(g, String(cur), 1640, 400, { size: 320, color: '#fff3d0', k: cur === 5 ? pop(t, FALLCUT + 0.05, 0.16) : pop(t, tn(cur), 0.13), rot: -0.03 });
  day(g, t); vignette(g, 0.42); }

// =====================================================================================================
// 32.9 – 35.1 and 39.6 – 40.95  eyes over the parapet (drawn insert, seen from outside the roof). He does not move.
// =====================================================================================================
function timeCap(g, str, k, big = 0) { if (k <= 0) return; g.save(); g.translate(W - 250, 110); g.scale(0.7 + 0.3 * Math.min(1, k) + big, 0.7 + 0.3 * Math.min(1, k) + big); g.globalAlpha = clamp(k * 2.5); g.rotate(0.02);
  g.fillStyle = alpha('#14120e', 0.78); g.beginPath(); g.roundRect(-190, -52, 380, 104, 16); g.fill(); g.strokeStyle = '#ece6d6'; g.lineWidth = 5; g.beginPath(); g.arc(-136, 0, 26, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-136, -14); g.lineTo(-136, 0); g.lineTo(-124, 8); g.stroke();
  g.font = '400 58px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ece6d6'; g.fillText(str, 34, 4); g.restore(); }
function sPeek(g, t, A, later) { const t0 = later ? 39.6 : 32.9, k = sm(t, t0, t0 + 2.4), z = later ? lerp(1.1, 1.04, k) : lerp(1.0, 1.1, k), TOP = 640;
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2 - 30);
  g.fillStyle = linGrad(g, 0, -100, 0, 700, ['#34363b', '#6c6e73']); g.fillRect(-200, -200, W + 400, H + 400);
  { const r = rng(21); g.fillStyle = alpha('#2a2b30', 0.5); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(r() * W, 60 + r() * 380, 200 + r() * 260, 40 + r() * 50, 0, 0, 7); g.fill(); } }
  // Vini: only the top of his head and his eyes show
  const VX = 960, S = 3.3, tt = t0 + (t - t0) * 0.5;
  g.save(); g.beginPath(); g.rect(-200, -200, W + 400, TOP + 200); g.clip();
  drawVini(g, A.vini, withAlive({ x: VX, y: TOP + 894, s: S, t: tt, shadow: false, expr: { mouth: 'mouth', brow: [16, 14], eyeScale: 1.1 }, look: later ? [0.1 * Math.sin(t * 0.9), lerp(1, -0.9, sm(t, 40.05, 40.2)) + 1.9 * sm(t, 40.55, 40.7)] : [0.25 * Math.sin((t - t0) * 1.6), 1], arms: ['down', 'down'], breath: 0.3, hairLag: 0, packLag: 0 }, tt, { energy: 0.1 }));
  g.restore();
  // fingers hooked over the edge
  g.fillStyle = '#17131a'; g.strokeStyle = INK; g.lineWidth = 4; for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(VX + sd * (250 + i * 34), TOP + 2 + (i === 0 || i === 3 ? 3 : 0), 15, 22, 0, 0, 7); g.fill(); g.stroke(); }
  // parapet: coping stones and brick, in the show's outline style
  g.fillStyle = '#6b3a2e'; g.fillRect(-200, TOP + 56, W + 400, 700);
  g.strokeStyle = alpha('#2a1a16', 0.8); g.lineWidth = 4; for (let row = 0; row < 12; row++) { const y = TOP + 56 + row * 52; g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); for (let x = -200 + (row % 2) * 80; x < W + 200; x += 160) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 52); g.stroke(); } }
  { const r = rng(4); for (let i = 0; i < 26; i++) { g.fillStyle = alpha(r() > 0.5 ? '#8a4a3a' : '#4d281f', 0.35); g.fillRect(-200 + Math.floor(r() * 14) * 160 + (i % 2) * 80 + 4, TOP + 60 + Math.floor(r() * 10) * 52, 152, 44); } }
  g.fillStyle = alpha('#000', 0.3); g.fillRect(-200, TOP + 56, W + 400, 22);
  g.strokeStyle = INK; g.lineWidth = 5; for (let x = -220; x < W + 200; x += 430) { g.fillStyle = '#716e68'; g.beginPath(); g.rect(x, TOP, 430, 58); g.fill(); g.stroke(); g.fillStyle = alpha('#ffffff', 0.14); g.fillRect(x + 6, TOP + 5, 418, 9); }
  for (let i = 0; i < 8; i++) { const p = ((t * 1.8 + i * 0.29) % 1), x = 150 + i * 235 + (i % 3) * 40; g.strokeStyle = alpha('#e6f0f6', 0.7 * (1 - p)); g.lineWidth = 3; g.beginPath(); g.ellipse(x, TOP + 6, 6 + 20 * p, 2 + 5 * p, 0, 0, 7); g.stroke(); }
  if (later) { const land = 39.95, k2 = clamp((t - land + 0.45) / 0.45), py = lerp(-260, TOP - 236, ease.out(k2)) - 10 * Math.max(0, settle(t, land, 1, 16, 7)); pigeon(g, lerp(1300, 1000, ease.out(k2)), py, 1.9, -1, t, { flap: k2 < 1 ? 0.5 + 0.5 * Math.sin(t * 40) : 0 }); }
  g.restore();
  rain(g, t0 + (t - t0) * (later ? 1 : 0.7), 1.1);
  if (!later) { note(g, 'do. not. move.', W * 0.5, H * 0.9, { size: 76, color: '#f4efe2', glow: false, k: pop(t, 33.5) }); timeCap(g, '0 min', pop(t, 33.1)); }
  else { timeCap(g, '1 HOUR', 1, 0.25 * Math.max(0, settle(t, 39.6, 1, 12, 5))); note(g, 'still has not moved', W * 0.5, H * 0.9, { size: 70, color: '#f4efe2', glow: false, k: pop(t, 39.8) }); }
  day(g, t); vignette(g, 0.5); }

// =====================================================================================================
// 35.1 – 39.6  the street fills up, stares at nothing, and empties again (an hour, squeezed)
// =====================================================================================================
const ST0 = 35.1, ST1 = 39.6, BKT = [962, 902];
const ZS = [
  { kind: 'office', seed: 1.3, from: 'L', y: 898, xs: 815, d: 300, tin: 34.75, din: 2.2, tout: 38.25, out: 'L', st: 0.3 },
  { kind: 'worker', seed: 2.9, from: 'R', y: 906, xs: 1120, d: 330, tin: 34.9, din: 2.3, tout: 38.5, out: 'R', st: -0.3 },
  { kind: 'teen', seed: 4.1, from: 'L', y: 862, xs: 880, d: 380, tin: 35.2, din: 2.2, tout: 38.65, out: 'L', st: 0.1 },
  { kind: 'office', seed: 5.6, from: 'R', y: 868, xs: 1050, d: 420, tin: 35.3, din: 2.3, tout: 38.35, out: 'R', st: -0.15 },
  { kind: 'worker', seed: 6.2, from: 'L', y: 948, xs: 700, d: 340, tin: 35.45, din: 2.0, tout: 38.8, out: 'L', st: 0.34 },
  { kind: 'teen', seed: 7.7, from: 'R', y: 954, xs: 1235, d: 360, tin: 35.15, din: 2.3, tout: 38.6, out: 'R', st: -0.34 },
  { kind: 'office', seed: 8.8, from: 'L', y: 832, xs: 930, d: 300, tin: 35.6, din: 1.9, tout: 38.45, out: 'R', st: 0 },
  { kind: 'worker', seed: 9.4, from: 'R', y: 838, xs: 1010, d: 460, tin: 35.5, din: 2.3, tout: 38.7, out: 'L', st: -0.1 },
  { kind: 'teen', seed: 10.9, from: 'L', y: 996, xs: 600, d: 300, tin: 35.9, din: 1.9, tout: 38.4, out: 'L', st: 0.3 },
];
function zomb(g, rig, z, t) { const s = sY(z.y) * 0.95, arr = z.tin + z.din, inK = seg(t, [z.tin, arr], 1, 0.35), dI = z.from === 'L' ? 1 : -1, dO = z.out === 'L' ? -1 : 1, ot = t - z.tout;
  const dOut = ot > 0 ? 78 * s * (ot - 0.4 * (1 - Math.exp(-ot / 0.4))) : 0, x = z.xs - dI * z.d * (1 - inK) + dO * dOut, leaving = ot > 0, sd = z.seed;
  const turn = t < z.tout - 0.6 ? lerp(dI * 0.95, z.st, sm(t, arr - 0.2, arr + 0.4)) : lerp(z.st, dO * 0.95, sm(t, z.tout - 0.6, z.tout - 0.05));
  const prof = clamp((Math.abs(turn) - 0.35) / 0.6), sway = Math.sin(t * 1.6 + sd * 2.1) * 4, jerk = Math.sin(t * 1.3 + sd) > 0.85 ? Math.sin(t * 9 + sd) * 4 : 0, sgn = turn < 0 ? -1 : 1;
  const hang = (a) => [lerp(a[0], 8, prof), lerp(a[1], a[3] + sway * a[4], prof), lerp(a[2], a[5], prof)];
  drawVini(g, rig, { x, y: z.y, s, t: t + sd * 3, skin: KINDS[z.kind], expr: Math.sin(t * 0.9 + sd * 3) > 0.55 ? 'groan' : 'zombie', blink: false, turn, look: [sgn * prof * 0.6 + (1 - prof) * Math.sin(t * 0.5 + sd) * 0.8, 0.15 - 0.5 * (1 - prof)],
    arms: [hang([8, 84, 4, 6, 1, 76]), hang([10, 80, 6, 12, -1, 70])], headTilt: Math.sin(t * 1.25 + sd) * 7 + jerk - sgn * 6 * prof + (1 - prof) * 9 * Math.sin(sd * 5), lean: -sgn * 8 * prof + (1 - prof) * 3 * Math.sin(t * 0.8 + sd),
    walkDist: leaving ? dO * dOut / s : dI * z.d * inK / s, stride: 30, lift: 7, drag: 1, walkMix: leaving ? 1 : 1 - sm(t, arr + 0.05, arr + 0.45), shadowA: 0.3 }); }
function sStreet(g, t, A) { const out = sm(t, 38.5, ST1);
  const c = camBegin(g, A.bg.street, { z: lerp(1.42, 1.58, sm(t, ST0, 38.4)) + 0.5 * out, x: 962, y: lerp(800, 815, sm(t, ST0, ST1)) + 30 * out });
  const items = ZS.map((z) => [z.y, () => zomb(g, A.zombie, z, t)]);
  items.push([BKT[1] + 4, () => { g.fillStyle = alpha('#000', 0.3); g.beginPath(); g.ellipse(BKT[0] + 4, BKT[1] + 2, 44, 9, 0, 0, 7); g.fill(); bucket(g, BKT[0] - 26, BKT[1] - 22, 0.95, 1.5 + 0.22 * Math.sin((t - ST0) * 8) * Math.exp(-(t - ST0) * 2.2), { dent: true, handle: 1.45 }); }]);
  items.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
  camEnd(g);
  const [bx, by] = toScreen(c, BKT[0], BKT[1]);
  note(g, 'the bucket', bx + 20, by + 120, { size: 58, k: pop(t, ST0 + 0.15) * (1 - sm(t, 36.3, 36.6)) }); arrowTo(g, bx + 10, by + 92, bx + 6, by + 22, so(t, ST0 + 0.2, ST0 + 0.5) * (1 - sm(t, 36.3, 36.6)), RED, 10);
  note(g, 'staring at… nothing', W * 0.5, H * 0.16, { size: 80, k: pop(t, 37.35) * (1 - sm(t, 38.45, 38.7)) });
  note(g, '…and off they go', W * 0.5, H * 0.16, { size: 70, color: '#f4efe2', glow: false, k: pop(t, 38.8) });
  const mins = lerp(4, 59, clamp((t - ST0) / (ST1 - ST0 - 0.15))); timeCap(g, `${Math.floor(mins)} min`, 1);
  day(g, t); vignette(g, 0.42); }

// =====================================================================================================
// 40.95 – 45.75  RULE 8: boil or filter   ·   45.75 – 50.85  what the roof adds to your drink
// =====================================================================================================
const R8 = 40.95, GL = 45.75, DIRT = 48.5, BIRD = 49.15, PLOP = 49.5, WORSE = 50.2;
function sRule8(g, t) { page(g, t, R8, () => {
  heading(g, t, 8, 'BOIL OR FILTER', 41.1, 42.25);
  writeOn(g, 'before you drink it', W * 0.6, 256, wk(t, 44.25, 'before you drink it', 20), { size: 62, color: '#2a6ab8' });
  // boil: a pan over a flame
  { const x = 480, y = 560, k = drawK(t, 42.5, 0.5), P = () => { g.beginPath(); g.rect(x - 90, y - 40, 180, 90); };
    waterFill(g, P, sm(t, 42.8, 43.3), y - 26, y + 50, t); penStrokes(g, [[[[x - 90, y - 40], [x - 90, y + 50], [x + 90, y + 50], [x + 90, y - 40]], 7], [[[x + 90, y - 20], [x + 190, y - 32]], 9], [[[x - 60, y + 110], [x - 40, y + 70], [x - 20, y + 110], [x, y + 64], [x + 20, y + 110], [x + 40, y + 70], [x + 60, y + 110]], 6]], k);
    if (t > 43.0) for (let i = 0; i < 5; i++) { const p = ((t * 1.2 + i * 0.2) % 1); g.strokeStyle = alpha(INK, 0.8 * (1 - p)); g.lineWidth = 4; g.beginPath(); g.arc(x - 60 + i * 30, y + 30 - p * 90, 6 + 6 * p, 0, 7); g.stroke(); }
    writeOn(g, 'boil it', x, 760, wk(t, 42.75, 'boil it', 22), { size: 60, pen: false }); tick(g, x + 150, 470, 36, ease.out(clamp((t - 43.25) / 0.22))); }
  // filter: a cloth in a funnel over a bottle
  { const x = 960, y = 560, k = drawK(t, 43.45, 0.5), P = () => { g.beginPath(); g.roundRect(x - 42, y + 6, 84, 110, 10); };
    waterFill(g, P, sm(t, 43.9, 44.8) * 0.7, y + 12, y + 116, t); penStrokes(g, [[[[x - 100, y - 120], [x - 14, y - 22], [x - 14, y + 6], [x - 42, y + 24], [x - 42, y + 116], [x + 42, y + 116], [x + 42, y + 24], [x + 14, y + 6], [x + 14, y - 22], [x + 100, y - 120]], 7], [[[x - 104, y - 120], [x - 50, y - 96], [x, y - 108], [x + 50, y - 96], [x + 104, y - 120]], 6]], k);
    if (t > 43.9) { const p = ((t * 1.6) % 1); drop(g, x, y + 16 + p * 50, 6); }
    writeOn(g, 'or filter it', x, 760, wk(t, 43.6, 'or filter it', 24), { size: 60, pen: false }); tick(g, x + 150, 470, 36, ease.out(clamp((t - 44.0) / 0.22))); }
  // straight off the roof: no
  { const x = 1440, y = 560, k = drawK(t, 44.6, 0.45), P = () => { g.beginPath(); g.moveTo(x - 70, y - 90); g.lineTo(x + 70, y - 90); g.lineTo(x + 54, y + 100); g.lineTo(x - 54, y + 100); g.closePath(); };
    waterFill(g, P, sm(t, 44.75, 45.1), y - 60, y + 100, t, 'rgba(120,128,70,0.8)'); penStrokes(g, [[[[x - 70, y - 90], [x - 54, y + 100], [x + 54, y + 100], [x + 70, y - 90]], 7]], k);
    if (t > 45.0) { const r = rng(8); g.fillStyle = alpha('#3a3420', 0.8); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x - 44 + r() * 88, y - 40 + r() * 120 + Math.sin(t * 2 + i) * 4, 3 + r() * 4, 0, 7); g.fill(); } }
    writeOn(g, 'straight off the roof', x, 760, wk(t, 44.7, 'straight off the roof', 30), { size: 54, pen: false }); cross(g, x, y, 130, so(t, 45.1, 45.45)); }
}); }
function sGlass(g, t) { page(g, t, GL - 5, () => {
  writeOn(g, 'rain off a dirty roof picks up…', W * 0.5, 170, wk(t, GL + 0.15, 'rain off a dirty roof picks up…', 22), { size: 70, font: 'Permanent Marker' });
  const X = 960, TOPY = 470, BOT = 830, P = () => { g.beginPath(); g.moveTo(X - 160, TOPY); g.lineTo(X + 160, TOPY); g.lineTo(X + 120, BOT); g.lineTo(X - 120, BOT); g.closePath(); };
  // the roof and its gutter, feeding the glass
  penStrokes(g, [[[[330, 300], [800, 395], [800, 420], [840, 428]], 9], [[[330, 300], [330, 340]], 9]], drawK(t, GL + 0.2, 0.5));
  for (let i = 0; i < 6; i++) { const y = 318 + (i * 53) % 90; g.strokeStyle = alpha('#2a2622', 0.5 * sm(t, GL + 0.5, GL + 0.8)); g.lineWidth = 4; g.beginPath(); g.moveTo(380 + i * 66, y - 10 + i * 13); g.lineTo(404 + i * 66, y - 4 + i * 13); g.stroke(); }
  const flow = sm(t, GL + 0.6, GL + 0.9) * (1 - sm(t, 48.0, 48.35));
  if (flow > 0) { for (let i = 0; i < 4; i++) { const p = ((t * 1.4 + i * 0.25) % 1); g.globalAlpha = flow; drop(g, lerp(400, 800, p), lerp(296, 378, p), 8); g.globalAlpha = 1; }
    g.strokeStyle = alpha(PAL.water, 0.9 * flow); g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(842, 430); g.quadraticCurveTo(880, 440, 890, 520); g.lineTo(890, BOT - 20); g.stroke(); }
  const dirty = sm(t, DIRT + 0.15, DIRT + 0.6) * 0.4 + sm(t, PLOP, PLOP + 0.4) * 0.25 + sm(t, WORSE + 0.15, WORSE + 0.5) * 0.35;
  waterFill(g, P, sm(t, GL + 0.8, 48.2), 560, BOT, t, mix('rgba(84,160,214,0.85)', 'rgba(112,118,52,0.92)', dirty));
  // 1: dirt
  { const r = rng(12); for (let i = 0; i < 5; i++) { const t0 = DIRT + i * 0.05, dt = t - t0, x = X - 80 + r() * 150, sz = 9 + r() * 9; if (dt < 0) { r(); continue; } const yIn = 240 + 0.5 * 2400 * dt * dt, y = yIn < 580 ? yIn : Math.min(BOT - 16 - r() * 12, 580 + (dt - Math.sqrt(340 / 1200)) * 190);
      g.fillStyle = '#5a4026'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, sz, sz * 0.75, i, 0, 7); g.fill(); g.stroke(); } }
  // 2: a pigeon lands on the rim and contributes
  { const k = clamp((t - (BIRD - 0.5)) / 0.5); if (k > 0) { const px = lerp(1700, X + 168, ease.out(k)), py = lerp(160, TOPY - 30, ease.out(k)) - 8 * Math.max(0, settle(t, BIRD, 1, 16, 7)) + 7 * bump(t, PLOP - 0.22, PLOP - 0.04);
      const dt = t - (PLOP - 0.12); if (dt > 0) { const y = TOPY - 30 + 0.5 * 2400 * dt * dt; g.fillStyle = '#f2f0e8'; g.strokeStyle = INK; g.lineWidth = 3; if (y < 590) { g.beginPath(); g.ellipse(X + 76, y, 10, 15, 0, 0, 7); g.fill(); g.stroke(); } else { const s2 = clamp((t - PLOP) / 0.6); g.globalAlpha = 0.9; g.beginPath(); g.ellipse(X + 76, 600 + 110 * s2, 12 + 26 * s2, 10 + 12 * s2, 0, 0, 7); g.fill(); g.globalAlpha = 1; } }
      pigeon(g, px, py, 1.7, 1, t, { flap: k < 1 ? 0.5 + 0.5 * Math.sin(t * 40) : 0 }); } }
  // 3: …and worse
  { const dt = t - WORSE; if (dt > 0) { const yIn = 230 + 0.5 * 2400 * dt * dt, y = yIn < 600 ? yIn : Math.min(BOT - 70, 600 + (dt - Math.sqrt(370 / 1200)) * 150); germ(g, X - 20, y, 44, t, { col: '#9ad03a', grin: 1 });
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, X - 20, y, 0, 110, [alpha('#b8ff40', 0.28), alpha('#b8ff40', 0)]); g.beginPath(); g.arc(X - 20, y, 110, 0, 7); g.fill(); g.restore(); } }
  // splashes on each arrival
  for (const [tc, sx] of [[DIRT + 0.34, X - 10], [PLOP + 0.02, X + 76], [WORSE + 0.39, X - 20]]) { const p = (t - tc) / 0.35; if (p > 0 && p < 1) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.36; drop(g, sx + Math.cos(a) * 110 * p, 566 + Math.sin(a) * 120 * p + 150 * p * p, 7 * (1 - p * 0.5), mix(PAL.water, '#70763a', dirty)); } }
  P(); g.strokeStyle = INK; g.lineWidth = 8; g.lineJoin = 'round'; g.stroke(); g.strokeStyle = alpha('#ffffff', 0.6); g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(X - 132, TOPY + 30); g.lineTo(X - 104, BOT - 40); g.stroke();
  note(g, 'dirt', 600, 640, { size: 84, k: pop(t, DIRT + 0.1) }); arrowTo(g, 660, 650, 800, 700, so(t, DIRT + 0.2, DIRT + 0.5), RED, -20);
  note(g, 'bird droppings', 1470, 640, { size: 76, k: pop(t, BIRD + 0.2), rot: 0.03 }); arrowTo(g, 1300, 620, 1150, 520, so(t, BIRD + 0.3, BIRD + 0.6), RED, 20);
  note(g, '…and WORSE', 960, 940, { size: 96, k: pop(t, WORSE + 0.05) }); for (const [qx, qy, qd] of [[700, 930, 0.1], [1240, 936, 0.2], [1320, 890, 0.3]]) note(g, '?', qx, qy + Math.sin(t * 5 + qx) * 6, { size: 80, k: pop(t, WORSE + qd), rot: (qx - 960) * 0.0005 });
}); }

// =====================================================================================================
// 50.85 – 55.95  a rolling boil for one minute
// =====================================================================================================
const BL = 50.85, TM0 = 51.9, TM1 = 54.55, STV = [1075, 992];
function stove(g, t, k) { const [x, y] = STV; g.save(); g.translate(x, y); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.fillStyle = alpha('#000', 0.3); g.beginPath(); g.ellipse(0, 4, 86, 12, 0, 0, 7); g.fill();
  g.fillStyle = '#3d6a9a'; g.beginPath(); g.roundRect(-44, -62, 88, 62, 12); g.fill(); g.stroke(); g.fillStyle = '#e8e2d0'; g.fillRect(-44, -44, 88, 18); g.strokeRect(-44, -44, 88, 18); g.fillStyle = RED; g.beginPath(); g.moveTo(0, -42); g.lineTo(7, -29); g.lineTo(-7, -29); g.closePath(); g.fill();
  g.fillStyle = '#2b2d30'; g.beginPath(); g.roundRect(-18, -78, 36, 18, 4); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-52, -86, 104, 10, 4); g.fill(); g.stroke();
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 48, -84); g.lineTo(sx * 66, -100); g.stroke(); }
  // flame
  for (let i = 0; i < 7; i++) { const fx = -36 + i * 12, h = 15 + 7 * Math.sin(t * 23 + i * 2.1); g.fillStyle = i % 2 ? '#5aa8ff' : '#ffb040'; g.beginPath(); g.moveTo(fx - 6, -86); g.quadraticCurveTo(fx, -86 - h * 1.6, fx + 6, -86); g.closePath(); g.fill(); }
  // pan
  const py = -102, jig = Math.sin(t * 31) * 1.2 * k; g.translate(jig, 0);
  g.fillStyle = '#3a3d42'; g.beginPath(); g.roundRect(88, py - 44, 120, 14, 7); g.fill(); g.stroke();
  g.fillStyle = '#565b61'; g.beginPath(); g.moveTo(-92, py - 62); g.lineTo(92, py - 62); g.lineTo(84, py); g.lineTo(-84, py); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = alpha('#000', 0.2); g.beginPath(); g.moveTo(30, py - 62); g.lineTo(92, py - 62); g.lineTo(84, py); g.lineTo(40, py); g.closePath(); g.fill();
  g.fillStyle = alpha(PAL.water, 0.95); g.beginPath(); g.ellipse(0, py - 62, 92, 14, 0, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.5); g.lineWidth = 3; g.beginPath(); g.moveTo(-78, py - 50); g.lineTo(-72, py - 10); g.stroke();
  // rolling boil: bubbles swell and burst on the surface, steam above
  const r = rng(44); for (let i = 0; i < 12; i++) { const bx = -76 + r() * 152, per = 0.35 + r() * 0.4, p = ((t + r() * 2) % per) / per; g.strokeStyle = alpha('#ffffff', 0.9 * k * (1 - p * 0.4)); g.fillStyle = alpha('#d6eefa', 0.75 * k); g.lineWidth = 2.5; g.beginPath(); g.arc(bx, py - 64 - p * 9, (3 + 10 * p) * k, 0, 7); g.fill(); g.stroke(); }
  for (let i = 0; i < 4; i++) { const p = ((t * 0.55 + i * 0.25) % 1), bx = -54 + i * 36; g.strokeStyle = alpha('#f0f0f0', 0.42 * k * Math.sin(Math.PI * p)); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); for (let j = 0; j <= 10; j++) { const yy = py - 84 - p * 130 - j * 11, xx = bx + Math.sin(j * 0.8 + t * 2.4 + i) * 12; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  g.restore(); }
const GERMS = (() => { const r = rng(91), a = []; for (let i = 0; i < 7; i++) a.push([52.1 + i * 0.36 + r() * 0.1, -70 + r() * 140, 0.75 + r() * 0.25, 14 + r() * 8, r() * 6]); return a; })();   // [leaves the pan, x offset, life, size, seed]
function sBoil(g, t, A) { const VX = 800, VY = 990, boilK = sm(t, BL + 0.2, BL + 1.0), done = t > TM1;
  const c = camBegin(g, A.bg.barricade, punches(t, { z: lerp(1.3, 1.42, sm(t, BL, 55.95)), x: lerp(900, 960, sm(t, BL, 55.95)), y: 720 }, [[52.5, 1.55, { z: 2.3, x: STV[0] + 10, y: 780 }, 0.45]]));
  const crouchAt = (tt) => 30 + 4 * bump(tt, TM1, TM1 + 0.4), leanAt = (tt) => -9 + trackSpring(tt, [[0, 0], [52.3, -5], [TM1 + 0.05, 6]], { feel: 'heavy', windUp: 0.06 });
  drawVini(g, A.vini, withAlive({ x: VX, y: VY, s: 1.36, t, turn: 0.72, crouch: crouchAt(t), lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) + 3, expr: exprTrack(t, [[0, 'determined'], [52.5, 'worried'], [TM1 + 0.05, 'happy']]), look: [0.8, 0.5],
    arms: [armSpring(t, [[0, [10, 40, 50]], [TM1 + 0.05, 'up'], [TM1 + 0.9, [10, 40, 50]]], { feel: 'snappy' }), armSpring(t, [[0, [6, 34, 62]], [TM1 + 0.1, [26, -30, 20]], [TM1 + 0.9, [6, 34, 62]]], { delay: 0.05 })], breath: breathe(t, 1.6, 0.6) }, t, { energy: 0.6 }));
  stove(g, t, boilK);
  // germs float up out of the pan in bubbles… and pop
  for (const [t0, ox, life, sz, sd] of GERMS) { const dt = t - t0; if (dt < 0) continue; const p = dt / life, x = STV[0] + ox + Math.sin(dt * 5 + sd) * 12, y = STV[1] - 180 - 170 * ease.out(clamp(p));
    if (p < 1) { germ(g, x, y, sz, t, { seed: sd, grin: 0 }); g.strokeStyle = alpha('#ffffff', 0.8); g.fillStyle = alpha('#cfe8f6', 0.25); g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, sz * 1.7, 0, 7); g.fill(); g.stroke(); }
    else { const q = (dt - life) / 0.25; if (q < 1) { g.strokeStyle = alpha('#fff6d8', 1 - q); g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + sd; g.beginPath(); g.moveTo(x + Math.cos(a) * sz * (1.2 + 1.2 * q), y + Math.sin(a) * sz * (1.2 + 1.2 * q)); g.lineTo(x + Math.cos(a) * sz * (2 + 2.2 * q), y + Math.sin(a) * sz * (2 + 2.2 * q)); g.stroke(); } } } }
  camEnd(g);
  const [sx, sy] = toScreen(c, STV[0], STV[1] - 170); note(g, 'rolling boil', sx + 330, sy + 110, { size: 70, k: pop(t, 51.2) * (1 - sm(t, 52.3, 52.5)) }); arrowTo(g, sx + 220, sy + 100, sx + 120, sy + 30, so(t, 51.3, 51.6) * (1 - sm(t, 52.3, 52.5)), RED, -16);
  // the timer
  const tk = pop(t, TM0 - 0.2), left = Math.ceil(60 * (1 - clamp((t - TM0) / (TM1 - TM0)))), ding = settle(t, TM1, 0.25, 16, 6);
  if (tk > 0) { g.save(); g.translate(W - 290, 190); g.scale(tk * (1 + Math.max(0, ding)), tk * (1 + Math.max(0, ding))); g.rotate(0.03 + ding * 0.2);
    g.fillStyle = alpha('#14120e', 0.82); g.beginPath(); g.roundRect(-190, -92, 380, 184, 22); g.fill(); g.strokeStyle = done ? '#8fd06a' : '#ece6d6'; g.lineWidth = 7; g.stroke();
    g.font = '400 130px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = done ? '#8fd06a' : '#ece6d6'; g.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 0, 8); g.restore(); }
  if (done) { note(g, 'safe to drink', W - 290, 340, { size: 66, color: '#f4efe2', glow: false, k: pop(t, TM1 + 0.15) }); }
  note(g, 'germs: gone', W * 0.36, H * 0.17, { size: 70, k: pop(t, 54.0) * (1 - sm(t, 55.6, 55.9)) });
  day(g, t); vignette(g, 0.4); }

// =====================================================================================================
// 55.95 – 59.7  stomach bug vs bite
// =====================================================================================================
const VS0 = 55.95, MORE = 58.3;
function sVersus(g, t, A) { page(g, t, VS0, () => {
  writeOn(g, 'what gets you first?', W * 0.5, 170, wk(t, VS0 + 0.15, 'what gets you first?', 24), { size: 80, font: 'Permanent Marker' });
  // left: a magnifying glass on something very small
  const lx = 560, ly = 560, lk = pop(t, VS0 + 0.5, 0.3), grow = 1 + 0.18 * Math.max(0, pop(t, MORE + 0.1, 0.3)) + 0.05 * Math.sin(t * 9) * sm(t, MORE, MORE + 0.3);
  if (lk > 0) { g.save(); g.translate(lx, ly); g.scale(lk, lk); g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 30; g.beginPath(); g.moveTo(-140, 150); g.lineTo(-250, 270); g.stroke(); g.strokeStyle = '#8a5a34'; g.lineWidth = 20; g.stroke();
    g.fillStyle = '#dbe6d2'; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, 200, 0, 7); g.fill(); g.stroke(); g.strokeStyle = alpha('#ffffff', 0.7); g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 170, -2.4, -1.5); g.stroke(); g.restore();
    germ(g, lx, ly + 6, 96 * lk * grow, t, { grin: sm(t, MORE, MORE + 0.3) }); }
  writeOn(g, 'a stomach bug', lx, 850, wk(t, VS0 + 0.7, 'a stomach bug', 22), { size: 64, pen: false });
  note(g, '(actual size: •)', lx, 910, { size: 44, color: '#2a2622', glow: false, k: pop(t, VS0 + 1.4), rot: 0 });
  // right: the usual suspect
  const zk = sm(t, VS0 + 0.9, VS0 + 1.2); if (zk > 0) { g.save(); g.globalAlpha = zk; const off = sm(t, MORE + 0.35, MORE + 0.7);
    drawVini(g, A.zombie, { x: 1400, y: 860, s: 1.5, t: t + 4, skin: KINDS.worker, expr: off > 0.5 ? 'groan' : 'zombie', blink: false, turn: -0.42 * off, look: [-0.8 * off, 0.1], arms: [[36, 10 + Math.sin(t * 1.6) * 4, 70], [8, 30, 70]].map((a, i) => [lerp(a[0], 8, off), lerp(a[1], 86, off), lerp(a[2], 4, off)]),
      headTilt: Math.sin(t * 1.25) * 5 + 8 * off, lean: Math.sin(t * 1.1) * 2, march: t * 0.4, drag: 1, lift: 3, shadowA: 0.2 }); g.restore(); }
  writeOn(g, 'a bite', 1400, 925, wk(t, VS0 + 1.25, 'a bite', 20), { size: 64, pen: false });
  bigText(g, 'VS', 975, 560, { size: 170, color: RED, k: pop(t, VS0 + 1.05, 0.2), stroke: '#f4efe2' });
  note(g, 'more dangerous', 930, 318, { size: 86, k: pop(t, MORE) }); arrowTo(g, 800, 350, 690, 420, so(t, MORE + 0.1, MORE + 0.4), RED, -24);
  if (t > MORE + 0.6) note(g, '?!', 1560, 420, { size: 100, color: '#2a2622', k: pop(t, MORE + 0.65), rot: 0.1 });
}); }

// =====================================================================================================
// 59.7 – 63.0  tracker: WATER rain barrel · FOOD 2 weeks · BATTERIES 6
// =====================================================================================================
const TR = 59.7;
function sTrack(g, t, A) { const VX = 1140, VY = 872, s = RS(VY);
  camBegin(g, A.bg.rooftop, { z: lerp(1.14, 1.24, sm(t, TR, DUR)), x: lerp(1160, 1220, sm(t, TR, DUR)), y: 590 });
  splashes(g, t, 1.1, 300, 1500, 740, 1060, 36); rigWater(g, t, 1);
  const sip = (tt) => move(tt, 0, 1, 61.0, { feel: 'soft' });
  drawVini(g, A.vini, withAlive({ x: VX, y: VY, s, t, turn: 0.3, expr: exprTrack(t, [[0, 'happy'], [61.25, 'relief']]), look: [0.5, -0.1], headTilt: -4 * sip(t),
    arms: ['hips', armSpring(t, [[0, [-6, 44, 34]], [60.95, [-12, -14, 34]]], { feel: 'soft' })], breath: breathe(t, 1.8, 0.7), props: { right: (g2, h, info) => mug(g2, h[0] + 2, h[1] + 6, 1.35 * info.s / 1.7, t) } }, t, { energy: 0.8 }));
  drips(g, t, VX, VY, s, 0.8);
  camEnd(g); rain(g, t, 1.4);
  tracker(g, t, TR + 0.2, [0.86 * sm(t, TR + 0.4, TR + 1.5), 0.5, 0.42], { labels: ['RAIN BARREL', '2 WEEKS', '6'] });
  note(g, 'boiled first', W * 0.4, H * 0.2, { size: 62, k: pop(t, 61.3), rot: -0.03 });
  day(g, t); vignette(g, 0.38); fade(g, sm(t, DUR - 0.4, DUR)); }

// ---------- cut list ----------
export function draw(g, t, A) { g.save();
  if (t < 1.72) sFlat(g, t, A);
  else if (t < 4.82) sTap(g, t, A);
  else if (t < 7.1) sBath(g, t);
  else if (t < 11.1) sRule7(g, t, A);
  else if (t < 17.2) sRain(g, t, A);
  else if (t < 19.9) sDrag(g, t, A);
  else if (t < 23.6) sRig(g, t, A);
  else if (t < FALLCUT) sSlip(g, t, A);
  else if (t < STILL) sFall(g, t, A);
  else if (t < B0) sStill(g, t, A);
  else if (t < ST0) sPeek(g, t, A, false);
  else if (t < ST1) sStreet(g, t, A);
  else if (t < R8) sPeek(g, t, A, true);
  else if (t < GL - 0.2) sRule8(g, t);
  else if (t < GL + 0.2) pageTurn(g, (t - GL + 0.2) / 0.4, () => { g.save(); sRule8(g, Math.min(t, GL - 0.2), A); g.restore(); }, () => { g.save(); sGlass(g, Math.max(t, GL), A); g.restore(); });
  else if (t < BL) sGlass(g, t);
  else if (t < VS0) sBoil(g, t, A);
  else if (t < TR) sVersus(g, t, A);
  else sTrack(g, t, A);
  g.restore(); }
