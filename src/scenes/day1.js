// src/scenes/day1.js — DAY 1 wake-up test (episode time 28.6 → 60.2), ported shot-for-shot from the v1 opening.
// Same timing, framing and labels as v1. Changes kept from v2: a smoother get-up and handwriting write-on on the
// notebook page. Vini is the Rigby2D rig (src/vini/rig.js). Every function here is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, radGrad, sm, so, pop, settle, armTrack, pick, track, camBegin, camEnd, toScreen, camShake, note, arrowTo, bigText, fade, vignette, dayCounter, notebook, inkPath, tick, cross, writeOn } from '../kit/kit.js';
import { drawVini } from '../vini/rig.js';

export const T0 = 28.6, T1 = 60.2;
const DAY1 = 28.73, VS = 1.36;
export const SHOTS = [['d1', 28.6, 36.5], ['d2', 36.5, 41.8], ['d3', 41.8, 46.6], ['d4', 46.6, 52.6], ['d5', 52.6, 60.2]];
const day = (g, gt) => dayCounter(g, 1, gt, DAY1);

// ---------- props ----------
function phone(g, x, y, s, t, mode = 'off', rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const buzz = mode === 'buzz' ? Math.sin(t * 60) * 3 : 0; g.translate(buzz, 0);
  if (mode !== 'off') { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 0, 0, 0, 120, [alpha(mode === 'alert' ? '#ff4030' : '#ffd0a0', 0.5), alpha('#ff4030', 0)]); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = '#1d1f24'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(-26, -48, 52, 96, 9); g.fill(); g.stroke();
  g.fillStyle = mode === 'off' ? '#2a3038' : mode === 'alert' ? `rgba(${200 + 40 * Math.sin(t * 12)},40,40,1)` : '#f2e6d0'; g.beginPath(); g.roundRect(-21, -41, 42, 80, 5); g.fill();
  if (mode === 'alert') { g.fillStyle = '#fff'; g.font = '700 13px "Inter", sans-serif'; g.textAlign = 'center'; g.fillText('ALERT', 0, -10); g.beginPath(); g.moveTo(0, 4); g.lineTo(11, 24); g.lineTo(-11, 24); g.closePath(); g.fill(); g.fillStyle = '#c03030'; g.fillRect(-1.5, 10, 3, 8); }
  if (mode === 'buzz') { g.fillStyle = '#c8262e'; for (let i = 0; i < 4; i++) g.fillRect(-15, -30 + i * 16, 30, 9); }
  g.restore();
  if (mode === 'buzz') { g.strokeStyle = alpha(INK, 0.8); g.lineWidth = 3; for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (t * 4 + i * 0.5) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(x, y, (40 + i * 14 + ph * 10) * s, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); } g.globalAlpha = 1; }
}
const PHONE_HAND = [[28, 44], [10, 6]];
const inHand = (gt, mode) => (g2, h) => phone(g2, h[0] + 4, h[1] - 22, 0.42, gt, mode);

// ---------- d1: DAY 1 — asleep → phone buzzing → gets up → grabs it → EMERGENCY ALERT ----------
// Get-up (smoother than v1's 0.55 s spring): a small curl wind-up, then he swings round and rises over 0.85 s,
// knees bent as the feet take his weight, with a soft settle on landing.
const UP0 = 32.3, UP1 = 33.15;
function d1(g, gt, A) {
  const c = camBegin(g, A.bg.flat, { z: lerp(1.38, 1.18, sm(gt, 32.0, 34.5)), x: lerp(740, 800, sm(gt, 32, 34.5)), y: lerp(690, 700, sm(gt, 32, 34.5)) }, camShake(gt, 2, 32.35, 0.35));
  const u = clamp((gt - UP0) / (UP1 - UP0)), standing = u >= 1, holding = gt >= 33.45;
  if (!holding) phone(g, 905, 742, 0.55, gt, gt > 30.2 ? 'buzz' : 'off', -1.45);
  const curl = sm(gt, 32.05, UP0) * (1 - sm(gt, UP0, UP0 + 0.25));            // anticipation
  const rot = lerp(-Math.PI / 2, 0, ease.inOut(clamp(u * 1.15))) - curl * 0.1;
  const ox = lerp(880, 790, ease.inOut(u)), oy = lerp(662, 988, ease.inOut(u)) - Math.sin(Math.PI * u) * 26;
  const crouch = Math.sin(Math.PI * clamp(u * 1.1)) * 9 * (1 - sm(gt, UP1 - 0.15, UP1 + 0.25)) + curl * 4 + Math.max(0, settle(gt, UP1 + 0.05, 5, 12, 7));
  const reach = sm(gt, 33.1, 33.45) * (1 - sm(gt, 33.45, 33.8));
  const armR = holding ? armTrack(gt, [[33.4, [[24, 40], [36, 84]]], [33.45, PHONE_HAND]], 0.35) : armTrack(gt, [[0, 'down'], [32.6, 'out'], [33.05, [[24, 40], [36, 84]]]], 0.35);
  const armL = armTrack(gt, [[0, 'down'], [32.6, 'out'], [33.05, 'down'], [34.6, 'chest']], 0.35);
  g.save(); g.translate(ox, oy); g.rotate(rot);
  drawVini(g, A.vini, { x: 0, y: 0, s: VS, t: gt, shadow: standing, expr: pick(gt, [[0, 'sleep'], [30.7, 'shock'], [32.8, 'worried'], [34.6, 'scared']]), look: gt < 32.3 ? [0, -1] : holding ? [0.3, 0.6] : [0.6, 0.7],
    arms: [armL, armR], lean: reach * 0.12 * 57, crouch, shake: gt > 34.6 ? 0.7 : 0, props: { right: holding ? inHand(gt, gt > 34.55 ? 'alert' : 'buzz') : null } });
  g.restore();
  if (gt < 30.6) note(g, 'z z z', 470, 560 - Math.sin(gt * 2) * 8, { size: 44, color: '#3a3a3a', glow: false, k: 1 - sm(gt, 30.3, 30.6) });
  camEnd(g);
  const [px, py] = toScreen(c, 905, 742);
  const kc = pop(gt, 31.5) * (1 - sm(gt, 33.6, 33.9)); if (kc > 0) { note(g, '47 missed calls', px + 330, py - 160, { size: 62, k: kc }); arrowTo(g, px + 250, py - 120, px + 50, py - 30, so(gt, 31.55, 31.95) * kc); }
  if (gt > 34.6) note(g, 'EMERGENCY ALERT', W * 0.72, H * 0.24, { size: 70, k: pop(gt, 34.62) });
  day(g, gt); vignette(g, 0.32);
}

