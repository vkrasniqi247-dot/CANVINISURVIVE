// src/scenes/day1.js — DAY 1 wake-up test (episode time 28.6 → 60.2), ported shot-for-shot from the v1 opening.
// Same timing, framing and labels as v1. Changes kept from v2: a smoother get-up and handwriting write-on on the
// notebook page. Vini is the Rigby2D rig (src/vini/rig.js). Every function here is a pure function of time.
import { W, H, RED, INK, clamp, lerp, ease, alpha, radGrad, sm, so, pop, settle, armTrack, pick, track, camBegin, camEnd, punches, pageTurn, toScreen, camShake, note, arrowTo, bigText, fade, vignette, dayCounter, notebook, inkPath, tick, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';

// ---------- secondary motion + breathing (deterministic: driven by motion history, see follow() in rig.js) ----------
// drive(t) = a screen-x the body moves with; the hair (light, quick) and backpack (heavy, slow) trail behind it.
function lags(drive, gt, k = 4) {
  return { hairLag: clamp(-follow(drive, gt, { freq: 2.6, damp: 0.3 }) * k, -14, 14), packLag: clamp(-follow(drive, gt, { freq: 1.8, damp: 0.38 }) * k * 0.7, -10, 10) };
}
const breathe = (t, period, amp = 1, t0 = 0) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * (t - t0)) / period));
// a startle: snaps up in 0.09 s, then dies away
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));

export const T0 = 28.6, T1 = 60.2;
const DAY1 = 28.73, VS = 1.36;
export const SHOTS = [['d1', 28.6, 36.5], ['d2', 36.5, 41.8], ['d3', 41.8, 46.6], ['d4', 46.6, 52.6], ['d5', 52.6, 60.2]];
let HUD = true;                                   // off while a transition draws a shot it will move/smear
const day = (g, gt) => { if (HUD) dayCounter(g, 1, gt, DAY1); };

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
const PHONE_HAND = [-12, 30, 34];                 // hand in front of the chest (x in, y below shoulder, forward)
// phone in his hand: the screen's light spills up over his face and hoodie (AUDIT #11)
const inHand = (gt, mode) => (g2, h, info) => { phone(g2, h[0] + 2, h[1] - 30, 0.52, gt, mode); if (info && mode !== 'off') faceGlow(g2, gt, mode, [h[0] + 2, h[1] - 30], info.head, info.s); };
function faceGlow(g, t, mode, ph, head, s) {
  const col = mode === 'alert' ? '#ff4a36' : '#ffd6a0', a = mode === 'alert' ? 0.3 + 0.09 * Math.sin(t * 12) : 0.2 + 0.08 * Math.sin(t * 60);
  g.save(); g.globalCompositeOperation = 'screen';
  g.fillStyle = radGrad(g, head[0], head[1] + 10 * s, 0, 70 * s, [alpha(col, a), alpha(col, a * 0.45), alpha(col, 0)]); g.beginPath(); g.arc(head[0], head[1] + 10 * s, 70 * s, 0, 7); g.fill();
  const mx = (ph[0] + head[0]) / 2, my = (ph[1] + head[1]) / 2;     // light between the screen and his face
  g.fillStyle = radGrad(g, mx, my, 0, 62 * s, [alpha(col, a * 0.7), alpha(col, 0)]); g.beginPath(); g.arc(mx, my, 62 * s, 0, 7); g.fill();
  g.restore(); }

