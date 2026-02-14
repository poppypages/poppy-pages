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
    const authorizationUri = client.authorizeURL({
        redirect_uri: `https://${process.env.VERCEL_URL}/api/callback`, // Dynamic Vercel URL
        scope: 'repo,user',
        state: randomstring.generate(32)
    });

    res.redirect(authorizationUri);
};
