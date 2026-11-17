// src/scenes/props.js — small hand-drawn props shared by more than one scene. Pure drawing, no state.
import { INK, alpha } from '../kit/kit.js';
// a tin of beans (label colour can change; label=false draws the bare unlabelled tin of Day 24 / Day 30)
export function tin(g, x, y, s = 1, rot = 0, o = {}) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#b9bdc0'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-15, -22, 30, 44, 4); g.fill(); g.stroke();
  if (o.label !== false) { g.fillStyle = o.color || '#c8262e'; g.fillRect(-15, -10, 30, 22); g.strokeRect(-15, -10, 30, 22); g.fillStyle = '#f2e6d0'; g.beginPath(); g.ellipse(0, 1, 8, 6, 0, 0, 7); g.fill(); }
  else { g.strokeStyle = alpha(INK, 0.35); g.lineWidth = 2; for (const yy of [-12, 12]) { g.beginPath(); g.moveTo(-15, yy); g.lineTo(15, yy); g.stroke(); } }
  g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(-10, -18); g.lineTo(-10, 18); g.stroke(); g.restore(); }
