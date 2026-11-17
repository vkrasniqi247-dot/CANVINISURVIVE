// src/kit/motion.js — motion helpers that stop moves looking robotic, hinged or frozen.
// Same conventions as kit.js: everything is a pure function of time in SECONDS. No Math.random / Date.now.
//
//   moveK / move / trackSpring   wind-up, fast start, overshoot, settle (replaces ease.inOut on acting moves)
//   armSpring                    drop-in for armTrack: hands wind up, overshoot, settle and travel in an arc
//   overlap                      a child part trails its parent, then catches up (head after chest, etc.)
//   alive / withAlive            weight shift, head drift, eye darts while he "does nothing"
import { clamp, lerp, ease, resolveArm } from './kit.js';
import { FACES } from '../vini/rig.js';

// ---------- spring step: 0 -> 1 starting at dt = 0, overshooting when damp < 1 ----------
// freq = how fast (Hz), damp = how quickly it settles (1 = no overshoot, 0.5 = ~16% overshoot, 0.62 = ~8%).
export function springK(dt, { freq = 3.2, damp = 0.55 } = {}) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damp >= 1) return 1 - (1 + w * dt) * Math.exp(-w * dt);
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * dt) * (Math.cos(wd * dt) + (damp * w / wd) * Math.sin(wd * dt));
}
export const FEEL = {
  snappy: { freq: 3.6, damp: 0.5 },    // hands, heads, reactions
  arm: { freq: 3.4, damp: 0.62 },      // arm poses: a small overshoot that never looks rubbery
  heavy: { freq: 2.0, damp: 0.58 },    // torso, landings, big steps
  soft: { freq: 2.6, damp: 1 },        // slow, careful moves: no overshoot
};
const feelOf = (f) => (typeof f === 'string' ? FEEL[f] || FEEL.snappy : f || FEEL.snappy);

// 0 -> 1 for a move that starts at dt = 0: pulls back by `windUp` over the `windUpDur` seconds before it,
// then springs through to 1.
export function moveK(dt, { windUp = 0.1, windUpDur = 0.14, feel = 'snappy' } = {}) {
  if (dt <= -windUpDur) return 0;
  if (dt < 0) return -windUp * ease.sine((dt + windUpDur) / windUpDur);
  return -windUp + (1 + windUp) * springK(dt, feelOf(feel));
}
export const move = (t, from, to, t0, o) => from + (to - from) * moveK(t - t0, o);

// keyed scalar track where every key is a sprung move that STARTS at its time: [[t, v], ...]
// (same key meaning as armTrack; unlike track(), which arrives at the key time)
export function trackSpring(t, keys, o) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * moveK(t - keys[i][0], o);
  return v;
}

// ---------- arms ----------
// Drop-in for armTrack(t, keys): each key [t, preset | [elbow, hand] | hand] starts a move at its time.
// The hand winds up a touch, springs past the pose and settles, and its path bows into an arc (hands never
// travel in a straight line). o.arc = how far the path bows, as a fraction of the distance moved (0 = straight).
// o.delay shifts the whole track later (give one arm ~0.05 s so both hands never start on the same frame).
export function armSpring(t, keys, o = {}) {
  const { arc = 0.16, arcDur = 0.3, delay = 0, feel = 'arm', windUp = 0.07, windUpDur = 0.12 } = o;
  const K = keys.map(([kt, p]) => [kt + delay, resolveArm(p)]);
  const e = K[0][1][0].slice(), h = K[0][1][1].slice();
  for (let i = 1; i < K.length; i++) {
    const A = K[i - 1][1], B = K[i][1], dt = t - K[i][0], k = moveK(dt, { windUp, windUpDur, feel });
    if (k === 0) continue;
    for (let j = 0; j < 2; j++) e[j] += (B[0][j] - A[0][j]) * k;
    for (let j = 0; j < 3; j++) h[j] += (B[1][j] - A[1][j]) * k;
    if (arc && dt > 0 && dt < arcDur) {                    // bow the path: push the hand out, perpendicular to its travel
      const dx = B[1][0] - A[1][0], dy = B[1][1] - A[1][1], b = Math.sin(Math.PI * dt / arcDur) * arc;
      let nx = -dy, ny = dx; if (Math.abs(dy) > Math.abs(dx) ? nx < 0 : ny > 0) { nx = -nx; ny = -ny; }   // up/down moves bow outward (away from the body), sideways moves bow upward
      h[0] += nx * b; h[1] += ny * b;
    }
  }
  return [e, h];
}

