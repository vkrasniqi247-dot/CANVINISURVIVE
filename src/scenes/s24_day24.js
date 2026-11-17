// src/scenes/s24_day24.js — DAY 24 "The risk" (narration clip 12_day24, 50.7 s). Scene time t runs 0 → DUR seconds.
// One room (the boarded-up flat, evening): Vini kneels behind an upturned crate with his last four tins, a candle stub and
// the battery radio. Variety comes from framing: wide, prop close-ups, inserts (radio, calendar, map, notebook, packing).
// The bare unlabelled tin on its little book "shrine" with the "special occasion" tag pays off on Day 30.
// Every function is a pure function of time. Sentence times are clip time + OFF.
import { W, H, RED, INK, clamp, lerp, ease, alpha, rng, radGrad, sm, so, pop, settle, track, camBegin, camEnd, punches, toScreen, camShake, note, arrowTo, bigText, fade, vignette, nightGrade, dayCounter, tracker, notebook, inkPath, tick, cross, writeOn, pen } from '../kit/kit.js';
import { drawVini, follow } from '../vini/rig.js';
import { armSpring, overlap, withAlive, exprTrack, move } from '../kit/motion.js';
import { tin } from './props.js';

const OFF = 0.5;
export const DUR = 54.4;
export const VO = [['12_day24', OFF]];
export const SFX = [['day_slam', 0.5], ['stomach_rumble', 1.3], ['tin_tap', 4.75], ['tin_tap', 5.05], ['tin_tap', 5.35], ['tin_tap_hollow', 5.65], ['tin_slosh', 9.9], ['sniff', 10.6], ['tin_set_down', 11.7],
  ['radio_click', 13.9], ['radio_static', 13.95], ['radio_static_loop', 17.2], ['radio_tune_snap', 21.2], ['radio_voice_filter_on', 22.42], ['radio_voice_filter_off', 30.5],
  ['thud_low', 30.7], ['pen_scratch', 31.8], ['groan_crowd_soft', 33.45], ['gulp', 35.1], ['page_flip', 35.86], ['pen_scratch', 35.95],
  ['item_drop_bag', 41.5], ['item_drop_bag', 42.25], ['item_drop_bag', 42.85], ['item_drop_bag', 43.5], ['tins_rattle', 44.35], ['silence_hold', 45.0], ['cloth_rustle', 46.6], ['tracker_tick', 51.6]];

// ---------- layout (background coordinates, bg04_barricade) ----------
const VS = 1.36, VX = 900, VY = 985, KNEEL = 62, SHY = VY - (228 - KNEEL) * VS;       // SHY = shoulder height when kneeling
const CX0 = 640, CX1 = 1170, CTOP = 885, CFRONT = 925, CBOT = 1015, ROW = 912;        // the crate; ROW = where tins stand
const TS = 1.3, TINX = [705, 757, 809], T4X = 861, TCOL = ['#c8262e', '#d08a2a', '#c8262e'];
const SHR = [985, 890], RAD = [1085, 915], RS = 0.85, CANDLE = [662, 900], BAGF = [1250, 1016];
const NIGHT = 0.7;
// hand targets (v1 units from the shoulder) for a point in the background: screen-left arm / screen-right arm
const HL = (x, y, f = 24) => [(869 - x) / VS, (y - SHY) / VS, f], HR = (x, y, f = 24) => [(x - 931) / VS, (y - SHY) / VS, f];
const RL = HL(838, 874), RR = HR(962, 874);                                            // hands resting on the crate edge
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const breathe = (t, period, amp = 1) => amp * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / period));
const startle = (dt) => (dt <= 0 ? 0 : Math.sin(Math.min(1, dt / 0.09) * Math.PI / 2) * Math.exp(-Math.max(0, dt - 0.09) * 5.5));
const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
const wk = (t, at, str, cps = 18) => clamp((t - at) / Math.max(0.25, str.length / cps));
const drawK = (t, at, dur = 0.5) => ease.out(clamp((t - at + 0.08) / dur));

// ---------- props ----------
const tinAt = (g, x, base, s, rot, o) => tin(g, x, base - 22 * s, s, rot, o);
// THE tin: bare metal, a dent, a glint now and then, and (once he sets it apart) a handwritten tag on a string
function special(g, x, base, s, rot, tagK, t) {
  tinAt(g, x, base, s, rot, { label: false });
  g.save(); g.translate(x, base - 22 * s); g.rotate(rot); g.scale(s, s);
  g.strokeStyle = alpha(INK, 0.55); g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(6, -4); g.quadraticCurveTo(1, 3, 8, 9); g.stroke();      // the dent
  g.strokeStyle = alpha('#ffffff', 0.5); g.beginPath(); g.moveTo(9, -3); g.quadraticCurveTo(5, 3, 10, 8); g.stroke();
  const tw = Math.max(0, Math.sin(t * 1.9 + 1)) ** 8; if (tw > 0.02) { g.fillStyle = alpha('#ffffff', 0.9 * tw); g.beginPath(); const r = 9 * tw + 2;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; g.lineTo(-8 + Math.cos(a) * rr, -15 + Math.sin(a) * rr); } g.fill(); }
  if (tagK > 0) { const k = Math.min(1.15, tagK), sw = settle(t, 11.9, 0.35, 9, 3);
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-15, -17); g.quadraticCurveTo(0, -27, 15, -17); g.stroke();                       // string round the top
    g.beginPath(); g.moveTo(-15, -17); g.quadraticCurveTo(-22, -20, -27, -14); g.stroke();
    g.translate(-27, -14); g.rotate(-0.2 - sw); g.scale(k, k);
    g.fillStyle = '#efe4c6'; g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(-7, -9); g.lineTo(-62, -9); g.lineTo(-62, 14); g.lineTo(-7, 14); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(-8, 2.5, 1.6, 0, 7); g.fill();
    g.fillStyle = RED; g.font = '700 10.5px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('special', -36, -2.5); g.fillText('occasion', -36, 7.5); }
  g.restore(); }
// the two books the special tin stands on
function shrine(g) { const [x, y] = SHR; g.lineWidth = 3; g.strokeStyle = INK;
  g.fillStyle = '#5a3a34'; g.beginPath(); g.roundRect(x - 31, y + 11, 62, 11, 2); g.fill(); g.stroke(); g.fillStyle = '#39506a'; g.beginPath(); g.roundRect(x - 26, y, 54, 11, 2); g.fill(); g.stroke();
  g.fillStyle = '#e6dcc2'; g.fillRect(x - 27, y + 14, 5, 5); g.fillRect(x + 20, y + 3, 5, 5); }
