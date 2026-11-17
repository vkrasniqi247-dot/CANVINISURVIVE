// src/scenes/s30_day30.js — DAY 30 "The checkpoint" + OUTRO (script v2). Scene time t runs 0 → DUR seconds.
// Narration: 13_day30a, 14_day30b, 15_day30c, 16_outro. Every function is a pure function of time.
// The checkpoint shots use A.bg.checkpoint (BG08; the sliding gate is drawn here) and the tent shots A.bg.tent (BG09).
import { W, H, RED, INK, clamp, lerp, ease, alpha, mix, radGrad, linGrad, sm, so, pop, settle, track, camBegin, camEnd, punches, toScreen, camShake, nightGrade, note, arrowTo, bigText, fade, vignette, dayCounter, notebook, inkPath, tick, cross, writeOn } from '../kit/kit.js';
import { drawVini, follow, boneScreen } from '../vini/rig.js';
import { drawZombie, strideSpeed, KINDS } from '../zombie/zombie.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';
import { tin } from './props.js';

// ---------- timeline ----------
const C13 = 0.4, C14 = 30.9, C15 = 43.6, C16 = 59.8;        // where each narration clip starts
export const DUR = 74.1;
export const VO = [['13_day30a', C13], ['14_day30b', C14], ['15_day30c', C15], ['16_outro', C16]];
const T = { walk: 0, car: 3.7, hedge: 5.85, freeze: 7.55, ticks: 10.45, sees: 13.4, phReveal: 15.15, m200: 19.55, feet: 21.35, skid: 22.9, heads: 27.85,
  runA: 30.85, runB: 32.25, phGate: 35.75, face: 37.1, phDive: 39.25, card: 42.6, phTentA: 51.7, tinOpen: 54.7, phTentB: 56.3, dogFood: 59.75, phTentC: 61.1,
  o1: 62.75, o2: 65.4, o3: 68.45, end: DUR };
const FRZ = 8.5, KICK = 22.25, SNAP = 28.85, RUN0 = 30.98, GREEN = 43.15, STAMP = 45.6, DIVE = 40.0, LAND = 40.46, SLAM0 = 41.25, SLAM = 41.55;
export const NEEDS_BG = [];   // BG08 (checkpoint) and BG09 (tent) now exist: every shot is built
export const SFX = [
  ['day_slam', C13], ['footsteps_slow', 0.2], ['night_whoosh', 1.5], ['night_whoosh', 2.5], ['footsteps_dash', 3.7], ['duck_thump', 4.9], ['hedge_rustle', 6.05], ['hedge_rustle', 7.25],
  ['footsteps_slow', 7.55], ['zombie_groan_far', 8.35], ['pencil_ticks', 10.95], ['pencil_cross', 12.0], ['gasp_small', 13.98],
  ['footsteps_brisk', 19.55], ['can_kick_tink', KICK], ['can_skid_scrape', 22.3], ['can_rattle_stop', 25.5], ['echo_can', 25.5], ['echo_can', 25.9], ['echo_can', 26.3], ['echo_can', 26.7],
  ['heads_snap_whoosh', SNAP], ['zombie_groans_many', SNAP + 0.3], ['sprint_start_scuff', RUN0], ['footsteps_sprint', RUN0 + 0.1], ['zombie_groans_chase', 31.4], ['wind_rush', T.runB],
  ['zombie_lunge', 34.0], ['zombie_lunge', 35.1], ['gate_motor_alarm', T.phGate], ['zombie_groans_close', 37.2], ['heavy_breathing', 37.1], ['dive_whoosh', 40.2], ['gate_slam', SLAM], ['zombies_hit_fence', SLAM + 0.3], ['body_land_thud', LAND],
  ['counter_ding_green', GREEN], ['stamp_thud', STAMP], ['pop', 47.5], ['pop', 49.1], ['shh', 50.3], ['tent_night_ambience', T.phTentA], ['tin_ring_pull', 55.05], ['tin_lid_peel', 55.2],
  ['silence', 57.7], ['sad_squelch', C16 + 0.1], ['spoon_scrape', 61.5], ['whoosh_title', T.o1 + 0.1], ['pencil_circle', 66.25], ['pop', 66.9], ['whoosh_title', T.o3 + 0.1], ['subscribe_click', 71.05], ['shh', 72.3],
];

// ---------- small helpers ----------
const sY = (y) => (1.9 * (y - 715)) / 345;                  // street perspective: character scale at ground y (same as hook.js)
const CAR = [[150, 935], [150, 760], [200, 700], [262, 668], [470, 655], [560, 664], [618, 696], [700, 735], [705, 935]];   // the grey car, to stand behind
const HEDGE = [[1550, 737], [1555, 705], [1570, 680], [1600, 656], [1630, 646], [1665, 643], [1690, 656], [1702, 685], [1706, 720], [1706, 850], [1470, 850], [1470, 730]];
function cutout(g, A, poly) { g.save(); g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); g.drawImage(A.bg.street, 0, 0, W, H); g.restore(); }
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
// distance of a walk that eases in (ein) and out (eout) and holds a constant pace between
function seg(t, a, b, D, ein = 0.4, eout = 0.4) { const TT = b - a, x = clamp(t - a, 0, TT), full = TT - ein / 2 - eout / 2;
  const s = x < ein ? x * x / (2 * ein) : x > TT - eout ? full - (TT - x) ** 2 / (2 * eout) : x - ein / 2; return D * s / full; }
const lagsOf = (drive, t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });
// Vini with the approved walk settings, breathing and "alive" always on
const vini = (g, A, t, o, energy = 1) => drawVini(g, A.vini, withAlive({ t, smoothGait: true, walkSquash: 0.25, breath: breathe(t, 1.4, 0.5), ...o }, t, { energy }));
const gShadow = (g, x, y, s, a = 0.36) => { g.fillStyle = `rgba(25,20,16,${a})`; g.beginPath(); g.ellipse(x, y + 2, 52 * s, 10 * s, 0, 0, 7); g.fill(); };
const hud = (g, t) => dayCounter(g, 30, t, C13);
const STRIDE = 58, S1 = sY(985) * 0.9, GY = 985;            // the approved sneak walk; Vini's scale and ground line in the foreground of the street
const TIRED_L = [2, 68, 14], TIRED_R = [6, 60, 24];         // creeping hands, hanging lower than in the market (he is worn out)
function swayArms(aL, aR, step, wk) { const out = [aL.slice(), aR.slice()]; out.forEach((h, i) => { const sw = Math.sin(Math.PI * (step + i)) * wk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }); return out; }

// a zombie whose facing can be anything between profile (face = ±1) and straight at the camera (face → 0)
function zom(g, A, t, z, face, o = {}) { const dir = Math.abs(face) < 0.03 ? (face < 0 ? -0.03 : 0.03) : face, k = Math.abs(dir), sway = Math.sin(t * 1.6 + z.seed * 2.1) * 4, r = o.reach ?? 0;
  const arms = [[lerp(36, 8, k), lerp(10, 6, k) + sway - 14 * r, lerp(70, 76, k)], [8, lerp(30, 12, k) - sway - 10 * r, 70]];
  drawZombie(g, A.zombie, { kind: z.kind, x: z.x, y: z.y, s: z.s, t, seed: z.seed, dir, walkDist: o.walkDist ?? 0.001, arms, shake: o.shake, expr: o.expr, b: o.b }); }
// a zombie that actually keeps up for a while: long dragging strides, arms out, driven straight through the rig
function chaser(g, A, t, o) { const sw = Math.sin(t * 2.3 + o.seed * 3) * 5;
  drawVini(g, A.zombie, { x: o.x, y: o.y, s: o.s, t: t + o.seed * 3, skin: KINDS[o.kind], expr: 'groan', blink: false, turn: 0.92, look: [0.6, 0.1], walkDist: o.dist, stride: 62, lift: 12, drag: 1,
    arms: [[8, 2 + sw, 80], [8, 12 - sw, 72]], lean: -15 + Math.sin(Math.PI * o.dist / 62) * 3, headTilt: Math.sin(t * 5 + o.seed) * 7 - 4, shadowA: 0.3 }); }

// ---------- props ----------
// a drink can lying on its side (flat fills, ink outline, one highlight)
function can(g, x, y, s, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#3f8f7a'; g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); g.roundRect(-17, -9.5, 34, 19, 4); g.fill(); g.stroke();
  g.fillStyle = '#e9e2cf'; g.fillRect(-6, -9.5, 9, 19); g.fillStyle = '#b9bdc0'; g.fillRect(-17, -8, 4.5, 16); g.fillRect(12.5, -8, 4.5, 16);
  g.beginPath(); g.roundRect(-17, -9.5, 34, 19, 4); g.stroke(); g.strokeStyle = alpha('#ffffff', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(-11, -5.5); g.lineTo(11, -5.5); g.stroke(); g.restore(); }
// expanding "sound" rings (drawn inside the camera): n rings born every `every` seconds from t0
function rings(g, x, y, t, t0, o = {}) { const { n = 3, every = 0.28, speed = 300, life = 0.9, col = '#f4efe2', w = 4, a0 = -Math.PI, a1 = Math.PI, flat = 0.5, amp = 0.8 } = o;
  for (let i = 0; i < n; i++) { const dt = t - t0 - i * every; if (dt <= 0 || dt >= life) continue; const k = dt / life;
    g.strokeStyle = alpha(col, amp * (1 - k) ** 1.5); g.lineWidth = w * (1 - 0.5 * k); g.beginPath(); g.ellipse(x, y, 20 + speed * dt, (20 + speed * dt) * flat, 0, a0, a1); g.stroke(); } }
// a marker word that wobbles (groans)
function groan(g, str, x, y, t, t0, o = {}) { const k = pop(t, t0) * (1 - sm(t, t0 + (o.hold ?? 1.6), t0 + (o.hold ?? 1.6) + 0.3)); if (k <= 0) return;
  note(g, str, x + Math.sin(t * 9 + x) * 3, y + Math.cos(t * 7 + y) * 3, { size: o.size ?? 60, rot: (o.rot ?? -0.06) + Math.sin(t * 5 + x) * 0.02, k, color: o.color ?? RED }); }

// ---------- 1: "Vini has been walking for two days" — the worn-out sneak walk, two nights flick past ----------
function shWalk(g, t, A) { const k = sm(t, 0, 3.7), d = 77 * (t + 3), x = 335 + 77 * S1 * t, step = d / STRIDE;
  camBegin(g, A.bg.street, { z: lerp(1.18, 1.3, k), x: lerp(840, 930, k), y: 790 });
  const gl = bump(t, 1.7, 2.6);                                         // a look back over his shoulder
  vini(g, A, t, { x, y: GY, s: S1, turn: 0.72, expr: exprTrack(t, [[0, 'exhausted'], [1.75, 'worried'], [2.75, 'exhausted']]), look: [lerp(0.5, -0.9, gl), 0.25 * (1 - gl)],
    lean: -8, crouch: 2.5, headTilt: -5 + 9 * gl - 1.2 * Math.sin(2 * Math.PI * step), walkDist: d, stride: STRIDE, lift: 11, arms: swayArms(TIRED_L, TIRED_R, step, 1),
    hairLag: 1.2 * Math.sin(2 * Math.PI * step), packLag: 3 * Math.sin(2 * Math.PI * step - 0.6), breath: breathe(t, 1.1, 0.8) }, 0.3);
  camEnd(g);
  const n1 = bump(t, 1.45, 2.3) ** 0.6, n2 = bump(t, 2.45, 3.3) ** 0.6; nightGrade(g, 0.92 * Math.max(n1, n2));
  if (n1 > 0.05) note(g, 'night 1', W * 0.5, H * 0.17, { size: 58, color: '#cfd8ff', glow: false, k: n1 });
  if (n2 > 0.05) note(g, 'night 2', W * 0.5, H * 0.17, { size: 58, color: '#cfd8ff', glow: false, k: n2 });
  note(g, '2 days on foot', W * 0.73, H * 0.3, { size: 68, k: pop(t, 2.75), rot: 0.03 });
  vignette(g, 0.36); hud(g, t); fade(g, 1 - sm(t, 0, 0.35)); }

// ---------- 2: "moving from car to car" — he darts across the road and ducks behind the grey car ----------
const S2 = sY(900), dist2 = (t) => -seg(t, 3.5, 4.85, 470 / S2, 0.15, 0.3), x2 = (t) => 910 + dist2(t) * S2;
function shCar(g, t, A) { const k = sm(t, T.car, T.hedge);
  const c = camBegin(g, A.bg.street, { z: lerp(1.3, 1.42, k), x: lerp(700, 640, k), y: 770 });
  const zs = sY(800), tr = strideSpeed(zs, 0.7) * (t - 2); zom(g, A, t, { kind: 'teen', x: 1100 - tr, y: 800, s: zs, seed: 3.3 }, -1, { walkDist: -tr / zs });
  const run = clamp((dist2(t - 0.05) - dist2(t + 0.05)) / (0.1 * 380)), step = -dist2(t) / 70, sw = Math.sin(Math.PI * step) * run;
  const drop = move(t, 0, 92, 4.84, { feel: 'heavy', windUp: 0.04 }) - move(t, 0, 47, 5.22, { feel: 'snappy', windUp: 0.1 });      // duck right down, then peek over the roof
  const peek = sm(t, 5.2, 5.4);
  g.save(); g.beginPath(); g.rect(0, 0, W, 928); g.clip();
  vini(g, A, t, { x: x2(t), y: 900 + drop, s: S2, turn: track(t, [[4.8, -0.72], [5.2, 0.45]]), expr: exprTrack(t, [[0, 'determined'], [4.86, 'scared'], [5.3, 'worried']]),
    look: t < 5.2 ? [-0.7, 0.1] : [track(t, [[5.3, 0.9], [5.5, 0.9], [5.58, -0.8]]), -0.1], lean: 15 * run - 3 * peek, crouch: 6 * run, walkDist: dist2(t), stride: 70, lift: 20, walkMix: 1 - sm(t, 4.85, 5.05),
    arms: [[6, 34 - 14 * sw, 16 + 34 * sw], [6, 34 + 14 * sw, 16 - 34 * sw]], headTilt: -6 * run + 4 * peek, ...lagsOf(x2, t), breath: breathe(t, 0.8, 0.8), shadow: t < 4.6 }, 0.4 * peek);
  g.restore();
  cutout(g, A, CAR);
  camEnd(g);
  const [nx, ny] = toScreen(c, 430, 640), k1 = pop(t, 4.05);
  if (k1 > 0) { note(g, 'car → car', W * 0.62, H * 0.2, { size: 70, k: k1 }); arrowTo(g, W * 0.55, H * 0.25, nx + 90, ny - 30, so(t, 4.1, 4.5), RED, -30); }
  vignette(g, 0.38); hud(g, t); }

// ---------- 3: "hiding in gardens" — he comes up behind a hedge, checks both ways, sinks again ----------
function shHedge(g, t, A) { const k = sm(t, T.hedge, T.freeze), s = 0.66, vx = 1648;
  const c = camBegin(g, A.bg.street, { z: lerp(2.15, 2.32, k), x: lerp(1480, 1503, k), y: 705 });
  const up = move(t, 0, 1, 6.02, { feel: 'snappy', windUp: 0.12 }) - move(t, 0, 1, 7.22, { feel: 'heavy', windUp: 0.06 });
  g.save(); g.beginPath(); g.rect(0, 0, W, 846); g.clip();
  vini(g, A, t, { x: vx, y: 800 + (1 - up) * 78, s, turn: track(t, [[6.3, -0.5], [6.62, -0.5], [6.82, 0.5]]), expr: exprTrack(t, [[0, 'scared'], [6.1, 'worried'], [7.2, 'scared']]),
    look: [track(t, [[6.25, -0.9], [6.6, -0.9], [6.7, 0.9]]), -0.15], headTilt: 3 * Math.sin(t * 2.2), arms: ['relaxed', 'relaxed'], shadow: false, breath: breathe(t, 0.9, 0.7) }, 0.4);
  g.restore();
  cutout(g, A, HEDGE);
  for (let i = 0; i < 6; i++) { const dt = t - 6.04 - hash(i) * 0.06; if (dt <= 0 || dt > 0.9) continue; const a = -Math.PI / 2 + (hash(i + 20) - 0.5) * 2.2, v = 60 + hash(i + 40) * 50;     // a few leaves knocked loose
    g.save(); g.translate(vx + (hash(i + 9) - 0.5) * 40 + Math.cos(a) * v * dt, 650 + Math.sin(a) * v * dt + 120 * dt * dt); g.rotate(dt * 8 + i); g.globalAlpha = 1 - dt / 0.9; g.fillStyle = i % 2 ? '#3d4a2c' : '#55623a'; g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, 7); g.fill(); g.restore(); }
  camEnd(g);
  const [hx, hy] = toScreen(c, vx, 615), k1 = pop(t, 6.3) * (1 - sm(t, 7.2, 7.45));
  if (k1 > 0) { note(g, 'garden → garden', W * 0.36, H * 0.24, { size: 70, k: k1 }); arrowTo(g, W * 0.47, H * 0.29, hx - 70, hy - 20, so(t, 6.35, 6.7)); }
  vignette(g, 0.4); hud(g, t); }

