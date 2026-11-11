// src/vini/rig.js — the Rigby2D-rigged Vini, drawn with Canvas2D.
// drawVini(g, rig, opts) is a pure function of opts, so every Remotion frame is deterministic.
//
// Views: opts.turn (-1..1) turns him toward screen-right (+) or screen-left (-). The body is treated as a
// thin 3D figure: a point with lateral offset L and depth F lands at x = L cos(a) + F sin(a), a = turn * 90°.
// Shoulders, hips, feet and hands move continuously with that formula, and the face slides round the head.
// The art swaps at |turn| > 0.35 (3/4 layers: torso_t34, backpack_t34, hair_t34, side feet) and at
// |turn| > 0.8 (side layers). Left turns mirror the whole figure (his design is symmetric).
import { readSkeletonJson, Pose } from '../rigby/core/index.js';

// url(p) maps a file inside public/vini/ to a fetchable URL (staticFile in Remotion)
// Any character built by rig/build_rig.mjs (vini, zombie) shares this runtime: same bone names, same canvas.
export const loadVini = (url) => loadRig(url, 'vini.json');
export async function loadRig(url, file) {
  const json = await (await fetch(url(file))).json();
  const { skeleton } = readSkeletonJson(json, file.replace('.json', ''));
  const names = new Set();
  for (const atts of Object.values(json.skins[0].attachments)) for (const n of Object.keys(atts)) names.add(n);
  const imgs = {};
  await Promise.all([...names].map(async (n) => { const im = new Image(); im.src = url(`images/${n}.png`); await im.decode(); imgs[n] = im; }));
  const bi = Object.fromEntries(skeleton.bones.map((b, i) => [b.name, i]));
  const si = Object.fromEntries(skeleton.slots.map((s, i) => [s.name, i]));
  const has = new Set(Object.entries(json.skins[0].attachments).flatMap(([sl, atts]) => Object.keys(atts).map((a) => `${sl}/${a}`)));
  const rig = { sk: skeleton, pose: new Pose(skeleton), imgs, bi, si, has, anim: Object.fromEntries(skeleton.animations.map((a) => [a.name, a])) };
  // setup-pose foot angles (to keep the feet level whatever the IK does to the shins)
  rig.pose.reset(skeleton); rig.pose.updateWorld(skeleton);
  rig.footRest = Object.fromEntries(['l', 'r'].map((s) => [s, worldAngle(rig.pose.world[bi[`foot_${s}`]])]));
  // draw orders: front = as rigged; turned = far arm and far leg behind the body, near ones in front
  const S = skeleton.slots.map((s) => s.name), FRONT = S.map((_, i) => i);
  const farArm = ['upperarm_l', 'forearm_l', 'hand_l'], farLeg = ['thigh_l', 'shin_l', 'foot_l'], nearLeg = ['thigh_r', 'shin_r', 'foot_r'];
  const rest = S.filter((n) => ![...farArm, ...farLeg, ...nearLeg, 'backpack'].includes(n));
  rig.order = { front: FRONT, turned: ['backpack', ...farArm, ...farLeg, ...nearLeg, ...rest].filter((n) => si[n] !== undefined).map((n) => si[n]) };
  return rig;
}
const DEG = 180 / Math.PI;
const worldAngle = (m) => Math.atan2(m.b, m.a) * DEG;