// battery radio: handle, aerial, speaker grille, tuning dial that glows when it is on. Origin = bottom centre.
function radio(g, x, y, s = 1, on = 0, t = 0, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(34, -58); g.lineTo(58, -122); g.stroke(); g.fillStyle = '#b9bdc0'; g.beginPath(); g.arc(58, -122, 4, 0, 7); g.fill(); g.stroke();   // aerial
  g.lineWidth = 4; g.beginPath(); g.moveTo(-34, -58); g.quadraticCurveTo(-30, -80, 0, -80); g.quadraticCurveTo(30, -80, 34, -58); g.stroke();                                               // handle
  g.fillStyle = '#3a3630'; g.beginPath(); g.roundRect(-28, -68, 16, 10, 3); g.fill(); g.stroke();                                                                                             // on/off button
  g.fillStyle = '#d7a43c'; g.lineWidth = 3.5; g.beginPath(); g.roundRect(-48, -60, 96, 60, 8); g.fill(); g.stroke();
  g.fillStyle = alpha('#7a4a14', 0.35); g.fillRect(-46, -12, 92, 10);
  g.fillStyle = '#2b2722'; g.beginPath(); g.roundRect(-41, -52, 46, 44, 5); g.fill(); g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#8f887a'; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.beginPath(); g.arc(-33 + c * 10, -45 + r * 10, 2.2, 0, 7); g.fill(); }
  if (on > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 26, -36, 0, 46, [alpha('#ffc860', 0.55 * on), alpha('#ffc860', 0)]); g.beginPath(); g.arc(26, -36, 46, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = on > 0.5 ? '#ffe2a0' : '#e4dcc6'; g.lineWidth = 3; g.beginPath(); g.arc(26, -37, 13, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = RED; g.lineWidth = 2.5; const a = -1.2 + (on > 0.5 ? Math.sin(t * 0.7) * 0.25 : 0); g.beginPath(); g.moveTo(26, -37); g.lineTo(26 + Math.cos(a) * 9, -37 + Math.sin(a) * 9); g.stroke();
  g.fillStyle = on > 0.5 ? '#ff5a3a' : '#5a2a22'; g.beginPath(); g.arc(14, -13, 3, 0, 7); g.fill();
  g.fillStyle = '#efe6cc'; g.strokeStyle = INK; g.lineWidth = 2; g.fillRect(22, -17, 20, 7); g.strokeRect(22, -17, 20, 7);
  g.strokeStyle = alpha('#ffffff', 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(-42, -56); g.lineTo(40, -56); g.stroke(); g.restore(); }
function candle(g, x, y, t) { const f = 1 + 0.12 * Math.sin(t * 11) + 0.08 * Math.sin(t * 23.7);
  g.fillStyle = '#d9d2bd'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 17, 5, 0, 0, 7); g.fill(); g.stroke();                 // saucer
  g.fillStyle = '#efe7d2'; g.beginPath(); g.roundRect(x - 7, y - 20, 14, 20, 3); g.fill(); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x, y - 25); g.stroke();
  g.fillStyle = '#ffb040'; g.beginPath(); g.moveTo(x, y - 24); g.quadraticCurveTo(x - 6 * f, y - 30, x + Math.sin(t * 7) * 1.5, y - 24 - 16 * f); g.quadraticCurveTo(x + 6 * f, y - 30, x, y - 24); g.fill();
  g.fillStyle = '#fff2c0'; g.beginPath(); g.ellipse(x, y - 28, 2.2, 4.5, 0, 0, 7); g.fill(); }
function crate(g) { g.fillStyle = 'rgba(15,12,9,0.42)'; g.beginPath(); g.ellipse((CX0 + CX1) / 2, CBOT + 2, (CX1 - CX0) / 2 + 26, 15, 0, 0, 7); g.fill();
  g.lineWidth = 3.5; g.strokeStyle = INK; g.lineJoin = 'round';
  g.fillStyle = '#8b6a45'; g.beginPath(); g.moveTo(CX0 + 16, CTOP); g.lineTo(CX1 - 16, CTOP); g.lineTo(CX1, CFRONT); g.lineTo(CX0, CFRONT); g.closePath(); g.fill(); g.stroke();     // top
  g.fillStyle = '#6a4e31'; g.beginPath(); g.rect(CX0, CFRONT, CX1 - CX0, CBOT - CFRONT); g.fill(); g.stroke();                                                                    // front
  g.strokeStyle = alpha(INK, 0.55); g.lineWidth = 2.5; for (const y of [CFRONT + 30, CFRONT + 60]) { g.beginPath(); g.moveTo(CX0, y); g.lineTo(CX1, y); g.stroke(); }
  g.fillStyle = '#58402a'; g.strokeStyle = INK; g.lineWidth = 3; for (const x of [CX0 + 10, (CX0 + CX1) / 2 - 14, CX1 - 38]) { g.beginPath(); g.rect(x, CFRONT, 28, CBOT - CFRONT); g.fill(); g.stroke(); }
  g.strokeStyle = alpha(INK, 0.3); g.lineWidth = 2; for (const x of [CX0 + 180, CX0 + 360]) { g.beginPath(); g.moveTo(x + 8, CTOP + 2); g.lineTo(x, CFRONT - 2); g.stroke(); }
  g.strokeStyle = alpha('#ffe6b0', 0.25); g.lineWidth = 2; g.beginPath(); g.moveTo(CX0 + 4, CFRONT + 3); g.lineTo(CX1 - 4, CFRONT + 3); g.stroke(); }
// stripy sock. Origin = middle of the cuff; the tube hangs down, toe to the left. inK = how far a tin has gone in (0..1).
function sock(g, x, y, s, rot, inK = 0) { const b = lerp(15, 21, clamp(inK)), L = 84;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const P = () => { g.beginPath(); g.moveTo(-16, 0); g.lineTo(16, 0); g.lineTo(b, 20); g.lineTo(b, L - 16); g.quadraticCurveTo(b, L, b - 14, L); g.lineTo(-b - 18, L); g.quadraticCurveTo(-b - 34, L - 2, -b - 30, L - 16); g.quadraticCurveTo(-b - 26, L - 26, -b, L - 30); g.lineTo(-b, 20); g.closePath(); };
  g.save(); P(); g.clip(); g.fillStyle = '#e9dcbd'; g.fillRect(-70, -4, 140, L + 10); g.fillStyle = '#b8433a'; for (let yy = 16; yy < L - 22; yy += 17) g.fillRect(-70, yy, 140, 8);
  g.fillStyle = '#b8433a'; g.beginPath(); g.ellipse(-b - 26, L - 8, 15, 16, 0, 0, 7); g.fill(); g.fillStyle = '#8f3028'; g.fillRect(-70, -4, 140, 12); g.restore();
  g.strokeStyle = INK; g.lineWidth = 3.2; g.lineJoin = 'round'; P(); g.stroke();
  if (inK > 0.6) { g.strokeStyle = alpha(INK, 0.3 * clamp((inK - 0.6) * 4)); g.lineWidth = 2; g.beginPath(); g.moveTo(-b + 4, 26); g.lineTo(b - 4, 26); g.moveTo(-b + 4, L - 12); g.lineTo(b - 4, L - 12); g.stroke(); }
  g.restore(); }
const sockLying = (g, x, flop = 0) => sock(g, x, ROW - 21, 0.92, Math.PI / 2 + flop, 1);
// the go-bag. Origin = bottom centre. part: 'back' (inside + raised flap), 'front' (body), or both when not open.
function bag(g, x, y, s, rot = 0, o = {}) { const { open = false, part } = o, sq = o.squash || 0;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * (1 + 0.05 * sq), s * (1 - 0.06 * sq)); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK;
  if (open && part !== 'front') { g.fillStyle = '#3f5878'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-38, -86); g.quadraticCurveTo(-44, -128, -8, -132); g.lineTo(26, -130); g.quadraticCurveTo(46, -122, 38, -86); g.closePath(); g.fill(); g.stroke();   // flap thrown back
    g.fillStyle = '#17150f'; g.beginPath(); g.ellipse(0, -86, 40, 13, 0, 0, 7); g.fill(); g.stroke(); }
  if (part !== 'back') {
    g.lineWidth = 3.5; g.fillStyle = '#5a7fa8'; g.beginPath();
    if (open) { g.moveTo(-40, -86); g.quadraticCurveTo(0, -70, 40, -86); g.lineTo(46, -16); g.quadraticCurveTo(46, 0, 30, 0); g.lineTo(-30, 0); g.quadraticCurveTo(-46, 0, -46, -16); g.closePath(); }
    else g.roundRect(-46, -92, 92, 92, [26, 26, 14, 14]);
    g.fill(); g.stroke();
    if (!open) { g.fillStyle = '#486a92'; g.beginPath(); g.moveTo(-45, -70); g.quadraticCurveTo(-44, -93, -20, -93); g.lineTo(20, -93); g.quadraticCurveTo(44, -93, 45, -70); g.quadraticCurveTo(0, -46, -45, -70); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#c9a14a'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(-7, -64, 14, 13, 2); g.fill(); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(-12, -100); g.quadraticCurveTo(0, -112, 12, -100); g.stroke(); }
    g.fillStyle = '#486a92'; g.lineWidth = 3; g.beginPath(); g.roundRect(-30, -44, 60, 34, 8); g.fill(); g.stroke();
    g.strokeStyle = alpha(INK, 0.5); g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(-24, -34); g.lineTo(24, -34); g.stroke(); g.setLineDash([]);
    g.strokeStyle = alpha('#ffffff', 0.22); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-38, -78); g.lineTo(-38, -14); g.stroke(); }
  g.restore(); }
// paint the tins out of the background (shelf row + the stack by the sofa): the food is almost gone
function cover(g) { g.fillStyle = '#17140f'; g.fillRect(1379, 298, 165, 108); g.fillStyle = alpha('#2b241a', 0.6); g.fillRect(1379, 298, 165, 14); g.fillStyle = alpha('#000', 0.35); g.fillRect(1379, 298, 12, 108);
  const gr = g.createLinearGradient(1195, 0, 1345, 0); gr.addColorStop(0, '#404135'); gr.addColorStop(0.75, '#3d3e33'); gr.addColorStop(1, '#2c2d25'); g.fillStyle = gr; g.fillRect(1196, 466, 150, 143);
  g.fillStyle = alpha('#1c1a14', 0.5); g.fillRect(1196, 600, 150, 9); }

// ---------- signal waveform (screen space): jagged static, or a clean speaking voice ----------
function wave(g, x, y, w, h, t, speech, col, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.lineJoin = 'round'; g.lineCap = 'round'; const n = speech ? 90 : 56; g.beginPath();
  for (let i = 0; i <= n; i++) { const u = i / n, env = Math.sin(Math.PI * u) ** 0.5, fr = Math.floor(t * 20); let v;
    if (!speech) v = (hash(i * 13 + fr * 977) - 0.5) * 2 * (0.4 + 0.6 * hash(i * 7 + fr * 31));
    else v = Math.sin(u * 34 - t * 10) * (0.18 + 0.82 * Math.abs(Math.sin(u * 5.5 + t * 3.3))) * (0.45 + 0.55 * Math.abs(Math.sin(t * 6.1 + u * 1.7)));
    const px = x + u * w, py = y + v * h * env; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.strokeStyle = alpha('#0b0d10', 0.75); g.lineWidth = 13; g.stroke(); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); g.restore(); }