// ---------- 4: "freezing every time he hears a groan" — halts mid-step, one foot in the air, while one drifts past ----------
const D4 = STRIDE * 3.5, dist4 = (t) => seg(t, 6.5, FRZ + 0.1, D4, 0.3, 0.12), x4 = (t) => 560 + dist4(t) * S1, speed4 = (t) => clamp((dist4(t + 0.05) - dist4(t - 0.05)) / (0.1 * 96));
const lean4 = (t) => -8 * speed4(t) - 3 + 9 * startle(t - FRZ) + trackSpring(t, [[0, 0], [FRZ + 0.05, 5]], { feel: 'heavy', windUp: 0.05 });
function shFreeze(g, t, A) { const k = sm(t, T.freeze, T.ticks), x = x4(t), fz = startle(t - FRZ), held = sm(t, FRZ, FRZ + 0.3);
  const wide = { z: lerp(1.22, 1.32, k), x: lerp(960, 1000, k), y: 790 };
  const c = camBegin(g, A.bg.street, punches(t, wide, [[FRZ + 0.1, 0.75, { z: 2.0, x: x + 30, y: 660 }, 0.45]]), camShake(t, 3, FRZ, 0.3));
  const zs = sY(806), tr = strideSpeed(zs, 0.9) * (t - 6), zx = 1215 - tr; zom(g, A, t, { kind: 'worker', x: zx, y: 806, s: zs, seed: 5.2 }, -1, { walkDist: -tr / zs });
  const step = dist4(t) / STRIDE, wk = speed4(t);
  const aL = armSpring(t, [[0, TIRED_L], [FRZ - 0.02, 'out'], [FRZ + 0.5, [30, 40, 10]]], { feel: 'snappy', windUp: 0.05 }), aR = armSpring(t, [[0, TIRED_R], [FRZ, 'out'], [FRZ + 0.55, [52, 30, 30]]], { delay: 0.05 });
  for (const [h, ph] of [[aL[1], 0], [aR[1], 1]]) { const sw = Math.sin(Math.PI * (step + ph)) * wk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }
  const wob = held * Math.sin(t * 3.1) * (1 + 0.5 * Math.sin(t * 7.3));      // balancing on one leg
  vini(g, A, t, { x, y: GY, s: S1, turn: track(t, [[FRZ, 0.72], [FRZ + 0.25, 0.5]]), expr: exprTrack(t, [[0, 'exhausted'], [FRZ, 'terror'], [FRZ + 0.9, 'scared']]), look: t < FRZ ? [0.5, 0.2] : [lerp(0.5, 0.95, so(t, FRZ, FRZ + 0.1)), -0.25],
    lean: lean4(t) + 1.6 * wob, headTilt: overlap(lean4, t, 0.09, 0.8) - 5 * (1 - held) - 1.2 * Math.sin(2 * Math.PI * step) * wk - 5 * fz, hipX: -2 * fz - 1.5 * wob, crouch: 2.5 + 4 * bump(t, FRZ - 0.04, FRZ + 0.45),
    walkDist: dist4(t), stride: STRIDE, lift: 13, arms: [aL, aR], squash: 0.8 * fz, shake: 0.22 * held, ...lagsOf((tt) => x4(tt) - lean4(tt) * 4, t), breath: breathe(t, 1.1, 0.8) * (1 - 0.85 * held) }, 0.25 * (1 - held));
  camEnd(g);
  const [gx, gy] = toScreen(c, zx, 806 - zs * 330);
  groan(g, 'grrroooan…', gx + 40, gy - 30, t, FRZ - 0.15, { size: 62, hold: 3 });
  if (t > FRZ + 0.9) note(g, '(statue mode)', W * 0.3, H * 0.33, { size: 56, color: '#2a2622', k: pop(t, FRZ + 0.95), rot: 0.02 });
  vignette(g, 0.38 + 0.1 * held); hud(g, t); }

// ---------- 5: "Thirty days of doing almost everything right" — ten ticks, three crosses ----------
function shTicks(g, t) { notebook(g, t); const t0 = T.ticks;
  writeOn(g, '30 days.  10 rules.', W / 2, 230, (t - t0 - 0.03) / 0.5, { size: 96 });
  for (let i = 0; i < 10; i++) { const x = 335 + i * 139, y = 440, at = t0 + 0.5 + i * 0.085, k = clamp((t - at) / 0.16);
    g.save(); g.globalAlpha = clamp((t - t0 - 0.2 - i * 0.03) / 0.15); g.strokeStyle = alpha(INK, 0.7); g.lineWidth = 4; g.beginPath(); g.roundRect(x - 48, y - 48, 96, 96, 8); g.stroke();
    g.font = '700 40px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a2622'; g.fillText(`${i + 1}`, x, y + 84); g.restore();
    tick(g, x + 2, y + 4, 36 * (1 + 0.25 * bump(t, at, at + 0.2)), k); }
  writeOn(g, '…almost.', 420, 660, (t - t0 - 1.5) / 0.3, { size: 80, color: RED, rot: -0.03 });
  [['day 3', 'the tin'], ['day 7', 'the fridge'], ['day 18', 'the candle']].forEach(([d, w], i) => { const x = 800 + i * 310, at = t0 + 1.72 + i * 0.2;
    cross(g, x, 650, 34, (t - at) / 0.16); writeOn(g, d, x, 735, (t - at - 0.1) / 0.2, { size: 46, color: RED, pen: false }); writeOn(g, w, x, 790, (t - at - 0.18) / 0.22, { size: 46, pen: false }); });
  fade(g, 1 - sm(t, t0, t0 + 0.12)); }

// ---------- 6: "Then he sees it." — he stops, stares, straightens ----------
const dist6 = (t) => seg(t, 12.6, 13.95, STRIDE * 2, 0.3, 0.3), x6 = (t) => 760 + dist6(t) * S1, SEE = 13.98;
const lean6 = (t) => -9 + trackSpring(t, [[0, 0], [SEE, 12]], { feel: 'heavy', windUp: 0.08 });
function shSees(g, t, A) { const k = sm(t, T.sees, T.phReveal), x = x6(t), st = startle(t - SEE), up = sm(t, SEE, SEE + 0.4);
  const wide = { z: lerp(1.5, 1.62, k), x: lerp(900, 940, k), y: 740 };
  camBegin(g, A.bg.street, punches(t, wide, [[SEE + 0.12, 9, { z: 2.35, x: x + 40, y: 640 }]]));
  const step = dist6(t) / STRIDE, wk = clamp((dist6(t + 0.05) - dist6(t - 0.05)) / (0.1 * 96));
  const aL = armSpring(t, [[0, TIRED_L], [SEE + 0.05, 'relaxed'], [SEE + 0.62, 'chest']], { feel: 'snappy' }), aR = armSpring(t, [[0, TIRED_R], [SEE + 0.1, 'relaxed'], [SEE + 0.55, 'point']], { delay: 0.05 });
  for (const [h, ph] of [[aL[1], 0], [aR[1], 1]]) { const sw = Math.sin(Math.PI * (step + ph)) * wk; h[2] += sw * 9; h[1] -= Math.abs(sw) * 3; }
  vini(g, A, t, { x, y: GY, s: S1, turn: track(t, [[SEE, 0.72], [SEE + 0.25, 0.52]]), expr: exprTrack(t, [[0, 'exhausted'], [SEE, 'shock'], [SEE + 0.6, 'happy']]), look: [lerp(0.5, 0.95, so(t, SEE - 0.06, SEE + 0.06)), lerp(0.3, -0.45, so(t, SEE - 0.06, SEE + 0.06))],
    lean: lean6(t), headTilt: overlap(lean6, t, 0.09, 0.8) - 5 * (1 - up) + 4 * up - 1.2 * Math.sin(2 * Math.PI * step) * wk, crouch: 2.5 * (1 - up) + 3 * bump(t, SEE - 0.05, SEE + 0.3), walkDist: dist6(t), stride: STRIDE, lift: 11,
    walkMix: 1 - sm(t, 13.95, 14.3), arms: [aL, aR], squash: 0.7 * st, ...lagsOf((tt) => x6(tt) - lean6(tt) * 4, t), breath: breathe(t, 1.0, 0.8) }, 0.5);
  camEnd(g);
  note(g, '…no way.', W * 0.27, H * 0.3, { size: 72, color: '#2a2622', k: pop(t, SEE + 0.5), rot: 0.03 });
  vignette(g, 0.38); hud(g, t); }

