// src/scenes/s07_day7.js — DAY 7 "The fortress" (scene time 0 → DUR). Narration: 05_day7a, then 06_day7b.
// Shots: w1 boarding the window (flat) → w2 last nails (barricade bg) → push (bookcase, sofa, fridge; proud; MISTAKE #2)
// → RULE 5 page → fridge dragged back (barricade bg) → route FLAT → STAIRS → ROOF (stairwell) → RULE 6 page (zombie vs stairs)
// → carrying a chair down → the freeze + two wet footsteps → cutaway: the thing two floors down → chair under the handle
// → eleven minutes → asleep against the barricade. Every function is a pure function of time (seconds).
import { W, H, RED, INK, clamp, lerp, ease, alpha, rng, radGrad, sm, so, pop, settle, track, pick, camBegin, camEnd, punches, pageTurn, toScreen, camShake, note, arrowTo, bigText, fade, vignette, nightGrade, dayCounter, notebook, inkPath, tick, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { KINDS } from '../zombie/zombie.js';
import { armSpring, overlap, withAlive, trackSpring, exprTrack } from '../kit/motion.js';
import { whipPan } from '../kit/transitions.js';
import { tin } from './props.js';

const A0 = 0.4, B0 = 48.5;                         // where the two narration clips start
export const DUR = 73.4;
export const VO = [['05_day7a', A0], ['06_day7b', B0]];
const VS = 1.36, STRIDE = 58;
const DAY7 = A0;
let HUD = true;
const day = (g, t) => { if (HUD) dayCounter(g, 7, t, DAY7); };
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
// distance walked over [a, b]: eases in and out over e seconds, constant pace between (as in market.js)
function seg(t, [a, b], D, e = 0.4) { const T = b - a, x = clamp(t - a, 0, T); const s = x < e ? x * x / (2 * e) : x > T - e ? (T - e) - (T - x) ** 2 / (2 * e) : x - e / 2; return D * s / (T - e); }
// stiff hair, swinging backpack (the approved market.js values)
const lags = (drive, t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });
const wk = (t, at, str, cps = 18) => clamp((t - at) / Math.max(0.25, str.length / cps));
const drawK = (t, at, dur = 0.5) => ease.out(clamp((t - at + 0.08) / dur));
const dim = (g, col = '#8f8a7c') => { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(-20, -20, W + 40, H + 40); g.restore(); };

// ================= props (flat fills, dark outline, a little highlight) =================
function plank(g, x, y, w, h, rot = 0, nails = true) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#6a4a31'; g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 3); g.fill(); g.stroke();
  g.strokeStyle = alpha('#2a1a10', 0.4); g.lineWidth = 2; for (const f of [-0.2, 0.22]) { g.beginPath(); g.moveTo(-w / 2 + 12, h * f); g.bezierCurveTo(-w / 6, h * f - 5, w / 6, h * f + 5, w / 2 - 12, h * f); g.stroke(); }
  g.strokeStyle = alpha('#ffffff', 0.2); g.beginPath(); g.moveTo(-w / 2 + 6, -h / 2 + 5); g.lineTo(w / 2 - 6, -h / 2 + 5); g.stroke();
  if (nails) { g.fillStyle = '#1c1a17'; for (const sx of [-1, 1]) for (const sy of [-0.24, 0.24]) { g.beginPath(); g.arc(sx * (w / 2 - 18), sy * h, 3.4, 0, 7); g.fill(); } } g.restore(); }
// hammer held at (hx, hy); the handle runs along `ang` from the hand, the head sits across its far end
function hammer(g, hx, hy, ang, s = 1) { g.save(); g.translate(hx, hy); g.rotate(ang); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.fillStyle = '#9a6a3c'; g.beginPath(); g.roundRect(-16, -5.5, 80, 11, 4); g.fill(); g.stroke();
  g.fillStyle = '#8f949a'; g.beginPath(); g.roundRect(56, -22, 20, 44, 3); g.fill(); g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(61, -16); g.lineTo(61, 16); g.stroke(); g.restore(); }
// wooden chair, front view; origin = floor between the legs. 230 tall at s = 1.
function chair(g, x, y, s = 1, rot = 0, sy = 1) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s * sy); g.lineWidth = 3.5 / s; g.strokeStyle = INK; g.lineJoin = 'round';
  const R = (x0, y0, w, h, f) => { g.fillStyle = f; g.beginPath(); g.roundRect(x0, y0, w, h, 3); g.fill(); g.stroke(); };
  R(-50, -230, 12, 230, '#5b3f2c'); R(38, -230, 12, 230, '#5b3f2c'); R(-44, -226, 88, 40, '#743c27'); R(-40, -170, 80, 16, '#743c27');
  R(-58, -100, 12, 100, '#6f4e36'); R(46, -100, 12, 100, '#6f4e36'); R(-62, -116, 124, 20, '#84492f');
  g.strokeStyle = alpha('#ffffff', 0.22); g.lineWidth = 2 / s; g.beginPath(); g.moveTo(-54, -110); g.lineTo(44, -110); g.moveTo(-38, -219); g.lineTo(34, -219); g.stroke(); g.restore(); }
// bookcase: origin = bottom centre
function bookcase(g, x, y, w = 190, h = 400, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.fillStyle = '#5a4130'; g.beginPath(); g.roundRect(-w / 2, -h, w, h, 3); g.fill(); g.stroke();
  const r = rng(7), n = 4, sh = (h - 30) / n, cols = ['#8a3b32', '#3f5a6b', '#b79a4a', '#4d6a4a', '#7a6a8a', '#c9c2ae', '#2f3540'];
  for (let i = 0; i < n; i++) { const y0 = -h + 12 + i * sh, hh = sh - 12; g.fillStyle = '#2f221a'; g.fillRect(-w / 2 + 12, y0, w - 24, hh); g.strokeRect(-w / 2 + 12, y0, w - 24, hh);
    let bx = -w / 2 + 16; g.lineWidth = 2.2; while (bx < w / 2 - 34) { const bw = 12 + r() * 12, bh = hh * (0.62 + r() * 0.3), gap = r() < 0.18;
      if (!gap) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(bx, y0 + hh - bh, bw, bh); g.strokeRect(bx, y0 + hh - bh, bw, bh); } bx += bw + (gap ? 6 : 1); } g.lineWidth = 3.5; }
  g.strokeStyle = alpha('#ffffff', 0.16); g.lineWidth = 2; g.beginPath(); g.moveTo(-w / 2 + 6, -h + 8); g.lineTo(-w / 2 + 6, -10); g.stroke(); g.restore(); }
// sofa (a small two-seater, the colours of the painted one): origin = bottom-left corner
function sofaP(g, x, y, w = 340, h = 200, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  const R = (x0, y0, ww, hh, f, rr = 10) => { g.fillStyle = f; g.beginPath(); g.roundRect(x0, y0, ww, hh, rr); g.fill(); g.stroke(); };
  g.fillStyle = '#1c1b1a'; g.fillRect(w * 0.08, -8, 18, 8); g.fillRect(w * 0.92 - 18, -8, 18, 8);
  R(w * 0.1, -h, w * 0.8, h * 0.62, '#45464a', 16); g.beginPath(); g.moveTo(w / 2, -h + 4); g.lineTo(w / 2, -h * 0.42); g.stroke();
  R(w * 0.06, -h * 0.34, w * 0.88, h * 0.3, '#3c3d41', 6);
  R(w * 0.13, -h * 0.5, w * 0.37, h * 0.2, '#4b4c50', 8); R(w * 0.5, -h * 0.5, w * 0.37, h * 0.2, '#4b4c50', 8);
  g.fillStyle = '#4f5a3a'; g.beginPath(); g.moveTo(w * 0.5, -h * 0.5); g.quadraticCurveTo(w * 0.62, -h * 0.72, w * 0.8, -h * 0.66); g.quadraticCurveTo(w * 0.9, -h * 0.62, w * 0.88, -h * 0.34); g.quadraticCurveTo(w * 0.7, -h * 0.26, w * 0.52, -h * 0.34); g.closePath(); g.fill(); g.stroke();
  R(0, -h * 0.64, w * 0.14, h * 0.6, '#4a4b4f', 12); R(w * 0.86, -h * 0.64, w * 0.14, h * 0.6, '#4a4b4f', 12);
  g.strokeStyle = alpha('#ffffff', 0.13); g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.16, -h + 9); g.lineTo(w * 0.84, -h + 9); g.stroke(); g.restore(); }
