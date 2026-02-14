const { AuthorizationCode } = require('simple-oauth2');
const randomstring = require('randomstring');

const config = {
    client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET
    },
    auth: {
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize'
    }
};

const client = new AuthorizationCode(config);

module.exports = (req, res) => {
    const host = req.headers.host; // Use the actual host (e.g., www.poppypages.com)
    const authorizationUri = client.authorizeURL({
        redirect_uri: `https://${host}/api/callback`,
        scope: 'repo,user',
        state: randomstring.generate(32)
    });

    res.redirect(authorizationUri);
};
