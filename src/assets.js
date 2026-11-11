// src/assets.js — loads everything a scene needs once (rig, backgrounds, fonts) and shares it across frames.
import { staticFile } from 'remotion';
import { loadVini } from './vini/rig.js';
const img = async (p) => { const im = new Image(); im.src = staticFile(p); await im.decode(); return im; };
const font = async (family, file) => { const f = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`); await f.load(); document.fonts.add(f); };
let P = null;
export function loadAssets() {
  if (!P) P = (async () => {
    await Promise.all([font('Permanent Marker', 'permanent-marker-latin-400-normal.woff2'), font('Patrick Hand', 'patrick-hand-latin-400-normal.woff2')]);
    const [vini, flat, street, supermarket, barricade, stairwell, rooftop] = await Promise.all([
      loadVini((p) => staticFile(`vini/${p}`)), img('bg/bg01_flat_v2.png'), img('bg/bg03_street.png'), img('bg/bg02_supermarket_v2.png'),
      img('bg/bg04_barricade.png'), img('bg/bg05_stairwell.png'), img('bg/bg06_rooftop.png')]);
    return { vini, bg: { flat, street, supermarket, barricade, stairwell, rooftop } };
  })();
  return P;
}