// fridge: origin = bottom centre
function fridge(g, x, y, s = 1, rot = 0) { const w = 140, h = 360; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 3.5 / s; g.lineJoin = 'round';
  g.fillStyle = '#d6d8d0'; g.beginPath(); g.roundRect(-w / 2, -h, w, h - 6, 8); g.fill(); g.stroke();
  g.fillStyle = alpha('#3a4048', 0.16); g.beginPath(); g.roundRect(w / 2 - 26, -h + 2, 24, h - 10, 6); g.fill();
  g.beginPath(); g.moveTo(-w / 2, -h * 0.66); g.lineTo(w / 2, -h * 0.66); g.stroke();
  g.fillStyle = '#8f949a'; for (const [y0, hh] of [[-h * 0.66 - 62, 48], [-h * 0.66 + 16, 78]]) { g.beginPath(); g.roundRect(-w / 2 + 14, y0, 9, hh, 4); g.fill(); g.stroke(); }
  g.fillStyle = '#f2e6b8'; g.save(); g.translate(20, -h * 0.42); g.rotate(0.07); g.fillRect(-17, -20, 34, 40); g.strokeRect(-17, -20, 34, 40); g.restore();
  g.fillStyle = RED; g.beginPath(); g.arc(21, -h * 0.42 - 17, 5, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#2a2b2e'; g.fillRect(-w / 2 + 10, -6, 22, 6); g.fillRect(w / 2 - 32, -6, 22, 6);
  g.strokeStyle = alpha('#ffffff', 0.7); g.lineWidth = 2.5 / s; g.beginPath(); g.moveTo(-w / 2 + 8, -h + 14); g.lineTo(-w / 2 + 8, -h * 0.7); g.stroke(); g.restore(); }
// a paper tag with a red marker number (stack labels 1, 2, 3)
function numTag(g, n, x, y, k, rot = -0.08) { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); g.fillStyle = '#efe8d6'; g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.roundRect(-24, -28, 48, 56, 4); g.fill(); g.stroke(); g.font = '400 44px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = RED; g.fillText(String(n), 0, 3); g.restore(); }
function sweat(g, hx, hy, t, s = 1, rate = 2.4, a = 1) { if (a <= 0) return; for (let i = 0; i < 3; i++) { const ph = (((t * rate + i / 3) % 1) + 1) % 1, sd = i === 1 ? -1 : 1;
    g.save(); g.globalAlpha *= a * (1 - ph) * Math.min(1, ph * 8); g.translate(hx + sd * (34 + ph * 18 + i * 5) * s, hy - (22 - i * 12) * s + ph * ph * 46 * s); g.scale(s, s);
    g.fillStyle = '#bfe3f2'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(7, 2, 0, 6); g.quadraticCurveTo(-7, 2, 0, -9); g.fill(); g.stroke(); g.restore(); } }
function dust(g, x, y, t, t0, dir = 1) { const k = clamp((t - t0) / 0.5); if (k <= 0 || k >= 1) return; g.save(); g.globalAlpha = 0.5 * (1 - k); g.fillStyle = '#d9cfb8';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x - dir * (10 + i * 16) * ease.out(k) - dir * i * 6, y - 6 - i * 5 * k, 7 + i * 3 + 10 * k, 0, 7); g.fill(); } g.restore(); }
function dashPath(g, pts, k, col = RED, w = 6) { if (k <= 0) return; const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), T = L.reduce((a, b) => a + b, 0); let u = clamp(k) * T; const out = [pts[0]];
  for (let i = 1; i < pts.length && u > 0; i++) { const f = clamp(u / L[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); u -= L[i - 1]; }
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([22, 16]); for (const [c, lw] of [[alpha('#f4efe2', 0.85), w + 5], [col, w]]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); out.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke(); }
  g.setLineDash([]); if (k >= 1) { const [a, b] = pts[pts.length - 1], [c, d] = pts[pts.length - 2], an = Math.atan2(b - d, a - c); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (const s of [-0.5, 0.5]) { g.moveTo(a, b); g.lineTo(a - Math.cos(an + s) * 26, b - Math.sin(an + s) * 26); } g.stroke(); } g.restore(); }

// ================= w1 / w2: boarding up the windows =================
const WHIP1 = 4.1, HITS1 = [2.2, 2.78, 3.36, 3.95], HITS2 = [4.78, 5.3, 5.82], HITS = [...HITS1, ...HITS2];
// 0 = hammer raised, 1 = struck; rests at 0.4. Slow lift, fast strike, bounce back.
function swing(t) { let v = 0.4; for (const h of HITS) { if (t >= h - 0.36 && t < h - 0.1) v = lerp(0.4, 0, sm(t, h - 0.36, h - 0.15)); else if (t >= h - 0.1 && t < h) v = ease.in((t - h + 0.1) / 0.1); else if (t >= h && t < h + 0.22) v = lerp(1, 0.4, so(t, h + 0.03, h + 0.22)); } return v; }
const hitK = (t) => HITS.reduce((s, h) => s + startle(t - h), 0);
const RAISE = [-4, -64, 26], STRIKE = [0, -6, 84];
function hammerVini(g, A, t, x, y, done) {
  const s = swing(t), hk = hitK(t), turnK = sm(t, done, done + 0.3);
  const hand = RAISE.map((v, i) => lerp(v, STRIKE[i], s)), rest = [8, 60, 16];
  const ham = hand.map((v, i) => lerp(v, rest[i], turnK)), hold = [lerp(6, 8, turnK), lerp(-30, 70, turnK) - 3 * hk, lerp(80, 8, turnK)];
  const leanAt = (tt) => 2 + 5 * swing(tt) - 3 * hitK(tt);
  const ang = lerp(lerp(-0.75, -1.85, s), 0.9, turnK) + 0.25 * hk;
  drawVini(g, A.vini, withAlive({ x, y, s: VS, t, turn: lerp(-0.74, -0.15, turnK), expr: exprTrack(t, [[0, 'neutral'], [1.75, 'determined'], [done, 'happy']]), look: [lerp(-0.7, 0, turnK), lerp(-0.2, 0, turnK)],
    lean: leanAt(t) * (1 - turnK), headTilt: overlap(leanAt, t, 0.09, 0.8) - 2 * hk, crouch: 1.5 * hk + 2 * s, squash: 0.6 * hk, breath: breathe(t, 1.6, 0.6), ...lags((tt) => x - swing(tt) * 26, t),
    arms: [hold, ham], props: { right: (g2, h) => hammer(g2, h[0], h[1] - 4, ang, 0.95) } }, t, { energy: 0.5 + 0.5 * turnK }));
}
function toks(g, t, hits, x, y) { hits.forEach((h, i) => { const k = pop(t, h - 0.02, 0.14) * (1 - sm(t, h + 0.28, h + 0.5)); if (k > 0) note(g, 'tok', x + (i % 2 ? 70 : -40), y - (i % 3) * 46, { size: 70, k, rot: i % 2 ? 0.1 : -0.12, color: '#2a2622' }); }); }
function w1(g, t, A) {
  const sh = HITS1.reduce((a, h) => { const s = camShake(t, 3.5, h, 0.22); return [a[0] + s[0], a[1] + s[1]]; }, [0, 0]);
  const c = camBegin(g, A.bg.flat, { z: lerp(1.5, 1.62, sm(t, 0, 4.2)), x: lerp(640, 600, sm(t, 0, 4.2)), y: lerp(620, 600, sm(t, 0, 4.2)) }, sh);
  const done = HITS1.filter((h) => t >= h).length, last = HITS1.filter((h) => t >= h).pop() ?? -9;
  plank(g, 236, 372, 560, 62, -0.035);
  plank(g, 244, 462 + settle(t, last, 2.5, 30, 9), 572, 64, 0.085 * (1 - done / 4) + settle(t, last, 0.012, 34, 9), false);
  chair(g, 600, 990, 1.0, settle(t, last, 0.012, 26, 8));
  hammerVini(g, A, t, 600, 876, 99);
  camEnd(g);
  const [nx, ny] = toScreen(c, 470, 400); toks(g, t, HITS1, nx, ny);
  note(g, 'FORTRESS: in progress', W * 0.72, H * 0.2, { size: 68, k: pop(t, A0 + 2.9) * (1 - sm(t, 3.85, 4.0)), rot: 0.03 });
  day(g, t); vignette(g, 0.32);
}
function w2(g, t, A) {
  const sh = HITS2.reduce((a, h) => { const s = camShake(t, 3.5, h, 0.22); return [a[0] + s[0], a[1] + s[1]]; }, [0, 0]);
  const c = camBegin(g, A.bg.barricade, { z: lerp(1.5, 1.6, sm(t, 4.0, 6.3)), x: lerp(640, 665, sm(t, 4.0, 6.3)), y: lerp(505, 490, sm(t, 4.0, 6.3)) }, sh);
  hammerVini(g, A, t, 585, 712, 5.95);
  g.save(); g.beginPath(); g.rect(440, 706, 330, 60); g.clip(); g.drawImage(A.bg.barricade, 0, 0, W, H); g.restore();     // his feet sink into the sofa cushion
  camEnd(g);
  const [nx, ny] = toScreen(c, 455, 250); toks(g, t, HITS2, nx, ny);
  note(g, 'windows: DONE', W * 0.76, H * 0.2, { size: 72, k: pop(t, 5.95), rot: 0.03 });
  day(g, t); vignette(g, 0.36); fade(g, 0.5 * (1 - so(t, WHIP1, WHIP1 + 0.3)), '#ffffff');
}

