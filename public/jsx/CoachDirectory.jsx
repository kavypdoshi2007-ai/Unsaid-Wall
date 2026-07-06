import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachDirectory() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('request'); // <-- NEW: Tracks which button was clicked

    const navigate = useNavigate();

    // Filter States
    const [activeLanguage, setActiveLanguage] = useState('EN');
    const [activeAvailability, setActiveAvailability] = useState('Anytime');
    const [activeSpecs, setActiveSpecs] = useState([]);
    const [isAllSpecs, setIsAllSpecs] = useState(true);

    const handleSpecChange = (spec) => {
        if (spec === 'ALL') {
            setIsAllSpecs(true);
            setActiveSpecs([]);
        } else {
            setIsAllSpecs(false);
            setActiveSpecs(prev =>
                prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
            );
        }
    };

    // Helper to determine if a card should be visible based on filters
    const matchesFilters = (cardStatus, cardSpecs, cardLang) => {
        const hasLang = cardLang.includes(activeLanguage);
        let hasSpec = true;
        if (!isAllSpecs && activeSpecs.length > 0) {
            hasSpec = activeSpecs.some(spec => cardSpecs.includes(spec));
        }
        let hasAvailability = true;
        if (activeAvailability === 'Online Now' && cardStatus !== 'ONLINE') {
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
                                    <h2 className="font-headline-md text-xl mb-6 text-on-surface">Filters</h2>
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
                                        <select
                                            value={activeAvailability}
                                            onChange={(e) => setActiveAvailability(e.target.value)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none appearance-none text-sm">
                                            <option>Anytime</option>
                                            <option>Available Today</option>
                                            <option>Available this Week</option>
                                            <option>Online Now</option>
                                        </select>
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

                            {/* Coach Card 1 */}
                            <div style={{ display: matchesFilters('ONLINE', ['CBT', 'TRAUMA'], 'EN HI') ? 'flex' : 'none' }} className="glass-card rounded-lg p-6 border border-outline-variant/10 transition-all duration-300 coach-card-shadow flex flex-col group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                                            <img alt="Coach Arpita" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBns-EHfmOC98EYaRZsWv4gn02aqqeYMQQYB2jr5bdqBkGkU2CWu_yligAiPO5Fbt-EioBzhsdcHRfiPSVTDTm5F58pSBsA8fnvgiwo-j8pXPpt5tsUvH0TI8JC3w9AKJnuQIBz-dbaVvUtEXCLyVZt_xrBss0GWG_EkYAxSwBScLjvDwvj3Ye1O1rUqRAzj5amPHqSxxX70QofP0XkvQdbF_Jc2xmOy6Vs5rclSbWgQKtByu_wYO6IealOvwSIvelNLYT0VMvBRGvc" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary border-2 border-white rounded-full" title="Online"></div>
                                    </div>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wider uppercase">Online</span>
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-headline-md text-xl mb-1 text-on-surface">Arpita Sharma</h3>
                                    <p className="text-on-surface-variant font-body-md text-sm mb-4">Senior Trauma & CBT Specialist</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">CBT</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Trauma</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">EN / HI</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-3">
                                    <button onClick={() => { setModalAction('request'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">Request Session</button>
                                    <button onClick={() => { setModalAction('profile'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full border-1.5 border-primary text-primary font-label-sm text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer">View Profile</button>
                                </div>
                            </div>

                            {/* Coach Card 2 */}
                            <div style={{ display: matchesFilters('AWAY', ['ANXIETY'], 'EN GU') ? 'flex' : 'none' }} className="glass-card rounded-lg p-6 border border-outline-variant/10 transition-all duration-300 coach-card-shadow flex flex-col group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                                            <img alt="Coach Rohan" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiVdeFe8xquq-k8E1VXlG9rOh6Ocg1KsUICSRn30VaKCjOFKr4ETv0p10Smw0Nb0FHqLc8XSJ1Ky7gvx0mDQlWiPralBk7Kcv8i2Vo6NbMLawl4-hyYLAF3Pv0F1LD-WMaKYRlGsCLT4Rwzb9UDkiW7yMZ1AfwFzB-R-pUCx8AQ_3JsVYCewlJEhMUZiKbjoy0K9Xnjlbog49kgi5M6KSuUsmoURW1fyzuJ75T7bwtH3qHQMRSp44x-RaVT4mh3K_ya-pzVe8jXNu7" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-outline-variant border-2 border-white rounded-full" title="Away"></div>
                                    </div>
                                    <span className="bg-on-surface-variant/10 text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wider uppercase">Away</span>
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-headline-md text-xl mb-1 text-on-surface">Rohan Mehta</h3>
                                    <p className="text-on-surface-variant font-body-md text-sm mb-4">Mindfulness & Anxiety Specialist</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Anxiety</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Mindfulness</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">EN / GU</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-3">
                                    <button onClick={() => { setModalAction('request'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">Request Session</button>
                                    <button onClick={() => { setModalAction('profile'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full border-1.5 border-primary text-primary font-label-sm text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer">View Profile</button>
                                </div>
                            </div>

                            {/* Coach Card 3 */}
                            <div style={{ display: matchesFilters('ONLINE', [], 'EN') ? 'flex' : 'none' }} className="glass-card rounded-lg p-6 border border-outline-variant/10 transition-all duration-300 coach-card-shadow flex flex-col group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                                            <img alt="Coach Sarah" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVFbw5f0Xd0xlsGKFbJZC5Bspf1o-VolH49isG4c0TKaWIFQm-hGEzHaZUvE2WGAmY9oKEAWCErm-s7qocsL872qF6gsT4onYTm54Tjww7A_r_gqI-z_6aNEF4s-NsEoWT9WlrqiEFGNz71W2FmnaLJV6mHf6uSwJVdHnpdpxZsGmD5vflAL3bfPsKduy96lfyAazRZt9FkJykq7uiCv53UDDSnz1UDPGbiyHt0z48BYHx5hErfRzSjzI7v8zBbWcw8PWXRJ6n0NMV" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-primary border-2 border-white rounded-full" title="Online"></div>
                                    </div>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wider uppercase">Online</span>
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-headline-md text-xl mb-1 text-on-surface">Dr. Sarah Jenkins</h3>
                                    <p className="text-on-surface-variant font-body-md text-sm mb-4">Grief & Relationship Counselor</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Relationships</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Grief</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">EN</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-3">
                                    <button onClick={() => { setModalAction('request'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">Request Session</button>
                                    <button onClick={() => { setModalAction('profile'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full border-1.5 border-primary text-primary font-label-sm text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer">View Profile</button>
                                </div>
                            </div>

                            {/* Coach Card 4 */}
                            <div style={{ display: matchesFilters('AWAY', [], 'EN') ? 'flex' : 'none' }} className="glass-card rounded-lg p-6 border border-outline-variant/10 transition-all duration-300 coach-card-shadow flex flex-col group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                                            <img alt="Coach Michael" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA00BQwFDLXxhk_46ogGT17c-26HJ9zE5GJJsE94OKDcTCw6AM3-Hqv86Y3BJ-5EA6zu7S2AYhslpF4-3OnsCzYudnleUrD9om60mFvfNPU3qyLMap2yuJMp1YtQ8L0IIhOtNDGHq25XgTnnhewssZ1bSE8bdafU6Q1xhu0gcm7sNYf6YX8ELioMaaEnsKoWQPJcGqIdLHfABoNvsHSlUzFKEWBWU4qvQYzDqwyy4NMcgUxqqat2BEqEtltabLOscBZly5Alp-0EJK" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-outline-variant border-2 border-white rounded-full" title="Away"></div>
                                    </div>
                                    <span className="bg-on-surface-variant/10 text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-[11px] font-bold tracking-wider uppercase">Away</span>
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-headline-md text-xl mb-1 text-on-surface">Michael Chen</h3>
                                    <p className="text-on-surface-variant font-body-md text-sm mb-4">Adolescent & School Counselor</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Teens</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">Academic Stress</span>
                                        <span className="bg-secondary-container/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-medium border border-secondary/10">EN</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col gap-3">
                                    <button onClick={() => { setModalAction('request'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full bg-primary text-on-primary font-label-sm text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">Request Session</button>
                                    <button onClick={() => { setModalAction('profile'); setIsLoginModalOpen(true); }} className="w-full py-3 rounded-full border-1.5 border-primary text-primary font-label-sm text-sm font-bold hover:bg-primary/5 transition-all cursor-pointer">View Profile</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation Bar (Mobile) */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 lg:hidden shadow-[0_-4px_20px_-2px_rgba(118,138,126,0.05)]">
                <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/coach-profile')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 scale-110 cursor-pointer">
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <span className="font-label-sm text-[10px] font-semibold">Coaches</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1">library_books</span>
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </nav>

            {/* Dynamic Login Prompt Modal */}
            {isLoginModalOpen && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setIsLoginModalOpen(false) }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-[400px] p-8 rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col text-center">

                        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">
                                {modalAction === 'request' ? 'lock' : 'account_circle'}
                            </span>
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