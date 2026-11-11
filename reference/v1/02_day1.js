// DAY 1 (28.6–105.4): wakes to the alert → shouting → instinct to go out (freeze) → Rule 1 → streets → Rule 2 water → taps → numbers → tracker → midnight → hundreds.
import { E, registerShot, clamp, lerp, ease, alpha, rng, radGrad, linGrad } from '/engine/core.js';
import { W, H, RED, INK, VV, vini, zombie, strideSpeed, camBegin, camEnd, toScreen, camShake, note, arrowTo, bigText, fade, vignette, nightGrade, sm, so, pop, settle, armTrack, arms2, track, pick, dayCounter, tracker, notebook, inkPath, tick, cross } from '/tl/vini/kit.js';
import { drawInkFront } from '/engine/ink2d.js';
import { BG, sY, carFront, hordeAt } from './01_hook.js';
const DAY1 = 28.73;
const day = (g, gt) => dayCounter(g, 1, gt, DAY1);

// ---------- props ----------
function phone(g, x, y, s, t, mode = 'off', rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const buzz = mode === 'buzz' ? Math.sin(t * 60) * 3 : 0; g.translate(buzz, 0);
  if (mode !== 'off') { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 0, 0, 0, 120, [alpha(mode === 'alert' ? '#ff4030' : '#ffd0a0', 0.5), alpha('#ff4030', 0)]); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = '#1d1f24'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(-26, -48, 52, 96, 9); g.fill(); g.stroke();
  g.fillStyle = mode === 'off' ? '#2a3038' : mode === 'alert' ? `rgba(${200 + 40 * Math.sin(t * 12)},40,40,1)` : '#f2e6d0'; g.beginPath(); g.roundRect(-21, -41, 42, 80, 5); g.fill();
  if (mode === 'alert') { g.fillStyle = '#fff'; g.font = '700 13px "Inter", sans-serif'; g.textAlign = 'center'; g.fillText('ALERT', 0, -10); g.beginPath(); g.moveTo(0, 4); g.lineTo(11, 24); g.lineTo(-11, 24); g.closePath(); g.fill(); g.fillStyle = '#c03030'; g.fillRect(-1.5, 10, 3, 8); }
  if (mode === 'buzz') { g.fillStyle = '#c8262e'; for (let i = 0; i < 4; i++) g.fillRect(-15, -30 + i * 16, 30, 9); }
  g.restore();
  if (mode === 'buzz') { g.strokeStyle = alpha(INK, 0.8); g.lineWidth = 3; for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (t * 4 + i * 0.5) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(x, y, (40 + i * 14 + ph * 10) * s, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); } g.globalAlpha = 1; } }

