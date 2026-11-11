// tl/vini/kit.js — shared toolkit for "Can Vini Survive?" episodes on AI-painted backgrounds.
// Characters (Vini, zombies), smooth arm blending, camera over a background image, overlays (labels, DAY
// counter, supply tracker, notebook page). All deterministic: no Math.random / Date.now.
import { E, clamp, lerp, ease, alpha, rng, radGrad, linGrad } from '/engine/core.js';
import { drawInkFront, INK_ARMS } from '/engine/ink2d.js';
import { VINI } from '/tl/vini/vini.js';
import { ZOMBIES } from '/tl/vini/zombies.js';
export const W = 1920, H = 1080, RED = '#c8262e', INK = '#17140f';

// ---------- the official in-video Vini (profile-pic match) ----------
export const VV = { ...VINI, hair: { style: 'messy', color: '#3a271b' }, top: { ...VINI.top, color: '#4f7052' }, backpack: '#654733', inkSkin: '#ebdccd', headShade: 0.16 };
export const ZZ = Object.fromEntries(Object.entries(ZOMBIES).map(([k, z]) => [k, { ...z, dotEyes: true }]));

// ---------- timing helpers ----------
export const sm = (t, a, b) => ease.inOut(clamp((t - a) / (b - a)));          // smooth 0..1 between a and b
export const so = (t, a, b) => ease.out(clamp((t - a) / (b - a)));
export const pop = (t, t0, d = 0.3) => { const k = clamp((t - t0) / d); return k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2); };
export const settle = (t, t0, amp = 0.12, f = 14, d = 6) => (t < t0 ? 0 : Math.sin((t - t0) * f) * Math.exp(-(t - t0) * d) * amp);

// ---------- smooth arm poses ----------
const resolve = (p) => (typeof p === 'string' ? INK_ARMS[p] : p);
export function armLerp(a, b, k) { const A = resolve(a), B = resolve(b); k = ease.inOut(clamp(k)); return [[lerp(A[0][0], B[0][0], k), lerp(A[0][1], B[0][1], k)], [lerp(A[1][0], B[1][0], k), lerp(A[1][1], B[1][1], k)]]; }
// keyed arm track: [[t, preset], ...] with blend duration bd
export function armTrack(t, keys, bd = 0.28) { let cur = keys[0][1]; for (let i = 1; i < keys.length; i++) { if (t < keys[i][0]) break; const prev = keys[i - 1][1]; cur = armLerp(prev, keys[i][1], (t - keys[i][0]) / bd); } return resolve(cur); }
export function arms2(t, L, R, bd) { return [armTrack(t, L, bd), armTrack(t, R, bd)]; }
// keyed scalar track (turn, lean, …)
export function track(t, keys, fn = ease.inOut) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, fn((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
// keyed discrete track (expressions)
export function pick(t, keys) { let v = keys[0][1]; for (const [k, x] of keys) if (t >= k) v = x; return v; }


// ---------- colour toning baked into the character palette (much faster than canvas filters) ----------
const _hex = (c) => { const m = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.substr(i, 2), 16)); };
const _toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function toneCol(c, sat = 1, b = 1) { if (typeof c !== 'string' || c[0] !== '#' || c.length !== 7) return c; const [r, g2, bl] = _hex(c), L = 0.3 * r + 0.59 * g2 + 0.11 * bl; return _toHex([r, g2, bl].map((v) => (L + (v - L) * sat) * b)); }
const _toneCache = new Map();
export function toned(ch, sat, b) { const key = (ch.name || '') + (ch.top?.color || '') + sat + '|' + b; if (_toneCache.has(key)) return _toneCache.get(key);
  const T = (c) => toneCol(c, sat, b), out = { ...ch, inkSkin: T(ch.inkSkin || '#f3f1ec'), hair: ch.hair ? { ...ch.hair, color: T(ch.hair.color || '#3a2418') } : ch.hair, top: ch.top ? { ...ch.top, color: T(ch.top.color), color2: ch.top.color2 && T(ch.top.color2) } : ch.top,
    bottom: ch.bottom ? { ...ch.bottom, color: ch.bottom.color && T(ch.bottom.color) } : ch.bottom, backpack: ch.backpack && T(ch.backpack), headColor: ch.headColor && T(ch.headColor), stainColor: ch.stainColor && T(ch.stainColor), shoeColor: ch.shoeColor && T(ch.shoeColor) };
  _toneCache.set(key, out); return out; }