// ================= push: bookcase, sofa, fridge → proud → MISTAKE #2 =================
const VP = 1.25, FLP = 985, PU = 50, GAP = 126;      // Vini's scale, floor, push step (v1 units), hands-to-feet reach (px)
const SUBS = [{ t0: 6.25, hs: [6.5, 7.15, 7.8], d: 0.55, end: 1725 }, { t0: 8.8, hs: [8.9, 9.33], d: 0.42, end: 1385, low: 1 }, { t0: 9.95, hs: [10.03, 10.47], d: 0.42, end: 1330 }];
SUBS.forEach((s) => { s.slam = s.hs[s.hs.length - 1] + s.d; s.start = s.end - s.hs.length * PU * VP; });
const heaveN = (t, S) => S.hs.reduce((a, h) => a + sm(t, h, h + S.d), 0), heaveB = (t, S) => S.hs.reduce((a, h) => a + bump(t, h, h + S.d), 0);
const faceX = (t, S) => S.start + heaveN(t, S) * PU * VP;                                   // left face of the object being pushed
const BACK0 = 13.3, BACK1 = 13.95, BACKD = 58, REAL = 15.75, MIST = A0 + 15.75, OUT = A0 + 17.6;
const PUSH_A = [0, 10, 100], PUSH_B = [0, -22, 96];
function push(g, t, A) {
  const sub = t < SUBS[1].t0 ? 0 : t < SUBS[2].t0 ? 1 : 2, S = SUBS[sub], acting = sub === 2;
  const back = acting ? BACKD * sm(t, BACK0, BACK1) : 0, vx = faceX(t, S) - GAP - back * VP;
  const pushK = (tt) => 1 - sm(tt, S.slam + 0.04, S.slam + 0.4), low = S.low || 0;
  const leanAt = (tt) => pushK(tt) * (-19 - 13 * low - 8 * heaveB(tt, S)) + 9 * startle(tt - S.slam) * pushK(tt)
    + (acting ? trackSpring(tt, [[0, 0], [11.2, 4], [13.2, 0], [14.35, -6], [REAL, 7], [18.1, 2]], { feel: 'heavy', windUp: 0.05 }) : 0);
  const wide = sub === 0 ? { z: lerp(2.2, 2.28, sm(t, 6.25, 8.8)), x: 1700, y: lerp(790, 782, sm(t, 6.25, 8.8)) } : sub === 1 ? { z: lerp(2.08, 2.12, sm(t, 8.8, 9.95)), x: 1700, y: 800 }
    : { z: lerp(2.04, 1.98, sm(t, 9.95, 13.5)) + 0.14 * sm(t, 17.8, 20.4), x: 1700, y: lerp(792, 780, sm(t, 9.95, 13.5)) + 12 * sm(t, 17.8, 20.4) };
  const shake = camShake(t, 6, S.slam, 0.35), c = camBegin(g, A.bg.flat, punches(t, wide, acting ? [[REAL + 0.02, 1.25, { z: 3.0, x: vx + 70, y: 650 }, 0.5]] : []), shake);
  dim(g);
  // spare boards leaning in the corner (they also hide the end of the painted sofa: the sofa in this shot is the one he pushes)
  [[930, 430, 0.04], [968, 455, -0.03], [1010, 415, 0.06], [1052, 440, -0.05], [1082, 420, 0.03], [1112, 450, -0.02], [1140, 410, 0.05], [1100, 400, 0.11]].forEach(([px, ph, pr], i) => plank(g, px, 890 - ph / 2 + (i === 7 ? 8 : 0), ph, 38, Math.PI / 2 + pr, i % 2 === 0));
  // the stack: each thing rocks as it lands; the sofa rides up the bookcase
  const rock = (i) => settle(t, SUBS[i].slam, 0.022, 17, 6), fx = (i) => (i < sub ? SUBS[i].end : faceX(t, SUBS[i]));
  bookcase(g, fx(0) + 95, 960, 190, 400, rock(0) - (sub > 0 ? settle(t, SUBS[1].slam, 0.012, 17, 6) : 0));
  if (sub >= 1) { const tip = sm(t, SUBS[1].slam - 0.12, SUBS[1].slam + 0.06); sofaP(g, fx(1), 966, 340, 236, -0.085 * tip + rock(1) * 0.6); }
  if (sub >= 2) fridge(g, fx(2) + 70, 983, 1, rock(2));
  for (let i = 0; i <= sub; i++) dust(g, fx(i), 968, t, SUBS[i].slam, 1);
  numTag(g, 1, SUBS[0].end + 96, 668, pop(t, SUBS[0].slam + 0.08, 0.22), -0.07);
  numTag(g, 2, SUBS[1].end + 120, 836, pop(t, SUBS[1].slam + 0.08, 0.22), 0.06);
  numTag(g, 3, SUBS[2].end + 52, 700, pop(t, SUBS[2].slam + 0.08, 0.22), -0.05);
  // the buried door
  const gk = so(t, OUT + 0.25, OUT + 0.7); if (gk > 0) { g.save(); g.setLineDash([16, 12]); g.lineCap = 'round'; for (const [col, lw] of [[alpha('#f4efe2', 0.85), 10], [RED, 5.5]]) { g.strokeStyle = col; g.lineWidth = lw; g.globalAlpha = gk; g.beginPath(); g.moveTo(1782, 548); g.lineTo(1782, 866); g.lineTo(1912, 906); g.stroke(); } g.restore(); }
  // ---- Vini
  const pk = pushK(t), hb = heaveB(t, S), sl = startle(t - S.slam);
  const turn = acting ? track(t, [[10.97, 0.9], [11.4, 0.12], [13.08, 0.12], [13.45, 0.62], [18.95, 0.62], [19.55, 0.22]]) : 0.9;
  const expr = exprTrack(t, [[0, 'determined'], ...S.hs.flatMap((h) => [[h + 0.05, 'exhausted'], [h + S.d - 0.02, 'determined']]), ...(acting ? [[10.95, 'exhausted'], [11.3, 'happy'], [14.55, 'neutral'], [15.2, 'worried'], [REAL, 'shock'], [17.0, 'scared'], [19.0, 'worried']] : [])]);
  const look = !acting || t < 10.95 ? [0.6, 0.35] : t < 13.2 ? [lerp(0.6, 0.1, so(t, 10.97, 11.1)), -0.1] : t < 14.4 ? [lerp(0.1, 0.85, so(t, 13.2, 13.32)), 0] : t < 14.95 ? [0.8, lerp(0, -0.75, so(t, 14.4, 14.55))] : t < REAL ? [0.85, lerp(-0.75, 0.5, so(t, 14.95, 15.15))]
    : t < 19.0 ? [0.9, 0] : [lerp(0.9, 0, so(t, 19.0, 19.2)), 0.1];
  const hj = 3 * hb;
  const armL = acting ? armSpring(t, [[0, PUSH_A], [10.97, 'relaxed'], [11.3, 'hips'], [14.75, 'relaxed'], [REAL, 'face'], [17.2, 'chest'], [19.3, 'relaxed']], { feel: 'snappy', windUp: 0.05 }) : [[0, 5], [PUSH_A[0], PUSH_A[1] + hj + 44 * low, PUSH_A[2] + 6 * low]];
  const armR = acting ? armSpring(t, [[0, PUSH_B], [10.99, 'relaxed'], [11.34, 'hips'], [15.2, 'relaxed'], [REAL, 'face'], [17.0, 'relaxed'], [OUT + 0.5, 'point'], [19.5, 'relaxed']], { delay: 0.04 }) : [[0, -11], [PUSH_B[0], PUSH_B[1] - hj + 56 * low, PUSH_B[2] + 8 * low]];
  const stepping = acting && t > BACK0 - 0.02, real = startle(t - REAL);
  const headTilt = overlap(leanAt, t, 0.09, 0.8) + 6 * pk * (1 - 0.5 * hb) - 5 * bump(t, 11.3, 12.9) * (acting ? 1 : 0) + (acting ? -7 * bump(t, 14.4, 15.0) + 5 * bump(t, 15.0, REAL) - 6 * real + 5 * sm(t, 17.0, 17.6) * (1 - sm(t, 19.0, 19.5)) : 0);
  const strain = pk * (0.12 + 0.3 * hb);
  let headAt = null;
  drawVini(g, A.vini, withAlive({ x: vx, y: FLP, s: VP, t, turn, expr, look, lean: leanAt(t), headTilt, hipX: 10 * pk + 3 * real, crouch: pk * (9 + 9 * low + 4 * hb) + 5 * sl * pk + 4 * real + Math.max(0, settle(t, 11.3, 2.5, 10, 6)) * (acting ? 1 : 0),
    walkDist: stepping ? -back : heaveN(t, S) * PU, stride: stepping ? BACKD : PU, lift: stepping ? 10 : 8, smoothGait: true, walkSquash: 0.25, walkMix: stepping ? 1 - sm(t, BACK1 + 0.05, BACK1 + 0.45) : acting ? 1 - sm(t, 10.97, 11.4) : 1,
    breath: breathe(t, t > REAL && acting ? 0.8 : 1.1, 0.8), squash: 0.7 * sl + real, shake: strain + (acting && t > REAL ? 0.25 + 0.4 * real : 0), ...lags((tt) => faceX(tt, S) - leanAt(tt) * 4 - (acting ? BACKD * VP * sm(tt, BACK0, BACK1) : 0), t), arms: [armL, armR],
    props: { left: (g2, h, info) => { headAt = info.head; } } }, t, { energy: acting ? sm(t, 11.3, 12.0) * (t > REAL ? 0.5 : 1) : 0.2 }));
  if (headAt) sweat(g, headAt[0], headAt[1] - 20, t, 0.9, 2.6, pk * (0.35 + 0.65 * Math.min(1, hb)) + (acting ? 0.8 * sm(t, REAL + 0.3, REAL + 0.8) : 0));
  camEnd(g);
  // ---- labels
  SUBS.forEach((s, i) => { if (i === sub || (i < 2 && sub === 2 && false)) { const k = pop(t, s.slam, 0.16) * (1 - sm(t, s.slam + 0.3, s.slam + 0.55)); const [tx, ty] = toScreen(c, s.end, 930); if (k > 0) note(g, 'THUD', tx - 60, ty + 60, { size: 78, k, rot: -0.06, color: '#2a2622' }); } });
  if (acting) {
    const fk = pop(t, A0 + 11.0) * (1 - sm(t, OUT - 0.1, OUT + 0.2)); if (fk > 0) { note(g, 'FORTRESS', 1150, 150, { size: 100, k: fk, rot: -0.04 }); tick(g, 1440, 150, 52, so(t, A0 + 11.4, A0 + 11.75) * (fk >= 0.99 ? 1 : 0));
      if (t > MIST) { inkPath(g, [[930, 162], [1160, 150], [1480, 158]], so(t, MIST, MIST + 0.25), 9, RED); } }
    note(g, 'MISTAKE #2', 1340, 320, { size: 118, k: pop(t, MIST + 0.1) * (1 - sm(t, 19.9, 20.3)), rot: -0.07 });
    if (t > OUT) { const [dx, dy] = toScreen(c, 1790, 610), [hx, hy] = toScreen(c, vx + 40, 640); const ak = so(t, OUT + 0.6, OUT + 1.0);
      note(g, '…the only door', 1330, 150, { size: 96, k: pop(t, OUT + 0.75), rot: 0.03 }); arrowTo(g, 1560, 205, dx - 20, dy - 40, ak, RED, 40); }
  }
  day(g, t); vignette(g, 0.4 + (acting ? 0.1 * sm(t, REAL, REAL + 1) : 0));
}