// hand positions relative to the shoulder in v1 units (y down), for the screen-right arm (same presets as v1).
// The optional third number is how far forward (toward his front) the hand sits; it shows when he turns.
export const ARMS = { down: [10, 88, 3], relaxed: [6, 88, 2], hips: [6, 66, -6], out: [80, 36, 26], wave: [40, -74, 8], up: [16, -94, 6], hold: [-6, 64, 30], chest: [-16, 36, 24], point: [90, -2, 84], shrug: [52, 6, 8], face: [-6, -32, 28], cold: [-22, 40, 20], reach: [52, -84, 40], carry: [2, 70, 28], torch: [70, 30, 60] };
const K = 4, SHX = 23, HEADR = 35.62 * K, GAP = 35.62 * 0.34 * K;
const FACES = {
  neutral: { mouth: 'mouth', brow: [0, 0] }, worried: { mouth: 'mouth_wobble', brow: [12, 8] }, scared: { mouth: 'mouth_wobble', brow: [18, 14] },
  terror: { mouth: 'mouth_scream', brow: [22, 18] }, shock: { mouth: 'mouth_o', brow: [0, 22] }, happy: { mouth: 'mouth_smile', brow: [0, 6] },
  determined: { mouth: 'mouth', brow: [-16, -6] }, exhausted: { mouth: 'mouth_o', brow: [6, -4] }, sleep: { mouth: 'mouth', brow: [0, -4], closed: 1 }, relief: { mouth: 'mouth_smile', brow: [10, 6], closed: 1 },
  zombie: { mouth: 'mouth', brow: [6, -2] }, groan: { mouth: 'mouth_o', brow: [10, -4] },
};
const MOUTHS = ['mouth', 'mouth_smile', 'mouth_wobble', 'mouth_o', 'mouth_scream'];
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
// accepts a preset name, a hand point [x, y(, fwd)], or a v1 [elbow, hand] pair
const handOf = (p) => (typeof p === 'string' ? ARMS[p] || ARMS.down : Array.isArray(p[0]) ? p[1] : p);
const fwdOf = (p) => { const h = handOf(p); return h[2] ?? 14 + Math.max(0, -h[0]) * 0.8; };
const swings = (p) => p === 'down' || p === 'relaxed';

// Natural blinks: one per 2.6 s cell at a hashed offset, so the rhythm never looks mechanical; about one
// cell in four adds a quick double blink. Pure function of time.
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
function blinking(t) { const C = 2.6, n = Math.floor(t / C);
  for (const m of [n - 1, n]) { const t0 = m * C + 0.3 + hash(m) * 1.9, d = t - t0; if (d >= 0 && d < 0.12) return true; if (hash(m + 7777) < 0.25 && d >= 0.22 && d < 0.32) return true; }
  return false; }
// The view the art should show for a turn amount (|turn|): 'front' | 't34' | 'side'
export const viewOf = (turn) => (Math.abs(turn) > 0.8 ? 'side' : Math.abs(turn) > 0.35 ? 't34' : 'front');