// ---------- d1: DAY 1 — asleep → phone screaming → springs up → ALERT ----------
registerShot('d1', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const c = camBegin(g, BG.flat, { z: lerp(1.38, 1.18, sm(gt, 32.0, 34.5)), x: lerp(740, 800, sm(gt, 32, 34.5)), y: lerp(690, 700, sm(gt, 32, 34.5)) }, camShake(gt, 3, 32.3, 0.4));
  const up = clamp((gt - 32.3) / 0.55), standing = up >= 1, land = settle(gt, 32.85, 18, 16, 7);
  const holding = gt >= 33.45;
  // phone on the coffee table until he grabs it
  if (!holding) phone(g, 905, 742, 0.55, gt, gt > 30.2 ? 'buzz' : 'off', -1.45);
  // Vini: lying on the sofa (feet at x≈880) → springs up to stand in front of the table
  const ox = lerp(880, 790, ease.inOut(up)), oy = lerp(662, 988, ease.in(up) * 0.5 + up * 0.5) - Math.sin(Math.PI * up) * 60 + (standing ? Math.max(0, land) : 0), rot = lerp(-Math.PI / 2, 0, ease.inOut(up));
  const reach = sm(gt, 33.05, 33.45) * (1 - sm(gt, 33.45, 33.8));
  const armR = holding ? armLerp2(gt) : armTrack(gt, [[0, 'down'], [33.0, [[24, 40], [36, 84]]]]);
  g.save(); g.translate(ox, oy); g.rotate(rot);
  vini(g, { x: 0, y: 0, s: 1.36, t: gt, shadow: standing, expr: pick(gt, [[0, 'sleep'], [30.7, 'shock'], [32.8, 'worried'], [34.6, 'scared']]), look: gt < 32.3 ? [0, -1] : holding ? [0.3, 0.6] : [0.6, 0.7],
    arms: [armTrack(gt, [[0, 'down'], [32.8, 'down'], [34.6, 'chest']]), armR], turn: standing ? 0.35 : 0.2, lean: reach * 0.12, shake: gt > 34.6 ? 0.7 : 0,
    props: { right: holding ? (g2, h) => phone(g2, h[0] + 6, h[1] - 18, 0.42, gt, gt > 34.55 ? 'alert' : 'buzz') : null } });
  g.restore();
  if (gt < 30.6) note(g, 'z z z', 470, 560 - Math.sin(gt * 2) * 8, { size: 44, color: '#3a3a3a', glow: false });
  camEnd(g);
  const [px, py] = toScreen(c, 905, 742);
  const kc = pop(gt, 31.5) * (1 - sm(gt, 33.6, 33.9)); if (kc > 0) { note(g, '47 missed calls', px + 330, py - 160, { size: 62, k: kc }); arrowTo(g, px + 250, py - 120, px + 50, py - 30, so(gt, 31.55, 31.95) * kc); }
  if (gt > 34.6) note(g, 'EMERGENCY ALERT', W * 0.72, H * 0.24, { size: 70, k: pop(gt, 34.62) });
  day(g, gt); vignette(g, 0.32); } });
function armLerp2(gt) { return armTrack(gt, [[33.4, [[24, 40], [36, 84]]], [33.45, [[28, 44], [10, 6]]]], 0.35); }

// ---------- d2: outside, someone is shouting… then they stop ----------
registerShot('d2', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  camBegin(g, BG.flat, { z: lerp(1.15, 1.32, sm(t, 0, info.dur)), x: lerp(760, 600, sm(t, 0, 1.6)), y: 640 });
  const turnW = sm(gt, 36.7, 37.1), freeze = gt > 40.0;
  vini(g, { x: 790, y: 988, s: 1.36, t: freeze ? 40.0 + (gt - 40) * 0.25 : gt, expr: pick(gt, [[0, 'scared'], [37.0, 'worried'], [40.0, 'scared']]), look: [lerp(0.3, -1, turnW), -0.2], turn: lerp(0.35, -0.85, turnW),
    arms: [armTrack(gt, [[0, 'chest'], [37.0, 'down']]), [[28, 44], [10, 6]]], props: { right: (g2, h) => phone(g2, h[0] + 6, h[1] - 18, 0.42, gt, 'alert') }, shake: freeze ? 0.4 : 0 });
  camEnd(g);
  const shout = gt > 36.8 && gt < 39.9; if (shout) { const k = pop(gt, 36.85); note(g, '!?', 230 + Math.sin(gt * 30) * 3, 330, { size: 120, k }); }
  if (gt > 40.0) note(g, '…silence', 330, 330, { size: 66, color: '#2a2622', k: pop(gt, 40.05) });
  day(g, gt); vignette(g, 0.34 + 0.1 * sm(gt, 40, 41.5)); } });

// ---------- d3 + d4: instinct — he heads for the door… FREEZE ----------
const WALK0 = 41.95, WALK1 = 46.5, VS = 1.36;
const walkX = (gt) => 790 + strideSpeed(VS) * clamp(gt - WALK0, 0, WALK1 - WALK0);
function doorScene(g, gt, info, frozen) {
  const x = walkX(gt), c = camBegin(g, BG.flat, { z: 1.22, x: clamp(x + 220, 900, 1300), y: 640 });
  const walking = gt > WALK0 && gt < WALK1;
  vini(g, { x, y: 988, s: VS, t: gt, walk: walking ? 1 : 0, expr: pick(gt, [[0, 'worried'], [42.6, 'determined']]), turn: 0.8, look: [1, 0],
    arms: [walking ? 'relaxed' : 'down', armTrack(gt, [[0, [[28, 44], [10, 6]]], [42.0, 'relaxed'], [45.6, 'point']])], props: { right: (g2, h) => (gt < 42.0 ? phone(g2, h[0] + 6, h[1] - 18, 0.42, gt, 'alert') : null) } });
  camEnd(g); return c; }
