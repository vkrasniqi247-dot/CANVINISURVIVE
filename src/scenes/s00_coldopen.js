// src/scenes/s00_coldopen.js — COLD OPEN (scene time 0 → DUR). Narration clip 00_cold_open.
// Black, KNOCK, the Day 18 knock shot (the same knockShot() Day 18 uses, same angle), a second KNOCK, then a snap cut to
// daylight eighteen days earlier: Vini on his street, the dead walking, Vini hiding behind the car. Ends on black.
// The street shots are the old hook shots h1 / h4 / h5 rebuilt on kit/motion.js. Pure functions of time.
import { W, H, RED, clamp, lerp, sm, so, pop, camBegin, camEnd, punches, toScreen, camShake, note, arrowTo, bigText, fade, vignette } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';
import { drawZombie, strideSpeed } from '../zombie/zombie.js';
import { sY, hordeAt, carFront } from './hook.js';
import { knockShot } from './s18_day18.js';

const VO0 = 1.1, KN1 = 0.4, KN2 = 5.12, KN3 = 8.36, CUT = 8.8, T2 = 14.1, T3 = 22.0, CLOSE = 25.1, BLACK = 26.35;
export const DUR = 27.0;
export const VO = [['00_cold_open', VO0]];
export const SFX = [['knock', KN1], ['room_tone_night', 0.5], ['knock_soft', KN2], ['knock', KN3], ['snap_cut_whoosh', CUT], ['street_ambience_day', CUT], ['pop_label', 10.35], ['pop_label', 13.0],
  ['zombie_groans', T2 + 0.2], ['pop_label', 18.35], ['heads_snap_sting', 20.45], ['zombie_shuffle', T3], ['impact_30days', 24.0], ['heartbeat', CLOSE], ['cut_to_black', BLACK]];

const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const stiff = (drive, t) => ({ hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) });

// ---------- "Eighteen days ago, Vini had never survived anything harder than a Monday." ----------
function street(g, t, A) { const u = t - CUT, WAVE = CUT + 0.45, WEND = CUT + 1.95, SHRUG = 13.2;
  const c = camBegin(g, A.bg.street, punches(t, { z: lerp(1.34, 1.14, sm(u, 0, 5.3)), x: 960, y: 760 }, [[SHRUG + 0.05, 0.5, { z: 1.75, x: 960, y: 660 }, 0.4]]));
  const vx = 960, vy = 1010, s = sY(vy) * 0.9;
  const wavAt = (tt) => Math.sin((tt - WAVE) * 13) * 11 * sm(tt, WAVE + 0.12, WAVE + 0.32) * (1 - sm(tt, WEND - 0.2, WEND));
  const leanAt = (tt) => trackSpring(tt, [[0, 0], [WAVE, -3.5], [WEND, 0], [SHRUG, 2.5]], { feel: 'heavy', windUp: 0.06 });
  const armR = armSpring(t, [[0, 'relaxed'], [WAVE, 'wave'], [WEND, 'relaxed'], [SHRUG, 'shrug']], { feel: 'snappy', windUp: 0.06 }); armR[1][0] += wavAt(t);
  const armL = armSpring(t, [[0, 'relaxed'], [CUT + 2.2, 'hips'], [SHRUG, 'shrug']], { delay: 0.05 });
  const shr = sm(t, SHRUG, SHRUG + 0.25);
  drawVini(g, A.vini, withAlive({ x: vx, y: vy, s, t, turn: 0.15, expr: exprTrack(t, [[0, 'happy'], [SHRUG, 'worried']]), look: [0.1, 0], arms: [armL, armR], lean: leanAt(t),
    headTilt: overlap(leanAt, t, 0.09, 0.8) + wavAt(t) * 0.16 - 6 * shr, crouch: 0.8 * shr, hipX: 2 * sm(t, CUT + 2.2, CUT + 2.6), breath: breathe(t, 3, 0.6), ...stiff((tt) => vx + wavAt(tt) * 0.4 - leanAt(tt) * 4, t) }, t, { energy: 1 }));
  camEnd(g);
  { const k = pop(t, CUT + 0.04, 0.2); g.save(); g.globalAlpha = 1 - sm(t, CUT + 2.6, CUT + 2.95); bigText(g, '18 DAYS EARLIER', W / 2, H * 0.13, { size: 116, k, color: '#f4efe2', rot: -0.015 }); g.restore(); }
  const [hx, hy] = toScreen(c, vx + 70, vy - s * 300), kv = pop(t, 10.35), av = 1 - sm(t, 12.5, 12.85);
  g.save(); g.globalAlpha = av; note(g, 'VINI', hx + 230, hy - 40, { size: 84, k: kv }); arrowTo(g, hx + 190, hy - 10, hx + 60, hy + 30, so(t, 10.4, 10.8)); g.restore();
  note(g, 'survived: Mondays (barely)', W * 0.71, H * 0.3, { size: 64, k: pop(t, 13.0), rot: 0.03 });
  vignette(g, 0.3); }

