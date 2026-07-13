import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Central configuration endpoints[cite: 6]
import Navbar from '../../components/Navbar';
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
            <Navbar />
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
                            {['sad', 'alone', 'anxious', 'angry', "numb" , "overwhelmed" , 'hopeful'].map((emo) => (
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
        </div>
    );
}
