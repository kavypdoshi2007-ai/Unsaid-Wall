import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, Sparkles, Smile, BookOpen, Shield, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api'; 

export default function CoachDirectory() {
    const [coaches, setCoaches] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('request'); 

    const navigate = useNavigate();
    const token = localStorage.getItem('token'); 

    // Filter States
    const [activeLanguage, setActiveLanguage] = useState('EN');
    const [activeAvailability, setActiveAvailability] = useState('Anytime');
    const [activeSpecs, setActiveSpecs] = useState([]);
    const [isAllSpecs, setIsAllSpecs] = useState(true);

    // 1. FETCH DIRECTORY DATA
    useEffect(() => {
        setIsLoading(true);
        fetch(API_ENDPOINTS.COACHES.GET_ALL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                ...(token && { 'Authorization': `Bearer ${token}` })
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

    // 2. DISPATCH LIVE HANDSHAKE SESSION CREATION REQUEST
    const handleSessionRequest = async (coachId) => {
        if (!token) {
            setModalAction('request');
            setIsLoginModalOpen(true);
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.SESSIONS.CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ coach_id: coachId })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Workspace requested successfully! Redirecting to sessions dashboard...");
                navigate('/my-sessions'); 
            } else {
                alert(result.error || "Could not complete session booking handshake.");
            }
        } catch (err) {
            console.error("Session creation mutation exception caught:", err);
            alert("Network pipeline exception dropped your request. Try again.");
        }
    };

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

    // 🌟 FIXED: Bulletproof case-insensitive filter matching logic
    const matchesFilters = (coach) => {
        // 1. Language Check
        const normalizedLangs = (coach.languages || []).map(lang => lang.toUpperCase());
        const hasLang = normalizedLangs.some(lang => lang.includes(activeLanguage.toUpperCase()));
        
        // 2. Specialization Check
        let hasSpec = true;
        if (!isAllSpecs && activeSpecs.length > 0) {
            const cardSpecs = (coach.specializations || []).map(s => s.toUpperCase());
            // Matches if any active spec search string is a substring of what's inside the database array
            hasSpec = activeSpecs.some(filterSpec => 
                cardSpecs.some(dbSpec => dbSpec.includes(filterSpec.toUpperCase()))
            );
        }

        // 3. Availability Check
        const dbStatus = (coach.availability || 'away').toLowerCase();
        let hasAvailability = true;
        if (activeAvailability === 'Online Now' && dbStatus !== 'available') {
            hasAvailability = false;
        }

        return hasLang && hasSpec && hasAvailability;
    };

    return (
        <div className="bg-background text-on-surface antialiased custom-scrollbar">
            {/* Top Navigation Header */}
            <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 sticky z-40 shadow-[0_4px_20px_-2px_rgba(118,138,126,0.08)]">
                <nav className="flex justify-between items-center w-full px-container-padding py-4 max-w-screen-xl mx-auto">
                    <div className="flex items-center gap-8">
                        <span onClick={() => navigate('/')} className="font-display-lg-mobile text-display-lg-mobile font-semibold text-primary cursor-pointer hover:opacity-80">Unsaid Wall</span>
                        <div className="hidden lg:flex items-center gap-8">
                            <button onClick={() => navigate('/guest-wall')} className="font-label-sm text-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                            <button onClick={() => navigate('/coach-profile')} className="font-label-sm text-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Coaches</button>
                            <button onClick={() => navigate('/resources')} className="font-label-sm text-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate('/login')} className="py-2 px-4 bg-primary text-on-primary rounded-full font-label-sm text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">
                            Login / Register
                        </button>
                    </div>
                </nav>
            </header>

            <main className="max-w-screen-xl mx-auto px-container-padding py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    
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

                        {/* Coach Cards Grid */}
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
                                    <p className="text-sm max-w-sm">No specialists match your selected criteria right now. Try adjusting your filter parameters or timeline options.</p>
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
                                                <button 
                                                    onClick={() => handleSessionRequest(coach.id)} 
                                                    className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                                >
                                                    Request Session
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (!token) {
                                                            setModalAction('profile');
                                                            setIsLoginModalOpen(true);
                                                        } else {
                                                            navigate(`/coach/${coach.id}`);
                                                        }
                                                    }} 
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
            </main>

            {/* Bottom Navigation Bar (Mobile) */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 lg:hidden shadow-[0_-4px_20px_-2px_rgba(118,138,126,0.05)]">
                <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors cursor-pointer">
                    <Sparkles className="w-5 h-5 mb-1" />
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/coach-profile')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 scale-110 cursor-pointer">
                    <Smile className="w-5 h-5 mb-1" />
                    <span className="font-label-sm text-[10px] font-semibold">Coaches</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors cursor-pointer">
                    <BookOpen className="w-5 h-5 mb-1" />
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </nav>

            {/* Dynamic Login Prompt Modal */}
            {isLoginModalOpen && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setIsLoginModalOpen(false) }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-[400px] p-8 rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col text-center">

                        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                            {modalAction === 'request' ? <Lock className="w-7 h-7" /> : <UserCheck className="w-7 h-7" />}
                        </div>

                        <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-3">
                            {modalAction === 'request' ? 'Sign in to book a session' : 'Unlock Full Profiles'}
                        </h3>
                        <p className="text-on-surface-variant font-body-md mb-8">
                            {modalAction === 'request'
                                ? 'You need an account to request private sessions with our vetted coaches. Your privacy is our priority.'
                                : 'Create an account to view detailed coach credentials, read reviews, and explore their specialized therapeutic approaches.'}
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-on-primary rounded-full font-label-sm text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all">
                                Login / Sign Up
                            </button>
                            <button onClick={() => setIsLoginModalOpen(false)} className="w-full py-3 text-outline font-label-sm text-sm font-bold hover:text-primary transition-colors">
                                Maybe Later
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}