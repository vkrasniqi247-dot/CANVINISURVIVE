// minimal MCP stdio client for the Rigby2D server: node mcp.mjs '<tool>' '<json args>'  (or a JSON array of [tool,args] via --batch file)
import { spawn } from 'child_process';
const srv = spawn('node', ['/home/claude/ext/rigby2d/src/mcp/server.js', '--root', '/home/claude/rig'], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', id = 0; const wait = new Map();
srv.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (!l.trim()) continue; const m = JSON.parse(l); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } } });
const rpc = (method, params) => new Promise((r) => { const i = ++id; wait.set(i, r); srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method, params }) + '\n'); });
await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'cli', version: '1' } });
srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
const calls = process.argv[2] === '--batch' ? JSON.parse((await import('fs')).readFileSync(process.argv[3], 'utf8')) : [[process.argv[2], JSON.parse(process.argv[3] || '{}')]];
for (const [name, args] of calls) { const r = await rpc('tools/call', { name, arguments: args }); const txt = (r.result?.content || []).map((c) => c.text || `[${c.type}]`).join('\n') || JSON.stringify(r.error); console.log(`== ${name}${r.result?.isError ? ' (ERROR)' : ''}\n${txt.slice(0, 4000)}`); }
srv.kill();
