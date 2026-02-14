const { AuthorizationCode } = require('simple-oauth2');

module.exports = async (req, res) => {
    const { code } = req.query;
    const { host } = req.headers;

    const client = new AuthorizationCode({
        client: {
            id: process.env.OAUTH_CLIENT_ID,
            secret: process.env.OAUTH_CLIENT_SECRET,
        },
        auth: {
            tokenHost: 'https://github.com',
            tokenPath: '/login/oauth/access_token',
            authorizePath: '/login/oauth/authorize',
        },
    });

    try {
        const accessToken = await client.getToken({
            code,
            redirect_uri: `https://${host}/api/callback`, // Uses /api/callback
        });

        // Extract token correctly depending on simple-oauth2 version structure
        const token = accessToken.token.access_token || accessToken.token;

        // Handshake script for Decap CMS
        const script = `
    <html>
      <head>
        <script>
        function receiveMessage(e) {
          console.log("receiveMessage %o", e)
          // send message to main window with url
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({
            token: "${token}",
            provider: "github"
        })}',
            e.origin
          )
        }
        window.addEventListener("message", receiveMessage, false)
        // Start handshake with parent
        console.log("Sending message: %o", "github")
        window.opener.postMessage("authorizing:github", "*")
        </script>
      </head>
      <body>Success! Authenticated. Closing...</body>
    </html>
    `;

        res.status(200).send(script);
    } catch (error) {
        console.error('Access Token Error', error.message);
        res.status(500).json('Authentication failed');
    }
};