// ---------- 7 + 8 + 9: 200 m, the can, the skid ----------
const FP = 165, FSTR = 64;                                               // the relieved, careless walk: quicker and longer
const dist7 = (t) => FSTR * 20.55 + FP * (t < KICK ? t - KICK : 0.05 * (1 - Math.exp(-(t - KICK) / 0.05)));     // stops dead on the can, mid-step
const x7 = (t) => 776 + (dist7(t) - dist7(KICK)) * S1;
const walk7 = (t) => ({ x: x7(t), y: GY, s: S1, turn: 0.72, walkDist: dist7(t), stride: FSTR, lift: 15, smoothGait: true, walkSquash: 0.25 });
function canHome(A) { const o = walk7(KICK), a = boneScreen(A.vini, o, 'foot_l'), b = boneScreen(A.vini, o, 'foot_r'), f = a[1] < b[1] ? a : b; return [f[0] + 40 * S1, GY - 11 * S1, f]; }
const lean7 = (t) => -6 + trackSpring(t, [[0, 0], [KICK + 0.02, 13], [KICK + 0.6, 9]], { feel: 'heavy', windUp: 0.03 });
// Vini for the three shots: striding along looking up at the checkpoint, then frozen mid-step in horror
function vini7(g, A, t, extra = {}) { const st = startle(t - KICK), held = sm(t, KICK, KICK + 0.25), step = dist7(t) / FSTR, sw = Math.sin(Math.PI * step) * (1 - held);
  const aL = armSpring(t, [[0, [6, 84, 2]], [KICK, 'out'], [KICK + 0.9, [26, 30, 16]], [25.2, [-2, -26, 30]]], { feel: 'snappy', windUp: 0.04 }), aR = armSpring(t, [[0, [6, 84, 2]], [KICK + 0.02, 'out'], [KICK + 0.95, [40, 22, 30]], [25.25, [-8, -30, 30]]], { delay: 0.05 });
  aL[1][2] += 26 * sw; aR[1][2] -= 26 * sw; aL[1][1] -= 5 * Math.abs(sw); aR[1][1] -= 5 * Math.abs(sw);
  const dartX = t < KICK ? 0.8 : t < 25.3 ? lerp(0.8, 0.95, so(t, KICK, KICK + 0.08)) : track(t, [[25.3, 0.95], [25.7, 0.95], [25.78, -0.9], [26.3, -0.9], [26.38, 0.9], [26.9, 0.9], [26.98, -0.6], [27.5, -0.6], [27.58, 0.3]]);
  vini(g, A, t, { ...walk7(t), turn: track(t, [[KICK + 0.1, 0.72], [KICK + 0.4, 0.5]]), expr: exprTrack(t, [[0, 'happy'], [KICK + 0.03, 'shock'], [KICK + 0.7, 'terror'], [25.3, 'scared'], [26.8, 'terror']]), look: [dartX, t < KICK ? -0.5 : lerp(-0.5, 0.35, so(t, KICK + 0.03, KICK + 0.15)) * (1 - sm(t, 25, 25.4))],
    lean: lean7(t) + held * 1.2 * Math.sin(t * 3.3), headTilt: overlap(lean7, t, 0.09, 0.8) + 4 * (1 - held) - 7 * st + 3 * held * Math.sin(t * 2.1), hipX: -2.5 * st, crouch: 5 * bump(t, KICK - 0.02, KICK + 0.4) + 3 * held,
    arms: [aL, aR], squash: st, shake: held * (0.25 + 0.2 * sm(t, 25, 26)), ...lagsOf((tt) => x7(tt) - lean7(tt) * 4, t), breath: breathe(t, t > KICK ? 0.7 : 1.1, 0.7), ...extra }, 0.3 * (1 - held)); }
function sh200(g, t, A) { const k = sm(t, T.m200, T.feet), x = x7(t), [cx, cy] = canHome(A);
  camBegin(g, A.bg.street, { z: lerp(1.42, 1.55, k), x: x + 250, y: 760 });
  can(g, cx, cy, S1 * 1.05, 0.05); vini7(g, A, t); camEnd(g);
  bigText(g, '200 m', W * 0.72, H * 0.2, { size: 150, k: pop(t, C13 + 19.45, 0.25), rot: -0.03 });
  arrowTo(g, W * 0.6, H * 0.31, W * 0.9, H * 0.31, so(t, C13 + 19.6, C13 + 20.0), '#ece6d6', 0);
  note(g, 'checkpoint  →', W * 0.75, H * 0.37, { size: 54, color: '#ece6d6', glow: false, k: pop(t, C13 + 19.75) });
  note(g, '(not looking down)', W * 0.25, H * 0.24, { size: 56, color: '#2a2622', k: pop(t, 20.75), rot: 0.03 });
  vignette(g, 0.36); hud(g, t); }
function shFeet(g, t, A) { const k = sm(t, T.feet, T.skid), [cx, cy, foot] = canHome(A), dt = t - KICK;
  const c = camBegin(g, A.bg.street, { z: lerp(3.5, 3.9, k), x: lerp(cx - 120, cx - 20, k), y: 960, blur: 1.2 }, camShake(t, 5, KICK, 0.3));
  let px = cx, py = cy, rot = 0.05;
  if (dt > 0) { px = cx + 470 * (1 - Math.exp(-dt * 4.2)); py = cy - Math.abs(Math.sin(dt * 15)) * 16 * Math.exp(-dt * 3.5); rot = 0.05 + dt * 24; }
  gShadow(g, px, GY - 4 * S1, 0.34 * S1, 0.3);
  if (dt > 0) { g.strokeStyle = alpha('#f4efe2', 0.5 * Math.exp(-dt * 2)); g.lineWidth = 2; g.setLineDash([14, 9]); g.beginPath(); g.moveTo(cx, GY - 3); g.lineTo(px - 20, GY - 3); g.stroke(); g.setLineDash([]); }
  can(g, px, py, S1 * 1.05, rot); vini7(g, A, t);
  if (dt > 0 && dt < 0.22) { g.strokeStyle = alpha('#fff3c0', 1 - dt / 0.22); g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.55, r0 = 10 + dt * 90, r1 = r0 + 14; g.beginPath(); g.moveTo(cx - 18 + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx - 18 + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); } }
  camEnd(g);
  const [sx, sy] = toScreen(c, cx, cy), k1 = pop(t, 21.5) * (1 - sm(t, KICK - 0.05, KICK + 0.05));
  if (k1 > 0) { note(g, 'can.', sx + 250, sy - 330, { size: 84, k: k1 }); arrowTo(g, sx + 220, sy - 280, sx + 30, sy - 60, so(t, 21.55, 21.9), RED, 40); }
  bigText(g, 'TINK!', sx + 120, sy - 300, { size: 150, k: pop(t, KICK, 0.14), rot: -0.07, color: '#fff3c0' });
  vignette(g, 0.42); hud(g, t); }