// ---------- the broadcast caption: white type on a dark band, with a speaker icon; typed on as it is spoken ----------
const BC = [[22.42, 24.3, [['This is an emergency broadcast.', '#f2f4f6']]], [24.62, 27.35, [['An evacuation point is operating', '#f2f4f6'], ['at the edge of the city.', '#f2f4f6', 1]]], [27.78, 29.75, [['Evacuations end on ', '#f2f4f6'], ['DAY 30', '#ff4a3a'], ['.', '#f2f4f6']]]];
const HI30 = 29.85;
function band(g, t) { if (t < 22.3) return; const k = so(t, 22.3, 22.6), bh = 214, y0 = H - 250 + (1 - k) * 270;
  g.save(); g.fillStyle = alpha('#08090c', 0.9); g.fillRect(0, y0, W, bh); g.fillStyle = '#e8ebef'; g.fillRect(0, y0, W, 3); g.fillRect(0, y0 + bh - 3, W, 3);
  // speaker icon
  const sx = 110, sy = y0 + bh / 2 + 6; g.fillStyle = '#f2f4f6'; g.beginPath(); g.moveTo(sx - 30, sy - 13); g.lineTo(sx - 12, sy - 13); g.lineTo(sx + 10, sy - 32); g.lineTo(sx + 10, sy + 32); g.lineTo(sx - 12, sy + 13); g.lineTo(sx - 30, sy + 13); g.closePath(); g.fill();
  g.strokeStyle = '#f2f4f6'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - i * 1.1)); g.beginPath(); g.arc(sx + 12, sy, 16 + i * 14, -0.7, 0.7); g.stroke(); } g.globalAlpha = 1;
  g.font = '700 34px monospace'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ff4a3a'; if (Math.sin(t * 6) > -0.3) { g.beginPath(); g.arc(214, y0 + 42, 9, 0, 7); g.fill(); } g.fillText('EMERGENCY BROADCAST', 236, y0 + 44);
  let cur = BC[0]; for (const b of BC) if (t >= b[0]) cur = b; const [t0, t1, parts] = cur, total = parts.reduce((s, p) => s + p[0].length, 0);
  const two = parts.some((p) => p[2]); let n = Math.floor(total * clamp((t - t0) / (t1 - t0))), x = 206, ty = y0 + (two ? 100 : 132); g.font = '700 58px monospace';
  for (const [str, col, nl] of parts) { if (nl) { if (n <= 0) break; x = 206; ty += 66; } const sh = str.slice(0, Math.max(0, n)); n -= str.length; if (!sh) break; const w = g.measureText(sh).width, hot = col !== '#f2f4f6' && t > HI30;
    if (hot) { const p = 1 + 0.35 * Math.exp(-(t - HI30) * 9) + settle(t, HI30, 0.08, 16, 6), fw = g.measureText(str).width; g.save(); g.translate(x + fw / 2, ty); g.scale(p, p); g.fillStyle = '#c8262e'; g.beginPath(); g.roundRect(-fw / 2 - 9, -38, fw + 18, 76, 8); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(str, 0, 3); g.restore(); g.textAlign = 'left'; }
    else { g.fillStyle = col; g.fillText(sh, x, ty + 3); }
    x += w; }
  if (t < t1 + 0.1 && Math.sin(t * 14) > 0) { g.fillStyle = '#f2f4f6'; g.fillRect(x + 5, ty - 26, 24, 52); }
  g.restore(); }

// ---------- Vini, kneeling behind the crate ----------
// act(t) -> { lean, hipX, crouch, turn, headTilt, energy, bp, ba } scalars only (it is sampled many times for the lags)
function kneel(g, t, A, act, o) { const a = act(t), leanF = (tt) => act(tt).lean || 0;
  const drive = (tt) => { const b = act(tt); return (b.hipX || 0) * VS - (b.lean || 0) * 4 + (b.turn || 0) * 30; };
  const lag = { hairLag: clamp(-follow(drive, t, { freq: 3.4, damp: 0.6 }) * 0.9, -2.5, 2.5), packLag: clamp(-follow(drive, t, { freq: 1.8, damp: 0.38 }) * 2.8, -9, 9) };
  return drawVini(g, A.vini, withAlive({ x: VX, y: VY, s: VS, t, shadow: false, crouch: KNEEL + (a.crouch || 0), turn: a.turn || 0, lean: a.lean || 0, hipX: a.hipX || 0, squash: a.squash || 0, shake: a.shake || 0,
    headTilt: (a.headTilt || 0) + overlap(leanF, t, 0.09, 0.7), breath: breathe(t, a.bp ?? 2.8, a.ba ?? 0.6), ...lag, ...o }, t, { energy: a.energy ?? 0.7, seed: 24 })); }
// what stands on the crate (drawn after Vini, so the crate hides his legs)
function stage(g, t, o = {}) { crate(g); candle(g, CANDLE[0], CANDLE[1], t); shrine(g);
  if (o.tins !== false) TINX.forEach((x, i) => tinAt(g, x, ROW - (o.hop?.[i] || 0), TS, 0, { color: TCOL[i] }));
  if (o.tin4 === 'row') special(g, T4X, ROW - (o.hop?.[3] || 0), TS, 0, 0, t);
  if (o.radio !== false) radio(g, RAD[0], RAD[1], RS, o.on || 0, t);
  if (o.tin4 === 'shrine') special(g, SHR[0], SHR[1], TS, 0, o.tagK ?? 1, t);
  for (let i = 0; i < (o.socks || 0); i++) sockLying(g, 772 + i * 52, i === 1 ? -0.05 : 0.04);
  if (o.bag) bag(g, BAGF[0], BAGF[1], 1.25, 0.03); }
function room(g, t, A, view, shake, body) { const c = camBegin(g, A.bg.barricade, view, shake || [0, 0]); cover(g); body(c); camEnd(g);
  const [lx, ly] = toScreen(c, CANDLE[0] + 60, CANDLE[1] - 60), f = 1 + 0.04 * Math.sin(t * 11) + 0.03 * Math.sin(t * 23.7);
  nightGrade(g, NIGHT, [[lx, ly, 620 * c.z * f, '#ffab55', 0.4], [lx - 60 * c.z, ly + 30 * c.z, 170 * c.z, '#ffd9a0', 0.22]]); return c; }
const hud = (g, t) => dayCounter(g, 24, t, 0.5);

// ---------- A: wide — day 24, the food is almost gone ----------
function shA(g, t, A) {
  const act = (tt) => ({ lean: 5 - 2.5 * bump(tt, 1.0, 2.2) + move(tt, 0, -5, 2.35, { feel: 'heavy' }), headTilt: 7 - 3 * bump(tt, 1.0, 2.2) - 6 * sm(tt, 2.3, 2.7), crouch: 5 - 4 * bump(tt, 1.0, 1.7) + 4 * bump(tt, 1.7, 2.5),
    turn: track(tt, [[2.3, 0.12], [2.65, 0.5]]), energy: 0.5, bp: 3.4, ba: 0.9 });
  const wide = { z: lerp(1.1, 1.26, sm(t, 0, 4.4)), x: lerp(990, 960, sm(t, 0, 4.4)), y: lerp(640, 700, sm(t, 0, 4.4)) };
  const c = room(g, t, A, punches(t, wide, [[2.5, 1.15, { z: 1.85, x: 1290, y: 520 }, 0.4]]), null, () => {
    kneel(g, t, A, act, { expr: exprTrack(t, [[0, 'exhausted'], [2.6, 'worried']]), look: t < 2.25 ? [-0.35, 0.6] : [lerp(-0.35, 0.95, so(t, 2.25, 2.37)), -0.35], arms: [armSpring(t, [[0, RL]]), armSpring(t, [[0, RR], [1.2, HR(915, 842, 30)], [2.5, RR]], { feel: 'soft' })] });
    stage(g, t, { tin4: 'row' }); });
  const [sx, sy] = toScreen(c, 1462, 352), ke = pop(t, 2.85) * (1 - sm(t, 4.0, 4.25));
  if (ke > 0) { note(g, 'empty.', sx - 250, sy - 110, { size: 84, k: ke }); arrowTo(g, sx - 190, sy - 70, sx - 40, sy - 5, so(t, 2.95, 3.3) * ke); }
  note(g, '(stomach: grrrrl)', W * 0.27, H * 0.66, { size: 46, k: pop(t, 1.3) * (1 - sm(t, 2.25, 2.5)), color: '#f0e6d0', glow: false, rot: 0.04 });
  hud(g, t); vignette(g, 0.45); }

// ---------- B: close on the crate — one, two, three, four… and one has no label ----------
const CNT = [4.75, 5.05, 5.35, 5.65], GRAB = 7.62;
function shB(g, t, A) {
  const act = (tt) => ({ lean: 4 + 3 * sm(tt, 7.2, 7.6), headTilt: 5, crouch: 4 + 5 * bump(tt, 7.3, 7.9), turn: 0.1, energy: 0.4 });
  const hop = CNT.map((c0) => 13 * bump(t, c0, c0 + 0.22) + (t > c0 + 0.22 ? -settle(t, c0 + 0.22, 3, 22, 9) : 0));
  const base = { z: lerp(2.2, 2.45, sm(t, 4.3, 8.1)), x: lerp(775, 800, sm(t, 4.3, 8.1)), y: 845 };
  const c = room(g, t, A, punches(t, base, [[6.35, 9, { z: 3.6, x: 850, y: 905 }]]), null, () => {
    const held = t >= GRAB; let hp = null;
    kneel(g, t, A, act, { expr: 'exhausted', look: [-0.5, 0.8], arms: [armSpring(t, [[0, RL], [7.3, HL(861, 868, 40)], [GRAB + 0.1, HL(866, 830, 40)]], { feel: 'soft' }), armSpring(t, [[0, RR]])],
      props: { left: (g2, h) => { hp = h; } } });
    stage(g, t, { tin4: held ? null : 'row', hop });
    if (held && hp) special(g, lerp(T4X, hp[0] + 2, sm(t, GRAB, GRAB + 0.1)), Math.min(ROW, hp[1] + 12 + 22 * TS), TS, -0.06 * sm(t, GRAB, GRAB + 0.2), 0, t); });
  CNT.forEach((c0, i) => { const [x, y] = toScreen(c, i < 3 ? TINX[i] : T4X, ROW - 58 * TS), k = pop(t, c0, 0.22) * (1 - sm(t, 6.25, 6.5)); if (k > 0) note(g, String(i + 1), x, y - 26, { size: i === 3 ? 96 : 80, k, rot: [-0.08, 0.05, -0.03, 0.07][i] }); });
  const [x4, y4] = toScreen(c, T4X, ROW - 30), kn = pop(t, 6.75) * (1 - sm(t, 7.45, 7.65));
  if (kn > 0) { note(g, 'no label', x4 + 330, y4 - 190, { size: 92, k: kn, rot: 0.04 }); arrowTo(g, x4 + 250, y4 - 140, x4 + 70, y4 - 30, so(t, 6.85, 7.2) * kn, RED, -30); }
  hud(g, t); vignette(g, 0.42); }