// ================= notebook pages =================
function heading(g, t, n, title, tN, tT) {
  writeOn(g, `RULE ${n}`, 360, 165, wk(t, tN, `RULE ${n}`, 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [362, 216], [462, 220]], ease.out(clamp((t - tN - 0.5) / 0.3)), 7, RED);
  writeOn(g, title, W * 0.6, 168, wk(t, tT, title, 13), { size: 78, color: '#2a2622', font: 'Permanent Marker' }); }
function penStrokes(g, strokes, k, col = INK) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w, col);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]); }
function page(g, t, t0, body) { const land = so(t, t0 - 0.25, t0 + 0.25); g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03 * (1 - land) + settle(t, t0 + 0.25, 0.005, 11, 6)); g.translate(-W / 2 + 50 * (1 - land), -H / 2 + 22 * (1 - land)); notebook(g, t); body(); g.restore(); vignette(g, 0.2); }
// tiny floor plan: walls with a door gap on the right and a window on the top wall
function plan(g, x, y, k, s = 1) { const X = (a) => x + a * s, Y = (b) => y + b * s;
  penStrokes(g, [[[[X(150), Y(-20)], [X(150), Y(-110)], [X(-150), Y(-110)], [X(-150), Y(110)], [X(150), Y(110)], [X(150), Y(50)]], 7], [[[X(-90), Y(-98)], [X(10), Y(-98)]], 4], [[[X(150), Y(50)], [X(196), Y(16)]], 5]], k); }
function blobs(g, x, y, k, s = 1) { if (k <= 0) return; const B = [[92, -34, 46, 100], [44, -22, 40, 62], [10, -8, 28, 44]]; B.forEach(([bx, by, bw, bh], i) => { const kk = clamp(k * 3 - i); if (kk <= 0) return; g.save(); g.globalAlpha = kk; g.fillStyle = alpha('#6a5a3a', 0.35); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.rect(x + bx * s, y + by * s, bw * s, bh * s); g.fill(); g.stroke();
    g.font = `700 ${30 * s}px "Patrick Hand", sans-serif`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x + (bx + bw / 2) * s, y + (by + bh / 2) * s); g.restore(); }); }
const R5 = 20.4, R5a = A0 + 20.16, TRAP = A0 + 28.9, R5END = 30.35;
function r5(g, t, A) { page(g, t, R5, () => {
  heading(g, t, 5, 'NEVER BLOCK', R5a + 0.1, R5a + 1.2); writeOn(g, 'your only way out', W * 0.6, 252, wk(t, R5a + 2.3, 'your only way out', 16), { size: 62, color: RED, pen: false });
  const y = 570, p1 = [520, R5a + 1.5], p2 = [985, R5a + 2.7], p3 = [1470, A0 + 24.2], q = 1.2;
  plan(g, p1[0], y, drawK(t, p1[1], 0.5), q); blobs(g, p1[0], y, clamp((t - p1[1] - 0.4) / 0.5), q); cross(g, p1[0] + 196, y + 20, 80, so(t, p1[1] + 0.95, p1[1] + 1.25));
  writeOn(g, 'door blocked', p1[0], 800, wk(t, p1[1] + 0.5, 'door blocked', 24), { size: 62, pen: false });
  plan(g, p2[0], y, drawK(t, p2[1], 0.45), q); const rk = so(t, p2[1] + 0.4, p2[1] + 0.9); if (rk > 0) dashPath(g, [[p2[0] - 90, y + 50], [p2[0] + 80, y + 44], [p2[0] + 180, y + 18], [p2[0] + 250, y + 18]], rk, '#2a8a3a', 7);
  tick(g, p2[0] + 30, y - 20, 60, so(t, p2[1] + 0.95, p2[1] + 1.2)); writeOn(g, 'a way out', p2[0], 800, wk(t, p2[1] + 0.4, 'a way out', 24), { size: 62, pen: false });
  // "if they break in through a window…"
  plan(g, p3[0], y, drawK(t, p3[1], 0.5), q); blobs(g, p3[0], y, clamp((t - p3[1] - 0.4) / 0.4), q);
  const ak = so(t, A0 + 25.2, A0 + 25.7); if (ak > 0) { arrowTo(g, p3[0] - 50, y - 235, p3[0] - 50, y - 50, ak, RED, 30);
    const zk = pop(t, A0 + 25.15, 0.25); g.save(); g.translate(p3[0] - 44, y - 268); g.scale(zk, zk); g.fillStyle = '#7f9a78'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.stroke();
    g.lineWidth = 4; for (const ex of [-13, 13]) { g.beginPath(); g.moveTo(ex - 6, -12); g.lineTo(ex + 6, 0); g.moveTo(ex + 6, -12); g.lineTo(ex - 6, 0); g.stroke(); } g.beginPath(); g.moveTo(-12, 16); g.lineTo(12, 13); g.stroke(); g.restore(); }
  const vk = pop(t, A0 + 26.2, 0.25); if (vk > 0) { g.save(); g.translate(p3[0] - 60, y + 55); g.scale(vk, vk); g.fillStyle = '#d7c8bd'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; for (const ex of [-8, 8]) { g.beginPath(); g.arc(ex, -3, 3.4, 0, 7); g.fill(); } g.lineWidth = 3.5; g.beginPath(); g.arc(0, 12, 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.restore();
    writeOn(g, 'Vini', p3[0] - 60, y + 103, wk(t, A0 + 26.3, 'Vini', 20), { size: 38, pen: false }); }
  const fs = 'fortress', fx = p3[0], fy = 800; writeOn(g, fs, fx, fy, wk(t, A0 + 27.0, fs, 20), { size: 70, pen: false }); inkPath(g, [[fx - 110, fy + 6], [fx, fy - 4], [fx + 112, fy + 4]], so(t, A0 + 27.75, A0 + 28.0), 8, RED);
  const tk = clamp((t - TRAP) / 0.16); if (tk > 0) { const sc = lerp(2.4, 1, ease.out(tk)); g.save(); g.translate(p3[0] - 30, y + 10); g.rotate(-0.16 + settle(t, TRAP + 0.16, 0.03, 30, 9)); g.scale(sc, sc); g.globalAlpha = clamp(tk * 2);
    g.strokeStyle = RED; g.lineWidth = 12; g.beginPath(); g.roundRect(-250, -100, 500, 200, 14); g.stroke(); g.font = '400 170px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = RED; g.fillText('TRAP', 0, 12); g.restore(); }
}); }

// ================= back: the afternoon spent dragging the fridge away again =================
const PULLS = { hs: [30.5, 31.05, 31.6, 32.15], d: 0.48 }, PEND = 32.63;
function backShot(g, t, A) {
  const n = heaveN(t, PULLS), hb = heaveB(t, PULLS), pull = n * 40, fxl = 1530 - pull * VS, vx = fxl - 84, done = sm(t, PEND, PEND + 0.3);
  const c = camBegin(g, A.bg.barricade, { z: lerp(1.62, 1.52, sm(t, R5END, 33)), x: lerp(1420, 1300, sm(t, R5END, 33)), y: 740 }, camShake(t, 2.5, PEND, 0.3));
  for (let i = 0; i < 2; i++) { g.strokeStyle = alpha('#2a2018', 0.3); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(fxl + 18 + i * 110, 1004 + i * 2); g.lineTo(1548 + i * 110, 1004 + i * 2); g.stroke(); }
  fridge(g, fxl + 76, 1004, 1.08, -0.035 * (1 - done) * (0.5 + 0.5 * Math.min(1, hb)) + settle(t, PEND, 0.02, 15, 6));
  numTag(g, 3, fxl + 58, 700, 1, -0.05);
  const leanAt = (tt) => (1 - sm(tt, PEND, PEND + 0.3)) * (11 + 8 * heaveB(tt, PULLS)) + trackSpring(tt, [[0, 0], [PEND + 0.02, -15]], { feel: 'heavy' });
  let headAt = null;
  drawVini(g, A.vini, withAlive({ x: vx, y: 1000, s: VS, t, turn: 0.88, expr: 'exhausted', look: [0.5, 0.4], lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) - 5 + 12 * done, hipX: 5 * (1 - done), crouch: 8 + 5 * hb + 5 * done,
    walkDist: -pull, stride: 40, lift: 7, smoothGait: true, walkSquash: 0.25, breath: breathe(t, 0.7, 1), shake: 0.15 + 0.3 * hb, ...lags((tt) => -heaveN(tt, PULLS) * 40 * VS - leanAt(tt) * 4, t),
    arms: [armSpring(t, [[0, [0, 6 + 3 * hb, 60]], [PEND + 0.05, [4, 30, 58]]], { feel: 'soft' }), armSpring(t, [[0, [0, -20, 58]], [PEND + 0.1, [4, 4, 56]]], { feel: 'soft' })], props: { left: (g2, h, info) => { headAt = info.head; } } }, t, { energy: 0.3 }));
  if (headAt) sweat(g, headAt[0], headAt[1] - 20, t, 1, 3, 1);
  camEnd(g);
  const clk = [[29.9, '1 pm'], [31.05, '2 pm'], [31.6, '3 pm'], [32.15, '4 pm'], [PEND, '5 pm']], cur = clk.filter(([a]) => t >= a).pop();
  note(g, cur[1], W * 0.3, H * 0.22, { size: 110, k: 0.6 + 0.4 * pop(t, cur[0], 0.18), rot: 0.03 }); note(g, '(moving it back)', W * 0.3, H * 0.33, { size: 56, k: pop(t, A0 + 31.2), color: '#2a2622' });
  day(g, t); vignette(g, 0.38);
}

// ================= route: FLAT → STAIRS → ROOF =================
const ROUTE = [[1640, 950], [1150, 1000], [640, 1008], [430, 985], [285, 660], [232, 330], [215, 80]];
function routeShot(g, t, A) {
  const d = seg(t, [33.05, 34.25], 103, 0.3), x = 1500 - d * VS, wkK = clamp((seg(t + 0.05, [33.05, 34.25], 103, 0.3) - seg(t - 0.05, [33.05, 34.25], 103, 0.3)) / 9.6);
  const c = camBegin(g, A.bg.stairwell, { z: lerp(1.22, 1.1, sm(t, 33, 37.2)), x: lerp(1080, 940, sm(t, 33, 37.2)), y: lerp(600, 545, sm(t, 34.5, 37.2)) });
  const rk = t < A0 + 35.0 ? 0.62 * sm(t, A0 + 33.0, A0 + 34.6) : 0.62 + 0.38 * sm(t, A0 + 35.5, A0 + 36.5); dashPath(g, ROUTE, rk, RED, 7);
  const UP = A0 + 35.6, leanAt = (tt) => -3 * wkK + trackSpring(tt, [[0, 0], [A0 + 33.9, 3], [UP, -3]], { feel: 'heavy' });
  drawVini(g, A.vini, withAlive({ x, y: 990, s: VS, t, turn: track(t, [[34.2, -0.72], [34.6, -0.5]]), expr: exprTrack(t, [[0, 'exhausted'], [34.3, 'determined'], [UP + 0.9, 'happy']]), look: t < UP ? [-0.7, 0] : [-0.5, lerp(0, -0.9, so(t, UP, UP + 0.15))],
    lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) + 7 * sm(t, UP, UP + 0.4), walkDist: -d, stride: 51.5, lift: 12, smoothGait: true, walkSquash: 0.25, walkMix: 1 - sm(t, 34.3, 34.7), breath: breathe(t, 1.3, 0.7), ...lags((tt) => -seg(tt, [33.05, 34.25], 103, 0.3) * VS, t),
    arms: [armSpring(t, [[0, 'relaxed'], [A0 + 33.95, 'point'], [UP, 'reach'], [A0 + 36.75, 'hips']], { feel: 'snappy' }), armSpring(t, [[0, 'relaxed'], [A0 + 36.8, 'hips']], { delay: 0.05 })] }, t, { energy: 1 - 0.6 * wkK }));
  camEnd(g);
  const L = (str, wx, wy, at, o = {}) => { const [sx, sy] = toScreen(c, wx, wy); note(g, str, clamp(sx, 190, W - 190), clamp(sy, 95, H - 95), { size: 92, k: pop(t, at), ...o }); };
  L('FLAT', 1560, 60, A0 + 32.75, { rot: 0.03 }); L('STAIRS', 700, 330, A0 + 34.55, { rot: -0.04 }); L('ROOF', 520, 90, A0 + 36.45, { rot: -0.03 });
  const [tx0, ty0] = toScreen(c, 520, 90), tx = clamp(tx0, 190, W - 190) + 170, ty = clamp(ty0, 95, H - 95) - 4; tick(g, tx, ty, 38, so(t, A0 + 36.75, A0 + 37.0));
  day(g, t); vignette(g, 0.36);
}

