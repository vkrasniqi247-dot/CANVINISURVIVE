// src/scenes/s18_day18.js — DAY 18 "The long nights" (scene time 0 → DUR). Narration clips 09_day18a, 10_day18b, 11_day18c.
// Also exports knockShot(): "the knock" (night, barricaded flat, Vini frozen beside the sofa, something at the door),
// used here AND by the cold open (s00_coldopen.js) so both are visibly the same moment from the same angle.
// Every function is a pure function of time (seconds). No Math.random / Date.now.
import { W, H, RED, INK, clamp, lerp, ease, alpha, mix, radGrad, linGrad, sm, so, pop, settle, camBegin, camEnd, toScreen, camShake, note, arrowTo, bigText, fade, vignette, nightGrade, dayCounter, notebook, inkPath, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { armSpring, overlap, withAlive, trackSpring, move, exprTrack } from '../kit/motion.js';
import { tin } from './props.js';

// ---------- timeline ----------
const VOA = 0.5, VOB = 31.6, VOC = 47.8;
const T_C1 = 9.1, T_P2 = 16.6, T_R9 = 21.6, T_C2 = 26.1, T_BLK = 28.2, K1 = 29.2, K2 = 30.6, T_K = 31.3, T_V1 = 47.6, T_V2 = 51.0, T_V3 = 52.9;
export const DUR = 58.6;
export const VO = [['09_day18a', VOA], ['10_day18b', VOB], ['11_day18c', VOC]];
// Shots that still need a background that does not exist. Empty: BG07 (night city) now exists and both shots are built on it.
export const NEEDS_BG = [];
export const SFX = [['day_slam', VOA], ['wind_night', 0.2], ['fire_crackle_distant', 5.1], ['candle_hum', T_P2], ['distant_groans', T_P2 + 2.4], ['match_strike', T_C1 + 0.5], ['candle_catch', T_C1 + 1.45], ['sting_mistake', T_C1 + 5.8], ['page_flip', T_R9], ['pen_scratch', T_R9 + 0.3], ['distant_thud', T_C2 + 0.85], ['blow_out', T_C2 + 1.5],
  ['knock', K1], ['knock', K2], ['knock', VOB + 2.4], ['knock', VOB + 3.45], ['room_tone_silence', VOB + 4.6], ['heartbeat_slow', VOB + 6.7], ['shuffle_away', VOB + 13.6], ['exhale', VOB + 15.05],
  ['tape_rip', T_V1 + 1.25], ['tape_rip', T_V1 + 2.2], ['stove_hiss', T_V2 + 0.1], ['whisper', T_V3 + 0.5], ['whisper', T_V3 + 2.0]];

// ---------- small helpers ----------
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
const flick = (t) => 1 + 0.07 * Math.sin(t * 13.1) + 0.05 * Math.sin(t * 23.7 + 1.3) + 0.03 * Math.sin(t * 41.3 + 2.1);   // candle flicker: summed sines
// hand spec [x, y, fwd] that puts a hand at a point of the background, for a Vini facing right (turn > 0). side: 0 = screen-left arm, 1 = screen-right arm
function handFor(V, wx, wy, side, p0 = 6) { const a = V.turn * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
  return [p0, 228 - (V.crouch || 0) - (V.y - wy) / V.s, ((wx - V.x) / V.s - (side ? 1 : -1) * (23 + p0) * ca) / sa]; }
const headOf = (pose, rig, o) => { const hd = pose.world[rig.bi.head], sc = o.s / 4; return [o.x + (hd.tx + hd.a * 120) * sc, o.y - (hd.ty + hd.b * 120) * sc]; };
// draw again in background coordinates after the grade (for lights that must not be darkened)
function camRe(g, c, sh, fn) { g.save(); g.translate(W / 2 + sh[0], H / 2 + sh[1]); g.scale(c.z, c.z); g.translate(-c.cx, -c.cy); fn(); g.restore(); }
// the gaps between the window boards, taken from the painting itself: only its brightest pixels are added back as light
function gapGlow(g, A, a, warm = false) { if (a <= 0.01) return; g.save(); g.beginPath(); g.rect(200, 60, 800, 450); g.clip(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  g.filter = warm ? 'grayscale(1) brightness(0.8) contrast(5) sepia(1) saturate(3.2)' : 'grayscale(1) brightness(0.8) contrast(5)'; g.drawImage(A.bg.barricade, 0, 0, W, H); g.restore(); }
function drop(g, x, y, s, a = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a; g.fillStyle = '#bfe0ff'; g.strokeStyle = INK; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, -13); g.quadraticCurveTo(9, 2, 0, 8); g.quadraticCurveTo(-9, 2, 0, -13); g.fill(); g.stroke(); g.restore(); }
function blackout(g) { g.fillStyle = '#060607'; g.fillRect(0, 0, W, H); }
function knockWord(g, lt, k0, st, x, y, i) { const d = lt - k0, L = st < 0.8 ? 0.58 : 1.15; if (d < 0 || d > L) return; g.save(); g.globalAlpha = 1 - sm(d, L - 0.3, L);
  bigText(g, 'KNOCK', x + Math.sin(d * 60) * 9 * Math.exp(-d * 6), y, { size: 205 * st, k: pop(lt, k0, 0.16), color: '#f4efe2', rot: i % 2 ? 0.05 : -0.06 }); g.restore(); }

// =====================================================================================================================
// THE KNOCK — shared by the cold open and Day 18. lt = local time of the shot.
//   o.knocks   [[lt, strength], ...]      each one: KNOCK lettering, camera shake, Vini flinches, the feet under the door jerk
//   o.cuts     [[lt, 'wide' | 'door' | 'close' | 'mid'], ...]   hard cuts between four framings of the same room
//   o.clockAt  lt of the "3:00 AM" note        o.vinAt  lt of the "VINI" arrow label
//   o.holdAt   he stops breathing              o.sweatAt  a single sweat drop
//   o.legAt    "pins & needles" gag            o.hourAt   "1 HOUR LATER" caption
//   o.leaveAt  the shadow under the door slides away     o.exhaleAt  he breathes out and slumps
// returns { c, head, view } so the caller can pin extra labels.
// =====================================================================================================================
const KV = { x: 250, y: 888, s: 1.85, turn: 0.62 };                    // Vini's hiding spot: the end of the sofa furthest from the door
const DOOR = [1795, 470];
const VIEWS = {
  wide: (k) => ({ z: 1.06 + 0.06 * k, x: 950 - 20 * k, y: 560 }),
  door: (k) => ({ z: 1.52 + 0.1 * k, x: 1400, y: 740 }),
  close: (k) => ({ z: 2.1 + 0.25 * k, x: 430, y: 570 - 14 * k }),
  mid: (k) => ({ z: 1.66 + 0.1 * k, x: 580, y: 705 }),
};
const WORD_AT = { wide: [1330, 300], door: [660, 330], close: [1400, 330], mid: [1420, 300] };
// the light that comes in under the front door, falling across the carpet, and the shadows of two feet in it
const PA = [1690, 935], PB = [1765, 1012], PC = [1380, 1078], PD = [1330, 988];
const pp = (u, v) => [lerp(lerp(PA[0], PD[0], u), lerp(PB[0], PC[0], u), v), lerp(lerp(PA[1], PD[1], u), lerp(PB[1], PC[1], u), v)];
function doorLight(g, lt, knocks, leaveAt) {
  const away = leaveAt != null ? sm(lt, leaveAt, leaveAt + 1.5) : 0, jerk = knocks.reduce((s, [k, st = 1]) => s + startle(lt - k) * 0.07 * st, 0);
  const v1 = 0.26 + 0.09 * Math.sin(lt * 0.9) + 0.035 * Math.sin(lt * 2.3 + 1) + jerk + away * 1.25 + 0.03 * Math.sin(lt * 9) * bump(away, 0, 1), v2 = v1 + 0.34 + 0.05 * Math.sin(lt * 1.7 + 2) - away * 0.1;
  g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath();
  [pp(0, 0), pp(0, 1), pp(1, 1), pp(1, 0)].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  for (const v of [v1, v2]) { const a = clamp(v - 0.11), b = clamp(v + 0.11), a2 = clamp(v - 0.14), b2 = clamp(v + 0.14); if (b <= a) continue;
    [pp(0, a), pp(0, b), pp(1, b2), pp(1, a2)].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  g.fillStyle = linGrad(g, PA[0], PA[1], PD[0], PD[1], [alpha('#a9c0f0', 0.62), alpha('#a9c0f0', 0.3), alpha('#a9c0f0', 0)]); g.fill('evenodd'); g.restore(); }
const LOOKS = [[0.95, 0.05], [0.35, -0.3], [0.95, 0.12], [-0.55, 0.05], [0.9, 0], [0.6, 0.35], [0.95, 0.05], [-0.2, -0.25]];

export function knockShot(g, lt, A, o = {}) {
  const knocks = o.knocks || [], cuts = o.cuts || [[-99, 'wide']];
  let ci = 0; for (let i = 0; i < cuts.length; i++) if (lt >= cuts[i][0]) ci = i;
  const [c0, vn] = cuts[ci], c1 = cuts[ci + 1]?.[0] ?? c0 + 7, kn = (f, tt = lt) => knocks.reduce((s, [k, st = 1]) => s + f(tt - k) * st, 0);
  const sh = knocks.reduce((s, [k, st = 1]) => { const q = camShake(lt, 12 * st, k, 0.42); return [s[0] + q[0], s[1] + q[1]]; }, [0, 0]);
  const c = camBegin(g, A.bg.barricade, VIEWS[vn](sm(lt, c0, c1)), sh);
  // a puddle of moonlight on the carpet and radiator behind him, so his dark legs still read after the grade
  g.fillStyle = radGrad(g, KV.x + 40, KV.y - 90, 0, 290, [alpha('#e4eaff', 0.5), alpha('#e4eaff', 0)]); g.fillRect(KV.x - 260, KV.y - 390, 600, 600);
  // ---- Vini: crouched, one hand gripping the sofa arm, only his eyes moving
  const fl = kn(startle), ex = o.exhaleAt ?? 1e9, rel = lt >= ex, hold = (o.holdAt != null ? sm(lt, o.holdAt, o.holdAt + 0.3) : 0) * (rel ? 0 : 1);
  const slumpAt = (tt) => move(tt, 0, 1, ex + 0.3, { feel: 'heavy', windUp: 0.1 }), slump = slumpAt(lt), gasp = bump(lt, ex, ex + 0.45);
  const leanAt = (tt) => -9 + 5 * kn(startle, tt) + 13 * slumpAt(tt), crouch = 78 + 6 * fl + 13 * slump - 5 * gasp;
  const GRIP = handFor({ ...KV, crouch: 78 }, 352, 604, 1, 4), HUG = [-14, 46, 30], OVER = [-4, -30, 30];
  const kL = [[-99, HUG]]; knocks.forEach(([k], i) => { kL.push([k + 0.02, OVER]); const nx = knocks[i + 1]?.[0] ?? 1e9; if (nx - k > 1.6 && !(o.holdAt != null && o.holdAt - k < 1.6 && o.holdAt > k)) kL.push([k + 1.0, HUG]); });
  if (o.holdAt != null) kL.push([o.holdAt, OVER]); if (rel) kL.push([ex + 0.12, [-6, 74, 22]]); kL.sort((a, b) => a[0] - b[0]);
  const armL = armSpring(lt, kL, { feel: 'snappy', windUp: 0.05 }), armR = armSpring(lt, [[-99, GRIP], [ex + 0.3, [10, 66, 24]]], { delay: 0.05, feel: 'soft' });
  armR[1][1] -= (crouch - 78) * (1 - clamp(slump));                      // the gripping hand stays planted while the body flinches
  const kE = [[-99, 'scared']]; knocks.forEach(([k]) => kE.push([k, 'shock'], [k + 0.6, 'scared']));   // a gasp, not the scream mouth: on a sheet the scream reads as a laugh if (rel) kE.push([ex, 'exhausted'], [ex + 1.0, 'relief']); kE.sort((a, b) => a[0] - b[0]);
  const n = Math.floor(lt / 1.1), LK = (i) => LOOKS[((i % LOOKS.length) + LOOKS.length) % LOOKS.length], dk = so(lt - n * 1.1, 0, 0.08), toDoor = knocks.some(([k]) => lt >= k && lt < k + 1.4);
  const look = toDoor ? [0.98, 0.04] : [lerp(LK(n - 1)[0], LK(n)[0], dk), lerp(LK(n - 1)[1], LK(n)[1], dk)];
  const drive = (tt) => -leanAt(tt) * 4, hairLag = clamp(-follow(drive, lt, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5);
  const vo = { ...KV, crouch, t: lt, expr: exprTrack(lt, kE), look, lean: leanAt(lt), headTilt: overlap(leanAt, lt, 0.09, 0.8) - 3 * fl + 5 * slump, arms: [armL, armR], squash: fl, hairLag,
    shake: rel ? 0 : 0.1 * (1 - hold) + 0.03 + 0.5 * fl, breath: rel ? 0.4 * gasp + breathe(lt - ex - 0.6, 2.6, 1) * sm(lt, ex + 0.5, ex + 1) : breathe(lt, 0.95, 0.45) * (1 - hold), shadowA: 0.22 };
  const pose = drawVini(g, A.vini, withAlive(vo, lt, { energy: rel ? 0.7 * sm(lt, ex + 0.6, ex + 1.4) : lerp(0.28, 0.1, hold) }));
  const head = headOf(pose, A.vini, vo);
  camEnd(g);
  // ---- night: very dark, a little cold moonlight through the gaps in the boards, a faint pool on him so his eyes read
  nightGrade(g, 0.92, [[...toScreen(c, 600, 330), 700 * c.z, '#9fb4e8', 0.27], [...toScreen(c, head[0] + 20, head[1] + 40), 330 * c.z, '#9fb4e8', 0.36], [...toScreen(c, KV.x + 30, 840), 250 * c.z, '#9fb4e8', 0.2], [...toScreen(c, 1640, 640), 560 * c.z, '#9fb4e8', vn === 'door' ? 0.3 : 0.16]]);
  camRe(g, c, sh, () => { gapGlow(g, A, 0.5);
    g.save(); g.globalCompositeOperation = 'lighter';                    // two soft shafts falling from the gaps
    for (const [x0, x1, y0] of [[300, 560, 158], [660, 920, 272]]) { g.fillStyle = linGrad(g, 0, y0, 0, y0 + 520, [alpha('#9fb4e8', 0.085), alpha('#9fb4e8', 0)]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + 230, y0 + 520); g.lineTo(x0 + 150, y0 + 520); g.closePath(); g.fill(); }
    g.restore();
    doorLight(g, lt, knocks, o.leaveAt);
    for (const [k, st = 1] of knocks) { const d = lt - k; if (d < 0 || d > 0.45) continue; g.save(); g.globalAlpha = 1 - sm(d, 0.15, 0.45); g.strokeStyle = '#f4efe2'; g.lineWidth = 7; g.lineCap = 'round';   // impact lines on the door
      for (let i = 0; i < 9; i++) { const an = -2.5 + i * 0.5, r0 = (60 + 50 * so(d, 0, 0.2)) * st, r1 = r0 + (40 + (i % 2) * 28) * st; g.beginPath(); g.moveTo(DOOR[0] + Math.cos(an) * r0, DOOR[1] + Math.sin(an) * r0); g.lineTo(DOOR[0] + Math.cos(an) * r1, DOOR[1] + Math.sin(an) * r1); g.stroke(); } g.restore(); }
    if (o.sweatAt != null && lt > o.sweatAt && !rel) { const d = (lt - o.sweatAt) % 3.2, k = clamp(d / 2.2); drop(g, head[0] - 46 - 4 * k, head[1] - 30 + 95 * k * k, 1.5, clamp(d * 5) * (1 - sm(d, 1.9, 2.2))); }
    if (o.legAt != null && lt > o.legAt && lt < (o.hourAt ?? 1e9)) { const lx = KV.x + 50, ly = KV.y - 75; g.save(); g.strokeStyle = '#ffe9a0'; g.lineWidth = 3.5; g.lineCap = 'round'; g.globalAlpha = clamp((lt - o.legAt) * 4);   // pins and needles
      for (let i = 0; i < 7; i++) { const ph = lt * 7 + i * 1.9, on = Math.sin(ph) > 0.1 ? 1 : 0.25, an = i * 0.9 + 0.3 * Math.sin(lt * 3 + i), r = 44 + 12 * Math.sin(ph * 0.7), px = lx + Math.cos(an) * r * 1.0, py = ly + Math.sin(an) * r * 1.3;
        g.globalAlpha = on * clamp((lt - o.legAt) * 4); g.beginPath(); g.moveTo(px - 7, py); g.lineTo(px + 7, py); g.moveTo(px, py - 7); g.lineTo(px, py + 7); g.stroke(); } g.restore(); }
    if (rel) { const d = lt - ex - 0.25; if (d > 0 && d < 1.3) { g.save(); g.globalAlpha = 0.55 * (1 - sm(d, 0.5, 1.3)); g.strokeStyle = '#dfe8ff'; g.lineWidth = 4; g.lineCap = 'round';   // the breath he was holding
      for (let i = 0; i < 3; i++) { const x0 = head[0] + 70 + 60 * so(d, 0, 1) + i * 16, y0 = head[1] + 38 + (i - 1) * 20; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 26, y0 - 8 + (i - 1) * 6, x0 + 50 + 20 * d, y0 + (i - 1) * 12); g.stroke(); } g.restore(); } }
  });
  // ---- lettering
  knocks.forEach(([k, st = 1], i) => knockWord(g, lt, k, st, WORD_AT[vn][0], WORD_AT[vn][1], i));
  const pale = { color: '#d8e0ff', glow: false };
  if (o.clockAt != null) note(g, '3:00 AM', W * 0.2, H * 0.14, { size: 84, k: pop(lt, o.clockAt) * (1 - sm(lt, o.clockAt + 2.6, o.clockAt + 3.0)), ...pale });
  if (o.vinAt != null && vn === 'wide' && lt > o.vinAt) { const [hx, hy] = toScreen(c, head[0], head[1]); note(g, 'VINI', hx + 330, hy - 190, { size: 84, k: pop(lt, o.vinAt) }); arrowTo(g, hx + 260, hy - 160, hx + 95, hy - 50, so(lt, o.vinAt + 0.05, o.vinAt + 0.45), RED, -30);
    note(g, '(not breathing)', hx + 350, hy - 118, { size: 46, k: pop(lt, o.vinAt + 0.9), rot: 0.02, ...pale }); }
  if (o.legAt != null && vn === 'mid' && lt > o.legAt && lt < (o.hourAt ?? 1e9)) { const [lx, ly] = toScreen(c, KV.x + 100, KV.y - 75); note(g, 'pins & needles', lx + 430, ly - 30, { size: 66, k: pop(lt, o.legAt + 0.15), rot: 0.03 }); arrowTo(g, lx + 250, ly - 20, lx + 55, ly + 5, so(lt, o.legAt + 0.2, o.legAt + 0.6), RED, -24);
    note(g, '(he lets it)', lx + 450, ly + 44, { size: 46, k: pop(lt, o.legAt + 1.85), ...pale }); }
  if (o.hourAt != null) note(g, '1 HOUR LATER', W * 0.3, H * 0.2, { size: 92, k: pop(lt, o.hourAt) * (1 - sm(lt, o.hourAt + 2.0, o.hourAt + 2.3)), ...pale, rot: -0.02 });
  vignette(g, 0.56);
  return { c, head, view: vn };
}

// ---------- the night city (BG07): seen from inside, through the big boarded window ----------
const FIRES = [[655, 498, 0], [1218, 522, 2.1], [1755, 522, 4.3]], NV = { x: 300, y: 1130, s: 2.3, turn: 0.62 }, SILL = [770, 903];
function fires(g, t, k = 1) { g.save(); g.globalCompositeOperation = 'lighter';                       // the painted fires flicker: additive glow, summed sines
  for (const [x, y, ph] of FIRES) { const f = 1 + 3.2 * (flick(t * 0.8 + ph * 3) - 1), f2 = 1 + 3 * (flick(t * 1.7 + ph) - 1), wx = 5 * Math.sin(t * 5 + ph);
    g.fillStyle = radGrad(g, x, y - 14, 0, 100 * f, [alpha('#ff8a30', clamp(0.4 * k * f)), alpha('#ff8a30', 0)]); g.beginPath(); g.arc(x, y - 14, 100 * f, 0, 7); g.fill();
    g.fillStyle = radGrad(g, x + wx, y - 8, 0, 30 * f2, [alpha('#ffd080', clamp(0.55 * k * f2)), alpha('#ffd080', 0)]); g.beginPath(); g.arc(x + wx, y - 8, 30 * f2, 0, 7); g.fill(); }
  g.restore(); }
// the wall he stands against is unlit: darken everything left of the window frame (he becomes a dark figure)
function wallShade(g, c, col) { const [x0] = toScreen(c, 470, 0), [x1] = toScreen(c, 610, 0); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = linGrad(g, x0, 0, x1, 0, [col, '#ffffff']); g.fillRect(0, 0, W, H); g.restore(); }
// "The power has been off for over two weeks. At night, the city is completely black, apart from the fires."
function cityShot(g, t, A) { const k = sm(t, 0, T_C1), COLD = 5.3, FIRE = 7.35;
  const c = camBegin(g, A.bg.nightcity, { z: lerp(1.0, 1.15, k), x: lerp(960, 1015, k), y: lerp(540, 518, k) });
  fires(g, t);
  const leanAt = (tt) => trackSpring(tt, [[0, -2], [COLD, -6], [FIRE, -3]], { feel: 'heavy', windUp: 0.05 });
  const armL = armSpring(t, [[-9, 'relaxed'], [COLD, 'cold']], { delay: 0.05 }), armR = armSpring(t, [[-9, 'relaxed'], [COLD, 'chest']], { feel: 'soft' });
  drawVini(g, A.vini, withAlive({ ...NV, t, expr: exprTrack(t, [[-9, 'worried'], [FIRE, 'scared']]), look: [0.82 + 0.15 * Math.sin(t * 0.7), -0.12], lean: leanAt(t), headTilt: overlap(leanAt, t, 0.09, 0.8), arms: [armL, armR],
    shake: 0.12 * sm(t, COLD, COLD + 0.5), breath: breathe(t, 2.8, 0.6), hairLag: clamp(-follow((tt) => -leanAt(tt) * 4, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), shadow: false }, t, { energy: 0.8 }));
  camEnd(g);
  wallShade(g, c, '#3c4468');
  const pale = { color: '#d8e0ff', glow: false };
  note(g, 'power: OFF  (16 days)', W * 0.54, H * 0.25, { size: 72, k: pop(t, 2.7) * (1 - sm(t, 4.9, 5.2)), rot: -0.02 });
  note(g, 'street lights:  0', W * 0.54, H * 0.22, { size: 62, k: pop(t, 5.5) * (1 - sm(t, FIRE - 0.35, FIRE - 0.1)), ...pale, rot: -0.02 });
  note(g, 'lit windows:  0', W * 0.56, H * 0.31, { size: 62, k: pop(t, 6.2) * (1 - sm(t, FIRE - 0.35, FIRE - 0.1)), ...pale, rot: 0.015 });
  if (t > FIRE) { note(g, 'the only lights left', W * 0.6, H * 0.25, { size: 76, k: pop(t, FIRE), rot: -0.03 });
    FIRES.forEach(([x, y], i) => { const [fx, fy] = toScreen(c, x, y - 40), at = FIRE + 0.2 + i * 0.18; arrowTo(g, W * (0.5 + 0.1 * i), H * 0.31, fx + (i - 1) * -14, fy - 22, so(t, at, at + 0.35), RED, (1 - i) * 26); }); }
  vignette(g, 0.46); }
// "Because in a dark city, one candle in a window can be seen from streets away."
const EYES = [[640, 772, 2.35, 1], [1832, 812, 2.7, 1], [1012, 597, 3.05, 0.7], [1470, 591, 3.3, 0.7], [735, 832, 3.55, 1], [1795, 742, 3.8, 1], [1300, 599, 4.0, 0.7], [600, 838, 4.2, 1]];   // [x, y, time it turns, size]
function windowCandle(g, t, A) { const u = t - T_P2, k = sm(u, 0.15, 3.4), fk = flick(t), FL = [SILL[0], SILL[1] - 66];
  const c = camBegin(g, A.bg.nightcity, { z: lerp(2.1, 1.04, k), x: lerp(905, 975, k), y: lerp(790, 545, k) });
  fires(g, t, 0.8);
  g.save(); g.globalCompositeOperation = 'lighter';                                                // things out there turning to look
  EYES.forEach(([x, y, at, sz], i) => { const a = sm(u, at, at + 0.25) * (Math.sin(t * 1.3 + i * 2.1) > 0.96 ? 0 : 1), sl = 10 * sz * (1 - so(u, at, at + 0.3)); if (a <= 0) return;
    for (const dx of [-6.5 * sz, 6.5 * sz]) { g.fillStyle = radGrad(g, x + dx + sl, y, 0, 13 * sz, [alpha('#c9f29a', 0.3 * a), alpha('#c9f29a', 0)]); g.beginPath(); g.arc(x + dx + sl, y, 13 * sz, 0, 7); g.fill(); g.fillStyle = alpha('#e2ffb8', a); g.beginPath(); g.arc(x + dx + sl, y, 4.2 * sz, 0, 7); g.fill(); } });
  g.restore();
  candleBody(g, SILL[0], SILL[1]);
  const armL = armSpring(u, [[-9, [-12, 6, 46]]], { delay: 0.05 }), armR = armSpring(u, [[-9, 'hips']], { feel: 'soft' });
  drawVini(g, A.vini, withAlive({ ...NV, t, expr: 'happy', look: [0.55, 0.35], lean: -5, headTilt: 5, arms: [armL, armR], breath: breathe(t, 2.8, 0.6), hairLag: 0, shadow: false,
    props: { left: (g2, h, info) => tin(g2, h[0] + 3, h[1] - 16 * info.s, 0.82 * info.s, -0.12) } }, t, { energy: 0.7 }));
  camEnd(g);
  wallShade(g, c, '#7d6a5c');
  camRe(g, c, [0, 0], () => { g.save(); g.globalCompositeOperation = 'lighter'; const R = 430 * (0.94 + 0.06 * fk);
    g.fillStyle = radGrad(g, FL[0], FL[1], 0, R, [alpha('#ffb050', 0.34), alpha('#ffb050', 0.1), alpha('#ffb050', 0)]); g.beginPath(); g.arc(FL[0], FL[1], R, 0, 7); g.fill(); g.restore();
    flame(g, FL[0], FL[1], 1, t); });
  const [fx, fy] = toScreen(c, FL[0], FL[1]);
  if (u > 2.0) { note(g, 'visible for streets', fx + 520, fy - 80, { size: 78, k: pop(u, 2.0), rot: -0.03 }); arrowTo(g, fx + 280, fy - 60, fx + 48, fy - 12, so(u, 2.05, 2.45), RED, -26); }
  note(g, '…and something noticed.', W * 0.56, H * 0.2, { size: 56, k: pop(u, 3.7), color: '#d8e0ff', glow: false, rot: 0.02 });
  vignette(g, 0.46); }

// ---------- the candle (interior, night) ----------
const CV = { x: 215, y: 872, s: 1.85, turn: 0.6 }, CANDLE = [396, 607], FLAME = [396, 541];
function candleBody(g, x, y) { g.save(); g.translate(x, y); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.fillStyle = '#8f8a80'; g.beginPath(); g.ellipse(0, 0, 30, 8, 0, 0, 7); g.fill(); g.stroke();                       // saucer
  g.fillStyle = '#efe6cf'; g.beginPath(); g.roundRect(-10, -52, 20, 52, 3); g.fill(); g.stroke();
  g.strokeStyle = alpha('#ffffff', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(-5, -46); g.lineTo(-5, -6); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -52); g.lineTo(1, -60); g.stroke(); g.restore(); }
function flame(g, x, y, s, t, blow = 0) { const sw = Math.sin(t * 9) * 2 + Math.sin(t * 17.3) * 1.2 + blow * 16, h = 30 * flick(t) * (1 - 0.35 * blow);
  g.save(); g.translate(x, y); g.scale(s, s);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 0, -12, 0, 90, [alpha('#ffb050', 0.5), alpha('#ffb050', 0)]); g.beginPath(); g.arc(0, -12, 90, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
  for (const [w, hh, col] of [[9, h, '#ffab3d'], [5, h * 0.62, '#fff4c8']]) { g.fillStyle = col; g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(-w, -hh * 0.55, sw, -hh); g.quadraticCurveTo(w, -hh * 0.55, w, 0); g.quadraticCurveTo(0, 7, -w, 0); g.fill(); }
  g.restore(); }
// night that a warm light pushes back: multiply by a gradient that is warm and bright at the source and night-blue away from it
function warmDark(g, c, src, k, R = 650) { const NIGHT = '#222a48', [sx, sy] = toScreen(c, src[0], src[1]); g.save(); g.globalCompositeOperation = 'multiply';
  if (k <= 0.01) g.fillStyle = NIGHT; else { const kk = clamp(k), r = R * c.z * (0.55 + 0.45 * k);
    g.fillStyle = radGrad(g, sx, sy, 0, r, [[0, mix(NIGHT, '#fff0cc', kk)], [0.2, mix(NIGHT, '#e6ac6a', kk)], [0.5, mix(NIGHT, '#77606a', kk * 0.9)], [1, NIGHT]]); }
  g.fillRect(0, 0, W, H); g.restore(); }
function candleShot(g, t, A, T0, mode) { const u = t - T0, L = mode === 'light';
  const STRIKE = 0.5, TOUCH = 1.25, LIT = 1.45, OUT = 2.25, TIN = 3.3, MIS = 5.8, HEAR = 0.85, BLOW = 1.42, DARK = 1.64;
  const lit = L ? sm(u, LIT, LIT + 0.3) : 1 - sm(u, DARK, DARK + 0.08), matchOn = L && u > STRIKE && u < OUT ? 1 - sm(u, OUT - 0.12, OUT) : 0, wide = L ? sm(u, MIS - 0.15, MIS + 0.5) : 0;
  const hear = L ? 0 : startle(u - HEAR), blow = L ? 0 : bump(u, BLOW - 0.05, DARK + 0.12);
  const sh = L ? camShake(u, 5, MIS, 0.35) : camShake(u, 3, HEAR, 0.3);
  const c = camBegin(g, A.bg.barricade, { z: lerp(lerp(1.78, 1.62, sm(u, 0, 5)), 1.14, wide) + (L ? 0 : 0.1 * sm(u, 0, 2)), x: lerp(549, 800, wide), y: lerp(600, 545, wide) }, sh);
  candleBody(g, CANDLE[0], CANDLE[1]);
  const crouchAt = (tt) => (L ? trackSpring(tt, [[0, 4], [TOUCH - 0.4, 27], [OUT + 0.1, 15], [TIN, 23]], { feel: 'heavy', windUp: 0.05 }) : 23 + 5 * startle(tt - HEAR) + 6 * bump(tt, BLOW - 0.2, DARK + 0.3));
  const leanAt = (tt) => (L ? trackSpring(tt, [[0, -3], [TOUCH - 0.4, -15], [OUT + 0.1, -8], [TIN, -14]], { feel: 'heavy', windUp: 0.05 }) : -14 + 8 * startle(tt - HEAR) - 9 * bump(tt, BLOW - 0.2, DARK + 0.3));
  const crouch = crouchAt(u), V = { ...CV, crouch };
  const AT_WICK = handFor({ ...CV, crouch: 27 }, FLAME[0] - 38, FLAME[1] + 14, 1, 8), READ = handFor({ ...CV, crouch: 23 }, 322, 478, 0, -12), REST = [8, 66, 26], LOW = [-4, 72, 30];
  const armR = L ? armSpring(u, [[-9, REST], [STRIKE - 0.22, [34, 30, 52]], [STRIKE, [4, 52, 44]], [TOUCH - 0.4, AT_WICK], [LIT + 0.3, [26, 20, 50]], [OUT + 0.15, REST], [MIS + 0.3, 'hips']], { feel: 'snappy', windUp: 0.05 })
    : armSpring(u, [[-9, REST], [HEAR, 'out'], [HEAR + 0.45, REST]], { feel: 'snappy' });
  const armL = L ? armSpring(u, [[-9, LOW], [TIN, READ]], { delay: 0.05 }) : armSpring(u, [[-9, READ], [HEAR + 0.05, [-12, 30, 34]]], { delay: 0.05 });
  if (L && matchOn > 0 && u > OUT - 0.5) armR[1][0] += Math.sin(u * 40) * 7 * sm(u, OUT - 0.5, OUT - 0.3);          // he shakes the match out
  const expr = L ? exprTrack(u, [[-9, 'worried'], [STRIKE, 'determined'], [LIT + 0.1, 'happy'], [TIN + 0.5, 'determined'], [TIN + 1.9, 'happy']]) : exprTrack(u, [[-9, 'happy'], [HEAR, 'shock'], [HEAR + 0.4, 'scared'], [BLOW - 0.12, 'exhausted'], [DARK + 0.1, 'scared']]);
  const look = L ? (u < TIN + 0.3 ? [0.8, 0.55] : [0.55, 0.3]) : u < HEAR ? [0.55, 0.3] : u < BLOW - 0.2 ? [lerp(0.55, 1, so(u, HEAR + 0.02, HEAR + 0.12)), -0.1] : [0.8, 0.5];
  const drive = (tt) => -leanAt(tt) * 4, hairLag = clamp(-follow(drive, u, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag = clamp(-follow(drive, u, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10);
  let tip = null;
  const vo = { ...V, t, expr, look, lean: leanAt(u), headTilt: overlap(leanAt, u, 0.09, 0.8) + (L ? 5 * sm(u, TIN + 0.4, TIN + 0.8) : 5 - 9 * hear), arms: [armL, armR], hairLag, packLag, squash: hear, shake: L ? 0 : 0.3 * sm(u, HEAR, HEAR + 0.2),
    breath: breathe(t, L ? 2.8 : 1.2, 0.6), shadowA: 0.3, props: {
      left: (g2, h, info) => tin(g2, h[0] + 3, h[1] - 16 * info.s, 0.82 * info.s, -0.12),
      right: L && u > STRIKE - 0.45 && u < OUT + 0.12 ? (g2, h) => { const an = 0.3, len = 40; tip = [h[0] + Math.cos(an) * len, h[1] - 6 + Math.sin(an) * len * 0.2 - 10];
        g2.strokeStyle = INK; g2.lineWidth = 7; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(h[0], h[1] - 6); g2.lineTo(tip[0], tip[1]); g2.stroke(); g2.strokeStyle = '#d9b98a'; g2.lineWidth = 3.5; g2.stroke();
        g2.fillStyle = matchOn > 0 ? '#2a1a12' : '#a03024'; g2.beginPath(); g2.arc(tip[0], tip[1], 5, 0, 7); g2.fill(); } : null } };
  drawVini(g, A.vini, withAlive(vo, t, { energy: L ? 0.7 : 0.5 }));
  camEnd(g);
  // ---- light
  const fk = flick(t), src = lit > 0.02 || !tip ? FLAME : tip, pw = Math.max(lit, matchOn * 0.42 * (0.6 + 0.4 * so(u, STRIKE, STRIKE + 0.12)));
  warmDark(g, c, src, pw * (0.9 + 0.1 * fk) * (1 - 0.5 * blow), 650 * (0.94 + 0.06 * fk));
  if (pw < 0.5) { const [mx, my] = toScreen(c, 600, 330); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - pw * 2; g.fillStyle = radGrad(g, mx, my, 0, 640 * c.z, [alpha('#9fb4e8', 0.17), alpha('#9fb4e8', 0)]); g.fillRect(0, 0, W, H); g.restore(); }
  camRe(g, c, sh, () => { gapGlow(g, A, 0.45 * (1 - lit)); if (L) gapGlow(g, A, 0.75 * sm(u, MIS - 0.1, MIS + 0.3) * (0.85 + 0.15 * fk), true);
    if (matchOn > 0 && tip) { if (u < STRIKE + 0.18) { g.save(); g.globalAlpha = 1 - sm(u, STRIKE + 0.05, STRIKE + 0.18); g.strokeStyle = '#fff4c8'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const an = i * 0.9, r = 12 + 40 * so(u, STRIKE, STRIKE + 0.16); g.beginPath(); g.moveTo(tip[0] + Math.cos(an) * r * 0.5, tip[1] + Math.sin(an) * r * 0.5); g.lineTo(tip[0] + Math.cos(an) * r, tip[1] + Math.sin(an) * r); g.stroke(); } g.restore(); }
      flame(g, tip[0], tip[1] - 3, 0.6 * matchOn, t + 3); }
    if (lit > 0.02) flame(g, FLAME[0], FLAME[1], 0.6 + 0.4 * lit, t, blow);
    if (!L && u > BLOW && u < DARK + 0.1) { g.save(); g.strokeStyle = alpha('#f4efe2', 0.7); g.lineWidth = 3.5; g.lineCap = 'round'; const k = so(u, BLOW, DARK);     // the puff
      for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(lerp(318, 350, k), 470 + i * 12 + 30 * k); g.lineTo(lerp(340, 388, k), 482 + i * 16 + 44 * k); g.stroke(); } g.restore(); }
    if (!L && u > DARK) { const d = u - DARK; g.save(); g.strokeStyle = alpha('#c8ccd8', 0.5 * (1 - sm(d, 0.2, 0.55))); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(FLAME[0], FLAME[1] - 4);   // smoke
      for (let i = 1; i <= 8; i++) g.lineTo(FLAME[0] + Math.sin(i * 0.9 + d * 6) * 9 * i / 8 + 20 * d * i / 8, FLAME[1] - 4 - i * 16 * so(d, 0, 0.4)); g.stroke(); g.restore(); } });
  // ---- labels
  if (L) { const [fx, fy] = toScreen(c, FLAME[0], FLAME[1]), k1 = pop(t, T0 + 3.0) * (1 - sm(u, MIS - 0.5, MIS - 0.2));
    if (k1 > 0) { note(g, 'just ONE', fx + 330, fy - 30, { size: 74, k: k1 }); arrowTo(g, fx + 215, fy - 20, fx + 50, fy - 14, so(u, 3.05, 3.4) * clamp(k1), RED, -22); }
    const k2 = pop(t, T0 + 4.35) * (1 - sm(u, MIS - 0.5, MIS - 0.2)); if (k2 > 0) note(g, '“ingredients: beans.”', fx + 420, fy - 250, { size: 54, k: k2, rot: 0.03, color: '#f4efe2', glow: false });
    if (u > MIS) { const [wx, wy] = toScreen(c, 760, 272); note(g, 'MISTAKE #3', W * 0.69, H * 0.6, { size: 128, k: pop(t, T0 + MIS), rot: -0.06 }); arrowTo(g, W * 0.66, H * 0.53, wx + 10, wy + 16, so(u, MIS + 0.25, MIS + 0.65), RED, 30);
      note(g, 'visible from OUTSIDE', W * 0.7, H * 0.71, { size: 54, k: pop(t, T0 + MIS + 0.7), rot: -0.04, color: '#f4efe2', glow: false }); } }
  else note(g, '3:00 AM', W * 0.8, H * 0.16, { size: 84, k: pop(t, T0 + 0.25), color: '#f4efe2', glow: false });
  vignette(g, 0.5);
  if (!L) fade(g, sm(u, DARK + 0.02, DARK + 0.3), '#060607');
}

// ---------- RULE 9 (same notebook look as Rule 1 / Rule 2 in day1.js / day1b.js) ----------
const wk = (t, at, str, cps = 18) => clamp((t - at) / Math.max(0.25, str.length / cps));
const drawK = (t, at, dur = 0.5) => ease.out(clamp((t - at + 0.08) / dur));
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
function rule9(g, t) { const T0 = T_R9; page(g, t, T0, () => {
  heading(g, t, 9, 'AT NIGHT…', T0 + 0.3, T0 + 1.25);
  { const x = 1500, y = 170, k = drawK(t, T0 + 1.9, 0.4); penStrokes(g, [[[[x + 20, y - 52], [x - 22, y - 38], [x - 40, y], [x - 22, y + 38], [x + 20, y + 52], [x - 2, y + 26], [x - 8, y], [x - 2, y - 26], [x + 20, y - 52]], 6]], k); }   // a moon
  { const x = 620, y = 600, k = drawK(t, T0 + 2.0, 0.5);                                                                    // a candle
    penStrokes(g, [[[[x - 34, y + 110], [x - 34, y - 20], [x + 34, y - 20], [x + 34, y + 110], [x - 34, y + 110]], 7], [[[x, y - 20], [x + 2, y - 44]], 6], [[[x, y - 50], [x - 24, y - 84], [x, y - 140], [x + 24, y - 84], [x, y - 50]], 7],
      [[[x - 60, y - 110], [x - 92, y - 124]], 5], [[[x + 60, y - 110], [x + 92, y - 124]], 5], [[[x, y - 164], [x, y - 196]], 5], [[[x - 80, y + 112], [x + 80, y + 112]], 7]], k);
    writeOn(g, 'NO LIGHT', x, 800, wk(t, T0 + 2.3, 'NO LIGHT', 16), { size: 74, font: 'Permanent Marker', pen: k >= 1 }); cross(g, x, y - 10, 120, so(t, T0 + 2.95, T0 + 3.3));
    writeOn(g, '(not even one candle)', x, 868, wk(t, T0 + 3.5, '(not even one candle)', 34), { size: 44, pen: false }); }
  { const x = 1250, y = 590, k = drawK(t, T0 + 3.2, 0.5);                                                                   // a megaphone
    penStrokes(g, [[[[x - 100, y - 28], [x + 50, y - 90], [x + 50, y + 90], [x - 100, y + 28], [x - 100, y - 28]], 7], [[[x - 64, y + 40], [x - 50, y + 104]], 7],
      [[[x + 88, y - 50], [x + 108, y], [x + 88, y + 50]], 6], [[[x + 124, y - 84], [x + 156, y], [x + 124, y + 84]], 6]], k);
    writeOn(g, 'NO NOISE', x + 20, 800, wk(t, T0 + 3.55, 'NO NOISE', 16), { size: 74, font: 'Permanent Marker', pen: k >= 1 }); cross(g, x + 20, y, 120, so(t, T0 + 4.0, T0 + 4.35)); }
}); }

// ---------- the three habits (clip 11_day18c) ----------
// 1: covering every gap in the boards
const PATCHES = [[430, 158, 330, 44, -9, 0.02], [788, 102, 320, 44, -9, -0.03], [788, 272, 320, 46, -9, 0.025], [450, 262, 200, 44, 1.25, -0.03], [430, 352, 330, 44, 2.2, 0.02]];   // [cx, cy, w, h, time it goes on, tilt]
function patch(g, cx, cy, w, h, rot, k) { if (k <= 0) return; g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k); g.globalAlpha = clamp(k * 3);
  g.fillStyle = '#4a4f45'; g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 3); g.lineTo(w / 2 - 6, -h / 2); g.lineTo(w / 2, h / 2 - 4); g.lineTo(-w / 2 + 5, h / 2); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = alpha(INK, 0.3); g.lineWidth = 2; for (let x = -w / 2 + 30; x < w / 2 - 10; x += 46) { g.beginPath(); g.moveTo(x, -h / 2 + 7); g.quadraticCurveTo(x + 8, 0, x - 2, h / 2 - 7); g.stroke(); }
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * (w / 2 - 12), 0); g.rotate(sx * 0.5); g.fillStyle = '#b9b3a0'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.rect(-30, -11, 60, 22); g.fill(); g.stroke(); g.restore(); }
  g.restore(); }