// ---------- "Then the dead got up… They can't see very well. But they can hear everything." ----------
const HZ = [{ kind: 'office', x: 1000, y0: 860, start: T2 - 0.7, seed: 1.3 }, { kind: 'worker', x: 860, y0: 835, start: T2 - 0.7, seed: 2.9 }, { kind: 'teen', x: 1120, y0: 848, start: T2 - 0.7, seed: 4.1 }];
function dead(g, t, A) { const u = t - T2, SNAP = 20.45;
  const c = camBegin(g, A.bg.street, punches(t, { z: lerp(1.45, 1.6, sm(u, 0, 7.9)), x: 980, y: 760 }, [[SNAP + 0.02, 0.8, { z: 1.95, x: 985, y: 720 }, 0.45]]), camShake(t, 5, SNAP, 0.3));
  const zs = HZ.map((z) => ({ ...z, ...hordeAt(z, t) })).sort((a, b) => a.y - b.y), snap = so(t, SNAP, SNAP + 0.22);
  for (const z of zs) drawZombie(g, A.zombie, { kind: z.kind, x: z.x, y: z.y, s: z.s, t, seed: z.seed, dir: 0, shake: snap > 0 && snap < 1 ? 1.2 : 0, expr: t > SNAP ? 'groan' : 'zombie', headTurn: (1 - snap) * Math.sin(t * 0.8 + z.seed) * 0.6 });
  camEnd(g);
  const lead = zs[zs.length - 1], back = zs[0], [ex, ey] = toScreen(c, lead.x, lead.y - lead.s * 272), [bx, by] = toScreen(c, back.x, back.y - back.s * 272);
  const k0 = pop(t, 15.25) * (1 - sm(t, 17.5, 17.8)); if (k0 > 0) { note(g, 'ex-neighbours', W * 0.2, H * 0.3, { size: 66, k: k0, rot: -0.04 }); arrowTo(g, W * 0.25, H * 0.35, bx - 50, by, so(t, 15.3, 15.7) * clamp(k0)); }
  const k1 = pop(t, 18.35), k2 = pop(t, SNAP + 0.1);
  if (k1 > 0) { note(g, 'bad eyesight', W * 0.17, H * 0.6, { size: 66, k: k1 }); arrowTo(g, W * 0.2, H * 0.55, ex - 40, ey + 10, so(t, 18.4, 18.8)); }
  if (k2 > 0) { note(g, 'PERFECT hearing', W * 0.82, H * 0.6, { size: 70, k: k2, rot: 0.03 }); arrowTo(g, W * 0.78, H * 0.55, ex + 50, ey + 10, so(t, SNAP + 0.15, SNAP + 0.55), RED, -30); }
  vignette(g, 0.4); }

// ---------- "So can Vini stay quiet for thirty days? He nearly does." ----------
function car(g, t, A) { const u = t - T3, ASK = 24.0, cl = t >= CLOSE;
  camBegin(g, A.bg.street, cl ? { z: 2.45 + 0.16 * sm(t, CLOSE, BLACK), x: 455, y: 615 } : { z: lerp(1.3, 1.42, sm(u, 0, 3.1)), x: 640, y: 760 }, camShake(t, 6, ASK, 0.35));
  const zy = 880, zs = sY(zy), travel = strideSpeed(zs, 0.8) * (u + 3), zx = 1235 - travel;
  drawZombie(g, A.zombie, { kind: 'office', x: zx, y: zy, s: zs, t, seed: 0.7, dir: -1, cad: 0.8, walkDist: -travel / zs });
  g.save(); g.beginPath(); g.rect(0, 0, W, 700); g.clip();                      // only his head and shoulders show above the car roof
  const fl = startle(t - ASK), duck = move(t, 0, 1, ASK + 0.08, { feel: 'heavy', windUp: 0.05 }), peek = sm(t, CLOSE + 0.35, CLOSE + 0.7),   // he drops until only his eyes show over the roof
    leanAt = (tt) => -4 + 6 * startle(tt - ASK);
  const armL = armSpring(t, [[0, 'chest'], [ASK, 'face']], { feel: 'snappy', windUp: 0.05 }), armR = armSpring(t, [[0, 'cold'], [ASK + 0.02, 'face']], { feel: 'snappy', delay: 0.05 });
  const look = t < CLOSE + 0.5 ? [1, 0.1] : [lerp(1, 0, so(t, CLOSE + 0.5, CLOSE + 0.62)), lerp(0.1, 0, so(t, CLOSE + 0.5, CLOSE + 0.62))];
  drawVini(g, A.vini, withAlive({ x: 430, y: 938, s: 1.22, t, turn: 0.75, expr: exprTrack(t, [[0, 'worried'], [ASK, 'shock'], [ASK + 0.5, 'scared']]), look, arms: [armL, armR], lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8) - 4 * fl,
    crouch: 3 * fl + 30 * duck - 5 * peek, squash: fl, shake: t > ASK ? 0.3 + 0.4 * fl : 0.12, breath: breathe(t, 0.9, 0.7), shadow: false, ...stiff((tt) => -leanAt(tt) * 4, t) }, t, { energy: 0.4 }));
  g.restore();
  carFront(g, A);
  camEnd(g);
  if (!cl) bigText(g, '30 DAYS?', W * 0.6, H * 0.2, { size: 175, k: pop(t, ASK, 0.28), color: '#ffffff' });
  vignette(g, cl ? 0.5 : 0.42); }

export function draw(g, t, A) { g.save();
  if (t < KN1 || t >= BLACK) { g.fillStyle = '#060607'; g.fillRect(0, 0, W, H); }
  else if (t < CUT) { knockShot(g, t, A, { knocks: [[KN1, 1], [KN2, 0.6], [KN3, 1.15]], cuts: [[KN1, 'wide'], [2.9, 'door'], [5.72, 'close']], clockAt: 1.2, sweatAt: 5.7 });
    note(g, 'one sound = dead', W * 0.72, H * 0.3, { size: 82, k: pop(t, VO0 + 6.3) * (1 - sm(t, KN3 - 0.2, KN3 - 0.05)), rot: -0.03 }); }
  else if (t < T2) { street(g, t, A); fade(g, 1 - so(t, CUT, CUT + 0.25), '#ffffff'); }
  else if (t < T3) dead(g, t, A);
  else car(g, t, A);
  g.restore(); }
