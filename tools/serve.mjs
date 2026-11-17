// Small local server that mimics how Vercel serves this repo:
// clean URLs, the rewrites in vercel.json, and the two blog API routes.
// Usage: npm install, then: node tools/serve.mjs [port]
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || 4173);
const require = createRequire(import.meta.url);
process.chdir(root);

const rewrites = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).rewrites || [];
const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
    '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
    '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain'
};
const hidden = /^\/(src|tools|node_modules|\.git)(\/|$)/;

http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let p = decodeURIComponent(url.pathname);
    const hit = rewrites.find((r) => r.source === p);
    if (hit) p = hit.destination;

    if (p === '/api/posts' || p === '/api/post') {
        req.query = Object.fromEntries(url.searchParams);
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (body) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };
        try { return await require(join(root, p + '.js'))(req, res); }
        catch (err) { res.statusCode = 500; return res.end(String(err)); }
    }

    if (!hidden.test(p)) {
        for (const t of [p, p + '.html', join(p, 'index.html')]) {
            try {
                const f = join(root, t);
                if ((await stat(f)).isFile()) {
                    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
                    return res.end(await readFile(f));
                }
            } catch { /* try the next one */ }
        }
    }
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(root, '404.html')).catch(() => 'not found'));
}).listen(port, () => console.log('serving', root, 'on http://localhost:' + port));