function vGaps(g, t, A) { const u = t - T_V1, FY = 812, V = { x: 222, y: FY, s: 1.85, turn: 0.55 };
  const c = camBegin(g, A.bg.barricade, { z: lerp(1.5, 1.62, sm(u, 0, 3.4)), x: 630, y: 440 });
  g.fillStyle = '#6b5236'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.rect(150, FY - 2, 150, 62); g.fill(); g.stroke(); g.beginPath(); g.moveTo(150, FY + 28); g.lineTo(300, FY + 28); g.stroke();   // the crate he stands on
  for (const [cx, cy, w, h, at, rot] of PATCHES) patch(g, cx, cy, w, h, rot, at < 0 ? 1 : pop(u, at, 0.22));
  const P1 = handFor(V, 388, 266, 1, 10), P2 = handFor(V, 398, 350, 1, 10), BACK = [20, 30, 40];
  const armR = armSpring(u, [[-9, BACK], [0.95, P1], [1.55, BACK], [1.9, P2], [2.6, 'hips']], { feel: 'snappy', windUp: 0.08 }), armL = armSpring(u, [[-9, [-4, 60, 30]], [0.9, [-10, 20, 44]], [2.65, 'hips']], { delay: 0.05 });
  const hit = startle(u - 1.25) + startle(u - 2.2), leanAt = (tt) => -5 - 5 * (bump(tt, 0.95, 1.55) + bump(tt, 1.9, 2.5)) + 5 * sm(tt, 2.6, 2.9);
  drawVini(g, A.vini, withAlive({ ...V, t, expr: exprTrack(u, [[-9, 'determined'], [2.65, 'happy']]), look: u < 1.6 ? [0.7, -0.7] : u < 2.6 ? [0.7, -0.3] : [0.5, -0.5], lean: leanAt(u), headTilt: overlap(leanAt, u, 0.09, 0.8) - 4,
    arms: [armL, armR], squash: 0.6 * hit, crouch: -2 * (bump(u, 0.95, 1.55)), breath: breathe(t, 2.6, 0.6), hairLag: clamp(-follow((tt) => -leanAt(tt) * 4, u, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), shadow: false }, t, { energy: 0.6 }));
  camEnd(g);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c9cfe0'; g.fillRect(0, 0, W, H); g.restore();
  for (const [cx, cy, , , at] of PATCHES.slice(3)) { const d = u - at; if (d > 0 && d < 0.35) { const [sx, sy] = toScreen(c, 395, cy); g.save(); g.globalAlpha = 1 - sm(d, 0.1, 0.35); g.strokeStyle = '#f4efe2'; g.lineWidth = 6; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const an = i * 1.05 + 0.4, r = 70 + 60 * so(d, 0, 0.2); g.beginPath(); g.moveTo(sx + Math.cos(an) * r, sy + Math.sin(an) * r * 0.6); g.lineTo(sx + Math.cos(an) * (r + 34), sy + Math.sin(an) * (r + 34) * 0.6); g.stroke(); } g.restore(); } }
  note(g, 'every. single. gap.', W * 0.7, H * 0.78, { size: 76, k: pop(u, 1.4), rot: -0.03 });
  vignette(g, 0.4); }
