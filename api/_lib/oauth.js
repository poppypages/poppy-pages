// Shared helpers for the Decap CMS GitHub login (api/auth.js and api/callback.js).
const crypto = require('crypto');

const ALLOWED_HOSTS = new Set(['www.poppypages.com', 'poppypages.com']);

// Only build redirect URLs for our own domains (or a Vercel preview of this project),
// never for whatever Host header a request happens to carry.
function siteOrigin(req) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    if (ALLOWED_HOSTS.has(host) || /^poppy-pages[a-z0-9-]*\.vercel\.app$/.test(host)) return `https://${host}`;
    return 'https://www.poppypages.com';
}

function readCookie(req, name) {
    const raw = req.headers.cookie || '';
    for (const part of raw.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return decodeURIComponent(v.join('='));
    }
    return '';
}

function safeEqual(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { siteOrigin, readCookie, safeEqual, STATE_COOKIE: '__Host-pp_oauth_state' };