// opts: t, anim ('walk'|'run'), animT, animMix, arms [screen-left, screen-right], expr, look [x,y], blink,
//       shake, headTilt, lean, crouch (v1 units the hips drop, knees bend), hipX, swing, seed,
//       turn (-1..1), walkDist/stride/lift (planted-feet travel), breath (0..1 extra chest rise),
//       hairLag / packLag (degrees of follow-through, from secondary()), squash (0..1 contact squash),
//       armSwing (0..1 arm swing that follows the steps when walking)
// Internal mirroring for left turns happens in drawVini; poseVini always sees turn >= 0.
export function poseVini(rig, o) {
  const { sk, pose, bi, si } = rig; pose.reset(sk);
  const t = o.t || 0, turn = clamp(o.turn || 0, 0, 1), a = turn * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), view = viewOf(turn);
  pose.apply(sk, rig.anim.idle, ((t % rig.anim.idle.duration) + rig.anim.idle.duration) % rig.anim.idle.duration, 1);
  if (o.anim && o.anim !== 'idle') { const an = rig.anim[o.anim]; const at = o.animT ?? t; pose.apply(sk, an, ((at % an.duration) + an.duration) % an.duration, o.animMix ?? 1); }
  // body narrows as he turns: shoulders and hip joints slide toward the middle (lateral = local y, screen x = -y)
  for (const n of ['upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r']) pose.local[bi[n]].y *= lerp(1, ca, 0.92);
  for (const s of ['l', 'r']) { const F = pose.local[bi[`ik_foot_${s}`]]; F.x *= lerp(1, ca, 0.95); }
  rig.footRel = { l: 0, r: 0 }; rig.footRoll = { l: 0, r: 0 }; rig.stepPhase = null; rig.contact = 0;
  if (o.walkDist != null) plantedFeet(rig, o, ca);
  if (o.march != null) march(rig, o);
  if (o.crouch) { pose.local[bi.hip].y -= o.crouch * K;
    // front view: a bent knee points at the camera, so the legs foreshorten instead of bowing out like a frog
    const w = clamp(1 - turn / 0.35); if (w > 0 && o.crouch > 0) { const f = 1 - (o.crouch * K * 0.92 * w) / 562;
      for (const s of ['l', 'r']) { pose.local[bi[`thigh_${s}`]].scale_x *= f; pose.local[bi[`shin_${s}`]].scale_x *= f; } } }
  if (o.hipX) pose.local[bi.hip].x += o.hipX * K;
  if (o.breath) { const c = pose.local[bi.chest]; c.scale_y *= 1 + 0.045 * o.breath; c.scale_x *= 1 + 0.012 * o.breath; pose.local[bi.head].x += 2.5 * o.breath; }
  const arms = o.arms || ['down', 'down'];
  for (const [i, side] of [[0, 'r'], [1, 'l']]) {
    const p = handOf(arms[i]), k = side === 'l' ? 1 : -1, L = pose.local[bi[`ik_hand_${side}`]], m = o.armMix?.[i] ?? 1;
    const tx = (k * (SHX + p[0]) * ca + fwdOf(arms[i]) * sa) * K, ty = -(-228 + p[1]) * K;
    L.x = lerp(L.x * lerp(1, ca, 0.92), tx, m); L.y = lerp(L.y, ty, m) - (o.crouch || 0) * K;
    if (o.swing && swings(arms[i])) L.x += Math.sin(t * 6.3 + (i ? Math.PI : 0)) * o.swing * 40;
    // walking: each arm swings opposite its own leg (so with the other leg), forward/back in the turned views
    if (rig.stepPhase != null && swings(arms[i])) { const g = (o.armSwing ?? 1) * lerp(0.4, 1.0, sa); L.x -= rig.footRel[side] * g; L.y += Math.abs(rig.footRel[side]) * g * 0.22; }
  }
  if (o.lean) pose.local[bi.chest].rotation += o.lean;
  if (o.headTilt) pose.local[bi.head].rotation += o.headTilt;
  if (o.shake) { pose.local[bi.head].rotation += Math.sin(t * 47) * o.shake * 2; pose.local[bi.chest].rotation += Math.cos(t * 41) * o.shake; }
  const sq = (o.squash || 0) + rig.contact * (o.walkSquash ?? 0.6);
  if (sq) { const c = pose.local[bi.chest]; c.scale_x *= 1 - 0.035 * sq; c.scale_y *= 1 + 0.025 * sq; }
  // secondary motion: hair and backpack lag behind the body (computed from motion history by the scene)
  // ---- face
  const F = FACES[o.expr || 'neutral'] || FACES.neutral;
  const blink = o.blink !== false && blinking(t + (o.seed || 0) * 1.37);
  for (const m of MOUTHS) if (si[m] !== undefined) pose.attachment[si[m]] = m === F.mouth ? m : null;
  const closed = F.closed || blink, hideFar = turn > 0.8;
  // the face slides round the head toward the turn side, and the eyes get closer together (foreshortening)
  const fc = HEADR * 0.6 * sa, squeeze = Math.cos(a * 0.8);
  const shiftX = (x0) => x0 * squeeze + fc - x0;                         // screen-x change for a feature at x0
  const sk2 = o.skin || {}, pickAtt = (slot, names) => names.find((n) => rig.has.has(`${slot}/${n}`)) ?? null;
  for (const s of ['l', 'r']) {
    const x0 = (s === 'l' ? 1 : -1) * GAP, far = s === 'l' && hideFar;
    pose.attachment[si[`eye_${s}`]] = closed || far ? null : pickAtt(`eye_${s}`, [`eye_${s}${sk2.eyes ?? ''}`, `eye_${s}`]);
    pose.attachment[si[`eye_${s}_closed`]] = closed && !far ? `eye_${s}_closed` : null;
    pose.attachment[si[`brow_${s}`]] = far ? null : `brow_${s}`;
    const br = pose.local[bi[`brow_${s}`]]; br.rotation += (s === 'r' ? -1 : 1) * F.brow[0]; br.x += F.brow[1]; br.y -= shiftX(x0);
    pose.local[bi[`eye_${s}`]].y -= shiftX(x0);
  }
  pose.local[bi.mouth].y -= fc * 1.08;
  if (o.look) for (const n of ['eye_l', 'eye_r']) { const b = bi[n]; pose.local[b].x += o.look[1] * -10; pose.local[b].y -= o.look[0] * 12 * lerp(1, 0.5, sa); }   // + = screen-right
  // ---- view art
  // ---- view + outfit art: '<part><outfit><view>' falling back to '<part><outfit>', '<part><view>', '<part>'
  const v = view === 'front' ? '' : view === 't34' ? '_t34' : '_side';
  const part = (slot, base, suf) => { if (si[slot] === undefined) return null; const a = pickAtt(slot, [`${base}${suf ?? ''}${v}`, `${base}${suf ?? ''}`, `${base}${v}`, base]); pose.attachment[si[slot]] = a; return a; };
  const tor = part('torso', 'torso', sk2.torso); part('backpack', 'backpack'); part('hair', 'hair', sk2.hair); part('head', 'head', sk2.head);
  for (const s of ['l', 'r']) { part(`upperarm_${s}`, `upperarm_${s}`, sk2.arms); part(`forearm_${s}`, `forearm_${s}`, sk2.arms);
    pose.attachment[si[`foot_${s}`]] = pickAtt(`foot_${s}`, view === 'front' ? [`foot_${s}`] : [`foot_${s}_side`, `foot_${s}`]); }
  // a character with no turned torso art gets its front torso narrowed instead
  rig.torsoSquash = view !== 'front' && tor && !tor.endsWith(v) ? lerp(1, 0.62, sa) : 1;
  pose.drawOrder = view === 'front' ? rig.order.front.slice() : rig.order.turned.slice();
  // knees point the way he travels, or the way he faces once turned (no frog-legged crouch)
  rig.kneeDir = view !== 'front' ? 1 : o.walkDist != null ? (o.walkDist < 0 ? -1 : 1) : 0;
  pose.updateWorld(sk);
  if (rig.kneeDir) kneesForward(rig, rig.kneeDir);
  levelFeet(rig, view !== 'front' ? 1 : 0.6);
  // hair and backpack lag (secondary motion) are applied as rotations in drawVini: hair about the head
  // centre (the cap slides over the skull), the pack about its top (it hangs off the shoulders)
  rig.hairLag = o.hairLag || 0; rig.packLag = o.packLag || 0;
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
// Feet stay flat on the floor (k of the way) whatever angle the shins are at, plus the heel-toe roll of the step.
function levelFeet(rig, k) {
  const { pose, sk, bi } = rig;
  for (const s of ['l', 'r']) { const b = bi[`foot_${s}`], cur = worldAngle(pose.world[b]); let d = rig.footRest[s] + rig.footRoll[s] - cur; d = ((d + 540) % 360) - 180; pose.local[b].rotation += d * k; }
  pose.updateWorld(sk);
}