registerShot('d3', { draw(g, t, info) { const gt = info.shot.start + t; const c = doorScene(g, gt, info, false);
  const [dx, dy] = toScreen(c, 1790, 520); const k = pop(gt, 43.7); if (k > 0) { note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64, k }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, so(gt, 43.75, 44.2)); }
  day(g, gt); vignette(g, 0.32); } });
registerShot('d4', { draw(g, t, info) { const gt = info.shot.start + t, FZ = 46.45;
  const c = doorScene(g, FZ, info, true);
  const [dx, dy] = toScreen(c, 1790, 520);
  note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64 }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, 1);
  // freeze-frame treatment: drain the colour, darken, flash on entry
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${0.85 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); g.restore();
  g.fillStyle = `rgba(10,8,6,${0.25 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); fade(g, 0.6 * (1 - so(t, 0, 0.18)), '#ffffff');
  note(g, 'MOST PEOPLE', W * 0.3, H * 0.2, { size: 92, k: pop(gt, 47.3) });
  if (gt > 50.1) { cross(g, dx - 120, dy + 40, 190, so(gt, 50.15, 50.6)); note(g, 'don’t make it past DAY 1', W * 0.5, H * 0.86, { size: 84, k: pop(gt, 50.9) }); }
  day(g, gt); vignette(g, 0.45); } });

// ---------- notebook rule pages ----------
function heading(g, gt, n, title, tN, tT) { note(g, `RULE ${n}`, 360, 165, { size: 92, k: pop(gt, tN), rot: -0.02 }); bigText(g, title, W * 0.6, 168, { size: 78, k: pop(gt, tT, 0.3), color: '#2a2622', stroke: '#e9e2cf' }); }
function doorDoodle(g, x, y, k, lockK) { inkPath(g, [[x - 70, y + 110], [x - 70, y - 110], [x + 70, y - 110], [x + 70, y + 110]], k, 7); inkPath(g, [[x + 40, y], [x + 50, y]], k, 9);
  if (lockK > 0) { const s = ease.outBack(clamp(lockK)); g.save(); g.translate(x + 5, y + 10); g.scale(s, s); g.fillStyle = '#d8a030'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(-34, -10, 68, 56, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -10, 22, Math.PI, 0); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(0, 16, 7, 0, 7); g.fill(); g.restore(); } }
function windowDoodle(g, x, y, k, curtainK) { inkPath(g, [[x - 90, y - 90], [x + 90, y - 90], [x + 90, y + 90], [x - 90, y + 90], [x - 90, y - 90]], k, 7); inkPath(g, [[x, y - 90], [x, y + 90]], k, 4); inkPath(g, [[x - 90, y], [x + 90, y]], k, 4);
  const c = ease.inOut(clamp(curtainK)); if (c > 0) for (const sd of [-1, 1]) { const w = 92 * c; g.fillStyle = '#b84a3a'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(x + sd * 96, y - 100); g.lineTo(x + sd * (96 - w), y - 100); for (let i = 0; i <= 6; i++) g.lineTo(x + sd * (96 - w + Math.sin(i * 1.4) * 6), y - 100 + i * 34); g.lineTo(x + sd * 96, y + 104); g.closePath(); g.fill(); g.stroke(); } }
function awayDoodle(g, x, y, k, gt, t0) { windowDoodle(g, x + 60, y - 10, k, 0); const p = sm(gt, t0 + 0.2, t0 + 0.9), px = x - 60 - 110 * p;
  if (k > 0.6) { g.save(); g.globalAlpha = clamp((k - 0.6) * 2.5); drawInkFront(g, { char: VV, x: px, y: y + 110, s: 0.55, t: gt, walk: p > 0 && p < 1 ? 1 : 0, turn: -0.8, expr: 'worried', arms: ['relaxed', 'relaxed'], shadow: false }); g.restore(); arrowTo(g, x - 10, y + 125, x - 190, y + 125, p, RED, 0); } }
function rowLabel(g, str, x, y, k, tk) { const ls = str.split('|'); ls.forEach((l, i) => note(g, l, x, y + i * 52, { size: 54, k, color: '#2a2622', glow: false, rot: -0.01 })); tick(g, x + 125, y - 330, 34, tk); }

// ---------- d5: RULE 1 — stay inside ----------
registerShot('d5', { draw(g, t, info) { const gt = info.shot.start + t; notebook(g, gt); fade(g, 1 - so(t, 0, 0.25));
  heading(g, gt, 1, 'STAY INSIDE', 52.78, 54.3);
  const cols = [[520, 'lock|the door', 55.8], [960, 'close|the curtains', 56.72], [1400, 'stay away|from windows', 58.24]];
  cols.forEach(([x, str, at], i) => { const k = sm(gt, at - 0.1, at + 0.55), y = 520;
    if (i === 0) doorDoodle(g, x, y, k, sm(gt, at + 0.35, at + 0.75)); if (i === 1) windowDoodle(g, x, y, k, sm(gt, at + 0.3, at + 0.9)); if (i === 2) awayDoodle(g, x, y, k, gt, at);
    rowLabel(g, str, x, 800, pop(gt, at + 0.2), sm(gt, at + 0.7, at + 1.0)); }); } });

// ---------- d6: the streets are the most dangerous place — crashed cars, panicked crowds… crowds that bite ----------
const RUNNERS = [{ x0: 1020, y: 842, seed: 0.3, col: '#8a4a3a' }, { x0: 930, y: 828, seed: 1.7, col: '#3a5a8a' }];
registerShot('d6', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const c = camBegin(g, BG.street, { z: lerp(1.15, 1.42, sm(t, 0, info.dur)), x: lerp(700, 1000, sm(t, 0, 6.5)), y: lerp(720, 770, sm(t, 0, info.dur)) });
  // panicked people sprint across the road (feet planted: speed = stride × cadence)
  for (const r of RUNNERS) { const cad = 2.3, s = sY(r.y), x = r.x0 + strideSpeed(s, cad) * Math.max(0, gt - 67.2); if (gt < 67.2 || x > 2100) continue;
    g.fillStyle = 'rgba(25,20,16,0.32)'; g.beginPath(); g.ellipse(x, r.y + 2, 60 * s, 11 * s, 0, 0, 7); g.fill();
    vini(g, { char: { ...VV, name: 'runner' + r.seed, hair: { style: 'short', color: '#2a2018' }, top: { type: 'jacket', color: r.col }, backpack: null, inkSkin: '#e6d8c8' }, x, y: r.y, s, t: (gt - 67.2) * cad + r.seed, walk: 1, expr: 'terror', turn: 0.85, arms: ['up', 'up'], seed: r.seed, shadow: false, b: 0.92 }); }
  // the crowd that bites: shambling in from the far road
  const hz = [{ kind: 'worker', x: 900, y0: 812, start: 68.6, seed: 0.4 }, { kind: 'office', x: 1015, y0: 826, start: 68.6, seed: 1.1 }, { kind: 'teen', x: 1105, y0: 806, start: 68.6, seed: 2.2 }, { kind: 'office', x: 815, y0: 800, start: 68.6, seed: 3.3 }, { kind: 'teen', x: 965, y0: 790, start: 68.6, seed: 4.4 }];
  if (gt > 68.6) hz.map((z) => ({ ...z, ...hordeAt(z, gt, 1.6) })).sort((a, b) => a.y - b.y).forEach((z) => { g.save(); g.globalAlpha = so(gt, 68.6, 69.1); zombie(g, { kind: z.kind, x: z.x, y: z.y, s: z.s, t: gt, seed: z.seed, dir: 0 }); g.restore(); });
  camEnd(g);
  note(g, 'the most dangerous place', W * 0.5, H * 0.15, { size: 76, k: pop(gt, 63.0) * (1 - sm(gt, 65.9, 66.2)) });
  const [cx, cy] = toScreen(c, 430, 700); const kc = pop(gt, 66.3); if (kc > 0) { note(g, 'crashed cars', cx + 40, cy - 190, { size: 66, k: kc }); arrowTo(g, cx + 40, cy - 150, cx, cy - 30, so(gt, 66.35, 66.75)); }
  note(g, 'panicked crowds', W * 0.78, H * 0.58, { size: 66, k: pop(gt, 67.3) * (1 - sm(gt, 69.2, 69.5)), rot: 0.03 });
  note(g, '…that BITE', W * 0.52, H * 0.26, { size: 96, k: pop(gt, 69.9) });
  day(g, gt); vignette(g, 0.38); } });

// ---------- water doodles ----------
function waterFill(g, path, k, top, bottom) { if (k <= 0) return; g.save(); path(); g.clip(); const y = lerp(bottom, top, ease.out(clamp(k))); g.fillStyle = 'rgba(70,150,210,0.75)'; g.fillRect(-W, y, W * 3, H); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.beginPath(); for (let x = -400; x < 400; x += 10) g.lineTo(x + 0, y + Math.sin(x * 0.08) * 3); g.stroke(); g.restore(); }
function bath(g, x, y, k, w) { const P = () => { g.beginPath(); g.moveTo(x - 150, y - 50); g.lineTo(x + 150, y - 50); g.quadraticCurveTo(x + 150, y + 70, x + 90, y + 70); g.lineTo(x - 90, y + 70); g.quadraticCurveTo(x - 150, y + 70, x - 150, y - 50); g.closePath(); };
  waterFill(g, P, w, y - 40, y + 70); inkPath(g, [[x - 160, y - 50], [x + 160, y - 50]], k, 7); inkPath(g, [[x - 150, y - 50], [x - 150, y + 20], [x - 120, y + 65], [x + 120, y + 65], [x + 150, y + 20], [x + 150, y - 50]], k, 7); inkPath(g, [[x - 110, y + 68], [x - 120, y + 95]], k, 7); inkPath(g, [[x + 110, y + 68], [x + 120, y + 95]], k, 7); inkPath(g, [[x + 120, y - 50], [x + 120, y - 110], [x + 90, y - 110]], k, 7); }
function sink(g, x, y, k, w) { const P = () => { g.beginPath(); g.moveTo(x - 90, y - 30); g.lineTo(x + 90, y - 30); g.quadraticCurveTo(x + 80, y + 60, x, y + 60); g.quadraticCurveTo(x - 80, y + 60, x - 90, y - 30); g.closePath(); };
  waterFill(g, P, w, y - 24, y + 60); inkPath(g, [[x - 100, y - 30], [x + 100, y - 30]], k, 7); inkPath(g, [[x - 90, y - 30], [x - 70, y + 40], [x, y + 60], [x + 70, y + 40], [x + 90, y - 30]], k, 7); inkPath(g, [[x, y + 60], [x, y + 120]], k, 7); inkPath(g, [[x + 40, y - 30], [x + 40, y - 80], [x + 10, y - 80]], k, 7); }
function pan(g, x, y, k, w) { const P = () => { g.beginPath(); g.rect(x - 80, y - 40, 160, 90); };
  waterFill(g, P, w, y - 30, y + 50); inkPath(g, [[x - 80, y - 40], [x - 80, y + 50], [x + 80, y + 50], [x + 80, y - 40]], k, 7); inkPath(g, [[x + 80, y - 20], [x + 170, y - 30]], k, 9); }
function bottle(g, x, y, k, w) { const P = () => { g.beginPath(); g.roundRect(x - 40, y - 60, 80, 140, 14); };
  waterFill(g, P, w, y - 50, y + 80); inkPath(g, [[x - 18, y - 100], [x - 18, y - 80], [x - 40, y - 60], [x - 40, y + 80], [x + 40, y + 80], [x + 40, y - 60], [x + 18, y - 80], [x + 18, y - 100], [x - 18, y - 100]], k, 7); }

// ---------- d7: RULE 2 — fill everything with water ----------
registerShot('d7', { draw(g, t, info) { const gt = info.shot.start + t; notebook(g, gt); fade(g, 1 - so(t, 0, 0.25));
  heading(g, gt, 2, 'FILL EVERYTHING', 71.52, 72.4); note(g, 'with water', W * 0.6, 252, { size: 60, k: pop(gt, 73.6), color: '#2a6ab8', glow: false });
  const items = [[430, 'the bath', 74.75, bath], [820, 'the sink', 75.38, sink], [1190, 'every pan', 76.42, pan], [1530, 'every bottle', 76.9, bottle]];
  for (const [x, str, at, fn] of items) { const k = sm(gt, at - 0.12, at + 0.45); fn(g, x, 560, k, sm(gt, at + 0.35, at + 1.6)); note(g, str, x, 790, { size: 56, k: pop(gt, at + 0.1), color: '#2a2622', glow: false }); } } });

// ---------- d8: the taps are often one of the first things to go ----------
registerShot('d8', { draw(g, t, info) { const gt = info.shot.start + t; notebook(g, gt); fade(g, 1 - so(t, 0, 0.2));
  const x = 860, y = 380, k = sm(gt, 78.3, 78.9);
  inkPath(g, [[x - 260, y - 60], [x - 60, y - 60], [x + 40, y - 40], [x + 80, y + 10], [x + 80, y + 60]], k, 12); inkPath(g, [[x - 260, y - 10], [x - 60, y - 10], [x + 20, y + 10], [x + 30, y + 60]], k, 12);
  inkPath(g, [[x - 120, y - 60], [x - 120, y - 120]], k, 12); inkPath(g, [[x - 180, y - 130], [x - 60, y - 130]], k, 14);
  const flow = 1 - sm(gt, 81.2, 82.3), mx = x + 55, my = y + 62;
  if (k >= 1) { if (flow > 0.02) { g.fillStyle = 'rgba(70,150,210,0.85)'; g.fillRect(mx - 14 * flow, my, 28 * flow, 380); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const yy = my + ((gt * 600 + i * 70) % 380); g.beginPath(); g.moveTo(mx - 6 * flow, yy); g.lineTo(mx - 6 * flow, yy + 26); g.stroke(); } }
    for (let i = 0; i < 3; i++) { const p = ((gt - 81.6) * 0.9 + i * 0.33) % 1; if (gt > 81.6 && gt < 83.1 && p > 0) { g.fillStyle = 'rgba(70,150,210,0.9)'; g.beginPath(); g.ellipse(mx, my + p * 380, 9, 13, 0, 0, 7); g.fill(); } } }
  inkPath(g, [[x - 260, 850], [x + 400, 850]], k, 6);
  note(g, 'when a city breaks down…', W * 0.5, 165, { size: 66, k: pop(gt, 78.4), color: '#2a2622', glow: false });
  note(g, 'one of the FIRST things to go', 1360, 560, { size: 66, k: pop(gt, 81.3), rot: -0.03 }); cross(g, mx, my + 20, 70, so(gt, 82.75, 83.15)); } });

// ---------- d9: 2 litres a day… a full bath holds 100+ litres ----------
registerShot('d9', { draw(g, t, info) { const gt = info.shot.start + t; notebook(g, gt); fade(g, 1 - so(t, 0, 0.2));
  const kL = sm(gt, 83.4, 83.9); g.save(); g.globalAlpha = kL; drawInkFront(g, { char: VV, x: 470, y: 760, s: 1.05, t: gt, expr: 'neutral', arms: ['down', 'down'], turn: 0.3, shadow: false }); g.restore();
  for (let i = 0; i < 2; i++) bottle(g, 680 + i * 110, 640, sm(gt, 84.7 + i * 0.25, 85.1 + i * 0.25), sm(gt, 84.9 + i * 0.25, 85.6 + i * 0.25));
  note(g, '2 litres a day', 600, 850, { size: 66, k: pop(gt, 84.75), color: '#2a2622', glow: false }); note(g, '(at LEAST)', 600, 915, { size: 46, k: pop(gt, 84.4), glow: false });
  inkPath(g, [[960, 300], [960, 900]], sm(gt, 86.9, 87.4), 4, alpha(INK, 0.4));
  const wf = sm(gt, 87.8, 90.1); bath(g, 1400, 620, sm(gt, 87.5, 88.0), wf);
  const n = Math.round(lerp(0, 150, wf)); bigText(g, `${n} L`, 1400, 420, { size: 120, k: pop(gt, 87.9), color: '#4a9ad8', stroke: '#e9e2cf' });
  note(g, 'a full bath = 100+ litres', 1400, 850, { size: 62, k: pop(gt, 89.6), color: '#2a2622', glow: false }); } });

// ---------- d10: weeks of water, sitting right there (tracker appears) ----------
registerShot('d10', { draw(g, t, info) { const gt = info.shot.start + t;
  camBegin(g, BG.flat, { z: lerp(1.2, 1.3, sm(t, 0, info.dur)), x: 820, y: 680 });
  vini(g, { x: 780, y: 988, s: 1.36, t: gt, expr: 'happy', arms: arms2(gt, [[0, 'down'], [91.3, 'hips']], [[0, 'down'], [91.3, 'hips']]), turn: 0.2, bob: settle(gt, 91.35, 10, 9, 5) });
  camEnd(g);
  tracker(g, gt, 91.2, [sm(gt, 91.4, 92.6), 0.3, 0], { labels: ['WEEKS', '3 DAYS', 'NONE'] });
  note(g, 'weeks of water', W * 0.68, H * 0.28, { size: 76, k: pop(gt, 91.9) });
  day(g, gt); vignette(g, 0.32); } });

// ---------- d11: midnight — the shouting has turned into something else. A low groan. ----------
registerShot('d11', { draw(g, t, info) { const gt = info.shot.start + t;
  const c = camBegin(g, BG.flat, { z: lerp(1.25, 1.55, sm(t, 0, info.dur)), x: lerp(520, 420, sm(t, 0, info.dur)), y: 640 }, camShake(gt, 2, 100.7, 0.9));
  vini(g, { x: 410, y: 988, s: 1.36, t: gt, expr: pick(gt, [[0, 'worried'], [100.7, 'terror']]), arms: arms2(gt, [[0, 'down'], [96.6, 'reach'], [100.7, 'chest']], [[0, 'down'], [100.7, 'cold']]), turn: -0.85, look: [-1, -0.3], shake: gt > 100.7 ? 1 : 0, b: 0.9 });
  camEnd(g);
  nightGrade(g, 1, [[...toScreen(c, 250, 330), 620, '#9fb4e8', 0.32], [...toScreen(c, 560, 800), 420, '#9fb4e8', 0.12]]);
  note(g, 'MIDNIGHT', W * 0.75, H * 0.2, { size: 84, k: pop(gt, 95.69), color: '#d8e0ff', glow: false });
  if (gt > 100.3) note(g, 'a low groan…', W * 0.72, H * 0.33, { size: 62, k: pop(gt, 100.35), color: '#d8e0ff', glow: false });
  day(g, gt); vignette(g, 0.5); } });

// ---------- d12: hundreds of them ----------
const NIGHT_HORDE = (() => { const r = rng(42), out = []; for (let i = 0; i < 44; i++) out.push({ kind: ['office', 'worker', 'teen'][i % 3], x: 520 + r() * 900, y0: 745 + r() * 230, start: 101.0 - r() * 2, seed: r() * 6 }); return out; })();
registerShot('d12', { draw(g, t, info) { const gt = info.shot.start + t;
  camBegin(g, BG.street, { z: lerp(1.35, 1.15, sm(t, 0, info.dur)), x: 960, y: 760 });
  NIGHT_HORDE.map((z) => ({ ...z, ...hordeAt(z, gt, 0.6) })).filter((z) => z.y < 1120).sort((a, b) => a.y - b.y).forEach((z) => zombie(g, { kind: z.kind, x: z.x, y: z.y, s: z.s, t: gt, seed: z.seed, dir: 0, b: 0.75 }));
  camEnd(g);
  nightGrade(g, 1, [[W * 0.5, H * 0.3, 700, '#8fa8e0', 0.18]]);
  // their eyes catch the moonlight
  bigText(g, 'HUNDREDS', W / 2, H * 0.2, { size: 130, k: pop(gt, 101.95, 0.3), color: '#ff4a3a' });
  vignette(g, 0.55); fade(g, sm(t, info.dur - 0.9, info.dur)); } });
