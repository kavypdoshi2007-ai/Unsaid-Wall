import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar'; 
import { API_ENDPOINTS } from '../../config/api'; // Central endpoint configuration

export default function AdminModeration() {
    const navigate = useNavigate();
    const [flaggedPosts, setFlaggedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [flagLevelFilter, setFlagLevelFilter] = useState('crisis');
    const [visibilityFilter, setVisibilityFilter] = useState('hidden');

    // 🌟 Fetch database posts using Option 1 endpoint
    useEffect(() => {
        const fetchModerationQueue = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(API_ENDPOINTS.POSTS.GET_ALL_ADMIN, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (res.ok) {
                    const allPosts = await res.json();
                    setFlaggedPosts(allPosts);
                }
            } catch (error) {
                console.error("Error fetching admin moderation posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchModerationQueue();
    }, []);

    // Filter logic based on selected flag_level and visibility
    const filteredPosts = useMemo(() => {
        return flaggedPosts.filter(post => {
            // Flag level filtering
            const matchesFlagLevel = flagLevelFilter === 'all' || 
                (post.flag_level && String(post.flag_level).toLowerCase() === flagLevelFilter.toLowerCase());

            // Visibility filtering (hidden vs public)
            const isHidden = Boolean(post.is_hidden);
            let matchesVisibility = true;
            if (visibilityFilter === 'hidden') {
                matchesVisibility = isHidden === true;
            } else if (visibilityFilter === 'public') {
                matchesVisibility = isHidden === false;
            }

            return matchesFlagLevel && matchesVisibility;
        });
    }, [flaggedPosts, flagLevelFilter, visibilityFilter]);

    // Helper function to extract a clean name
    const resolveClientName = (item) => {
        if (!item) return 'Anonymous User';
        if (item.display_name) return item.display_name;
        if (item.user && item.user.display_name_pool && item.user.display_name_pool.length > 0) {
            return item.user.display_name_pool[0];
        }
        return `User_${String(item.id || item._id).slice(-4)}`;
    };

    // 🌟 Toggle Visibility (Hide / Unhide) via backend endpoint
    const handleToggleVisibility = async (postId, currentHiddenStatus) => {
        const token = localStorage.getItem('token');
        const nextHiddenState = !currentHiddenStatus;

        try {
            const res = await fetch(API_ENDPOINTS.POSTS.MODERATE(postId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ is_hidden: nextHiddenState })
            });

            if (res.ok) {
                // Optimistically update the UI state to show updated visibility status
                setFlaggedPosts(prev =>
                    prev.map(post => {
                        if ((post.id || post._id) === postId) {
                            return { ...post, is_hidden: nextHiddenState };
                        }
                        return post;
                    })
                );
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to update post visibility.");
            }
        } catch (error) {
            console.error("Error updating visibility:", error);
            alert("Network error updating post visibility.");
        }
    };

    // Action Handlers for other interactions
    const handleAction = (postId, action) => {
        console.log(`Action [${action}] triggered for post ID: ${postId}`);
        alert(`Post has been marked as: ${action}`);
    };

    return (
        <div className="bg-background text-on-surface min-h-screen antialiased overflow-x-hidden">
            <Navbar />

            <main className="pt-28 px-6 md:px-12 pb-24 max-w-[1440px] mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-display-lg text-display-lg text-on-surface mb-2 text-primary">Post Moderation Queue</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                            Review flagged content to ensure the "Unsaid Wall" remains a safe, garden-like space for healing and quiet strength.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Flag Level Filter Controls */}
                        <div className="flex items-center gap-1 bg-surface-variant/40 px-3 py-1.5 rounded-full border border-outline-variant/30 text-xs">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_alt</span>
                            <span className="font-bold text-on-surface-variant mr-1">Flag:</span>
                            <select 
                                value={flagLevelFilter} 
                                onChange={(e) => setFlagLevelFilter(e.target.value)}
                                className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-background text-on-surface">All Levels</option>
                                <option value="safe" className="bg-background text-on-surface">Safe</option>
                                <option value="concerning" className="bg-background text-on-surface">Concerning</option>
                                <option value="crisis" className="bg-background text-on-surface">Crisis</option>
                            </select>
                        </div>

                        {/* Visibility Filter Controls */}
                        <div className="flex items-center gap-1 bg-surface-variant/40 px-3 py-1.5 rounded-full border border-outline-variant/30 text-xs">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">visibility</span>
                            <span className="font-bold text-on-surface-variant mr-1">Status:</span>
                            <select 
                                value={visibilityFilter} 
                                onChange={(e) => setVisibilityFilter(e.target.value)}
                                className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-background text-on-surface">All Statuses</option>
                                <option value="public" className="bg-background text-on-surface">Public</option>
                                <option value="hidden" className="bg-background text-on-surface">Hidden</option>
                            </select>
                        </div>

                        <span className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                            {filteredPosts.length} Displayed
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-4">
                        {loading ? (
                            <div className="glass-card rounded-xl p-8 border border-outline-variant/30 text-center animate-pulse text-on-surface-variant">
                                Loading moderation queue from database...
                            </div>
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map(post => {
                                const solvedName = resolveClientName(post);
                                const isHidden = post.is_hidden;

                                // Safely extract user ID from potential schema variations
                                const userId = post.user_id || post.userId || (post.user && (post.user.id || post.user._id));

                                return (
                                    <div key={post.id || post._id} className="glass-card rounded-xl p-6 border border-outline-variant/30 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                {/* Clickable Username to User Profile */}
                                                <h3 
                                                    onClick={() => userId && navigate(`/admin/users/${userId}`)}
                                                    className={`font-bold text-lg text-on-surface ${userId ? 'hover:text-primary hover:underline cursor-pointer transition-colors' : ''}`}
                                                    title={userId ? "View user profile" : "User ID unavailable"}
                                                >
                                                    {solvedName}
                                                </h3>

                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">flag</span>
                                                        {post.flag_level || 'Flagged'}
                                                    </span>
                                                    <span className="text-[11px] text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">
                                                        Emotion: {post.emotion || 'Unknown'}
                                                    </span>
                                                    {/* Status badge reflecting data accurately */}
                                                    {isHidden ? (
                                                        <span className="text-[10px] uppercase font-bold bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">visibility_off</span> Hidden
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] uppercase font-bold bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">visibility</span> Public
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-on-surface-variant">
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                                            </span>
                                        </div>

                                        <p className="italic mb-6 border-l-4 border-primary/40 pl-4 text-on-surface leading-relaxed">
                                            "{post.content || post.text}"
                                        </p>

                                        <div className="flex flex-wrap gap-3 border-t border-outline-variant/10 pt-4">
                                            {/* Dynamic Hide / Unhide Toggle Button */}
                                            {isHidden ? (
                                                <button
                                                    onClick={() => handleToggleVisibility(post.id || post._id, true)}
                                                    className="px-6 py-2 rounded-full border border-tertiary text-tertiary text-sm font-bold hover:bg-tertiary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span> Unhide
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleVisibility(post.id || post._id, false)}
                                                    className="px-6 py-2 rounded-full border border-error text-error text-sm font-bold hover:bg-error hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility_off</span> Hide
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleAction(post.id || post._id, 'Kept')}
                                                className="px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span> Keep
                                            </button>
                                            <button
                                                onClick={() => handleAction(post.id || post._id, 'Support Sent')}
                                                className="px-6 py-2 rounded-full border border-secondary text-secondary text-sm font-bold hover:bg-secondary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">medical_services</span> Send Support
                                            </button>
                                            <button
                                                onClick={() => handleAction(post.id || post._id, 'Assigned')}
                                                className="px-6 py-2 rounded-full border border-outline text-on-surface-variant text-sm font-bold hover:bg-surface-variant transition-all cursor-pointer flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">support_agent</span> Assign
                                            </button>
                                            <button
                                                onClick={() => handleAction(post.id || post._id, 'Banned')}
                                                className="px-6 py-2 rounded-full border border-error text-error text-sm font-bold hover:bg-error hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                                title="Ban User"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">block</span> Block
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="glass-card rounded-xl p-12 border border-outline-variant/30 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 text-primary/40 block">check_circle</span>
                                <p className="font-bold text-lg text-on-surface">Queue is clear</p>
                                <p>No posts match the current filter criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Queue Health & Action Log */}
                    <aside className="xl:col-span-4 space-y-6">

                        {/* Queue Health Stats */}
                        <div className="glass-card rounded-xl p-6 border border-outline-variant/30 shadow-sm">
                            <h2 className="font-headline-md text-headline-md text-secondary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">health_and_safety</span>
                                Queue Health
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-label-sm uppercase tracking-widest text-on-surface-variant">Avg Response Time</span>
                                        <span className="text-xl font-bold text-primary">14m 20s</span>
                                    </div>
                                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full" style={{ width: '78%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant mt-1">Faster than 92% of platforms (Target: &lt;15m)</p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-label-sm uppercase tracking-widest text-on-surface-variant">Safety Score</span>
                                        <span className="text-xl font-bold text-secondary">98.4%</span>
                                    </div>
                                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                                        <div className="bg-secondary h-full rounded-full" style={{ width: '98.4%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant mt-1">Quiet Strength Index is Optimal</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-on-surface">1,240</div>
                                        <div className="text-[10px] uppercase font-bold text-on-surface-variant">Today Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-error">{flaggedPosts.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-on-surface-variant">Unresolved</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Log */}
                        <div className="glass-card rounded-xl p-6 border border-outline-variant/30 shadow-sm">
                            <h2 className="font-headline-md text-headline-md text-secondary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">history</span>
                                Action Log
                            </h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="flex gap-3 text-sm border-l-2 border-primary pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="text-on-surface"><span className="font-bold">Moderator Sarah</span> kept Post #7821</p>
                                        <span className="text-[10px] text-on-surface-variant">2 mins ago • Reason: Expression of grief</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm border-l-2 border-error pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="text-on-surface"><span className="font-bold">Moderator John</span> hid Post #9921</p>
                                        <span className="text-[10px] text-on-surface-variant">14 mins ago • Reason: Triggering Content</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm border-l-2 border-tertiary pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="text-on-surface"><span className="font-bold">System</span> flagged Post #0012</p>
                                        <span className="text-[10px] text-on-surface-variant">22 mins ago • Auto-Detection: Spam</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm border-l-2 border-secondary pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="text-on-surface"><span className="font-bold">Moderator Sarah</span> assigned Post #9104</p>
                                        <span className="text-[10px] text-on-surface-variant">25 mins ago • To: Crisis Coach #4</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm border-l-2 border-outline-variant pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="text-on-surface"><span className="font-bold">Moderator John</span> updated settings</p>
                                        <span className="text-[10px] text-on-surface-variant">1 hour ago • Auto-filter sensitivity +5%</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-6 text-primary text-sm font-bold flex items-center justify-center gap-1 hover:underline cursor-pointer">
                                View Full History <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>

                        {/* Visual Atmosphere: Abstract Garden Texture */}
                        <div className="relative h-40 rounded-xl overflow-hidden shadow-inner">
                            <img alt="Atmosphere" className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfS5Tr7KpAtKhkS_0QokN347bdIQya6uT7du2WGpjsD-RJVU-y_TyK2WAaclnGo6bPDTqHJJqDMNcNiE9-l40LVLR7lgzs1ILF2BofHEzeM3PNHzaInTCOUCbvpR0CqgkkBir63QUttI-eJ1cjBR0XWQONkvt6OeXmWYr_M15IlbrMJ9DLUHW5guDwxKyRKRzPtxMBY5IgtWbdq6sUua0DEVa-9tKOE0MINJ-qXttYaV-apAuXibJQ9CSNW-CTALAtUv2_H-rFY9uV" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Environment Status</p>
                                <p className="text-lg font-display-lg text-on-surface">Garden Lush & Safe</p>
                            </div>
                        </div>

                    </aside>
                </div>
            </main>
        </div>
    );
}