// ---------- d1: DAY 1 — asleep → phone buzzing → gets up → grabs it → EMERGENCY ALERT ----------
// Get-up (smoother than v1's 0.55 s spring): a small curl wind-up, then he swings round and rises over 0.85 s,
// knees bent as the feet take his weight, with a soft settle on landing.
const UP0 = 32.3, UP1 = 33.15;
function body1(gt) {
  const u = clamp((gt - UP0) / (UP1 - UP0)), curl = sm(gt, 32.05, UP0) * (1 - sm(gt, UP0, UP0 + 0.25));   // curl = anticipation
  const rot = lerp(-Math.PI / 2, 0, ease.inOut(clamp(u * 1.15))) - curl * 0.1;
  const ox = lerp(880, 790, ease.inOut(u)), oy = lerp(662, 988, ease.inOut(u)) - Math.sin(Math.PI * u) * 26;
  return { u, curl, rot, ox, oy };
}
// the head's position along his own body-across axis (he starts lying down, so the frame rotates)
const drive1 = (t) => { const b = body1(t), hx = b.ox + 380 * Math.sin(b.rot), hy = b.oy - 380 * Math.cos(b.rot); return hx * Math.cos(b.rot) + hy * Math.sin(b.rot); };
function d1(g, gt, A) {
  const wide = { z: lerp(1.38, 1.18, sm(gt, 32.0, 34.5)), x: lerp(740, 800, sm(gt, 32, 34.5)), y: lerp(690, 700, sm(gt, 32, 34.5)) };
  const c = camBegin(g, A.bg.flat, punches(gt, wide, [[30.7, 0.42, { z: 2.75, x: 560, y: 655 }], [34.6, 9, { z: 2.25, x: 805, y: 680 }]]), camShake(gt, 2, 32.35, 0.35));
  const { u, curl, rot, ox, oy } = body1(gt), standing = u >= 1, holding = gt >= 33.45;
  if (!holding) phone(g, 905, 742, 0.55, gt, gt > 30.2 ? 'buzz' : 'off', -1.45);
  // asleep: slow, visible breathing; a stir as the buzzing starts; a jolt when his eyes snap open
  const stir = bump(gt, 30.22, 30.62), jolt = settle(gt, 30.7, 1, 17, 6);
  const breath = gt < 30.7 ? breathe(gt, 2.9, 1, 28.6) : breathe(gt, 1.15, 0.55, 30.7);
  const lag = lags(drive1, gt), land = bump(gt, UP1 - 0.08, UP1 + 0.22);
  const crouch = Math.sin(Math.PI * clamp(u * 1.1)) * 9 * (1 - sm(gt, UP1 - 0.15, UP1 + 0.25)) + curl * 4 + Math.max(0, settle(gt, UP1 + 0.05, 5, 12, 7));
  const reach = sm(gt, 33.1, 33.45) * (1 - sm(gt, 33.45, 33.8));
  const armR = holding ? armTrack(gt, [[33.4, [[24, 40], [36, 84]]], [33.45, [[14, 40], PHONE_HAND]]], 0.35) : armTrack(gt, [[0, 'down'], [32.6, 'out'], [33.05, [[24, 40], [36, 84]]]], 0.35);
  const armL = armTrack(gt, [[0, 'down'], [32.6, 'out'], [33.05, 'down'], [34.6, 'chest']], 0.35);
  const turn = 0.62 * Math.sin(Math.PI * clamp((gt - UP0 + 0.1) / (UP1 - UP0 + 0.35)));
  g.save(); g.translate(ox, oy); g.rotate(rot);
  drawVini(g, A.vini, { x: 0, y: 0, s: VS, t: gt, shadow: standing, turn, expr: pick(gt, [[0, 'sleep'], [30.7, 'shock'], [32.8, 'worried'], [34.6, 'scared']]), look: gt < 32.3 ? [0, -1] : holding ? [0.25, 0.7] : [0.5, 0.7],
    arms: [armL, armR], lean: -reach * 0.12 * 57, crouch: crouch + stir * 2, headTilt: stir * 5 - jolt * 7, shake: gt > 34.6 ? 0.5 : 0, breath, squash: land * 0.8,
    hairLag: lag.hairLag + jolt * 6, packLag: lag.packLag, props: { right: holding ? inHand(gt, gt > 34.55 ? 'alert' : 'buzz') : null } });
  g.restore();
  if (gt < 30.6) note(g, 'z z z', 470, 560 - Math.sin(gt * 2) * 8, { size: 44, color: '#3a3a3a', glow: false, k: 1 - sm(gt, 30.3, 30.6) });
  camEnd(g);
  const [px, py] = toScreen(c, 905, 742);
  const kc = pop(gt, 31.5) * (1 - sm(gt, 33.6, 33.9)); if (kc > 0) { note(g, '47 missed calls', px + 330, py - 160, { size: 62, k: kc }); arrowTo(g, px + 250, py - 120, px + 50, py - 30, so(gt, 31.55, 31.95) * kc); }
  if (gt > 34.6) note(g, 'EMERGENCY ALERT', W * 0.72, H * 0.24, { size: 70, k: pop(gt, 34.62) });
  day(g, gt); vignette(g, 0.32);
}

