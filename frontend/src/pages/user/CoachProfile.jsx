import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import Navbar from '../../components/Navbar'; // Adjust path as needed

export default function CoachProfile() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // 🌟 KICKOUT LOGIC: If a guest lands on this user page, redirect to login.
    useEffect(() => {
        if (!token || token === 'null' || token === 'undefined') {
            navigate('/login');
        }
    }, [token, navigate]);

    // --- Directory & Profile States ---
    const [coaches, setCoaches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCoach, setSelectedCoach] = useState(null); // Controls Grid vs Profile View

    // --- Form Interaction States ---
    const [requestContext, setRequestContext] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Filter States ---
    const [activeLanguage, setActiveLanguage] = useState('EN');
    const [activeAvailability, setActiveAvailability] = useState('Anytime');
    const [activeSpecs, setActiveSpecs] = useState([]);
    const [isAllSpecs, setIsAllSpecs] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    // 1. FETCH ALL COACHES FOR DIRECTORY GRID
    useEffect(() => {
        setIsLoading(true);
        fetch(API_ENDPOINTS.COACHES.GET_ALL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load directory items");
                return res.json();
            })
            .then((data) => {
                const coachData = Array.isArray(data) ? data : (data.coaches || []);
                setCoaches(coachData);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Error capturing live coach nodes:", err);
                setIsLoading(false);
            });
    }, [token]);

    // 2. DISPATCH SESSION CREATION
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(API_ENDPOINTS.SESSIONS.CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    coachId: selectedCoach.id, // Uses the currently selected coach
                    preferredDate: selectedDate,
                    context_message: requestContext
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Request successfully broadcasted! Available coaches will review your request shortly.`);
                navigate('/my-sessions');
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

    // Filter Logic
    const handleSpecChange = (spec) => {
        if (spec === 'ALL') {
            setIsAllSpecs(true);
            setActiveSpecs([]);
        } else {
            setIsAllSpecs(false);
            setActiveSpecs(prev => {
                const nextSpecs = prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec];
                if (nextSpecs.length === 0) setIsAllSpecs(true);
                return nextSpecs;
            });
        }
    };

    const matchesFilters = (coach) => {
        const normalizedLangs = (coach.languages || []).map(lang => lang.toUpperCase());
        const hasLang = normalizedLangs.some(lang => lang.includes(activeLanguage.toUpperCase()));

        let hasSpec = true;
        if (!isAllSpecs && activeSpecs.length > 0) {
            const cardSpecs = (coach.specializations || []).map(s => s.toUpperCase());
            hasSpec = activeSpecs.some(filterSpec =>
                cardSpecs.some(dbSpec => dbSpec.includes(filterSpec.toUpperCase()))
            );
        }

        const dbStatus = (coach.availability || 'away').toLowerCase();
        let hasAvailability = true;
        if (activeAvailability === 'Online Now' && dbStatus !== 'available') {
            hasAvailability = false;
        }

        return hasLang && hasSpec && hasAvailability;
    };

    return (
        <div className="bg-background text-on-surface antialiased custom-scrollbar min-h-screen">
            <Navbar />
            // Example: pt-20 on mobile, pt-28 on tablets and up
            <main className="max-w-screen-xl mx-auto px-container-padding py-12 pt-20 md:pt-28">
                {/* 🌟 CONDITIONAL RENDERING: Show Profile Form if selected, otherwise show Grid */}
                {selectedCoach ? (

                    /* --- SECURE USER PROFILE VIEW --- */
                    <div className="space-y-8 animate-fade-in">
                        <button
                            onClick={() => setSelectedCoach(null)}
                            className="flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity cursor-pointer w-max"
                        >
                            <ArrowLeft className="w-5 h-5" /> Back to Coaches
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-12">
                            {/* Left Column: Bio */}
                            <div className="lg:col-span-8 space-y-12">
                                <section className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="relative group">
                                        <img
                                            alt={selectedCoach.name || selectedCoach.user?.display_name || "Practitioner Avatar"}
                                            className="relative w-full md:w-64 aspect-[4/5] object-cover rounded-xl shadow-xl shadow-primary/5"
                                            src={selectedCoach.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=512"}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-primary font-label-sm tracking-wider uppercase">{selectedCoach.title || "Senior Accredited Coach"}</span>
                                            <h1 className="font-display-lg text-display-lg text-on-surface">{selectedCoach.name || selectedCoach.user?.display_name || "Specialist"}</h1>
                                            <p className="text-on-surface-variant font-body-lg italic">{selectedCoach.tagline || "Clinical Psychologist & Emotional Wellness Specialist"}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedCoach.specializations || []).map((spec, index) => (
                                                <span key={index} className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold capitalize">
                                                    {String(spec).toLowerCase()}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="pt-4 flex gap-8 border-t border-outline-variant/20">
                                            <div>
                                                <p className="text-[32px] font-bold text-primary">{selectedCoach.rating || "0.0"}</p>
                                                <p className="text-label-sm text-on-surface-variant">Rating</p>
                                            </div>
                                            <div>
                                                <p className="text-[32px] font-bold text-primary">{selectedCoach.experience_years || selectedCoach.experience || "10+"}</p>
                                                <p className="text-label-sm text-on-surface-variant">Years Exp.</p>
                                            </div>
                                            <div>
                                                <p className="text-[32px] font-bold text-primary">{selectedCoach.sessions_count || "0"}</p>
                                                <p className="text-label-sm text-on-surface-variant">Sessions</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="font-headline-md text-headline-md text-on-surface">About {selectedCoach.name ? selectedCoach.name.split(' ')[0] : 'Specialist'}</h2>
                                    <p className="font-body-lg text-on-surface-variant leading-relaxed max-w-2xl whitespace-pre-line">
                                        {selectedCoach.bio || "I believe that every person carries an 'Unsaid Wall'—a collection of thoughts and feelings we find difficult to share. My practice focuses on creating a safe, non-judgmental space where these walls can be gently dismantled, allowing for genuine growth and renewed clarity."}
                                    </p>
                                </section>

                                <section className="space-y-6">
                                    <h2 className="font-headline-md text-headline-md text-on-surface">Philosophy & Approach</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-primary">
                                            <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                            <h3 className="font-headline-md text-xl">Cognitive Compassion</h3>
                                            <p className="text-on-surface-variant">{selectedCoach.approach_one || "Integrating evidence-based CBT with deep empathetic listening to address the root of emotional distress."}</p>
                                        </div>
                                        <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-tertiary">
                                            <span className="material-symbols-outlined text-tertiary text-3xl">eco</span>
                                            <h3 className="font-headline-md text-xl">Growth Mindset</h3>
                                            <p className="text-on-surface-variant">{selectedCoach.approach_two || "Focusing on your innate strengths rather than just clinical symptoms to build long-term resilience."}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: ACTIVE Booking Form */}
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
                    </div>

                ) : (

                    /* --- USER DIRECTORY GRID VIEW --- */
                    <div className="flex flex-col lg:flex-row gap-12 animate-fade-in">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-72 flex-shrink-0">
                            <div className="sidebar-sticky">
                                <div className="glass-card p-6 rounded-lg border border-outline-variant/20 flex flex-col gap-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Filter className="w-5 h-5 text-primary" />
                                            <h2 className="font-headline-md text-xl text-on-surface">Filters</h2>
                                        </div>

                                        {/* Specialization */}
                                        <div className="mb-6">
                                            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Specialization</label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input checked={isAllSpecs} onChange={() => handleSpecChange('ALL')} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                                                    <span className="text-body-md text-sm text-on-surface group-hover:text-primary transition-colors">All Specializations</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input checked={activeSpecs.includes('CBT')} onChange={() => handleSpecChange('CBT')} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                                                    <span className="text-body-md text-sm text-on-surface group-hover:text-primary transition-colors">CBT Therapy</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input checked={activeSpecs.includes('TRAUMA')} onChange={() => handleSpecChange('TRAUMA')} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                                                    <span className="text-body-md text-sm text-on-surface group-hover:text-primary transition-colors">Trauma Recovery</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input checked={activeSpecs.includes('ANXIETY')} onChange={() => handleSpecChange('ANXIETY')} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                                                    <span className="text-body-md text-sm text-on-surface group-hover:text-primary transition-colors">Anxiety & Stress</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Language */}
                                        <div className="mb-6">
                                            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Language</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['English', 'Hindi', 'Gujarati'].map(lang => {
                                                    const code = lang === 'English' ? 'EN' : lang === 'Hindi' ? 'HI' : 'GU';
                                                    return (
                                                        <button
                                                            key={lang}
                                                            onClick={() => setActiveLanguage(code)}
                                                            className={`py-2 px-3 rounded-lg font-label-sm text-xs transition-colors ${activeLanguage === code
                                                                ? 'border border-primary bg-primary text-on-primary'
                                                                : 'border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-primary'
                                                                }`}>
                                                            {lang}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Availability */}
                                        <div className="mb-6">
                                            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Availability</label>
                                            <div className="relative">
                                                <select
                                                    value={activeAvailability}
                                                    onChange={(e) => setActiveAvailability(e.target.value)}
                                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none appearance-none text-sm pr-10">
                                                    <option value="Anytime">Anytime</option>
                                                    <option value="Available Today">Available Today</option>
                                                    <option value="Available this Week">Available this Week</option>
                                                    <option value="Online Now">Online Now</option>
                                                </select>
                                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content Grid */}
                        <div className="flex-1">
                            <div className="mb-10">
                                <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">Vetted Coaches</h1>
                                <p className="text-on-surface-variant max-w-3xl font-body-lg text-body-lg">Every coach on our platform undergoes a rigorous vetting process to ensure you receive the highest quality of compassionate care.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {isLoading ? (
                                    <div className="col-span-full text-center py-32 text-on-surface-variant font-body-md flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Syncing verified connections securely...</span>
                                    </div>
                                ) : coaches.filter(matchesFilters).length === 0 ? (
                                    <div className="col-span-full text-center py-24 text-on-surface-variant font-body-md bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center p-8">
                                        <AlertCircle className="text-outline w-12 h-12 mb-4" />
                                        <h3 className="font-headline-sm font-bold mb-1 text-on-surface">No matches found</h3>
                                        <p className="text-sm max-w-md w-full mx-auto">No specialists match your selected criteria right now. Try adjusting your filter parameters or timeline options.</p>
                                    </div>
                                ) : (
                                    coaches.filter(matchesFilters).map((coach) => {
                                        const isAvailable = coach.availability === 'available';
                                        return (
                                            <div key={coach.id} className="glass-card rounded-lg p-6 border border-outline-variant/10 transition-all duration-300 coach-card-shadow flex flex-col group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="relative">
                                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                                                            <img
                                                                alt={coach.name || coach.user?.display_name || "Coach Avatar"}
                                                                className="w-full h-full object-cover"
                                                                src={coach.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256"}
                                                            />
                                                        </div>
                                                        <div className={`absolute bottom-1 right-1 w-5 h-5 border-2 border-white rounded-full ${isAvailable ? 'bg-primary' : 'bg-outline-variant'}`} title={coach.availability}></div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wider uppercase ${isAvailable ? 'bg-primary/10 text-primary' : 'bg-on-surface-variant/10 text-on-surface-variant'}`}>
                                                        {coach.availability || 'away'}
                                                    </span>
                                                </div>

                                                <div className="mb-4">
                                                    <h3 className="font-headline-md text-xl mb-1 text-on-surface">
                                                        {coach.name || coach.user?.display_name || "Specialist"}
                                                    </h3>
                                                    <p className="text-on-surface-variant font-body-md text-sm mb-4 line-clamp-1">
                                                        {coach.specializations && coach.specializations.length > 0 ? coach.specializations.join(" • ") : "Support Specialist"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                        {(coach.specializations || []).map((spec, idx) => (
                                                            <span key={idx} className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">
                                                            {(coach.languages || ['EN']).join(' / ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-on-surface-variant text-sm line-clamp-3 leading-relaxed">
                                                        {coach.bio || "Vetted psychological assistance agent verified under structural safety policies."}
                                                    </p>
                                                </div>

                                                <div className="mt-auto flex flex-col gap-3">
                                                    {/* 🌟 UNLOCKED: Both buttons open the profile so the user can fill out the form */}
                                                    <button
                                                        onClick={() => setSelectedCoach(coach)}
                                                        className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        Request Session
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedCoach(coach)}
                                                        className="w-full py-3 rounded-full border-1.5 border-primary text-primary font-label-sm text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer"
                                                    >
                                                        View Profile
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}