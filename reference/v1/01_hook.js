// HOOK (0:00–0:28.6): This is Vini → the news → 30 days? → they can't see / can hear → don't make a sound → title.
import { E, registerShot, clamp, lerp, ease, alpha } from '/engine/core.js';
import { W, H, RED, INK, VV, vini, zombie, strideSpeed, camBegin, camEnd, toScreen, camShake, loadImg, note, arrowTo, bigText, fade, vignette, nightGrade, sm, so, pop, settle, armTrack, arms2, track, pick } from '/tl/vini/kit.js';
export const BG = { flat: await loadImg('/project/assets/bg01_flat_v2.png'), street: await loadImg('/project/assets/bg03_street.png') };
export const sY = (y) => 1.9 * (y - 715) / 345;                       // street perspective: character scale at ground y

// the grey car on the left of BG03, cut out so characters can stand BEHIND it
const CAR = [[150, 935], [150, 760], [200, 700], [262, 668], [470, 655], [560, 664], [618, 696], [700, 735], [705, 935]];
export function carFront(g) { g.save(); g.beginPath(); CAR.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); g.drawImage(BG.street, 0, 0, W, H); g.restore(); }

// TV emergency broadcast overlay (BG01 TV screen: 1200..1595 x 350..605)
export function tvBroadcast(g, t, k = 1, zombieIcon = 0) { if (k <= 0) return; const x0 = 1203, y0 = 353, w = 390, h = 250, fl = 0.92 + 0.08 * Math.sin(t * 31);
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.globalAlpha = k;
  g.fillStyle = `rgba(${Math.round(120 * fl)},18,22,1)`; g.fillRect(x0, y0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = y0; y < y0 + h; y += 4) g.fillRect(x0, y, w, 1.5);                 // scanlines
  g.fillStyle = '#ffffff'; g.font = '700 30px "Inter", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EMERGENCY BROADCAST', x0 + w / 2, y0 + 38);
  g.fillStyle = '#ffd24a'; g.fillRect(x0, y0 + h - 46, w, 46); g.fillStyle = '#1a1010'; g.font = '700 24px "Inter", sans-serif'; g.textAlign = 'left';
  const msg = 'STAY INDOORS  •  DO NOT APPROACH THE INFECTED  •  STAY INDOORS  •  ', tw = g.measureText(msg).width, off = (t * 120) % tw; g.fillText(msg + msg, x0 - off, y0 + h - 22);
  if (zombieIcon > 0) { g.globalAlpha = k * zombieIcon; g.save(); g.translate(x0 + w / 2, y0 + 140); g.scale(0.8 + 0.2 * zombieIcon, 0.8 + 0.2 * zombieIcon); g.fillStyle = '#1a0808';
    g.beginPath(); g.arc(0, -30, 26, 0, Math.PI * 2); g.fill(); g.fillRect(-20, -6, 40, 56); g.lineWidth = 10; g.lineCap = 'round'; g.strokeStyle = '#1a0808'; g.beginPath(); g.moveTo(-14, 6); g.lineTo(-62, 0); g.moveTo(14, 6); g.lineTo(-40, 14); g.stroke();
    g.fillStyle = '#ffe070'; for (const ex of [-9, 9]) { g.beginPath(); g.arc(ex, -32, 4.5, 0, Math.PI * 2); g.fill(); } g.restore(); }
  g.restore();
  // screen glow spill into the room
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 * k * fl; const gr = g.createRadialGradient(x0 + w / 2, y0 + h / 2, 40, x0 + w / 2, y0 + h / 2, 700); gr.addColorStop(0, 'rgba(255,60,50,0.9)'); gr.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = gr; g.fillRect(x0 - 800, y0 - 500, 2000, 1500); g.restore(); }

