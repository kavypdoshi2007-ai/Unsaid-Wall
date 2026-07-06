import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmotionJournal() {
    const navigate = useNavigate();
    const [barHeights, setBarHeights] = useState({ sad: '0%', calm: '0%', anxious: '0%', joy: '0%', tired: '0%' });

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => {
            setBarHeights({ sad: '65%', calm: '40%', anxious: '85%', joy: '25%', tired: '55%' });
        }, 200);
    }, []);

    return (
        <div className="font-body-md text-body-md overflow-x-hidden bg-background text-on-surface min-h-screen relative pb-24">

            {/* CLEANED HEADER */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    {/* Left: Logo */}
                    <div onClick={() => navigate('/user-wall')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

                    {/* Right: Nav Links ONLY */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/user-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        {/* ACTIVE STATE ADDED: Journal */}
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>

            <main className="pt-24 px-container-padding max-w-[1200px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                    <section className="space-y-4 max-w-2xl">
                        <h2 className="font-display-lg text-primary">Softly Landing, Alex.</h2>
                        <p className="text-on-surface-variant text-lg leading-relaxed">
                            This week, your garden of thoughts has seen a mix of sun and clouds. You've sat with <span className="font-bold text-primary">Quiet Sadness</span> three times, but your <span className="font-bold text-secondary">Calm</span> is growing back. Remember, every word you leave here is a seed for tomorrow's healing.
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
                                        { key: 'sad', color: 'bg-tertiary-container', label: 'Sad' },
                                        { key: 'calm', color: 'bg-secondary-container', label: 'Calm' },
                                        { key: 'anxious', color: 'bg-error-container/30 border border-error-container', label: 'Anxious' },
                                        { key: 'joy', color: 'bg-primary-container', label: 'Joy' },
                                        { key: 'tired', color: 'bg-surface-container-highest', label: 'Tired' },
                                    ].map(stat => (
                                        <div key={stat.key} className="flex-1 flex flex-col items-center gap-2">
                                            <div className={`w-full ${stat.color} rounded-t-full transition-all duration-1000 ease-out`} style={{ height: barHeights[stat.key] }}></div>
                                            <span className="text-label-sm text-on-surface-variant">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Weekly Timeline */}
                            <section className="bg-white/60 backdrop-blur-xl p-8 rounded-lg space-y-6 border border-primary/10">
                                <h3 className="font-headline-md text-primary">7-Day Timeline</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg text-center space-y-2 bg-tertiary-container/20">
                                        <span className="text-[10px] uppercase font-bold text-outline">Mon 12</span>
                                        <div className="w-10 h-10 bg-tertiary-container rounded-full mx-auto flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-on-tertiary-container">sentiment_dissatisfied</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div> {/* <-- RESTORED MISSING CLOSING DIV HERE */}

                    {/* Right Sidebar Column */}
                    <aside className="space-y-8">
                        <section className="bg-white/60 backdrop-blur-xl p-6 rounded-lg bg-primary-container/20 border-primary/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">psychology</span>
                                </div>
                                <h4 className="font-bold text-primary">AI Coach Tip</h4>
                            </div>
                            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                                "I noticed your anxiety peaks mid-week. Consider scheduled 5-minute breathing breaks on Tuesdays."
                            </p>
                        </section>
                    </aside>
                </div>
            </main>

            {/* Bottom Navigation Bar (MOBILE ONLY) - Now with 5 items */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/user-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                {/* ACTIVE STATE ADDED: Journal */}
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