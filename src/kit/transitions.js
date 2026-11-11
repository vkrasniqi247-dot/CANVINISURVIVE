// src/kit/transitions.js — whip pan between two shots, shared by the Opening (the Day 1 test has its own copy in day1.js).
// drawAt(ctx, gt) draws whatever shot is live at gt. Deterministic: a pure function of gt.
import { W, H, ease } from './kit.js';
let off = null;
export function whipPan(g, gt, center, half, drawAt, overlay) {
  off = off || Object.assign(document.createElement('canvas'), { width: W, height: H });
  const og = off.getContext('2d'); og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H); drawAt(og, gt);
  const w = (gt - center) / half, e = w < 0 ? ease.in(1 + w) : 1 - ease.out(w), dx = (w < 0 ? -1 : 1) * 300 * e, smear = 620 * e, N = 12;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(1 + 0.1 * e, 1 + 0.1 * e); g.translate(-W / 2, -H / 2);
  for (let i = 0; i < N; i++) { g.globalAlpha = 1 / (i + 1); g.drawImage(off, dx - (i / (N - 1) - 0.5) * smear, 0); }
  g.restore(); g.globalAlpha = 1; if (overlay) overlay(g, gt);
}