// ---------- characters ----------
export function shadow(g, x, y, s, a = 0.36) { g.fillStyle = `rgba(25,20,16,${a})`; g.beginPath(); g.ellipse(x, y + 2, 60 * s, 11 * s, 0, 0, Math.PI * 2); g.fill(); }
export function vini(g, o) { const { x, y, s } = o; if (o.shadow !== false) shadow(g, x, y, s);
  drawInkFront(g, { turn: 0.3, seed: 1, ...o, char: toned(o.char || VV, 0.92, o.b ?? 0.95), shadow: false }); }
export const ZOMBIE_ARMS = [[[40, 12], [82, 2]], [[-6, 16], [-34, 6]]];   // both reaching to screen-left
export const ZOMBIE_ARMS_R = [[[-6, 16], [-34, 6]], [[40, 12], [82, 2]]];  // both reaching to screen-right
export const ZOMBIE_ARMS_F = [[[18, 20], [30, 2]], [[18, 20], [30, 2]]];     // both reaching towards camera
export function zombie(g, o) { const { x, y, s, t } = o; const z = ZZ[o.kind || 'office'], ph = o.seed || 0;
  if (o.shadow !== false) shadow(g, x, y, s, 0.3);
  const cad = o.cad ?? 0.55, sway = Math.sin(t * 1.7 + ph) * 0.07;
  const zc = toned(z, 0.85, o.b ?? 0.9);
  const d = o.dir ?? -1; drawInkFront(g, { char: zc, x, y, s, t: t * cad + ph, walk: o.walk ?? 1, expr: 'zombie', arms: o.arms || (d > 0 ? ZOMBIE_ARMS_R : d < 0 ? ZOMBIE_ARMS : ZOMBIE_ARMS_F), turn: d * 0.55 + (o.headTurn || 0), tilt: -0.2 * d + (d === 0 ? 0.12 : 0) + sway, lean: 0.05 * d, seed: ph, shadow: false, shake: o.shake || 0 }); }
// world speed (px/s) that keeps feet planted for a walk cycle at scale s and cadence cad
export const strideSpeed = (s, cad = 1) => 65 * s * cad;

// ---------- camera over a background image ----------
// view: { z (>=1), x, y } = zoom and the background point at screen centre. Clamped so the image always fills the frame.
export function camBegin(g, img, v, shake = [0, 0]) { const z = Math.max(1, v.z || 1), hw = W / 2 / z, hh = H / 2 / z;
  const cx = clamp(v.x ?? W / 2, hw, W - hw), cy = clamp(v.y ?? H / 2, hh, H - hh);
  g.save(); g.translate(W / 2 + shake[0], H / 2 + shake[1]); g.scale(z, z); g.translate(-cx, -cy); g.drawImage(img, 0, 0, W, H); return { z, cx, cy }; }
export const camEnd = (g) => g.restore();
export const toScreen = (c, x, y) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];
export function camShake(t, amp, t0 = -1, dur = 1e9) { if (t < t0 || t > t0 + dur) return [0, 0]; const k = t0 < 0 ? 1 : 1 - (t - t0) / dur; return [Math.sin(t * 53) * amp * k, Math.cos(t * 47) * amp * 0.6 * k]; }
export async function loadImg(src) { const im = new Image(); im.src = src; await im.decode(); return im; }

// ---------- grades / light ----------
export function nightGrade(g, k = 1, lights = []) { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = k; g.fillStyle = '#3a4a78'; g.fillRect(0, 0, W, H); g.restore();
  for (const [x, y, r, c, a] of lights) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.fillStyle = radGrad(g, x, y, 0, r, [alpha(c, a ?? 0.35), alpha(c, 0)]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); } }
export function fade(g, a, col = '#000') { if (a <= 0) return; g.fillStyle = alpha(col, Math.min(1, a)); g.fillRect(0, 0, W, H); }
export function vignette(g, a = 0.35) { g.fillStyle = radGrad(g, W / 2, H * 0.55, H * 0.35, W * 0.7, [alpha('#000', 0), alpha('#000', a)]); g.fillRect(0, 0, W, H); }