// Planted-feet stepping for travel across the frame: o.walkDist = how far (v1 units, + = screen right) the
// figure has moved since the walk began. Each foot stays put on the floor while the other swings past it,
// so nothing slides however fast or slow he moves. o.stride sets the step length, o.lift the foot height.
// Also sets rig.footRel (each foot's offset from the hips, for the arm swing), the heel-toe roll and a
// contact dip: the hips are lowest when both feet are down and highest as the legs pass.
const smooth = (x) => x * x * (3 - 2 * x);
function plantedFeet(rig, o, ca) {
  const { pose, sk, bi } = rig, L = o.stride ?? 30, lift = o.lift ?? 16, d = o.walkDist, dir = d < 0 ? -1 : 1, ad = Math.abs(d);
  const p = ad / L, ramp = Math.min(1, ad / L);              // steps taken; ramp eases in the first step
  rig.kneeDir = dir; rig.stepPhase = p;
  for (const [side, ph] of [['l', dir > 0 ? 1 : 0], ['r', dir > 0 ? 0 : 1]]) {
    const s = (p + ph) / 2, n = Math.floor(s), f = s - n, mv = Math.min(1, f * 2);
    const worldX = 2 * L * (n + smooth(mv)) - ph * L - 0.5 * L;   // where this foot is along the path
    const b = sk.bones[bi[`ik_foot_${side}`]].setup, F = pose.local[bi[`ik_foot_${side}`]];
    // walkMix < 1 brings the feet back together after the last step (the moving foot lifts in a small arc)
    const wm = o.walkMix ?? 1, rel = dir * (worldX - ad) * K * ramp * wm;
    const lf = side === 'r' ? 1 - (o.drag ?? 0) * 0.75 : 1;          // o.drag: the right foot barely lifts (a zombie's dragged leg)
    F.x = b.x * lerp(1, ca, 0.95) + rel; F.y = b.y + (mv < 1 && ad > 0.01 ? Math.sin(Math.PI * mv) * lift * lf * K : 0) + Math.abs(rel / wm || 0) * wm * (1 - wm) * 1.6;
    rig.footRel[side] = rel;
    // heel-toe: toe pushes off as the foot lifts, toe comes up before the heel strikes (only while swinging)
    if (mv < 1 && ad > 0.01) rig.footRoll[side] = dir * (-24 * Math.sin(Math.PI * clamp(mv / 0.4)) * (mv < 0.4 ? 1 : 0) + 18 * Math.sin(Math.PI * clamp((mv - 0.5) / 0.5) * 0.5) * (mv > 0.5 ? 1 : 0) * (1 - smooth(clamp((mv - 0.92) / 0.08)))) * ramp;
  }
  const pass = Math.abs(Math.sin(Math.PI * p)), contact = (1 - pass) ** 3;
  const hip = pose.local[bi.hip]; hip.y += (pass * 2.2 - contact * 2.5) * K * ramp;
  pose.local[bi.chest].rotation += Math.sin(Math.PI * p) * 1.8 * ca;
  rig.contact = contact * ramp;
}

