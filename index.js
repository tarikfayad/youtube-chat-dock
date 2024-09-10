require('dotenv').config();

const express = require("express");
const { OAuth2Client } = require('google-auth-library');
const url = require('url');
const open = require('open');

const app = express();

let oAuth2Client;

// Default route
app.get("/", function (req, res) {
    res.send("Hello World!");
});

// OAuth 2.0 callback route (using the existing Express server)
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
    oAuth2Client = new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    // Generate the url for the consent dialog
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: process.env.SCOPE,
    });

    // Open the browser to the authorize URL
    open(authorizeUrl, { wait: false }).then(cp => cp.unref());
}

// Start the OAuth process
main().catch(console.error);