// ---------- type ----------
export function note(g, str, x, y, o = {}) { const { size = 56, rot = -0.03, color = RED, k = 1, align = 'center', glow = true } = o; if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); const sc = 0.75 + 0.25 * Math.min(1, k); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2.5);
  g.font = `700 ${size}px "Patrick Hand", sans-serif`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (glow) { g.strokeStyle = alpha('#f4efe2', 0.85); g.lineWidth = size * 0.16; g.strokeText(str, 0, 0); }
  g.fillStyle = color; g.fillText(str, 0, 0); g.restore(); }
export function arrowTo(g, x0, y0, x1, y1, k = 1, col = RED, bend = 30) { if (k <= 0) return; const p = ease.out(clamp(k)); const mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2 - bend;
  const q = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1];
  g.strokeStyle = alpha('#f4efe2', 0.8); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 24; i++) { const [a, b] = q(i / 24 * p); i ? g.lineTo(a, b) : g.moveTo(a, b); } g.stroke();
  g.strokeStyle = col; g.lineWidth = 5; g.stroke();
  if (p > 0.97) { const [a, b] = q(1), [c, d] = q(0.92), ang = Math.atan2(b - d, a - c); g.beginPath(); for (const s of [-0.5, 0.5]) { g.moveTo(a, b); g.lineTo(a - Math.cos(ang + s) * 22, b - Math.sin(ang + s) * 22); } g.stroke(); } }
