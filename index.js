require('dotenv').config();

const express = require("express");
const { OAuth2Client } = require('google-auth-library');
const open = require('open');
const axios = require('axios');

const app = express();

let oAuth2Client;
let tokens;  // Store tokens globally for reuse
let checkInterval;  // Variable to store the interval ID

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
        const result = await oAuth2Client.getToken(code);
        tokens = result.tokens;  // Store the tokens globally for reuse
        oAuth2Client.setCredentials(tokens);  // Set the tokens on the client

        console.log('Tokens acquired:', tokens);

        // Need to redirect here to a page that says something along the lines of "searching for live streams..."

        // Start checking for live broadcasts every 30 seconds
        checkForLiveBroadcasts(res);
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).send('Authentication failed');
    }
});

// Starting the express server
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log(`YouTube Chat backend is running on port ${port}`));

// Function to get the live chat link for the current live broadcast
async function getLiveChatLink(accessToken) {
    try {
        // Request the current live broadcasts
        const response = await axios.get(
            'https://www.googleapis.com/youtube/v3/liveBroadcasts', {
                params: {
                    part: 'snippet',
                    broadcastStatus: 'active',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

        if (response.data.items && response.data.items.length > 0) {
            // If a live broadcast exists, extract the liveChatId
            const liveChatId = response.data.items[0].snippet.liveChatId;

            // Construct the live chat popout link
            const liveChatLink = `https://www.youtube.com/live_chat?v=${response.data.items[0].id}&embed_domain=localhost`;
            console.log(`Live Chat Link: ${liveChatLink}`);

            // Stop checking for live broadcasts since we found one
            clearInterval(checkInterval);
            return liveChatLink;
        } else {
            console.log('No live broadcasts are currently active.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching live broadcast:', error);
        return null;
    }
}

// Function to check for live broadcasts every 30 seconds
function checkForLiveBroadcasts(res) {
    checkInterval = setInterval(async () => {
        if (tokens && tokens.access_token) {
            console.log('Checking for live broadcasts...');
            let chatLink = await getLiveChatLink(tokens.access_token);

            // If a live chat link is found, redirect and stop further checks
            if (chatLink) {
                res.redirect(chatLink);  // Only redirect once when a stream is found
                clearInterval(checkInterval);  // Stop the interval
            }
        } else {
            console.log('Tokens are not available yet.');
        }
    }, 30000);  // 30 seconds
}

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
