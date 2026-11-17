// tools/sheet.mjs — fast check sheet WITHOUT rendering a video: bundles once, grabs stills at chosen times, tiles them.
// usage: node tools/sheet.mjs <CompositionId> <out.png> [--from 0] [--to <end>] [--step 0.5] [--cols 8] [--w 384] [--times 1.2,3.4,...] [--crop x,y,w,h]
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill, openBrowser } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [id, out, ...rest] = process.argv.slice(2); const a = {};
for (let i = 0; i < rest.length; i += 2) a[rest[i].replace(/^--/, '')] = rest[i + 1];
const exe = '/usr/bin/google-chrome', chromeMode = 'chrome-for-testing';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.js') });
const browser = await openBrowser('chrome', { browserExecutable: exe, chromeMode });
const comp = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable: exe, chromeMode });
const end = (comp.durationInFrames - 1) / comp.fps, step = +(a.step || 0.5);
let times = a.times ? a.times.split(',').map(Number) : [];
if (!times.length) for (let t = +(a.from || 0); t <= Math.min(end, +(a.to ?? end)) + 1e-6; t += step) times.push(+t.toFixed(3));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-')); const files = [];
for (const [i, t] of times.entries()) { const f = path.join(tmp, `f${String(i).padStart(4, '0')}.jpeg`);
  await renderStill({ composition: comp, serveUrl, output: f, frame: Math.min(comp.durationInFrames - 1, Math.round(t * comp.fps)), imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser, browserExecutable: exe, chromeMode, scale: a.crop ? 1 : 0.5 }); files.push(f); }
await browser.close({ silent: true });
fs.writeFileSync(path.join(tmp, 'times.json'), JSON.stringify(times));
execFileSync('python3', [path.resolve('tools/tile.py'), tmp, out, a.cols || '8', a.w || '384', a.crop || ''], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0);