// ---------- overlap ----------
// Extra offset for a child so it trails its parent: 0 while the parent is still, so it always settles back.
//   headTilt: overlap(leanAt, t, 0.09, 0.6)   // the head arrives a beat after the chest
export const overlap = (fn, t, lag = 0.09, amount = 0.5) => (fn(t - lag) - fn(t)) * amount;

// ---------- alive: never frozen ----------
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
// eyes hold, then dart to a new spot in ~0.07 s (one dart per ~1.3 s cell at a hashed moment)
function dart(t, seed, axis) {
  const C = 1.3, n = Math.floor(t / C), at = n * C + 0.15 + hash(n * 3 + seed * 101) * (C - 0.3);
  const v = (m) => (hash(m * 7 + seed * 53 + axis * 911) - 0.5) * 2;
  return t < at ? v(n - 1) : lerp(v(n - 1), v(n), ease.out((t - at) / 0.07));
}
// Small offsets to ADD to drawVini opts. energy: 1 = normal, 0.4 = hiding / holding still, 1.8 = panicking.
// Two slow waves that never line up drive the weight shift, so it never reads as a loop; the head follows late.
export function alive(t, { seed = 0, energy = 1 } = {}) {
  const ph = hash(seed * 17 + 5) * 6.283, T = 2 * Math.PI;
  const sway = (tt) => Math.sin(tt / 5.3 * T + ph) * 0.62 + Math.sin(tt / 8.9 * T + ph * 1.7) * 0.38;
  return {
    hipX: sway(t) * 0.9 * energy,                 // v1 units: weight shifts from foot to foot
    lean: -sway(t - 0.25) * 0.7 * energy,         // degrees: the chest counters the hips
    headTilt: sway(t - 0.6) * 1.3 * energy,       // degrees: the head drifts after the body
    look: [dart(t, seed, 0) * 0.07 * energy, dart(t, seed, 1) * 0.04 * energy],
  };
}
// merge alive() into a drawVini opts object (adds to whatever the scene already set)
export function withAlive(o, t, cfg) {
  const a = alive(t, cfg), look = o.look || [0, 0];
  return { ...o, hipX: (o.hipX || 0) + a.hipX, lean: (o.lean || 0) + a.lean, headTilt: (o.headTilt || 0) + a.headTilt,
    look: [clamp(look[0] + a.look[0], -1, 1), clamp(look[1] + a.look[1], -1, 1)] };
}

// ---------- faces ----------
// Keyed expressions that change like a face does: [[t, 'worried'], [t, 'shock'], ...] -> a face for drawVini's `expr`.
// The brows travel to the new shape with a small overshoot instead of snapping; most changes pass through a
// blink; shock and terror skip the blink and pop the eyes wide (then ease back to slightly wide); a happy or
// relieved face squeezes the eyes a touch. bd = how long the change takes.
const WIDE = { shock: 1.14, terror: 1.2, scared: 1.07 }, NARROW = { determined: 0.9, happy: 0.94, exhausted: 0.88 };
export function exprTrack(t, keys, bd = 0.2) {
  let i = 0; for (let j = 0; j < keys.length; j++) if (t >= keys[j][0]) i = j;
  const nb = keys[i][1], na = i ? keys[i - 1][1] : nb, B = FACES[nb] || FACES.neutral, A = FACES[na] || FACES.neutral;
  const dt = t - keys[i][0], k = i ? clamp(dt / bd) : 1, e = ease.outBack(k), pop = !!WIDE[nb] && nb !== 'scared';
  const rest = (n) => WIDE[n] ?? NARROW[n] ?? 1;
  const eyeScale = lerp(rest(na), rest(nb), ease.out(k)) + (i && pop ? 0.3 * Math.exp(-dt * 7) * Math.min(1, dt / 0.05) : 0);
  const blinkNow = i > 0 && !pop && k > 0.12 && k < 0.6;
  return { mouth: k < (pop ? 0.05 : 0.4) ? A.mouth : B.mouth, brow: [lerp(A.brow[0], B.brow[0], e), lerp(A.brow[1], B.brow[1], e)],
    closed: blinkNow || (k < 0.4 ? A.closed : B.closed) ? 1 : 0, eyeScale, mouthScale: 1 + (i && pop ? 0.25 * Math.exp(-dt * 6) : 0) };
}