// ---------- d2: outside, someone is shouting… then they stop ----------
function d2(g, gt, A) { const t = gt - 36.5, dur = 5.3;
  camBegin(g, A.bg.flat, { z: lerp(1.15, 1.32, sm(t, 0, dur)), x: lerp(760, 600, sm(t, 0, 1.6)), y: 640 });
  const turnW = sm(gt, 36.7, 37.1), freeze = gt > 40.0, tt = freeze ? 40.0 + (gt - 40) * 0.25 : gt;
  drawVini(g, A.vini, { x: 790, y: 988, s: VS, t: tt, expr: pick(gt, [[0, 'scared'], [37.0, 'worried'], [40.0, 'scared']]), look: [lerp(0.3, -1, turnW), -0.2], headTilt: -turnW * 4,
    arms: [armTrack(gt, [[0, 'chest'], [37.0, 'down']]), PHONE_HAND], props: { right: inHand(gt, 'alert') }, shake: freeze ? 0.4 : 0 });
  camEnd(g);
  if (gt > 36.8 && gt < 39.9) note(g, '!?', 230 + Math.sin(gt * 30) * 3, 330, { size: 120, k: pop(gt, 36.85) * (1 - sm(gt, 39.6, 39.9)) });
  if (gt > 40.0) note(g, '…silence', 330, 330, { size: 66, color: '#2a2622', k: pop(gt, 40.05) });
  day(g, gt); vignette(g, 0.34 + 0.1 * sm(gt, 40, 41.5));
}

// ---------- d3 + d4: instinct — he heads for the door… FREEZE ----------
// Walk speed matches the footstep sounds in the mix (one step every 0.49 s), with feet planted on the floor.
const WALK0 = 41.95, WALK1 = 46.5, STEP = 0.49, SPEED = 54;           // v1 units per second
const walkD = (gt) => SPEED * smoothStartStop(gt);
function smoothStartStop(gt) { const T = WALK1 - WALK0, e = 0.25, x = clamp(gt - WALK0, 0, T); // ease in/out over 0.25 s, distance continuous
  if (x < e) return x * x / (2 * e); if (x > T - e) { const r = T - x; return (T - e) - r * r / (2 * e); } return x - e / 2; }
function doorScene(g, gt, A) {
  const d = walkD(gt), x = 790 + d * VS, c = camBegin(g, A.bg.flat, { z: 1.22, x: clamp(x + 220, 900, 1300), y: 640 });
  const walking = gt > WALK0 - 0.05;
  drawVini(g, A.vini, { x, y: 988, s: VS, t: gt, walkDist: walking ? d : null, stride: SPEED * STEP, lift: 14, expr: pick(gt, [[0, 'worried'], [42.6, 'determined']]), look: [1, 0], lean: walking && gt < WALK1 ? -3 : 0,
    arms: [gt > WALK0 ? 'relaxed' : 'down', armTrack(gt, [[0, PHONE_HAND], [42.0, 'relaxed'], [45.6, 'point']])], swing: gt > WALK0 && gt < 45.6 ? 0.25 : 0,
    props: { right: gt < 42.0 ? inHand(gt, 'alert') : null } });
  camEnd(g); return c; }
function d3(g, gt, A) { const c = doorScene(g, gt, A);
  const [dx, dy] = toScreen(c, 1790, 520), k = pop(gt, 43.7);
  if (k > 0) { note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64, k }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, so(gt, 43.75, 44.2)); }
  day(g, gt); vignette(g, 0.32); }
