// public/workspace/js/chat.js
let socket;
const token = localStorage.getItem('token');
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
const BACKEND_URL = 'https://diminish-waving-shore.ngrok-free.dev/api';

document.addEventListener('DOMContentLoaded', async () => {
    if (!token || !sessionId) {
        alert("Session validation credentials or matching IDs are missing.");
        window.location.href = '/Coach_Dashboard.html';
        return;
    }

    // Connect WebSocket and subscribe immediately to individual session pipeline room
    socket = io({ auth: { token } });
    socket.emit('join_session', { sessionId });

    // Target verified element identifiers cleanly
    const messageContainer = document.getElementById('chatContainer');
    const textarea = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendBtn');
    const coachNotesArea = document.getElementById('coachNotesArea');
    const previousInsightText = document.getElementById('previousInsightText');
    const endSessionBtn = document.getElementById('endSessionBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');

    if (messageContainer) {
        messageContainer.innerHTML = `
            <div class="flex flex-col items-center mb-8">
                <span class="px-4 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">Secure Session Channel Opened</span>
            </div>
        `;
    }

    // 1. Database Hydration: Pull chronological log entries
    try {
        const res = await fetch(`${BACKEND_URL}/messages/session/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const conversations = await res.json();
            conversations.forEach(msg => appendDynamicMessage(msg, messageContainer));
            scrollToBottom(messageContainer);
        }
    } catch (err) {
        console.error("Could not complete conversation hydration:", err);
    }

    // 2. Fetch and Hydrate Session Notes/Insights (Using explicit BACKEND_URL with cache buster)
    // 2. Fetch and Hydrate Session Notes/Insights (Using explicit BACKEND_URL with cache buster)
    if (previousInsightText) {
        try {
            const sessionRes = await fetch(`${BACKEND_URL}/sessions/${sessionId}?_=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!sessionRes.ok) {
                throw new Error(`Server returned status code: ${sessionRes.status}`);
            }

            const sessionData = await sessionRes.json();
            const actualNotes = sessionData.coach_notes || sessionData.review_notes || sessionData.notes;

            if (actualNotes && actualNotes.trim() !== "") {
                if (previousInsightText) previousInsightText.textContent = `"${actualNotes}"`;
            } else {
                if (previousInsightText) {
                    previousInsightText.textContent = ""; // Remains completely empty at start
                }
            }
        } catch (err) {
            console.error("Failed to load session details:", err);
            // Fallback to empty if network or backend parsing drops
            if (coachNotesArea) coachNotesArea.value = "";
            if (previousInsightText) previousInsightText.textContent = "";
        }
    }

    // 3. Outbound Input Triggers: Setup text dispatch rules
    if (textarea) {
        textarea.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                dispatchChatMessage(textarea, messageContainer);
            }
        });

        if (sendButton) {
            sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                dispatchChatMessage(textarea, messageContainer);
            });
        }
    }

    // 4. WebSockets Sync Engine
    socket.on('new_incoming_message', (msg) => {
        if (messageContainer) {
            appendDynamicMessage(msg, messageContainer);
            scrollToBottom(messageContainer);
        }
    });

    // 5. End Session Action Trigger
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to end this secure session? This will finalize the record.")) {
                try {
                    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'completed' })
                    });

                    if (response.ok) {
                        window.location.href = '/Coach_Dashboard.html';
                    } else {
                        const err = await response.json();
                        alert(`Failed to update session status: ${err.error || 'Unknown Error'}`);
                    }
                } catch (err) {
                    console.error("Failed to execute status patch event pipeline:", err);
                }
            }
        });
    }

    socket.on('session_ended', (data) => {
        if (data.sessionId === sessionId) {
            window.location.href = window.location.pathname.includes('Coach_Chat') 
                ? '/Coach_Dashboard.html' 
                : '/dashboard.html';
        }
    });

    // Frontend: Coach UI Event Listeners
