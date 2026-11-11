// src/kit/grade.js — light film grain over the finished frame (seeded by frame number, so renders are repeatable).
let tile = null;
function makeTile() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  let s = 1234567; for (let i = 0; i < d.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = 128 + ((s >> 8) % 64) - 32; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c; }
export function grain(g, frame, a = 0.045) { tile = tile || makeTile(); g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a;
  const ox = (frame * 97) % 256, oy = (frame * 61) % 256; g.translate(-ox, -oy); g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, 1920 + 256, 1080 + 256); g.restore(); }
