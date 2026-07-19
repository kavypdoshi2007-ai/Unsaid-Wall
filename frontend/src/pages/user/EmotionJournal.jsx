import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import Navbar from '../../components/Navbar'; // Adjust path as needed

export default function EmotionJournal() {
    const navigate = useNavigate();

    // --- Dynamic State Trees aligned to explicit EmotionType ---
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [barHeights, setBarHeights] = useState({ 
        ANXIOUS: '0%', SAD: '0%', ANGRY: '0%', LONELY: '0%', 
        OVERWHELMED: '0%', HOPEFUL: '0%', NUMB: '0%', CONFUSED: '0%' 
    });
    const [chartCounts, setChartCounts] = useState({ 
        ANXIOUS: 0, SAD: 0, ANGRY: 0, LONELY: 0, 
        OVERWHELMED: 0, HOPEFUL: 0, NUMB: 0, CONFUSED: 0 
    });

    const TOKEN_KEY = 'token';

    // Emoji/Icon Mapping Dictionary using Material Symbols for the exact EmotionType enum
    const EMON_MAP = {
        ANXIOUS: 'bolt',
        SAD: 'sentiment_dissatisfied',
        ANGRY: 'release_alert',
        LONELY: 'group_off',
        OVERWHELMED: 'heart_broken',
        HOPEFUL: 'sunny',
        NUMB: 'humidity_low',
        CONFUSED: 'help',
        fallback: 'edit_note'
    };

    // --- 🌟 Emotion Normalization Engine aligned to explicit EmotionType ---
    const normalizeEmotion = (rawEmotion) => {
        if (!rawEmotion) return 'HOPEFUL';
        const e = String(rawEmotion).toUpperCase().trim();

        if (['ANXIOUS', 'STRESSED', 'WORRIED', 'FEAR', 'NERVOUS', 'PANIC'].some(k => e.includes(k))) return 'ANXIOUS';
        if (['SAD', 'DEPRESSED', 'DOWN', 'GRIEF', 'CRY'].some(k => e.includes(k))) return 'SAD';
        if (['ANGRY', 'MAD', 'FURIOUS', 'RESENTFUL'].some(k => e.includes(k))) return 'ANGRY';
        if (['LONELY', 'ISOLATED', 'ALONE'].some(k => e.includes(k))) return 'LONELY';
        if (['OVERWHELMED', 'BURNOUT', 'DRAINED', 'EXHAUSTED'].some(k => e.includes(k))) return 'OVERWHELMED';
        if (['HOPEFUL', 'HAPPY', 'EXCITED', 'JOY', 'GREAT', 'GOOD', 'GRATEFUL', 'CALM'].some(k => e.includes(k))) return 'HOPEFUL';
        if (['NUMB', 'EMPTY', 'NADA'].some(k => e.includes(k))) return 'NUMB';
        if (['CONFUSED', 'LOST', 'UNSURE', 'PERPLEXED'].some(k => e.includes(k))) return 'CONFUSED';

        return 'HOPEFUL'; 
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
                const response = await fetch(API_ENDPOINTS.JOURNAL.GET_USER_JOURNAL(userId), {
                    method: 'GET',
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`Server returned status code: ${response.status}`);
                }

                const rawData = await response.json();

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

                const myPosts = allPosts.filter(post => {
                    const postUserId =
                        post.userId ?? post.user_id ?? post.authorId ?? post.author_id ??
                        post.user?.id ?? post.user?._id ?? post.author?.id ?? post.author?._id;
                    return postUserId !== undefined && String(postUserId) === String(userId);
                });

                const sortedEntries = myPosts.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || a.timestamp || 0);
                    const dateB = new Date(b.created_at || b.createdAt || b.timestamp || 0);
                    return dateB - dateA;
                });

                setEntries(sortedEntries);
                calculateEmotionalPulse(sortedEntries);

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
    const calculateEmotionalPulse = (journalEntries) => {
        const counts = { ANXIOUS: 0, SAD: 0, ANGRY: 0, LONELY: 0, OVERWHELMED: 0, HOPEFUL: 0, NUMB: 0, CONFUSED: 0 };

        journalEntries.forEach(entry => {
            const emotionValue = entry.emotion ?? entry.vibe ?? entry.mood ?? entry.feeling;
            const bucket = normalizeEmotion(emotionValue);
            counts[bucket]++;
        });

        const max = Math.max(...Object.values(counts), 1);

        const newHeights = {
            ANXIOUS: `${(counts.ANXIOUS / max) * 100}%`,
            SAD: `${(counts.SAD / max) * 100}%`,
            ANGRY: `${(counts.ANGRY / max) * 100}%`,
            LONELY: `${(counts.LONELY / max) * 100}%`,
            OVERWHELMED: `${(counts.OVERWHELMED / max) * 100}%`,
            HOPEFUL: `${(counts.HOPEFUL / max) * 100}%`,
            NUMB: `${(counts.NUMB / max) * 100}%`,
            CONFUSED: `${(counts.CONFUSED / max) * 100}%`
        };

        setChartCounts(counts);
        setBarHeights(newHeights);
    };

    const handleDeleteJournalRecord = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this post?")) return;
        const headers = getAuthHeaders();
        if (!headers) return alert("Missing session authentication token.");
        try {
            const response = await fetch(API_ENDPOINTS.JOURNAL.DELETE_ENTRY(id), { method: 'DELETE', headers });
            if (!response.ok) throw new Error('Deletion processing aborted.');
            const remaining = entries.filter(e => (e.id || e._id) !== id);
            setEntries(remaining);
            calculateEmotionalPulse(remaining);
        } catch (err) {
            alert(`Error deleting entry: ${err.message}`);
        }
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

            <main className="pt-24 px-6 max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                    <section className="space-y-4 max-w-2xl">
                        <h2 className="font-display-lg text-primary">Your Safe Space.</h2>
                        <p className="text-on-surface-variant text-lg leading-relaxed">
                            Your garden of thoughts has seen a mix of sun and clouds. You've sat with <span className="font-bold text-primary">Quiet Sadness</span> {chartCounts.SAD} {chartCounts.SAD === 1 ? 'time' : 'times'}, but your <span className="font-bold text-secondary">Hope</span> is growing back. Remember, every word you leave here is a seed for tomorrow's healing.
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

                                {/* Emotion Bar Chart Updated with 8 Enum Columns */}
                                <section className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl space-y-6 border border-primary/5 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <h3 className="font-bold text-lg text-zinc-800 tracking-tight">Emotional Pulse</h3>
                                            <p className="text-xs text-zinc-400">Activity Distribution</p>
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">All Time</span>
                                    </div>
                                    <div className="relative flex items-end justify-between gap-2 px-1 pt-6 border-b border-zinc-100" style={{ height: '200px' }}>
                                        {/* Background Reference Lines */}
                                        <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none opacity-40">
                                            <div className="w-full border-t border-dashed border-zinc-200"></div>
                                            <div className="w-full border-t border-dashed border-zinc-200"></div>
                                            <div className="w-full border-t border-dashed border-zinc-200"></div>
                                        </div>

                                        {[
                                            { key: 'ANXIOUS', color: 'bg-amber-400/80 hover:bg-amber-400', label: 'Anx', icon: 'bolt' },
                                            { key: 'SAD', color: 'bg-indigo-400/80 hover:bg-indigo-400', label: 'Sad', icon: 'sentiment_dissatisfied' },
                                            { key: 'ANGRY', color: 'bg-red-400/80 hover:bg-red-400', label: 'Ang', icon: 'release_alert' },
                                            { key: 'LONELY', color: 'bg-purple-400/80 hover:bg-purple-400', label: 'Lone', icon: 'group_off' },
                                            { key: 'OVERWHELMED', color: 'bg-orange-400/80 hover:bg-orange-400', label: 'Ovw', icon: 'heart_broken' },
                                            { key: 'HOPEFUL', color: 'bg-emerald-400/80 hover:bg-emerald-400', label: 'Hop', icon: 'sunny' },
                                            { key: 'NUMB', color: 'bg-slate-400/80 hover:bg-slate-400', label: 'Numb', icon: 'humidity_low' },
                                            { key: 'CONFUSED', color: 'bg-teal-400/80 hover:bg-teal-400', label: 'Conf', icon: 'help' },
                                        ].map(stat => (
                                            <div key={stat.key} className="flex-1 flex flex-col items-center group relative z-10" style={{ height: '100%' }}>
                                                {/* Floating Counter Value */}
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-zinc-800 text-white font-mono text-[10px] px-1.5 py-0.5 rounded shadow-sm pointer-events-none">
                                                    {chartCounts[stat.key]}
                                                </span>
                                                <div className="w-full flex flex-col justify-end" style={{ flex: 1 }}>
                                                    <div
                                                        className={`w-full ${stat.color} rounded-t-xl transition-all duration-1000 ease-out cursor-pointer shadow-sm`}
                                                        style={{ height: barHeights[stat.key] || '0%' }}
                                                    ></div>
                                                </div>
                                                <div className="mt-2 flex flex-col items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[14px] text-zinc-400">{stat.icon}</span>
                                                    <span className="text-zinc-500 font-medium text-[10px] tracking-tight">{stat.label}</span>
                                                </div>
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

                            {/* Complete Dynamic Feed Render Output */}
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