// ---------- C: peaches? dog food? — shake, sniff, set it apart for a special occasion ----------
const SHAKE = [9.75, 10.5], SNIFF = 10.55, PASS = 11.15, SETD = 11.72;
function shC(g, t, A) {
  const sh = bump(t, SHAKE[0], SHAKE[1]) > 0 ? Math.sin((t - SHAKE[0]) * 38) * sm(t, SHAKE[0], SHAKE[0] + 0.12) * (1 - sm(t, SHAKE[1] - 0.12, SHAKE[1])) : 0;
  const act = (tt) => ({ lean: 2 + move(tt, 0, 5, SHAKE[0] - 0.15, { feel: 'heavy' }) + move(tt, 0, -5, SNIFF, { feel: 'heavy' }) + move(tt, 0, -7, PASS + 0.1, { feel: 'heavy', windUp: 0.05 }) + move(tt, 0, 5, SETD + 0.25, { feel: 'heavy' }),
    headTilt: move(tt, 3, 12, SHAKE[0] - 0.1) + move(tt, 0, -12, SNIFF - 0.05) + move(tt, 0, -5, PASS + 0.2), crouch: 6 * sm(tt, PASS + 0.1, SETD) - 4 * sm(tt, SETD + 0.2, SETD + 0.6),
    turn: track(tt, [[PASS, 0.08], [PASS + 0.35, 0.3]]), energy: 0.5 });
  const base = { z: lerp(2.2, 2.3, sm(t, 8.06, 11.8)), x: 900, y: lerp(770, 765, sm(t, 8.06, 11.8)) };
  const c = room(g, t, A, punches(t, base, [[SETD + 0.15, 9, { z: 2.9, x: 950, y: 806 }]]), null, () => {
    const inL = t < PASS + 0.12, inR = !inL && t < SETD;
    const armL = armSpring(t, [[0, HL(898, 808, 40)], [SHAKE[0] - 0.15, HL(826, 696, 12)], [SNIFF - 0.05, HL(897, 730, 44)], [PASS, HL(898, 800, 40)], [PASS + 0.3, HL(850, 850, 30)], [SETD + 0.1, RL]], { feel: 'snappy', windUp: 0.05 });
    const armR = armSpring(t, [[0, RR], [PASS - 0.12, HR(912, 806, 40)], [PASS + 0.22, HR(SHR[0] - 2, SHR[1] - 36, 44)], [SETD + 0.25, HR(990, 826, 30)], [SETD + 0.7, RR]], { feel: 'soft', delay: 0.04 });
    armL[1][1] += sh * 4; armL[1][0] += sh * 1.5;
    const tinIn = (rot) => (g2, h) => special(g2, h[0] + 2, h[1] + 12 + 22 * TS, TS, rot, 0, t);
    kneel(g, t, A, act, { expr: exprTrack(t, [[0, 'exhausted'], [8.3, 'worried'], [SHAKE[0], 'neutral'], [SNIFF + 0.25, 'worried'], [PASS + 0.1, 'determined'], [SETD + 0.3, 'happy']]),
      look: t < 8.5 ? [0, 0.9] : t < 9.3 ? [lerp(0, -0.8, so(t, 8.5, 8.6)), 0.6] : t < SHAKE[0] ? [lerp(-0.8, 0.8, so(t, 9.3, 9.42)), 0.6] : t < SNIFF ? [0.7, -0.5] : t < PASS ? [0, 0.7] : [0.8, 0.8],
      arms: [armL, armR], props: { left: inL ? tinIn(-0.06 + sh * 0.22) : null, right: inR ? tinIn(0.03) : null } });
    stage(g, t, { tin4: t >= SETD ? 'shrine' : null, tagK: pop(t, SETD + 0.2, 0.3) }); });
  const [tx, ty] = toScreen(c, 900, 800), k1 = pop(t, 8.55) * (1 - sm(t, 9.6, 9.8)), k2 = pop(t, 9.35) * (1 - sm(t, 9.6, 9.8));
  if (k1 > 0) { note(g, 'peaches?', tx - 400, ty - 30, { size: 84, k: k1, rot: -0.06 }); arrowTo(g, tx - 240, ty - 20, tx - 70, ty - 6, so(t, 8.6, 8.85) * k1, RED, 16); }
  if (k2 > 0) { note(g, 'dog food?', tx + 420, ty - 30, { size: 84, k: k2, rot: 0.05 }); arrowTo(g, tx + 240, ty - 20, tx + 70, ty - 6, so(t, 9.4, 9.65) * k2, RED, -16); }
  if (sh !== 0 || (t > SHAKE[0] && t < SHAKE[1])) note(g, 'slosh?', tx - 430 + sh * 5, ty - 300, { size: 62, k: pop(t, SHAKE[0] + 0.1) * (1 - sm(t, SHAKE[1] - 0.1, SHAKE[1] + 0.05)), color: '#f0e6d0', glow: false, rot: -0.1 });
  note(g, '*sniff*', tx + 330, ty - 250, { size: 58, k: pop(t, SNIFF + 0.15) * (1 - sm(t, PASS - 0.1, PASS + 0.05)), color: '#f0e6d0', glow: false, rot: 0.06 });
  hud(g, t); vignette(g, 0.42); }

// ---------- D: the battery radio (from Day 3) ----------
const CLICK = 13.9;
function shD(g, t, A) {
  const act = (tt) => ({ lean: move(tt, 2, -16, 13.3, { feel: 'heavy' }) + move(tt, 0, 13, CLICK + 0.35, { feel: 'heavy' }), hipX: move(tt, 0, 30, 13.3, { feel: 'heavy' }) + move(tt, 0, -24, CLICK + 0.35, { feel: 'heavy' }),
    headTilt: -4 * sm(tt, 13.2, 13.5) + 8 * sm(tt, CLICK + 0.5, CLICK + 0.9), crouch: 5 * bump(tt, 13.3, CLICK + 0.6), turn: track(tt, [[12.9, 0.3], [13.25, 0.55]]), energy: 0.6 });
  const base = { z: lerp(1.7, 1.85, sm(t, 12.9, 17.2)), x: lerp(975, 1000, sm(t, 12.9, 17.2)), y: 775 };
  const on = clamp((t - CLICK) / 0.08);
  const c = room(g, t, A, punches(t, base, [[15.05, 1.45, { z: 3.6, x: 1060, y: 900 }, 0.4]]), camShake(t, 1.5, CLICK, 0.2), () => {
    kneel(g, t, A, act, { expr: exprTrack(t, [[0, 'neutral'], [13.2, 'determined'], [CLICK + 0.5, 'worried'], [15.6, 'exhausted']]), look: [0.85, 0.75],
      arms: [armSpring(t, [[0, RL]]), armSpring(t, [[0, RR], [13.35, HR(RAD[0] - 16, RAD[1] - 92, 40)], [CLICK - 0.12, HR(RAD[0] - 17, RAD[1] - 62, 40)], [CLICK + 0.3, HR(1000, 800, 30)], [CLICK + 1.0, RR]], { delay: 0.05 })] });
    stage(g, t, { tin4: 'shrine', on }); });
  const [rx, ry] = toScreen(c, RAD[0], RAD[1] - 60);
  note(g, 'click', rx - 70, ry - 150, { size: 56, k: pop(t, CLICK) * (1 - sm(t, CLICK + 0.6, CLICK + 0.85)), color: '#f0e6d0', glow: false, rot: -0.1 });
  if (t > CLICK + 0.15) wave(g, rx + 60 * c.z, ry - 30 * c.z, 150 * c.z, 20 * c.z, t, false, '#d8dce0', so(t, CLICK + 0.15, CLICK + 0.4));
  const kd = pop(t, 15.25) * (1 - sm(t, 16.75, 17.0)); if (kd > 0) { note(g, '(from Day 3)', rx - 330, ry - 150, { size: 72, k: kd, rot: -0.05 }); arrowTo(g, rx - 280, ry - 100, rx - 150, ry - 10, so(t, 15.35, 15.7) * kd, RED, -20); }
  hud(g, t); vignette(g, 0.42); }

