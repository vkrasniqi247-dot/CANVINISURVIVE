// rig/build_rig.mjs — cross-platform version of build_rig.sh (works on Windows):
//   vini_parts.html -> layers + vini.psd -> Rigby2D autorig -> anims -> Spine 4.2 JSON + images -> public/vini/
// then patch_views.mjs folds the turn variants (head_t34, torso_side, …) into their base slots.
// usage: node rig/build_rig.mjs [vini|zombie]     (Rigby2D is expected at ../rigby2d next to the repo, or set RIGBY2D)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const run = (args) => execFileSync('node', args, { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const mcp = (tool, args) => { const out = run(['mcp.mjs', tool, JSON.stringify(args)]); if (out.includes('(ERROR)')) { console.error(out); process.exit(1); } return out; };
const NAME = process.argv[2] || 'vini', VFILE = NAME === 'vini' ? 'variants.json' : `${NAME}_variants.json`, EXP = `${NAME}_export`;
const VARIANTS = JSON.parse(fs.readFileSync(path.join(HERE, VFILE), 'utf8'));

console.log(run(['make_psd.mjs', NAME]).trim());
const roles = { ...(NAME === 'vini' ? { backpack: 'extra' } : {}), ...Object.fromEntries(Object.keys(VARIANTS).map((n) => [n, 'extra'])) };
mcp('autorig', { psd_file: `${NAME}.psd`, output: `${NAME}.rigby`, meshes: 'none', ik: true, roles, overwrite: true });
const a = mcp('run_script', { path: `${NAME}.rigby`, script_file: 'anims.py' }); console.log(a.split('\n').filter((l) => l.includes('[')).join('\n'));
fs.rmSync(path.join(HERE, EXP), { recursive: true, force: true }); fs.mkdirSync(path.join(HERE, EXP));
execFileSync('unzip', ['-o', '-q', `../${NAME}.rigby`, 'images/*'], { cwd: path.join(HERE, EXP) });
mcp('convert_project', { input: `${NAME}.rigby`, output: `${EXP}/${NAME}.json`, version: '4.2', overwrite: true });
console.log(run(['patch_views.mjs', NAME]).trim());
const dst = path.resolve(HERE, `../public/${NAME}`);
fs.rmSync(dst, { recursive: true, force: true }); fs.cpSync(path.join(HERE, EXP), dst, { recursive: true });
console.log(`rig copied to public/${NAME}:`, fs.readdirSync(path.join(dst, 'images')).length, 'images');
