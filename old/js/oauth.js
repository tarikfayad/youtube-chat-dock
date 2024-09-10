// oauth.js
const CLIENT_ID = '';  // Add your OAuth client ID here
const REDIRECT_URI = ''
const SCOPE = '';

let tokenClient;

function handleAuthClick() {
    // create a CSRF token and store it locally
    const state = crypto.randomBytes(16).toString("hex");
    localStorage.setItem("latestCSRFToken", state);
        
    // redirect the user to Google
    const link = `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/cloud-platform&response_type=code&access_type=offline&state=${state}&redirect_uri=${REDIRECT_URI}/integrations/google/oauth2/callback&client_id=${CLIENT_ID}`;
    window.location.assign(link);
}

/*
 * Create form to request access token from Google's OAuth 2.0 server.
 */
function oauthSignIn() {
    // Google's OAuth 2.0 endpoint for requesting an access token
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  
    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);
  
    var stateValue = Math.random().toString(36).substring(7);
    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {'client_id': CLIENT_ID,
                  'redirect_uri': REDIRECT_URI,
                  'response_type': 'token',
                  'scope': SCOPE,
                  'include_granted_scopes': 'true',
                  'state': stateValue};
  
    // Add form parameters as hidden input values.
    for (var p in params) {
      var input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', params[p]);
      form.appendChild(input);
    }
  
    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
  }

function initOAuth() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            console.log('Authenticated!');
            document.getElementById('login-btn').classList.add('hidden');
            document.getElementById('chat-container').classList.remove('hidden');
            fetchLiveStream();
        },
    });
}

document.getElementById('login-btn').addEventListener('click', handleAuthClick);

window.onload = function() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
    });
    oauthSignIn();
};
