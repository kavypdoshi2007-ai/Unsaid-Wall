// public/app.js

// ====================================================
// 🔒 CENTRALIZED JWT EXPIRATION AND BACK-BUTTON PROTECTION
// ====================================================
let liveExpirationWatcher = null;

function verifySessionAndKick() {
    const token = localStorage.getItem('token');

    // 1. If token is missing, kick out immediately
    if (!token || token === "null" || token === "undefined") {
        clearInterval(liveExpirationWatcher); // Stop watching if cleared
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return true;
    }

    try {
        // 2. Decode the JWT payload on the client side to inspect the expiration time
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        // payload.exp is in seconds, Date.now() is in milliseconds
        const currentTimeInSecs = Math.floor(Date.now() / 1000);

        // 3. Cryptographic Alignment Check: If the token's lifetime has officially run out
        if (payload.exp && currentTimeInSecs >= payload.exp) {
            console.warn("Session aligner: Token lifetime has ended.");
            clearInterval(liveExpirationWatcher); // Kill the background watcher loop
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return true;
        }
    } catch (e) {
        clearInterval(liveExpirationWatcher);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return true;
    }
    return false;
}

// 🛡️ BACKGROUND TICK WATCHER: Checks the token every 1 second
// This runs silently in the background and kicks the user out at the exact moment of death
function startExpirationClock() {
    clearInterval(liveExpirationWatcher); // Avoid creating duplicate timers
    liveExpirationWatcher = setInterval(() => {
        verifySessionAndKick();
    }, 1000); // 1000ms = Check every 1 second
}

// 🔥 GUARD A: Fires when a user navigates to the page initially
verifySessionAndKick();
startExpirationClock();

// 🔥 GUARD B: Destroys the browser's visual snapshot if they use the Back button
window.addEventListener('pageshow', (event) => {
    verifySessionAndKick();
    startExpirationClock();
});

// ====================================================
// 🛡️ GLOBAL API FETCH INTERCEPTOR (For active page requests)
// ====================================================
const originalFetch = window.fetch;

window.fetch = async function (...args) {
    if (verifySessionAndKick()) {
        return new Promise(() => {}); // Halt execution if dead
    }

    try {
        const response = await originalFetch(...args);

        if (response.status === 401) {
            clearInterval(liveExpirationWatcher);
            localStorage.removeItem('token'); 
            window.location.href = '/login.html'; 
            return new Promise(() => {}); 
        }

        // 👉 IF YOU ARE USING THE SLIDING EXpiration METHOD:
        // Update the watcher if the server hands over a fresh extended token
        const refreshedToken = response.headers.get('X-Updated-Token');
        if (refreshedToken) {
            localStorage.setItem('token', refreshedToken);
            currentUserToken = refreshedToken; 
            startExpirationClock(); // Restart the clock with the new token timestamp
        }

        return response;
    } catch (error) {
        return Promise.reject(error);
    }
};

// ====================================================
// 1. GLOBAL STATE DEFINITIONS
// ====================================================
let communityPosts = [];
let selectedEmotionEnum = "HOPEFUL"; 
let currentUserToken = null;
let currentProfileId = null;
let socket = null; 

const emotionEnumMap = {
    "😰": "ANXIOUS", "😔": "SAD", "😤": "ANGRY", "🫥": "LONELY",
    "😵": "OVERWHELMED", "🌱": "HOPEFUL", "😶": "NUMB", "😕": "CONFUSED"
};

const emotionDisplayMap = {
    "ANXIOUS": "😰 Anxious", "SAD": "😔 Sad", "ANGRY": "😤 Angry", "LONELY": "🫥 Lonely",
    "OVERWHELMED": "😵 Overwhelmed", "HOPEFUL": "🌱 Hopeful", "NUMB": "😶 Numb", "CONFUSED": "😕 Confused"
};

const supportReactions = [
    { enumKey: "HEAR_YOU",  icon: "🤍", label: "I hear you" },
    { enumKey: "NOT_ALONE", icon: "🫂", label: "You're not alone" },
    { enumKey: "STRENGTH",  icon: "💙", label: "Sending strength" },
    { enumKey: "WILL_PASS", icon: "🌱", label: "This will pass" }
];

const reactionDisplayMap = {
    "HEAR_YOU": { icon: "🤍", label: "I hear you" },
    "NOT_ALONE": { icon: "🫂", label: "You're not alone" },
    "STRENGTH": { icon: "💙", label: "Sending strength" },
    "WILL_PASS": { icon: "🌱", label: "This will pass" }
};

