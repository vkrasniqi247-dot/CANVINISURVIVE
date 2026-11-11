// src/zombie/zombie.js — the Rigby2D-rigged infected (rig/zombie_parts.html → public/zombie/), drawn by the same
// runtime as Vini. Pure functions of time: the lurch, the reaching arms and the head loll all come from o.t + o.seed.
import { drawVini } from '../vini/rig.js';

// outfits (reference/characters/Zombies_Design.png) and the plain-clothes humans who run past in d6
export const KINDS = {
  office: {}, worker: { torso: '_worker', arms: '_worker', hair: '_worker' }, teen: { torso: '_teen', arms: '_teen', hair: '_teen' },
  runnerA: { torso: '_jacket', arms: '_jacket', head: '_human', eyes: '_human', hair: '_human' },
  runnerB: { torso: '_coat', arms: '_coat', head: '_human', eyes: '_human', hair: '_teen' },
};
// same stride speed as v1 (feet stay planted at this speed for a given cadence)
export const strideSpeed = (s, cad = 1) => 65 * s * cad;

// o: x, y (feet), s (scale), t, kind, seed, dir (0 = walking at the camera, -1 / +1 = walking screen-left / right),
//    walkDist (v1 units travelled, for dir ±1, so feet plant), cad (cycles per second), headTurn, shake, b (brightness 0..1),
//    expr ('zombie' | 'groan'), walk (false = standing), arms (override), alpha
export function drawZombie(g, rig, o) {
  const t = o.t || 0, sd = o.seed || 0, cad = o.cad ?? 0.55, dir = o.dir ?? 0, steps = (t * cad + sd) * 2, walking = o.walk !== false;
  const sway = Math.sin(t * 1.6 + sd * 2.1) * 4, jerk = Math.sin(t * 1.3 + sd) > 0.85 ? Math.sin(t * 9 + sd) * 4 : 0;
  // at camera: one arm up and out, one bent across (it reads as reaching toward us); in profile: both straight ahead
  const arms = o.arms || (dir === 0 ? [[36, 10 + sway, 70], [8, 30 - sway, 70]] : [[8, 6 + sway, 76], [8, 12 - sway, 70]]);
  const opts = { x: o.x, y: o.y, s: o.s, t: t + sd * 3, skin: KINDS[o.kind || 'office'], expr: o.expr || 'zombie', blink: false, arms, alpha: o.alpha,
    turn: dir === 0 ? (o.headTurn || 0) * 0.5 : dir * 0.95, look: [dir * 0.6, 0.15],
    headTilt: Math.sin(t * 1.25 + sd) * 7 + jerk + (dir === 0 ? 0 : -dir * 6), lean: dir === 0 ? Math.sin(Math.PI * steps) * 2.5 : -dir * 8,
    shake: o.shake || 0, shadowA: 0.3 };
  if (walking) Object.assign(opts, dir === 0 ? { march: steps, drag: 1, lift: 8 } : { walkDist: o.walkDist ?? dir * steps * 22, stride: 22, lift: 7, drag: 1 });
  if (o.b != null && o.b < 0.999) { g.save(); g.filter = `brightness(${o.b.toFixed(3)})`; drawVini(g, rig, opts); g.restore(); return; }
  drawVini(g, rig, opts);
}

// a panicking human running across (d6): side view, arms up, terror face
export function drawRunner(g, rig, o) {
  const t = o.t || 0, flail = Math.sin(t * 13 + (o.seed || 0)) * 10;
  drawVini(g, rig, { x: o.x, y: o.y, s: o.s, t, skin: KINDS[o.kind || 'runnerA'], expr: 'terror', turn: o.dir ?? 1, walkDist: o.walkDist, stride: 34, lift: 18,
    arms: [[30, -38 + flail, 56], [24, -30 - flail, 40]], lean: -(o.dir ?? 1) * 9, look: [o.dir ?? 1, -0.2], shadow: o.shadow, shadowA: 0.3 });
}
