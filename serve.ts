// Tiny static server for local play-testing only (never part of the entry).
// Serves game/ at http://localhost:8080 — run `node serve.ts`, then open it.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = join(import.meta.dirname, 'game');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!path.startsWith(ROOT) || !existsSync(path)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(8080, () => console.log('Sizzle & Serve at http://localhost:8080'));