// ================= zombie acting for the stairs gags (the zombie rig, driven directly) =================
// att = [[t0, dur], ...] attempts at the first step: the foot lifts and reaches (slow), slips off (fast), then it wobbles.
const attP = (t, t0, d) => (t < t0 ? 0 : t < t0 + d * 0.6 ? 0.78 * ease.out((t - t0) / (d * 0.6)) : t < t0 + d * 0.74 ? 0.78 : 0.78 * (1 - ease.in(clamp((t - t0 - d * 0.74) / (d * 0.12)))));
function stairZombie(g, A, t, o) { const { x, y, s, face = -1, att = [], b = 1, leave = 1e9, kind = 'office', rate = 1 } = o;
  let p = 0, wob = 0; for (const [t0, d] of att) { p = Math.max(p, attP(t, t0, d)); wob += settle(t, t0 + d * 0.86, 1, 12, 4.5); }
  const gone = Math.max(0, t - leave), turn = face * track(gone, [[0, 0.95], [0.55, -0.95]]), walk = Math.max(0, gone - 0.5) * 30, tt = t * rate, sway = Math.sin(tt * 1.6) * 4;
  const opts = { x: x + face * (p * 9 * s - wob * 5 * s) - face * walk * s, y, s, t: tt + 3, skin: KINDS[kind], expr: p > 0.3 || wob > 0.2 ? 'groan' : 'zombie', blink: false, turn, look: [face * 0.6, 0.5],
    arms: gone > 0 ? [[8, 40 + sway, 40], [8, 46 - sway, 36]] : [[8, 6 + sway - 26 * wob, 76], [8, 12 - sway - 14 * wob, 70]], headTilt: Math.sin(tt * 1.25) * 6 + face * (10 * p - 9 * wob), lean: face * (7 + 5 * p - 13 * wob),
    hipX: -face * 4 * wob, walkDist: gone > 0.5 ? -face * walk : face * p * 60, stride: gone > 0.5 ? 22 : 60, lift: gone > 0.5 ? 7 : 62, drag: gone > 0.5 ? 1 : 0, shadow: o.shadow ?? true, shadowA: 0.3 };
  if (b < 0.999) { g.save(); g.filter = `brightness(${b.toFixed(3)})`; drawVini(g, A.zombie, opts); g.restore(); } else drawVini(g, A.zombie, opts);
  return { p, wob }; }

// ================= RULE 6 page =================
const R6 = 37.2, R6a = A0 + 36.96, FIFTH = A0 + 40.08, STAIRS6 = A0 + 42.2, ATT6 = [[STAIRS6 + 0.45, 0.85], [STAIRS6 + 1.5, 0.8]];
function r6(g, t, A) { page(g, t, R6, () => {
  heading(g, t, 6, 'HEIGHT IS SAFETY', R6a + 0.1, R6a + 1.35);
  // the block of flats, five floors, in ink
  const bx = 340, bw = 450, by = 292, fh = 118, bk = drawK(t, R6a + 1.6, 0.9), strokes = [[[[bx, by + 5 * fh], [bx, by], [bx + bw, by], [bx + bw, by + 5 * fh]], 7]];
  for (let i = 1; i < 5; i++) strokes.push([[[bx, by + i * fh], [bx + bw, by + i * fh]], 5]); strokes.push([[[bx - 90, by + 5 * fh], [bx + bw + 90, by + 5 * fh]], 7]);
  penStrokes(g, strokes, bk);
  for (let i = 0; i < 5; i++) { const k = clamp((t - R6a - 2.3 - i * 0.12) / 0.2); if (k > 0) { g.save(); g.globalAlpha = k; g.font = '700 46px "Patrick Hand", sans-serif'; g.fillStyle = i === 0 ? RED : alpha(INK, 0.6); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(String(5 - i), bx - 22, by + i * fh + fh / 2); g.restore(); } }
  const vk = sm(t, FIFTH + 0.5, FIFTH + 0.9); if (vk > 0) { g.save(); g.globalAlpha = vk; drawVini(g, A.vini, { x: bx + 150, y: by + fh - 5, s: 0.33, t, expr: 'happy', turn: 0.15, arms: ['down', armSpring(t, [[0, 'down'], [FIFTH + 1.0, 'wave']], { feel: 'snappy' })], shadow: false, breath: breathe(t, 2.6, 0.8), headTilt: 4 * Math.sin(t * 9) * sm(t, FIFTH + 1.1, FIFTH + 1.4) }); g.restore();
    note(g, 'Vini', bx + 285, by + 44, { size: 54, k: pop(t, FIFTH + 0.95), rot: 0.04 }); arrowTo(g, bx + 245, by + 52, bx + 190, by + 66, so(t, FIFTH + 1.0, FIFTH + 1.3), RED, 8); }
  const zk = sm(t, FIFTH + 1.5, FIFTH + 1.9); if (zk > 0) { g.save(); g.globalAlpha = zk; for (const [zx, sd, fc] of [[bx - 50, 1.1, 1], [bx + bw + 55, 2.7, -1]]) stairZombie(g, A, t + sd, { x: zx, y: by + 5 * fh - 3, s: 0.31, face: fc, shadow: false, kind: sd > 2 ? 'worker' : 'teen' }); g.restore(); }
  // "…terrible at stairs": one of them against four steps
  const sx = 1250, sy = 850, run = 104, rise = 54, sk = drawK(t, STAIRS6, 0.6), st = [[sx - 330, sy]]; for (let i = 0; i < 4; i++) { st.push([sx + i * run, sy - i * rise], [sx + i * run, sy - (i + 1) * rise]); } st.push([sx + 4 * run + 40, sy - 4 * rise]);
  penStrokes(g, [[st, 8]], sk);
  if (t > STAIRS6 + 0.15) { g.save(); g.globalAlpha = sm(t, STAIRS6 + 0.15, STAIRS6 + 0.5); const z = stairZombie(g, A, t, { x: sx - 104, y: sy - 4, s: 1.12, face: 1, att: ATT6, shadow: false });
    g.restore(); ATT6.forEach(([t0, d], i) => { const tb = t0 + d * 0.76, k = pop(t, tb, 0.14) * (1 - sm(t, tb + 0.35, tb + 0.6)); if (k > 0) note(g, i ? 'bonk' : 'donk', sx + 90, sy - 150 - i * 30, { size: 62, k, rot: 0.1, color: '#2a2622' }); }); }
  note(g, 'steps climbed: 0', 1400, 340, { size: 78, k: pop(t, STAIRS6 + 1.35), rot: -0.04 });
  writeOn(g, 'terrible at stairs', 1180, 925, wk(t, STAIRS6 + 0.7, 'terrible at stairs', 22), { size: 60, pen: false });
}); }

