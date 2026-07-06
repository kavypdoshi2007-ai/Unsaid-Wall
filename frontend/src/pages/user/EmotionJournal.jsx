import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmotionJournal() {
    const navigate = useNavigate();

    // --- Dynamic State Trees ---
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [barHeights, setBarHeights] = useState({ sad: '0%', calm: '0%', anxious: '0%', joy: '0%', tired: '0%' });
    const [chartCounts, setChartCounts] = useState({ sad: 0, calm: 0, anxious: 0, joy: 0, tired: 0 });

    // Absolute Backend Endpoint Configurations
    const CONFIG = {
        API_BASE: 'https://diminish-waving-shore.ngrok-free.dev/api/journal',
        TOKEN_KEY: 'token'
    };

    // --- Cryptographic JWT ID Extractor Helper ---
    function getActiveUserId() {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
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
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true' // <-- Prevents ngrok warning wrapper page HTML intercept crash
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
                const response = await fetch(`${CONFIG.API_BASE}/user/${userId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error(`Server returned status code: ${response.status}`);
                }

                const rawData = await response.json();

                // Parse out payloads cleanly
                let journalEntries = [];
                if (Array.isArray(rawData)) {
                    journalEntries = rawData;
                } else if (rawData && Array.isArray(rawData.data)) {
                    journalEntries = rawData.data;
                } else if (rawData && Array.isArray(rawData.entries)) {
                    journalEntries = rawData.entries;
                } else if (rawData && typeof rawData === 'object') {
                    const foundArray = Object.values(rawData).find(val => Array.isArray(val));
                    if (foundArray) journalEntries = foundArray;
                }

                setEntries(journalEntries);
                calculateEmotionalPulse(journalEntries);

            } catch (err) {
                console.error("Dashboard Loading Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadJournalDashboard();
    }, []);

    // --- Calculate Metric Percentages and Heights ---
    const calculateEmotionalPulse = (journalEntries) => {
        const counts = { sad: 0, calm: 0, anxious: 0, joy: 0, tired: 0 };

        journalEntries.forEach(entry => {
            if (!entry.emotion) return;
            const emo = String(entry.emotion).toLowerCase().trim();

            if (counts[emo] !== undefined) {
                counts[emo]++;
            } else if (["angry", "lonely", "overwhelmed", "confused", "numb", "stressed"].includes(emo)) {
                counts.anxious++; // Group related expressions under the anxious cluster fallback
            } else if (["hopeful"].includes(emo)) {
                counts.joy++;
            }
        });

        setChartCounts(counts);

        // Animate graph elements dynamically
        const max = Math.max(...Object.values(counts), 1);
        setTimeout(() => {
            setBarHeights({
                sad: `${(counts.sad / max) * 100}%`,
                calm: `${(counts.calm / max) * 100}%`,
                anxious: `${(counts.anxious / max) * 100}%`,
                joy: `${(counts.joy / max) * 100}%`,
                tired: `${(counts.tired / max) * 100}%`
            });
        }, 200);
    };

    // --- Handle Entry Deletion ---
    const handleDeleteJournalRecord = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this private memory?")) return;

        const headers = getAuthHeaders();
        if (!headers) return alert("Missing session authentication token.");

        try {
            const response = await fetch(`${CONFIG.API_BASE}/${id}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) throw new Error('Deletion processing aborted by backend routes.');

            // Instantly filter out local state entries list
            const remaining = entries.filter(e => (e.id || e._id) !== id);
            setEntries(remaining);
            calculateEmotionalPulse(remaining);
        } catch (err) {
            alert(`Error deleting entry: ${err.message}`);
        }
    };

    return (
        <div className="font-body-md text-body-md overflow-x-hidden bg-background text-on-surface min-h-screen relative pb-24">

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    <div onClick={() => navigate('/user-wall')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/user-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT SPACE */}
            <main className="pt-24 px-container-padding max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                    <section className="space-y-4 max-w-2xl">
                        <h2 className="font-display-lg text-primary">Softly Landing, Alex.</h2>
                        <p className="text-on-surface-variant text-lg leading-relaxed">
                            This week, your garden of thoughts has seen a mix of sun and clouds. You've sat with <span className="font-bold text-primary">Quiet Sadness</span> {chartCounts.sad} {chartCounts.sad === 1 ? 'time' : 'times'}, but your <span className="font-bold text-secondary">Calm</span> is growing back. Remember, every word you leave here is a seed for tomorrow's healing.
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
                                        <span className="text-label-sm text-on-surface-variant">Last 7 Days</span>
                                    </div>
                                    <div className="flex items-end justify-between h-48 gap-4 px-2">
                                        {[
                                            { key: 'sad', color: 'bg-tertiary-container', label: `Sad (${chartCounts.sad})` },
                                            { key: 'calm', color: 'bg-secondary-container', label: `Calm (${chartCounts.calm})` },
                                            { key: 'anxious', color: 'bg-error-container/30 border border-error-container', label: `Anx (${chartCounts.anxious})` },
                                            { key: 'joy', color: 'bg-primary-container', label: `Joy (${chartCounts.joy})` },
                                            { key: 'tired', color: 'bg-surface-container-highest', label: `Tired (${chartCounts.tired})` },
                                        ].map(stat => (
                                            <div key={stat.key} className="flex-1 flex flex-col items-center gap-2">
                                                <div className={`w-full ${stat.color} rounded-t-full transition-all duration-1000 ease-out`} style={{ height: barHeights[stat.key] }}></div>
                                                <span className="text-label-sm text-on-surface-variant whitespace-nowrap text-[11px]">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Weekly Timeline Blocks */}
                                <section className="bg-white/60 backdrop-blur-xl p-8 rounded-lg space-y-6 border border-primary/10">
                                    <h3 className="font-headline-md text-primary">Recent Frequency</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {entries.slice(0, 5).map((entry, index) => {
                                            const emotionLabel = entry.emotion ? String(entry.emotion).substring(0, 2).toUpperCase() : '??';
                                            return (
                                                <div key={entry.id || entry._id || index} className="p-3 rounded-lg text-center space-y-2 bg-tertiary-container/10 border border-primary/5">
                                                    <span className="text-[10px] uppercase font-bold text-outline">Log #{index + 1}</span>
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-primary">
                                                        {emotionLabel}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div
                                            onClick={() => navigate('/private-journal')}
                                            className="p-3 rounded-lg border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-outline/60 cursor-pointer hover:bg-primary-container/10 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Restored Complete Dynamic Feed Render Output */}
                            <section className="space-y-6 pt-4">
                                <h3 className="font-headline-md text-primary">Private Memories</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {entries.length > 0 ? (
                                        entries.map(entry => {
                                            const entryDate = new Date(entry.created_at || entry.createdAt || entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <article key={entry.id || entry._id} className="bg-white/60 backdrop-blur-xl p-8 rounded-lg relative overflow-hidden group hover:shadow-md transition-all border border-primary/10">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-outline text-lg">lock</span>
                                                            <time className="text-label-sm text-outline uppercase tracking-wider font-semibold text-xs">{entryDate}</time>
                                                        </div>
                                                        <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase w-fit">
                                                            {entry.emotion || 'Reflection'} ({entry.intensity || 'med'})
                                                        </div>
                                                    </div>
                                                    <p className="text-base text-on-surface leading-relaxed italic whitespace-pre-wrap">
                                                        "{entry.note || entry.entry || entry.content || entry.text}"
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
                                    Entries written privately pass metrics into your charts locally without bleeding out into public timeline wall streams.
                                </p>
                            </section>
                        </aside>
                    </div>
                )}
            </main>

            {/* MOBILE BOTTOM NAV BAR BAR */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/user-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/emotion-journal')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_stories</span>
                    <span className="font-label-sm text-[10px] font-semibold">Journal</span>
                </button>
                <button onClick={() => navigate('/coach-profile')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">psychology</span>
                    <span className="font-label-sm text-[10px] font-semibold">Coaches</span>
                </button>
                <button onClick={() => navigate('/my-sessions')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">forum</span>
                    <span className="font-label-sm text-[10px] font-semibold">Sessions</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">local_library</span>
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </div>
        </div>
    );
}