import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivateJournal() {
    const navigate = useNavigate();
    const [entryText, setEntryText] = useState('');
    const [savedEntries, setSavedEntries] = useState([]);

    // 1. Load saved entries from the browser's local storage when the page opens
    useEffect(() => {
        const storedEntries = JSON.parse(localStorage.getItem('unsaid_private_journals')) || [];
        setSavedEntries(storedEntries);
    }, []);

    // 2. Handle saving the new entry
    const handleSave = () => {
        if (!entryText.trim()) return; // Don't save empty entries

        const newEntry = {
            id: Date.now(),
            text: entryText,
            date: new Date().toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
        };

        const updatedEntries = [newEntry, ...savedEntries];

        // Update the screen
        setSavedEntries(updatedEntries);

        // Save privately to the browser
        localStorage.setItem('unsaid_private_journals', JSON.stringify(updatedEntries));

        // Clear the text box
        setEntryText('');
    };

    return (
        <div className="bg-background text-on-surface min-h-screen pb-24">

            {/* CLEANED HEADER: With Resources Added */}
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
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>
            <main className="pt-24 px-container-padding max-w-[720px] mx-auto space-y-8">
                {/* Composer Section */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-on-surface">Clear your mind.</h2>
                        <p className="text-on-surface-variant mt-1">This space is entirely yours. Nothing written here is shared or monitored.</p>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-primary/20 bg-white/60">
                        <textarea
                            value={entryText}
                            onChange={(e) => setEntryText(e.target.value)}
                            placeholder="What's weighing on you today?"
                            className="w-full min-h-[200px] p-4 bg-transparent outline-none resize-none text-lg text-on-surface placeholder:text-outline-variant"
                        ></textarea>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant/20">
                            <span className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                Private
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={!entryText.trim()}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-full shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer">
                                <span>Save Journal</span>
                                <span className="material-symbols-outlined text-sm">bookmark</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Previous Entries Feed */}
                <section className="space-y-6 pt-8">
                    <h3 className="font-headline-md text-lg text-outline">Past Entries</h3>

                    {savedEntries.length === 0 ? (
                        <p className="text-on-surface-variant italic text-center py-10 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                            Your private journal is currently empty.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {savedEntries.map((entry) => (
                                <article key={entry.id} className="bg-white/80 p-6 rounded-xl border border-outline-variant/20 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">{entry.date}</span>
                                    </div>
                                    <p className="text-on-surface whitespace-pre-wrap leading-relaxed">
                                        {entry.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Bottom Navigation Bar (MOBILE ONLY) - Now with 5 items */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/user-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/emotion-journal')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
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