// ---------- E: three weeks of static… tonight, a voice ----------
const VOICE = 21.25, SNATCH = 21.72;
const BORED = { mouth: 'mouth', brow: [5, -6], eyeScale: 0.84 };
function shE(g, t, A) {
  const jolt = startle(t - VOICE);
  const act = (tt) => ({ lean: 7 - 8 * startle(tt - VOICE) + move(tt, 0, -20, SNATCH - 0.14, { feel: 'heavy', windUp: 0.05 }) + move(tt, 0, 14, SNATCH + 0.3, { feel: 'heavy' }), hipX: -3 + move(tt, 0, 30, SNATCH - 0.14, { feel: 'heavy' }) + move(tt, 0, -27, SNATCH + 0.3, { feel: 'heavy' }),
    headTilt: 9 * (1 - sm(tt, VOICE - 0.02, VOICE + 0.1)) - 5 * startle(tt - VOICE), crouch: 7 * (1 - sm(tt, VOICE, VOICE + 0.12)) - 5 * startle(tt - VOICE), squash: startle(tt - VOICE), turn: track(tt, [[VOICE, 0.2], [VOICE + 0.25, 0.5]]),
    energy: tt < VOICE ? 0.5 : 0.3 + 0.7 * sm(tt, VOICE + 0.6, VOICE + 1.2), bp: tt < VOICE ? 3.6 : 1.0, ba: 0.8 });
  const base = { z: lerp(1.55, 1.68, sm(t, 17.18, 20.4)) + 0.2 * sm(t, 20.42, 21.2), x: lerp(985, 975, sm(t, 17.18, 20.4)) + 35 * sm(t, 20.42, 21.2), y: 790 };
  const held = t >= SNATCH + 0.1;
  const c = room(g, t, A, punches(t, base, [[18.95, 0.85, { z: 2.3, x: 1010, y: 735 }, 0.4], [VOICE + 0.03, 0.22, { z: 2.3, x: 950, y: 740 }, 0.35]]), camShake(t, 4, VOICE, 0.3), () => {
    const drum = t < VOICE ? Math.max(0, Math.sin(t * 9.5)) ** 6 * -5 : 0;
    const armL = armSpring(t, [[0, HL(803, 726, 30)], [VOICE, 'out'], [VOICE + 0.3, HL(850, 800, 30)], [SNATCH + 0.32, HL(858, 800, 30)]], { feel: 'snappy', windUp: 0.04 });
    const armR = armSpring(t, [[0, RR], [VOICE + 0.02, 'out'], [SNATCH - 0.12, HR(RAD[0] + 4, RAD[1] - 76, 40)], [SNATCH + 0.16, HR(942, 800, 30)]], { feel: 'snappy', delay: 0.04, windUp: 0.04 });
    armR[1][1] += drum;
    kneel(g, t, A, act, { expr: t < VOICE ? BORED : exprTrack(t, [[VOICE - 1, 'neutral'], [VOICE, 'shock'], [SNATCH + 0.25, 'happy']]),
      look: t < 19.0 ? [0.5, 0.5] : t < 19.9 ? [lerp(0.5, 0.2, so(t, 19.0, 19.1)), lerp(0.5, -1, so(t, 19.0, 19.1))] : t < VOICE ? [0.3, 0.6] : [lerp(0.3, 0.9, so(t, VOICE, VOICE + 0.08)), 0.7],
      arms: [armL, armR], props: { right: held ? (g2, h) => radio(g2, h[0] - 42, h[1] + 25, RS, 1, t, -0.04) : null } });
    stage(g, t, { tin4: 'shrine', on: 1, radio: !held }); });
  const [rx, ry] = held ? toScreen(c, 900, 760) : toScreen(c, RAD[0], RAD[1] - 60), sp = t >= VOICE;
  if (!sp) { wave(g, rx + 50 * c.z, ry - 60 * c.z, 250 * c.z, 44 * c.z, t, false, '#d8dce0');
    note(g, 'kssshhhhh…', rx + 190 * c.z + Math.sin(t * 31) * 3, ry - 140 * c.z + Math.cos(t * 27) * 2, { size: 64, k: pop(t, 17.5), color: '#e6e9ee', glow: false, rot: 0.04 });
    note(g, '3 weeks of this', W * 0.24, H * 0.3, { size: 70, k: pop(t, 18.2) * (1 - sm(t, 20.3, 20.55)), rot: -0.04 }); }
  else { const fl = 1 - so(t, VOICE, VOICE + 0.35); wave(g, rx + (held ? 105 : 50) * c.z, ry - (held ? -5 : 60) * c.z, 250 * c.z, (44 + 30 * fl) * c.z, t, true, '#ffd66a');
    note(g, 'a VOICE?!', W * 0.2, H * 0.27, { size: 100, k: pop(t, VOICE + 0.12), rot: -0.05 }); fade(g, 0.35 * fl, '#fff6d8'); }
  hud(g, t); vignette(g, 0.42); }

// ---------- F: the broadcast, part 1 and 3 — Vini with the radio in both hands ----------
function listen(g, t, A, view, o = {}) {
  const act = (tt) => ({ lean: -2 + 4 * sm(tt, 22.5, 23.4) + move(tt, 0, -6, HI30, { feel: 'heavy' }), headTilt: 8 * sm(tt, 22.5, 23.2) - move(tt, 0, 8, HI30), crouch: 2 + 5 * startle(tt - HI30) + (o.gulp ? 5 * bump(tt, o.gulp, o.gulp + 0.3) : 0),
    turn: o.turn ?? 0.28, squash: startle(tt - HI30), shake: o.gulp ? 0.35 : tt > HI30 ? 0.2 : 0, energy: o.gulp ? 0.3 : 0.8, bp: 1.5, ba: 0.7 });
  return room(g, t, A, view, camShake(t, 3, HI30, 0.3), () => {
    kneel(g, t, A, act, { expr: o.expr, look: o.look ?? [0.25, 0.85], arms: [armSpring(t, [[0, HL(858, 800, 30)]]), armSpring(t, [[0, HR(942, 800, 30)]])],
      props: { right: (g2, h) => radio(g2, h[0] - 42, h[1] + 25, RS, 1, t, -0.04 + Math.sin(t * 40) * 0.006) } });
    stage(g, t, { tin4: 'shrine', radio: false }); }); }
function shF1(g, t, A) { const c = listen(g, t, A, { z: lerp(2.15, 2.35, sm(t, 22.42, 24.7)), x: lerp(915, 900, sm(t, 22.42, 24.7)), y: 745 }, { expr: exprTrack(t, [[0, 'happy'], [23.3, 'shock'], [23.9, 'happy']]) });
  const [rx, ry] = toScreen(c, 900, 790); wave(g, rx + 230, ry - 60, 520, 70, t, true, '#ffd66a');
  hud(g, t); vignette(g, 0.45); band(g, t); }
function shF3(g, t, A) { const base = { z: lerp(1.8, 1.92, sm(t, 27.78, 30.6)), x: lerp(820, 850, sm(t, 27.78, 30.6)), y: 740 };
  listen(g, t, A, punches(t, base, [[HI30 + 0.02, 9, { z: 2.3, x: 880, y: 730 }]]), { turn: -0.3, look: t < HI30 ? [-0.25, 0.85] : [lerp(-0.25, 0, so(t, HI30, HI30 + 0.1)), lerp(0.85, 0, so(t, HI30, HI30 + 0.1))], expr: exprTrack(t, [[0, 'happy'], [28.6, 'neutral'], [HI30, 'shock'], [HI30 + 0.5, 'worried']]) });
  hud(g, t); vignette(g, 0.45);
  const kt = pop(t, HI30 + 0.3); if (kt > 0) { note(g, 'today', 470, 150, { size: 70, k: kt, rot: -0.05 }); arrowTo(g, 390, 140, 300, 110, so(t, HI30 + 0.35, HI30 + 0.6), RED, -14); }
  band(g, t); }
// ---------- F2: radio close-up insert ----------
function shF2(g, t) { const k = sm(t, 24.62, 27.8), s = lerp(5.6, 6.3, k);
  g.fillStyle = '#0b0c10'; g.fillRect(0, 0, W, H); g.fillStyle = radGrad(g, 700, 520, 0, 900, [alpha('#ffab55', 0.3), alpha('#ffab55', 0)]); g.fillRect(0, 0, W, H);
  g.fillStyle = '#3a2c1c'; g.fillRect(0, 690, W, 400); g.fillStyle = alpha('#000', 0.35); g.beginPath(); g.ellipse(660, 700, 330, 26, 0, 0, 7); g.fill();
  const vib = Math.sin(t * 46) * 2.2 * (0.4 + 0.6 * Math.abs(Math.sin(t * 6.1)));
  radio(g, lerp(640, 610, k), 698 + vib * 0.4, s, 1, t, -0.035 + vib * 0.0012);
  g.save(); g.strokeStyle = '#ffd66a'; g.lineCap = 'round'; g.lineWidth = 9; for (let i = 0; i < 4; i++) { const ph = (t * 1.6 + i / 4) % 1; g.globalAlpha = (1 - ph) * 0.8; g.beginPath(); g.arc(lerp(640, 610, k) - 18 * s, 698 - 30 * s, (30 + ph * 120), Math.PI - 0.6, Math.PI + 0.6); g.stroke(); } g.restore();
  wave(g, 1010, 380, 760, 150, t, true, '#ffd66a');
  note(g, 'the edge of the city', 1390, 600, { size: 66, k: pop(t, 26.25), rot: -0.03 });
  vignette(g, 0.55); band(g, t); }

// ---------- G: six days (calendar strip) ----------
function shG(g, t) { g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); const z = 1 + 0.04 * sm(t, 30.6, 31.8); g.scale(z, z); g.rotate(-0.015 + settle(t, 30.66, 0.012, 13, 6)); g.translate(-W / 2, -H / 2);
  g.fillStyle = alpha('#000', 0.5); g.fillRect(134, 418, 1680, 330); g.fillStyle = '#e9e2cf'; g.fillRect(120, 400, 1680, 330);
  for (let i = 0; i < 7; i++) { const x = 160 + i * 230, d = 24 + i, last = i === 6, hopT = 30.66 + i * 0.07, hop = i ? 16 * bump(t, hopT, hopT + 0.2) : 0;
    g.save(); g.translate(x + 105, 565 - hop); g.fillStyle = i === 0 ? '#d9d0b8' : '#f6f0df'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(-98, -110, 196, 220, 10); g.fill(); g.stroke();
    g.fillStyle = last ? RED : '#3a3630'; g.fillRect(-98, -110, 196, 48); g.strokeRect(-98, -110, 196, 48);
    g.font = '700 30px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f6f0df'; g.fillText(i === 0 ? 'TODAY' : last ? 'LAST DAY' : 'DAY', 0, -85);
    g.font = '400 110px "Permanent Marker", sans-serif'; g.fillStyle = last ? RED : i === 0 ? '#6a6458' : INK; g.fillText(String(d), 0, 30); g.restore();
    if (i) note(g, String(i), x + 105, 400 - 46, { size: 60, k: pop(t, hopT + 0.05, 0.2), glow: false, rot: 0 }); }
  const ck = so(t, 31.1, 31.4); if (ck > 0) { g.strokeStyle = RED; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 40 * ck; i++) { const a = -1.9 + i / 40 * 6.6; g.lineTo(1645 + Math.cos(a) * 128, 570 + Math.sin(a) * 140); } g.stroke(); }
  g.restore();
  bigText(g, '6 DAYS', W / 2, 215, { size: 190, k: pop(t, 30.68, 0.25), color: '#ff4a3a' });
  note(g, 'to get out.', W / 2, 860, { size: 80, k: pop(t, 31.15), color: '#f0e6d0', glow: false });
  vignette(g, 0.5); }

