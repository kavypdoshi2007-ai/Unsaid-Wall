// public/workspace/js/userDashboard.js

const token = localStorage.getItem('token');
const BACKEND_URL = window.location.origin + '/api';

// Create WebSocket listener as soon as the file loads
if (typeof io !== 'undefined' && token) {
    try {
        const base64Url = token.split('.')[1];
        const parsedToken = JSON.parse(atob(base64Url));
        const myUserId = parsedToken.id;

        socket = io({ auth: { token } });

        // Listen for the exact moment a coach clicks "Accept"
        socket.on(`session_accepted_${myUserId}`, (data) => {
            const statusBox = document.getElementById('user-session-status-box');
            if (statusBox) {
                statusBox.className = "p-6 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 text-center shadow-md max-w-xl mx-auto mt-6 animate-in fade-in";
                statusBox.innerHTML = `
                    <p class="font-extrabold text-base text-emerald-800">🎉 Connection Established!</p>
                    <p class="text-xs text-emerald-700 mt-1">A support specialist has accepted your session request.</p>
                    <a href="/User_Chat.html?session_id=${data.sessionId}" class="mt-4 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95">
                        Join Live Chat Session Now
                    </a>
                `;
            }
        });
    } catch (e) {
        console.error("Socket channel failed to open:", e);
    }
}

// Main function fired by onclick="startChat()"
async function startChat() {
    console.log("startChat() function successfully triggered via user click!");

    if (!token) {
        alert("Your authentication session has expired. Please log in to request real-time support.");
        return;
    }

    // 1. Instantly capture what's on their mind
    const contextMessage = prompt("Briefly share what's on your mind (or leave empty):") || "User requested an open support session.";

    // 2. Locate the button area dynamically to show the loader, fallback if ID is missing
    let actionContainer = document.getElementById('support-action-container');
    
    // Fallback: If you forgot the ID, find the button by its text and target its parent element
    if (!actionContainer) {
        const fallbackBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Connect with a Support'));
        if (fallbackBtn) {
            actionContainer = fallbackBtn.parentElement;
        }
    }

    // 3. Inject the pulsing waiting status window right away
    if (actionContainer) {
        actionContainer.innerHTML = `
            <div id="user-session-status-box" class="p-6 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-center shadow-sm max-w-xl mx-auto mt-6">
                <div class="flex items-center justify-center gap-2">
                    <span class="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></span>
                    <p class="font-bold text-sm text-amber-800">⏳ Request sent to all active coaches.</p>
                </div>
                <p class="text-xs text-amber-600 mt-2">Waiting for a coach to accept... Keep this dashboard open. This panel will turn into an interactive <b>Join Chat</b> link the second a counselor hits accept.</p>
            </div>
        `;
    }

    // 4. Send the record request down to your database
    try {
        const response = await fetch(`${BACKEND_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ context_message: contextMessage })
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.error || "Failed to post session request.");
        }
        console.log("Database entry added. Waiting in live queue pool...");

    } catch (err) {
        console.error("Session request loop crashed:", err);
        alert(`Could not start support session: ${err.message}`);
        
        // Put the standard button back if the network fails
        if (actionContainer) {
            actionContainer.innerHTML = `
                <button class="bg-[#006a30] text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all active:scale-95" onclick="startChat()">
                    Connect with a Support Specialist
                </button>
            `;
        }
    }
}