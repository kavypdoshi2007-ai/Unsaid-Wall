import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Central configuration endpoints[cite: 2]

export default function GuestWall() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const navigate = useNavigate();

    // --- Dynamic Backend States ---
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- User Session Parsing States ---
    const token = localStorage.getItem('token'); //[cite: 3]
    const [userRole, setUserRole] = useState('guest'); //[cite: 3]
    const [currentUserId, setCurrentUserId] = useState(null); //[cite: 3]

    // --- Composer Form State (For logged-in users) ---
    const [isComposerOpen, setIsComposerOpen] = useState(false); //[cite: 3]
    const [postText, setPostText] = useState(''); //[cite: 3]
    const [activeLang, setActiveLang] = useState('en'); //[cite: 3]
    const [previewUsername, setPreviewUsername] = useState('Generating anonymous identity...'); //[cite: 3]

    // --- Inline Coach Comment State ---
    const [commentInputs, setCommentInputs] = useState({}); // format: { [postId]: 'text' }[cite: 3]

    // --- Decode User Credentials ---
    useEffect(() => {
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const parsedToken = JSON.parse(atob(base64Url));
                setUserRole(parsedToken.role || 'user'); //[cite: 3]
                setCurrentUserId(parsedToken.id || parsedToken.userId || parsedToken.user_id || null); //[cite: 3]
            } catch (e) {
                console.error("Failed parsing user data from token:", e);
            }
        }
    }, [token]);

    // --- Lifecycle Hook: Fetch Live Feed ---
    const fetchCommunityFeed = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_ENDPOINTS.POSTS.GET_FEED, { //[cite: 2]
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '', // Passthrough authentication context safely[cite: 3]
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' //[cite: 2]
                }
            });

            if (!response.ok) {
                throw new Error(`Server responded with connection error status: ${response.status}`);
            }
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            console.error("Expression wall timeline network failure:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunityFeed();
    }, [token]);

    // --- Post Creator Modal Control Box ---
    const handleOpenComposer = async () => {
        if (!token) {
            setIsAuthModalOpen(true);
            return;
        }
        setIsComposerOpen(true);
        setPreviewUsername('Generating anonymous identity...'); //[cite: 3]
        try {
            const response = await fetch(API_ENDPOINTS.POSTS.PREVIEW_USERNAME, { //[cite: 2]
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true' 
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPreviewUsername(data.display_name); //[cite: 3]
            } else {
                setPreviewUsername('AnonymousUser#00'); //[cite: 3]
            }
        } catch (error) {
            console.error("Error fetching preview username:", error);
            setPreviewUsername('AnonymousUser#00'); //[cite: 3]
        }
    };

    const handlePostSubmit = async () => {
        if (!postText.trim()) return;

        try {
            const response = await fetch(API_ENDPOINTS.POSTS.CREATE, { //[cite: 2]
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` //[cite: 3]
                },
                body: JSON.stringify({
                    content: postText, //[cite: 3]
                    language: activeLang, //[cite: 3]
                    emotion: 'HEALING', // Default general tag[cite: 3]
                    display_name: previewUsername //[cite: 3]
                })
            });

            if (response.ok) {
                setPostText(''); //[cite: 3]
                setIsComposerOpen(false); //[cite: 3]
                fetchCommunityFeed(); // Refresh stream[cite: 3]
            }
        } catch (error) {
            console.error("Error submitting expression:", error);
        }
    };

    // --- Interactive Reactions Network Synchronization Loop ---
    const handleToggleReaction = async (postId, reactionType) => {
        if (!token) {
            setIsAuthModalOpen(true);
            return;
        }

        // Optimistic UI Render Step[cite: 3]
        const updatedPosts = posts.map(post => {
            if (post.id !== postId) return post;
            let reactions = Array.isArray(post.reactions) ? [...post.reactions] : [];
            const existingReactionIdx = reactions.findIndex(r => r.reaction_type === reactionType && (r.user_id === currentUserId || r.userHasReacted)); //[cite: 3]

            if (existingReactionIdx > -1) {
                const target = reactions[existingReactionIdx];
                if (Number(target.count) > 1) {
                    reactions[existingReactionIdx] = { ...target, count: Number(target.count) - 1, userHasReacted: false }; //[cite: 3]
                } else {
                    reactions.splice(existingReactionIdx, 1); //[cite: 3]
                }
            } else {
                reactions.push({ reaction_type: reactionType, count: 1, userHasReacted: true, user_id: currentUserId }); //[cite: 3]
            }
            return { ...post, reactions };
        });
        setPosts(updatedPosts);

        try {
            await fetch(API_ENDPOINTS.REACTIONS.TOGGLE, { //[cite: 2]
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` //[cite: 3]
                },
                body: JSON.stringify({ post_id: postId, reaction_type: reactionType }) //[cite: 3]
            });

            // Fetch absolute source-of-truth count for this post card node[cite: 3]
            const syncResponse = await fetch(API_ENDPOINTS.REACTIONS.GET_BY_POST(postId), { //[cite: 2]
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } //[cite: 3]
            });

            if (syncResponse.ok) {
                const freshReactions = await syncResponse.json();
                setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: freshReactions } : p)); //[cite: 3]
            }
        } catch (err) {
            console.error("Failed persisting interaction data event:", err);
            fetchCommunityFeed(); // Rollback to server snapshot state on network crash[cite: 3]
        }
    };

    // --- Post Coach Guidance Comments ---
    const submitCoachComment = async (postId) => {
        const text = commentInputs[postId]?.trim(); //[cite: 3]
        if (!text) return;

        try {
            const response = await fetch(API_ENDPOINTS.POSTS.ADD_COMMENT(postId), { //[cite: 2]
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` //[cite: 3]
                },
                body: JSON.stringify({ content: text }) //[cite: 3]
            });

            if (response.ok) {
                const newComment = await response.json();
                setCommentInputs(prev => ({ ...prev, [postId]: '' })); // Clear input field safely[cite: 3]

                // Append comment layout array directly to view node without structural fetch reloads
                setPosts(prev => prev.map(post => {
                    if (post.id !== postId) return post;
                    const existingComments = Array.isArray(post.comments) ? post.comments : [];
                    return { ...post, comments: [...existingComments, newComment] }; //[cite: 3]
                }));
            }
        } catch (error) {
            console.error("Failed executing comment submission:", error);
        }
    };

    // --- Helper to match, compile and parse specific backend interactions ---
    const getReactionDetails = (post, type) => {
        let count = 0;
        let reacted = false;
        if (post.reactions && Array.isArray(post.reactions)) {
            post.reactions.forEach(r => {
                if (r.reaction_type === type || r.type === type) { //[cite: 3]
                    count += typeof r.count !== 'undefined' ? Number(r.count) : 1; //[cite: 3]
                    if (currentUserId && (r.user_id === currentUserId || r.userHasReacted === true)) { //[cite: 3]
                        reacted = true; //[cite: 3]
                    }
                }
            });
        }
        return { count, reacted };
    };

    const handleProtectedNav = (path) => {
        if (!token) {
            setIsAuthModalOpen(true);
        } else {
            navigate(path);
        }
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    };

    const formatPostTime = (isoString) => {
        if (!isoString) return 'Just now';
        const postDate = new Date(isoString);
        const now = new Date();
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getCategoryStyles = (category) => {
        switch (String(category).toLowerCase()) {
            case 'loneliness': return 'bg-tertiary-container/30 text-on-tertiary-container';
            case 'hope': return 'bg-secondary-container/30 text-on-secondary-container';
            case 'grief': return 'bg-error-container/20 text-error';
            case 'anxiety': return 'bg-primary-container/30 text-primary';
            default: return 'bg-surface-container-high text-on-surface-variant';
        }
    };

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen bg-surface-container-lowest">
            {/* Top App Bar */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(5,139,3,0.05)] border-b border-outline-variant/10">
                <div className="flex items-center justify-between px-6 h-16 w-full max-w-720 mx-auto">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform hover:opacity-80">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-bold">Unsaid Wall</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/guest-wall')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Wall</button>
                        <button onClick={() => handleProtectedNav('/journal')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-directory')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                        {token ? (
                            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="py-2 px-4 bg-outline/10 text-outline rounded-full font-label-sm font-bold hover:bg-outline/20 transition-all cursor-pointer">Logout</button>
                        ) : (
                            <button onClick={() => navigate('/login')} className="py-2 px-4 bg-primary text-on-primary rounded-full font-label-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">Login</button>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-20 pb-32 px-4 max-w-720 mx-auto space-y-6">
                {/* Pinned Announcement */}
                <section className="glass-card rounded-xl p-5 border-l-4 border-l-primary relative overflow-hidden bg-surface shadow-sm">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <span className="material-symbols-outlined text-6xl">campaign</span>
                    </div>
                    <div className="flex gap-3 items-start relative z-10">
                        <div className="bg-primary-container p-2 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container text-xl">campaign</span>
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-headline-md text-sm font-bold text-primary">Community Guidelines Updated</h2>
                            <p className="font-body-md text-sm text-on-surface-variant">We've added new resources for the Healing community. Please take a look at the updated moderation policy.</p>
                        </div>
                    </div>
                </section>

                {/* Dynamic Post Feed Mapping */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-16 text-outline font-body-lg italic animate-pulse">
                            Synchronizing public wall streams...
                        </div>
                    ) : error ? (
                        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/10 text-center text-sm">
                            Could not establish connection to live dataset nodes: {error}
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map((post) => {
                            const postCategory = post.category || post.emotion || 'Healing'; //[cite: 3]
                            const postId = post.id || post._id; //[cite: 3]

                            const hr = getReactionDetails(post, 'HEAR_YOU'); //[cite: 3]
                            const na = getReactionDetails(post, 'NOT_ALONE'); //[cite: 3]
                            const st = getReactionDetails(post, 'STRENGTH'); //[cite: 3]
                            const wp = getReactionDetails(post, 'WILL_PASS'); //[cite: 3]

                            return (
                                <article
                                    key={postId}
                                    onMouseMove={handleMouseMove}
                                    className="glass-card p-6 rounded-2xl space-y-4 shadow-sm bg-white border border-outline-variant/10 group transition-all duration-300"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-on-surface">{post.display_name || 'AnonymousUser'}</span> {/*[cite: 3] */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryStyles(postCategory)}`}>
                                                {postCategory}
                                            </span>
                                        </div>
                                        <span className="text-outline text-xs">
                                            {formatPostTime(post.created_at || post.createdAt)}
                                        </span>
                                    </div>
                                    <p className="font-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap font-serif text-base">
                                        {post.content || post.text}
                                    </p>

                                    {/* Action Interactivity Bar */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/5 text-xs">
                                        <button onClick={() => handleToggleReaction(postId, 'HEAR_YOU')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${hr.reacted ? 'text-primary bg-primary-container/40' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${hr.reacted ? '1' : '0'}` }}>sentiment_satisfied</span> {/*[cite: 3] */}
                                            <span>Hear You ({hr.count})</span> {/*[cite: 3] */}
                                        </button>

                                        <button onClick={() => handleToggleReaction(postId, 'NOT_ALONE')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${na.reacted ? 'text-primary bg-primary-container/40' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${na.reacted ? '1' : '0'}` }}>favorite</span> {/*[cite: 3] */}
                                            <span>Not Alone ({na.count})</span> {/*[cite: 3] */}
                                        </button>

                                        <button onClick={() => handleToggleReaction(postId, 'STRENGTH')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${st.reacted ? 'text-primary bg-primary-container/40' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${st.reacted ? '1' : '0'}` }}>fitness_center</span> {/*[cite: 3] */}
                                            <span>Strength ({st.count})</span> {/*[cite: 3] */}
                                        </button>

                                        <button onClick={() => handleToggleReaction(postId, 'WILL_PASS')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${wp.reacted ? 'text-primary bg-primary-container/40' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: `'FILL' ${wp.reacted ? '1' : '0'}` }}>air</span> {/*[cite: 3] */}
                                            <span>Will Pass ({wp.count})</span> {/*[cite: 3] */}
                                        </button>
                                    </div>

                                    {/* Coach Comment Feed Thread */}
                                    {((post.comments && post.comments.length > 0) || userRole === 'coach') && ( //[cite: 3]
                                        <div className="mt-4 pt-3 border-t border-outline-variant/20">
                                            <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">forum</span> Coach Guidance
                                            </h4>

                                            <div className="space-y-2">
                                                {post.comments?.map((comment, index) => (
                                                    <div key={index} className="bg-primary-container/20 p-3 rounded-xl border border-primary-container/10">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                                                Coach {comment.user?.coach_profile?.name || 'Verified Professional'} {/*[cite: 3] */}
                                                            </span>
                                                            <span className="text-[10px] text-outline">
                                                                {formatPostTime(comment.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-on-surface-variant ml-1">{comment.content}</p> {/*[cite: 3] */}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actionable interface reserved exclusively for coaches */}
                                            {userRole === 'coach' && ( //[cite: 3]
                                                <div className="mt-3 pt-3 border-t border-outline-variant/10">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={commentInputs[postId] || ''} //[cite: 3]
                                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [postId]: e.target.value }))} //[cite: 3]
                                                            placeholder="Write professional guidance..."
                                                            className="w-full text-xs rounded-xl border-outline-variant/40 bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                        <button onClick={() => submitCoachComment(postId)} className="bg-primary hover:opacity-90 text-on-primary font-bold px-3 py-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer"> {/*[cite: 3] */}
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
                    ) : (
                        <div className="text-center py-12 text-on-surface-variant bg-surface-container-low border border-outline-variant/20 rounded-xl italic">
                            The wall is completely silent. Be the first to express.
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <button onClick={handleOpenComposer} className="fixed bottom-24 right-6 bg-primary text-on-primary p-4 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform z-40 group cursor-pointer">
                <span className="material-symbols-outlined">edit_note</span>
                <span className="font-label-sm pr-2">Share Something</span>
            </button>

            {/* Bottom Navigation Ribbon */}
            <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-xl shadow-[0px_-4px_24px_rgba(5,139,3,0.08)] z-50 rounded-t-xl">
                <div className="flex justify-around items-center px-4 py-3 pb-safe max-w-720 mx-auto">
                    <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1.5 cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                        <span className="font-label-sm text-label-sm">Wall</span>
                    </button>
                    <button onClick={() => handleProtectedNav('/journal')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">auto_stories</span>
                        <span className="font-label-sm text-label-sm">Journal</span>
                    </button>
                    <button onClick={() => navigate('/coach-directory')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">psychology</span>
                        <span className="font-label-sm text-label-sm">Coaches</span>
                    </button>
                    <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">local_library</span>
                        <span className="font-label-sm text-label-sm">Resources</span>
                    </button>
                </div>
            </nav>

            {/* Full-Sheet Composer Modal Drawer for Authenticated Writing */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-transform duration-500 ease-out flex flex-col ${isComposerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="mt-auto w-full max-w-[720px] mx-auto bg-surface rounded-t-2xl shadow-2xl relative border-t border-outline-variant/20">
                    <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto my-4 cursor-pointer" onClick={() => setIsComposerOpen(false)}></div>
                    <div className="px-6 pb-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline-md font-bold text-xl text-on-surface">New Expression</h2>
                            <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/30">
                                {['en', 'hi', 'gu'].map(lang => (
                                    <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1 rounded-full text-xs uppercase font-bold transition-all ${activeLang === lang ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>{lang}</button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <textarea value={postText} onChange={(e) => setPostText(e.target.value)} maxLength={280} className="w-full h-40 p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl font-body-lg text-on-surface outline-none resize-none focus:border-primary" placeholder="Type your thoughts here... no judgment, just space."></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-outline">{postText.length} / 280</div>
                        </div>

                        <div className="space-y-4">
                            <button onClick={handlePostSubmit} className="w-full h-12 bg-primary text-on-primary font-bold rounded-full shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <span>Post Expression</span>
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                            <p className="text-center text-xs text-on-surface-variant">
                                Posting anonymously as <span className="font-bold text-primary">{previewUsername}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Authentication Guard Alert Window */}
            {isAuthModalOpen && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setIsAuthModalOpen(false) }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-card w-full max-w-[400px] p-8 rounded-2xl shadow-2xl flex flex-col text-center bg-surface border border-outline-variant/10">
                        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                            <span className="material-symbols-outlined text-3xl">lock</span>
                        </div>

                        <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-3">Community Space</h3>
                        <p className="text-on-surface-variant font-body-md mb-8 text-sm leading-relaxed">
                            To protect the safety and anonymity of our wall, please login or register to share your thoughts or send empathy.
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-on-primary rounded-full font-label-sm text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                                Login / Register
                            </button>
                            <button onClick={() => setIsAuthModalOpen(false)} className="w-full py-3 text-outline font-label-sm text-sm font-bold hover:text-primary transition-colors cursor-pointer">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}