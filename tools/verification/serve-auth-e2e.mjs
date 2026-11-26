// Test-only same-origin HTTPS gateway. Forwards every API call to the real backend.
import https from 'node:https'
import http from 'node:http'
import { readFileSync, createReadStream, existsSync, statSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'
const root = resolve(process.env.ADC_E2E_DIST)
const backend = new URL(process.env.ADC_E2E_BACKEND)
if (backend.hostname !== '127.0.0.1' || backend.protocol !== 'http:') throw new Error('Owned loopback backend required')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = https.createServer({ pfx: readFileSync(process.env.ADC_E2E_PFX), passphrase: process.env.ADC_E2E_KEY_PASSWORD, minVersion: 'TLSv1.2' }, (request, response) => {
  const requested = new URL(request.url, 'https://127.0.0.1')
  const path = requested.pathname
  if (path.startsWith('/api/v1/')) {
    const upstream = http.request(new URL(path + requested.search, backend), { method: request.method, headers: request.headers }, result => {
      response.writeHead(result.statusCode, result.headers); result.pipe(response)
    })
    upstream.on('error', () => { response.writeHead(503, { 'Content-Type': 'application/json' }); response.end('{"code":"PERSISTENCE_UNAVAILABLE","message":"Test backend unavailable","request_id":"test-gateway"}') })
    request.pipe(upstream); return
  }
  let file
  try { file = resolve(root, `.${decodeURIComponent(path)}`) } catch { response.writeHead(400); response.end(); return }
  if (file !== root && !file.startsWith(root + sep)) { response.writeHead(404); response.end(); return }
  if (!existsSync(file) || !statSync(file).isFile()) file = resolve(root, 'index.html')
  response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  createReadStream(file).pipe(response)
})
server.listen(Number(process.env.ADC_E2E_PORT), '127.0.0.1', () => console.log('Owned HTTPS test gateway ready'))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
