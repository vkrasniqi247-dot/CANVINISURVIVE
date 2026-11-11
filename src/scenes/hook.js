// src/scenes/hook.js — HOOK (episode 0 → 28.6), ported shot-for-shot from reference/v1/01_hook.js at the new quality
// level: the rigged Vini (turns, breathing, follow-through) and the rigged infected (lurch, dragged leg).
// Same timings and labels as v1, so the placeholder voice lines up. Every function is a pure function of time.
import { W, H, RED, clamp, lerp, ease, sm, so, pop, armTrack, pick, track, camBegin, camEnd, punches, toScreen, camShake, note, arrowTo, bigText, fade, vignette } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { drawZombie, strideSpeed } from '../zombie/zombie.js';

export const HOOK_SHOTS = [['h1', 0, 6.45], ['h2', 6.45, 11.6], ['h3', 11.6, 14.7], ['h4', 14.7, 23.4], ['h5', 23.4, 27.6], ['h6', 27.6, 28.6]];
export const sY = (y) => (1.9 * (y - 715)) / 345;                     // street perspective: character scale at ground y
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const lags = (drive, gt, k = 4) => ({ hairLag: clamp(-follow(drive, gt, { freq: 2.6, damp: 0.3 }) * k, -14, 14), packLag: clamp(-follow(drive, gt, { freq: 1.8, damp: 0.38 }) * k * 0.7, -10, 10) });

// the grey car on the left of BG03, cut out so characters can stand BEHIND it
const CAR = [[150, 935], [150, 760], [200, 700], [262, 668], [470, 655], [560, 664], [618, 696], [700, 735], [705, 935]];
export function carFront(g, A) { g.save(); g.beginPath(); CAR.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); g.drawImage(A.bg.street, 0, 0, W, H); g.restore(); }

