import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const files = new Set(['index.html', 'styles.css', 'app.js', 'data.js']);
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
http.createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!files.has(name)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(fileURLToPath(new URL(name, root)));
    res.writeHead(200, { 'Content-Type': `${types[name.split('.').pop()]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Unable to read file'); }
}).listen(4173, '127.0.0.1', () => console.log('System Parameter: http://localhost:4173'));
