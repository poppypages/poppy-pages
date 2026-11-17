// Finishes the GitHub login for the blog editor and hands the token to the /admin window.
const { siteOrigin, readCookie, safeEqual, STATE_COOKIE } = require('./_lib/oauth');

function page(origin, status, content) {
    // The token is only ever posted to our own origin, never to whichever window asks for it.
    const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(content)}`);
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"></head><body><script>
(function () {
  var origin = ${JSON.stringify(origin)};
  var message = ${message};
  function receive(e) {
    if (e.origin !== origin || !window.opener) return;
    window.removeEventListener('message', receive, false);
    window.opener.postMessage(message, origin);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`;
}

module.exports = async (req, res) => {
    const origin = siteOrigin(req);
    const { code, state } = req.query || {};
    const expected = readCookie(req, STATE_COOKIE);

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);

    if (!code || !state || !expected || !safeEqual(state, expected)) {
        return res.status(400).send(page(origin, 'error', { message: 'Login expired. Please try again.' }));
    }

    try {
        const r = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.OAUTH_CLIENT_ID,
                client_secret: process.env.OAUTH_CLIENT_SECRET,
                code: String(code),
                redirect_uri: `${origin}/api/callback`
            })
        });
        const data = await r.json();
        if (!r.ok || !data.access_token) throw new Error(data.error || 'no token');
        return res.status(200).send(page(origin, 'success', { token: data.access_token, provider: 'github' }));
    } catch (err) {
        console.error('GitHub login failed:', err.message);
        return res.status(500).send(page(origin, 'error', { message: 'Login failed. Please try again.' }));
    }
};