// the skid: a long decelerating slide up and across the road to the far kerb
const SK1 = [1160, 992], SK2 = [1392, 884], skP = (t) => clamp((1 - Math.exp(-0.9 * (t - 22.6))) / (1 - Math.exp(-2.7)));
const skAt = (p, P0) => [(1 - p) ** 2 * P0[0] + 2 * (1 - p) * p * SK1[0] + p * p * SK2[0], (1 - p) ** 2 * P0[1] + 2 * (1 - p) * p * SK1[1] + p * p * SK2[1]];
const SKR = 'skrrrrrrrrtt';
function shSkid(g, t, A) { const [cx, cy] = canHome(A), P0 = [cx + 30, cy], p = skP(t), [x, y] = skAt(p, P0), sc = sY(y + 11) / sY(GY), out = sm(t, 24.75, 25.75), done = t > 25.6;
  const follow_ = { z: 2.05, x: x - 30, y: y - 70 }, wide = { z: lerp(1.1, 1.17, sm(t, 25, T.heads)), x: 985, y: 770 };
  const cam = { z: lerp(follow_.z, wide.z, out), x: lerp(follow_.x, wide.x, out), y: lerp(follow_.y, wide.y, out) };
  const c = camBegin(g, A.bg.street, punches(t, cam, [[26.75, 9, { z: 2.3, x: x7(t) + 30, y: 650 }]]), camShake(t, 4 * (1 - p), 22.9, 2.6));
  drawCrowd(g, A, t);
  // scrape mark + sparks + the stretched lettering along its path
  g.lineCap = 'round'; g.strokeStyle = alpha('#d9d3c4', 0.42); g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const q = skAt(p * i / 40, P0); i ? g.lineTo(q[0], q[1] + 9 * sc) : g.moveTo(q[0], q[1] + 9); } g.stroke();
  g.strokeStyle = alpha('#d9d3c4', 0.25); g.lineWidth = 2; g.setLineDash([18, 12]); g.beginPath(); for (let i = 0; i <= 40; i++) { const q = skAt(p * i / 40, P0); i ? g.lineTo(q[0], q[1] + 2) : g.moveTo(q[0], q[1] + 2); } g.stroke(); g.setLineDash([]);
  [...SKR].forEach((ch, i) => { const f = 0.05 + i * 0.079; if (p < f) return; const q = skAt(f, P0), q2 = skAt(f + 0.02, P0), ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]), ls = sY(q[1] + 11) / sY(GY), at = 22.6 - Math.log(1 - f * (1 - Math.exp(-2.7))) / 0.9;
    const k = pop(t, at, 0.18), jit = Math.sin(t * 31 + i * 2.1) * 2.5 * (1 - sm(t, at + 0.3, at + 1.2));
    g.save(); g.translate(q[0], q[1] - 62 * ls + jit); g.rotate(ang + (hash(i + 3) - 0.5) * 0.3); g.scale(k * ls, k * ls); g.font = `400 ${i < 2 ? 62 : 56}px "Permanent Marker", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.strokeStyle = INK; g.lineWidth = 9; g.strokeText(ch, 0, 0); g.fillStyle = '#fff3c0'; g.fillText(ch, 0, 0); g.restore(); });
  if (!done) for (let i = 0; i < 5; i++) { const ph = (t * 9 + i * 0.37) % 1; g.fillStyle = alpha('#ffd98a', (1 - ph) * (1 - p)); g.beginPath(); g.arc(x - 20 * sc - ph * 46 * sc, y + 6 * sc - ph * (14 + 16 * hash(i)) * sc, 2.6 * sc, 0, 7); g.fill(); }
  // the noise: rings off the can, then answering arcs off the house fronts on both sides, further and further up the street
  rings(g, x, y, t, 22.9, { n: 9, every: 0.3, speed: 260, life: 0.8, amp: 0.7 * (1 - 0.5 * p) });
  const ECHO = [[420, 560, 0, 62, 'skrrt…'], [1545, 548, 1, 54, 'skrrt…'], [640, 612, 0, 44, 'skrt…'], [1330, 610, 1, 38, 'skrt…'], [1010, 652, 2, 30, 'krt…']];
  ECHO.forEach(([ex, ey, side, , ], i) => { const at = 25.45 + i * 0.4; rings(g, ex + (side === 0 ? -70 : side === 1 ? 70 : 0), ey + 20, t, at, { n: 3, every: 0.16, speed: 230 - i * 30, life: 0.75, flat: 1, a0: side === 0 ? -1.1 : side === 1 ? Math.PI - 1.1 : 0.3, a1: side === 0 ? 1.1 : side === 1 ? Math.PI + 1.1 : Math.PI - 0.3, w: 5 - i * 0.5 }); });
  gShadow(g, x, y + 8 * sc, 0.34 * S1 * sc, 0.3);
  can(g, x, y - Math.abs(Math.sin((t - 22.6) * 13)) * 7 * (1 - p) ** 2 * sc, S1 * 1.05 * sc, 0.05 + p * 17 + settle(t, 25.6, 0.5, 16, 5));
  vini7(g, A, t);
  camEnd(g);
  ECHO.forEach(([ex, ey, , size, word], i) => { const at = 25.45 + i * 0.4, [sx, sy] = toScreen(c, ex, ey); note(g, word, sx, sy - 40, { size: size * 1.35, color: '#fff3c0', glow: false, k: pop(t, at) * (1 - sm(t, at + 1.0, at + 1.5)) * (1 - sm(t, 26.7, 26.9)), rot: (i % 2 ? 0.05 : -0.05) }); });
  if (t > 26.95) note(g, 'every. house.', W * 0.24, H * 0.26, { size: 74, color: '#2a2622', k: pop(t, 26.98), rot: -0.03 });
  vignette(g, 0.38 + 0.08 * out); hud(g, t); }

// ---------- 10 + 11: every head turns — then he bolts ----------
const ZS = [   // x, y, kind, seed, facing before the snap (±1 = wandering in profile), walking?
  { x: 965, y: 776, kind: 'teen', seed: 1.3, pre: -1, walk: 1 }, { x: 1120, y: 816, kind: 'office', seed: 2.9, pre: 0.55 }, { x: 1175, y: 866, kind: 'worker', seed: 4.1, pre: 1, walk: 1 },
  { x: 1430, y: 840, kind: 'teen', seed: 6.4, pre: -0.75 }, { x: 1610, y: 932, kind: 'office', seed: 7.7, pre: 1 }, { x: 345, y: 905, kind: 'worker', seed: 9.2, pre: -0.7, car: 1 }, { x: 905, y: 752, kind: 'office', seed: 11.5, pre: 0.9 }];
const zState = (z, t) => { const s = sY(z.y), tr = z.walk ? strideSpeed(s, 0.55) * (Math.min(t, SNAP) - 26) * Math.sign(z.pre) : 0; return { ...z, x: z.x + tr, s, tr }; };
const VX = 787;                                                          // where the can stopped him
function drawCrowd(g, A, t, lurch = 0) { const snap = so(t, SNAP, SNAP + 0.2);
  const list = ZS.map((z) => zState(z, t)).sort((a, b) => a.y - b.y);
  for (const pass of [1, 0]) { for (const z of list) { if (!!z.car !== !!pass) continue; const adv = lurch * (z.car ? 0.3 : 1) * z.s * 34, dx = VX - z.x, dy = GY - z.y, dl = Math.hypot(dx, dy);
      zom(g, A, t, { ...z, x: z.x + adv * dx / dl, y: z.y + adv * dy / dl * (z.car ? 0 : 1), s: sY(z.y + adv * dy / dl * (z.car ? 0 : 1)) }, lerp(z.pre, Math.sign(z.pre) * 0.03, snap),
        { walkDist: z.walk ? z.tr / z.s + lurch * 30 * Math.sign(z.pre) : 0.001, shake: snap > 0 && snap < 1 ? 1.2 : 0.25 * sm(t, SNAP + 0.2, SNAP + 0.6), expr: t > SNAP + 0.05 ? 'groan' : 'zombie', reach: sm(t, SNAP + 0.35, SNAP + 0.8) }); }
    if (pass) cutout(g, A, CAR); }
  return list; }
function shHeads(g, t, A) { const k = sm(t, T.heads, T.runA), st = startle(t - SNAP - 0.12), low = sm(t, 28.0, 28.4);
  const c = camBegin(g, A.bg.street, { z: lerp(1.1, 1.2, k), x: lerp(985, 1010, k), y: 775 }, camShake(t, 6, SNAP, 0.4));
  const list = drawCrowd(g, A, t);
  const aL = armSpring(t, [[0, [-2, -26, 30]], [SNAP + 0.14, 'out'], [SNAP + 0.6, [16, 36, 10]]], { feel: 'snappy' }), aR = armSpring(t, [[0, [-8, -30, 30]], [SNAP + 0.16, 'out'], [SNAP + 0.65, [22, 30, 24]]], { delay: 0.05 });
  vini(g, A, t, { ...walk7(27), turn: 0.5, walkMix: 1 - low, expr: exprTrack(t, [[0, 'scared'], [SNAP + 0.12, 'terror']]), look: t < SNAP ? [track(t, [[28.0, -0.6], [28.3, -0.6], [28.38, 0.9]]), 0] : [0.9, -0.1],
    lean: 9 - 5 * low + 8 * st, headTilt: -6 * st, crouch: 3 + 3 * low + 5 * st, squash: st, shake: 0.4 + 0.3 * sm(t, SNAP, SNAP + 0.3), arms: [aL, aR], hairLag: 2.5 * st, breath: breathe(t, 0.6, 0.9) }, 0.3);
  camEnd(g);
  for (const z of list) { const [sx, sy] = toScreen(c, z.x, z.y - z.s * 345); bigText(g, '!', sx, sy - 6, { size: 40 + 46 * z.s, k: pop(t, SNAP + 0.04, 0.16) * (1 - sm(t, SNAP + 1.1, SNAP + 1.4)), color: '#ff4a3a', rot: 0.06 }); }
  const [vx, vy] = toScreen(c, VX, GY - S1 * 300);
  note(g, '…oh no.', vx - 250, vy - 20, { size: 76, color: '#2a2622', k: pop(t, SNAP + 0.75), rot: -0.04 });
  vignette(g, 0.4 + 0.12 * sm(t, SNAP, SNAP + 0.5)); hud(g, t); }

// the sprint: long stride, big lift, strong forward lean, arms pumping, a hop while the legs are split
const RSTR = 96, RV = 520;
function sprint(g, A, t, o) { const p = o.dist / RSTR, c = Math.sin(Math.PI * p), fl = Math.cos(Math.PI * p) ** 2, m = o.mix ?? 1, hop = fl * 9 * m;
  if (o.shadow !== false) gShadow(g, o.x, o.y, o.s * (1 - 0.15 * fl * m), 0.32);
  return vini(g, A, t, { x: o.x, y: o.y - hop * o.s, s: o.s, turn: 0.75, walkDist: o.dist, stride: RSTR, lift: 30, lean: (-20 + 2.5 * c) * m + (o.lean ?? 0), crouch: 3 * m + (o.crouch ?? 0), headTilt: (9 - 2 * c) * m + (o.headTilt ?? 0),
    arms: [[6, 24 - 17 * c, 14 + 42 * c], [8, 24 + 17 * c, 14 - 42 * c]], hairLag: 2.5 * m, packLag: (7 + 3 * Math.sin(2 * Math.PI * p - 0.8)) * m, expr: o.expr ?? 'terror', look: o.look ?? [0.9, 0], shake: 0.25, breath: breathe(t, 0.45, 1), shadow: false }, 0); }
const distA = (t) => { const dt = Math.max(0, t - RUN0); return RV * (dt - 0.3 * (1 - Math.exp(-dt / 0.3))); };
function shRunA(g, t, A) { const x = VX + distA(t) * S1, go = sm(t, RUN0, RUN0 + 0.3), wind = bump(t, T.runA, RUN0 + 0.08);
  camBegin(g, A.bg.street, { z: lerp(1.2, 1.36, sm(t, T.runA, T.runB)), x: lerp(1010, x + 120, sm(t, RUN0, T.runB)), y: 780 }, camShake(t, 3, RUN0, 1.3));
  drawCrowd(g, A, t, Math.max(0, t - 30.2));
  if (t < RUN0) vini(g, A, t, { ...walk7(27), turn: lerp(0.5, 0.75, sm(t, T.runA, RUN0)), walkMix: 0, expr: 'terror', look: [0.9, 0], lean: 9 + 8 * wind, crouch: 6 + 9 * wind, arms: [[16, 36, 10], [22, 30, 24]], shake: 0.6 }, 0);
  else { sprint(g, A, t, { x, y: GY, s: S1, dist: distA(t), mix: go, crouch: 9 * (1 - go), lean: 17 * (1 - go) });
    for (let i = 0; i < 4; i++) { const dt = t - RUN0 - i * 0.05; if (dt > 0 && dt < 0.5) { g.fillStyle = alpha('#8f897c', 0.3 * (1 - dt / 0.5)); g.beginPath(); g.ellipse(VX - 30 - dt * 120 - i * 12, GY - 8 - dt * 30 - i * 5, 10 + dt * 40, 6 + dt * 22, 0, 0, 7); g.fill(); } } }
  camEnd(g);
  bigText(g, 'RUN.', W * 0.2, H * 0.27, { size: 190, k: pop(t, C14 + 0.25, 0.2), color: '#ff4a3a', rot: -0.05 });
  vignette(g, 0.44); hud(g, t); }

// tracking background: the terrace at the end of the street, scaled up, tiled (mirrored) and smeared sideways — it only ever reads as speed
function trackBg(g, A, off, o = {}) { const { gy = 800, sc = 3.2, dark = 0.3 } = o, SX = 790, SY2 = 300, SW = 400, SH = 425, TW = SW * sc, top = gy - SH * sc, per = 2 * TW, base = -(((off % per) + per) % per);
  g.fillStyle = '#4a4744'; g.fillRect(0, 0, W, H);
  for (let c = 0; c < 7; c++) { g.globalAlpha = 1 / (c + 1); for (let k = 0; k * TW + base - c * 30 < W; k++) { const x = base + k * TW - c * 30; if (x + TW < 0) continue;
      if (k % 2) { g.save(); g.translate(x + TW, top); g.scale(-1, 1); g.drawImage(A.bg.street, SX, SY2, SW, SH, 0, 0, TW + 2, SH * sc); g.restore(); } else g.drawImage(A.bg.street, SX, SY2, SW, SH, x, top, TW + 2, SH * sc); } }
  g.globalAlpha = 1; g.fillStyle = linGrad(g, 0, gy - 8, 0, H, ['#6b665c', [0.06, '#57534b'], [0.1, '#34322f'], '#211f1d']); g.fillRect(0, gy - 8, W, H - gy + 8);
  g.fillStyle = alpha('#000', dark); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const sp = 1500 + hash(i) * 1600, len = 160 + hash(i + 50) * 420, y = i < 12 ? gy + 16 + hash(i + 80) * (H - gy - 20) : hash(i + 80) * (gy - 30), x = W + len - ((off * sp / 700 + hash(i + 7) * 3000) % (W + 2 * len));
    g.strokeStyle = alpha(i < 12 ? '#8d877a' : '#f4efe2', i < 12 ? 0.35 : 0.14 + 0.1 * hash(i + 3)); g.lineWidth = i < 12 ? 3 : 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke(); } }
const RS = 2.0, groundOff = (t) => distA(t) * RS;                      // how far the world has scrolled past (screen px)
function shRunB(g, t, A) { const k = sm(t, T.runB, T.phGate), s = RS, gy = 1004, off = groundOff(t), vx = lerp(900, 1090, k);
  const pz = { t0: 33.15, y: gy - 80, s: 1.55, kind: 'office', seed: 2.2 }; pz.x = 2150 - (off - groundOff(pz.t0));      // one lunges at him from ahead: he ducks under it
  const near = bump(pz.x, vx - 360, vx + 360) ** 2, sh = camShake(t, 3);
  g.save(); g.translate(sh[0], sh[1]);
  trackBg(g, A, off, { gy: 880, sc: 4.4 });
  { const tr = strideSpeed(pz.s, 0.9) * (t - pz.t0); zom(g, A, t, { ...pz, x: pz.x - tr }, -1, { walkDist: -tr / pz.s, expr: 'groan', reach: near }); }
  [{ x0: 500, kind: 'worker', seed: 1.1, v: 0.87, y: gy - 30, s: 1.85 }, { x0: 290, kind: 'teen', seed: 4.4, v: 0.8, y: gy + 20, s: 2.0 }, { x0: 90, kind: 'office', seed: 6.3, v: 0.91, y: gy - 8, s: 1.92 }].forEach((c) => {
    chaser(g, A, t, { x: c.x0 - (1 - c.v) * (off - groundOff(T.runB)) - (vx - 900) * 0.2, y: c.y, s: c.s, kind: c.kind, seed: c.seed, dist: distA(t) * c.v * RS / c.s }); });
  sprint(g, A, t, { x: vx, y: gy, s, dist: distA(t), crouch: 12 * near, lean: -6 * near, headTilt: -8 * near, look: [0.9, 0.3 * near], expr: exprTrack(t, [[0, 'terror'], [33.3, 'determined'], [34.35, 'terror'], [35.1, 'determined']]) });
  g.restore();
  for (let i = 0; i < 9; i++) { const ph = (t * (2.2 + hash(i) * 1.5) + hash(i + 30)) % 1, y = H * (0.25 + 0.6 * hash(i + 11)); g.strokeStyle = alpha('#fff', 0.5 * (1 - ph)); g.lineWidth = 3 + 3 * hash(i + 5); g.lineCap = 'round'; g.beginPath(); g.moveTo(vx - 190 - ph * 700, y); g.lineTo(vx - 420 - ph * 900, y); g.stroke(); }
  note(g, 'new personal best', W * 0.72, H * 0.17, { size: 76, color: '#fff3c0', glow: false, k: pop(t, C14 + 2.3) * (1 - sm(t, 35.2, 35.5)), rot: 0.03 });
  vignette(g, 0.48); hud(g, t); }
// "The groans are right behind him." — close on his face, hands and groans crowding in from the left
function shFace(g, t, A) { const k = sm(t, T.face, T.phDive), s = 4.2, off = groundOff(t), d = distA(t), p = d / RSTR, bob = Math.cos(Math.PI * p) ** 2 * 30, back = bump(t, 37.75, 38.55) ** 0.6;
  const sh = camShake(t, 5); g.save(); g.translate(sh[0] + lerp(40, -30, k), sh[1]);
  trackBg(g, A, off * 1.6, { gy: 760, sc: 5, dark: 0.5 });
  const close = sm(t, T.face, T.phDive + 0.4);
  [{ x: lerp(60, 330, close), kind: 'office', seed: 6.3, y: 1840, s: 3.7 }, { x: lerp(-260, 60, close), kind: 'teen', seed: 4.4, y: 1960, s: 4.0 }].forEach((c) => { g.save(); g.filter = 'blur(3px)'; chaser(g, A, t, { ...c, dist: d * 0.95 * RS / c.s * 2 }); g.restore(); });
  const c = Math.sin(Math.PI * p);
  vini(g, A, t, { x: 1150, y: 1690 - bob, s, turn: 0.75 - 0.4 * back, walkDist: d, stride: RSTR, lift: 30, lean: -16 + 2.5 * c, headTilt: 7 - 2 * c + 5 * back, arms: [[6, 24 - 17 * c, 14 + 42 * c], [8, 24 + 17 * c, 14 - 42 * c]],
    hairLag: 2.5, packLag: 7 + 3 * Math.sin(2 * Math.PI * p - 0.8), expr: exprTrack(t, [[0, 'determined'], [37.7, 'scared'], [38.6, 'terror']]), look: [0.9 - 1.9 * back, 0], shake: 0.4, breath: breathe(t, 0.4, 1), shadow: false }, 0);
  for (let i = 0; i < 7; i++) { const ph = (t * 1.9 + hash(i + 60)) % 1; g.fillStyle = alpha('#bfe3f2', 0.85 * (1 - ph)); g.beginPath(); g.ellipse(1040 - ph * (300 + 240 * hash(i)), 520 + (hash(i + 5) - 0.5) * 280 + ph * ph * 140 - bob, 15 * (1 - 0.4 * ph), 7 * (1 - 0.4 * ph), -0.3, 0, 7); g.fill(); }
  g.restore();
  groan(g, 'GRRRRRR', 380, 250, t, C14 + 6.3, { size: 130, rot: -0.1, hold: 2.6 }); groan(g, 'hhhrrrgh', 250, 480, t, C14 + 6.9, { size: 96, rot: 0.05, hold: 2 }); groan(g, 'grooooan', 520, 660, t, C14 + 7.45, { size: 84, rot: -0.03, hold: 1.5 });
  for (let i = 0; i < 12; i++) { const ph = (t * (2.6 + hash(i) * 1.5) + hash(i + 30)) % 1, y = H * (0.08 + 0.84 * hash(i + 11)); g.strokeStyle = alpha('#fff', 0.4 * (1 - ph)); g.lineWidth = 3 + 4 * hash(i + 5); g.lineCap = 'round'; g.beginPath(); g.moveTo(W - ph * 1500, y); g.lineTo(W - 420 - ph * 1900, y); g.stroke(); }
  vignette(g, 0.55); }

// ---------- 12: DAY 30 turns green. Stamp: SURVIVED. Then the three things that did it ----------
const GREEN_C = '#2a8a3a', CREAM = '#ece6d6';
function card(g, glow = 0.1, gx = W / 2, gy = H * 0.45) { g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H); g.fillStyle = radGrad(g, gx, gy, 0, 900, [alpha('#6a5a3a', glow), alpha('#6a5a3a', 0)]); g.fillRect(0, 0, W, H); }
function plate(g, col) { g.save(); g.rotate(-0.04); g.fillStyle = alpha('#000', 0.45); g.beginPath(); g.roundRect(-222, -83, 460, 190, 18); g.fill();
  g.fillStyle = CREAM; g.beginPath(); g.roundRect(-230, -95, 460, 190, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
  g.font = '400 150px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText('DAY 30', 0, 10); g.restore(); }
function stamp(g, t, t0) { const dt = t - t0; if (dt < 0) return; const k = clamp(dt / 0.11), sc = lerp(3.4, 1, ease.in(k)) * (1 + settle(t, t0 + 0.11, 0.04, 34, 10)), col = '#c8262e';
  g.save(); g.rotate(-0.15); g.scale(sc, sc); g.globalAlpha = clamp(k * 1.4) * 0.94; g.lineJoin = 'round';
  if (k >= 1) for (let i = 0; i < 18; i++) { const a = hash(i + 200) * 6.283, e = so(t, t0 + 0.11, t0 + 0.3), r = 1 + e * (0.12 + 0.5 * hash(i + 230)); g.fillStyle = col; g.beginPath(); g.arc(Math.cos(a) * 455 * r, Math.sin(a) * 135 * r, (3 + 11 * hash(i + 260)) * (0.4 + 0.6 * e), 0, 7); g.fill(); }
  g.strokeStyle = col; g.lineWidth = 14; g.beginPath(); g.roundRect(-440, -112, 880, 224, 22); g.stroke(); g.lineWidth = 4; g.beginPath(); g.roundRect(-418, -90, 836, 180, 12); g.stroke();
  g.font = '400 150px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText('SURVIVED', 0, 8); g.restore(); }
// icons on paper discs (same flat-fill + ink-outline look as the props)
function disc(g, x, y, k, draw, label, t) { if (k <= 0) return; g.save(); g.translate(x, y + Math.sin(t * 1.7 + x) * 4); g.scale(k, k); g.rotate(Math.sin(t * 1.1 + x) * 0.02);
  g.fillStyle = alpha('#000', 0.4); g.beginPath(); g.arc(6, 9, 118, 0, 7); g.fill(); g.fillStyle = CREAM; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 4.5; g.lineJoin = 'round'; g.lineCap = 'round'; draw(g); g.restore(); note(g, label, x, y + 172, { size: 54, color: CREAM, glow: false, k, rot: 0 }); }
function bathIcon(g) { g.fillStyle = '#5aa8d8'; g.beginPath(); g.roundRect(-66, -18, 132, 30, 6); g.fill();
  g.fillStyle = '#f6f3ea'; g.beginPath(); g.moveTo(-80, -8); g.lineTo(80, -8); g.quadraticCurveTo(80, 50, 40, 50); g.lineTo(-40, 50); g.quadraticCurveTo(-80, 50, -80, -8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#5aa8d8'; g.beginPath(); g.moveTo(-72, -8); g.quadraticCurveTo(-36, -22, 0, -8); g.quadraticCurveTo(36, 6, 72, -8); g.lineTo(72, -4); g.lineTo(-72, -4); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-46, 50); g.lineTo(-52, 66); g.moveTo(46, 50); g.lineTo(52, 66); g.moveTo(56, -8); g.lineTo(56, -48); g.quadraticCurveTo(56, -62, 40, -62); g.lineTo(34, -62); g.lineTo(34, -52); g.stroke();
  g.fillStyle = '#5aa8d8'; for (const [dx, dy] of [[34, -38], [34, -24]]) { g.beginPath(); g.ellipse(dx, dy, 3.5, 5.5, 0, 0, 7); g.fill(); } }
function radioIcon(g) { g.beginPath(); g.moveTo(-40, -30); g.lineTo(30, -76); g.stroke(); g.fillStyle = '#8a5a3a'; g.beginPath(); g.roundRect(-72, -30, 144, 88, 10); g.fill(); g.stroke();
  g.fillStyle = '#2a2622'; g.beginPath(); g.arc(-30, 14, 28, 0, 7); g.fill(); g.strokeStyle = '#8a8a8a'; g.lineWidth = 3; for (const r of [10, 19]) { g.beginPath(); g.arc(-30, 14, r, 0, 7); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = '#e9e2cf'; g.beginPath(); g.roundRect(14, -14, 44, 22, 4); g.fill(); g.stroke(); g.strokeStyle = RED; g.beginPath(); g.moveTo(40, -12); g.lineTo(40, 6); g.stroke();
  g.strokeStyle = INK; g.fillStyle = '#d8a248'; for (const dx of [24, 48]) { g.beginPath(); g.arc(dx, 34, 9, 0, 7); g.fill(); g.stroke(); } }
function shhIcon(g) { g.fillStyle = '#e0d5c8'; g.beginPath(); g.arc(0, 6, 78, 0, 7); g.fill(); g.stroke();
  g.fillStyle = INK; for (const dx of [-30, 30]) { g.beginPath(); g.ellipse(dx, -14, 7, 10, 0, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(-14, 36); g.lineTo(14, 36); g.stroke(); g.lineWidth = 15; g.beginPath(); g.moveTo(2, 64); g.lineTo(2, 12); g.stroke(); g.lineWidth = 4.5; g.beginPath(); g.arc(4, 78, 15, 0, 7); g.fill(); }
function shCard(g, t) { const sh = camShake(t, 12, STAMP + 0.1, 0.35), m = sm(t, 46.3, 47.0), gk = sm(t, GREEN, GREEN + 0.22);
  g.save(); g.translate(sh[0], sh[1]); card(g, 0.1 + 0.1 * gk);
  g.save(); g.translate(W / 2, lerp(470, 300, m)); const gs = lerp(1.25, 0.86, m) * (1 + 0.012 * Math.sin(t * 1.3)); g.scale(gs, gs);
  if (gk > 0) { const r = 300 + 500 * so(t, GREEN, GREEN + 0.7); g.fillStyle = radGrad(g, 0, -110, 0, r, [alpha('#3fd45a', 0.3 * (1 - sm(t, GREEN + 0.3, GREEN + 1.4)) + 0.08), alpha('#3fd45a', 0)]); g.beginPath(); g.arc(0, -110, r, 0, 7); g.fill(); }
  g.save(); g.translate(0, -110); const ps = pop(t, T.card + 0.1, 0.3) * (1 + 0.13 * bump(t, GREEN, GREEN + 0.32)); g.scale(ps, ps); plate(g, mix(RED, GREEN_C, gk));
  tick(g, 300, -6, 46, (t - GREEN - 0.12) / 0.22, '#3fd45a'); g.restore();
  g.save(); g.translate(30, 122); stamp(g, t, STAMP); g.restore();
  g.restore();
  disc(g, 520, 760, pop(t, 47.5), bathIcon, 'a bath full of water', t); disc(g, 960, 760, pop(t, 49.1), radioIcon, 'a radio', t); disc(g, 1400, 760, pop(t, 50.3), shhIcon, 'keeping quiet', t);
  if (t > 50.3) note(g, 'shhh', 1535, 650, { size: 50, color: CREAM, glow: false, k: pop(t, 50.45), rot: 0.12 });
  g.restore(); vignette(g, 0.4); fade(g, 1 - sm(t, T.card, T.card + 0.25)); fade(g, sm(t, T.phTentA - 0.25, T.phTentA)); }

// ---------- the tin insert (no background needed): cut into the tent shot ----------
// open 0..1 = the ring-pull lid peels back; reveal 0..1 = we tip over the top and see what is inside; label = k of the red "dog food" note.
export function tinInsert(g, t, { open = 0, reveal = 0, label = 0 } = {}) { g.fillStyle = '#0b0907'; g.fillRect(0, 0, W, H);
  g.fillStyle = radGrad(g, W * 0.68, H * 0.3, 0, 1000, [alpha('#e8a850', 0.3), alpha('#e8a850', 0.08), alpha('#e8a850', 0)]); g.fillRect(0, 0, W, H);          // lamp light, as in the tent
  const cx = W * 0.44, by = 870, S = 10.5, hw = 15 * S, ry = lerp(34, 92, reveal), hh = lerp(44 * S, 34 * S, reveal), ty = by - hh, wob = Math.sin(t * 1.4) * 0.008;
  g.save(); g.translate(cx, by); g.rotate(wob); g.translate(-cx, -by);
  g.fillStyle = alpha('#000', 0.5); g.beginPath(); g.ellipse(cx + 20, by + 8, hw * 1.25, 30, 0, 0, 7); g.fill();
  if (reveal < 0.02) tin(g, cx, by - 22 * S, S, 0, { label: false });
  else { g.fillStyle = '#b9bdc0'; g.strokeStyle = INK; g.lineWidth = 3.5 * S * 0.35; g.beginPath(); g.moveTo(cx - hw, ty); g.lineTo(cx - hw, by - 20); g.quadraticCurveTo(cx, by + 30 * reveal + 10, cx + hw, by - 20); g.lineTo(cx + hw, ty); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = alpha(INK, 0.35); g.lineWidth = 6; for (const f of [0.22, 0.8]) { g.beginPath(); g.ellipse(cx, ty + hh * f, hw, ry * 0.5, 0, 0.05, Math.PI - 0.05); g.stroke(); }
    g.strokeStyle = alpha('#fff', 0.55); g.lineWidth = 12; g.beginPath(); g.moveTo(cx - hw + 46, ty + ry * 0.75); g.lineTo(cx - hw + 46, by - 60); g.stroke(); }
  // the top: rim, then the dark inside (or what is in there)
  g.lineWidth = 12; g.strokeStyle = INK; g.fillStyle = open > 0.05 ? '#2a1c12' : '#c9cdd0'; g.beginPath(); g.ellipse(cx, ty, hw, ry, 0, 0, 7); g.fill(); g.stroke();
  if (reveal > 0.02) { g.save(); g.beginPath(); g.ellipse(cx, ty, hw - 10, ry - 8, 0, 0, 7); g.clip(); g.fillStyle = '#5a3a22'; g.fillRect(cx - hw, ty - ry * 0.5, hw * 2, ry * 2);
    for (let i = 0; i < 11; i++) { const px = cx + (hash(i + 300) - 0.5) * hw * 1.7, py = ty - ry * 0.25 + hash(i + 320) * ry * 1.1; g.fillStyle = i % 3 ? '#7a4f30' : '#8c5f3c'; g.strokeStyle = alpha(INK, 0.6); g.lineWidth = 4; g.beginPath(); g.roundRect(px - 30, py - 14, 54 + 20 * hash(i), 30, 9); g.fill(); g.stroke(); }
    g.fillStyle = alpha('#f2d9a8', 0.3); g.beginPath(); g.ellipse(cx - 40, ty - ry * 0.1, 46, 9, -0.1, 0, 7); g.fill(); g.restore(); g.lineWidth = 12; g.strokeStyle = INK; g.beginPath(); g.ellipse(cx, ty, hw, ry, 0, 0, 7); g.stroke(); }
  // the lid: hinged on the right, peeling up and over with the ring pull
  const th = ease.inOut(open) * 2.25 + (open > 0 && open < 1 ? Math.sin(t * 40) * 0.015 : 0);
  g.save(); g.translate(cx + hw, ty); g.rotate(-th); const lr = ry * (1 - 0.55 * Math.sin(Math.min(th, Math.PI / 2))) + 4;
  g.fillStyle = th > 1.45 ? '#a9adb0' : '#d3d6d8'; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.ellipse(-hw, 0, hw, lr, 0, 0, 7); g.fill(); g.stroke();
  if (th <= 1.45) { g.lineWidth = 9; g.strokeStyle = INK; g.beginPath(); g.ellipse(-hw * 1.45, -lr * 0.1, 30, 13 * (lr / ry), 0, 0, 7); g.stroke(); g.strokeStyle = alpha('#fff', 0.5); g.lineWidth = 5; g.beginPath(); g.ellipse(-hw, 0, hw * 0.7, lr * 0.55, 0, 3.4, 4.6); g.stroke(); }
  g.restore(); g.restore();
  if (open > 0.04 && open < 1 && reveal < 0.02) note(g, 'krrrk', cx - 330, ty - 150, { size: 80, color: '#fff3c0', glow: false, k: clamp(open * 6) * (1 - sm(open, 0.8, 1)), rot: -0.1 });
  if (label > 0) { note(g, '…dog food.', W * 0.76, H * 0.3, { size: 124, k: label, rot: 0.04 }); arrowTo(g, W * 0.7, H * 0.38, cx + hw * 0.5, ty - ry * 0.2, clamp(label * 1.4 - 0.2), RED, -40); }
  vignette(g, 0.55); }
function shTinOpen(g, t) { const k = sm(t, T.tinOpen, T.phTentB), z = lerp(1, 1.08, k); g.save(); g.translate(W * 0.44, H * 0.5); g.scale(z, z); g.translate(-W * 0.44, -H * 0.5);
  tinInsert(g, t, { open: clamp((t - 55.05) / 0.85) }); g.restore(); note(g, '(no label)', W * 0.74, H * 0.62, { size: 60, color: CREAM, glow: false, k: pop(t, 54.85) * (1 - sm(t, 55.9, 56.2)), rot: 0.03 });
  fade(g, 1 - sm(t, T.tinOpen, T.tinOpen + 0.12)); }
function shDogFood(g, t) { const k = sm(t, T.dogFood, T.phTentC), z = lerp(1.1, 1.0, so(t, T.dogFood, T.dogFood + 0.5)) * lerp(1, 1.04, k); g.save(); g.translate(W * 0.44, H * 0.4); g.scale(z, z); g.translate(-W * 0.44, -H * 0.4);
  tinInsert(g, t, { open: 1, reveal: 1, label: pop(t, C16 + 0.12, 0.25) }); g.restore(); }

// ---------- outro ----------
function shO1(g, t) { card(g, 0.14); const t0 = C16 + 3.12;
  [['WOULD', 0, 420, 330], ['YOU', 0.2, 860, 330], ['MAKE', 0.42, 1250, 330], ['IT', 0.62, 1590, 330]].forEach(([w, d, x, y]) => bigText(g, w, x, y + Math.sin(t * 1.5 + x) * 4, { size: 150, k: pop(t, t0 + d * 0.9 - 0.3, 0.22), color: CREAM, rot: -0.02 }));
  bigText(g, 'TO DAY 30?', W / 2, 610 + Math.sin(t * 1.5) * 4, { size: 250, k: pop(t, t0 + 1.25, 0.25), color: '#ff4a3a', rot: -0.03 });
  vignette(g, 0.42); fade(g, 1 - sm(t, T.o1, T.o1 + 0.2)); }
function shO2(g, t) { card(g, 0.12); const t0 = T.o2, PICK = 2;
  for (let i = 0; i < 30; i++) { const col = i % 10, row = (i / 10) | 0, x = 285 + col * 150, y = 250 + row * 150, k = pop(t, t0 + 0.05 + i * 0.018, 0.2); if (k <= 0) continue;
    g.save(); g.translate(x, y); g.scale(k, k); g.rotate((hash(i + 400) - 0.5) * 0.05); g.fillStyle = i === 29 ? '#d9ecd0' : CREAM; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-60, -55, 120, 110, 10); g.fill(); g.stroke();
    g.font = '400 62px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = i === 29 ? GREEN_C : '#2a2622'; g.fillText(`${i + 1}`, 0, 6); g.restore(); }
  const cx = 285 + PICK * 150, cy = 250, kc = clamp((t - 66.25) / 0.38), pts = []; for (let i = 0; i <= 44; i++) { const a = -2.2 + i / 40 * 6.283, r = 1 + 0.06 * Math.sin(a * 2 + 1) + i * 0.002; pts.push([cx + Math.cos(a) * 92 * r, cy + Math.sin(a) * 78 * r]); }
  inkPath(g, pts, kc, 10, RED);
  const bk = pop(t, 66.9);
  if (bk > 0) { g.save(); g.translate(390, 790 + Math.sin(t * 2) * 5); g.scale(bk, bk); g.fillStyle = CREAM; g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); g.roundRect(-110, -75, 220, 130, 26); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-50, 52); g.lineTo(-72, 100); g.lineTo(-4, 52); g.closePath(); g.fill(); g.stroke(); g.fillStyle = CREAM; g.fillRect(-52, 44, 50, 10);
    g.fillStyle = '#2a2622'; for (const dx of [-50, 0, 50]) { g.beginPath(); g.arc(dx, -10, 13 + 3 * Math.sin(t * 8 - dx * 0.05), 0, 7); g.fill(); } g.restore(); }
  bigText(g, 'COMMENT YOUR DAY', 1130, 790, { size: 110, k: pop(t, 66.95, 0.22), color: CREAM, rot: -0.02 });
  arrowTo(g, 1130, 880, 1130, 1010, so(t, 67.2, 67.5), RED, 0);
  note(g, '(be honest.)', 1480, 930, { size: 56, color: '#9a958a', glow: false, k: pop(t, 67.6), rot: 0.03 });
  vignette(g, 0.42); }
const SHH = 72.12;
function shO3(g, t, A) { card(g, 0.14, W / 2, H * 0.4); const t0 = T.o3, sub = pop(t, 71.05, 0.25);
  note(g, 'NEXT:', 330, 170, { size: 84, color: '#9a958a', glow: false, k: pop(t, t0 + 0.12), rot: -0.03 });
  bigText(g, 'CAN VINI SURVIVE', W * 0.46, 330 + Math.sin(t * 1.4) * 4, { size: 150, k: pop(t, t0 + 0.3, 0.22), color: CREAM, rot: -0.02 });
  bigText(g, '… ?', W * 0.82, 480, { size: 300, k: pop(t, t0 + 0.9, 0.25) * (1 + 0.04 * Math.sin(t * 4)), color: '#ff4a3a', rot: 0.06 + Math.sin(t * 2) * 0.03 });
  if (sub > 0) { g.save(); g.translate(660, 640); g.scale(sub * (1 + 0.03 * Math.sin(t * 6)), sub * (1 + 0.03 * Math.sin(t * 6))); g.rotate(-0.02); g.fillStyle = alpha('#000', 0.45); g.beginPath(); g.roundRect(-262, -62, 540, 150, 28); g.fill();
    g.fillStyle = '#d42b2b'; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.roundRect(-270, -75, 540, 150, 28); g.fill(); g.stroke();
    g.font = '400 84px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('SUBSCRIBE', 0, 6); g.restore();
    arrowTo(g, 1130, 560, 960, 630, so(t, 71.2, 71.5), CREAM, 30); }
  note(g, '(quietly.)', 660, 790, { size: 70, color: CREAM, glow: false, k: pop(t, SHH + 0.3), rot: 0.02 });
  // Vini comes up from the bottom of the frame, one finger to his lips
  if (t > SHH - 0.25) { const up = move(t, 0, 1, SHH - 0.2, { feel: 'heavy', windUp: 0.05 }), s = 2.25;
    const aR = armSpring(t, [[0, 'relaxed'], [SHH + 0.12, [-21, -14, 30]]], { feel: 'soft' });
    vini(g, A, t, { x: 1420, y: H + 150 * s + (1 - up) * 640, s, turn: 0.08, expr: exprTrack(t, [[0, 'worried'], [SHH + 0.35, 'neutral']]), look: [track(t, [[SHH, -0.7], [SHH + 0.35, -0.7], [SHH + 0.43, 0.6], [SHH + 0.75, 0.6], [SHH + 0.83, 0]]), 0], headTilt: 4 * sm(t, SHH + 0.3, SHH + 0.6), arms: ['relaxed', aR], shadow: false,
      hairLag: clamp(-follow((tt) => move(tt, 0, 1, SHH - 0.2, { feel: 'heavy', windUp: 0.05 }) * 30, t, { freq: 3.4, damp: 0.6 }), -2.5, 2.5),
      props: { right: (g2, h, info) => { const fk = sm(t, SHH + 0.2, SHH + 0.42); if (fk <= 0) return; g2.strokeStyle = '#17131a'; g2.lineCap = 'round'; g2.lineWidth = 7 * info.s; g2.beginPath(); g2.moveTo(h[0], h[1]); g2.lineTo(h[0] + 1 * info.s, h[1] - 19 * info.s * fk); g2.stroke(); } } }, 0.5);
    note(g, 'shhh', 1660, 770, { size: 64, color: CREAM, glow: false, k: pop(t, SHH + 0.5), rot: 0.1 }); }
  vignette(g, 0.42); fade(g, sm(t, DUR - 0.4, DUR)); }

// ---------- the checkpoint (BG08) ----------
// head-on view down the road; the gateway is the gap between the two posts. No gate is painted, so the sliding gate is drawn here.
const HZ = 690, sC = (y) => 0.0052 * (y - HZ);                           // character scale at ground y (posts ≈ 2 people tall)
const GX0 = 760, GX1 = 1190, GTOP = 482, GBOT = 816, GWID = GX1 - GX0;
const GAPK = 0.6;
const gateK = (t) => (t < SLAM0 ? track(t, [[35.8, 0], [37.1, 0.3], [39.25, 0.5], [DIVE, GAPK], [SLAM0, GAPK + 0.04]], (x) => x) : lerp(GAPK + 0.04, 1, ease.in(clamp((t - SLAM0) / (SLAM - SLAM0)))));
const LIGHTS = [[375, 262, 1], [655, 310, 0.8], [1307, 310, 0.8], [1548, 265, 1]];
function floodGlow(g, t, boost = 0) { g.save(); g.globalCompositeOperation = 'lighter';
  LIGHTS.forEach(([x, y, k], i) => { const fl = 0.8 + 0.12 * Math.sin(t * 23 + i * 2) + 0.08 * Math.sin(t * 61 + i) + boost, r = 190 * k * (1 + 0.25 * boost);
    g.fillStyle = radGrad(g, x, y, 0, r, [alpha('#fff6d8', 0.5 * fl), alpha('#ffe9a8', 0.14 * fl), alpha('#ffe9a8', 0)]); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  g.restore(); }
function beacon(g, t, on) { const x = 745, y = 418, fl = on * (0.5 + 0.5 * Math.sin(t * 19)) ** 2;
  g.fillStyle = '#2a2a28'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.rect(x - 9, y, 18, 8); g.fill(); g.stroke();
  g.fillStyle = mix('#7a4a14', '#ffb020', fl); g.beginPath(); g.roundRect(x - 7, y - 15, 14, 16, [7, 7, 0, 0]); g.fill(); g.stroke();
  if (fl > 0.02) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, x, y - 8, 0, 120, [alpha('#ffb020', 0.75 * fl), alpha('#ff8a10', 0.2 * fl), alpha('#ff8a10', 0)]); g.beginPath(); g.arc(x, y - 8, 120, 0, 7); g.fill(); g.restore(); } }
// the sliding mesh gate: k = 0 open (parked behind the left fence) … 1 shut against the right post
function gate(g, t, k) { if (k <= 0.002) return; const x1 = GX0 + GWID * k - 5 * Math.abs(settle(t, SLAM, 1, 38, 9)), x0 = x1 - GWID - 26, top = GTOP + 10, bot = GBOT - 8;
  g.save(); g.beginPath(); g.rect(GX0 - 4, GTOP - 20, GWID + 8, GBOT - GTOP + 40); g.clip();
  g.fillStyle = alpha('#23262a', 0.3); g.fillRect(x0, top, x1 - x0, bot - top);
  g.save(); g.beginPath(); g.rect(x0, top, x1 - x0, bot - top); g.clip(); g.lineWidth = 1.7; g.strokeStyle = alpha('#12110e', 0.72); g.beginPath();
  for (let d = -340; d < GWID + 40; d += 12) { g.moveTo(x0 + d, top); g.lineTo(x0 + d + (bot - top), bot); g.moveTo(x0 + d + (bot - top), top); g.lineTo(x0 + d, bot); } g.stroke(); g.restore();
  const bars = () => { g.beginPath(); g.rect(x0 + 5, top, x1 - x0 - 10, bot - top); g.moveTo(x1 - GWID / 2, top); g.lineTo(x1 - GWID / 2, bot); g.moveTo(x0 + 5, (top + bot) / 2); g.lineTo(x1 - 5, (top + bot) / 2); g.stroke(); };
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 11; bars(); g.strokeStyle = '#6a6d68'; g.lineWidth = 5.5; bars(); g.strokeStyle = alpha('#c9cbc4', 0.5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1 - 7, top + 6); g.lineTo(x1 - 7, bot - 6); g.stroke();
  for (const wx of [x1 - 40, x1 - GWID + 40]) { g.fillStyle = '#2b2b29'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.arc(wx, bot + 4, 8, 0, 7); g.fill(); g.stroke(); }
  g.restore(); }
// "Floodlights. Fences. Trucks. The checkpoint." — one punch per word, then the whole thing
const RV_T = [C13 + 14.8, C13 + 15.84, C13 + 16.88, C13 + 17.76];
function shReveal(g, t, A) { const i = t < RV_T[1] ? 0 : t < RV_T[2] ? 1 : t < RV_T[3] ? 2 : 3, t0 = i ? RV_T[i] : T.phReveal, t1 = i < 3 ? RV_T[i + 1] : T.m200, k = sm(t, t0, t1), pk = 1 - so(t, t0, t0 + 0.22);
  const V = [{ z: lerp(2.5, 2.75, k), x: lerp(400, 372, k), y: lerp(330, 290, k) }, { z: lerp(2.3, 2.45, k), x: lerp(330, 450, k), y: 520 }, { z: lerp(2.25, 2.4, k), x: lerp(1560, 1480, k), y: 610 }, { z: lerp(1.22, 1.06, k), x: 960, y: lerp(610, 560, k) }][i];
  V.z *= 1 + 0.1 * pk;
  camBegin(g, A.bg.checkpoint, V, camShake(t, 5, t0, 0.22));
  const on = i === 0 ? clamp((t - T.phReveal - 0.1) / 0.05) * (t < T.phReveal + 0.32 && Math.sin(t * 70) > 0.3 ? 0.35 : 1) : 1;      // the lamp stutters on
  if (i === 0 && on < 1) { g.fillStyle = alpha('#0b0d12', 0.55 * (1 - on)); g.fillRect(0, 0, W, H); }
  floodGlow(g, t, i === 0 ? 0.5 * (1 - sm(t, t0 + 0.2, t0 + 0.8)) * on - (1 - on) : 0);
  camEnd(g);
  const lab = (str, x, y, rot) => note(g, str, x, y, { size: 96, color: '#fff3c0', glow: false, k: pop(t, t0 + 0.06, 0.22), rot });
  if (i === 0) lab('floodlights.', W * 0.68, H * 0.72, -0.03); else if (i === 1) lab('fences.', W * 0.7, H * 0.2, 0.03); else if (i === 2) lab('trucks.', W * 0.3, H * 0.24, -0.03);
  else { bigText(g, 'THE CHECKPOINT', W / 2, H * 0.16, { size: 150, k: pop(t, t0 + 0.05, 0.25), color: '#fff3c0', rot: -0.02 });
    // Vini, close in the foreground, sagging with relief
    const sag = (tt) => move(tt, 0, 1, t0 + 0.45, { feel: 'heavy', windUp: 0.08 }), up = so(t, t0, t0 + 0.3), s = 2.3;
    const aR = armSpring(t, [[0, 'relaxed'], [t0 + 0.5, 'chest']], { feel: 'soft' });
    vini(g, A, t, { x: 300, y: H + 330 * s * 0.52 + (1 - up) * 300, s, turn: 0.82, expr: exprTrack(t, [[0, 'shock'], [t0 + 0.4, 'happy'], [t0 + 1.0, 'relief']]), look: [0.9, -0.3], lean: 4 - 9 * sag(t), headTilt: 6 - 10 * sag(t) + overlap((tt) => -9 * sag(tt), t, 0.09, 0.7),
      crouch: 4 * sag(t), arms: ['relaxed', aR], shadow: false, hairLag: clamp(-follow((tt) => sag(tt) * 20, t, { freq: 3.4, damp: 0.6 }), -2.5, 2.5), breath: breathe(t, 1.0, 1) }, 0.6);
    note(g, '(people. with soup.)', W * 0.7, H * 0.9, { size: 54, color: '#ece6d6', glow: false, k: pop(t, t0 + 0.75), rot: 0.02 }); }
  vignette(g, 0.4); hud(g, t); }
// "The gate is closing." — what he sees as he runs at it: the gate rolling across, the gap shrinking
function shGate(g, t, A) { const k = sm(t, T.phGate, T.face), bob = Math.abs(Math.sin(t * 9.5)) * 10;
  const c = camBegin(g, A.bg.checkpoint, { z: lerp(1.35, 1.95, k), x: lerp(960, 985, k), y: lerp(640, 655, k) - bob / 2 }, camShake(t, 4));
  floodGlow(g, t); gate(g, t, gateK(t)); beacon(g, t, 1); camEnd(g);
  const [ex, ey] = toScreen(c, GX0 + GWID * gateK(t), 650);
  bigText(g, 'CLOSING', W * 0.5, H * 0.14, { size: 150, k: pop(t, C14 + 4.95, 0.2), color: '#ffb020', rot: -0.03 });
  arrowTo(g, ex + 30, ey, ex + 130, ey, so(t, C14 + 5.2, C14 + 5.5), '#ffb020', 0);
  for (let i = 0; i < 10; i++) { const ph = (t * (2.4 + hash(i) * 1.5) + hash(i + 30)) % 1, a = hash(i + 11) * 6.283, r0 = 420 + ph * 500; g.strokeStyle = alpha('#fff', 0.3 * (1 - ph)); g.lineWidth = 3 + 3 * hash(i + 5); g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * 0.6); g.lineTo(W / 2 + Math.cos(a) * (r0 + 160), H / 2 + Math.sin(a) * (r0 + 160) * 0.6); g.stroke(); }
  vignette(g, 0.5); hud(g, t); }
// "He dives through the gap, and the gate slams shut."
const DV = { x0: 470, y0: 985, x1: 925, y1: 832, t0: 39.25 }, dvU = (t) => clamp((t - DV.t0) / (DIVE - DV.t0));
const dvPos = (u) => { const x = lerp(DV.x0, DV.x1, u), y = lerp(DV.y0, DV.y1, u); return [x, y, sC(y)]; };
const dvDist = (u) => { const a = sC(DV.y0), b = sC(DV.y1) - a; return Math.hypot(DV.x1 - DV.x0, DV.y1 - DV.y0) / b * Math.log((a + b * u) / a); };
const ZD = [{ kind: 'worker', seed: 1.1, lag: 0.95, stop: 0.97, dy: 0 }, { kind: 'office', seed: 6.3, lag: 1.25, stop: 0.8, dy: 10 }, { kind: 'teen', seed: 4.4, lag: 1.5, stop: 0.62, dy: -4 }];
function shDive(g, t, A) { const u = dvU(t), d = clamp((t - DIVE) / (LAND - DIVE)), landed = t >= LAND, sl = so(t, LAND, LAND + 0.35), imp = startle(t - LAND);
  const V = { z: lerp(1.5, 1.62, sm(t, T.phDive, DIVE)), x: lerp(900, 960, sm(t, T.phDive, DIVE)), y: 730 };
  const pk = sm(t, DIVE - 0.1, DIVE + 0.22), CL = { z: 2.25, x: 1015, y: 690 };
  const c = camBegin(g, A.bg.checkpoint, { z: lerp(V.z, CL.z, pk), x: lerp(V.x, CL.x, pk), y: lerp(V.y, CL.y, pk) }, t >= SLAM ? camShake(t, 16, SLAM, 0.45) : camShake(t, 3, LAND, 0.2));
  floodGlow(g, t);
  const flying = () => { const cx = lerp(DV.x1 + 20, 1050, d), gy = lerp(DV.y1, 806, d), s = sC(gy), rot = lerp(0.42, 1.5, so(d, 0, 0.75)), cy = gy - lerp(150, 24, d * d) * s - Math.sin(Math.PI * d) * 80 * s;
    gShadow(g, cx, gy, s * (0.7 + 0.5 * d), 0.3);
    g.save(); g.translate(cx, cy); g.rotate(rot); vini(g, A, t, { x: 0, y: 150 * s, s, turn: 0.85, expr: 'terror', look: [0.9, 0], arms: [[34, -108, 70], [40, -100, 80]], lean: -6, headTilt: -14, walkDist: 0.001, walkMix: 0, hairLag: 2.5, packLag: 8, shadow: false, blink: false }, 0); g.restore(); };
  const lying = () => { const s = sC(806), cx = 1050 + 22 * sl, up = sm(t, SLAM + 0.35, SLAM + 0.7);
    gShadow(g, cx, 808, s * 1.5, 0.3);
    g.save(); g.translate(cx, 806 - 24 * s); g.rotate(1.5 + 0.07 * imp); g.scale(1 + 0.08 * imp, 1 - 0.1 * imp);
    vini(g, A, t, { x: 0, y: 150 * s, s, turn: 0.85, expr: up > 0.5 ? 'relief' : 'exhausted', look: [0.9, 0], arms: [[10, -96 + 20 * sl, 30], [16, -90 + 150 * up * 0 + 14 * sl, 40]], lean: -3, headTilt: -8 - 16 * up, walkDist: 0.001, walkMix: 0, shadow: false, breath: breathe(t, 0.5, 1) }, 0); g.restore();
    for (let i = 0; i < 5; i++) { const dt = t - LAND - i * 0.03; if (dt > 0 && dt < 0.6) { g.fillStyle = alpha('#a9a394', 0.4 * (1 - dt / 0.6)); g.beginPath(); g.ellipse(cx + 40 + i * 14 + dt * 50, 800 - dt * 22 - (i % 2) * 6, 7 + dt * 26, 4 + dt * 14, 0, 0, 7); g.fill(); } } };
  if (landed) lying(); else if (t >= DIVE && d > 0.55) flying();
  gate(g, t, gateK(t)); beacon(g, t, t < SLAM + 0.1 ? 1 : 0.15);
  if (t >= DIVE && !landed && d <= 0.55) flying();
  if (t < DIVE) { const [x, y, s] = dvPos(u), cr = sm(t, DIVE - 0.16, DIVE); sprint(g, A, t, { x, y, s, dist: dvDist(u), crouch: 12 * cr, lean: -8 * cr, expr: 'terror' }); }
  // the ones behind him get there a beat too late
  [...ZD].sort((a, b) => a.dy - b.dy).forEach((z) => { const zu = clamp((t - DV.t0 - z.lag) / (DIVE - DV.t0) * 0.62, 0, z.stop), [x, y, s] = dvPos(zu), at = DV.t0 + z.lag + z.stop * (DIVE - DV.t0) / 0.62, hit = sm(t, at - 0.1, at + 0.15), rat = Math.sin(t * 17 + z.seed) * 3 * hit;
    if (t < DV.t0 + z.lag - 0.3) return;
    const zx = x - 90 * (1 - sm(t, DV.t0 + z.lag - 0.3, DV.t0 + z.lag)), zy = y + z.dy;
    drawVini(g, A.zombie, { x: zx, y: zy, s: s * 0.9, t: t + z.seed * 3, skin: KINDS[z.kind], expr: 'groan', blink: false, turn: 0.92, look: [0.6, 0.1], walkDist: dvDist(zu) * 0.9, stride: 62, lift: 12, drag: 1,
      arms: [[8, lerp(2, -34, hit) + rat, 80], [8, lerp(12, -14, hit) - rat, 76]], lean: lerp(-15, -9, hit) + Math.sin(t * 13 + z.seed) * 1.5 * hit, headTilt: Math.sin(t * 5 + z.seed) * 7 - 4, shake: 0.5 * hit, shadowA: 0.3 }); });
  camEnd(g);
  const [sx, sy] = toScreen(c, GX1 - 30, 560);
  bigText(g, 'SLAM!', clamp(sx - 60, 300, W - 300), sy - 150, { size: 210, k: pop(t, SLAM, 0.14) * (1 - sm(t, SLAM + 0.75, SLAM + 0.95)), color: '#fff3c0', rot: -0.06 });
  if (t > SLAM) { for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.55, dt = t - SLAM; if (dt < 0.25) { g.strokeStyle = alpha('#fff3c0', 1 - dt / 0.25); g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx + Math.cos(a) * (30 + dt * 300), sy + 60 + Math.sin(a) * (30 + dt * 300)); g.lineTo(sx + Math.cos(a) * (70 + dt * 300), sy + 60 + Math.sin(a) * (70 + dt * 300)); g.stroke(); } } }
  const [lx, ly] = toScreen(c, 1100, 740); note(g, '(made it.)', lx + 150, ly - 150, { size: 60, color: '#ece6d6', glow: false, k: pop(t, SLAM + 0.5), rot: 0.03 });
  vignette(g, 0.46); hud(g, t); }

// ---------- the tent (BG09) ----------
const TV = { x: 770, y: 985, s: 2.0 };
function lanternGlow(g, t) { const fl = 0.86 + 0.07 * Math.sin(t * 11.3) + 0.05 * Math.sin(t * 27.1 + 1) + 0.03 * Math.sin(t * 5.3);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = radGrad(g, 958, 228, 0, 330, [alpha('#ffd27a', 0.5 * fl), alpha('#ffb44a', 0.13 * fl), alpha('#ffb44a', 0)]); g.beginPath(); g.arc(958, 228, 330, 0, 7); g.fill();
  g.translate(940, 975); g.scale(1, 0.22); g.fillStyle = radGrad(g, 0, 0, 0, 620, [alpha('#ffb44a', 0.16 * fl), alpha('#ffb44a', 0)]); g.beginPath(); g.arc(0, 0, 620, 0, 7); g.fill(); g.restore(); }
// the unlabelled tin in his hand; open = lid peeled back
function handTin(g, x, y, s, rot, open) { tin(g, x, y, s, rot, { label: false }); if (!open) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#2a1c12'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -22, 14, 4.5, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#c9cdd0'; g.beginPath(); g.ellipse(17, -31, 6, 12, 0.5, 0, 7); g.fill(); g.stroke(); g.restore(); }
function spoon(g, x, y, s, rot, full) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -30); g.stroke(); g.strokeStyle = '#c9cdd0'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -30); g.stroke();
  g.fillStyle = '#c9cdd0'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, -38, 7, 10, 0, 0, 7); g.fill(); g.stroke(); if (full) { g.fillStyle = '#7a4f30'; g.beginPath(); g.ellipse(0, -39, 5, 7, 0, 0, 7); g.fill(); g.stroke(); } g.restore(); }
// Vini sitting cross-legged on the floor in the lantern's pool: the rig is drawn from the hips up, the folded stick legs are drawn here.
// act(t) → scalars; opts o override.
function tentVini(g, A, t, act, o, energy = 0.6) { const a = act(t), leanF = (tt) => act(tt).lean || 0, drive = (tt) => -(act(tt).lean || 0) * 4, s = TV.s, F = TV.y;
  const h0 = TV.y - boneScreen(A.vini, { x: 0, y: TV.y, s: 1, turn: 0.3, t: 0 }, 'thigh_l')[1];              // standing hip height (v1 units)
  const opts = withAlive({ t, smoothGait: true, x: TV.x, y: TV.y, s, shadow: false, crouch: h0 - 15 + (a.crouch || 0), turn: a.turn ?? 0.3, lean: a.lean || 0, headTilt: (a.headTilt || 0) + overlap(leanF, t, 0.09, 0.7), squash: a.squash || 0, ...lagsOf(drive, t), breath: breathe(t, 2.6, 0.6), ...o }, t, { energy });
  const hl = boneScreen(A.vini, opts, 'thigh_l'), hr = boneScreen(A.vini, opts, 'thigh_r'), L = hl[0] < hr[0] ? hl : hr, R = hl[0] < hr[0] ? hr : hl, hy = Math.max(hl[1], hr[1]);
  gShadow(g, TV.x + 6 * s, F - 2, s * 2.3, 0.5);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const leg = (hip, kx, fx, fy) => { for (const [col, w] of [[INK, 9.5 * s], ['#2b2a33', 6 * s]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(kx, F - 15 * s); g.lineTo(fx, fy); g.stroke(); }
    g.fillStyle = '#2b2a33'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(fx + Math.sign(fx - kx) * 9 * s, fy - 1 * s, 15 * s, 8 * s, 0, 0, 7); g.fill(); g.stroke(); };
  leg(R, TV.x + 100 * s, TV.x - 34 * s, F - 7 * s); leg(L, TV.x - 92 * s, TV.x + 42 * s, F - 3 * s);
  g.save(); g.beginPath(); g.rect(-4000, -4000, 12000, 4000 + hy + 9 * s); g.clip(); const pose = drawVini(g, A.vini, opts); g.restore(); return pose; }
function tentGrade(g) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = radGrad(g, 940, 560, 150, 1150, ['#ffffff', [0.45, '#d9c39a'], '#7d6a4c']); g.fillRect(0, 0, W, H); g.restore(); }
// "That night, in a tent, he finally opens…" — he turns the tin over in the lamplight
function shTentA(g, t, A) { const k = sm(t, T.phTentA, T.tinOpen), t0 = T.phTentA;
  camBegin(g, A.bg.tent, { z: lerp(1.0, 1.32, k), x: lerp(960, 880, k), y: lerp(540, 640, k) });
  const act = (tt) => ({ lean: -3 + move(tt, 0, -7, t0 + 1.5, { feel: 'heavy' }), headTilt: -4 + move(tt, 0, -9, t0 + 1.45, { feel: 'snappy' }), crouch: 3 * bump(tt, t0 + 1.4, t0 + 2.1) });
  const lift = sm(t, t0 + 1.3, t0 + 1.8), spin = move(t, 0, 1, t0 + 1.9, { feel: 'soft' }) - move(t, 0, 1, t0 + 2.55, { feel: 'soft' });
  const aL = armSpring(t, [[0, [0, 58, 26]], [t0 + 1.35, [-12, 36, 32]]], { feel: 'soft' }), aR = armSpring(t, [[0, [-4, 60, 30]], [t0 + 1.4, [-18, 40, 30]], [t0 + 2.6, [-24, 22, 32]]], { feel: 'soft', delay: 0.05 });
  tentVini(g, A, t, act, { expr: exprTrack(t, [[0, 'exhausted'], [t0 + 1.4, 'neutral'], [t0 + 2.2, 'happy']]), look: [track(t, [[t0 + 0.5, -0.5], [t0 + 0.9, 0.2], [t0 + 1.4, 0.35]]), 0.55], arms: [aL, aR],
    props: { left: (g2, h, info) => handTin(g2, h[0] + 12 * info.s, h[1] - 16 * info.s, info.s * 1.0, -0.25 + 0.5 * spin + 0.1 * lift, false) } });
  lanternGlow(g, t); camEnd(g); tentGrade(g);
  note(g, 'that night', W * 0.2, H * 0.16, { size: 70, color: CREAM, glow: false, k: pop(t, t0 + 0.2) * (1 - sm(t, t0 + 1.6, t0 + 1.9)), rot: -0.03 });
  note(g, 'the tin with no label', W * 0.26, H * 0.3, { size: 60, k: pop(t, t0 + 2.0), rot: -0.02 }); arrowTo(g, W * 0.33, H * 0.36, W * 0.42, H * 0.56, so(t, t0 + 2.1, t0 + 2.5), RED, -20);
  vignette(g, 0.5); fade(g, 1 - sm(t, t0, t0 + 0.4)); }
// "Special occasion." — a little toast. Then he looks inside. Long pause.
const TOAST = C15 + 12.85, PEEK = C15 + 14.05;
function shTentB(g, t, A) { const k = sm(t, PEEK, T.dogFood);
  camBegin(g, A.bg.tent, { z: lerp(1.32, 2.15, k), x: lerp(880, 850, k), y: lerp(640, 600, k) });
  const act = (tt) => ({ lean: -6 + move(tt, 0, 9, TOAST, { feel: 'heavy' }) + move(tt, 0, -13, PEEK, { feel: 'heavy' }), headTilt: -6 + move(tt, 0, 12, TOAST, { feel: 'snappy' }) + move(tt, 0, -20, PEEK + 0.04, { feel: 'snappy' }), crouch: -3 * bump(tt, TOAST, TOAST + 0.5) });
  const aL = armSpring(t, [[0, [-12, 36, 32]], [TOAST, [58, -30, 30]], [PEEK, [-6, 44, 34]]], { feel: 'arm' }), aR = armSpring(t, [[0, [-24, 22, 32]], [TOAST + 0.05, [8, 52, 16]], [PEEK + 0.1, [-6, 50, 26]]], { delay: 0.05 });
  const fall = sm(t, PEEK + 0.7, PEEK + 1.6);
  tentVini(g, A, t, act, { expr: exprTrack(t, [[0, 'happy'], [PEEK + 0.15, 'neutral'], [PEEK + 0.75, 'worried']], 0.5), look: t < PEEK ? [0.3, -0.1] : [0.3, 1], arms: [aL, aR], turn: 0.3,
    props: { left: (g2, h, info) => handTin(g2, h[0] + 12 * info.s, h[1] - 16 * info.s, info.s * 1.0, 0.1 - 0.18 * sm(t, PEEK, PEEK + 0.3), true) } }, 0.6 * (1 - fall));
  lanternGlow(g, t); camEnd(g); tentGrade(g);
  note(g, 'special occasion!', W * 0.72, H * 0.24, { size: 78, color: CREAM, glow: false, k: pop(t, TOAST + 0.1) * (1 - sm(t, PEEK - 0.1, PEEK + 0.15)), rot: 0.03 });
  note(g, '…', W * 0.7, H * 0.3, { size: 130, color: CREAM, glow: false, k: pop(t, PEEK + 1.0), rot: 0 });
  vignette(g, 0.5 + 0.12 * k); }
// "He eats it anyway." — a shrug, a spoon
const EAT = C16 + 1.36;
function shTentC(g, t, A) { const k = sm(t, T.phTentC, T.o1);
  camBegin(g, A.bg.tent, { z: lerp(1.5, 1.62, k), x: 860, y: 630 });
  const act = (tt) => ({ lean: -7 + move(tt, 0, 5, EAT + 0.5, { feel: 'heavy' }), headTilt: -8 + 7 * bump(tt, EAT - 0.05, EAT + 0.45) + move(tt, 0, 6, EAT + 0.55, { feel: 'snappy' }), crouch: -4 * bump(tt, EAT - 0.05, EAT + 0.45) });
  const aL = armSpring(t, [[0, [-10, 26, 34]], [EAT, [40, 14, 12]], [EAT + 0.45, [-10, 30, 34]]], { feel: 'snappy' }), aR = armSpring(t, [[0, [0, 52, 26]], [EAT + 0.03, [44, 12, 12]], [EAT + 0.5, [-22, 24, 34]], [EAT + 0.72, [-12, 34, 30]]], { feel: 'snappy', delay: 0.05 });
  const inMouth = t > EAT + 1.0, chew = inMouth ? Math.abs(Math.sin((t - EAT - 1.0) * 11)) : 0;
  tentVini(g, A, t, act, { expr: exprTrack(t, [[0, 'worried'], [EAT + 0.05, 'neutral'], [EAT + 0.8, 'exhausted'], [EAT + 1.02, 'neutral']], 0.12), look: [0.2, t < EAT + 0.5 ? 0.6 : 0], arms: [aL, aR], squash: 0.6 * chew,
    props: { left: (g2, h, info) => handTin(g2, h[0] + 12 * info.s, h[1] - 16 * info.s, info.s * 1.0, -0.08, true), right: (g2, h, info) => spoon(g2, h[0], h[1] - 4 * info.s, info.s * 1.2, -0.5 + 0.3 * sm(t, EAT + 0.5, EAT + 0.9), t > EAT + 0.5 && !inMouth) } }, 0.5);
  lanternGlow(g, t); camEnd(g); tentGrade(g);
  note(g, '(food is food.)', W * 0.72, H * 0.26, { size: 64, color: CREAM, glow: false, k: pop(t, EAT + 0.2), rot: 0.03 });
  vignette(g, 0.55); fade(g, sm(t, T.o1 - 0.2, T.o1)); }

const SHOTS = [[shWalk, T.walk], [shCar, T.car], [shHedge, T.hedge], [shFreeze, T.freeze], [shTicks, T.ticks], [shSees, T.sees], [shReveal, T.phReveal], [sh200, T.m200], [shFeet, T.feet], [shSkid, T.skid], [shHeads, T.heads],
  [shRunA, T.runA], [shRunB, T.runB], [shGate, T.phGate], [shFace, T.face], [shDive, T.phDive], [shCard, T.card], [shTentA, T.phTentA], [shTinOpen, T.tinOpen], [shTentB, T.phTentB], [shDogFood, T.dogFood], [shTentC, T.phTentC],
  [shO1, T.o1], [shO2, T.o2], [shO3, T.o3]];
export function draw(g, t, A) { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[1]) s = x; g.save(); s[0](g, t, A); g.restore(); }
