require('dotenv').config();

const express = require("express");
const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

const app = express();

app.get("/", function (request, response) {
    response.send("Hello World!");
});

app.get('/auth', async (req, res) => {
    try {
        const code = req.query.code;
        console.log(`Authorization code: ${code}`);

        // Use the code to acquire tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);  // Set the tokens on the client

        console.log('Tokens acquired:', tokens);
        res.send('Authentication successful! Tokens have been acquired.');
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).send('Authentication failed');
    }
});

// Starting the express server
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log(`YouTube Chat backend is running on port ${port}`));

// OAuth 2.0 Methods
async function main() {
    const oAuth2Client = await getAuthenticatedClient();

    // Make a simple request to the People API using our pre-authenticated client
    const apiUrl = 'https://people.googleapis.com/v1/people/me?personFields=names';
    const res = await oAuth2Client.request({ url: apiUrl });
    console.log(res.data);

    // Check on the token info
    const tokenInfo = await oAuth2Client.getTokenInfo(oAuth2Client.credentials.access_token);
    console.log(tokenInfo);
}

function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
        // Create an oAuth client to authorize the API call. Secrets are kept in a `.env` file
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        // Generate the url for the consent dialog
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: process.env.SCOPE,
        });

        // Open an http server to accept the oauth callback
        const server = http
            .createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                        // Parse the full URL
                        const parsedUrl = new url.URL(req.url, process.env.REDIRECT_URI);
                        const code = parsedUrl.searchParams.get('code');
                        console.log(`Code is ${code}`);
                        res.end('Authentication successful! Please return to the console.');
                        server.destroy();

                        // Use the code to acquire tokens
                        const r = await oAuth2Client.getToken(code);
                        oAuth2Client.setCredentials(r.tokens);
                        console.info('Tokens acquired.');
                        resolve(oAuth2Client);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(process.env.OAUTH_PORT || 3000, () => {
                // Open the browser to the authorize url to start the workflow
                open(authorizeUrl, { wait: false }).then(cp => cp.unref());
            });

        destroyer(server);
    });
}

main().catch(console.error);
