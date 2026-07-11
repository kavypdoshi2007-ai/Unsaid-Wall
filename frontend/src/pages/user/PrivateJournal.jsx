import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Central configuration endpoints[cite: 6]

export default function PrivateJournal() {
    const navigate = useNavigate();
    const [entryText, setEntryText] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('calm'); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const TOKEN_KEY = 'token';

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

    // --- Handle saving the new entry to Database ---
    const handleSave = async () => {
        if (!entryText.trim()) return;

        const headers = getAuthHeaders();
        const userId = getActiveUserId();

        if (!headers || !userId) {
            alert("Authentication Error: Invalid or expired session token. Please log back in.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Uses your central API endpoints map architecture directly[cite: 6]
            const targetUrl = API_ENDPOINTS.JOURNAL.CREATE(userId);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    emotion: selectedEmotion, 
                    intensity: 'med',
                    note: entryText.trim() 
                })
            });

            if (!response.ok) {
                throw new Error(`Server tracking returned error status: ${response.status}`);
            }

            // Route user directly back to dashboard layout to view updated feed metrics
            navigate('/emotion-journal');
        } catch (err) {
            console.error("Error submitting entry to database:", err);
            alert(`Failed to save entry securely: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background text-on-surface min-h-screen pb-24">
            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    <div onClick={() => navigate('/user-wall')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

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
                <section className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-on-surface">Clear your mind.</h2>
                        <p className="text-on-surface-variant mt-1">This space is entirely yours. Nothing written here is shared or monitored.</p>
                    </div>

                    {/* Emotion Picker Selection Layout */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-outline">What is your baseline emotional posture?</label>
                        <div className="flex flex-wrap gap-2">
                            {['sad', 'calm', 'anxious', 'joy' , 'hopeful'].map((emo) => (
                                <button
                                    key={emo}
                                    type="button"
                                    onClick={() => setSelectedEmotion(emo)}
                                    className={`px-4 py-2 text-xs font-bold rounded-full capitalize border transition-all ${selectedEmotion === emo ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-outline-variant/30'}`}
                                >
                                    {emo}
                                </button>
                            ))}
                        </div>
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
                                disabled={!entryText.trim() || isSubmitting}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-full shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer">
                                <span>{isSubmitting ? 'Syncing...' : 'Save Journal'}</span>
                                <span className="material-symbols-outlined text-sm">bookmark</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Mobile Bottom Bar navigation UI component */}
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