// Stepping in place (for walking straight at the camera; the scene moves and scales him): o.march = steps taken.
// One foot lifts while the other bears weight; the hips sway over the standing foot and dip as the step lands.
// o.drag (0..1) makes the right leg drag (barely lifts, a heavier dip) for the zombie lurch.
function march(rig, o) {
  const { pose, bi } = rig, p = o.march, lift = (o.lift ?? 10) * K, drag = o.drag ?? 0;
  for (const [side, ph] of [['l', 0], ['r', 1]]) { const u = (((p + ph) % 2) + 2) % 2; if (u >= 1) continue;
    const F = pose.local[bi[`ik_foot_${side}`]]; F.y += Math.sin(Math.PI * u) * lift * (side === 'r' ? 1 - drag * 0.8 : 1); F.x += (side === 'l' ? 1 : -1) * Math.sin(Math.PI * u) * 1.5 * K; }
  const u = ((p % 2) + 2) % 2, stance = u < 1 ? 1 : -1;            // 1: standing on the right foot
  const hip = pose.local[bi.hip]; hip.x -= stance * Math.sin(Math.PI * (u % 1)) * 3.5 * K;
  hip.y -= (Math.abs(Math.cos(Math.PI * p)) ** 3 * 2 + (u >= 1 ? Math.sin(Math.PI * (u - 1)) * drag * 3 : 0)) * K;
  pose.local[bi.chest].rotation += stance * Math.sin(Math.PI * (u % 1)) * 2.5;
}

