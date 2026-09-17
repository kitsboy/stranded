// _mimi-serve-dist.mjs <port> [distDir] — a plain static server for the local verification runs.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const PORT = Number(process.argv[2] || 3099)
const ROOT = path.resolve(process.argv[3] || 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/geo+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let f = path.join(ROOT, decodeURIComponent(u.pathname))
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return }
  const t = MIME[path.extname(f)] || 'application/octet-stream'
  const raw = fs.readFileSync(f)
  if (/gzip/.test(String(req.headers['accept-encoding'])) && /^(text|application\/(json|javascript|geo\+json|xml|manifest\+json))/.test(t)) {
    res.writeHead(200, { 'content-type': t, 'content-encoding': 'gzip' }).end(zlib.gzipSync(raw)); return
  }
  res.writeHead(200, { 'content-type': t }).end(raw)
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`))
