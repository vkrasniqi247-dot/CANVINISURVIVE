// src/RigTest.jsx — contact sheet of Vini's expressions, looks and poses (for checking the rig).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneCanvas } from './SceneCanvas.jsx';
import { drawVini } from './vini/rig.js';
const CASES = [
  { expr: 'neutral' }, { expr: 'shock' }, { expr: 'shock', look: [0, -1] }, { expr: 'worried', look: [0.6, 0.7] }, { expr: 'scared', look: [-1, -0.2] }, { expr: 'sleep' },
  { expr: 'determined', look: [1, 0] }, { expr: 'happy' }, { crouch: 9, arms: ['out', 'out'] }, { walkDist: -10, stride: 30 }, { walkDist: 10, stride: 30 }, { walkDist: 25, stride: 30 },
];
const draw = (g, t, A) => { g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, 1920, 1080);
  CASES.forEach((c, i) => { const x = 160 + (i % 6) * 320, y = 500 + Math.floor(i / 6) * 520;
    drawVini(g, A.vini, { x, y: y - 40, s: 1.6, t: 1, blink: false, ...c });
    g.fillStyle = '#000'; g.font = '20px sans-serif'; g.fillText(JSON.stringify(c), x - 150, y + 10); }); };
export const RigTest = () => <AbsoluteFill><SceneCanvas t={0} frame={0} draw={draw} /></AbsoluteFill>;