// ---------- h1: This is Vini. / never survived anything harder than a Monday ----------
registerShot('h1', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const c = camBegin(g, BG.street, { z: lerp(1.32, 1.12, sm(t, 0, info.dur)), x: 960, y: 760 });
  const vx = 960, vy = 1010, s = sY(vy) * 0.9;
  const arms = arms2(gt, [[0, 'down'], [4.5, 'shrug'], [5.6, 'down']], [[0, 'down'], [0.7, 'wave'], [1.9, 'down'], [4.5, 'shrug'], [5.6, 'down']]);
  if (gt > 0.75 && gt < 1.9) arms[1] = [[arms[1][0][0], arms[1][0][1] + Math.sin(gt * 14) * 6], [arms[1][1][0] + Math.sin(gt * 14) * 12, arms[1][1][1]]];
  vini(g, { x: vx, y: vy, s, t: gt, expr: pick(gt, [[0, 'happy'], [2.4, 'neutral'], [4.4, 'worried']]), arms, turn: 0.15, bob: gt > 4.5 && gt < 5.4 ? -Math.sin((gt - 4.5) / 0.9 * Math.PI) * 6 : 0 });
  camEnd(g);
  const [hx, hy] = toScreen(c, vx + 70, vy - s * 300);
  const kv = pop(gt, 1.0) * (1 - sm(gt, 3.6, 4.0)); g.save(); g.globalAlpha = 1 - sm(gt, 3.6, 4.0); note(g, 'VINI', hx + 230, hy - 40, { size: 84, k: kv }); arrowTo(g, hx + 190, hy - 10, hx + 60, hy + 30, so(gt, 1.05, 1.45)); g.restore();
  note(g, 'survived: Mondays (barely)', W * 0.7, H * 0.3, { size: 64, k: pop(gt, 5.45), rot: 0.03 });
  vignette(g, 0.3); fade(g, 1 - sm(t, 0, 0.5)); } });

// ---------- h2: the news says the dead are walking… he has one question ----------
registerShot('h2', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  camBegin(g, BG.flat, { z: lerp(1.02, 1.14, sm(t, 0, info.dur)), x: 1050, y: 640 });
  tvBroadcast(g, gt, so(gt, T + 0.05, T + 0.3), so(gt, 7.9, 8.4));
  const look = sm(gt, 10.6, 11.0);                                     // turns from the TV to camera on "question"
  vini(g, { x: 760, y: 990, s: 1.62, t: gt, expr: pick(gt, [[0, 'worried'], [7.9, 'scared'], [10.75, 'shock']]), arms: arms2(gt, [[0, 'down'], [7.9, 'chest'], [10.6, 'down']], [[0, 'down'], [7.9, 'cold']]), turn: lerp(0.85, 0.1, look), look: [lerp(1, 0, look), lerp(-0.3, 0, look)], shake: gt > 7.9 && gt < 10.6 ? 0.6 : 0 });
  camEnd(g); vignette(g, 0.32); } });

// ---------- h3: Can he survive thirty days? (close-up) ----------
registerShot('h3', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const vx = 760, vy = 990, s = 1.62, headY = vy - 272 * s;
  const sh = camShake(gt, 5, 13.1, 0.5);
  camBegin(g, BG.flat, { z: lerp(2.05, 2.25, sm(t, 0, info.dur)), x: vx + 40, y: headY + 10 }, sh);
  tvBroadcast(g, gt, 1, 1);
  vini(g, { x: vx, y: vy, s, t: gt, expr: pick(gt, [[0, 'shock'], [13.1, 'scared']]), arms: ['down', 'down'], turn: 0.1, look: [0, 0], shake: gt > 13.1 ? 0.8 : 0 });
  camEnd(g); vignette(g, 0.42);
  bigText(g, '30 DAYS?', W * 0.5, H * 0.13, { size: 170, k: pop(gt, 13.1, 0.3), color: '#ffffff' }); } });

// ---------- shared street-with-zombies scene ----------
// three zombies shamble towards camera down the road; positions are pure functions of global time
export const HORDE = [
  { kind: 'office', x: 1000, y0: 860, start: 14.0, seed: 1.3 }, { kind: 'worker', x: 860, y0: 835, start: 14.0, seed: 2.9 }, { kind: 'teen', x: 1120, y0: 848, start: 14.0, seed: 4.1 },
];
export function hordeAt(z, gt, speedK = 1) { const s0 = sY(z.y0), cad = 0.5;   // advance in y; speed scales with perspective so feet stay planted
  let y = z.y0, s = s0; const steps = Math.max(0, (gt - z.start) * 30); for (let i = 0; i < steps; i++) { s = sY(y); y += strideSpeed(s, cad) * 0.22 * speedK / 30; }
  return { x: z.x + (y - z.y0) * (z.x - 955) / 260, y, s: sY(y) }; }