function d4(g, gt, A) { const t = gt - 46.6, FZ = 46.45; const c = doorScene(g, FZ, A);
  const [dx, dy] = toScreen(c, 1790, 520);
  note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64 }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, 1);
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${0.85 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); g.restore();
  g.fillStyle = `rgba(10,8,6,${0.25 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); fade(g, 0.6 * (1 - so(t, 0, 0.18)), '#ffffff');
  note(g, 'MOST PEOPLE', W * 0.3, H * 0.2, { size: 92, k: pop(gt, 47.3) });
  if (gt > 50.1) { cross(g, dx - 120, dy + 40, 190, so(gt, 50.15, 50.6)); note(g, 'don’t make it past DAY 1', W * 0.5, H * 0.86, { size: 84, k: pop(gt, 50.9) }); }
  day(g, gt); vignette(g, 0.45); }

// ---------- d5: RULE 1 — stay inside (handwritten on the notebook page) ----------
const wk = (gt, at, str, cps = 18) => clamp((gt - at) / Math.max(0.25, str.length / cps));
function doorDoodle(g, x, y, k, lockK) { inkPath(g, [[x - 70, y + 110], [x - 70, y - 110], [x + 70, y - 110], [x + 70, y + 110]], k, 7); inkPath(g, [[x + 40, y], [x + 50, y]], k, 9);
  if (lockK > 0) { const s = ease.outBack(clamp(lockK)); g.save(); g.translate(x + 5, y + 10); g.scale(s, s); g.fillStyle = '#d8a030'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(-34, -10, 68, 56, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -10, 22, Math.PI, 0); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(0, 16, 7, 0, 7); g.fill(); g.restore(); } }
function windowDoodle(g, x, y, k, curtainK) { inkPath(g, [[x - 90, y - 90], [x + 90, y - 90], [x + 90, y + 90], [x - 90, y + 90], [x - 90, y - 90]], k, 7); inkPath(g, [[x, y - 90], [x, y + 90]], k, 4); inkPath(g, [[x - 90, y], [x + 90, y]], k, 4);
  const c = ease.inOut(clamp(curtainK)); if (c > 0) for (const sd of [-1, 1]) { const w = 92 * c; g.fillStyle = '#b84a3a'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(x + sd * 96, y - 100); g.lineTo(x + sd * (96 - w), y - 100); for (let i = 0; i <= 6; i++) g.lineTo(x + sd * (96 - w + Math.sin(i * 1.4) * 6), y - 100 + i * 34); g.lineTo(x + sd * 96, y + 104); g.closePath(); g.fill(); g.stroke(); } }
function awayDoodle(g, A, x, y, k, gt, t0) { windowDoodle(g, x + 60, y - 10, k, 0); const p = sm(gt, t0 + 0.2, t0 + 0.9), px = x - 60 - 110 * p;
  if (k > 0.6) { g.save(); g.globalAlpha = clamp((k - 0.6) * 2.5); drawVini(g, A.vini, { x: px, y: y + 110, s: 0.55, t: gt, walkDist: -110 * p / 0.55, stride: 22, expr: 'worried', look: [-1, 0], arms: ['relaxed', 'relaxed'], shadow: false }); g.restore(); arrowTo(g, x - 10, y + 125, x - 190, y + 125, p, RED, 0); } }
function d5(g, gt, A) { const t = gt - 52.6; notebook(g, gt); fade(g, 1 - so(t, 0, 0.25));
  writeOn(g, 'RULE 1', 360, 165, wk(gt, 52.78, 'RULE 1', 9), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  writeOn(g, 'STAY INSIDE', W * 0.6, 168, wk(gt, 54.3, 'STAY INSIDE', 11), { size: 78, color: '#2a2622', font: 'Permanent Marker' });
  const cols = [[520, 'lock|the door', 55.8], [960, 'close|the curtains', 56.72], [1400, 'stay away|from windows', 58.24]];
  cols.forEach(([x, str, at], i) => { const k = sm(gt, at - 0.1, at + 0.55), y = 520;
    if (i === 0) doorDoodle(g, x, y, k, sm(gt, at + 0.35, at + 0.75)); if (i === 1) windowDoodle(g, x, y, k, sm(gt, at + 0.3, at + 0.9)); if (i === 2) awayDoodle(g, A, x, y, k, gt, at);
    const ls = str.split('|'); let t0 = at + 0.15; ls.forEach((l, j) => { writeOn(g, l, x, 800 + j * 52, wk(gt, t0, l, 22), { size: 54 }); t0 += l.length / 22 + 0.05; });
    tick(g, x + 125, 470, 34, sm(gt, at + 0.75, at + 1.05)); });
  vignette(g, 0.2); }

const FN = { d1, d2, d3, d4, d5 };
export function drawDay1(g, gt, A) {
  const s = SHOTS.find(([, a, b]) => gt >= a && gt < b) || SHOTS[SHOTS.length - 1];
  g.save(); FN[s[0]](g, gt, A); g.restore();
}
