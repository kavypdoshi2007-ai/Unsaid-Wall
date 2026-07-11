import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- ADDED: Navigation hook
import { API_ENDPOINTS } from '../../config/api';

export default function AdminDashboard() {
    const [showBroadcast, setShowBroadcast] = useState(false);
    const navigate = useNavigate(); // <-- ADDED: Initialize navigation

    const [activeSessionsCount, setActiveSessionsCount] = useState(null);
    const [postsTodayCount, setPostsTodayCount] = useState(null);
    const [crisisAlerts, setCrisisAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [broadcastText, setBroadcastText] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastError, setBroadcastError] = useState('');

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Active Sessions — admin role gets every session in the system (see
                // sessionController.getSessions: queryFilter = {} for role === 'admin')
                const sessionsRes = await fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, { headers: authHeaders() });
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    const active = sessionsData.filter(s => (s.status || '').toLowerCase() === 'active');
                    setActiveSessionsCount(active.length);
                }

                // 2. Posts Today — via the public feed. NOTE: this undercounts, since
                // getFeed only returns { is_hidden: false } posts, and crisis-flagged
                // posts are automatically hidden — see the flag below.
                const postsRes = await fetch(API_ENDPOINTS.POSTS.GET_FEED, { headers: authHeaders() });
                if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    const todayCount = postsData.filter(p => p.created_at && new Date(p.created_at) >= startOfToday).length;
                    setPostsTodayCount(todayCount);
                }

                // 3. Active Crisis Alerts — NEW ROUTE NEEDED.
                // postController.js has no moderation-queue handler, so this call will
                // 404 (or error) until that endpoint is actually implemented server-side.
                // See the note below the component for exactly what to add.
                try {
                    const crisisRes = await fetch(API_ENDPOINTS.POSTS.GET_MOD_QUEUE, { headers: authHeaders() });
                    if (crisisRes.ok) {
                        const modQueueData = await crisisRes.json();
                        const crisisOnly = (Array.isArray(modQueueData) ? modQueueData : []).filter(p => p.flag_level === 'crisis');
                        setCrisisAlerts(crisisOnly);
                    } else {
                        setCrisisAlerts([]);
                    }
                } catch (crisisError) {
                    // Swallow — this endpoint doesn't exist yet server-side
                    setCrisisAlerts([]);
                }
            } catch (error) {
                console.error("Failed to load admin dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSendBroadcast = async () => {
        if (!broadcastText.trim()) return;
        setSendingBroadcast(true);
        setBroadcastError('');
        try {
            // NOTE: field name here (`content`) is a best-effort guess, matching the
            // convention used by Post/Message ("content"). There's no
            // announcementController.js in what's been shared, so this needs
            // verifying against the real controller — see note below.
            const res = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.CREATE, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ content: broadcastText })
            });

            if (res.ok) {
                setBroadcastText('');
                setShowBroadcast(false);
            } else {
                const errData = await res.json().catch(() => ({}));
                setBroadcastError(errData.error || "Failed to send broadcast.");
            }
        } catch (error) {
            setBroadcastError("Network error while sending broadcast.");
        } finally {
            setSendingBroadcast(false);
        }
    };

    const stats = [
        { label: 'Active Sessions', value: activeSessionsCount },
        { label: 'Posts Today', value: postsTodayCount }
    ];

    return (
        <div className="bg-background text-on-surface antialiased min-h-screen">
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Admin Console</span>
                    </div>

                    {/* Right: Admin Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/admin-dashboard')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Dashboard</button>
                        <button onClick={() => navigate('/admin-moderation')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Moderation</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>
            <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container flex flex-col py-4 z-50 pt-12 shadow-md">
                <div className="px-6 py-6 mb-4">
                    <h1 className="font-headline-md text-headline-md text-secondary">Admin Workspace</h1>
                    <p className="font-label-sm text-on-surface-variant">
                        Managing {activeSessionsCount !== null ? activeSessionsCount : '—'} active journeys
                    </p>
                </div>
                <nav className="flex-1 space-y-1 px-2">
                    <button className="w-full bg-secondary-container text-on-secondary-container rounded-xl flex items-center px-4 py-3 text-left">
                        <span className="material-symbols-outlined mr-3">dashboard</span> Dashboard
                    </button>
                    {/* <-- ADDED: Client Wall routing to Admin Moderation --> */}
                    <button
                        onClick={() => navigate('/admin-moderation')}
                        className="w-full text-on-surface-variant hover:bg-surface-variant rounded-xl flex items-center px-4 py-3 text-left transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined mr-3">forum</span> Client Wall
                    </button>
                </nav>
            </aside>

            <main className="ml-64 pt-20 px-container-padding pb-section-gap">
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="font-display-lg text-primary">Platform Overview</h2>
                        <p className="text-on-surface-variant mt-2">Real-time health monitoring.</p>
                    </div>
                    <button
                        onClick={() => setShowBroadcast(true)}
                        className="bg-primary text-on-primary px-6 py-3 rounded-full flex items-center gap-2 font-bold hover:brightness-110 active:scale-95 cursor-pointer">
                        <span className="material-symbols-outlined">campaign</span> Broadcast Tool
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-panel p-6 rounded-lg border border-outline-variant/10">
                            <span className="text-on-surface-variant font-label-sm uppercase">{stat.label}</span>
                            <div className="text-4xl font-bold text-primary mt-2">
                                {loading ? '—' : (stat.value ?? 0).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Crisis Alerts */}
                <section className="mb-12">
                    <h3 className="font-headline-md mb-6">Active Crisis Alerts</h3>
                    <div className="space-y-4">
                        {crisisAlerts.length === 0 ? (
                            <div className="p-6 rounded-lg border border-outline-variant/10 text-on-surface-variant text-sm">
                                {loading ? 'Loading crisis alerts…' : 'No active crisis alerts.'}
                            </div>
                        ) : (
                            crisisAlerts.map((post) => (
                                <div key={post.id} className="p-6 rounded-lg border-l-4 border-error bg-error/5 flex justify-between">
                                    <div>
                                        <h4 className="font-bold">{post.display_name || 'Anonymous'} (The Wall)</h4>
                                        <p className="italic text-on-surface-variant">"{post.content}"</p>
                                    </div>
                                    <button className="bg-error text-white px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:brightness-110">Intervene</button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Broadcast Modal */}
                {showBroadcast && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
                        <div className="bg-surface-container-lowest w-full max-w-lg p-8 rounded-xl shadow-2xl">
                            <h3 className="font-headline-md text-primary mb-4">New Global Broadcast</h3>
                            <textarea
                                className="w-full bg-surface-container-low rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-primary/50"
                                rows="3"
                                placeholder="Enter message..."
                                value={broadcastText}
                                onChange={(e) => setBroadcastText(e.target.value)}
                            ></textarea>
                            {broadcastError && (
                                <p className="text-error text-xs mb-3">{broadcastError}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={sendingBroadcast || !broadcastText.trim()}
                                    className="flex-1 bg-primary text-on-primary py-3 rounded-full font-bold cursor-pointer hover:brightness-110 disabled:opacity-50"
                                >
                                    {sendingBroadcast ? 'Sending...' : 'Send'}
                                </button>
                                <button onClick={() => setShowBroadcast(false)} className="px-6 py-3 rounded-full font-bold cursor-pointer hover:bg-surface-variant/50">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}