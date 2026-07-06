// public/workspace/js/userDashboard.js

const token = localStorage.getItem('token');
const BACKEND_URL = 'https://diminish-waving-shore.ngrok-free.dev/api';

// Create WebSocket listener as soon as the file loads
if (typeof io !== 'undefined' && token) {
    try {
        const base64Url = token.split('.')[1];
        const parsedToken = JSON.parse(atob(base64Url));
        const myUserId = parsedToken.id;

        socket = io({ auth: { token } });

        // Listen for the exact moment a coach clicks \"Accept\"
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

    const contextMessage = prompt("Briefly share what's on your mind (or leave empty):") || "User requested an open support session.";
    let actionContainer = document.getElementById('support-action-container');
    
    if (!actionContainer) {
        const fallbackBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Connect with a Support'));
        if (fallbackBtn) {
            actionContainer = fallbackBtn.parentElement;
        }
    }

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
        
        if (actionContainer) {
            actionContainer.innerHTML = `
                <button class="bg-[#006a30] text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all active:scale-95" onclick="startChat()">
                    Connect with a Support Specialist
                </button>
            `;
        }
    }
}

// ==========================================
// RENDER TIMELINE FEED WITH COMPILED ENUMS
// ==========================================

let userRole = 'guest';
if (token) {
    try {
        const base64Url = token.split('.')[1];
        const parsedToken = JSON.parse(atob(base64Url));
        userRole = parsedToken.role || 'user';
    } catch (e) {
        console.error("Failed parsing user role from token:", e);
    }
}

function getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const parsedToken = JSON.parse(atob(base64Url));
        return parsedToken.id || parsedToken.userId || parsedToken.user_id || null;
    } catch (e) {
        return null;
    }
}

async function loadFeed() {
    try {
        const response = await fetch(`${BACKEND_URL}/posts`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) throw new Error("Could not retrieve feed data.");
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error("Error building dashboard timeline:", error);
    }
}

