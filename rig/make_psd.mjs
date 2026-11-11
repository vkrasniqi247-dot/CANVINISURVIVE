import { chromium } from 'playwright';   // npm i -D playwright (in the repo root)
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), RIGBY = process.env.RIGBY2D || path.resolve(HERE, '../../rigby2d');
import http from 'http'; import fs from 'fs';
const NAME = process.argv[2] || 'vini';          // vini | zombie  ->  <name>_parts.html -> <name>.psd
const ROOTS = { '/node_modules/': RIGBY + '/node_modules/', '/': HERE + '/' };
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const [pre, dir] = Object.entries(ROOTS).find(([p]) => u.startsWith(p)); const f = path.join(dir, u.slice(pre.length)); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(r); }).listen(0);
const RCHROME = path.resolve(HERE, '../node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
const exe = process.env.CHROME || (fs.existsSync(RCHROME) ? RCHROME : null);   // Remotion's own Chrome works fine for Playwright
const port = srv.address().port, b = await chromium.launch(exe ? { executablePath: exe } : {}), p = await b.newPage();
p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(`http://localhost:${port}/${NAME}_parts.html`); await p.waitForFunction('window.OUT', null, { timeout: 60000 });
const out = await p.evaluate('window.OUT');
fs.mkdirSync(`layers/${NAME}`, { recursive: true });
for (const [n, d] of out.layers) fs.writeFileSync(`layers/${NAME}/${n}.png`, Buffer.from(d.split(',')[1], 'base64'));
fs.writeFileSync(`${NAME}_preview.png`, Buffer.from(out.preview.split(',')[1], 'base64'));
fs.writeFileSync(`${NAME}.psd`, Buffer.from(out.psd, 'base64'));
console.log('layers', out.layers.length); await b.close(); srv.close();