// ---------- H: eleven kilometres, through streets full of them (hand-drawn map) ----------
const MX = 210, MY = 110, VXS = [190, 400, 610, 820, 1030, 1240], HYS = [690, 560, 430, 300, 150];
const ROUTE = [[190, 690], [400, 690], [400, 560], [610, 560], [610, 430], [820, 430], [1030, 430], [1030, 300], [1240, 300], [1240, 150], [1310, 150]].map(([x, y]) => [MX + x, MY + y]);
const ZMARK = (() => { const r = rng(2406), out = []; for (let i = 0; i < 30; i++) { const onV = r() < 0.5, a = Math.floor(r() * (onV ? VXS.length : HYS.length)), u = r();
  const x = onV ? VXS[a] + (r() - 0.5) * 26 : lerp(120, 1330, u), y = onV ? lerp(110, 740, u) : HYS[a] + (r() - 0.5) * 26;
  if (Math.hypot(x - 190, y - 690) < 110 || Math.hypot(x - 1310, y - 150) < 110) continue; out.push([MX + x, MY + y, r(), r()]); } return out; })();
function zmark(g, x, y, s, seed, t) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate((seed - 0.5) * 0.5 + Math.sin(t * 3 + seed * 9) * 0.08);
  g.fillStyle = '#8fa878'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 3; g.lineCap = 'round'; for (const sx of [-7, 7]) { g.beginPath(); g.moveTo(sx - 3.5, -7); g.lineTo(sx + 3.5, 0); g.moveTo(sx + 3.5, -7); g.lineTo(sx - 3.5, 0); g.stroke(); }
  g.fillStyle = INK; g.beginPath(); g.ellipse(0, 9, 5, 3.5, 0, 0, 7); g.fill(); g.restore(); }
function shH(g, t) { const k = sm(t, 31.7, 34.8), ZT = 33.45;
  g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); const z = lerp(1.0, 1.09, k); g.scale(z, z); g.rotate(lerp(-0.022, -0.008, k) + settle(t, 31.74, 0.01, 12, 6)); g.translate(-W / 2 - 20 * k, -H / 2);
  g.fillStyle = alpha('#000', 0.5); g.fillRect(MX - 54, MY - 22, 1500, 880); g.fillStyle = '#e4d9ba'; g.fillRect(MX - 70, MY - 40, 1500, 880);
  g.strokeStyle = alpha('#8a7a56', 0.35); g.lineWidth = 2; for (const fx of [MX + 430, MX + 930]) { g.beginPath(); g.moveTo(fx, MY - 40); g.lineTo(fx, MY + 840); g.stroke(); }                 // fold lines
  // the streets: pale double lines, a river, a few blocks hatched
  g.strokeStyle = '#c9bc98'; g.lineWidth = 30; g.lineCap = 'round'; for (const x of VXS) { g.beginPath(); g.moveTo(MX + x, MY + 60); g.lineTo(MX + x, MY + 770); g.stroke(); } for (const y of HYS) { g.beginPath(); g.moveTo(MX + 80, MY + y); g.lineTo(MX + 1340, MY + y); g.stroke(); }
  g.strokeStyle = alpha('#5f9ac0', 0.5); g.lineWidth = 34; g.beginPath(); g.moveTo(MX - 60, MY + 240); g.bezierCurveTo(MX + 300, MY + 180, MX + 500, MY + 420, MX + 900, MY + 520); g.bezierCurveTo(MX + 1100, MY + 570, MX + 1250, MY + 640, MX + 1425, MY + 620); g.stroke();
  g.strokeStyle = '#c9bc98'; g.lineWidth = 30; for (const [x, y, v] of [[400, 300, 1], [610, 430, 0], [1030, 560, 1]]) { g.beginPath(); if (v) { g.moveTo(MX + x, MY + y - 70); g.lineTo(MX + x, MY + y + 70); } else { g.moveTo(MX + x - 80, MY + y); g.lineTo(MX + x + 80, MY + y); } g.stroke(); }   // bridges
  g.strokeStyle = alpha(INK, 0.55); g.lineWidth = 5; g.setLineDash([26, 16]); g.beginPath(); g.moveTo(MX + 1090, MY - 20); g.lineTo(MX + 1375, MY + 60); g.lineTo(MX + 1395, MY + 420); g.stroke(); g.setLineDash([]);                 // the edge of the city
  g.save(); g.translate(MX + 1352, MY + 300); g.rotate(1.52); g.font = '700 34px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.fillStyle = alpha(INK, 0.7); g.fillText('edge of the city', 0, 0); g.restore();
  // the flat
  const [fx, fy] = ROUTE[0]; g.fillStyle = '#f6f0df'; g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); g.rect(fx - 34, fy - 30, 68, 56); g.fill(); g.stroke(); g.fillStyle = '#b8433a'; g.beginPath(); g.moveTo(fx - 46, fy - 30); g.lineTo(fx, fy - 74); g.lineTo(fx + 46, fy - 30); g.closePath(); g.fill(); g.stroke(); g.fillStyle = INK; g.fillRect(fx - 9, fy - 4, 18, 30);
  writeOn(g, 'FLAT', fx - 10, fy + 70, 1, { size: 64, font: 'Permanent Marker', pen: false }); writeOn(g, '(you are here)', fx + 30, fy + 118, 1, { size: 36, pen: false });
  // the route, dashed, drawn on
  const rk = sm(t, 31.8, 33.15); g.setLineDash([30, 20]); inkPath(g, ROUTE, rk, 12, RED); g.setLineDash([]);
  // the evacuation point
  const [ex, ey] = ROUTE[ROUTE.length - 1], ek = pop(t, 33.05, 0.25); if (ek > 0) { g.save(); g.translate(ex + 30, ey); g.scale(ek, ek); g.fillStyle = '#2a8a3a'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-7, -24, 14, 48); g.fillRect(-24, -7, 48, 14); g.restore(); }
  writeOn(g, 'EVAC POINT', ex - 150, ey - 78, wk(t, 32.6, 'EVAC POINT', 26), { size: 58, font: 'Permanent Marker', color: '#1f6a2c', pen: false });
  ZMARK.forEach(([x, y, a, b], i) => { const kz = pop(t, ZT + i * 0.035 + a * 0.05, 0.2); if (kz > 0) zmark(g, x, y, kz * (0.95 + b * 0.5), a, t); });
  g.restore();
  bigText(g, '11 KM', W * 0.36, H * 0.3, { size: 170, k: pop(t, 31.95, 0.25) * (1 - sm(t, 33.3, 33.5)), color: '#ff4a3a', rot: -0.05 });
  note(g, 'full of THEM', W * 0.33, H * 0.2, { size: 104, k: pop(t, ZT + 0.5), rot: -0.04 });
  vignette(g, 0.4); }

// ---------- I: gulp ----------
function shI(g, t, A) { const G0 = 35.08;
  const c = listen(g, t, A, { z: lerp(2.55, 2.75, sm(t, 34.75, 35.9)), x: 900, y: 715 }, { gulp: G0, turn: 0.05, look: [0, 0.1], expr: exprTrack(t, [[0, 'scared'], [G0 + 0.42, 'worried']]) });
  const [hx, hy] = toScreen(c, 963, 648), dk = clamp((t - 34.85) / 0.9); g.save(); g.translate(hx, hy + dk * 70); g.globalAlpha = clamp(dk * 5) * (1 - clamp((dk - 0.8) * 5)); g.fillStyle = '#bfe2f5'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(13, 4, 0, 12); g.quadraticCurveTo(-13, 4, 0, -18); g.fill(); g.stroke(); g.restore();
  note(g, '*gulp*', W * 0.72, H * 0.42, { size: 80, k: pop(t, G0 + 0.05), color: '#f0e6d0', glow: false, rot: 0.06 });
  hud(g, t); vignette(g, 0.5); }

// ---------- J: RULE 10 (notebook page, same look as Rules 1 and 2) ----------
function penStrokes(g, strokes, k, col = INK) {
  const len = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), Ls = strokes.map(([p]) => len(p)), T = Ls.reduce((a, b) => a + b, 0);
  let u = clamp(k) * T, tip = null;
  strokes.forEach(([p, w], i) => { const f = clamp(u / Ls[i]); u -= Ls[i]; if (f <= 0) return; inkPath(g, p, f, w, col);
    if (f < 1) { let r = f * Ls[i]; for (let j = 1; j < p.length; j++) { const d = Math.hypot(p[j][0] - p[j - 1][0], p[j][1] - p[j - 1][1]); if (r <= d) { tip = [lerp(p[j - 1][0], p[j][0], r / d), lerp(p[j - 1][1], p[j][1], r / d)]; break; } r -= d; } } });
  if (tip && k < 1) pen(g, tip[0], tip[1]); }
