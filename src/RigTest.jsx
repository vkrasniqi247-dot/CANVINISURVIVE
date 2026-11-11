// src/RigTest.jsx — rig check sheets for Vini. Frame 0: every view (turn -1..1) and arm poses when turned.
// Frame 1: expressions in front / 3/4 / side. Frame 2: side-view walk cycle (8 phases) + 3/4 walk + crouches.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneCanvas } from './SceneCanvas.jsx';
import { drawVini } from './vini/rig.js';
import { drawZombie, drawRunner } from './zombie/zombie.js';
const SHEETS = [
  [{ turn: 0 }, { turn: 0.2 }, { turn: 0.45 }, { turn: 0.6 }, { turn: 0.75 }, { turn: 0.9 }, { turn: 1 }, { turn: -0.6 },
   { turn: -1 }, { turn: 1, arms: ['hold', 'hold'] }, { turn: 0.6, arms: ['down', 'point'] }, { turn: 1, arms: ['chest', 'face'] }, { turn: 0.6, arms: ['out', 'out'] }, { turn: -0.6, arms: ['hold', [10, 6]] }, { turn: 0, arms: ['chest', [10, 6]] }, { turn: 0.6, look: [-1, 0] }],
  [{ expr: 'neutral' }, { expr: 'shock' }, { expr: 'scared', look: [-1, -0.2] }, { expr: 'determined', look: [1, 0] }, { turn: 0.6, expr: 'shock' }, { turn: 0.6, expr: 'worried' }, { turn: 0.6, expr: 'determined' }, { turn: 0.6, expr: 'sleep' },
   { turn: 1, expr: 'neutral' }, { turn: 1, expr: 'shock' }, { turn: 1, expr: 'scared' }, { turn: 1, expr: 'determined' }, { turn: 1, expr: 'happy' }, { turn: -1, expr: 'terror' }, { turn: 0.6, expr: 'happy', look: [0.5, -0.5] }, { turn: -0.6, expr: 'scared' }],
  [...Array.from({ length: 8 }, (_, i) => ({ turn: 1, walkDist: 10 + i * 7.5, stride: 30, lift: 14 })),
   { turn: 0.6, walkDist: 20, stride: 30 }, { turn: 0.6, walkDist: 35, stride: 30 }, { turn: -1, walkDist: -20, stride: 30 }, { turn: 0, walkDist: 20, stride: 30 }, { turn: 1, crouch: 12, arms: ['out', 'out'] }, { turn: 0.6, crouch: 10 }, { turn: 0, crouch: 5 }, { turn: 1, breath: 1, expr: 'sleep' }],
];
// frame 3: big heads for checking look direction and the face slide
const BIG = [{ look: [1, 0] }, { look: [-1, 0] }, { turn: 0.6, look: [1, 0] }, { turn: 1, look: [0, -1], expr: 'shock' }];
// frame 4: zombies — the three outfits, the march at camera (4 phases), the side lurch (4 phases), two runners
const ZS = [{ kind: 'office', walk: false }, { kind: 'worker', walk: false }, { kind: 'teen', walk: false }, { kind: 'office', expr: 'groan', walk: false },
  ...[0, 0.4, 0.8, 1.2].map((t) => ({ kind: 'worker', t })), ...[0, 0.45, 0.9, 1.35].map((t) => ({ kind: 'office', dir: -1, t })), ...[0.2, 0.5].map((t, i) => ({ runner: 1, kind: i ? 'runnerB' : 'runnerA', t, walkDist: 40 + t * 80 }))];
const draw = (sheet) => (g) => { g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, 1920, 1080);
  if (sheet === 4) { ZS.forEach((c, i) => { const x = 110 + (i % 8) * 240, y = 480 + Math.floor(i / 8) * 520, o = { x, y, s: 1.15, t: c.t ?? 1, seed: 0, ...c };
    if (c.runner) drawRunner(g, g.__A.zombie, o); else drawZombie(g, g.__A.zombie, o); g.fillStyle = '#000'; g.font = '15px sans-serif'; g.textAlign = 'center'; g.fillText(JSON.stringify(c).replace(/"/g, ''), x, y + 30); }); return; }
  if (sheet === 3) { BIG.forEach((c, i) => { drawVini(g, g.__A.vini, { x: 240 + i * 480, y: 1900, s: 4.2, t: 1, blink: false, ...c }); g.fillStyle = '#000'; g.font = '24px sans-serif'; g.textAlign = 'center'; g.fillText(JSON.stringify(c).replace(/"/g, ''), 240 + i * 480, 1050); }); return; }
  SHEETS[sheet].forEach((c, i) => { const x = 125 + (i % 8) * 238, y = 480 + Math.floor(i / 8) * 520;
    drawVini(g, g.__A.vini, { x, y, s: 1.15, t: 1, blink: false, ...c });
    g.fillStyle = '#000'; g.font = '15px sans-serif'; g.textAlign = 'center'; g.fillText(JSON.stringify(c).replace(/"/g, '').slice(0, 40), x, y + 30); }); };
export const RigTest = () => { const f = useCurrentFrame(); return <AbsoluteFill><SceneCanvas t={f} frame={0} draw={(g, t, A) => { g.__A = A; draw(Math.min(4, f))(g); }} /></AbsoluteFill>; };
