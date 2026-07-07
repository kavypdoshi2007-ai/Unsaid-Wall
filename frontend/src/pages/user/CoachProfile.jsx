import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api'; // Central configuration endpoints

export default function CoachProfile() {
    const { id } = useParams(); // Captures the dynamic /coach/:id parameter from the route link
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // --- Dynamic Content State Trees ---
    const [coach, setCoach] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Form Interaction States ---
    const [requestContext, setRequestContext] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate today's date in YYYY-MM-DD format to prevent scheduling past dates
    const today = new Date().toISOString().split('T')[0];

    // 1. FETCH LIVE COACH PROFILE FROM DATABASE
    useEffect(() => {
        if (!id) {
            setError("No coach identifier provided in routing address.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        // Safely determine endpoint fallback path if GET_BY_ID helper isn't predefined
        const fetchUrl = API_ENDPOINTS.COACHES?.GET_BY_ID ? API_ENDPOINTS.COACHES.GET_BY_ID(id) : `${API_ENDPOINTS.COACHES.GET_ALL}/${id}`;

        fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Server returned error status code: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                // Handle different object payloads cleanly
                const finalData = data.coach || data.data || data;
                setCoach(finalData);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error loading coach instance node:", err);
                setError(err.message || "Failed to load structural data node.");
                setIsLoading(false);
            });
    }, [id, token]);

    // 2. DISPATCH SESSION CREATION MUTATION
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Guard clause: redirect to sign-in modal or flow if guest access token is missing
        if (!token) {
            alert("Authentication Required: Please register or login to request an official workspace appointment.");
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            // Pointing to your server session initialization route
            const response = await fetch(API_ENDPOINTS.SESSIONS.CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    coachId: id,
                    preferredDate: selectedDate,
                    context_message: requestContext // FIXED: Linked to match context_message in your controller destructuring
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Request successfully broadcasted! Available coaches will review your request shortly.`);
                navigate('/my-sessions'); // Routes back to user queue tracker dashboard
            } else {
                alert(result.error || result.message || "Could not complete session booking handshake.");
            }
        } catch (err) {
            console.error("Session creation mutation exception caught:", err);
            alert("Network pipeline exception dropped your request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render generic fallback states for network activity tracking without altering core layout
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-outline animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <span>Syncing verified practitioner credentials securely...</span>
            </div>
        );
    }

    if (error || !coach) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <span className="material-symbols-outlined text-error text-5xl mb-4">warning</span>
                <h3 className="font-headline-md text-2xl font-bold mb-2">Profile Unavailable</h3>
                <p className="text-on-surface-variant max-w-sm mb-6 text-sm">{error || "The profile requested could not be resolved or found inside the system directory nodes."}</p>
                <button onClick={() => navigate('/coach-profile')} className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold">Return to Coaches</button>
            </div>
        );
    }

    return (
        <div className="font-body-md text-on-surface overflow-x-hidden bg-background min-h-screen">

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
                    <div onClick={() => navigate(token ? '/user-wall' : '/')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate(token ? '/user-wall' : '/guest-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-12">

                    {/* Left Column: Dynamic Bio */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="relative group">
                                <img 
                                    alt={coach.name || coach.user?.display_name || "Practitioner Avatar"} 
                                    className="relative w-full md:w-64 aspect-[4/5] object-cover rounded-xl shadow-xl shadow-primary/5" 
                                    src={coach.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=512"} 
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-primary font-label-sm tracking-wider uppercase">{coach.title || "Senior Accredited Coach"}</span>
                                    <h1 className="font-display-lg text-display-lg text-on-surface">{coach.name || coach.user?.display_name || "Specialist"}</h1>
                                    <p className="text-on-surface-variant font-body-lg italic">{coach.tagline || "Clinical Psychologist & Emotional Wellness Specialist"}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(coach.specializations || []).map((spec, index) => (
                                        <span key={index} className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold capitalize">
                                            {String(spec).toLowerCase()}
                                        </span>
                                    ))}
                                </div>
                                <div className="pt-4 flex gap-8 border-t border-outline-variant/20">
                                    <div>
                                        <p className="text-[32px] font-bold text-primary">{coach.rating || "0.0"}</p>
                                        <p className="text-label-sm text-on-surface-variant">Rating</p>
                                    </div>
                                    <div>
                                        <p className="text-[32px] font-bold text-primary">{coach.experience_years || coach.experience || "10+"}</p>
                                        <p className="text-label-sm text-on-surface-variant">Years Exp.</p>
                                    </div>
                                    <div>
                                        {/* FIXED HERE: Matches the sessions_count property from your controller block layout */}
                                        <p className="text-[32px] font-bold text-primary">{coach.sessions_count || "0"}</p>
                                        <p className="text-label-sm text-on-surface-variant">Sessions</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="font-headline-md text-headline-md text-on-surface">About {coach.name ? coach.name.split(' ')[0] : 'Specialist'}</h2>
                            <p className="font-body-lg text-on-surface-variant leading-relaxed max-w-2xl whitespace-pre-line">
                                {coach.bio || "I believe that every person carries an 'Unsaid Wall'—a collection of thoughts and feelings we find difficult to share. My practice focuses on creating a safe, non-judgmental space where these walls can be gently dismantled, allowing for genuine growth and renewed clarity."}
                            </p>
                        </section>

                        {/* Philosophy Bento Grid */}
                        <section className="space-y-6">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Philosophy & Approach</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-primary">
                                    <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                    <h3 className="font-headline-md text-xl">Cognitive Compassion</h3>
                                    <p className="text-on-surface-variant">{coach.approach_one || "Integrating evidence-based CBT with deep empathetic listening to address the root of emotional distress."}</p>
                                </div>
                                <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-tertiary">
                                    <span className="material-symbols-outlined text-tertiary text-3xl">eco</span>
                                    <h3 className="font-headline-md text-xl">Growth Mindset</h3>
                                    <p className="text-on-surface-variant">{coach.approach_two || "Focusing on your innate strengths rather than just clinical symptoms to build long-term resilience."}</p>
                                </div>
                                <div className="glass-card p-6 rounded-lg md:col-span-2 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <span className="material-symbols-outlined text-primary text-4xl">calendar_today</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-md text-xl mb-1">Availability</h3>
                                        <p className="text-on-surface-variant">
                                            {coach.availability_text || `${coach.name ? coach.name.split(' ')[0] : 'Specialist'} is currently accepting new clients for weekday evening sessions and Saturday mornings. Typically responds to requests within 4 hours.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Dynamic Request Form */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 bg-white/60 backdrop-blur-xl p-8 rounded-lg shadow-2xl shadow-primary/10 border-t-4 border-primary">
                            <h2 className="font-headline-md text-headline-md mb-2">Request a Session</h2>
                            <p className="text-on-surface-variant text-body-md mb-8">Start your journey toward quiet strength today.</p>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="block text-label-sm font-semibold text-on-surface-variant px-1">Select Preferred Date</label>
                                    <input
                                        required
                                        type="date"
                                        min={today}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-label-sm font-semibold text-on-surface-variant px-1">Context <span className="font-normal text-on-surface-variant/60">(optional)</span></label>
                                    <textarea
                                        value={requestContext}
                                        onChange={(e) => setRequestContext(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                        placeholder="Briefly share what's on your mind... (optional)"
                                        rows="4"></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-primary-dim disabled:opacity-50 text-on-primary font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? 'Sending Request...' : 'Send Request'}
                                    <span className="material-symbols-outlined">send</span>
                                </button>

                                <p className="text-center text-[11px] text-on-surface-variant leading-tight px-4">
                                    By clicking send, you agree to our <a className="underline cursor-pointer" onClick={() => navigate('/privacy-policy')}>Privacy Policy</a> regarding mental health data sharing.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-12 px-6 bg-surface-container-highest border-t border-outline-variant/20">
                <div
                    className="max-w-7xl mx-auto"
                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', width: '100%' }}
                >
                    <div style={{ display: 'block', width: '320px', maxWidth: '100%', flexShrink: 0 }}>
                        <h3 className="font-display-lg text-display-lg font-bold text-on-surface" style={{ display: 'block', marginBottom: '16px' }}>Unsaid Wall</h3>
                        <p className="text-on-surface-variant" style={{ display: 'block', width: '100%' }}>A safe haven for the things you can't say out loud. Professional support when you're ready to speak.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', columnGap: '48px', rowGap: '16px' }}>
                        <div className="space-y-3">
                            <h4 className="font-bold text-primary">Support</h4>
                            <ul className="space-y-2 text-on-surface-variant">
                                <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/contact')}>Contact Us</a></li>
                                <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/help-center')}>Help Center</a></li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-primary">Legal</h4>
                            <ul className="space-y-2 text-on-surface-variant">
                                <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/privacy-policy')}>Privacy Policy</a></li>
                                <li><a className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/terms')}>Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-outline-variant/10 text-center text-on-surface-variant text-sm">
                    © 2026 Unsaid Wall. A space for quiet strength.
                </div>
            </footer>

            {/* Bottom Navigation Bar (MOBILE ONLY) */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate(token ? '/user-wall' : '/guest-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/emotion-journal')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_stories</span>
                    <span className="font-label-sm text-[10px] font-semibold">Journal</span>
                </button>
                <button onClick={() => navigate('/coach-profile')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 cursor-pointer">
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