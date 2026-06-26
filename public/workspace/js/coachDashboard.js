// public/workspace/js/coachDashboard.js
let socket;
const token = localStorage.getItem('token');


document.addEventListener('DOMContentLoaded', () => {
    if (!token) return;

    socket = io({ auth: { token } });

    const upcomingContainer = document.getElementById('upcoming-sessions-container');
    const activeContainer = document.getElementById('active-sessions-container');

    // Load initial queues on page mount
    if (typeof loadDynamicSessionQueues === 'function') {
        loadDynamicSessionQueues({ 'Authorization': `Bearer ${token}` });
    }

    // Real-time Event: New incoming user request appears
    socket.on('new_session_request', (data) => {
        if (!upcomingContainer) return;

        const fallback = upcomingContainer.querySelector('.text-center') || upcomingContainer.querySelector('p');
        if (fallback && (fallback.textContent.includes('No pending') || fallback.textContent.includes('Parsing'))) {
            upcomingContainer.innerHTML = '';
        }

        if (document.getElementById(`req-${data.sessionId}`)) return;

        const timestamp = new Date();
        const displayDay = timestamp.getDate();
        const displayMonth = timestamp.toLocaleString('en-US', { month: 'SHORT' }).toLowerCase();

        const card = document.createElement('div');
        card.id = `req-${data.sessionId}`;
        card.className = "flex items-center gap-4 group p-2 hover:bg-surface-container-high rounded-lg transition-colors animate-in fade-in";
        card.innerHTML = `
            <div class="w-12 h-12 rounded-lg bg-primary-container flex flex-col items-center justify-center text-on-primary-container font-bold shrink-0">
                <span class="text-[10px] uppercase leading-tight">${displayMonth}</span>
                <span class="text-[18px] leading-none font-extrabold">${displayDay}</span>
            </div>
            <div class="flex-grow min-w-0">
                <p class="font-label-sm text-label-sm font-bold text-on-surface truncate">Anonymous Client</p>
                <p class="text-[12px] text-on-surface-variant truncate">"${data.contextMessage || 'No context details shared.'}"</p>
            </div>
            <button onclick="acceptIncomingSession('${data.sessionId}', 'Anonymous Client')" class="material-symbols-outlined text-[24px] text-primary p-1 hover:bg-white/60 rounded-full transition-colors shrink-0" title="Accept Request">
                check_circle
            </button>
        `;
        upcomingContainer.appendChild(card);
    });

    // Real-time Event: Remove items instantly if taken by another counselor
    socket.on('session_request_claimed', ({ sessionId }) => {
        const targetedCard = document.getElementById(`req-${sessionId}`);
        if (targetedCard) targetedCard.remove();
    });
});

// Triggers status conversion and places session card in Active list instantly
async function acceptIncomingSession(sessionId, clientName) {
    try {
        const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'active' })
        });

        if (response.ok) {
            // Remove from upcoming container instantly
            const reqCard = document.getElementById(`req-${sessionId}`);
            if (reqCard) reqCard.remove();

            // Append straight into Active Sessions dashboard stack without forced hard reload
            const activeContainer = document.getElementById('active-sessions-container');
            if (activeContainer) {
                const emptyFallback = activeContainer.querySelector('.col-span-2');
                if (emptyFallback) activeContainer.innerHTML = '';

                const initials = clientName.substring(0,2).toUpperCase();
                activeContainer.innerHTML += `
                    <div class="glass-card p-4 rounded-lg border border-primary/20 flex items-center justify-between group hover:bg-white/30 transition-all animate-in fade-in">
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container relative shrink-0">
                                ${initials}
                                <div class="w-2.5 h-2.5 bg-primary rounded-full absolute bottom-0 right-0 border-2 border-white"></div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-label-sm text-label-sm font-bold text-on-surface truncate">${clientName}</p>
                                <p class="text-[12px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                    <span class="material-symbols-outlined text-[14px]">forum</span> Secure Chat Room
                                </p>
                            </div>
                        </div>
                        <button onclick="window.location.href='/Coach_Chat.html?session_id=${sessionId}'" class="bg-primary text-on-primary px-4 py-2 rounded-full font-label-sm text-label-sm font-bold hover:shadow-lg transition-all shrink-0 ml-2">
                            Join Session
                        </button>
                    </div>`;
            }

            // Sync metrics dashboard indicators
            const statActive = document.getElementById('stat-active-sessions');
            if (statActive && !isNaN(statActive.innerText)) statActive.innerText = parseInt(statActive.innerText) + 1;
            
            const statPending = document.getElementById('stat-sessions-today');
            if (statPending && !isNaN(statPending.innerText) && parseInt(statPending.innerText) > 0) {
                statPending.innerText = parseInt(statPending.innerText) - 1;
            }

        } else if (response.status === 409) {
            alert('Too late! This support session request has already been claimed by another specialist.');
        }
    } catch (err) {
        console.error("Transition request failure:", err);
    }
}