// draw with feet at (x, y); s = v1 scale; flip mirrors. props.left/right(g, [hx, hy]) draw things in the hands.
// turn < 0 mirrors him (and swaps which arm/prop is which, so 'left'/'right' always mean screen sides).
export function drawVini(g, rig, o) {
  const tn = o.turn || 0, mir = tn < 0;
  // screen-space options (lean, headTilt, hipX, lags: + = toward screen-left / counter-clockwise) keep their
  // on-screen meaning when he is mirrored, so nothing pops as the turn crosses 0
  const neg = (v) => (v ? -v : v);
  const q = mir ? { ...o, turn: -tn, arms: o.arms ? [o.arms[1], o.arms[0]] : o.arms, armMix: o.armMix ? [o.armMix[1], o.armMix[0]] : o.armMix,
    look: o.look ? [-o.look[0], o.look[1]] : o.look, walkDist: o.walkDist != null ? -o.walkDist : o.walkDist,
    lean: neg(o.lean), headTilt: neg(o.headTilt), hipX: neg(o.hipX), hairLag: neg(o.hairLag), packLag: neg(o.packLag) } : o;
  const pose = poseVini(rig, q), sc = (o.s ?? 1) / K, fx = (o.flip ? -1 : 1) * (mir ? -1 : 1);
  if (o.shadow !== false) { const a = o.shadowA ?? 0.36; g.fillStyle = `rgba(25,20,16,${a})`; g.beginPath(); g.ellipse(o.x, o.y + 2, 60 * o.s * lerp(1, 0.75, Math.abs(Math.sin(tn * Math.PI / 2))), 11 * o.s, 0, 0, Math.PI * 2); g.fill(); }
  g.save(); g.translate(o.x, o.y); g.scale(sc * fx, -sc);
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  const packSlot = rig.si.backpack, hairSlot = rig.si.hair, torsoSlot = rig.si.torso, chest = pose.world[rig.bi.chest], head = pose.world[rig.bi.head];
  for (const qd of pose.quads(rig.sk)) {
    const im = rig.imgs[qd.attachment?.name] || rig.imgs[qd.image]; if (!im) continue;
    const [p0, p1, , p3] = qd.positions, w = im.width, h = im.height;
    g.save(); g.globalAlpha *= qd.color?.[3] ?? 1;
    if (qd.slot === packSlot && rig.packLag) { // swing the pack about the top of the chest (bottom trails)
      const px = chest.tx + chest.a * 190, py = chest.ty + chest.b * 190;
      g.translate(px, py); g.rotate(-rig.packLag / DEG); g.translate(-px, -py); }
    if (qd.slot === torsoSlot && rig.torsoSquash !== 1) { g.translate(chest.tx, 0); g.scale(rig.torsoSquash, 1); g.translate(-chest.tx, 0); }
    if (qd.slot === hairSlot && rig.hairLag) { // slide the hair over the skull (top trails)
      const px = head.tx + head.a * 120, py = head.ty + head.b * 120;
      g.translate(px, py); g.rotate(rig.hairLag / DEG); g.translate(-px, -py); }
    g.transform((p1[0] - p0[0]) / w, (p1[1] - p0[1]) / w, (p3[0] - p0[0]) / h, (p3[1] - p0[1]) / h, p0[0], p0[1]);
    g.drawImage(im, 0, 0); g.restore();
  }
  g.restore();
  if (o.props) for (const [side, bone] of [['left', mir ? 'hand_l' : 'hand_r'], ['right', mir ? 'hand_r' : 'hand_l']]) {
    const fn = o.props[side]; if (!fn) continue; const w = pose.world[rig.bi[bone]], hd = pose.world[rig.bi.head];
    // info.head = centre of his face on screen (for props that light it, e.g. the phone screen)
    fn(g, [o.x + w.tx * sc * fx, o.y - w.ty * sc], { head: [o.x + (hd.tx + hd.a * 120) * sc * fx, o.y - (hd.ty + hd.b * 120) * sc], s: o.s ?? 1 });
  }
  return pose;
}

// Where a bone ends up on screen for the same opts (e.g. to light the face or aim a prop), without drawing.
export function boneScreen(rig, o, bone) {
  const tn = o.turn || 0, mir = tn < 0, fx = (o.flip ? -1 : 1) * (mir ? -1 : 1), sc = (o.s ?? 1) / K;
  const pose = poseVini(rig, mir ? { ...o, turn: -tn, arms: o.arms ? [o.arms[1], o.arms[0]] : o.arms, walkDist: o.walkDist != null ? -o.walkDist : o.walkDist } : o);
  const w = pose.world[rig.bi[bone]]; return [o.x + w.tx * sc * fx, o.y - w.ty * sc];
}

// ---- secondary motion, deterministic: a damped spring driven by the motion history of a driver function.
// drive(t) -> number (e.g. the head's screen x). The spring's response is the convolution of the driver's
// acceleration with the spring's impulse response over the last `win` seconds, sampled at fixed steps, so
// any frame can be rendered on its own and always gives the same answer.
export function follow(drive, t, { freq = 3.2, damp = 0.32, win = 1.6, dt = 1 / 120, gain = 1 } = {}) {
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp); let y = 0;
  for (let tau = dt; tau < win; tau += dt) {
    const tt = t - tau, acc = (drive(tt + dt) - 2 * drive(tt) + drive(tt - dt)) / (dt * dt);
    y += Math.exp(-damp * w * tau) * Math.sin(wd * tau) / wd * acc * dt;
  }
  return -y * gain;
}