// 2: cooking only in daylight
function stove(g, x, y, t) { g.save(); g.translate(x, y); g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round';
  g.fillStyle = '#3f6fa8'; g.beginPath(); g.roundRect(-34, -40, 68, 40, 8); g.fill(); g.stroke(); g.fillStyle = '#e6e0d0'; g.fillRect(-20, -30, 40, 12); g.strokeRect(-20, -30, 40, 12);          // gas canister
  g.fillStyle = '#55585c'; g.beginPath(); g.rect(-12, -52, 24, 12); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-44, -56); g.lineTo(44, -56); g.stroke();                                    // burner + pan support
  for (let i = -2; i <= 2; i++) { const h = 9 + 3 * Math.sin(t * 14 + i * 1.7); g.fillStyle = '#6fc3ff'; g.beginPath(); g.moveTo(i * 9 - 4, -57); g.quadraticCurveTo(i * 9, -57 - h * 1.8, i * 9 + 4, -57); g.fill(); }
  g.fillStyle = '#2c2d30'; g.beginPath(); g.moveTo(-50, -96); g.lineTo(50, -96); g.lineTo(44, -66); g.lineTo(-44, -66); g.closePath(); g.fill(); g.stroke();                                    // pan
  g.fillStyle = '#b5552a'; g.beginPath(); g.ellipse(0, -96, 49, 8, 0, 0, 7); g.fill(); g.stroke(); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(50, -88); g.lineTo(112, -100); g.stroke();
  g.strokeStyle = alpha('#f4efe2', 0.55); g.lineWidth = 4; for (let i = -1; i <= 1; i++) { const ph = t * 1.6 + i * 0.37, k = ph - Math.floor(ph); g.globalAlpha = Math.sin(Math.PI * k) * 0.8; g.beginPath(); g.moveTo(i * 20, -108 - k * 60);
    g.quadraticCurveTo(i * 20 + 12 * Math.sin(t * 3 + i), -128 - k * 60, i * 20 - 4, -150 - k * 60); g.stroke(); }
  g.restore(); }
