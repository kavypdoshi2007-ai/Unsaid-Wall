import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Import your central endpoints configuration

export default function GuestWall() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // --- Dynamic Backend States ---
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const filterCategories = ['All', 'Anxiety', 'Grief', 'Hope', 'Loneliness', 'Healing'];

    // --- Lifecycle Hook: Fetch Live Community Posts Feed ---
    useEffect(() => {
        async function fetchCommunityFeed() {
            setLoading(true);
            setError(null);
            try {
                // Hits the global endpoint mapped from api.js
                const response = await fetch(API_ENDPOINTS.POSTS.GET_FEED, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true' // <-- Bypasses the ngrok warning wrapper page completely
                    }
                });

                if (!response.ok) {
                    throw new Error(`Server responded with connection error status: ${response.status}`);
                }
                const data = await response.json();
                setPosts(data);
            } catch (err) {
                console.error("Express wall timeline network failure:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCommunityFeed();
    }, []);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleActionClick = (e) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    // Humanized timestamp utility to match backend prisma created_at keys
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

    // Frontend layout color mapper mapping individual category names to predefined Tailwind pills
    const getCategoryStyles = (category) => {
        switch (String(category).toLowerCase()) {
            case 'loneliness':
                return 'bg-tertiary-container/30 text-on-tertiary-container';
            case 'hope':
                return 'bg-secondary-container/30 text-on-secondary-container';
            case 'grief':
                return 'bg-error-container/20 text-error';
            case 'anxiety':
                return 'bg-primary-container/30 text-primary';
            default:
                return 'bg-surface-container-high text-on-surface-variant';
        }
    };

    // Client side rendering filter layer
    const filteredPosts = posts.filter(post => {
        if (activeCategory === 'All') return true;
        const postCategory = post.category || post.tagLabel || '';
        return postCategory.toLowerCase() === activeCategory.toLowerCase();
    });

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen">
            {/* Top App Bar */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(5,139,3,0.05)]">
                <div className="flex items-center justify-between px-container-padding h-16 w-full max-w-720 mx-auto">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform hover:opacity-80">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight">Unsaid Wall</h1>
                    </div>
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/guest-wall')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/coach-directory')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                        <button onClick={() => navigate('/login')} className="py-2 px-4 bg-primary text-on-primary rounded-full font-label-sm font-bold hover:opacity-90 transition-opacity ml-4 cursor-pointer">Login</button>
                    </div>
                </div>
            </header>

            <main className="pt-20 pb-32 px-4 max-w-720 mx-auto space-y-6">
                {/* Pinned Announcement */}
                <section className="glass-card rounded-xl p-5 border-l-4 border-l-primary relative overflow-hidden">
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

                {/* Controls: Sort & Filter */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="relative group">
                            <button className="flex items-center gap-1 text-on-surface-variant font-label-sm hover:text-primary transition-colors">
                                Sort By: Trending
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        {filterCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full font-label-sm transition-colors cursor-pointer ${activeCategory === cat
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-container'
                                    }`}
                            >
                                {cat === 'All' ? 'All Wall' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Post Cards Grid */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-16 text-outline font-body-lg italic animate-pulse">
                            Synchronizing public wall streams...
                        </div>
                    ) : error ? (
                        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/10 text-center text-sm">
                            Could not establish connection to live dataset nodes: {error}
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => {
                            const postCategory = post.category || post.tagLabel || 'Healing';
                            const empathyCount = post.reactions_count || (post.reactions ? post.reactions.length : 0) || 0;
                            const dynamicInsightCount = post.comments_count || (post.comments ? post.comments.length : 0) || 0;

                            return (
                                <article
                                    key={post.id || post._id}
                                    onMouseMove={handleMouseMove}
                                    className="glass-card p-6 rounded-lg space-y-4 shadow-[0px_4px_20px_rgba(5,139,3,0.03)] group transition-all duration-300"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wider ${getCategoryStyles(postCategory)}`}>
                                            {postCategory}
                                        </span>
                                        <span className="text-outline text-[11px] font-label-sm">
                                            {formatPostTime(post.created_at || post.createdAt)}
                                        </span>
                                    </div>
                                    <p className="font-body-lg text-on-surface leading-relaxed whitespace-pre-wrap">
                                        {post.content || post.text}
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 cursor-pointer">
                                            <span className="material-symbols-outlined text-lg">favorite</span>
                                            <span className="font-label-sm">{empathyCount}</span>
                                        </button>
                                        <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 cursor-pointer">
                                            <span className="material-symbols-outlined text-lg">chat_bubble</span>
                                            <span className="font-label-sm">{dynamicInsightCount}</span>
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-on-surface-variant bg-surface-container-low border border-outline-variant/20 rounded-xl italic">
                            No transparent reflections shared right now under the "{activeCategory}" banner.
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-6 bg-primary text-on-primary p-4 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform z-40 group cursor-pointer">
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
                    <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
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

            {/* Authentication Guard Warning Alert Modal Window */}
            {isModalOpen && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-card w-full max-w-[400px] p-8 rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col text-center bg-surface">
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
                            <button onClick={() => setIsModalOpen(false)} className="w-full py-3 text-outline font-label-sm text-sm font-bold hover:text-primary transition-colors cursor-pointer">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}