// TV emergency broadcast overlay (BG01 TV screen: 1200..1595 x 350..605)
export function tvBroadcast(g, t, k = 1, zombieIcon = 0) { if (k <= 0) return; const x0 = 1203, y0 = 353, w = 390, h = 250, fl = 0.92 + 0.08 * Math.sin(t * 31);
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.globalAlpha = k;
  g.fillStyle = `rgba(${Math.round(120 * fl)},18,22,1)`; g.fillRect(x0, y0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = y0; y < y0 + h; y += 4) g.fillRect(x0, y, w, 1.5);
  g.fillStyle = '#ffffff'; g.font = '700 30px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EMERGENCY BROADCAST', x0 + w / 2, y0 + 38);
  g.fillStyle = '#ffd24a'; g.fillRect(x0, y0 + h - 46, w, 46); g.fillStyle = '#1a1010'; g.font = '700 26px "Patrick Hand", sans-serif'; g.textAlign = 'left';
  const msg = 'STAY INDOORS  •  DO NOT APPROACH THE INFECTED  •  ', tw = g.measureText(msg).width, off = (t * 120) % tw; g.fillText(msg + msg + msg, x0 - off, y0 + h - 22);
  if (zombieIcon > 0) { g.globalAlpha = k * zombieIcon; g.save(); g.translate(x0 + w / 2, y0 + 140); g.scale(0.8 + 0.2 * zombieIcon, 0.8 + 0.2 * zombieIcon); g.fillStyle = '#1a0808';
    g.beginPath(); g.arc(0, -30, 26, 0, Math.PI * 2); g.fill(); g.fillRect(-20, -6, 40, 56); g.lineWidth = 10; g.lineCap = 'round'; g.strokeStyle = '#1a0808'; g.beginPath(); g.moveTo(-14, 6); g.lineTo(-62, 0); g.moveTo(14, 6); g.lineTo(-40, 14); g.stroke();
    g.fillStyle = '#ffe070'; for (const ex of [-9, 9]) { g.beginPath(); g.arc(ex, -32, 4.5, 0, Math.PI * 2); g.fill(); } g.restore(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 * k * fl; const gr = g.createRadialGradient(x0 + w / 2, y0 + h / 2, 40, x0 + w / 2, y0 + h / 2, 700); gr.addColorStop(0, 'rgba(255,60,50,0.9)'); gr.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = gr; g.fillRect(x0 - 800, y0 - 500, 2000, 1500); g.restore(); }

// ---------- h1: This is Vini. / never survived anything harder than a Monday ----------
function h1(g, gt, A) { const t = gt, dur = 6.45;
  const c = camBegin(g, A.bg.street, { z: lerp(1.32, 1.12, sm(t, 0, dur)), x: 960, y: 760 });
  const vx = 960, vy = 1010, s = sY(vy) * 0.9;
  const L = armTrack(gt, [[0, 'down'], [4.5, 'shrug'], [5.6, 'down']]), Rr = armTrack(gt, [[0, 'down'], [0.7, 'wave'], [1.9, 'down'], [4.5, 'shrug'], [5.6, 'down']]);
  const wav = gt > 0.75 && gt < 1.9 ? Math.sin(gt * 14) * 12 * sm(gt, 0.75, 0.95) : 0, Rw = [Rr[0], [Rr[1][0] + wav, Rr[1][1], Rr[1][2]]];
  const shrug = Math.sin(Math.PI * clamp((gt - 4.5) / 1.0));
  drawVini(g, A.vini, { x: vx, y: vy, s, t: gt, expr: pick(gt, [[0, 'happy'], [2.4, 'neutral'], [4.4, 'worried']]), arms: [L, Rw], turn: 0.15, look: [0.1, 0], breath: breathe(gt, 3), headTilt: -shrug * 6 + wav * 0.15, crouch: -0 + shrug * 0.6,
    ...lags((tt) => 960 + (tt > 0.75 && tt < 1.9 ? Math.sin(tt * 14) * 3 : 0), gt, 2) });
  camEnd(g);
  const [hx, hy] = toScreen(c, vx + 70, vy - s * 300);
  const kv = pop(gt, 1.0) * (1 - sm(gt, 3.6, 4.0)); g.save(); g.globalAlpha = 1 - sm(gt, 3.6, 4.0); note(g, 'VINI', hx + 230, hy - 40, { size: 84, k: kv }); arrowTo(g, hx + 190, hy - 10, hx + 60, hy + 30, so(gt, 1.05, 1.45)); g.restore();
  note(g, 'survived: Mondays (barely)', W * 0.7, H * 0.3, { size: 64, k: pop(gt, 5.45), rot: 0.03 });
  vignette(g, 0.3); fade(g, 1 - sm(t, 0, 0.5)); }

// ---------- h2: the news says the dead are walking… he has one question ----------
// He watches the TV in profile, then turns to us on "question" (the turn now goes through 3/4 to front).
function h2(g, gt, A) { const T = 6.45, t = gt - T, dur = 5.15;
  camBegin(g, A.bg.flat, punches(gt, { z: lerp(1.02, 1.14, sm(t, 0, dur)), x: 1050, y: 640 }, [[10.75, 9, { z: 1.9, x: 820, y: 560 }]]));
  tvBroadcast(g, gt, so(gt, T + 0.05, T + 0.3), so(gt, 7.9, 8.4));
  const look = sm(gt, 10.55, 11.0), recoil = Math.max(0, Math.sin(Math.PI * clamp((gt - 7.9) / 0.35)));
  drawVini(g, A.vini, { x: 760, y: 990, s: 1.62, t: gt, expr: pick(gt, [[0, 'worried'], [7.9, 'scared'], [10.75, 'shock']]),
    arms: [armTrack(gt, [[0, 'down'], [7.9, 'chest'], [10.6, 'down']]), armTrack(gt, [[0, 'down'], [7.9, 'cold']])], turn: lerp(0.85, 0.05, look), look: [lerp(0.6, 0, look), lerp(-0.2, 0, look)],
    shake: gt > 8.1 && gt < 10.6 ? 0.35 : 0, lean: recoil * 4, crouch: recoil * 2, breath: gt > 7.9 ? breathe(gt, 1.2, 0.7) : breathe(gt, 3), ...lags((tt) => 760 + sm(tt, 10.55, 11.0) * 40 - Math.max(0, Math.sin(Math.PI * clamp((tt - 7.9) / 0.35))) * 20, gt) });
  camEnd(g); vignette(g, 0.32); }

// ---------- h3: Can he survive thirty days? (close-up) ----------
function h3(g, gt, A) { const t = gt - 11.6, dur = 3.1;
  const vx = 760, vy = 990, s = 1.62, headY = vy - 272 * s, sh = camShake(gt, 5, 13.1, 0.5);
  const v = camBegin(g, A.bg.flat, { z: lerp(2.05, 2.25, sm(t, 0, dur)), x: vx + 40, y: headY + 10, blur: 3 }, sh);
  tvBroadcast(g, gt, 1, 1);
  const jolt = Math.max(0, Math.sin(Math.PI * clamp((gt - 13.1) / 0.3)));
  drawVini(g, A.vini, { x: vx, y: vy, s, t: gt, expr: pick(gt, [[0, 'shock'], [13.1, 'scared']]), arms: ['down', 'down'], turn: 0.1, look: [0, 0], shake: gt > 13.1 ? 0.6 : 0, headTilt: -jolt * 5, breath: breathe(gt, 1.0, 0.8), hairLag: jolt * 5 });
  camEnd(g); vignette(g, 0.42);
  bigText(g, '30 DAYS?', W * 0.5, H * 0.13, { size: 170, k: pop(gt, 13.1, 0.3), color: '#ffffff' }); }

// ---------- shared: zombies shambling toward camera down the road (positions are pure functions of time) ----------
export const HORDE = [{ kind: 'office', x: 1000, y0: 860, start: 14.0, seed: 1.3 }, { kind: 'worker', x: 860, y0: 835, start: 14.0, seed: 2.9 }, { kind: 'teen', x: 1120, y0: 848, start: 14.0, seed: 4.1 }];
export function hordeAt(z, gt, speedK = 1) { const cad = 0.5;   // advance in y; speed scales with perspective so feet stay planted
  let y = z.y0; const steps = Math.max(0, (gt - z.start) * 30); for (let i = 0; i < steps; i++) y += strideSpeed(sY(y), cad) * 0.22 * speedK / 30;
  return { x: z.x + ((y - z.y0) * (z.x - 955)) / 260, y, s: sY(y) }; }

// ---------- h4: one thing you need to know… can't see very well… can hear everything ----------
function h4(g, gt, A) { const t = gt - 14.7, dur = 8.7;
  const c = camBegin(g, A.bg.street, { z: lerp(1.45, 1.6, sm(t, 0, dur)), x: 980, y: 760 });
  const zs = HORDE.map((z) => ({ ...z, ...hordeAt(z, gt) })).sort((a, b) => a.y - b.y);
  const snap = so(gt, 21.6, 21.85);                                     // heads snap round on "hear"
  for (const z of zs) drawZombie(g, A.zombie, { kind: z.kind, x: z.x, y: z.y, s: z.s, t: gt, seed: z.seed, dir: 0, shake: snap > 0 && snap < 1 ? 1.2 : 0, expr: gt > 21.6 ? 'groan' : 'zombie', headTurn: (1 - snap) * Math.sin(gt * 0.8 + z.seed) * 0.6 });
  camEnd(g);
  const lead = zs[zs.length - 1], [ex, ey] = toScreen(c, lead.x, lead.y - lead.s * 272);
  const k1 = pop(gt, 19.15), k2 = pop(gt, 21.6);
  if (k1 > 0) { note(g, 'bad eyesight', W * 0.17, H * 0.6, { size: 66, k: k1 }); arrowTo(g, W * 0.2, H * 0.55, ex - 40, ey + 10, so(gt, 19.2, 19.6)); }
  if (k2 > 0) { note(g, 'PERFECT hearing', W * 0.82, H * 0.6, { size: 70, k: k2, rot: 0.03 }); arrowTo(g, W * 0.78, H * 0.55, ex + 50, ey + 10, so(gt, 21.65, 22.05), RED, -30); }
  vignette(g, 0.4); }

// ---------- h5: so whatever happens… don't make a sound (hiding behind the car) ----------
function h5(g, gt, A) { const t = gt - 23.4, dur = 4.2;
  camBegin(g, A.bg.street, { z: lerp(1.3, 1.42, sm(t, 0, dur)), x: 640, y: 760 });
  const zy = 880, zs = sY(zy), travel = strideSpeed(zs, 0.55) * Math.max(0, gt - 23.3), zx = 1270 - travel;
  drawZombie(g, A.zombie, { kind: 'office', x: zx, y: zy, s: zs, t: gt, seed: 0.7, dir: -1, walkDist: -travel / zs });
  // Vini crouched behind the grey car: only head and shoulders show above the roof line
  g.save(); g.beginPath(); g.rect(0, 0, W, 700); g.clip();
  const flinch = Math.max(0, Math.sin(Math.PI * clamp((gt - 25.6) / 0.3)));
  drawVini(g, A.vini, { x: 430, y: 975 + Math.sin(gt * 2.2) * 3, s: 1.22, t: gt, expr: pick(gt, [[0, 'scared'], [25.6, 'terror']]),
    arms: [armTrack(gt, [[0, 'chest'], [25.6, 'face']], 0.18), armTrack(gt, [[0, 'cold'], [25.6, 'face']], 0.18)], turn: 0.75, look: [1, 0.1], shadow: false, shake: gt > 25.6 ? 0.5 : 0, crouch: flinch * 3, breath: breathe(gt, 0.9, 0.8), hairLag: flinch * 4 });
  g.restore();
  carFront(g, A);
  camEnd(g);
  [['DON’T', 25.71], ['MAKE', 25.99], ['A SOUND', 26.56]].forEach(([w, at], i) => bigText(g, w, W * 0.5, H * (0.62 + i * 0.13), { size: i === 2 ? 150 : 120, k: pop(gt, at - 0.05, 0.25), color: i === 2 ? '#ff4a3a' : '#ffffff', rot: -0.03 + i * 0.015 }));
  vignette(g, 0.42); }

// ---------- h6: title card ----------
function h6(g, gt) { const t = gt - 27.6; g.fillStyle = '#0a0908'; g.fillRect(0, 0, W, H);
  bigText(g, 'SURVIVING', W / 2, H * 0.4, { size: 120, k: pop(t, 0.0, 0.22), color: '#ece6d6' }); bigText(g, '30 DAYS', W / 2, H * 0.58, { size: 190, k: pop(t, 0.12, 0.22), color: '#ff4a3a' });
  fade(g, sm(t, 0.75, 1.0)); }

const FN = { h1, h2, h3, h4, h5, h6 };
export function drawHook(g, gt, A) { const s = HOOK_SHOTS.find(([, a, b]) => gt >= a && gt < b) || HOOK_SHOTS[HOOK_SHOTS.length - 1]; g.save(); FN[s[0]](g, gt, A); g.restore(); }
