import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachProfile() {
    const [requestContext, setRequestContext] = useState('');
    const [selectedDate, setSelectedDate] = useState(''); // <-- ADDED state for date
    const navigate = useNavigate();

    // <-- ADDED: Calculate today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Request sent to Dr. Jenkins for ${selectedDate}. She will review your context and respond shortly.`);
    };

    return (
        <div className="font-body-md text-on-surface overflow-x-hidden bg-background min-h-screen">

            {/* CLEANED HEADER: With Resources Added */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
                    {/* Left: Logo */}
                    <div onClick={() => navigate('/user-wall')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

                    {/* Right: Nav Links ONLY */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/user-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Journal</button>
                        {/* ACTIVE STATE SET FOR COACHES */}
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-12">

                    {/* Left Column: Bio */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="relative group">
                                <img alt="Dr. Sarah Jenkins" className="relative w-full md:w-64 aspect-[4/5] object-cover rounded-xl shadow-xl shadow-primary/5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6VJVRWaxB7_8KfNgCun-ArwyowZLU14rdaCCLXyv1wUoMMDVnvGgfmx8L4mHzEOoi9lBG570S08BoLfRAegyQJcODCi7NoABKE9W88e4Hibx5tX2YezhwnvfiP7N0bFb-nKqr8Hw66cigqs7aLe1TEHodnEajUGwHJlR0-XXgB0B3MyKCmWXB_beDlRwc7iDFXcCT72FtNl9VNzCPXu11_yH88YXZbF4UgLkBgxfgsGhhIHJT0iIfrpr50A1usAOXYPwehmIrJ_t9" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-primary font-label-sm tracking-wider uppercase">Senior Accredited Coach</span>
                                    <h1 className="font-display-lg text-display-lg text-on-surface">Dr. Sarah Jenkins</h1>
                                    <p className="text-on-surface-variant font-body-lg italic">Clinical Psychologist & Emotional Wellness Specialist</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-semibold">Anxiety</span>
                                    <span className="px-4 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-label-sm font-semibold">Work Burnout</span>
                                    <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-label-sm font-semibold">Life Transitions</span>
                                </div>
                                <div className="pt-4 flex gap-8 border-t border-outline-variant/20">
                                    <div>
                                        <p className="text-[32px] font-bold text-primary">4.9</p>
                                        <p className="text-label-sm text-on-surface-variant">Rating</p>
                                    </div>
                                    <div>
                                        <p className="text-[32px] font-bold text-primary">12+</p>
                                        <p className="text-label-sm text-on-surface-variant">Years Exp.</p>
                                    </div>
                                    <div>
                                        <p className="text-[32px] font-bold text-primary">2.4k</p>
                                        <p className="text-label-sm text-on-surface-variant">Sessions</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="font-headline-md text-headline-md text-on-surface">About Sarah</h2>
                            <p className="font-body-lg text-on-surface-variant leading-relaxed max-w-2xl">
                                I believe that every person carries an 'Unsaid Wall'—a collection of thoughts and feelings we find difficult to share. My practice focuses on creating a safe, non-judgmental space where these walls can be gently dismantled, allowing for genuine growth and renewed clarity.
                            </p>
                        </section>

                        {/* Philosophy Bento Grid */}
                        <section className="space-y-6">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Philosophy & Approach</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-primary">
                                    <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                                    <h3 className="font-headline-md text-xl">Cognitive Compassion</h3>
                                    <p className="text-on-surface-variant">Integrating evidence-based CBT with deep empathetic listening to address the root of emotional distress.</p>
                                </div>
                                <div className="glass-card p-6 rounded-lg space-y-3 border-l-4 border-tertiary">
                                    <span className="material-symbols-outlined text-tertiary text-3xl">eco</span>
                                    <h3 className="font-headline-md text-xl">Growth Mindset</h3>
                                    <p className="text-on-surface-variant">Focusing on your innate strengths rather than just clinical symptoms to build long-term resilience.</p>
                                </div>
                                <div className="glass-card p-6 rounded-lg md:col-span-2 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <span className="material-symbols-outlined text-primary text-4xl">calendar_today</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-md text-xl mb-1">Availability</h3>
                                        <p className="text-on-surface-variant">Sarah is currently accepting new clients for weekday evening sessions and Saturday mornings. Typically responds to requests within 4 hours.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Request Form */}
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
                                        min={today} /* <-- ADDED: Prevents past dates */
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

                                <button type="submit" className="w-full bg-primary hover:bg-primary-dim text-on-primary font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    Send Request
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
                    © 2024 Unsaid Wall. A space for quiet strength.
                </div>
            </footer>

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
                {/* ACTIVE STATE SET FOR COACHES ON MOBILE */}
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