function vCook(g, t, A) { const u = t - T_V2, V = { x: 800, y: 992, s: 2.0, turn: 0.68, crouch: 74 };
  const c = camBegin(g, A.bg.barricade, { z: lerp(1.5, 1.42, sm(u, 0, 1.9)), x: 930, y: 720 });
  const stir = (tt) => Math.sin(tt * 6.2), HX = 1012 + 26 * stir(u), HY = 846 + 6 * Math.cos(u * 6.2);
  const armR = [[0, 0], handFor(V, HX - 6, HY - 4, 1, 8)], armL = armSpring(u, [[-9, [-8, 52, 30]], [1.0, 'out'], [1.45, [-8, 52, 30]]], { feel: 'snappy' });
  const leanAt = (tt) => -10 + 1.5 * stir(tt - 0.1);
  stove(g, 1010, 990, t);
  drawVini(g, A.vini, withAlive({ ...V, t, expr: exprTrack(u, [[-9, 'happy'], [0.95, 'determined'], [1.5, 'happy']]), look: u > 0.95 && u < 1.5 ? [0.2, -0.9] : [0.75, 0.6], lean: leanAt(u), headTilt: overlap(leanAt, u, 0.09, 0.8) + (u > 0.95 && u < 1.5 ? -6 : 3),
    arms: [armL, armR], breath: breathe(t, 2.6, 0.6), hairLag: clamp(stir(u - 0.15) * 0.8, -2.5, 2.5), packLag: stir(u - 0.2) * 1.5,
    props: { right: (g2, h) => { g2.strokeStyle = INK; g2.lineWidth = 8; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(h[0], h[1] - 8); g2.lineTo(h[0] + 8, h[1] + 44); g2.stroke(); g2.strokeStyle = '#c9a36a'; g2.lineWidth = 4; g2.stroke(); } } }, t, { energy: 0.6 }));
  camEnd(g);
  camRe(g, c, [0, 0], () => { gapGlow(g, A, 0.55, true); g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x0, x1, y0] of [[300, 560, 158], [660, 920, 272], [660, 920, 426]]) { g.fillStyle = linGrad(g, 0, y0, 0, y0 + 640, [alpha('#ffe2a8', 0.16), alpha('#ffe2a8', 0)]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + 260, y0 + 640); g.lineTo(x0 + 180, y0 + 640); g.closePath(); g.fill(); } g.restore(); });
  note(g, 'cooking hours: DAYLIGHT only', W * 0.63, H * 0.2, { size: 70, k: pop(u, 0.3), rot: -0.03 });
  { const x = W * 0.9, y = H * 0.36, k = pop(u, 0.55); if (k > 0) { g.save(); g.translate(x, y); g.scale(k, k); g.rotate(u * 0.4); g.strokeStyle = RED; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(an) * 44, Math.sin(an) * 44); g.lineTo(Math.cos(an) * 62, Math.sin(an) * 62); g.stroke(); } g.restore(); } }
  vignette(g, 0.36); }