// ---------- h4: one thing you need to know… can't see very well… can hear everything ----------
registerShot('h4', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const c = camBegin(g, BG.street, { z: lerp(1.45, 1.6, sm(t, 0, info.dur)), x: 980, y: 760 });
  const zs = HORDE.map((z) => ({ ...z, ...hordeAt(z, gt) })).sort((a, b) => a.y - b.y);
  const snap = so(gt, 21.6, 21.9);                                      // heads snap round on "hear"
  for (const z of zs) zombie(g, { kind: z.kind, x: z.x, y: z.y, s: z.s, t: gt, seed: z.seed, dir: 0, headTurn: snap * 0.0, shake: snap > 0 && snap < 1 ? 1.4 : 0 });
  camEnd(g);
  const lead = zs[zs.length - 1], [ex, ey] = toScreen(c, lead.x, lead.y - lead.s * 272);
  const k1 = pop(gt, 19.15), k2 = pop(gt, 21.6);
  if (k1 > 0) { note(g, 'bad eyesight', W * 0.17, H * 0.6, { size: 66, k: k1 }); arrowTo(g, W * 0.2, H * 0.55, ex - 40, ey + 10, so(gt, 19.2, 19.6)); }
  if (k2 > 0) { note(g, 'PERFECT hearing', W * 0.82, H * 0.6, { size: 70, k: k2, rot: 0.03 }); arrowTo(g, W * 0.78, H * 0.55, ex + 50, ey + 10, so(gt, 21.65, 22.05), RED, -30); }
  vignette(g, 0.4); } });

// ---------- h5: so whatever happens… don't make a sound (hiding behind the car) ----------
registerShot('h5', { draw(g, t, info) { const T = info.shot.start, gt = T + t;
  const c = camBegin(g, BG.street, { z: lerp(1.3, 1.42, sm(t, 0, info.dur)), x: 640, y: 760 });
  // passing zombie walks right-to-left across the road in front of the car… no: behind it, along the road centre
  const zy = 880, zs = sY(zy), zx = 1270 - strideSpeed(zs, 0.55) * Math.max(0, gt - 23.3);
  zombie(g, { kind: 'office', x: zx, y: zy, s: zs, t: gt, seed: 0.7, dir: -1 });
  // Vini crouched behind the grey car: only head + shoulders show above the roof line
  g.save(); g.beginPath(); g.rect(0, 0, W, 700); g.clip();
  const breath = Math.sin(gt * 2.2) * 3;
  vini(g, { x: 430, y: 975 + breath, s: 1.22, t: gt, expr: pick(gt, [[0, 'scared'], [25.6, 'terror']]), arms: arms2(gt, [[0, 'chest'], [25.6, 'face']], [[0, 'cold'], [25.6, 'face']]), turn: 0.75, look: [1, 0], shadow: false, shake: gt > 25.6 ? 0.7 : 0 });
  g.restore();
  carFront(g);
  camEnd(g);
  const ws = [['DON’T', 25.71], ['MAKE', 25.99], ['A SOUND', 26.56]];
  ws.forEach(([w, at], i) => bigText(g, w, W * (0.5 + (i - 1) * 0.0), H * (0.62 + i * 0.13), { size: i === 2 ? 150 : 120, k: pop(gt, at - 0.05, 0.25), color: i === 2 ? '#ff4a3a' : '#ffffff', rot: -0.03 + i * 0.015 }));
  vignette(g, 0.42); } });

// ---------- h6: title card ----------
registerShot('h6', { draw(g, t, info) { g.fillStyle = '#0a0908'; g.fillRect(0, 0, W, H);
  const k = pop(t, 0.0, 0.22); bigText(g, 'SURVIVING', W / 2, H * 0.4, { size: 120, k, color: '#ece6d6' }); bigText(g, '30 DAYS', W / 2, H * 0.58, { size: 190, k: pop(t, 0.12, 0.22), color: '#ff4a3a' });
  fade(g, sm(t, info.dur - 0.25, info.dur)); } });