// ================= carry / freeze: a chair over his head, then the footsteps =================
const FZ = B0 + 1.45, SQ1 = B0 + 3.55, SQ2 = B0 + 5.6;
const carryD = (t) => seg(t, [44.9, 48.9], 6 * STRIDE);
const freezeD = (t) => (t < FZ ? 142 - 80 * (FZ - t) : 142 + 3 * so(t, FZ, FZ + 0.1));
const HANDS_UP = [14, -90, 10];
// Vini with the chair held over his head. o: x, y, s, d (distance walked, v1 units), frozen (seconds since the freeze; < 0 = walking)
function chairVini(g, A, t, o) { const { x, y, s, d, fr = -1 } = o, f = fr >= 0, fl = startle(fr), sq1 = startle(t - SQ1), sq2 = startle(t - SQ2), fear = f ? sm(t, SQ1, SQ1 + 0.4) * 0.5 + sm(t, SQ2, SQ2 + 0.3) * 0.5 : 0;
  const hands = []; const grab = (g2, h) => { hands.push(h); if (hands.length === 2) { const mx = (hands[0][0] + hands[1][0]) / 2, my = Math.max(hands[0][1], hands[1][1]);
      chair(g2, mx, my + 14 * s / VS, 0.82 * s / VS, (f ? 0.05 * Math.sin(t * 31) * (0.25 + fear) : 0.035 * Math.sin(d / STRIDE * Math.PI)) - 0.05); } };
  const leanAt = (tt) => (f ? 4 * startle(tt - FZ) + 3 * sm(tt, SQ1, SQ1 + 0.5) : -3.5);
  const look = !f ? [-0.5, 0.1] : t < FZ + 0.9 ? [lerp(-0.5, -0.95, so(fr, 0.04, 0.14)), 0.1] : t < SQ1 ? [lerp(-0.95, 0.85, so(t, FZ + 0.9, FZ + 1.02)), 0] : t < SQ2 ? [lerp(0.85, -0.9, so(t, SQ1 + 0.03, SQ1 + 0.13)), 0.55] : [-0.95, 0.75];
  const drop = f ? 10 * sm(t, SQ1 + 0.1, SQ1 + 0.9) + 12 * sm(t, SQ2 + 0.1, SQ2 + 0.7) : 0, hu = [HANDS_UP[0], HANDS_UP[1] + drop - 5 * fl, HANDS_UP[2]];
  drawVini(g, A.vini, withAlive({ x, y, s, t: f ? FZ + fr * 0.15 : t, turn: -0.72, expr: f ? exprTrack(t, [[0, 'determined'], [FZ, 'shock'], [FZ + 0.95, 'scared'], [SQ2, 'terror']]) : exprTrack(t, [[0, 'determined'], [46.2, 'exhausted'], [48.3, 'determined']]), look,
    lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) + (f ? -4 * fl - 5 * sq1 - 7 * sq2 + 4 * fear : -1.2 * Math.sin(2 * Math.PI * d / STRIDE)), crouch: f ? 3 * fl + 3 * sq1 + 5 * sq2 + 3 * fear : 0, hipX: f ? -3 * fl : 0,
    walkDist: -d, stride: STRIDE, lift: 13, smoothGait: true, walkSquash: 0.25, breath: f ? 0.9 : breathe(t, 1.2, 0.6), squash: f ? fl + 0.6 * sq1 + sq2 : 0, shake: f ? 0.1 + 0.35 * fear + 0.4 * sq2 : 0,
    ...(f ? { hairLag: -2.5 * fl, packLag: -8 * fl } : lags((tt) => -(o.dAt ? o.dAt(tt) : d) * s, t)), arms: [hu, [hu[0], hu[1] + 3, hu[2]]], props: { left: grab, right: grab } }, t, { energy: f ? 0.12 : 0.3 })); }
function carry(g, t, A) {
  const d = carryD(t), x = 1500 - d * VS;
  const c = camBegin(g, A.bg.stairwell, { z: lerp(1.3, 1.36, sm(t, 44.85, 48.3)), x: lerp(1230, 1040, sm(t, 44.85, 48.3)), y: lerp(600, 630, sm(t, 44.85, 48.3)) });
  chairVini(g, A, t, { x, y: 990, s: VS, d, dAt: carryD });
  camEnd(g);
  const [sx, sy] = toScreen(c, 640, 760); const k = pop(t, A0 + 45.7); if (k > 0) { note(g, 'ground floor', sx + 20, sy - 250, { size: 76, k, rot: -0.04 }); arrowTo(g, sx - 30, sy - 200, sx - 110, sy - 20, so(t, A0 + 45.8, A0 + 46.2), RED, -24); }
  note(g, 'chair 6 of 7', W * 0.76, H * 0.16, { size: 60, k: pop(t, A0 + 46.9), color: '#2a2622', rot: 0.03 });
  day(g, t); vignette(g, 0.38);
}
function freezeShot(g, t, A) {
  const d = freezeD(t), x = 1560 - d * VS, k = sm(t, FZ + 0.3, 55.1);
  const sh1 = camShake(t, 4, SQ1, 0.4), sh2 = camShake(t, 8, SQ2, 0.5);
  const c = camBegin(g, A.bg.stairwell, punches(t, { z: lerp(1.3, 1.62, k), x: lerp(1190, 1060, k), y: lerp(610, 660, k) }, [[FZ + 0.03, 0.5, { z: 2.3, x: x - 20, y: 560 }, 0.5]]), [sh1[0] + sh2[0], sh1[1] + sh2[1]]);
  dim(g, '#9aa0a8');
  chairVini(g, A, t, { x, y: 990, s: VS, d, fr: t - FZ, dAt: freezeD });
  camEnd(g);
  note(g, 'floor 3', W * 0.8, H * 0.14, { size: 70, k: pop(t, 48.55) * (1 - sm(t, FZ - 0.2, FZ)), color: '#d8d2c0', glow: false });
  const [ax, ay] = toScreen(c, 600, 820), [bx, by] = toScreen(c, 800, 800);
  const k1 = pop(t, SQ1, 0.2), k2 = pop(t, SQ2, 0.2); if (k1 > 0) note(g, 'squelch', ax + Math.sin(t * 9) * 3, ay, { size: 78, k: k1 * (1 - 0.45 * sm(t, SQ1 + 1.2, SQ1 + 1.8)) * (1 - sm(t, SQ2 - 0.2, SQ2)), rot: -0.1, color: '#7d2a22' });
  if (k2 > 0) bigText(g, 'SQUELCH', bx + Math.sin(t * 34) * 5 * (1 - sm(t, SQ2, SQ2 + 0.6)), by - 30, { size: 150, k: k2, color: '#b5332a', rot: -0.06 });
  if (t > FZ + 0.25 && t < SQ1) { const [hx, hy] = toScreen(c, x - 40, 300); note(g, '…', hx - 150, hy + 140, { size: 110, k: pop(t, FZ + 0.3) * (1 - sm(t, SQ1 - 0.3, SQ1)), color: '#d8d2c0', glow: false }); }
  day(g, t); vignette(g, 0.4 + 0.14 * sm(t, FZ, SQ2)); fade(g, 1 - sm(t, 48.3, 48.5));
}

// ================= cutaway of the stairwell: floor 3 (Vini), floor 2, floor 1 (the thing) =================
const FY = [330, 660, 990], LX = 930, HX = 590;
function flight(g, x0, y0, dir, col) { const n = 6, run = (LX - HX) / n * dir, rise = 165 / n; g.beginPath(); g.moveTo(x0, y0); let x = x0, y = y0; for (let i = 0; i < n; i++) { y += rise; g.lineTo(x, y); x += run; g.lineTo(x, y); }
  g.lineTo(x, y + 26); g.lineTo(x0, y0 + 54); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke(); }
