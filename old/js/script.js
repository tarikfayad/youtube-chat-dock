let liveChatId = null;
let livePolling = null;

function fetchLiveStream() {
    fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all', {
        headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.items && data.items.length > 0) {
            const liveStream = data.items[0];
            liveChatId = liveStream.snippet.liveChatId;
            console.log('Live stream found:', liveStream);
            fetchChat();
        } else {
            console.log('No live stream found, checking again in 30 seconds...');
            setTimeout(fetchLiveStream, 30000); // Poll every 30 seconds
        }
    })
    .catch(error => console.error('Error fetching live stream:', error));
}

function fetchChat() {
    if (!liveChatId) return;

    fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails`, {
        headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
        }
    })
    .then(response => response.json())
    .then(data => {
        const chatContainer = document.getElementById('chat');
        chatContainer.innerHTML = ''; // Clear previous messages

        data.items.forEach(item => {
            const message = document.createElement('div');
            message.textContent = `${item.authorDetails.displayName}: ${item.snippet.displayMessage}`;
            chatContainer.appendChild(message);
        });

        setTimeout(fetchChat, 3000); // Refresh chat every 3 seconds
    })
    .catch(error => console.error('Error fetching chat:', error));
}

function sendMessage() {
    const message = document.getElementById('message').value;
    if (!message || !liveChatId) return;

    fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            snippet: {
                liveChatId: liveChatId,
                type: 'textMessageEvent',
                textMessageDetails: {
                    messageText: message
                }
            }
        })
    })
    .then(response => response.json())
    .then(() => {
        console.log('Message sent!');
        document.getElementById('message').value = ''; // Clear message input
    })
    .catch(error => console.error('Error sending message:', error));
}

document.getElementById('send-message').addEventListener('click', sendMessage);