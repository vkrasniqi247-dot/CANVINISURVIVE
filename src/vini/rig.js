// src/vini/rig.js — the Rigby2D-rigged Vini, drawn with Canvas2D.
// drawVini(g, rig, opts) is a pure function of opts, so every Remotion frame is deterministic.
import { readSkeletonJson, Pose } from '../rigby/core/index.js';

// url(p) maps a file inside public/vini/ to a fetchable URL (staticFile in Remotion)
export async function loadVini(url) {
  const json = await (await fetch(url('vini.json'))).json();
  const { skeleton } = readSkeletonJson(json, 'vini');
  const names = new Set();
  for (const atts of Object.values(json.skins[0].attachments)) for (const n of Object.keys(atts)) names.add(n);
  const imgs = {};
  await Promise.all([...names].map(async (n) => { const im = new Image(); im.src = url(`images/${n}.png`); await im.decode(); imgs[n] = im; }));
  const bi = Object.fromEntries(skeleton.bones.map((b, i) => [b.name, i]));
  const si = Object.fromEntries(skeleton.slots.map((s, i) => [s.name, i]));
  return { sk: skeleton, pose: new Pose(skeleton), imgs, bi, si, anim: Object.fromEntries(skeleton.animations.map((a) => [a.name, a])) };
}

// hand positions relative to the shoulder in v1 units (y down), for the screen-right arm (same presets as v1)
export const ARMS = { down: [10, 88], relaxed: [6, 88], hips: [6, 66], out: [80, 36], wave: [40, -74], up: [16, -94], hold: [-6, 64], chest: [-16, 36], point: [90, -2], shrug: [52, 6], face: [-6, -32], cold: [-22, 40], reach: [52, -84], carry: [2, 70], torch: [70, 30] };
const K = 4, SHY = -228, SHX = 23;
const FACES = {
  neutral: { mouth: 'mouth', brow: [0, 0] }, worried: { mouth: 'mouth_wobble', brow: [12, 8] }, scared: { mouth: 'mouth_wobble', brow: [18, 14] },
  terror: { mouth: 'mouth_scream', brow: [22, 18] }, shock: { mouth: 'mouth_o', brow: [0, 22] }, happy: { mouth: 'mouth_smile', brow: [0, 6] },
  determined: { mouth: 'mouth', brow: [-16, -6] }, exhausted: { mouth: 'mouth_o', brow: [6, -4] }, sleep: { mouth: 'mouth', brow: [0, -4], closed: 1 }, relief: { mouth: 'mouth_smile', brow: [10, 6], closed: 1 },
};
const MOUTHS = ['mouth', 'mouth_smile', 'mouth_wobble', 'mouth_o', 'mouth_scream'];
const lerp = (a, b, k) => a + (b - a) * k;
// accepts a preset name, a hand point [x, y], or a v1 [elbow, hand] pair
const handOf = (p) => (typeof p === 'string' ? ARMS[p] || ARMS.down : Array.isArray(p[0]) ? p[1] : p);
function armTarget(side, preset) { const p = handOf(preset), k = side === 'l' ? 1 : -1; return [k * (SHX + p[0]) * K, -(SHY + p[1]) * K]; }

// opts: t, anim ('walk'|'run'), animT, animMix, arms [screen-left, screen-right], expr, look [x,y], blink,
//       shake, headTilt, lean, crouch (v1 units the hips drop, knees bend), hipX, swing, seed
export function poseVini(rig, o) {
  const { sk, pose, bi, si } = rig; pose.reset(sk);
  const t = o.t || 0;
  pose.apply(sk, rig.anim.idle, ((t % rig.anim.idle.duration) + rig.anim.idle.duration) % rig.anim.idle.duration, 1);
  if (o.anim && o.anim !== 'idle') { const a = rig.anim[o.anim]; const at = o.animT ?? t; pose.apply(sk, a, ((at % a.duration) + a.duration) % a.duration, o.animMix ?? 1); }
  if (o.walkDist != null) plantedFeet(rig, o);
  if (o.crouch) pose.local[bi.hip].y -= o.crouch * K;
  if (o.hipX) pose.local[bi.hip].x += o.hipX * K;
  const arms = o.arms || ['down', 'down'];
  for (const [i, side] of [[0, 'r'], [1, 'l']]) {
    const tgt = armTarget(side, arms[i]), L = pose.local[bi[`ik_hand_${side}`]], m = o.armMix?.[i] ?? 1;
    L.x = lerp(L.x, tgt[0], m); L.y = lerp(L.y, tgt[1], m) - (o.crouch || 0) * K;
    if (o.swing && (arms[i] === 'down' || arms[i] === 'relaxed')) L.x += Math.sin(t * 6.3 + (i ? Math.PI : 0)) * o.swing * 40;
  }
  if (o.lean) pose.local[bi.chest].rotation += o.lean;
  if (o.headTilt) pose.local[bi.head].rotation += o.headTilt;
  if (o.shake) { pose.local[bi.head].rotation += Math.sin(t * 47) * o.shake * 2; pose.local[bi.chest].rotation += Math.cos(t * 41) * o.shake; }
  const F = FACES[o.expr || 'neutral'] || FACES.neutral;
  const blink = o.blink !== false && ((t + (o.seed || 0) * 1.37) % 3.4 + 3.4) % 3.4 < 0.12;
  for (const m of MOUTHS) pose.attachment[si[m]] = m === F.mouth ? m : null;
  const closed = F.closed || blink;
  for (const s of ['l', 'r']) {
    pose.attachment[si[`eye_${s}`]] = closed ? null : `eye_${s}`;
    pose.attachment[si[`eye_${s}_closed`]] = closed ? `eye_${s}_closed` : null;
    const br = pose.local[bi[`brow_${s}`]]; br.rotation += (s === 'r' ? -1 : 1) * F.brow[0]; br.x += F.brow[1];
  }
  if (o.look) for (const n of ['eye_l', 'eye_r', 'eye_l_closed', 'eye_r_closed']) { const b = bi[n]; if (b !== undefined) { pose.local[b].x += o.look[1] * -10; pose.local[b].y += o.look[0] * 12; } }
  rig.kneeDir = o.walkDist != null ? (o.walkDist < 0 ? -1 : 1) : 0;
  pose.updateWorld(sk);
  if (rig.kneeDir) kneesForward(rig, rig.kneeDir);
  return pose;
}