document.addEventListener('DOMContentLoaded', async () => {
    currentUserToken = localStorage.getItem('token');
    if (!currentUserToken || currentUserToken === "null" || currentUserToken === "undefined") {
        window.location.href = '/login.html';
        return;
    }

    currentProfileId = parseJwtUserId(currentUserToken);

    await syncCommunityFeed();
    setupFormInteractionListeners();
    initializeGlobalSocket(); 
});

function initializeGlobalSocket() {
    if (typeof io !== 'undefined' && currentUserToken) {
        socket = io({ auth: { token: currentUserToken } });
        
        socket.on('new_public_post', (post) => {
            const feedContainer = document.querySelector('main > div.space-y-6');
            if (!feedContainer) return;

            if (communityPosts.length === 0) {
                feedContainer.innerHTML = '';
            }

            communityPosts.unshift(post);
            const cardLayout = buildPostCardMarkup(post);
            feedContainer.insertBefore(cardLayout, feedContainer.firstChild);
        });
    }
}

// ====================================================
// 🌐 REST NETWORK DATA ACTIONS
// ====================================================

async function syncCommunityFeed() {
    const feedContainer = document.querySelector('main > div.space-y-6');
    if (!feedContainer) return;

    try {
        const response = await fetch('/api/posts', {
            method: 'GET',
            headers: {
                'Authorization': currentUserToken ? `Bearer ${currentUserToken}` : ''
            }
        });

        if (!response.ok) throw new Error("Unable to synchronize platform feed.");

        communityPosts = await response.json();
        feedContainer.innerHTML = '';

        if (communityPosts.length === 0) {
            feedContainer.innerHTML = `
                <div class="text-center text-gray-500 py-12 italic">
                    The wall is empty. Be the first to leave an anonymous thought.
                </div>
            `;
            return;
        }

        communityPosts.forEach(post => {
            const cardLayout = buildPostCardMarkup(post);
            feedContainer.appendChild(cardLayout);
        });

    } catch (error) {
        console.error("💥 Community synchronization failure:", error);
    }
}

async function dispatchNewExpression() {
    const textarea = document.getElementById('postTextarea');
    const contentString = textarea.value.trim();

    if (!contentString) return alert("Context can't be blank.");
    if (!currentUserToken) return alert("Please log in to share expressions.");

    const payload = {
        content: contentString,
        display_name: "Anonymous User",
        emotion: selectedEmotionEnum,
        language: textarea.getAttribute('lang') || 'en'
    };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUserToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 403) {
            const interceptionData = await response.json();
            if (interceptionData.status === "INTERCEPTED") {
                alert(interceptionData.message);
                
                if (interceptionData.sessionId) {
                    window.location.href = `/User_Chat.html?session_id=${interceptionData.sessionId}`;
                } else {
                    window.location.href = '/User_Chat.html';
                }
                return;
            }
        }

        if (!response.ok) throw new Error("Failed to finalize post request.");

        textarea.value = '';
        if (document.getElementById('charCount')) {
            document.getElementById('charCount').innerText = "0 / 280";
        }
        
        if (typeof toggleComposer === 'function') toggleComposer();
        
        selectedEmotionEnum = "HOPEFUL";
        await syncCommunityFeed();

    } catch (error) {
        console.error("💥 Creation drop:", error);
    }
}

async function executeReactionToggle(postId, reactionEnumToken, event) {
    if (!currentUserToken) {
        alert("Please log in or register an account to interact with posts.");
        return;
    }

    if (event) event.stopPropagation();

    try {
        const response = await fetch('/api/reactions/toggle', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUserToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                reaction_type: reactionEnumToken
            })
        });

        if (response.ok) {
            await loadCardReactionMetrics(postId);
        }
    } catch (error) {
        console.error("💥 Reaction toggle drop:", error);
    }
}

// ====================================================
// 🎨 UI CANVAS STYLING & GENERATION ENGINES
// ====================================================