// ---------- d2: outside, someone is shouting… then they stop ----------
// Acting beats: reading the alert -> FLINCH at the shout (36.85) -> eyes, then head, then body turn to the window
// -> a curious lean toward it -> he backs off a step (38.95) -> the shouting stops: he gasps and freezes (40.0)
// -> holds his breath, then slowly turns back to us (41.0) so d3 can start from the front.
const SHOUT = 36.85, BACK0 = 38.95, BACK1 = 39.5, BACKD = 20, SILENCE = 40.0;
const back2 = (t) => BACKD * ease.inOut(clamp((t - BACK0) / (BACK1 - BACK0)));
const turn2 = (t) => track(t, [[37.02, 0], [37.55, -0.6], [40.95, -0.6], [41.6, 0]]);
const drive2 = (t) => 790 + back2(t) * VS + startle(t - SHOUT) * 34 + turn2(t) * 30;
const X_D3 = 790 + BACKD * VS;
function d2(g, gt, A) { const t = gt - 36.5, dur = 5.3;
  camBegin(g, A.bg.flat, punches(gt, { z: lerp(1.15, 1.32, sm(t, 0, dur)), x: lerp(760, 600, sm(t, 0, 1.6)), y: 640 }, [[SILENCE + 0.03, 0.72, { z: 2.5, x: 835, y: 640 }, 0.5]]));
  const fl = startle(gt - SHOUT), freeze = gt > SILENCE, tt = freeze ? SILENCE + (gt - SILENCE) * 0.12 : gt, back = back2(gt), stepping = gt > BACK0 - 0.02;
  const gasp = so(gt, SILENCE, SILENCE + 0.18) * (1 - sm(gt, 41.2, 41.9));
  const breath = freeze ? lerp(breathe(SILENCE, 1.2, 0.7), 1, gasp) : breathe(gt, 1.2, 0.7);
  const lean = 2.6 * bump(gt, 37.7, 38.95) - 5 * fl - 3 * bump(gt, BACK0 - 0.05, BACK1 + 0.15) + 1.2 * gasp;
  const look = gt < 36.95 ? [0.25, 0.7] : gt < 40.95 ? [-0.7, gt < 37.6 ? -0.1 : 0.05] : [lerp(-0.7, 0, sm(gt, 40.95, 41.5)), 0];
  drawVini(g, A.vini, { x: 790 + back * VS, y: 988, s: VS, t: tt, turn: turn2(gt), look, lean, headTilt: -5 * fl, hipX: 3 * fl, crouch: fl * 3 + bump(gt, BACK0, BACK1) * 1.5,
    expr: pick(gt, [[0, 'scared'], [SHOUT, 'shock'], [37.4, 'worried'], [BACK0, 'scared'], [SILENCE, 'shock'], [40.7, 'scared']]),
    walkDist: stepping ? back : null, stride: BACKD, lift: 9, walkMix: 1 - sm(gt, BACK1 + 0.05, BACK1 + 0.4), breath, shake: freeze ? 0.15 * (1 - gasp * 0.5) : fl * 0.6, ...lags(drive2, gt),
    arms: [armTrack(gt, [[0, 'chest'], [SHOUT, 'face'], [37.35, 'chest'], [38.1, 'down']], 0.16),
      armTrack(gt, [[0, [[14, 40], PHONE_HAND]], [SHOUT, [[16, 34], [-10, 22, 34]]], [37.3, [[14, 40], PHONE_HAND]], [37.85, [[10, 44], [-2, 58, 26]]]], 0.2)],
    props: { right: inHand(gt, 'alert') } });
  camEnd(g);
  if (gt > 36.8 && gt < 39.9) note(g, '!?', 230 + Math.sin(gt * 30) * 3, 330, { size: 120, k: pop(gt, 36.85) * (1 - sm(gt, 39.6, 39.9)) });
  if (gt > 40.0) note(g, '…silence', 330, 330, { size: 66, color: '#2a2622', k: pop(gt, 40.05) });
  day(g, gt); vignette(g, 0.34 + 0.1 * sm(gt, 40, 41.5));
}