function renderPosts(posts) {
    const feedContainer = document.getElementById('posts-feed-container') || document.querySelector('.space-y-4');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    const currentUserId = getCurrentUserId();

    posts.forEach(post => {
        let displayTime = "Just now";
        if (post.created_at) {
            const postDate = new Date(post.created_at);
            displayTime = postDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
                          ' at ' + 
                          postDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        // 1. CALCULATE INITIAL REACTION COUNTS AND LOGGED-IN USER SELECTION STATES
        let counts = { HEAR_YOU: 0, NOT_ALONE: 0, STRENGTH: 0, WILL_PASS: 0 };
        let userReacted = { HEAR_YOU: false, NOT_ALONE: false, STRENGTH: false, WILL_PASS: false };

        if (post.reactions && Array.isArray(post.reactions)) {
            post.reactions.forEach(reaction => {
                const typeKey = reaction.reaction_type || reaction.type;
                const reactionAuthorId = reaction.user_id || reaction.userId;
                
                if (typeKey && counts[typeKey] !== undefined) {
                    const countAmount = typeof reaction.count !== 'undefined' ? Number(reaction.count) : 1;
                    counts[typeKey] += countAmount;
                    
                    if (currentUserId && (reactionAuthorId === currentUserId || reaction.userHasReacted === true)) {
                        userReacted[typeKey] = true;
                    }
                }
            });
        }

        // Build Guidance comments text block safely if present
        let commentsListHtml = '';
        const hasComments = post.comments && post.comments.length > 0;
        if (hasComments) {
            commentsListHtml = post.comments.map(comment => `
                <div class="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/40 mb-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1">verified_user</span>
                            Coach ${comment.user?.coach_profile?.name || 'Verified Professional'}
                        </span>
                        <span class="text-[10px] text-zinc-400">${new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-sm text-zinc-700 ml-1">${comment.content}</p>
                </div>
            `).join('');
        }

        const commentFormHtml = (typeof userRole !== 'undefined' && userRole === 'coach') ? `
            <div class="mt-3 pt-3 border-t border-zinc-100">
                <div class="flex gap-2">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write professional guidance..." 
                        class="w-full text-xs rounded-xl border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:ring-emerald-500 focus:border-emerald-500">
                    <button onclick="submitCoachComment('${post.id}')" 
                        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-sm">send</span>
                    </button>
                </div>
            </div>
        ` : '';

        let guidanceWrapperHtml = '';
        if (hasComments || (typeof userRole !== 'undefined' && userRole === 'coach')) {
            guidanceWrapperHtml = `
                <div class="mt-4 pt-3 border-t border-zinc-100">
                    <h4 class="text-[11px] font-bold text-zinc-400 font-['Plus_Jakarta_Sans'] uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">forum</span> Coach Guidance
                    </h4>
                    <div id="comments-list-${post.id}">
                        ${commentsListHtml}
                    </div>
                    ${commentFormHtml}
                </div>
            `;
        }

        const postCard = `
            <div class="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm mb-4" id="post-card-${post.id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <span class="font-['Plus_Jakarta_Sans'] font-semibold text-sm text-zinc-800">${post.display_name || 'Anonymous'}</span>
                        <span class="text-[11px] px-2.5 py-0.5 ml-2 rounded-full bg-emerald-100 text-emerald-800 font-medium">${post.emotion}</span>
                    </div>
                    <span class="text-xs text-zinc-400 font-['Plus_Jakarta_Sans']">${displayTime}</span>
                </div>
                <p class="text-zinc-700 font-['Literata'] text-base leading-relaxed mb-4">${post.content}</p>

                <div class="flex flex-wrap items-center gap-2 pb-1 text-xs font-['Plus_Jakarta_Sans']">
                    
                    <button onclick="toggleReaction(this, '${post.id}', 'HEAR_YOU')" data-type="HEAR_YOU"
                        class="group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${userReacted.HEAR_YOU ? 'text-emerald-600 bg-emerald-50/50' : 'text-zinc-500 hover:bg-emerald-50/30'}">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${userReacted.HEAR_YOU ? '1' : '0'};">sentiment_satisfied</span>
                        <span class="font-semibold btn-label">Hear You (${counts.HEAR_YOU})</span>
                    </button>

                    <button onclick="toggleReaction(this, '${post.id}', 'NOT_ALONE')" data-type="NOT_ALONE"
                        class="group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${userReacted.NOT_ALONE ? 'text-emerald-600 bg-emerald-50/50' : 'text-zinc-500 hover:bg-emerald-50/30'}">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${userReacted.NOT_ALONE ? '1' : '0'};">favorite</span>
                        <span class="font-semibold btn-label">Not Alone (${counts.NOT_ALONE})</span>
                    </button>

                    <button onclick="toggleReaction(this, '${post.id}', 'STRENGTH')" data-type="STRENGTH"
                        class="group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${userReacted.STRENGTH ? 'text-emerald-600 bg-emerald-50/50' : 'text-zinc-500 hover:bg-emerald-50/30'}">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${userReacted.STRENGTH ? '1' : '0'};">fitness_center</span>
                        <span class="font-semibold btn-label">Strength (${counts.STRENGTH})</span>
                    </button>

                    <button onclick="toggleReaction(this, '${post.id}', 'WILL_PASS')" data-type="WILL_PASS"
                        class="group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${userReacted.WILL_PASS ? 'text-emerald-600 bg-emerald-50/50' : 'text-zinc-500 hover:bg-emerald-50/30'}">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' ${userReacted.WILL_PASS ? '1' : '0'};">air</span>
                        <span class="font-semibold btn-label">Will Pass (${counts.WILL_PASS})</span>
                    </button>

                </div>

                ${guidanceWrapperHtml}
            </div>
        `;

        feedContainer.insertAdjacentHTML('beforeend', postCard);
    });
}

// Global toggle handler connecting payload variables to your backend endpoint
async function toggleReaction(buttonElement, postId, reactionType) {
    if (!postId || postId === "undefined" || !reactionType) return;

    // Grab the token from localStorage just like app.js does
    const sessionToken = localStorage.getItem('token');
    if (!sessionToken) {
        alert("Please log in to react to expressions.");
        return;
    }

    const icon = buttonElement.querySelector('.material-symbols-outlined');
    const countLabel = buttonElement.querySelector('.btn-label');
    if (!countLabel) return;

    const match = countLabel.innerText.match(/\d+/);
    let currentCount = match ? parseInt(match[0]) : 0;
    
    const isFilled = icon.style.fontVariationSettings && icon.style.fontVariationSettings.includes("'FILL' 1");
    const labels = { HEAR_YOU: 'Hear You', NOT_ALONE: 'Not Alone', STRENGTH: 'Strength', WILL_PASS: 'Will Pass' };

    // 1. Optimistic UI Toggle
    if (isFilled) {
        icon.style.fontVariationSettings = "'FILL' 0";
        buttonElement.className = "group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 text-zinc-500 hover:bg-emerald-50/30";
        currentCount = Math.max(0, currentCount - 1);
        countLabel.innerText = `${labels[reactionType]} (${currentCount})`;
    } else {
        icon.style.fontVariationSettings = "'FILL' 1";
        buttonElement.className = "group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 text-emerald-600 bg-emerald-50/50";
        currentCount = currentCount + 1;
        countLabel.innerText = `${labels[reactionType]} (${currentCount})`;
    }

    try {
        // 2. Aligned Network Payload Dispatch
        const response = await fetch(`${BACKEND_URL}/reactions/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ 
                post_id: postId, 
                reaction_type: reactionType 
            })
        });

        if (!response.ok) throw new Error(`Server returned status code ${response.status}`);

        // 3. Database Sync Verification Path
        const syncResponse = await fetch(`${BACKEND_URL}/reactions/post/${postId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (syncResponse.ok) {
            const rawReactions = await syncResponse.json();
            
            let currentUserId = getCurrentUserId();

            let freshCounts = { HEAR_YOU: 0, NOT_ALONE: 0, STRENGTH: 0, WILL_PASS: 0 };
            let freshUserReacted = { HEAR_YOU: false, NOT_ALONE: false, STRENGTH: false, WILL_PASS: false };

            if (Array.isArray(rawReactions)) {
                rawReactions.forEach(r => {
                    const typeKey = r.reaction_type || r.type;
                    const countAmount = typeof r.count !== 'undefined' ? Number(r.count) : 1;
                    const reactionAuthorId = r.user_id || r.userId;
                    
                    if (typeKey && freshCounts[typeKey] !== undefined) {
                        freshCounts[typeKey] += countAmount;
                    }

                    if (currentUserId && (reactionAuthorId === currentUserId || r.userHasReacted === true)) {
                        freshUserReacted[typeKey] = true;
                    }
                });
            }

            const postCardElement = document.getElementById(`post-card-${postId}`);
            if (postCardElement) {
                const buttons = postCardElement.querySelectorAll('button[data-type]');
                buttons.forEach(btn => {
                    const type = btn.getAttribute('data-type');
                    const btnIcon = btn.querySelector('.material-symbols-outlined');
                    const btnLabel = btn.querySelector('.btn-label');
                    
                    if (btnIcon && btnLabel) {
                        const activeState = freshUserReacted[type];
                        btnIcon.style.fontVariationSettings = `'FILL' ${activeState ? '1' : '0'}`;
                        btn.className = `group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${activeState ? 'text-emerald-600 bg-emerald-50/50' : 'text-zinc-500 hover:bg-emerald-50/30'}`;
                        btnLabel.innerText = `${labels[type]} (${freshCounts[type]})`;
                    }
                });
            }
        }

    } catch (err) {
        console.error("Failed persisting interaction data event:", err);
        // Clean UI Rollback
        if (isFilled) {
            icon.style.fontVariationSettings = "'FILL' 1";
            buttonElement.className = "group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 text-emerald-600 bg-emerald-50/50";
            countLabel.innerText = `${labels[reactionType]} (${currentCount + 1})`;
        } else {
            icon.style.fontVariationSettings = "'FILL' 0";
            buttonElement.className = "group/btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 text-zinc-500 hover:bg-emerald-50/30";
            countLabel.innerText = `${labels[reactionType]} (${Math.max(0, currentCount - 1)})`;
        }
    }
}

// Global function to process comment submission directly to database
async function submitCoachComment(postId) {
    const inputField = document.getElementById(`comment-input-${postId}`);
    const content = inputField.value.trim();
    if (!content) return;

    try {
        const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            const data = await response.json();
            inputField.value = '';

            const listContainer = document.getElementById(`comments-list-${postId}`);
            const inlineCommentMarkup = `
                <div class="bg-emerald-50/60 dark:bg-zinc-800/60 p-3 rounded-xl border border-emerald-100/40 dark:border-zinc-700/40 mb-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold font-['Plus_Jakarta_Sans'] text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm font-fill" style="font-variation-settings: 'FILL' 1">verified_user</span>
                            Coach ${data.user?.coach_profile?.name || 'Verified Professional'}
                        </span>
                        <span class="text-[10px] text-zinc-400">Just now</span>
                    </div>
                    <p class="text-sm font-['Plus_Jakarta_Sans'] text-zinc-700 dark:text-zinc-300 ml-1">${data.content}</p>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', inlineCommentMarkup);
        } else {
            const err = await response.json();
            alert(err.error || "Failed to post comment.");
        }
    } catch (error) {
        console.error("Failed executing comment submission:", error);
    }
}

// Auto-initialize timeline feed when the dashboard script mounts
document.addEventListener('DOMContentLoaded', loadFeed);