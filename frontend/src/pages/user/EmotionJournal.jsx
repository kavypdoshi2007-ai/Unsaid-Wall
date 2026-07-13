import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import Navbar from '../../components/Navbar'; // Adjust path as needed

export default function EmotionJournal() {
    const navigate = useNavigate();

    // --- Dynamic State Trees ---
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [barHeights, setBarHeights] = useState({ sad: '0%', calm: '0%', anxious: '0%', joy: '0%', tired: '0%' });
    const [chartCounts, setChartCounts] = useState({ sad: 0, calm: 0, anxious: 0, joy: 0, tired: 0 });

    const TOKEN_KEY = 'token';

    // Emoji Mapping Dictionary for Quick Visual Recognition
    // Emoji/Icon Mapping Dictionary using Material Symbols
    const EMON_MAP = {
        sad: 'sentiment_dissatisfied',
        calm: 'self_improvement',
        anxious: 'bolt',
        joy: 'sunny',
        tired: 'bedtime',
        fallback: 'edit_note'
    };
    // --- 🌟 NEW: Emotion Normalization Engine ---
    // This categorizes ANY emotion from the backend into your 5 core chart buckets
    const normalizeEmotion = (rawEmotion) => {
        if (!rawEmotion) return 'calm';
        const e = String(rawEmotion).toLowerCase().trim();

        if (['sad', 'depressed', 'down', 'lonely', 'numb', 'grief', 'cry'].some(k => e.includes(k))) return 'sad';
        if (['anxious', 'stressed', 'overwhelmed', 'worried', 'angry', 'fear', 'nervous', 'panic'].some(k => e.includes(k))) return 'anxious';
        if (['joy', 'happy', 'excited', 'hopeful', 'great', 'good', 'grateful'].some(k => e.includes(k))) return 'joy';
        if (['tired', 'exhausted', 'fatigue', 'drained', 'sleepy', 'burnout'].some(k => e.includes(k))) return 'tired';

        return 'calm'; // Default bucket for calm, neutral, fine, okay, etc.
    };

    // --- Cryptographic JWT ID Extractor Helper ---
    function getActiveUserId() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token || token === "null" || token === "undefined") return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            return payload.id || payload.userId || payload.user_id;
        } catch (e) {
            console.error("Failed to safely parse incoming JWT authentication segments:", e);
            return null;
        }
    }

    // --- Auth Headers Helper ---
    function getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
        };
    }

    // --- Lifecycle Hook: Pull Connected Journal Storage Logs ---
    useEffect(() => {
        async function loadJournalDashboard() {
            const headers = getAuthHeaders();
            const userId = getActiveUserId();

            if (!headers || !userId) {
                setError("Authentication Error: Invalid or expired session token. Please log back in.");
                setLoading(false);
                return;
            }

            try {
                // Past Memories now shows the user's own Wall posts, not a separate private journal.
                const response = await fetch(API_ENDPOINTS.POSTS.GET_FEED, {
                    method: 'GET',
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`Server returned status code: ${response.status}`);
                }

                const rawData = await response.json();

                // Parse out payloads cleanly
                let allPosts = [];
                if (Array.isArray(rawData)) {
                    allPosts = rawData;
                } else if (rawData && Array.isArray(rawData.data)) {
                    allPosts = rawData.data;
                } else if (rawData && Array.isArray(rawData.posts)) {
                    allPosts = rawData.posts;
                } else if (rawData && typeof rawData === 'object') {
                    const foundArray = Object.values(rawData).find(val => Array.isArray(val));
                    if (foundArray) allPosts = foundArray;
                }

                // GET_FEED returns everyone's posts — keep only this user's own.
                // Field name is unconfirmed server-side, so check every likely shape.
                const myPosts = allPosts.filter(post => {
                    const postUserId =
                        post.userId ?? post.user_id ?? post.authorId ?? post.author_id ??
                        post.user?.id ?? post.user?._id ?? post.author?.id ?? post.author?._id;
                    return postUserId !== undefined && String(postUserId) === String(userId);
                });

                // Sort entries to guarantee latest dates appear first on top
                const sortedEntries = myPosts.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || a.timestamp || 0);
                    const dateB = new Date(b.created_at || b.createdAt || b.timestamp || 0);
                    return dateB - dateA; // Descending Order (Newest First)
                });

                setEntries(sortedEntries);
                calculateEmotionalPulse(sortedEntries); // Chart reflects the same posts shown in Past Memories

            } catch (err) {
                console.error("Dashboard Loading Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadJournalDashboard();
    }, []);

    // --- Emotion calculation function ---
    // Reads whichever field the wall post uses for its emotion/vibe value.
    const calculateEmotionalPulse = (journalEntries) => {
        const counts = { sad: 0, calm: 0, anxious: 0, joy: 0, tired: 0 };

        journalEntries.forEach(entry => {
            const emotionValue = entry.emotion ?? entry.vibe ?? entry.mood ?? entry.feeling;
            const bucket = normalizeEmotion(emotionValue);
            counts[bucket]++;
        });

        const max = Math.max(...Object.values(counts), 1);

        const newHeights = {
            sad: `${(counts.sad / max) * 100}%`,
            calm: `${(counts.calm / max) * 100}%`,
            anxious: `${(counts.anxious / max) * 100}%`,
            joy: `${(counts.joy / max) * 100}%`,
            tired: `${(counts.tired / max) * 100}%`
        };

        setChartCounts(counts);
        setBarHeights(newHeights);
    };

    // --- Handle Entry Deletion ---
    // NOTE: api.js currently has no delete route for Wall posts (only JOURNAL.DELETE_ENTRY
    // exists, which would delete the wrong resource). This is a placeholder until a
    // POSTS.DELETE(postId) endpoint is added on the backend.
    const handleDeleteJournalRecord = async (id) => {
        alert("Deleting Wall posts isn't supported yet — the backend needs a POSTS delete endpoint added first.");
        // Once that endpoint exists, swap this in:
        //
        // if (!confirm("Are you sure you want to permanently delete this post?")) return;
        // const headers = getAuthHeaders();
        // if (!headers) return alert("Missing session authentication token.");
        // try {
        //     const response = await fetch(API_ENDPOINTS.POSTS.DELETE(id), { method: 'DELETE', headers });
        //     if (!response.ok) throw new Error('Deletion processing aborted.');
        //     const remaining = entries.filter(e => (e.id || e._id) !== id);
        //     setEntries(remaining);
        //     calculateEmotionalPulse(remaining);
        // } catch (err) {
        //     alert(`Error deleting entry: ${err.message}`);
        // }
    };

    const formatTimestamp = (entry) => {
        const rawDate = entry.created_at || entry.createdAt || entry.timestamp;
        if (!rawDate) return 'Recent';
        return new Date(rawDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatShortDate = (entry) => {
        const rawDate = entry.created_at || entry.createdAt || entry.timestamp;
        if (!rawDate) return 'Today';
        return new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="font-body-md text-body-md overflow-x-hidden bg-background text-on-surface min-h-screen relative pb-24">
            <Navbar />

            {/* MAIN CONTENT SPACE */}
            <main className="pt-24 px-6 max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                    <section className="space-y-4 max-w-2xl">
                        <h2 className="font-display-lg text-primary">Your Safe Space.</h2>
                        <p className="text-on-surface-variant text-lg leading-relaxed">
                            Your garden of thoughts has seen a mix of sun and clouds. You've sat with <span className="font-bold text-primary">Quiet Sadness</span> {chartCounts.sad} {chartCounts.sad === 1 ? 'time' : 'times'}, but your <span className="font-bold text-secondary">Calm</span> is growing back. Remember, every word you leave here is a seed for tomorrow's healing.
                        </p>
                    </section>

                    <div className="w-full lg:w-80 space-y-4 shrink-0">
                        <button onClick={() => navigate('/private-journal')} className="w-full bg-primary text-white p-6 rounded-lg flex items-center justify-between active:scale-[0.98] hover:bg-primary/90 transition-all duration-200 text-left shadow-lg shadow-primary/20 cursor-pointer">
                            <div className="space-y-1">
                                <p className="font-bold text-lg">Start Private Entry</p>
                                <p className="text-white/80 text-sm">Clear your mind now.</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined">edit_note</span>
                            </div>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-outline italic animate-pulse">
                        Syncing secure personal journal logs...
                    </div>
                ) : error ? (
                    <div className="bg-error/10 border border-error text-error p-6 rounded-lg text-center text-sm">
                        Could not build network database connections: {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Emotion Bar Chart */}
                                <section className="bg-white/60 backdrop-blur-xl p-8 rounded-lg space-y-8 border border-primary/10">
                                    <div className="flex justify-between items-end">
                                        <h3 className="font-headline-md text-primary">Emotional Pulse</h3>
                                        <span className="text-label-sm text-on-surface-variant">All Time</span>
                                    </div>
                                    <div className="flex items-end justify-between gap-4 px-2" style={{ height: '192px' }}>
                                        {[
                                            { key: 'sad', color: 'bg-tertiary-container', label: `Sad (${chartCounts.sad})` },
                                            { key: 'calm', color: 'bg-secondary-container', label: `Calm (${chartCounts.calm})` },
                                            { key: 'anxious', color: 'bg-error-container/30 border border-error-container', label: `Anx (${chartCounts.anxious})` },
                                            { key: 'joy', color: 'bg-primary-container', label: `Joy (${chartCounts.joy})` },
                                            { key: 'tired', color: 'bg-surface-container-highest', label: `Tired (${chartCounts.tired})` },
                                        ].map(stat => (
                                            <div key={stat.key} className="flex-1 flex flex-col items-center gap-2" style={{ height: '100%' }}>
                                                <div className="w-full flex flex-col justify-end" style={{ flex: 1 }}>
                                                    <div
                                                        className={`w-full ${stat.color} rounded-t-full transition-all duration-1000 ease-out`}
                                                        style={{ height: barHeights[stat.key] || '0%' }}
                                                    ></div>
                                                </div>
                                                <span className="text-label-sm text-on-surface-variant whitespace-nowrap text-[11px]">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Recent Frequency Blocks */}
                                <section className="bg-white/60 backdrop-blur-xl p-8 rounded-lg space-y-6 border border-primary/10">
                                    <h3 className="font-headline-md text-primary">Recent Frequency</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {entries.slice(0, 5).map((entry, index) => {
                                            const emoKey = normalizeEmotion(entry.emotion);
                                            const activeEmoji = EMON_MAP[emoKey] || EMON_MAP.fallback;

                                            return (
                                                <div key={entry.id || entry._id || index} className="p-3 rounded-2xl text-center flex flex-col justify-between h-28 bg-white border border-outline-variant/10 shadow-sm">
                                                    <span className="text-[9px] uppercase font-bold text-outline tracking-wider">{formatShortDate(entry)}</span>

                                                    {/* The new Icon Block */}
                                                    <div className="flex items-center justify-center my-auto">
                                                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary text-xl">
                                                                {activeEmoji}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tight truncate capitalize">
                                                        {entry.emotion || 'Log'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>

                            {/* Complete Dynamic Feed Render Output (Newest First on Top) */}
                            <section className="space-y-6 pt-4">
                                <h3 className="font-headline-md text-primary">Past Memories</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {entries.length > 0 ? (
                                        entries.map(entry => {
                                            return (
                                                <article key={entry.id || entry._id} className="bg-white/60 backdrop-blur-xl p-8 rounded-lg relative overflow-hidden group hover:shadow-md transition-all border border-primary/10">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-outline text-lg">lock</span>
                                                            <time className="text-label-sm text-outline uppercase tracking-wider font-semibold text-xs">{formatTimestamp(entry)}</time>
                                                        </div>
                                                        <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase w-fit">
                                                            {entry.emotion || 'Reflection'} {entry.intensity ? `(${entry.intensity})` : ''}
                                                        </div>
                                                    </div>
                                                    <p className="text-base text-on-surface leading-relaxed italic whitespace-pre-wrap">
                                                        "{entry.note || entry.entry || entry.content || entry.text || entry.postText}"
                                                    </p>
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={() => handleDeleteJournalRecord(entry.id || entry._id)}
                                                            className="text-xs font-bold text-error/80 hover:text-error hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span> Purge Entry
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <p className="text-on-surface-variant italic text-sm">No data entries captured yet. Start a Private Entry to seed your journal layout grid!</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar Column */}
                        <aside className="space-y-8">
                            <section className="bg-white/60 backdrop-blur-xl p-6 rounded-lg bg-primary-container/20 border-primary/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">psychology</span>
                                    </div>
                                    <h4 className="font-bold text-primary">AI Insights Sandbox</h4>
                                </div>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                                    These insights are calculated from your public Wall posts, and stay visible only to you here.
                                </p>
                            </section>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}