function shaft(g, t) {
  g.fillStyle = '#0c0d0c'; g.fillRect(-200, -400, W + 400, H + 900); g.fillStyle = '#42463d'; g.fillRect(420, -340, 1080, 1420);
  for (let n = -1; n < 3; n++) { const y = n < 0 ? 0 : FY[n];
    g.fillStyle = '#34402f'; g.fillRect(420, y - 118, 1080, 118); g.strokeStyle = alpha(INK, 0.5); g.lineWidth = 2.5; g.beginPath(); g.moveTo(420, y - 118); g.lineTo(1500, y - 118); g.stroke();
    if (n >= 0) { g.font = '400 120px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = alpha('#d9d2bd', 0.22); g.fillText(String(3 - n), 1130, y - 200); }
    g.fillStyle = '#23272a'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.rect(1330, y - 212, 112, 212); g.fill(); g.stroke(); g.fillStyle = '#8f949a'; g.fillRect(1344, y - 112, 22, 6); g.fillStyle = alpha('#9aa7a0', 0.35); g.fillRect(1368, y - 190, 50, 44);   // a flat door
    g.fillStyle = '#74838a'; g.beginPath(); g.rect(462, y + 165 - 178, 84, 96); g.fill(); g.stroke(); g.beginPath(); g.moveTo(504, y - 13); g.lineTo(504, y + 83); g.stroke();                                                        // half-landing window
    flight(g, HX, y + 165, 1, '#57544b'); flight(g, LX, y, -1, '#6b685e');
    g.fillStyle = '#5f5c53'; g.strokeStyle = INK; g.beginPath(); g.rect(LX, y, 1500 - LX, 24); g.fill(); g.stroke(); g.beginPath(); g.rect(420, y + 165, HX - 420, 24); g.fill(); g.stroke();
    g.strokeStyle = '#27332a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(LX, y - 78); g.lineTo(HX, y + 165 - 78); g.moveTo(LX, y - 78); g.lineTo(LX, y); g.moveTo(HX, y + 87); g.lineTo(HX, y + 165); g.stroke();
    const on = n === 0 ? 1 : n === 1 ? 0.55 : n === 2 ? 0.16 + 0.1 * (Math.sin(t * 23) > 0.6 ? 1 : 0) : 0.8;                                                                                                             // the lamp gets worse on the way down
    g.fillStyle = '#d9d2bd'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(1180, y - 300, 30, 10, 0, 0, 7); g.fill(); g.stroke();
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 1180, y - 290, 0, 380, [alpha('#ffe6b0', 0.3 * on), alpha('#ffe6b0', 0)]); g.fillRect(420, y - 330, 1080, 354); g.restore(); }
  g.fillStyle = '#17181a'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.rect(380, -340, 40, 1420); g.fill(); g.stroke(); g.beginPath(); g.rect(1500, -340, 40, 1420); g.fill(); g.stroke();
  const gr = g.createLinearGradient(0, 300, 0, 1080); gr.addColorStop(0, 'rgba(8,10,14,0)'); gr.addColorStop(1, 'rgba(8,10,14,0.62)'); g.fillStyle = gr; g.fillRect(380, 0, 1160, 1080);
}
function shaftCam(g, v, shake = [0, 0]) { const z = Math.max(1, v.z), hw = W / 2 / z, hh = H / 2 / z, cx = clamp(v.x, hw, W - hw), cy = clamp(v.y, hh, H - hh); g.save(); g.translate(W / 2 + shake[0], H / 2 + shake[1]); g.scale(z, z); g.translate(-cx, -cy); return { z, cx, cy }; }
const CS = 0.52, ZX = 1012;
const ATT_A = [[B0 + 8.5, 0.95], [B0 + 9.7, 0.9], [B0 + 10.9, 0.9]];
function cut1(g, t, A) {
  const v = t < 57.0 ? { z: lerp(1.95, 1.0, sm(t, 55.75, 56.95)), x: lerp(1180, 960, sm(t, 55.75, 56.95)), y: lerp(240, 540, sm(t, 55.75, 56.95)) } : { z: lerp(1.0, 1.9, sm(t, 57.75, 58.85)) + 0.1 * sm(t, 58.85, 60.4), x: lerp(960, 985, sm(t, 57.75, 58.85)), y: lerp(540, 850, sm(t, 57.75, 58.85)) };
  const sh = ATT_A.reduce((a, [t0, d]) => { const s = camShake(t, 2.5, t0 + d * 0.86, 0.25); return [a[0] + s[0], a[1] + s[1]]; }, [0, 0]);
  const c = shaftCam(g, v, sh); shaft(g, t);
  chairVini(g, A, 54.9 + (t - 55.1) * 0.2, { x: 1190, y: FY[0], s: CS, d: 145, fr: 54.9 - FZ });
  stairZombie(g, A, t, { x: ZX, y: FY[2], s: CS, face: -1, att: ATT_A, b: 0.5 });
  // "two floors down"
  const bk = so(t, B0 + 8.05, B0 + 8.5); if (bk > 0) { g.strokeStyle = RED; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(1600, 340); g.lineTo(1600, lerp(340, 980, bk)); g.stroke(); for (const yy of [340, 660, 980]) if (lerp(340, 980, bk) >= yy) { g.beginPath(); g.moveTo(1580, yy); g.lineTo(1620, yy); g.stroke(); } }
  g.restore();
  note(g, 'already inside', W * 0.24, H * 0.2, { size: 84, k: pop(t, B0 + 7.3) * (1 - sm(t, 57.8, 58.1)), rot: -0.05 });
  const [lx, ly] = toScreen(c, 1640, 660); { const k2 = pop(t, B0 + 8.3) * (1 - sm(t, 58.0, 58.4)), nx = Math.min(lx + 150, W - 150); note(g, '2 floors', nx, ly - 34, { size: 68, k: k2, rot: 0.03 }); note(g, 'down', nx, ly + 34, { size: 68, k: k2, rot: 0.03 }); }
  const [zx, zy] = toScreen(c, ZX, FY[2] - 170); note(g, '?', zx + 40, zy - 40 + Math.sin(t * 3) * 6, { size: 130, k: pop(t, B0 + 9.9), rot: 0.12 });
  note(g, 'stairs: how?', W * 0.74, H * 0.34, { size: 76, k: pop(t, B0 + 10.5), rot: 0.04 });
  ATT_A.forEach(([t0, d]) => { const tb = t0 + d * 0.86, k = pop(t, tb, 0.14) * (1 - sm(t, tb + 0.35, tb + 0.6)); const [qx, qy] = toScreen(c, ZX - 40, FY[2] + 20); if (k > 0) note(g, 'squelch', qx - 150, qy - 20, { size: 60, k, rot: -0.08, color: '#b5332a' }); });
  day(g, t); vignette(g, 0.5);
}
const C2 = 64.3, GIVEUP = B0 + 18.35, ATT_B = Array.from({ length: 6 }, (_, i) => [C2 + 0.1 + i * 0.48, 0.44]);
function cut2(g, t, A) {
  const k = sm(t, 66.6, 67.9), v = { z: lerp(1.85, 1.0, k) - 0 * k, x: lerp(985, 960, k), y: lerp(850, 540, k) };
  const c = shaftCam(g, v); shaft(g, t);
  chair(g, 1386, FY[0] - 2, 0.4, 0, 0.95);
  drawVini(g, A.vini, withAlive({ x: 1300, y: FY[0], s: CS, t, turn: 0.72, expr: 'scared', look: [-0.9, 0.7], arms: [[0, -20, 40], [0, 6, 44]], lean: -4, crouch: 4, shake: 0.3, breath: 0.9 }, t, { energy: 0.2 }));
  stairZombie(g, A, t, { x: ZX, y: FY[2], s: CS, face: -1, att: ATT_B, b: 0.5, leave: GIVEUP, rate: 1.6 });
  g.restore();
  const n = Math.min(11, 1 + Math.floor(10 * clamp((t - C2 - 0.15) / (GIVEUP - 0.25 - C2)))), tn = C2 + 0.15 + (n - 1) * (GIVEUP - 0.25 - C2) / 10;
  bigText(g, `${n} min`, W * 0.76, H * 0.2, { size: 150, k: 0.86 + 0.14 * pop(t, tn, 0.14), color: n === 11 ? '#ff4a3a' : '#ece6d6' });
  note(g, 'still the first step', W * 0.25, H * 0.3, { size: 66, k: pop(t, C2 + 0.9) * (1 - sm(t, GIVEUP - 0.1, GIVEUP + 0.2)), rot: -0.04 });
  note(g, 'it gives up', W * 0.25, H * 0.3, { size: 80, k: pop(t, GIVEUP + 0.3), rot: -0.04 });
  day(g, t); vignette(g, 0.5); fade(g, sm(t, 67.85, 68.05));
}