export function bigText(g, str, x, y, o = {}) { const { size = 150, color = '#ffffff', k = 1, rot = -0.02, stroke = INK } = o; if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); const sc = Math.max(0.01, k); g.scale(sc, sc); g.globalAlpha *= clamp(k * 3);
  g.font = `400 ${size}px "Permanent Marker", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.fillStyle = alpha('#000', 0.4); g.fillText(str, 6, 10); g.strokeStyle = stroke; g.lineWidth = size * 0.12; g.strokeText(str, 0, 0); g.fillStyle = color; g.fillText(str, 0, 0); g.restore(); }

// ---------- DAY counter: slams in centre, then docks top-left ----------
export function dayCounter(g, n, t, t0, o = {}) { if (t < t0) return; const slam = pop(t, t0, 0.35), dock = sm(t, t0 + (o.hold ?? 1.0), t0 + (o.hold ?? 1.0) + 0.55);
  const x = lerp(W / 2, 170, dock), y = lerp(H * 0.45, 92, dock), s = lerp(1.0, 0.42, dock) * slam;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.04);
  g.fillStyle = alpha('#000', 0.45); g.beginPath(); g.roundRect(-230 + 8, -95 + 12, 460, 190, 18); g.fill();
  g.fillStyle = '#ece6d6'; g.beginPath(); g.roundRect(-230, -95, 460, 190, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
  g.font = '400 150px "Permanent Marker", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = RED; g.fillText(`DAY ${n}`, 0, 10); g.restore(); }

// ---------- supply tracker (bottom-left) ----------
export function tracker(g, t, t0, vals, o = {}) { const k = so(t, t0, t0 + 0.45); if (k <= 0) return; const x0 = 40, y0 = H - 40 - 3 * 58, rows = [['WATER', '#5aa8d8'], ['FOOD', '#d8a248'], ['BATTERIES', '#9ad06a']];
  g.save(); g.translate(lerp(-420, 0, k), 0);
  g.fillStyle = alpha('#14120e', 0.72); g.beginPath(); g.roundRect(x0 - 16, y0 - 18, 380, 3 * 58 + 20, 14); g.fill();
  rows.forEach(([name, col], i) => { const y = y0 + i * 58, v = clamp(vals[i] ?? 0);
    g.font = '700 30px "Patrick Hand", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ece6d6'; g.fillText(name, x0, y + 12);
    g.fillStyle = alpha('#ffffff', 0.15); g.beginPath(); g.roundRect(x0 + 150, y, 190, 24, 12); g.fill();
    if (v > 0.001) { g.fillStyle = col; g.beginPath(); g.roundRect(x0 + 150, y, Math.max(24, 190 * v), 24, 12); g.fill(); }
    if (o.labels?.[i]) { g.font = '700 22px "Patrick Hand", sans-serif'; g.fillStyle = '#ece6d6'; g.textAlign = 'right'; g.fillText(o.labels[i], x0 + 336, y + 13); } });
  g.restore(); }

// ---------- notebook page (Melvin-style rule pages) ----------
export function notebook(g, t, o = {}) { g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  const px = 150, py = 70, pw = W - 300, ph = H - 120;
  g.save(); g.translate(W / 2, H / 2); g.rotate(o.rot ?? -0.008); g.translate(-W / 2, -H / 2);
  g.fillStyle = alpha('#000', 0.55); g.fillRect(px + 14, py + 18, pw, ph);
  g.fillStyle = '#e9e2cf'; g.fillRect(px, py, pw, ph);
  g.strokeStyle = alpha('#6a8fb8', 0.35); g.lineWidth = 2; for (let y = py + 110; y < py + ph - 20; y += 58) { g.beginPath(); g.moveTo(px + 20, y); g.lineTo(px + pw - 20, y); g.stroke(); }
  g.strokeStyle = alpha(RED, 0.45); g.lineWidth = 3; g.beginPath(); g.moveTo(px + 120, py); g.lineTo(px + 120, py + ph); g.stroke();
  for (let x = px + 60; x < px + pw - 30; x += 72) { g.fillStyle = '#0d0c0a'; g.beginPath(); g.arc(x, py + 4, 13, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a8a8a'; g.lineWidth = 5; g.beginPath(); g.arc(x, py - 8, 15, Math.PI * 0.15, Math.PI * 0.85, true); g.stroke(); }
  const r = rng(11); g.fillStyle = alpha('#6a5a3a', 0.06); for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(px + r() * pw, py + r() * ph, 30 + r() * 90, 20 + r() * 60, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.restore();
  g.fillStyle = radGrad(g, W / 2, H / 2, H * 0.4, W * 0.75, [alpha('#000', 0), alpha('#000', 0.45)]); g.fillRect(0, 0, W, H); }
// hand-inked line helpers for notebook diagrams (draw-on with k 0..1)
export function inkPath(g, pts, k = 1, w = 6, col = INK) { if (k <= 0 || pts.length < 2) return; const n = pts.length - 1, upto = k * n; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i <= Math.ceil(upto); i++) { const f = Math.min(1, upto - (i - 1)); g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); } g.stroke(); }
export function tick(g, x, y, r, k, col = '#2a8a3a') { if (k <= 0) return; const a = clamp(k * 2), b = clamp(k * 2 - 1); g.strokeStyle = col; g.lineWidth = r * 0.26; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(lerp(x - r, x - r * 0.3, a), lerp(y, y + r * 0.7, a)); if (b > 0) g.lineTo(lerp(x - r * 0.3, x + r, b), lerp(y + r * 0.7, y - r * 0.8, b)); g.stroke(); }
export function cross(g, x, y, r, k, col = RED) { if (k <= 0) return; const a = clamp(k * 2), b = clamp(k * 2 - 1); g.strokeStyle = col; g.lineWidth = r * 0.24; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x - r + 2 * r * a, y - r + 2 * r * a); g.stroke(); if (b > 0) { g.beginPath(); g.moveTo(x + r, y - r); g.lineTo(x + r - 2 * r * b, y - r + 2 * r * b); g.stroke(); } }

// =====================================================================================================
// v2 ANIMATION TOOLS — side view, pose blending, anticipation/overshoot, zombie lurch, close-ups, notebook write-on
// =====================================================================================================
import { drawInk } from '/engine/ink2d.js';
import { walkCycle, runCycle, anticipate, overshoot } from '/engine/motion.js';
import { POSE } from '/tl/world/poses.js';
import { mixVal } from '/engine/core.js';
export { anticipate, overshoot };

// distance-driven phases so planted feet never slide (drawInk stretches legs 1.122x in x)
export const walkPhase = (dist, s, stride = 28) => dist / (2 * stride * 1.122 * s / 0.6);
export const runPhase = (dist, s, stride = 48) => dist / (2 * stride * 1.122 * s / 0.35);
export const walkSpeed = (s, cadence = 1, stride = 28) => cadence * 2 * stride * 1.122 * s / 0.6;   // px/s for a cadence in cycles/s

// extra side poses for Vini (built on the POSE library)
export const VPOSE = {
  ...POSE,
  creep: { head: [22, -182], sh: [12, -150], hip: [-6, -88], eF: [30, -118], hF: [44, -96], eB: [8, -118], hB: [24, -98], kF: [16, -48], fF: [14, 0], kB: [-10, -44], fB: [-22, 0] },
  peek: { head: [26, -196], sh: [12, -166], hip: [0, -100], eF: [30, -150], hF: [46, -168], eB: [10, -136], hB: [24, -150], kF: [10, -50], fF: [14, 0], kB: [-8, -50], fB: [-16, 0] },
  grabLow: { head: [34, -160], sh: [20, -132], hip: [-8, -76], eF: [44, -96], hF: [62, -74], eB: [24, -100], hB: [36, -86], kF: [22, -46], fF: [22, 0], kB: [-14, -40], fB: [-26, 0] },
  flinch: { head: [-14, -196], sh: [-10, -166], hip: [0, -98], eF: [14, -150], hF: [24, -182], eB: [-4, -150], hB: [8, -184], kF: [12, -50], fF: [20, 0], kB: [-10, -50], fB: [-22, 0] },
  sitEat: { head: [12, -165], sh: [4, -131], hip: [0, -58], eF: [26, -110], hF: [30, -150], eB: [18, -100], hB: [34, -118], kF: [48, -58], fF: [46, 0], kB: [44, -56], fB: [38, 0] },
};
const P_ = (p) => (typeof p === 'string' ? VPOSE[p] || VPOSE.idle : p);
// keyed pose track: [[t, pose], ...] each blend takes `bd` s (eased); poses may be names or joint objects
export function poseTrack(t, keys, bd = 0.32) { let cur = P_(keys[0][1]); for (let i = 1; i < keys.length; i++) { if (t < keys[i][0]) break; cur = mixVal(cur, P_(keys[i][1]), ease.inOut(clamp((t - keys[i][0]) / bd))); } return cur; }
export const poseMix = (a, b, k) => mixVal(P_(a), P_(b), ease.inOut(clamp(k)));
// idle life on top of any side pose
export function alive(p, t, amt = 1, seed = 0) { const b = Math.sin(t * 2.1 + seed) * 1.6 * amt, sw = Math.sin(t * 0.9 + seed * 2) * 1.0 * amt; const q = { ...p }; for (const k of ['head', 'sh', 'eF', 'hF', 'eB', 'hB']) q[k] = [p[k][0] + sw * (k === 'head' ? 1.2 : 0.5), p[k][1] + b * (k === 'head' ? 1 : 0.7)]; return q; }

// side-view Vini (same palette/toning as the front view). o: { x, y, s, pose, facing(±1), expr, look, t, b, props, alive }
export function viniSide(g, o) { const { x, y, s } = o; if (o.shadow !== false) shadow(g, x, y, s);
  let p = P_(o.pose || 'idle'); if (o.alive !== false) p = alive(p, o.t || 0, o.aliveAmt ?? 1, o.seed || 0);
  drawInk(g, { ...o, char: toned(o.char || VV, 0.92, o.b ?? 0.95), pose: p, time: o.t, blink: o.t, shadow: false }); }

// ---------- zombie lurch (side view): heavy uneven gait, one dragged foot, arms reaching, head jerks ----------
export function zombieWalkPose(phase, t, seed = 0) { const p = walkCycle(phase, { stride: 22, lift: 7, bob: 5, arm: 4, lean: 10, weary: 0.85 }), u = ((phase % 1) + 1) % 1;
  const drag = Math.max(0, Math.sin(2 * Math.PI * u)) * 7;                          // hip dips on the dragged-leg step
  const q = { ...p, hip: [p.hip[0], p.hip[1] + drag * 0.6], sh: [p.sh[0] + 6, p.sh[1] + drag], head: [p.head[0] + 14 + Math.sin(t * 9 + seed) * 2 * (Math.sin(t * 1.3 + seed) > 0.85 ? 3 : 0.3), p.head[1] + drag + 6] };
  q.fB = [p.fB[0], Math.max(p.fB[1], -1.5)]; q.kB = [p.kB[0] - 3, p.kB[1] + 3];          // back foot barely lifts: it drags
  const sway = Math.sin(t * 1.6 + seed) * 4; q.eF = [q.sh[0] + 30, q.sh[1] + 10 + sway]; q.hF = [q.sh[0] + 62, q.sh[1] + 6 + sway]; q.eB = [q.sh[0] + 24, q.sh[1] + 16 - sway]; q.hB = [q.sh[0] + 54, q.sh[1] + 14 - sway];
  return q; }
export function zombieSide(g, o) { const z = ZZ[o.kind || 'office']; if (o.shadow !== false) shadow(g, o.x, o.y, o.s, 0.3);
  drawInk(g, { char: toned(z, 0.85, o.b ?? 0.9), x: o.x, y: o.y, s: o.s, pose: o.pose || zombieWalkPose(o.phase || 0, o.t || 0, o.seed || 0), facing: o.facing ?? -1, expr: 'zombie', time: o.t, shadow: false, seed: o.seed }); }
// front-view lurch: uneven bob + jerky tilt for zombies walking at camera
export function zombieLurch(t, seed = 0) { const u = t * 0.9 + seed; return { bob: -Math.abs(Math.sin(u * Math.PI)) * 7 - Math.max(0, Math.sin(u * Math.PI * 2)) * 4, tilt: Math.sin(u * 1.7) * 0.12 + (Math.sin(t * 0.7 + seed * 3) > 0.9 ? Math.sin(t * 30) * 0.05 : 0) }; }

// ---------- close-ups ----------
// camera with optional background blur (depth of field for inserts / reaction shots)
export function camBeginDOF(g, img, v, blur = 0, shake = [0, 0]) { if (blur <= 0) return camBegin(g, img, v, shake);
  const z = Math.max(1, v.z || 1), hw = W / 2 / z, hh = H / 2 / z, cx = clamp(v.x ?? W / 2, hw, W - hw), cy = clamp(v.y ?? H / 2, hh, H - hh);
  g.save(); g.translate(W / 2 + shake[0], H / 2 + shake[1]); g.scale(z, z); g.translate(-cx, -cy); g.save(); g.filter = `blur(${blur / z}px)`; g.drawImage(img, -20, -20, W + 40, H + 40); g.restore(); return { z, cx, cy }; }
// letterbox-free "punch-in": quick zoom with overshoot from z0 to z1 starting at t0
export const punch = (t, t0, z0, z1, d = 0.35) => (t < t0 ? z0 : overshoot(t, t0, d, z0, z1, 1.2));

// ---------- notebook: handwriting write-on + page turn ----------
export function writeOn(g, str, x, y, k, o = {}) { if (k <= 0) return; const { size = 56, color = '#2a2622', rot = -0.01, align = 'center', font = 'Patrick Hand' } = o;
  g.save(); g.translate(x, y); g.rotate(rot); g.font = `700 ${size}px "${font}", sans-serif`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const w = g.measureText(str).width, x0 = align === 'center' ? -w / 2 : align === 'right' ? -w : 0, kk = clamp(k);
  g.beginPath(); g.rect(x0 - 10, -size, (w + 20) * kk, size * 2); g.clip(); g.fillStyle = color; g.fillText(str, x0, 0);
  g.restore(); if (kk < 1 && o.pen !== false) { const px = x + (align === 'center' ? -w / 2 : 0) + w * kk; pen(g, px, y + size * 0.15); } }
export function pen(g, x, y) { g.save(); g.translate(x, y); g.rotate(-0.55); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(6, 8, 18, 150); g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-9, -24); g.lineTo(9, -24); g.closePath(); g.fill(); g.fillStyle = '#c8262e'; g.fillRect(-9, -150, 18, 126); g.fillStyle = '#1a1a1e'; g.fillRect(-9, -160, 18, 14); g.restore(); }
// page turn: draws page A, then B revealed under a curling page as k goes 0→1
export function pageTurn(g, k, drawA, drawB) { if (k <= 0) return drawA(); if (k >= 1) return drawB(); const e = ease.inOut(k), fx = lerp(W + 60, -W * 0.2, e);
  drawB(); g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(fx, 0); g.lineTo(fx - 160 * Math.sin(e * Math.PI), H); g.lineTo(0, H); g.closePath(); g.clip(); drawA(); g.restore();
  // the curl: back of the page + shadow
  g.save(); g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx + 40, 0); g.lineTo(fx + 40 - 160 * Math.sin(e * Math.PI), H); g.lineTo(fx - 160 * Math.sin(e * Math.PI), H); g.closePath(); g.fill();
  const cw = 120 * Math.sin(e * Math.PI); g.fillStyle = '#d8d0bb'; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx - cw, 0); g.lineTo(fx - cw - 160 * Math.sin(e * Math.PI), H); g.lineTo(fx - 160 * Math.sin(e * Math.PI), H); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.stroke(); g.restore(); }