// 3: whispering, even to himself
function vWhisper(g, t, A) { const u = t - T_V3, ANS = 2.0, OFT = 2.95, V = { x: 690, y: 965, s: 2.0 };
  const c = camBegin(g, A.bg.barricade, { z: lerp(1.5, 1.62, sm(u, 0, 5.7)), x: lerp(720, 760, sm(u, 0, 5.7)), y: 590 });
  const turnAt = (tt) => 0.42 - 0.84 * sm(tt, ANS - 0.25, ANS + 0.1) + 0.5 * sm(tt, OFT + 0.3, OFT + 0.7), leanAt = (tt) => -6 * bump(tt, 0.35, ANS - 0.2) + 6 * bump(tt, ANS, OFT + 0.3) + trackSpring(tt, [[0, 0], [OFT + 0.45, 2]], { feel: 'heavy' });
  const tn = turnAt(u), CUP_R = [-2, -28, 34], CUP_L = [-2, -28, 34];
  const armR = armSpring(u, [[-9, 'relaxed'], [0.3, CUP_R], [ANS - 0.3, 'relaxed'], [OFT + 0.5, 'shrug']], { feel: 'snappy' }), armL = armSpring(u, [[-9, 'relaxed'], [ANS - 0.1, CUP_L], [OFT + 0.2, 'relaxed'], [OFT + 0.5, 'shrug']], { feel: 'snappy', delay: 0.05 });
  const vo = { ...V, t, turn: tn, expr: exprTrack(u, [[-9, 'worried'], [0.4, 'exhausted'], [1.3, 'worried'], [ANS, 'exhausted'], [ANS + 0.75, 'happy'], [OFT + 0.5, 'worried']]), look: [u < ANS - 0.3 ? 0.6 : u < OFT + 0.3 ? -0.6 : 0, 0], lean: leanAt(u), headTilt: overlap(leanAt, u, 0.09, 0.8) - 5 * sm(u, OFT + 0.5, OFT + 0.9),
    arms: [armL, armR], breath: breathe(t, 2.8, 0.6), hairLag: clamp(-follow((tt) => turnAt(tt) * 30 - leanAt(tt) * 4, u, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow((tt) => turnAt(tt) * 30 - leanAt(tt) * 4, u, { freq: 1.8, damp: 0.38 }) * 2.8, -10, 10) };
  const pose = drawVini(g, A.vini, withAlive(vo, t, { energy: 0.8 })); camEnd(g);
  nightGrade(g, 0.5, [[...toScreen(c, 600, 330), 700 * c.z, '#9fb4e8', 0.14]]);
  const [hx, hy] = toScreen(c, V.x, V.y - 272 * V.s), tiny = { size: 44, color: '#f4efe2', glow: false };
  note(g, 'psst… we should eat the beans.', hx + 400, hy - 60, { ...tiny, k: pop(u, 0.5) * (1 - sm(u, OFT, OFT + 0.3)), rot: 0.02 });
  note(g, 'good point, Vini.', hx - 330, hy - 10, { ...tiny, k: pop(u, ANS + 0.1) * (1 - sm(u, OFT, OFT + 0.3)), rot: -0.03 });
  if (u > OFT) { const x = W * 0.73, y = H * 0.3; note(g, 'chats with self (today):', x, y, { size: 62, k: pop(u, OFT + 0.1), rot: -0.02 });
    g.strokeStyle = RED; g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const at = OFT + 0.55 + i * 0.09, k = so(u, at, at + 0.08); if (k <= 0) continue; const grp = Math.floor(i / 5), j = i % 5, bx = x - 250 + grp * 150, by = y + 75;
      g.lineWidth = 9; g.strokeStyle = alpha('#f4efe2', 0.8); for (const [lw, col] of [[11, alpha('#f4efe2', 0.8)], [6, RED]]) { g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); if (j < 4) { g.moveTo(bx + j * 22, by); g.lineTo(bx + j * 22 - 4, by + 60 * k); } else { g.moveTo(bx - 16, by + 46); g.lineTo(bx - 16 + 104 * k, by + 46 - 34 * k); } g.stroke(); } } }
  vignette(g, 0.42); fade(g, sm(t, DUR - 0.3, DUR)); }