// After solving, make every bent knee point the way he travels (the IK otherwise picks whichever side it likes).
function kneesForward(rig, dir) {
  const { pose, sk, bi } = rig; let flip = false;
  for (const side of ['l', 'r']) {
    const hipJ = pose.world[bi[`thigh_${side}`]], knee = pose.world[bi[`shin_${side}`]], foot = pose.world[bi[`foot_${side}`]];
    const off = (knee.tx - (hipJ.tx + foot.tx) / 2) * dir;
    if (off < -0.5) { const i = sk.ik.findIndex((c) => c.name === `ik_foot_${side}`); pose.ik[i].bendPositive = !pose.ik[i].bendPositive; flip = true; }
  }
  if (flip) pose.updateWorld(sk);
}

// Planted-feet stepping for travel across the frame: o.walkDist = how far (v1 units, + = screen right) the
// figure has moved since the walk began. Each foot stays put on the floor while the other swings past it,
// so nothing slides however fast or slow he moves. o.stride sets the step length, o.lift the foot height.
const smooth = (x) => x * x * (3 - 2 * x);
function plantedFeet(rig, o) {
  const { pose, sk, bi } = rig, L = o.stride ?? 30, lift = o.lift ?? 16, d = o.walkDist, dir = d < 0 ? -1 : 1, ad = Math.abs(d);
  const p = ad / L;                                       // steps taken
  rig.kneeDir = dir;
  for (const [side, ph] of [['l', dir > 0 ? 1 : 0], ['r', dir > 0 ? 0 : 1]]) {
    const s = (p + ph) / 2, n = Math.floor(s), f = s - n, mv = Math.min(1, f * 2);
    const worldX = 2 * L * (n + smooth(mv)) - ph * L - 0.5 * L;   // where this foot is along the path
    const b = sk.bones[bi[`ik_foot_${side}`]].setup, F = pose.local[bi[`ik_foot_${side}`]];
    F.x = b.x + dir * (worldX - ad) * K * Math.min(1, ad / L); F.y = b.y + (mv < 1 && ad > 0.01 ? Math.sin(Math.PI * mv) * lift * K : 0);
  }
  const hip = pose.local[bi.hip]; hip.y -= Math.abs(Math.sin(Math.PI * p)) * 3 * K * Math.min(1, ad / 4);
  pose.local[bi.chest].rotation += Math.sin(Math.PI * p) * 1.8;
}

// draw with feet at (x, y); s = v1 scale; flip mirrors. props.left/right(g, [hx, hy]) draw things in the hands.
export function drawVini(g, rig, o) {
  const pose = poseVini(rig, o), sc = (o.s ?? 1) / K, fx = o.flip ? -1 : 1;
  if (o.shadow !== false) { const a = o.shadowA ?? 0.36; g.fillStyle = `rgba(25,20,16,${a})`; g.beginPath(); g.ellipse(o.x, o.y + 2, 60 * o.s, 11 * o.s, 0, 0, Math.PI * 2); g.fill(); }
  g.save(); g.translate(o.x, o.y); g.scale(sc * fx, -sc);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  for (const q of pose.quads(rig.sk)) {
    const im = rig.imgs[q.attachment?.name] || rig.imgs[q.image]; if (!im) continue;
    const [p0, p1, , p3] = q.positions, w = im.width, h = im.height;
    g.save(); g.globalAlpha *= q.color?.[3] ?? 1;
    g.transform((p1[0] - p0[0]) / w, (p1[1] - p0[1]) / w, (p3[0] - p0[0]) / h, (p3[1] - p0[1]) / h, p0[0], p0[1]);
    g.drawImage(im, 0, 0); g.restore();
  }
  g.restore();
  if (o.props) for (const [side, bone] of [['left', 'hand_r'], ['right', 'hand_l']]) {
    const fn = o.props[side]; if (!fn) continue; const w = pose.world[rig.bi[bone]];
    fn(g, [o.x + w.tx * sc * fx, o.y - w.ty * sc]);
  }
}