function buildPostCardMarkup(post) {
    const article = document.createElement('article');
    const isOwner = post.user_id === currentProfileId;
    
    const humanDisplayEmotion = emotionDisplayMap[post.emotion] || "🌱 Hopeful";
    const postTimestamp = computeRelativeTime(post.created_at);

    article.className = `unsaid-card rounded-lg p-6 relative overflow-hidden bg-white shadow-[0_4px_20px_rgba(5,139,3,0.05)] border border-gray-100 ${
        isOwner ? 'border-l-4 border-l-emerald-600' : ''
    }`;

    let calculatedTotal = 0;
    const initialGroupsMap = {};
    supportReactions.forEach(r => { initialGroupsMap[r.enumKey] = { count: 0, userHasReacted: false }; });

    if (post && Array.isArray(post.reactions)) {
        post.reactions.forEach(item => {
            if (!item) return;
            const typeKey = item.reaction_type || item.type;
            if (typeKey && initialGroupsMap[typeKey] !== undefined) {
                const countAmount = typeof item.count !== 'undefined' ? Number(item.count) : 1;
                initialGroupsMap[typeKey].count += countAmount;
                calculatedTotal += countAmount;

                if (currentUserToken && (item.user_id === currentProfileId || item.userHasReacted === true)) {
                    initialGroupsMap[typeKey].userHasReacted = true;
                }
            }
        });
    }

    let initialBadgesHTML = '';
    let hasReactionsExist = false;

    Object.keys(initialGroupsMap).forEach(key => {
        const counter = initialGroupsMap[key];
        if (counter.count > 0) {
            hasReactionsExist = true;
            const designMetadata = reactionDisplayMap[key] || { icon: "🤍", label: key };
            const styleClasses = counter.userHasReacted 
                ? "border-emerald-500 bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-500/10"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-800 font-semibold";

            initialBadgesHTML += `
                <button onclick="executeReactionToggle('${post.id}', '${key}', event)" 
                        class="px-3 py-1 rounded-full text-xs flex items-center gap-1.5 active:scale-110 transition-transform border ${styleClasses}">
                    <span>${designMetadata.icon}</span> 
                    <span>${designMetadata.label}</span> 
                    <span class="bg-emerald-600/10 text-emerald-700 px-1.5 py-0.2 rounded font-mono text-[11px]">${counter.count}</span>
                </button>
            `;
        }
    });

    if (!hasReactionsExist) {
        initialBadgesHTML = '<span class="text-xs text-gray-400 italic font-medium">No expressions left yet</span>';
    }

    const selectionButtonsHTML = supportReactions.map(reaction => {
        const isMarkedByMe = initialGroupsMap[reaction.enumKey] ? initialGroupsMap[reaction.enumKey].userHasReacted : false;
        const btnStyles = isMarkedByMe
            ? "transform active:scale-95 transition-all duration-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500 bg-emerald-100 text-emerald-800 flex items-center gap-1.5"
            : "transform active:scale-95 transition-all duration-200 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 border border-gray-200/40 flex items-center gap-1.5";

        return `
            <button onclick="executeReactionToggle('${post.id}', '${reaction.enumKey}', event)" 
                    data-reaction-btn="${reaction.enumKey}"
                    class="${btnStyles}">
                <span>${reaction.icon}</span>
                <span>${reaction.label}</span>
            </button>
        `;
    }).join('');

    article.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2">
                ${isOwner ? '<span class="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Your Post</span>' : '<span class="text-xs font-semibold text-gray-500">Anonymous User</span>'}
                <span class="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium">${escapeHtml(humanDisplayEmotion)}</span>
            </div>
            <span class="text-xs text-gray-400">${postTimestamp}</span>
        </div>
        <p class="text-base text-gray-800 leading-relaxed mb-3 font-serif">
            "${escapeHtml(post.content)}"
        </p>

        <div class="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-5" id="total-count-${post.id}">
            <span class="material-symbols-outlined text-sm text-emerald-600" style="font-variation-settings: 'FILL' 1">favorite</span>
            <span>${calculatedTotal} support responses</span>
        </div>
        
        <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 w-full">
            <div class="flex flex-wrap gap-2 items-center min-h-[28px]" id="reaction-bin-${post.id}">
                 ${initialBadgesHTML}
            </div>
            
            <div class="flex flex-wrap gap-2 items-center mt-1" id="action-bar-${post.id}">
                ${selectionButtonsHTML}
            </div>
        </div>
    `;

    if (currentUserToken && currentUserToken !== "null" && currentUserToken !== "undefined") {
        setTimeout(() => { loadCardReactionMetrics(post.id); }, 0);
    }

    return article;
}

async function loadCardReactionMetrics(postId) {
    if (!currentUserToken || currentUserToken === "null" || currentUserToken === "undefined") return;

    const reactionBin = document.getElementById(`reaction-bin-${postId}`);
    const actionBar = document.getElementById(`action-bar-${postId}`);
    const totalCountLabel = document.getElementById(`total-count-${postId}`);
    if (!reactionBin) return;

    try {
        const response = await fetch(`/api/reactions/post/${postId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUserToken}`
            }
        });
        
        if (!response.ok) return;
        const dataArray = await response.json();
        
        if (actionBar) {
            supportReactions.forEach(reaction => {
                const btn = actionBar.querySelector(`[data-reaction-btn="${reaction.enumKey}"]`);
                if (btn) {
                    btn.className = "transform active:scale-95 transition-all duration-200 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 border border-gray-200/40 flex items-center gap-1.5";
                }
            });
        }

        if (dataArray && dataArray.length > 0) {
            const liveSumTotal = dataArray.reduce((acc, obj) => acc + (Number(obj.count) || 0), 0);
            
            if (totalCountLabel) {
                totalCountLabel.innerHTML = `
                    <span class="material-symbols-outlined text-sm text-emerald-600" style="font-variation-settings: 'FILL' 1">favorite</span>
                    <span>${liveSumTotal} support responses</span>
                `;
            }

            reactionBin.innerHTML = '';
            
            dataArray.forEach(counter => {
                const designMetadata = reactionDisplayMap[counter.reaction_type] || { icon: "🤍", label: counter.reaction_type };
                const isMarkedByMe = counter.userHasReacted === true;

                const styleClasses = isMarkedByMe
                    ? "border-emerald-500 bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-500/10"
                    : "border-emerald-100 bg-emerald-50/60 text-emerald-800 font-semibold";

                const badge = document.createElement('button');
                badge.className = `px-3 py-1 rounded-full text-xs flex items-center gap-1.5 active:scale-110 transition-transform border ${styleClasses}`;
                badge.innerHTML = `<span>${designMetadata.icon}</span> <span>${designMetadata.label}</span> <span class="bg-emerald-600/10 text-emerald-700 px-1.5 py-0.2 rounded font-mono text-[11px]">${counter.count || 0}</span>`;
                
                badge.onclick = (e) => executeReactionToggle(postId, counter.reaction_type, e);
                reactionBin.appendChild(badge);

                if (isMarkedByMe && actionBar) {
                    const linkedActionBtn = actionBar.querySelector(`[data-reaction-btn="${counter.reaction_type}"]`);
                    if (linkedActionBtn) {
                        linkedActionBtn.className = "transform active:scale-95 transition-all duration-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-500 bg-emerald-100 text-emerald-800 flex items-center gap-1.5";
                    }
                }
            });
        } else {
            reactionBin.innerHTML = '<span class="text-xs text-gray-400 italic font-medium">No expressions left yet</span>';
            if (totalCountLabel) {
                totalCountLabel.innerHTML = `
                    <span class="material-symbols-outlined text-sm text-emerald-600" style="font-variation-settings: 'FILL' 1">favorite</span>
                    <span>0 support responses</span>
                `;
            }
        }
    } catch (e) {
        console.error("Error setting badge highlights:", e);
    }
}

// ====================================================
// ⚙️ AUXILIARY EVENT HANDLERS
// ====================================================

function setupFormInteractionListeners() {
    const postSubmissionBtn = document.querySelector('#postComposer button[onclick="toggleComposer()"]');
    if (postSubmissionBtn) {
        postSubmissionBtn.setAttribute('onclick', '');
        postSubmissionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dispatchNewExpression();
        });
    }

    const vibeButtons = document.querySelectorAll('#postComposer .flex.flex-wrap.gap-2 button');
    vibeButtons.forEach(btn => {
        const structuralClickString = btn.getAttribute('onclick');
        if (structuralClickString && structuralClickString.includes('selectEmotion')) {
            btn.setAttribute('onclick', '');
            btn.addEventListener('click', () => {
                const rawString = structuralClickString.match(/'([^']+)'/)[1];
                const emojiChar = rawString.split(' ')[0];
                selectedEmotionEnum = emotionEnumMap[emojiChar] || "HOPEFUL";
                if (typeof selectEmotion === 'function') selectEmotion(rawString);
            });
        }
    });
}

function parseJwtUserId(token) {
    if (!token || token === "null" || token === "undefined") return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload.id || payload.userId || payload.user_id;
    } catch (e) {
        return null;
    }
}

function computeRelativeTime(dateTimeString) {
    const now = new Date();
    const past = new Date(dateTimeString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now - past;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + 'h ago';
    return Math.round(elapsed / msPerDay) + 'd ago';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}