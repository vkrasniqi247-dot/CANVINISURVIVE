// rig/patch_views.mjs — after autorig, move each turn-variant attachment (variants.json: name -> base slot)
// into its base slot as an alternate image. Every layer is drawn on the same 900x1400 canvas, so a variant
// lines up exactly when it reuses the base attachment's offset. Its own (autorig 'extra') slot is removed.
// The runtime then swaps views with pose.attachment[slot] = 'head_t34' etc.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), F = path.join(HERE, 'vini_export/vini.json');
const V = JSON.parse(fs.readFileSync(path.join(HERE, 'variants.json'), 'utf8'));
const j = JSON.parse(fs.readFileSync(F, 'utf8')), atts = j.skins[0].attachments;
let n = 0;
for (const [name, base] of Object.entries(V)) {
  const src = atts[name]?.[name], b = atts[base]?.[base];
  if (!src || !b) throw new Error(`variant ${name} or base ${base} missing`);
  atts[base][name] = { ...b };                      // same placement as the base image
  delete atts[name]; j.slots = j.slots.filter((s) => s.name !== name); n++;
}
// animations may key slots by name; drop any that point at removed slots
for (const a of Object.values(j.animations || {})) if (a.slots) for (const k of Object.keys(a.slots)) if (!j.slots.find((s) => s.name === k)) delete a.slots[k];
fs.writeFileSync(F, JSON.stringify(j));
console.log(`patched ${n} view variants into base slots`);