socket.on('timer_warning', (data) => {
  // Show a modal popup notification or browser confirm dialog
  const extend = confirm(`${data.message}`);
  
    if (extend) {
        // Fire the message back up to the Node server to reset the clock
        socket.emit('extend_session_time', { sessionId: data.sessionId });
    }
    });

    socket.on('timer_extended', (data) => {
    alert("Success: " + data.message);
    // Reset visual count-down UI elements back to 20:00 here
    });

    socket.on('session_ended', (data) => {
    alert("The support session timeline has wrapped up.");
    window.location.reload(); 
    });

    // 6. Save Review Notes Event Action Panel
    if (saveNotesBtn && coachNotesArea) {
        saveNotesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const notesText = coachNotesArea.value.trim();
            if (!notesText) {
                alert("Please write some notes before saving.");
                return;
            }

            saveNotesBtn.disabled = true;
            saveNotesBtn.textContent = "Saving...";

            try {
                const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/review-notes`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ coach_notes: notesText })
                });

                if (response.ok) {
                    // Instantly update the static view panel upon save success so user doesn't have to reload
                    if (previousInsightText) {
                        previousInsightText.textContent = `"${notesText}"`;
                    }
                    alert("Session review notes updated successfully.");
                } else {
                    const errPayload = await response.json();
                    alert(`Failed to save notes: ${errPayload.error || 'Unknown Error'}`);
                }
            } catch (err) {
                console.error("Network communication failure saving notes:", err);
                alert("Network error: Could not reach server.");
            } finally {
                saveNotesBtn.disabled = false;
                // Keeps your UI perfectly matched with the square-shaped Coach Review block layout!
                saveNotesBtn.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'wght' 500;">check_circle</span> Submit Official Review`;
            }
        });
    }
});

// Post message to the database through the REST layer
async function dispatchChatMessage(textarea, container) {
    const messageContent = textarea.value.trim();
    if (!messageContent) return;

    try {
        const response = await fetch(`${BACKEND_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId, content: messageContent })
        });

        if (response.ok) {
            textarea.value = ''; // Instantly clear text input block on clean save
            textarea.style.height = 'auto'; 
        } else {
            const errData = await response.json();
            console.error("Message reject returned from core:", errData.error);
        }
    } catch (err) {
        console.error("Network communication failure sending message payload:", err);
    }
}

// Append real-time message payloads with correct ownership layouts
function appendDynamicMessage(msg, container) {
    if (!container) return;

    // Securely pull authentication ID metrics from standard client JWT structure
    const parsedToken = JSON.parse(atob(token.split('.')[1]));
    const myUserId = parsedToken.id || parsedToken.userId || parsedToken.user_id;
    
    // FIXED: Target 'sender_id' to match database structure instead of undefined 'user_id'
    const isMe = msg.sender_id === myUserId;
    
    const timestamp = msg.created_at 
        ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
    const wrapper = document.createElement('div');

    if (isMe) {
        // Coach side styling match (Sent by me -> Aligned to the RIGHT)
        wrapper.className = "flex items-start gap-3 flex-row-reverse max-w-[80%] ml-auto animate-in fade-in duration-200";
        wrapper.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-on-primary">psychology</span>
            </div>
            <div class="text-right">
                <div class="message-bubble-coach p-4 shadow-md text-left bg-[#006b00] text-[#d3ffc2] rounded-[1.5rem_1.5rem_0.25rem_1.5rem]">
                    <p class="text-sm leading-relaxed">${escapeTextHTML(msg.content)}</p>
                </div>
                <span class="text-[11px] text-on-surface-variant mt-1 mr-1 block">${timestamp}</span>
            </div>
        `;
    } else {
        // User side styling match (Received from user -> Aligned to the LEFT)
        wrapper.className = "flex items-start gap-3 max-w-[80%] mr-auto animate-in fade-in duration-200";
        wrapper.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-secondary">person_search</span>
            </div>
            <div>
                <div class="message-bubble-user p-4 shadow-sm bg-[rgba(142,249,164,0.4)] text-on-background rounded-[1.5rem_1.5rem_1.5rem_0.25rem]">
                    <p class="text-sm leading-relaxed">${escapeTextHTML(msg.content)}</p>
                </div>
                <span class="text-[11px] text-on-surface-variant mt-1 ml-1 block">${timestamp}</span>
            </div>
        `;
    }

    container.appendChild(wrapper);
}

async function hydrateCoachProfileCard() {
    // Fetch session configuration details to inspect the assigned coach payload
    try {
        const sessionRes = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            
            // Check if coach relations are embedded inside the session payload layout structure
            if (sessionData && sessionData.coach) {
                const nameField = document.getElementById('coachCardName');
                const avatarField = document.getElementById('coachCardAvatar');
                const roleField = document.getElementById('coachCardRole');

                if (nameField) nameField.textContent = sessionData.coach.name || `Coach ${sessionData.coach.user_id}`;
                if (roleField) roleField.textContent = sessionData.coach.specialty || "Professional Wellness Guide";
                if (avatarField && sessionData.coach.avatar_url) {
                    avatarField.src = sessionData.coach.avatar_url;
                } else if (avatarField) {
                    avatarField.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256";
                }
            }
        }
    } catch (e) {
        console.warn("Unable to map side info profile cards directly from endpoint hooks, falling back to default styling templates.", e);
    }
}

function scrollToBottom(container) {
    if (container) container.scrollTop = container.scrollHeight;
}

function escapeTextHTML(string) {
    if (!string) return '';
    return string.replace(/[&<>'\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
}