// ---------- the scene ----------
const KNOCK_OPTS = { knocks: [[VOB + 2.4 - T_K, 1], [VOB + 3.45 - T_K, 1.1]], cuts: [[-9, 'wide'], [VOB + 2.05 - T_K, 'door'], [VOB + 4.55 - T_K, 'wide'], [VOB + 6.66 - T_K, 'close'], [VOB + 9.62 - T_K, 'mid'], [VOB + 12.7 - T_K, 'door'], [VOB + 14.9 - T_K, 'mid']],
  vinAt: VOB + 4.75 - T_K, holdAt: VOB + 8.1 - T_K, sweatAt: VOB + 7.0 - T_K, legAt: VOB + 9.75 - T_K, hourAt: VOB + 12.8 - T_K, leaveAt: VOB + 13.55 - T_K, exhaleAt: VOB + 15.05 - T_K };
export function draw(g, t, A) { g.save();
  if (t < T_C1) { cityShot(g, t, A); dayCounter(g, 18, t, VOA); }
  else if (t < T_P2) candleShot(g, t, A, T_C1, 'light');
  else if (t < T_R9) { windowCandle(g, t, A); dayCounter(g, 18, t, VOA); }
  else if (t < T_C2) rule9(g, t);
  else if (t < T_BLK) { candleShot(g, t, A, T_C2, 'blow'); dayCounter(g, 18, t, VOA); }
  else if (t < T_K) { blackout(g); const sh = [K1, K2].map((k) => camShake(t, 14, k, 0.45)); g.save(); g.translate(sh[0][0] + sh[1][0], sh[0][1] + sh[1][1]);
    knockWord(g, t, K1, 1.0, W * 0.5, H * 0.47, 0); knockWord(g, t, K2, 1.15, W * 0.52, H * 0.5, 1); g.restore(); }
  else if (t < T_V1) { const lt = t - T_K, r = knockShot(g, lt, A, KNOCK_OPTS), pale = { color: '#d8e0ff', glow: false };
    if (r.view === 'close') { note(g, 'moving:  no', W * 0.72, H * 0.3, { size: 70, k: pop(t, VOB + 6.9), ...pale, rot: -0.02 }); note(g, 'breathing:  also no', W * 0.74, H * 0.42, { size: 70, k: pop(t, VOB + 8.3), ...pale, rot: 0.02 }); }
    fade(g, 1 - sm(t, T_K, T_K + 0.45)); }
  else if (t < T_V2) { vGaps(g, t, A); dayCounter(g, 18, t, VOA); }
  else if (t < T_V3) { vCook(g, t, A); dayCounter(g, 18, t, VOA); }
  else { vWhisper(g, t, A); }
  g.restore(); }
