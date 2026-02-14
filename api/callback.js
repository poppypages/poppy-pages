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
            redirect_uri: `https://${host}/api/callback`,
        });

        const token = accessToken.token.access_token;

        // Handshake script for Decap CMS
        const responseBody = `
    <html>
      <body>
        <script>
          (function() {
            var token = "${token}";
            var provider = "github";
            
            function receiveMessage(e) {
              console.log("receiveMessage %o", e);
              // Send message to parent window with the token
              window.opener.postMessage(
                'authorization:github:success:' + JSON.stringify({
                  token: token,
                  provider: provider
                }),
                e.origin
              );
            }
            
            window.addEventListener("message", receiveMessage, false);
            // Start the handshake
            window.opener.postMessage("authorizing:github", "*");
          })();
        </script>
      </body>
    </html>
    `;

        res.status(200).send(responseBody);
    } catch (error) {
        console.error('Access Token Error', error.message);
        res.status(500).json('Authentication failed');
    }
};
