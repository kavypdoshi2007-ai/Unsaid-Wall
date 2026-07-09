import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Corrected path to config folder

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
    const [pendingRequests, setPendingRequests] = useState([]);
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
                        activeJourneys: 0, // corrected below once live session data is fetched
                        sessionsTodayCount: profileData.sessionsTodayCount || 0,
                        totalClients: profileData.sessions_count || 0,
                        rating: profileData.rating || 5.0
                    });
                }

                // 2. Fetch Live Sessions Queue
                const sessionsRes = await fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, { headers });
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    console.log("Raw Session Data from Backend:", sessionsData); // Inspect data fields

                    // Safe mapping that handles casing variations (lowercase/uppercase/missing data)
                    const active = sessionsData.filter(s => {
                        const currentStatus = (s.status || '').toLowerCase().trim();
                        return currentStatus === 'active';
                    });

                    const pending = sessionsData.filter(s => {
                        const currentStatus = (s.status || '').toLowerCase().trim();
                        return currentStatus === 'pending';
                    });

                    setActiveSessions(active);
                    setPendingRequests(pending);
                    // Now that we know the real count, correct the sidebar's "active journeys" stat
                    setCoachInfo(prev => ({ ...prev, activeJourneys: active.length }));
                }

                // 3. Fetch Mod Flagged Posts
                // 3. Fetch Mod Queue directly
                const postsRes = await fetch(API_ENDPOINTS.POSTS.GET_MOD_QUEUE, { headers });
                if (postsRes.ok) {
                    const flagged = await postsRes.json();
                    setFlaggedPosts(flagged); // No extra .filter() layout filtering needed on frontend!
                }
            } catch (error) {
                console.error("Error loading coach dashboard analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Session status state transition updates
    const handleUpdateSessionStatus = async (sessionId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.SESSIONS.UPDATE_STATUS(sessionId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Instantly filter out or push state changes locally to avoid structural refresh delays
                if (newStatus === 'accepted') {
                    const acceptedItem = pendingRequests.find(req => (req.id || req._id) === sessionId);
                    setPendingRequests(prev => prev.filter(req => (req.id || req._id) !== sessionId));
                    if (acceptedItem) {
                        setActiveSessions(prev => [...prev, { ...acceptedItem, status: 'active' }]);
                    }
                } else {
                    setPendingRequests(prev => prev.filter(req => (req.id || req._id) !== sessionId));
                }
            }
        } catch (error) {
            console.error("Failed to update dynamic session state:", error);
        }
    };

    // Sign Out Action Handler — clears session and returns to login
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Smart string utility to resolve name combinations cleanly
    const resolveClientName = (item, defaultFallback = 'Anonymous User') => {
        if (!item) return defaultFallback;
        const name = item.clientName || item.userName || item.username || item.authorName;
        if (name) return name;
        // If an explicit sequential database context tracking counter or mongo ID exists, append it 
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
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 z-50 flex items-center px-4 md:px-6 justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="font-display-lg text-[24px] font-bold text-primary">Unsaid Wall</h1>
                    <span aria-hidden="true" className="hidden sm:block h-4 w-px bg-outline-variant/30"></span>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full">
                        <span className="material-symbols-outlined text-[18px] text-on-secondary-container">verified_user</span>
                        <span className="font-label-sm text-label-sm text-on-secondary-container">Practitioner Workspace</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
                        <span className="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant">Availability</span>
                        <button
                            aria-label="Toggle availability status"
                            onClick={() => setIsAvailable(!isAvailable)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${isAvailable ? 'bg-primary' : 'bg-on-surface-variant'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`}></span>
                        </button>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden ring-2 ring-primary/10 shrink-0">
                        <img alt={coachInfo.name} className="w-full h-full object-cover" src={coachInfo.avatarUrl} />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-16 lg:mb-10">
                {/* Sidebar Navigation */}
                <nav className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-104px)] w-64 bg-surface-container flex-col py-6 space-y-2 z-40 border-r border-outline-variant/10 overflow-y-auto">
                    <div className="px-6 mb-8">
                        <p className="font-headline-md text-headline-md text-secondary leading-tight">Coach Workspace</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Managing {coachInfo.activeJourneys} active journeys</p>
                    </div>
                    <ul className="space-y-1 px-2">
                        <li>
                            <button onClick={() => navigate('/coach-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-label-sm text-label-sm text-left transition-all cursor-pointer">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span> Dashboard
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/guest-wall')} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant rounded-xl transition-all font-label-sm text-label-sm text-left cursor-pointer">
                                <span className="material-symbols-outlined">forum</span> Client Wall
                            </button>
                        </li>
                    </ul>
                    <div className="mt-auto px-4 pt-6 border-t border-outline-variant/10 space-y-6">
                        <button onClick={() => navigate('/coach-chat')} className="w-full py-3 bg-primary text-on-primary rounded-full font-label-sm text-label-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">add</span> Start Session
                        </button>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => navigate('/help-center')} className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[20px]">help</span> Help Center
                            </button>
                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-error hover:opacity-80 font-label-sm text-label-sm transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[20px]">logout</span> Sign Out
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="w-full lg:ml-64 flex-1 p-4 md:p-8 overflow-y-auto pb-28 lg:pb-8">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Welcome Section */}
                        <section aria-labelledby="welcome-heading">
                            <h2 className="font-display-lg text-display-lg text-on-surface" id="welcome-heading">Welcome back, {coachInfo.name}</h2>
                            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                                You have {activeSessions.length} chat sessions active and {flaggedPosts.length} flagged posts requiring review.
                            </p>
                        </section>

                        {/* Metrics: 3-column Layout */}
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

                        <div className="grid grid-cols-12 gap-gutter">
                            {/* Left/Center Column */}
                            <div className="col-span-12 lg:col-span-8 space-y-8">
                                {/* Active Sessions */}
                                <section className="space-y-4">
                                    <h3 className="font-headline-md text-headline-md text-on-surface">Active Sessions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {activeSessions.length > 0 ? (
                                            activeSessions.map((session) => {
                                                const solvedName = resolveClientName(session, 'Active Client');
                                                return (
                                                    <div key={session.id || session._id} className="glass-card p-4 rounded-lg border border-primary/20 flex items-center justify-between group hover:bg-white/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container">
                                                                {getInitials(solvedName)}
                                                            </div>
                                                            <div>
                                                                <p className="font-label-sm text-label-sm font-bold">{solvedName}</p>
                                                                <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">forum</span> Chat Only
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate('/coach-chat', { state: { sessionId: session.id || session._id } })}
                                                            className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-sm text-label-sm font-bold hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            Join
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-2 glass-card p-8 rounded-lg border border-outline-variant/10 text-center text-on-surface-variant font-body-md">
                                                No active chat sessions at the moment.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Flagged Wall Posts */}
                                <section aria-labelledby="flagged-posts-title" className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-headline-md text-headline-md text-on-surface" id="flagged-posts-title">Flagged Wall Posts</h3>
                                        <button className="text-primary font-label-sm text-label-sm hover:underline cursor-pointer">View All</button>
                                    </div>

                                    {flaggedPosts.length > 0 ? (
                                        flaggedPosts.map((post) => {
                                            const solvedName = resolveClientName(post, 'Anonymous User');
                                            return (
                                                <article key={post.id || post._id} className="glass-card p-6 rounded-lg border-l-4 border-error relative overflow-hidden group shadow-sm">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-[12px]">
                                                                {getInitials(solvedName)}
                                                            </div>
                                                            <div>
                                                                <p className="font-label-sm text-label-sm font-bold">{solvedName}</p>
                                                                <p className="text-[12px] text-on-surface-variant">Flagged for: {post.emotion || 'Distress Pattern'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-error/10 text-error px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">priority_high</span> {post.riskLevel || 'High Risk'}
                                                        </div>
                                                    </div>
                                                    <blockquote className="font-body-md text-body-md text-on-surface leading-relaxed mb-6 italic">
                                                        "{post.content || post.text}"
                                                    </blockquote>
                                                    <div className="flex flex-wrap gap-3">
                                                        <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-sm text-label-sm font-bold hover:shadow-lg transition-all cursor-pointer">Reach Out Now</button>
                                                        <button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full font-label-sm text-label-sm font-bold hover:bg-surface-container-high transition-all cursor-pointer">Dismiss</button>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <div className="glass-card p-6 rounded-lg border border-outline-variant/10 text-center text-on-surface-variant">
                                            No wall expressions flagged for review.
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Sidebar Widgets */}
                            <aside className="col-span-12 lg:col-span-4 space-y-6">
                                {/* Upcoming Sessions */}
                                <section aria-labelledby="upcoming-sessions-title" className="bg-surface-container-low rounded-lg p-6 shadow-sm border border-outline-variant/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-on-surface-variant" id="upcoming-sessions-title">Upcoming</h4>
                                        <span className="material-symbols-outlined text-primary">event_upcoming</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                                            <div className="w-12 h-12 rounded-lg bg-primary-container flex flex-col items-center justify-center text-on-primary-container font-bold shrink-0">
                                                <span className="text-[10px]">OCT</span>
                                                <span className="text-[18px] leading-none">24</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-label-sm text-label-sm font-bold truncate">Gentle Rain</p>
                                                <p className="text-[12px] text-on-surface-variant">10:30 AM • 50 mins</p>
                                            </div>
                                            <span className="material-symbols-outlined text-[18px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">forum</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-6 py-2 border border-outline text-on-surface font-label-sm text-label-sm rounded-full hover:bg-surface-container transition-colors cursor-pointer">Full Schedule</button>
                                </section>

                                {/* Pending Requests */}
                                <section aria-labelledby="pending-requests-title" className="bg-surface-container-low rounded-lg p-6 shadow-sm border border-outline-variant/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-on-surface-variant" id="pending-requests-title">Requests</h4>
                                        <div aria-label={`${pendingRequests.length} pending requests`} className="bg-error text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                                            {pendingRequests.length}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {pendingRequests.length > 0 ? (
                                            pendingRequests.map((req) => {
                                                const solvedName = resolveClientName(req, 'Anonymous User');
                                                return (
                                                    <div key={req.id || req._id} className="p-4 bg-surface-container rounded-lg border border-primary/10 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-[12px]">
                                                                {getInitials(solvedName)}
                                                            </div>
                                                            <p className="font-label-sm text-label-sm font-bold">{solvedName}</p>
                                                        </div>
                                                        <p className="text-[12px] text-on-surface-variant">Matching for: {req.focusArea || 'Grief counseling, Mindfulness'}</p>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleUpdateSessionStatus(req.id || req._id, 'accepted')}
                                                                className="flex-1 py-1.5 bg-primary text-on-primary text-[11px] rounded-full font-bold hover:opacity-90 transition-opacity cursor-pointer"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateSessionStatus(req.id || req._id, 'declined')}
                                                                className="flex-1 py-1.5 border border-outline text-on-surface text-[11px] rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/10 text-center text-on-surface-variant text-[12px]">
                                                No incoming match requests.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Atmosphere/Quote */}
                                <figure className="relative h-48 rounded-lg overflow-hidden bg-secondary-dim group">
                                    <img alt="Serene forest path" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3Q0PN-XOumBbGS7Lz_nIVz6QgEw42SQAnP-nxPSga2RiHGsJ5Fsx7kar9UF-aF1abvakjzPArVARii9B6MTN_RPHwl2BFRZJhdrilqiaLa3Qufo6VGrKOYz0R2WLFZkmODHAu5vh2OGhSYdzDBLYLQepz8qptKoYW5GCiuHxLSGv9wOj4HMER3GBSATbO5nvBER44use1b-P4hrFA5YknO86SLU7MunJC3lqbiuK4QljscIUj9_Nr4bdMcNJAAMLp-CzPV9ozpeAt" />
                                    <figcaption className="absolute inset-0 bg-gradient-to-t from-secondary-dim/90 via-secondary-dim/20 to-transparent p-6 flex flex-col justify-end">
                                        <p className="text-white font-headline-md text-[18px] italic leading-tight">"Growth is a quiet process."</p>
                                        <p className="text-secondary-fixed text-[12px] mt-1">Take 5 minutes for yourself today.</p>
                                    </figcaption>
                                </figure>
                            </aside>
                        </div>
                    </div>
                </main>
            </div>

            {/* Coach Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full lg:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/coach-dashboard')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">dashboard</span>
                    <span className="font-label-sm text-[10px] font-semibold">Dashboard</span>
                </button>
                <button onClick={() => navigate('/coach-chat')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">forum</span>
                    <span className="font-label-sm text-[10px] font-semibold">Chats</span>
                </button>
                <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">view_day</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">local_library</span>
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </div>
        </div>
    );
}