const circ = (x, y, r, a0 = 0, a1 = 6.4, n = 22) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
function shJ(g, t) { const T0 = 35.86, land = so(t, T0 - 0.25, T0 + 0.3);
  g.fillStyle = '#0d0c0a'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.03 * (1 - land) + settle(t, T0 + 0.25, 0.005, 11, 6)); g.translate(-W / 2 + 50 * (1 - land), -H / 2 + 22 * (1 - land)); notebook(g, t);
  writeOn(g, 'RULE 10', 380, 165, wk(t, T0 + 0.04, 'RULE 10', 12), { size: 92, color: RED, font: 'Permanent Marker', rot: -0.02 });
  inkPath(g, [[262, 222], [382, 216], [502, 220]], ease.out(clamp((t - T0 - 0.62) / 0.3)), 7, RED);
  writeOn(g, 'when you finally move…', 300, 300, wk(t, 36.85, 'when you finally move…', 26), { size: 54, color: '#5a5448', align: 'left' });
  writeOn(g, 'TRAVEL LIGHT', W * 0.63, 168, wk(t, 37.95, 'TRAVEL LIGHT', 15), { size: 78, color: '#2a2622', font: 'Permanent Marker' });
  writeOn(g, '…and travel in DAYLIGHT', W * 0.63, 258, wk(t, 39.1, '…and travel in DAYLIGHT', 24), { size: 62, color: '#c06a12' });
  // doodle 1: a small, light pack (with a feather)
  const bx = 520, by = 610, bk = drawK(t, 38.2, 0.6);
  penStrokes(g, [[[[bx - 70, by + 90], [bx - 78, by - 20], [bx - 50, by - 80], [bx + 50, by - 80], [bx + 78, by - 20], [bx + 70, by + 90], [bx - 70, by + 90]], 7], [[[bx - 44, by + 60], [bx - 44, by + 10], [bx + 44, by + 10], [bx + 44, by + 60], [bx - 44, by + 60]], 5], [[[bx - 22, by - 80], [bx - 14, by - 108], [bx + 14, by - 108], [bx + 22, by - 80]], 6]], bk);
  const fk = drawK(t, 38.75, 0.4); penStrokes(g, [[[[bx + 120, by + 30], [bx + 150, by - 20], [bx + 200, by - 70]], 5], [[[bx + 140, by - 4], [bx + 132, by - 44], [bx + 166, by - 80], [bx + 204, by - 74], [bx + 196, by - 34], [bx + 164, by - 4], [bx + 140, by - 4]], 5]], fk, '#5a5448');
  writeOn(g, 'light bag', bx + 30, 800, wk(t, 38.6, 'light bag', 24), { size: 56, pen: false }); tick(g, bx + 190, 795, 30, ease.out(clamp((t - 39.0) / 0.22)));
  // doodle 2: the sun
  const sx = 1060, sy = 600, sk = drawK(t, 39.35, 0.55), rays = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return [[[sx + Math.cos(a) * 84, sy + Math.sin(a) * 84], [sx + Math.cos(a) * 122, sy + Math.sin(a) * 122]], 7]; });
  if (sk > 0.5) { g.fillStyle = alpha('#f2b53a', 0.75 * clamp((sk - 0.5) * 2)); g.beginPath(); g.arc(sx, sy, 62, 0, 7); g.fill(); }
  penStrokes(g, [[circ(sx, sy, 64), 7], ...rays], sk);
  writeOn(g, 'go in daylight', sx, 800, wk(t, 39.7, 'go in daylight', 26), { size: 56, pen: false }); tick(g, sx + 190, 795, 30, ease.out(clamp((t - 40.15) / 0.22)));
  // doodle 3: not at night
  const mx = 1520, my = 600, mk = drawK(t, 39.95, 0.4);
  penStrokes(g, [[[...circ(mx, my, 62, 1.0, 5.3, 18), ...circ(mx + 34, my, 50, 4.6, 1.7, 14).map((p) => p)], 7]], mk);
  cross(g, mx, my, 70, ease.out(clamp((t - 40.3) / 0.25)));
  writeOn(g, 'not at night', mx, 800, wk(t, 39.95, 'not at night', 30), { size: 56, pen: false });
  g.restore(); vignette(g, 0.2); }

// ---------- K: packing — water, food, torch, first aid kit ----------
const PT = [40.98, 41.72, 42.32, 42.92], PX = [390, 770, 1150, 1530], PN = ['water', 'food', 'torch', 'first aid kit'];
function item(g, i, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.strokeStyle = INK; g.lineWidth = 3.5 / Math.max(1, s / 2.4); g.lineJoin = 'round'; g.lineCap = 'round'; const lw = g.lineWidth;
  if (i === 0) { g.fillStyle = alpha('#7fc0ea', 0.95); g.beginPath(); g.moveTo(-7, -44); g.lineTo(7, -44); g.lineTo(7, -34); g.quadraticCurveTo(17, -28, 17, -16); g.lineTo(17, 34); g.quadraticCurveTo(17, 40, 11, 40); g.lineTo(-11, 40); g.quadraticCurveTo(-17, 40, -17, 34); g.lineTo(-17, -16); g.quadraticCurveTo(-17, -28, -7, -34); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#2f6fb0'; g.beginPath(); g.roundRect(-8, -50, 16, 9, 2); g.fill(); g.stroke(); g.fillStyle = alpha('#fff', 0.85); g.fillRect(-17 + lw / 2, -6, 34 - lw, 16); g.strokeStyle = alpha('#fff', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(-11, -20); g.lineTo(-11, 32); g.stroke(); }
  if (i === 1) { g.restore(); tin(g, x, y, s * 1.5, rot); return; }
  if (i === 2) { g.fillStyle = '#e0b62e'; g.beginPath(); g.roundRect(-40, -11, 54, 22, 4); g.fill(); g.stroke(); g.fillStyle = '#3a3630'; g.beginPath(); g.moveTo(14, -12); g.lineTo(34, -20); g.lineTo(34, 20); g.lineTo(14, 12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff2b8'; g.beginPath(); g.ellipse(35, 0, 5, 19, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#3a3630'; g.beginPath(); g.roundRect(-18, -15, 14, 7, 2); g.fill(); }
  if (i === 3) { g.fillStyle = '#2f8a48'; g.beginPath(); g.roundRect(-34, -24, 68, 50, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-12, -24); g.quadraticCurveTo(-12, -36, 0, -36); g.quadraticCurveTo(12, -36, 12, -24); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-5, -15, 10, 32); g.fillRect(-16, -4, 32, 10); }
  g.restore(); }
function shK(g, t, A) { const k = sm(t, 40.7, 44.0);
  g.save(); g.filter = 'blur(6px)'; g.drawImage(A.bg.barricade, 560 + 10 * k, 898, 320, 180, -30, -30, W + 60, H + 60); g.filter = 'none'; g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = NIGHT; g.fillStyle = '#3a4a78'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, 760, 760, 0, 1000, [alpha('#ffab55', 0.34), alpha('#ffab55', 0)]); g.fillRect(0, 0, W, H); g.restore();
  const BX = 960, BY = 1030, BS = 4.3, MOUTH = [BX, BY - 86 * BS];
  let sq = 0; for (const p of PT) sq += Math.max(0, settle(t, p + 0.78, 1, 16, 7)) + bump(t, p + 0.72, p + 0.86) * 0.6;
  g.fillStyle = 'rgba(10,8,6,0.45)'; g.beginPath(); g.ellipse(BX, BY + 4, 250, 30, 0, 0, 7); g.fill();
  bag(g, BX, BY, BS, 0, { open: true, part: 'back', squash: sq });
  PT.forEach((p, i) => { const kp = pop(t, p, 0.22); if (kp <= 0) return; const f = clamp((t - p - 0.42) / 0.38), e = ease.in(f) * 0.6 + f * 0.4, x0 = PX[i], y0 = 372;
    const x = lerp(x0, MOUTH[0], ease.inOut(f)), y = lerp(y0, MOUTH[1] + 150, e) - Math.sin(Math.PI * f) * 120; if (f >= 1) return;
    item(g, i, x, y, 3.0 * kp * lerp(1, 0.72, f), (i === 2 ? -0.3 : i === 0 ? 0.08 : -0.06) + f * (i % 2 ? 0.7 : -0.7) + settle(t, p, 0.2, 14, 6)); });
  bag(g, BX, BY, BS, 0, { open: true, part: 'front', squash: sq });
  PT.forEach((p, i) => { const kl = pop(t, p + 0.05, 0.22); if (kl <= 0) return; note(g, PN[i], PX[i] - 26, 180, { size: 76, k: kl, color: '#f4efe2', glow: false, rot: [-0.03, 0.02, -0.02, 0.03][i] });
    const tk = ease.out(clamp((t - p - 0.8) / 0.22)); if (tk > 0) { const wd = PN[i].length * 17; g.save(); g.lineWidth = 1; tick(g, PX[i] + wd + 24, 176, 30, tk, '#5fd06a'); g.restore(); } });
  note(g, 'nothing else.', 400, 820, { size: 64, k: pop(t, 43.55), rot: -0.05 });
  vignette(g, 0.5); }

