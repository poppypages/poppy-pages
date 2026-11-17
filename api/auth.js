// Starts the GitHub login for the blog editor at /admin (Decap CMS).
const crypto = require('crypto');
const { siteOrigin, STATE_COOKIE } = require('./_lib/oauth');

module.exports = (req, res) => {
    const clientId = process.env.OAUTH_CLIENT_ID;
    if (!clientId) return res.status(500).send('Login is not set up.');

    const state = crypto.randomBytes(32).toString('hex');
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', `${siteOrigin(req)}/api/callback`);
    url.searchParams.set('scope', 'public_repo,user');
    url.searchParams.set('state', state);

    // The callback only accepts a login that started here, in this browser.
    res.setHeader('Set-Cookie', `${STATE_COOKIE}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, url.toString());
};
