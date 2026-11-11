// src/kit/kit.js — overlays, camera, timing and notebook helpers for 'Can Vini Survive?' (ported from the v1 engine).
// Deterministic: everything is a pure function of time. No Math.random / Date.now.
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (c.startsWith('rgb')) { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] ?? 1]; }
  let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255, h.length > 6 ? parseInt(h.slice(6), 16) / 255 : 1];
}
export const css = ([r, g, b, a = 1]) => `rgba(${r | 0},${g | 0},${b | 0},${+a.toFixed(3)})`;
export const mix = (c1, c2, k) => { const a = rgb(c1), b = rgb(c2); return css(a.map((v, i) => lerp(v, b[i] ?? 1, k))); };
export const alpha = (c, a) => { const x = rgb(c); return css([x[0], x[1], x[2], a]); };
export function rng(seed = 1) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function radGrad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export function linGrad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export const ease = {
  linear: x => clamp(x),
  in: x => (x = clamp(x)) ** 3,
  out: x => 1 - (1 - clamp(x)) ** 3,
  inOut: x => ((x = clamp(x)) < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  sine: x => -(Math.cos(Math.PI * clamp(x)) - 1) / 2,
  outBack: x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
  outElastic: x => { x = clamp(x); return x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
};
export const INK_ARMS = {   // [elbow, hand] relative to the shoulder, for the screen-RIGHT arm (mirrored for left)
  down: [[6, 44], [10, 88]], relaxed: [[8, 44], [6, 88]], hips: [[30, 36], [6, 66]], out: [[40, 22], [80, 36]], wave: [[30, -28], [40, -74]],
  up: [[10, -46], [16, -94]], hold: [[14, 46], [-6, 64]], chest: [[16, 48], [-16, 36]], point: [[44, 6], [90, -2]], shrug: [[30, 30], [52, 6]],
  face: [[18, 40], [-6, -32]], cold: [[6, 44], [-22, 40]], reach: [[30, -36], [52, -84]], carry: [[18, 44], [2, 70]], torch: [[34, 34], [70, 30]],
};
// tl/vini/kit.js — shared toolkit for "Can Vini Survive?" episodes on AI-painted backgrounds.
// Characters (Vini, zombies), smooth arm blending, camera over a background image, overlays (labels, DAY
// counter, supply tracker, notebook page). All deterministic: no Math.random / Date.now.
export const W = 1920, H = 1080, RED = '#c8262e', INK = '#17140f';

// ---------- timing helpers ----------
export const sm = (t, a, b) => ease.inOut(clamp((t - a) / (b - a)));          // smooth 0..1 between a and b
export const so = (t, a, b) => ease.out(clamp((t - a) / (b - a)));
export const pop = (t, t0, d = 0.3) => { const k = clamp((t - t0) / d); return k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2); };
export const settle = (t, t0, amp = 0.12, f = 14, d = 6) => (t < t0 ? 0 : Math.sin((t - t0) * f) * Math.exp(-(t - t0) * d) * amp);

export function shadow(g, x, y, s, a = 0.36) { g.fillStyle = `rgba(25,20,16,${a})`; g.beginPath(); g.ellipse(x, y + 2, 60 * s, 11 * s, 0, 0, Math.PI * 2); g.fill(); }

// ---------- camera over a background image ----------
// view: { z (>=1), x, y } = zoom and the background point at screen centre. Clamped so the image always fills the frame.
export function camBegin(g, img, v, shake = [0, 0]) { const z = Math.max(1, v.z || 1), hw = W / 2 / z, hh = H / 2 / z;
  const cx = clamp(v.x ?? W / 2, hw, W - hw), cy = clamp(v.y ?? H / 2, hh, H - hh);
  g.save(); g.translate(W / 2 + shake[0], H / 2 + shake[1]); g.scale(z, z); g.translate(-cx, -cy); g.drawImage(img, 0, 0, W, H); return { z, cx, cy }; }
export const camEnd = (g) => g.restore();
export const toScreen = (c, x, y) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];
export function camShake(t, amp, t0 = -1, dur = 1e9) { if (t < t0 || t > t0 + dur) return [0, 0]; const k = t0 < 0 ? 1 : 1 - (t - t0) / dur; return [Math.sin(t * 53) * amp * k, Math.cos(t * 47) * amp * 0.6 * k]; }

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


// ---------- smooth arm poses ----------
const resolve = (p) => (typeof p === 'string' ? INK_ARMS[p] || INK_ARMS.down : p);
export function armLerp(a, b, k) { const A = resolve(a), B = resolve(b); k = ease.inOut(clamp(k)); return [[lerp(A[0][0], B[0][0], k), lerp(A[0][1], B[0][1], k)], [lerp(A[1][0], B[1][0], k), lerp(A[1][1], B[1][1], k)]]; }
// keyed arm track: [[t, preset], ...] with blend duration bd
export function armTrack(t, keys, bd = 0.28) { let cur = keys[0][1]; for (let i = 1; i < keys.length; i++) { if (t < keys[i][0]) break; const prev = keys[i - 1][1]; cur = armLerp(prev, keys[i][1], (t - keys[i][0]) / bd); } return resolve(cur); }
export function arms2(t, L, R, bd) { return [armTrack(t, L, bd), armTrack(t, R, bd)]; }
// keyed scalar track (turn, lean, …)
export function track(t, keys, fn = ease.inOut) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, fn((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; }
// keyed discrete track (expressions)
export function pick(t, keys) { let v = keys[0][1]; for (const [k, x] of keys) if (t >= k) v = x; return v; }



// ---------- notebook: handwriting write-on + page turn ----------
export function writeOn(g, str, x, y, k, o = {}) { if (k <= 0) return; const { size = 56, color = '#2a2622', rot = -0.01, align = 'center', font = 'Patrick Hand' } = o;
  g.save(); g.translate(x, y); g.rotate(rot); g.font = `700 ${size}px "${font}", sans-serif`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const w = g.measureText(str).width, x0 = align === 'center' ? -w / 2 : align === 'right' ? -w : 0, kk = clamp(k);
  g.beginPath(); g.rect(x0 - 10, -size, (w + 20) * kk, size * 2); g.clip(); g.fillStyle = color; g.fillText(str, x0, 0);
  g.restore(); if (kk < 1 && o.pen !== false) { const px = x + (align === 'center' ? -w / 2 : 0) + w * kk; pen(g, px, y + size * 0.15); } }
export function pen(g, x, y) { g.save(); g.translate(x, y); g.rotate(-0.55); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(6, 8, 18, 150); g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-9, -24); g.lineTo(9, -24); g.closePath(); g.fill(); g.fillStyle = '#c8262e'; g.fillRect(-9, -150, 18, 126); g.fillStyle = '#1a1a1e'; g.fillRect(-9, -160, 18, 14); g.restore(); }