// ---------- d3 + d4: instinct — he heads for the door… FREEZE ----------
// Walk speed matches the footstep sounds in the mix (one step every 0.49 s), with feet planted on the floor.
const WALK0 = 41.95, WALK1 = 46.5, STEP = 0.49, SPEED = 54;           // v1 units per second
const walkD = (gt) => SPEED * smoothStartStop(gt);
const turn3 = (t) => track(t, [[41.72, 0], [42.12, 1]]);
const drive3 = (t) => X_D3 + walkD(t) * VS + turn3(t) * 30;
function smoothStartStop(gt) { const T = WALK1 - WALK0, e = 0.25, x = clamp(gt - WALK0, 0, T); // ease in/out over 0.25 s, distance continuous
  if (x < e) return x * x / (2 * e); if (x > T - e) { const r = T - x; return (T - e) - r * r / (2 * e); } return x - e / 2; }
function doorScene(g, gt, A, cam = (v) => v) {
  const d = walkD(gt), x = X_D3 + d * VS, c = camBegin(g, A.bg.flat, cam({ z: 1.22, x: clamp(x + 220, 900, 1300), y: 640 }, x));
  const walking = gt > WALK0 - 0.05, turn = turn3(gt);
  const speedK = clamp((walkD(gt + 0.05) - walkD(gt - 0.05)) / (0.1 * SPEED));   // 0 standing .. 1 full pace
  drawVini(g, A.vini, { x, y: 988, s: VS, t: gt, turn, walkDist: walking ? d : null, stride: SPEED * STEP, lift: 14, expr: pick(gt, [[0, 'worried'], [42.6, 'determined']]), look: [0.5, 0],
    lean: -4.5 * speedK, ...lags(drive3, gt), breath: breathe(gt, 1.3, 0.5), arms: [armTrack(gt, [[0, 'down'], [41.9, 'relaxed'], [45.55, 'point']]), armTrack(gt, [[0, [[14, 40], PHONE_HAND]], [42.0, 'relaxed']])],
    props: { right: gt < 42.15 ? inHand(gt, 'alert') : null } });
  camEnd(g); return c; }
const camD3 = (gt) => (v, x) => punches(gt, v, [[42.6, 0.36, { z: 2.3, x: x + 70, y: 645 }, 0.42]]);
function d3(g, gt, A) { const c = doorScene(g, gt, A, camD3(gt));
  const [dx, dy] = toScreen(c, 1790, 520), k = pop(gt, 43.7);
  if (k > 0) { note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64, k }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, so(gt, 43.75, 44.2)); }
  day(g, gt); vignette(g, 0.32); }
