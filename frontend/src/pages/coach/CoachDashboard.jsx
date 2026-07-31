import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { API_ENDPOINTS } from '../../config/api';

export default function CoachDashboard() {
    const navigate = useNavigate();

    // Core States
    const [isAvailable, setIsAvailable] = useState(true);
    const [coachInfo, setCoachInfo] = useState({
        name: 'Dr. Aris',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBfL93zvogk848jRg7EFYBwbzIIgpR0jYdwaG_U131VOHXqsBRnXyU6gObKATqAtEyKKN849eA-BXpCxcmrubrGdyF7iY8p5mTwMtbWQt0g1pwWsGLBMQFzJRwKCRZGt9QtlJR51o3Dbjvg1RW8izRE1VQF9aLkLmrAUWZaE56iqYcSLrFkOgVo9_itc3ANI6Nz5xRr7tZo14aw_K2tiJySUYg_NMMwSIy5FpfORiJZIo88uQQczeTqKVLKI-LOrqhiuJNGjAOGGBO',
        activeJourneys: 0,
        sessionsTodayCount: 0,
        totalClients: 0,
        rating: 5.0
    });
    const [activeSessions, setActiveSessions] = useState([]);
    const [flaggedPosts, setFlaggedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch live session data from endpoints
    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            };

            try {
                // 1. Fetch Dynamic Coach Profile Info
                const profileRes = await fetch(API_ENDPOINTS.COACHES.GET_MY_PROFILE, { headers });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setCoachInfo({
                        name: profileData.name || 'Dr. Aris',
                        avatarUrl: profileData.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBfL93zvogk848jRg7EFYBwbzIIgpR0jYdwaG_U131VOHXqsBRnXyU6gObKATqAtEyKKN849eA-BXpCxcmrubrGdyF7iY8p5mTwMtbWQt0g1pwWsGLBMQFzJRwKCRZGt9QtlJR51o3Dbjvg1RW8izRE1VQF9aLkLmrAUWZaE56iqYcSLrFkOgVo9_itc3ANI6Nz5xRr7tZo14aw_K2tiJySUYg_NMMwSIy5FpfORiJZIo88uQQczeTqKVLKI-LOrqhiuJNGjAOGGBO',
                        activeJourneys: 0,
                        sessionsTodayCount: profileData.sessionsTodayCount || 0,
                        totalClients: profileData.sessions_count || 0,
                        rating: profileData.rating ? parseFloat(profileData.rating) : 5.0
                    });
                }

                // 2. Fetch Live Sessions Queue
                const sessionsRes = await fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, { headers });
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    const active = sessionsData.filter(s => {
                        const currentStatus = (s.status || '').toLowerCase().trim();
                        return currentStatus === 'active';
                    });

                    setActiveSessions(active);
                    setCoachInfo(prev => ({ ...prev, activeJourneys: active.length }));
                }

                // 3. Fetch All Posts and Filter Active Crisis Alerts
                const postsRes = await fetch(API_ENDPOINTS.POSTS.GET_MOD_QUEUE, { headers });
                if (postsRes.ok) {
                    const allPosts = await postsRes.json();

                    // Filter for posts that meet crisis criteria
                    let crisisPosts = allPosts.filter(post =>
                        post.flag_level ||
                        post.is_flagged ||
                        post.status === 'flagged' ||
                        post.emotion === 'Severe Distress'
                    );

                    setFlaggedPosts(crisisPosts);
                }
            } catch (error) {
                console.error("Error loading coach dashboard analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Smart string utility matched directly to use Prisma include properties
    const resolveClientName = (item, defaultFallback = 'Anonymous User') => {
        if (!item) return defaultFallback;
        // Direct post string match
        if (item.display_name) return item.display_name;
        // Include relations structure parsing
        if (item.user && item.user.display_name_pool && item.user.display_name_pool.length > 0) {
            return item.user.display_name_pool[0];
        }
        const name = item.clientName || item.userName || item.username || item.authorName;
        if (name) return name;

        const identifier = item.id || item._id;
        return identifier ? `Anonymous User #${String(identifier).slice(-4)}` : defaultFallback;
    };

    const getInitials = (nameString) => {
        const cleaned = nameString.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        if (!cleaned) return 'AU';
        return cleaned.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
                <p className="font-body-lg text-body-lg animate-pulse">Loading Coach Dashboard Analytics...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface overflow-hidden">
            <Navbar />
            <div className="flex flex-1 pt-16 lg:mb-10">
                {/* Main Content Area */}
                <main className="w-full flex-1 p-4 md:p-8 overflow-y-auto pb-28 lg:pb-8">
                    <div className="max-w-6xl mx-auto space-y-10">

                        {/* Welcome Section */}
                        <section aria-labelledby="welcome-heading">
                            <h2 className="font-display-lg text-display-lg text-on-surface" id="welcome-heading">Welcome back, {coachInfo.name}</h2>
                            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                                You have {activeSessions.length} chat sessions active and {flaggedPosts.length} flagged posts requiring review.
                            </p>
                        </section>

                        {/* Metrics Layout */}
                        <section aria-label="Quick statistics" className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                            <div className="glass-card p-6 rounded-lg flex flex-col gap-2 border border-outline-variant/20 transition-all hover:translate-y-[-4px]">
                                <span className="material-symbols-outlined text-primary text-[32px]">calendar_today</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Sessions</span>
                                <span className="text-[32px] font-bold text-on-surface">{activeSessions.length}</span>
                            </div>
                            <div className="glass-card p-6 rounded-lg flex flex-col gap-2 border border-outline-variant/20 transition-all hover:translate-y-[-4px]">
                                <span className="material-symbols-outlined text-secondary text-[32px]">group</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Clients</span>
                                <span className="text-[32px] font-bold text-on-surface">{coachInfo.totalClients}</span>
                            </div>
                            <div className="glass-card p-6 rounded-lg flex flex-col gap-2 border border-outline-variant/20 transition-all hover:translate-y-[-4px]">
                                <span className="material-symbols-outlined text-primary-fixed-dim text-[32px]">star</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Client Rating</span>
                                <span className="text-[32px] font-bold text-on-surface">{coachInfo.rating}</span>
                            </div>
                        </section>

                        {/* Single Column Layout (Removed Sidebar) */}
                        <div className="space-y-10">

                            {/* Dynamic Active Sessions */}
                            <section className="space-y-4">
                                <h3 className="font-headline-md text-headline-md text-on-surface">Active Sessions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeSessions.length > 0 ? (
                                        activeSessions.map((session) => {
                                            const solvedName = resolveClientName(session, 'Active Client');
                                            const sessionId = session.id || session._id;
                                            return (
                                                <div key={sessionId} className="glass-card p-4 rounded-lg border border-primary/20 flex items-center justify-between group hover:bg-white/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container shrink-0">
                                                            {getInitials(solvedName)}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-label-sm text-label-sm font-bold truncate">{solvedName}</p>
                                                            <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[14px]">forum</span> Chat Only
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate('/coach-chat', { state: { sessionId } })}
                                                        className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-sm text-label-sm font-bold hover:shadow-lg transition-all active:scale-95 cursor-pointer ml-2"
                                                    >
                                                        Join
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full glass-card p-8 rounded-lg border border-outline-variant/10 text-center text-on-surface-variant font-body-md">
                                            No active chat sessions at the moment.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Dynamic Active Crisis Alerts */}
                            <section aria-labelledby="flagged-posts-title" className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-headline-md text-headline-md text-on-surface" id="flagged-posts-title">Active Crisis Alerts</h3>
                                    <div aria-label={`${flaggedPosts.length} active alerts`} className="bg-error text-white text-[10px] px-3 py-1 rounded-full flex items-center justify-center font-bold animate-pulse">
                                        {flaggedPosts.length} HIGH PRIORITY
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {flaggedPosts.length > 0 ? (
                                        flaggedPosts.map((post) => {
                                            const solvedName = resolveClientName(post, 'Anonymous User');
                                            return (
                                                <article key={post.id || post._id} className="glass-card p-6 rounded-lg border-l-4 border-error relative overflow-hidden group shadow-[0_0_15px_rgba(176,37,0,0.1)] flex flex-col">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold shrink-0">
                                                                <span className="material-symbols-outlined text-[20px]">warning</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-label-sm text-label-sm font-bold">{solvedName}</p>
                                                                <p className="text-[12px] text-on-surface-variant">Flagged for: {post.emotion || post.flag_reason || 'Severe Distress Pattern'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-error text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider shrink-0">
                                                            {post.flag_level || post.status || 'Crisis'}
                                                        </div>
                                                    </div>
                                                    <blockquote className="font-body-md text-body-md text-on-surface leading-relaxed mb-6 flex-1 italic border-l-2 border-outline-variant/30 pl-4 ml-2">
                                                        "{post.content || post.text || post.message}"
                                                    </blockquote>
                                                    <div className="flex flex-wrap gap-3 mt-auto">
                                                        <button className="bg-error text-on-error px-6 py-2 rounded-full font-label-sm text-label-sm font-bold hover:brightness-110 transition-all cursor-pointer">
                                                            Intervene Now
                                                        </button>
                                                        <button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-label-sm text-label-sm font-bold hover:bg-surface-container-high transition-all cursor-pointer">
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full glass-card p-8 rounded-lg border border-outline-variant/10 text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-2 block">verified</span>
                                            No active crisis alerts requiring immediate intervention.
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}