// ---------- L: nothing that rattles ----------
const RAT = [44.25, 44.95];
function shL(g, t, A) { const env = sm(t, RAT[0], RAT[0] + 0.1) * (1 - sm(t, RAT[1] - 0.08, RAT[1])), sh = Math.sin((t - RAT[0]) * 40) * env, fr = t >= RAT[1];
  const act = (tt) => ({ lean: 3 * bump(tt, 44.0, 44.3) - 5 * startle(tt - RAT[1]), headTilt: -6 * sm(tt, RAT[1], RAT[1] + 0.1), crouch: 3 + 5 * startle(tt - RAT[1]), squash: startle(tt - RAT[1]), turn: 0.15, shake: tt > RAT[0] && tt < RAT[1] ? 0.5 : 0, energy: tt < RAT[1] ? 0.6 : 0, bp: 1.2, ba: tt < RAT[1] ? 0.7 : 0.1 });
  const base = { z: lerp(1.75, 1.85, sm(t, 44.0, 45.8)), x: 925, y: 765 };
  room(g, t, A, punches(t, base, [[RAT[1] + 0.05, 9, { z: 2.4, x: 905, y: 725 }]]), camShake(t, 2.5 * env, -1), () => {
    const aL = armSpring(t, [[0, HL(850, 800, 30)]]), aR = armSpring(t, [[0, HR(950, 800, 30)]]); aL[1][1] += sh * 7; aR[1][1] -= sh * 7; aL[1][0] += sh * 2; aR[1][0] -= sh * 2;
    kneel(g, t, A, act, { expr: !fr ? exprTrack(t, [[0, 'determined'], [RAT[0] + 0.25, 'worried']]) : t < RAT[1] + 0.45 ? { mouth: 'mouth_wobble', brow: [18, 12], closed: 1 } : exprTrack(t, [[RAT[1], 'worried'], [RAT[1] + 0.45, 'scared']], 0.12),
      look: fr ? [lerp(0, -0.95, so(t, RAT[1] + 0.45, RAT[1] + 0.55)), -0.2] : [0, 0.8], blink: !fr, arms: [aL, aR], props: { right: (g2, h) => bag(g2, h[0] - 50 + sh * 3, h[1] + 52, 1.02, sh * 0.1) } });
    stage(g, t, { tin4: 'shrine', tins: false }); });
  if (env > 0 || (t > RAT[0] && t < RAT[1] + 0.2)) { const kr = pop(t, RAT[0] + 0.08, 0.2) * (1 - sm(t, RAT[1], RAT[1] + 0.15)); note(g, 'rattle', W * 0.25 + sh * 8, H * 0.38, { size: 96, k: kr, rot: -0.1 + sh * 0.03 }); note(g, 'rattle', W * 0.75 - sh * 8, H * 0.34, { size: 82, k: pop(t, RAT[0] + 0.3, 0.2) * (1 - sm(t, RAT[1], RAT[1] + 0.15)), rot: 0.08 - sh * 0.03 }); }
  note(g, '…', W * 0.73, H * 0.3, { size: 120, k: pop(t, RAT[1] + 0.5), color: '#f0e6d0', glow: false });
  hud(g, t); vignette(g, 0.45 + 0.1 * sm(t, RAT[1], RAT[1] + 0.3)); }

// ---------- M: he wraps his last tins in socks, so they won't clink ----------
const PUSH = [46.75, 47.45], LAY = 48.0;
function shM(g, t, A) { const u = sm(t, PUSH[0], PUSH[1]), lay = sm(t, LAY, LAY + 0.4);
  const SK = [lerp(832, 868, lay), lerp(798, 872, lay)];                                   // where the sock cuff is
  const act = (tt) => ({ lean: 3 + 3 * sm(tt, PUSH[0], PUSH[1]) + 3 * sm(tt, LAY, LAY + 0.4), headTilt: 6, crouch: 3 + 3 * bump(tt, PUSH[0], PUSH[1] + 0.2) + 5 * sm(tt, LAY, LAY + 0.4), turn: 0.1, energy: 0.4 });
  const base = { z: lerp(2.5, 2.7, sm(t, 45.78, 49.4)), x: lerp(850, 835, sm(t, 45.78, 49.4)), y: 830 };
  const c = room(g, t, A, base, null, () => {
    const tinY = lerp(SK[1] - 42, SK[1] + 46, u);
    const aL = armSpring(t, [[0, HL(820, 800, 40)], [LAY, HL(842, 868, 36)]], { feel: 'soft' });
    const aR = armSpring(t, [[0, HR(965, 790, 40)], [46.2, HR(844, 798 - 42 - 30, 44)], [PUSH[0], HR(844, 798 + 6, 44)], [PUSH[1] + 0.15, HR(930, 800, 36)], [LAY + 0.1, HR(962, 874, 30)]], { feel: 'soft', delay: 0.04 });
    const P = t < LAY + 0.38 ? { left: (g2, h) => { const sx = h[0] + 12, sy = h[1] + 2; if (t >= PUSH[0] - 0.02 && u < 1) tinAt(g2, sx, tinY + 22 * TS + (sy - SK[1]), TS, 0.02, { color: TCOL[2] }); sock(g2, sx, sy, 1, lerp(0, 0.5, lay), u); },
      right: t < PUSH[0] ? (g2, h) => tinAt(g2, h[0] - 2, h[1] + 30 + 22 * TS, TS, 0.02, { color: TCOL[2] }) : null } : {};
    kneel(g, t, A, act, { expr: 'determined', look: [-0.2, 0.9], arms: [aL, aR], props: P });
    stage(g, t, { tin4: 'shrine', tins: false, socks: t < LAY + 0.38 ? 2 : 3, bag: true }); });
  const [sx, sy] = toScreen(c, 775, 870), kn = pop(t, 48.25);
  if (kn > 0) { note(g, 'no clink', sx - 40, sy - 290, { size: 88, k: kn, rot: -0.05 }); arrowTo(g, sx - 30, sy - 235, sx + 40, sy - 70, so(t, 48.35, 48.7) * kn, RED, -24); }
  note(g, 'sock', W * 0.72, H * 0.3, { size: 76, k: pop(t, 46.1) * (1 - sm(t, 47.6, 47.9)), color: '#f0e6d0', glow: false, rot: 0.05 });
  hud(g, t); vignette(g, 0.42); }

// ---------- N: he has learned about tins (deadpan to camera) ----------
function shN(g, t, A) { const LOOKT = 49.6;
  const act = (tt) => ({ lean: 2, headTilt: 3 - 3 * sm(tt, LOOKT, LOOKT + 0.2), crouch: 2, turn: 0.1 - 0.1 * sm(tt, LOOKT, LOOKT + 0.2), energy: 0.15, bp: 3.2, ba: 0.4 });
  const base = { z: lerp(1.9, 1.98, sm(t, 49.38, 51.3)), x: 880, y: 770 };
  const c = room(g, t, A, punches(t, base, [[LOOKT + 0.25, 9, { z: 2.9, x: 900, y: 705 }]]), null, () => {
    kneel(g, t, A, act, { expr: { mouth: 'mouth', brow: [-4, -3], eyeScale: 0.92 }, blink: t > 50.3 && t < 50.42 ? true : false, look: t < LOOKT ? [-0.5, 0.9] : [lerp(-0.5, 0, so(t, LOOKT, LOOKT + 0.1)), lerp(0.9, 0, so(t, LOOKT, LOOKT + 0.1))], arms: [armSpring(t, [[0, RL]]), armSpring(t, [[0, RR]])],
      ...(t > 50.3 && t < 50.42 ? { expr: { mouth: 'mouth', brow: [-4, -3], closed: 1 } } : {}) });
    stage(g, t, { tin4: 'shrine', tins: false, socks: 3, bag: true }); });
  const kl = pop(t, 50.15); if (kl > 0) note(g, 'see: Day 3', W * 0.76, H * 0.36, { size: 84, k: kl, rot: 0.04 });
  hud(g, t); vignette(g, 0.5); }

// ---------- O: packed and ready (tracker) ----------
function shO(g, t, A) {
  const act = (tt) => ({ lean: -2 * sm(tt, 51.6, 52.4), headTilt: -4 * sm(tt, 51.8, 52.5), crouch: 2, turn: track(tt, [[51.5, 0.1], [52.0, 0.45]]), energy: 0.7, bp: 2.6, ba: 0.6 });
  const k = sm(t, 51.3, DUR);
  room(g, t, A, { z: lerp(1.12, 1.4, k), x: lerp(960, 1000, k), y: lerp(680, 800, k) }, null, () => {
    kneel(g, t, A, act, { expr: exprTrack(t, [[0, 'neutral'], [51.9, 'determined']]), look: t < 51.7 ? [0, 0.3] : [lerp(0, 0.85, so(t, 51.7, 51.82)), 0.75], arms: [armSpring(t, [[0, RL]]), armSpring(t, [[0, RR], [52.3, HR(SHR[0] + 6, SHR[1] - 62, 40)]], { feel: 'soft' })] });
    stage(g, t, { tin4: 'shrine', tins: false, socks: 3, bag: true }); });
  tracker(g, t, 51.6, [0.55, 0.14 * sm(t, 51.75, 52.3), 0.22 * sm(t, 51.9, 52.45)], { labels: ['RAIN BARREL', '4 TINS', '2'] });
  hud(g, t); vignette(g, 0.48); }

const SHOTS = [['A', 0, shA], ['B', 4.34, shB], ['C', 8.06, shC], ['D', 12.9, shD], ['E', 17.18, shE], ['F1', 22.42, shF1], ['F2', 24.62, shF2], ['F3', 27.78, shF3], ['G', 30.62, shG], ['H', 31.7, shH], ['I', 34.75, shI], ['J', 35.86, shJ], ['K', 40.7, shK], ['L', 44.0, shL], ['M', 45.78, shM], ['N', 49.38, shN], ['O', 51.3, shO]];
export function draw(g, t, A) { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[1]) s = x;
  g.save(); s[2](g, t, A); g.restore();
  fade(g, 1 - sm(t, 0, 0.35)); fade(g, sm(t, DUR - 0.45, DUR)); }