// the freeze keeps moving: a slow push-in toward him over the whole 6 s
const camD4 = (gt) => (v, x) => { const k = ease.sine(clamp((gt - 46.6) / 6.0)); return { z: v.z * (1 + 0.24 * k), x: lerp(v.x, x + 120, 0.55 * k), y: lerp(v.y, 670, k) }; };
function d4(g, gt, A) { const t = gt - 46.6, FZ = 46.45; const c = doorScene(g, FZ, A, camD4(gt));
  const [dx, dy] = toScreen(c, 1790, 520);
  note(g, 'instinct: GO OUTSIDE', dx - 420, dy - 260, { size: 64 }); arrowTo(g, dx - 300, dy - 220, dx - 40, dy - 60, 1);
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${0.85 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); g.restore();
  g.fillStyle = `rgba(10,8,6,${0.25 * so(t, 0, 0.25)})`; g.fillRect(0, 0, W, H); fade(g, 0.6 * (1 - so(t, 0, 0.18)), '#ffffff');
  note(g, 'MOST PEOPLE', W * 0.3, H * 0.2, { size: 92, k: pop(gt, 47.3) });
  if (gt > 50.1) { cross(g, dx - 120, dy + 40, 190, so(gt, 50.15, 50.6)); note(g, 'don’t make it past DAY 1', W * 0.5, H * 0.86, { size: 84, k: pop(gt, 50.9) }); }
  day(g, gt); vignette(g, 0.45); }

// ---------- d5: RULE 1 — stay inside (handwritten on the notebook page) ----------
const wk = (gt, at, str, cps = 18) => clamp((gt - at) / Math.max(0.25, str.length / cps));
// strokes [pts, width] drawn one after another over k (0..1), by length; the pen sits on the active stroke tip
function penStrokes(g, strokes, k) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]);
}
// ease the drawing so the first strokes go down fast (no lone specks), slowing as it finishes
const drawK = (gt, at, dur = 0.48) => ease.out(clamp((gt - at + 0.08) / dur));
function doorDoodle(g, x, y, k, lockK) { penStrokes(g, [[[[x - 70, y + 110], [x - 70, y - 110], [x + 70, y - 110], [x + 70, y + 110]], 7], [[[x + 40, y], [x + 50, y]], 9]], k);
  if (lockK > 0) { const s = ease.outBack(clamp(lockK)); g.save(); g.translate(x + 5, y + 10); g.scale(s, s); g.fillStyle = '#d8a030'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(-34, -10, 68, 56, 8); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -10, 22, Math.PI, 0); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(0, 16, 7, 0, 7); g.fill(); g.restore(); } }
function windowDoodle(g, x, y, k, curtainK) { penStrokes(g, [[[[x - 90, y - 90], [x + 90, y - 90], [x + 90, y + 90], [x - 90, y + 90], [x - 90, y - 90]], 7], [[[x, y - 90], [x, y + 90]], 4], [[[x - 90, y], [x + 90, y]], 4]], k);
  const c = ease.inOut(clamp(curtainK)); if (c > 0) for (const sd of [-1, 1]) { const w = 92 * c; g.fillStyle = '#b84a3a'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(x + sd * 96, y - 100); g.lineTo(x + sd * (96 - w), y - 100); for (let i = 0; i <= 6; i++) g.lineTo(x + sd * (96 - w + Math.sin(i * 1.4) * 6), y - 100 + i * 34); g.lineTo(x + sd * 96, y + 104); g.closePath(); g.fill(); g.stroke(); } }
function awayDoodle(g, A, x, y, k, gt, t0) { windowDoodle(g, x + 60, y - 10, k, 0); const p = sm(gt, t0 + 0.2, t0 + 0.9), px = x - 60 - 110 * p;
  if (k > 0.6) { g.save(); g.globalAlpha = clamp((k - 0.6) * 2.5); drawVini(g, A.vini, { x: px, y: y + 110, s: 0.55, t: gt, walkDist: -110 * p / 0.55, stride: 22, expr: 'worried', look: [-1, 0], arms: ['relaxed', 'relaxed'], shadow: false }); g.restore(); arrowTo(g, x - 10, y + 125, x - 190, y + 125, p, RED, 0); } }