// ================= wedge: the last chair under the handle, no breathing =================
const WEDGE = B0 + 13.25, HOLD = B0 + 14.3;
function wedge(g, t, A) {
  const cl = startle(t - WEDGE), up = so(t, 60.6, WEDGE - 0.08) * 0.8 + 0.2 * ease.in(clamp((t - WEDGE + 0.08) / 0.08)), cy = lerp(808, 770, up) + 2 * cl;
  const c = camBegin(g, A.bg.stairwell, { z: lerp(3.2, 3.5, sm(t, 60.4, 64.3)), x: lerp(1640, 1600, sm(t, 60.4, 64.3)), y: lerp(585, 570, sm(t, 60.4, 64.3)), blur: 1.6 }, camShake(t, 1.5, WEDGE, 0.2));
  chair(g, 1561, cy, 1.15, 0.02 * (1 - up), 0.9);
  const hold = sm(t, HOLD, HOLD + 0.5), red = sm(t, HOLD + 0.2, 64.3);
  const hy = (cy - 770) / VS; let headAt = null, sc = 1;
  drawVini(g, A.vini, withAlive({ x: 1448, y: 985, s: VS, t, turn: 0.74, expr: exprTrack(t, [[0, 'scared'], [WEDGE, 'shock'], [WEDGE + 0.45, 'scared'], [HOLD, 'worried']]), look: t < WEDGE + 0.5 ? [0.8, -0.3] : [lerp(0.8, -0.9, so(t, WEDGE + 0.5, WEDGE + 0.62)), 0.2],
    lean: -5 + 3 * cl, headTilt: -3 - 4 * cl + 3 * hold, crouch: 2 * cl, breath: hold ? 1 : breathe(t, 0.8, 0.8) * (1 - hold), shake: 0.12 + 0.35 * red, mouthScale: 1, arms: [[0, -58 + hy, 56], [0, -24 + hy, 60]],
    props: { left: (g2, h, info) => { headAt = info.head; sc = info.s; } } }, t, { energy: 0.25 }));
  if (headAt && hold > 0) { const [hx, hy2] = headAt;                                                    // held breath: cheeks out, face going red
    g.save(); g.globalAlpha = hold; for (const [dx, r] of [[-8, 15], [46, 13]]) { g.fillStyle = '#d7c8bd'; g.strokeStyle = '#16131a'; g.lineWidth = 2.6; g.beginPath(); g.arc(hx + dx * sc / VS, hy2 + 30 * sc / VS, (r + 2 * Math.sin(t * 7)) * sc / VS, 0, 7); g.fill(); g.beginPath(); g.arc(hx + dx * sc / VS, hy2 + 30 * sc / VS, (r + 2 * Math.sin(t * 7)) * sc / VS, 0.1, Math.PI - 0.1); g.stroke(); }
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 * red; g.fillStyle = radGrad(g, hx + 14, hy2 + 8, 0, 62, ['#e0605a', alpha('#e0605a', 0)]); g.beginPath(); g.arc(hx + 14, hy2 + 8, 62, 0, 7); g.fill(); g.restore(); }
  if (headAt) sweat(g, headAt[0] + 10, headAt[1] - 26, t, 0.7, 2.2, 0.5 + 0.5 * red);
  camEnd(g);
  const [kx, ky] = toScreen(c, 1600, 500); note(g, 'click', kx + 170, ky - 90, { size: 56, k: pop(t, WEDGE, 0.14) * (1 - sm(t, WEDGE + 0.5, WEDGE + 0.8)), color: '#d8d2c0', glow: false, rot: 0.06 });
  if (t > HOLD) { const s = Math.floor(8 + (t - HOLD) * 9); note(g, `breath held: 0:${String(s).padStart(2, '0')}`, W * 0.7, H * 0.86, { size: 70, k: pop(t, HOLD + 0.05), rot: -0.02 }); }
  day(g, t); vignette(g, 0.5);
}

// ================= sleep: against the barricade, hugging a tin. Badly. =================
const SLEEP = 68.05, CREAK = B0 + 22.75;
function sleepShot(g, t, A) {
  const k = sm(t, SLEEP, DUR), wake = t >= CREAK + 0.12;
  const c = camBegin(g, A.bg.barricade, punches(t, { z: lerp(1.5, 1.8, k), x: lerp(1260, 1320, k), y: lerp(760, 790, k) }, [[CREAK + 0.14, 9, { z: 2.7, x: 1335, y: 800 }]]));
  const br = breathe(t, 3.4, 1), jolt = startle(t - CREAK - 0.12);
  const opts = (open) => withAlive({ x: 1330, y: 1012, s: VS, t, turn: 0.1, expr: 'sleep', blink: false, look: [0.95, 0], crouch: 86 - 1.5 * br - 3 * jolt, lean: 9 - 1.5 * jolt, headTilt: 13 + 1.5 * br - 8 * jolt, breath: br,
    arms: [[-20, 44, 24], [-22, 36, 26]], shadowA: 0.25, props: { right: (g2, h, info) => tin(g2, h[0] - 6, h[1] + 2, 1.15 * info.s / VS, -0.25) } }, t, { energy: 0 });
  let headAt = null; const cl = opts(false); cl.props = { ...cl.props, left: (g2, h, info) => { headAt = info.head; } };
  drawVini(g, A.vini, cl);
  // "Badly.": one eye snaps open at the creak (the open-eyed face, drawn only through a hole over his screen-right eye and brow)
  if (wake && headAt) { const ok = clamp((t - CREAK - 0.12) / 0.07), ex = headAt[0] + 21.5, ey = headAt[1] - 13.2, pk = 1 + 0.35 * startle(t - CREAK - 0.12);
    g.save(); g.translate(ex, ey); g.rotate(-0.33); g.fillStyle = '#d7c8bd'; g.beginPath(); g.ellipse(0, 0, 13.5, 6.4, 0, 0, 7); g.fill();
    g.fillStyle = '#16131a'; g.beginPath(); g.ellipse(1.5, 0.5, 4.9 * pk, 6.4 * pk * ok, 0.33, 0, 7); g.fill(); g.restore(); }
  camEnd(g);
  nightGrade(g, 1, [[...toScreen(c, 620, 300), 760, '#9fb4e8', 0.26], [...toScreen(c, 1340, 800), 430 * c.z / 1.5, '#9fb4e8', 0.2]]);
  if (t < CREAK) { const [zx, zy] = toScreen(c, 1420, 640); for (let i = 0; i < 3; i++) { const ph = ((t * 0.45 + i / 3) % 1); note(g, 'z', zx + 30 + ph * 70 + Math.sin(ph * 9) * 8, zy - ph * 130, { size: 40 + ph * 40, k: Math.min(1, ph * 5) * (1 - ph) * sm(t, SLEEP + 0.6, SLEEP + 1.2) * (1 - sm(t, CREAK - 0.15, CREAK)), color: '#d8e0ff', glow: false, rot: 0.1 }); } }
  note(g, 'creak', W * 0.79, H * 0.3 + Math.sin(t * 30) * 3 * (1 - sm(t, CREAK, CREAK + 0.5)), { size: 84, k: pop(t, CREAK, 0.16), color: '#d8e0ff', glow: false, rot: 0.08 });
  note(g, 'DAY 7: survived', W * 0.3, H * 0.2, { size: 72, k: pop(t, B0 + 20.6) * (1 - sm(t, CREAK - 0.2, CREAK)), color: '#d8e0ff', glow: false, rot: -0.03 });
  day(g, t); vignette(g, 0.55); fade(g, 1 - sm(t, SLEEP, SLEEP + 0.3)); fade(g, sm(t, DUR - 0.45, DUR - 0.05));
}

// ================= shots, transitions, sound notes =================
const SHOTS = [['w1', 0, WHIP1, w1], ['w2', WHIP1, 6.25, w2], ['push', 6.25, R5, push], ['r5', R5, R5END, r5], ['back', R5END, 33.0, backShot], ['route', 33.0, R6, routeShot], ['r6', R6, 44.85, r6], ['carry', 44.85, 48.3, carry],
  ['freeze', 48.3, 55.1, freezeShot], ['cut1', 55.1, 60.4, cut1], ['wedge', 60.4, C2, wedge], ['cut2', C2, SLEEP, cut2], ['sleep', SLEEP, DUR + 1, sleepShot]];
const drawShot = (g, t, A) => { const s = SHOTS.find(([, a, b]) => t >= a && t < b) || SHOTS[SHOTS.length - 1]; g.save(); s[3](g, t, A); g.restore(); };
const hudOff = (fn) => (g, t) => { HUD = false; fn(g, t); HUD = true; };
export function draw(g, t, A) {
  const at = (g2, tt) => drawShot(g2, tt, A);
  if (Math.abs(t - WHIP1) < 0.12) return whipPan(g, t, WHIP1, 0.12, hudOff(at), (g2, tt) => day(g2, tt));
  if (Math.abs(t - 33.0) < 0.14) return whipPan(g, t, 33.0, 0.14, hudOff(at), (g2, tt) => day(g2, tt));
  for (const [f0, f1, cutT] of [[R5 - 0.2, R5 + 0.25, R5], [R6 - 0.2, R6 + 0.25, R6]]) if (t > f0 && t < f1)
    return pageTurn(g, (t - f0) / (f1 - f0), () => { g.save(); drawShot(g, Math.min(t, cutT - 0.01), A); g.restore(); }, () => { g.save(); drawShot(g, Math.max(t, cutT), A); g.restore(); });
  drawShot(g, t, A);
  if (t > 48.1 && t < 48.3) fade(g, sm(t, 48.1, 48.3));
}
export const SFX = [
  ...HITS.map((h) => ['hammer_tok', h]), ['whoosh', WHIP1], ['furniture_scrape', 6.5], ['furniture_scrape', 7.15], ['furniture_scrape', 7.8], ['thud_heavy', SUBS[0].slam],
  ['furniture_scrape', 8.9], ['furniture_scrape', 9.33], ['thud_soft', SUBS[1].slam], ['furniture_scrape', 10.03], ['furniture_scrape', 10.47], ['thud_heavy', SUBS[2].slam],
  ['sting_realise', REAL], ['marker_scribble', MIST], ['page_flip', R5 - 0.1], ['pen_scratch', R5a + 0.2], ['stamp_slam', TRAP],
  ...PULLS.hs.map((h) => ['furniture_scrape', h]), ['thud_soft', PEND], ['whoosh', 33.0], ['page_flip', R6 - 0.1], ['pen_scratch', R6a + 0.2], ['zombie_groan', STAIRS6 + 0.5], ...ATT6.map(([t0, d]) => ['bonk', t0 + d * 0.76]),
  ['footsteps_stairwell', 44.95], ['footsteps_stairwell', 48.45], ['silence_drop', FZ], ['squelch_step', SQ1], ['squelch_step_close', SQ2], ['low_drone', 55.1], ...ATT_A.map(([t0, d]) => ['squelch_step', t0 + d * 0.86]),
  ['chair_wedge_click', WEDGE], ['heartbeat', HOLD], ['clock_ticks_fast', C2 + 0.15], ['zombie_groan', GIVEUP], ['shuffle_away', GIVEUP + 0.5], ['night_ambience', SLEEP], ['floorboard_creak', CREAK],
];
