import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../../components/Navbar'; // Adjust path as needed

// Keep your backend endpoint centralized so it works everywhere
const BACKEND_URL = 'https://diminish-waving-shore.ngrok-free.dev/api';

export default function UserWall() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [error, setError] = useState(null);

    // --- State Variables ---
    const [posts, setPosts] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [userRole, setUserRole] = useState('user');
    const [currentUserId, setCurrentUserId] = useState(null);

    // Custom Notification State for Crisis Alerts
    const [notification, setNotification] = useState(null);

    // Support Session State
    const [sessionStatus, setSessionStatus] = useState('idle'); // idle | loading | pending | accepted
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Composer Modal State
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [activeLang, setActiveLang] = useState('en');
    const [postText, setPostText] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState({ emoji: '亰', label: 'Overwhelmed' });
    const [previewUsername, setPreviewUsername] = useState('Loading...');

    // Inline Coach Comment State
    const [commentInputs, setCommentInputs] = useState({}); // format: { [postId]: 'text' }

    // --- Parse User Token Data ---
    useEffect(() => {
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const parsedToken = JSON.parse(atob(base64Url));
                setUserRole(parsedToken.role || 'user');
                setCurrentUserId(parsedToken.id || parsedToken.userId || parsedToken.user_id || null);
            } catch (e) {
                console.error("Failed parsing user data from token:", e);
            }
        }
    }, [token]);

    // --- Initialize WebSockets for Live Help Sessions ---
    useEffect(() => {
        if (!token || !currentUserId) return;

        const socket = io('https://diminish-waving-shore.ngrok-free.dev', {
            transports: ['websocket'],
            upgrade: false,
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on(`session_accepted_${currentUserId}`, (data) => {
            setSessionStatus('accepted');
            setActiveSessionId(data.sessionId);
        });

        return () => {
            socket.disconnect();
        };
    }, [token, currentUserId]);

    // --- Fetch and Synchronize Feed ---
    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoadingFeed(true);
            const response = await fetch(`${BACKEND_URL}/posts`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;

                if (response.status === 403) {
                    throw new Error(`Access Denied: ${errorMessage}`);
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();

            const sortedPosts = data.sort((a, b) => {
                const dateA = new Date(a.created_at || a.createdAt || 0);
                const dateB = new Date(b.created_at || b.createdAt || 0);
                return dateB - dateA;
            });

            setPosts(sortedPosts);

        } catch (error) {
            console.error("Error building dashboard timeline:", error);
            setError(error.message);
        } finally {
            setLoadingFeed(false);
        }
    };

    // --- Create / Request Support Session Loop ---
    const startSupportSession = async () => {
        if (!token) {
            alert("Your authentication session has expired. Please log in to request real-time support.");
            return;
        }

        const contextMessage = prompt("Briefly share what's on your mind (or leave empty):") || "User requested an open support session.";
        setSessionStatus('loading');

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

            setSessionStatus('pending');
        } catch (err) {
            console.error("Session request loop crashed:", err);
            alert(`Could not start support session: ${err.message}`);
            setSessionStatus('idle');
        }
    };

    // --- Post Submission Logic with Live Identity Preview ---
    const openComposer = async () => {
        setIsComposerOpen(true);
        setPreviewUsername('Generating anonymous identity...');
        try {
            const response = await fetch(`${BACKEND_URL}/posts/username`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPreviewUsername(data.display_name);
            } else {
                setPreviewUsername('AnonymousUser#00');
            }
        } catch (error) {
            console.error("Error fetching preview username:", error);
            setPreviewUsername('AnonymousUser#00');
        }
    };

    // 検 FIX: Cleaned up submission logic to correctly handle the 403 response
    const handlePostSubmit = async () => {
        if (!postText.trim()) return;

        try {
            const response = await fetch(`${BACKEND_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    content: postText,
                    language: activeLang,
                    emotion: 'REFLECTION',
                    display_name: previewUsername
                })
            });

            // 検 TRIGGER: Intercept Crisis Flag
            if (response.status === 403) {
                setNotification({
                    title: "Support Alert",
                    message: "Your post has been kept private. We hear you, and you are not alone. Let's connect you with a supportive space right now.\n\niCall (9152987821)\nVandrevala Foundation (1860-2662-345)",
                    type: "warning"
                });
                setIsComposerOpen(false);
                setPostText('');
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to post.");
            }

            setPostText('');
            setIsComposerOpen(false);
            fetchFeed();
        } catch (error) {
            console.error("Error submitting expression:", error);
        }
    };

    // --- Interactive Reactions Handling With Network Synchronization ---
    const toggleReaction = async (postId, reactionType) => {
        if (!token) {
            alert("Please log in to react to expressions.");
            return;
        }

        const updatedPosts = posts.map(post => {
            if (post.id !== postId) return post;

            let reactions = Array.isArray(post.reactions) ? [...post.reactions] : [];
            const existingReactionIdx = reactions.findIndex(r => r.reaction_type === reactionType && (r.user_id === currentUserId || r.userHasReacted));

            if (existingReactionIdx > -1) {
                const target = reactions[existingReactionIdx];
                if (Number(target.count) > 1) {
                    reactions[existingReactionIdx] = { ...target, count: Number(target.count) - 1, userHasReacted: false };
                } else {
                    reactions.splice(existingReactionIdx, 1);
                }
            } else {
                reactions.push({ reaction_type: reactionType, count: 1, userHasReacted: true, user_id: currentUserId });
            }

            return { ...post, reactions };
        });
        setPosts(updatedPosts);

        try {
            await fetch(`${BACKEND_URL}/reactions/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ post_id: postId, reaction_type: reactionType })
            });

            const syncResponse = await fetch(`${BACKEND_URL}/reactions/post/${postId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
            });

            if (syncResponse.ok) {
                const freshReactions = await syncResponse.json();
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: freshReactions } : p));
            }
        } catch (err) {
            console.error("Failed persisting interaction data event:", err);
            setError("Failed to update reaction. Please try again.");
            fetchFeed();
        }
    };

    // --- Post Coach Guidance Comments ---
    const handleCommentChange = (postId, val) => {
        setCommentInputs(prev => ({ ...prev, [postId]: val }));
    };

    const submitCoachComment = async (postId) => {
        const text = commentInputs[postId]?.trim();
        if (!text) return;

        try {
            const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: text })
            });

            if (response.ok) {
                const newComment = await response.json();
                setCommentInputs(prev => ({ ...prev, [postId]: '' }));

                setPosts(prev => prev.map(post => {
                    if (post.id !== postId) return post;
                    const existingComments = Array.isArray(post.comments) ? post.comments : [];
                    return { ...post, comments: [...existingComments, newComment] };
                }));
            }
        } catch (error) {
            console.error("Failed executing comment submission:", error);
        }
    };

    const getReactionDetails = (post, type) => {
        let count = 0;
        let reacted = false;
        if (post.reactions && Array.isArray(post.reactions)) {
            post.reactions.forEach(r => {
                if (r.reaction_type === type || r.type === type) {
                    count += typeof r.count !== 'undefined' ? Number(r.count) : 1;
                    if (currentUserId && (r.user_id === currentUserId || r.userHasReacted === true)) {
                        reacted = true;
                    }
                }
            });
        }
        return { count, reacted };
    };

    return (
        <div className="bg-background text-on-surface font-body-md min-h-screen pb-24 overflow-x-hidden">
            <Navbar />

            <main className="pt-24 px-6 max-w-[720px] mx-auto space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <section id="support-action-container" className="w-full">
                    {sessionStatus === 'idle' && (
                        <div className="p-4 bg-white/40 border border-zinc-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                            <p className="text-sm text-zinc-600">Need real-time immediate human guidance?</p>
                            <button onClick={startSupportSession} className="bg-surface-variant text-on-surface-variant hover:brightness-95 text-xs font-bold px-5 py-3 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer">
                                Connect with a Support Specialist
                            </button>
                        </div>
                    )}

                    {sessionStatus === 'loading' && (
                        <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center shadow-sm">
                            <p className="font-bold text-sm text-amber-800">Processing verification tokens...</p>
                        </div>
                    )}

                    {sessionStatus === 'pending' && (
                        <div id="user-session-status-box" className="p-6 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></span>
                                <p className="font-bold text-sm text-amber-800">竢ｳ Request sent to all active coaches.</p>
                            </div>
                            <p className="text-xs text-amber-600 mt-2">Waiting for a coach to accept... Keep this dashboard open.</p>
                        </div>
                    )}

                    {sessionStatus === 'accepted' && (
                        <div id="user-session-status-box" className="p-6 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 text-center shadow-md animate-in fade-in">
                            <p className="font-extrabold text-base text-emerald-800">脂 Connection Established!</p>
                            <p className="text-xs text-emerald-700 mt-1">A support specialist has accepted your session request.</p>
                            <a href={`/User_Chat.html?session_id=${activeSessionId}`} className="mt-4 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95">
                                Join Live Chat Session Now
                            </a>
                        </div>
                    )}
                </section>

                <div id="posts-feed-container" className="space-y-6 pb-12">
                    {loadingFeed ? (
                        <div className="text-center py-12">
                            <div className="animate-spin inline-block w-6 h-6 border-[3px] border-emerald-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : posts.length === 0 ? (
                        <p className="text-center text-zinc-400 italic py-12">The wall is completely silent. Be the first to express.</p>
                    ) : (
                        posts.map((post) => {
                            const hr = getReactionDetails(post, 'HEAR_YOU');
                            const na = getReactionDetails(post, 'NOT_ALONE');
                            const st = getReactionDetails(post, 'STRENGTH');
                            const wp = getReactionDetails(post, 'WILL_PASS');

                            return (
                                <article key={post.id} className="bg-white/40 border border-white/50 rounded-lg p-6 shadow-[0_4px_20px_rgba(5,139,3,0.05)] transition-all duration-200 active:scale-[0.99]">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="font-['Plus_Jakarta_Sans'] font-semibold text-sm text-zinc-800">{post.display_name || 'Anonymous'}</span>
                                            <span className="bg-surface-variant text-on-surface-variant font-label-sm text-[10px] px-2 py-0.5 ml-2 rounded-full">{post.emotion}</span>
                                        </div>
                                        <span className="text-xs text-zinc-400">
                                            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>

                                    <p className="text-zinc-700 font-['Literata'] text-base leading-relaxed mb-4">{post.content}</p>

                                    <div className="flex flex-wrap items-center gap-2 pb-1 text-[12px] font-label-sm mt-2">
                                        <button onClick={() => toggleReaction(post.id, 'HEAR_YOU')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-transform active:scale-110 ${hr.reacted ? 'bg-surface-variant text-on-surface-variant' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/50'}`}>
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${hr.reacted ? '1' : '0'}` }}>sentiment_satisfied</span>
                                            <span className="font-semibold">Hear You ({hr.count})</span>
                                        </button>

                                        <button onClick={() => toggleReaction(post.id, 'NOT_ALONE')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-transform active:scale-110 ${na.reacted ? 'bg-surface-variant text-on-surface-variant' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/50'}`}>
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${na.reacted ? '1' : '0'}` }}>favorite</span>
                                            <span className="font-semibold">Not Alone ({na.count})</span>
                                        </button>

                                        <button onClick={() => toggleReaction(post.id, 'STRENGTH')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-transform active:scale-110 ${st.reacted ? 'bg-surface-variant text-on-surface-variant' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/50'}`}>
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${st.reacted ? '1' : '0'}` }}>fitness_center</span>
                                            <span className="font-semibold">Strength ({st.count})</span>
                                        </button>

                                        <button onClick={() => toggleReaction(post.id, 'WILL_PASS')} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-transform active:scale-110 ${wp.reacted ? 'bg-surface-variant text-on-surface-variant' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant/50'}`}>
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${wp.reacted ? '1' : '0'}` }}>air</span>
                                            <span className="font-semibold">Will Pass ({wp.count})</span>
                                        </button>
                                    </div>

                                    {((post.comments && post.comments.length > 0) || userRole === 'coach') && (
                                        <div className="mt-4 pt-3 border-t border-zinc-100">
                                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">forum</span> Coach Guidance
                                            </h4>

                                            <div id={`comments-list-${post.id}`} className="space-y-2">
                                                {post.comments?.map((comment, index) => (
                                                    <div key={index} className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/40">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                                                Coach {comment.user?.coach_profile?.name || 'Verified Professional'}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-700 ml-1">{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {userRole === 'coach' && (
                                                <div className="mt-3 pt-3 border-t border-zinc-100">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={commentInputs[post.id] || ''}
                                                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                                            placeholder="Write professional guidance..."
                                                            className="w-full text-xs rounded-xl border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                        <button onClick={() => submitCoachComment(post.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
                                                            <span className="material-symbols-outlined text-sm">send</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
            </main>

            <button onClick={openComposer} className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center active:scale-90 transition-all z-50 cursor-pointer">
                <span className="material-symbols-outlined">add</span>
            </button>

            {notification && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm min-w-[320px] text-center border-t-4 border-error flex flex-col items-center box-border">
                        <span className="material-symbols-outlined text-error text-5xl mb-4">warning</span>
                        <h3 className="font-bold text-lg mb-3 text-on-surface">{notification.title}</h3>
                        <p className="text-sm text-zinc-600 mb-6 leading-relaxed w-full text-center" style={{ whiteSpace: 'pre-line' }}>
                            {notification.message}
                        </p>
                        <button
                            onClick={() => setNotification(null)}
                            className="w-full bg-error text-white font-bold py-3 rounded-xl cursor-pointer hover:bg-error/90 transition-all shadow-sm active:scale-[0.98]"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}

            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-transform duration-500 ease-out flex flex-col ${isComposerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="mt-auto w-full max-w-[720px] mx-auto bg-surface backdrop-blur-xl rounded-t-2xl shadow-2xl relative overflow-hidden border-t border-outline-variant/20">
                    <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto my-4 cursor-pointer" onClick={() => setIsComposerOpen(false)}></div>
                    <div className="px-6 pb-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline-md text-headline-md text-on-surface">New Expression</h2>
                            <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/30">
                                {['en', 'hi', 'gu'].map(lang => (
                                    <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1 rounded-full text-label-sm uppercase transition-all duration-300 cursor-pointer ${activeLang === lang ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}>{lang}</button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <textarea value={postText} onChange={(e) => setPostText(e.target.value)} maxLength={280} className="w-full h-40 p-5 bg-surface-container-lowest/60 border border-outline-variant/30 rounded-lg font-body-lg text-on-surface focus:ring-2 focus:ring-primary/50 outline-none resize-none" placeholder="Type your thoughts here... no judgment, just space."></textarea>
                            <div className="absolute bottom-4 right-4 text-label-sm text-on-surface-variant/70">{postText.length} / 280</div>
                        </div>

                        <div className="space-y-4">
                            <button onClick={handlePostSubmit} className="w-full h-14 bg-primary text-on-primary font-label-sm text-lg rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <span>Post Expression</span>
                                <span className="material-symbols-outlined">send</span>
                            </button>
                            <p className="text-center text-label-sm text-on-surface-variant">
                                Posting anonymously as <span className="font-bold text-secondary">{previewUsername}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}