function d5(g, gt, A) { const t = gt - 52.6, land = so(gt, FLIP0, FLIP1 + 0.25);
  g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.035 * (1 - land) + settle(gt, FLIP1 + 0.05, 0.006, 11, 6)); g.translate(-W / 2 + 60 * (1 - land), -H / 2 + 26 * (1 - land));
  notebook(g, gt);
  writeOn(g, 'RULE 1', 360, 165, wk(gt, 52.62, 'RULE 1', 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [362, 216], [462, 220]], ease.out(clamp((gt - 53.15) / 0.3)), 7, RED);           // underline
  writeOn(g, 'STAY INSIDE', W * 0.6, 168, wk(gt, 54.2, 'STAY INSIDE', 11), { size: 78, color: '#2a2622', font: 'Permanent Marker' });
  const cols = [[520, 'lock|the door', 55.8], [960, 'close|the curtains', 56.72], [1400, 'stay away|from windows', 58.24]];
  const doodling = cols.some(([, , at]) => { const k = drawK(gt, at); return k > 0 && k < 1; });   // only one pen on the page at a time
  cols.forEach(([x, str, at], i) => { const k = drawK(gt, at), y = 520;
    if (i === 0) doorDoodle(g, x, y, k, sm(gt, at + 0.35, at + 0.75)); if (i === 1) windowDoodle(g, x, y, k, sm(gt, at + 0.3, at + 0.9)); if (i === 2) awayDoodle(g, A, x, y, k, gt, at);
    const ls = str.split('|'); let t0 = at + 0.42; ls.forEach((l, j) => { writeOn(g, l, x, 800 + j * 52, wk(gt, t0, l, 24), { size: 54, pen: !doodling }); t0 += Math.max(0.25, l.length / 24) + 0.05; });
    tick(g, x + 125, 470, 34, sm(gt, at + 0.75, at + 1.05)); });
  g.restore(); vignette(g, 0.2); }

const FN = { d1, d2, d3, d4, d5 };
const shotAt = (gt) => SHOTS.find(([, a, b]) => gt >= a && gt < b) || SHOTS[SHOTS.length - 1];
const drawShot = (g, gt, A) => { g.save(); FN[shotAt(gt)[0]](g, gt, A); g.restore(); };

// ---------- transitions ----------
// Whip pan d2 -> d3 (he's about to head right, so the camera whips right): each side of the cut slides
// toward screen-left with a growing horizontal smear (a running average of offset copies), slightly zoomed so
// the edges never show. Page-flip d4 -> d5: the frozen frame turns over like a page to the notebook.
const WHIP = 41.8, WHIP_H = 0.16, FLIP0 = 52.42, FLIP1 = 52.92;
let off = null;
function whip(g, gt, A) {
  off = off || Object.assign(document.createElement('canvas'), { width: W, height: H });
  const og = off.getContext('2d'); og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H); HUD = false; drawShot(og, gt, A); HUD = true;
  const w = (gt - WHIP) / WHIP_H, e = w < 0 ? ease.in(1 + w) : 1 - ease.out(w);   // 0 at the ends, 1 at the cut
  const dx = (w < 0 ? -1 : 1) * 300 * e, smear = 620 * e, N = 12;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(1 + 0.1 * e, 1 + 0.1 * e); g.translate(-W / 2, -H / 2);
  for (let i = 0; i < N; i++) { g.globalAlpha = 1 / (i + 1); g.drawImage(off, dx - (i / (N - 1) - 0.5) * smear, 0); }
  g.restore(); g.globalAlpha = 1; day(g, gt);
}
export function drawDay1(g, gt, A) {
  if (Math.abs(gt - WHIP) < WHIP_H) return whip(g, gt, A);
  if (gt > FLIP0 && gt < FLIP1) return pageTurn(g, (gt - FLIP0) / (FLIP1 - FLIP0), () => { g.save(); d4(g, Math.min(gt, 52.59), A); g.restore(); }, () => { g.save(); d5(g, Math.max(gt, 52.6), A); g.restore(); });
  drawShot(g, gt, A);
}
