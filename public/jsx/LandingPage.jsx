import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTED NAVIGATION

export default function LandingPage() {
    const navigate = useNavigate(); // 2. INITIALIZED NAVIGATION

    // --- Breathing Helper State ---
    const [breathingText, setBreathingText] = useState('Take a moment to ground yourself. Click to start.');
    const [breathCount, setBreathCount] = useState(0);
    const [breathState, setBreathState] = useState('idle');

    const startBreathing = () => {
        if (breathState !== 'idle') return;
        setBreathState('inhale');
        setBreathingText('Inhale slowly...');
    };

    useEffect(() => {
        if (breathState === 'idle') return;

        let timer;
        if (breathState === 'inhale') {
            timer = setTimeout(() => {
                setBreathState('hold');
                setBreathingText('Hold...');
            }, 4000);
        } else if (breathState === 'hold') {
            timer = setTimeout(() => {
                setBreathState('exhale');
                setBreathingText('Exhale fully...');
            }, 4000);
        } else if (breathState === 'exhale') {
            timer = setTimeout(() => {
                setBreathState('idle');
                setBreathingText('Well done. Tap to start again.');
                setBreathCount(prev => prev + 1);
            }, 4000);
        }

        return () => clearTimeout(timer);
    }, [breathState]);

    return (
        <div className="bg-background text-on-background font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed scroll-smooth">
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm dark:shadow-none">
                <div className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
                    <div
                        onClick={() => navigate('/')}
                        className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim cursor-pointer"
                    >
                        Unsaid Wall
                    </div>
                    {/* Desktop Nav - NOW WIRED UP */}
                    <div className="hidden md:flex items-center gap-lg">
                        <button
                            onClick={() => navigate('/guest-wall')}
                            className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-body-md text-body-md cursor-pointer"
                        >
                            The Wall
                        </button>
                        <button onClick={() => navigate('/coach-directory')} className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-body-md text-body-md cursor-pointer">
                            Coaches
                        </button>
                        {/* Inside your LandingPage.jsx top navigation */}
                        <button
                            onClick={() => navigate('/resources')}
                            className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-body-md text-body-md cursor-pointer"
                        >
                            Resource Library
                        </button>
                        <button
                            onClick={() => {
                                const aboutSection = document.getElementById('how-it-works');
                                if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-body-md text-body-md cursor-pointer"
                        >
                            About
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-16">
                {/* Hero Section */}
                <section className="relative min-h-[921px] flex items-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img
                            className="w-full h-full object-cover opacity-40"
                            alt="Tranquil landscape"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZAXVdw0YZ5rLl9QSc3SsLAnhcZ85X_j2z_ChHTgi6vRpYueYvGJibLMcrGfrwQ1eiYWVq9lpQmhH3gV4Ce_W_xD0UAC8AiudVQpaHE19xhiJGaKYrp1iTzzEWrmDPi_SD2yXO6WzQsWHSsAlTqHVNW7dyw8Fn0yMgCC2ZdMTDxNSvzoVg4uFlaRJSMk3w-YifPHMp05rLfY1cT7jcLsSCrtu1rXbvW7zRrwmUbgKMGnHGz5RzFxfsaO8owHGbt1XCLBKoC5R7Ydk"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background"></div>
                    </div>
                    <div className="relative z-10 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center md:text-left grid md:grid-cols-2 gap-lg items-center">
                        <div className="space-y-md">
                            <h1 className="font-display-lg text-display-lg md:text-display-lg text-on-surface leading-tight">
                                Your thoughts deserve a <span className="text-primary italic">safe space.</span>
                            </h1>
                            <p className="font-body-lg text-body-lg text-on-surface-variant w-full max-w-[600px]">
                                Share anonymously, gain emotional insights, and connect with expert coaches. You are not alone on this journey.
                            </p>

                            {/* HERO BUTTONS - NOW WIRED UP */}
                            <div className="flex flex-col sm:flex-row gap-base pt-sm">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-primary text-on-primary px-lg py-4 rounded-full font-label-md text-label-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                                >
                                    Join the Community
                                </button>
                                <button
                                    onClick={() => navigate('/guest-wall')}
                                    className="border-2 border-primary text-primary px-lg py-4 rounded-full font-label-md text-label-md hover:bg-primary/5 transition-colors cursor-pointer"
                                >
                                    Explore The Wall
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:block relative">

                            {/* Interactive Breathing Component */}
                            <div
                                onClick={startBreathing}
                                className="glass-card p-lg rounded-xl relative overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl transition-all group select-none active:scale-[0.98]"
                            >
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full transition-transform duration-[4000ms] ease-in-out ${breathState === 'inhale' || breathState === 'hold' ? 'scale-[1.8]' : 'scale-100'
                                    } ${breathState === 'idle' ? 'animate-[pulse-soft_4s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}></div>

                                <div className="relative z-10 text-center space-y-md">
                                    <span className={`material-symbols-outlined text-4xl transition-colors duration-1000 ${breathState !== 'idle' ? 'text-primary-dim' : 'text-primary'}`}>air</span>
                                    <h3 className="font-headline-md text-headline-md text-primary">Pause for a breath</h3>

                                    <p className={`font-body-md text-body-md transition-colors duration-500 font-medium ${breathState !== 'idle' ? 'text-primary-dim text-lg' : 'text-on-surface-variant italic'}`}>
                                        {breathingText}
                                    </p>

                                    <div className="h-6 mt-2 transition-opacity duration-500">
                                        {breathCount > 0 && breathState === 'idle' && (
                                            <span className="text-caption font-label-md text-primary/70 bg-primary/10 px-3 py-1 rounded-full">
                                                Breaths completed: {breathCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* The Anonymous Wall Section */}
                <section className="py-xl bg-surface-container-lowest">
                    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-lg gap-md">
                            <div className="max-w-2xl">
                                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-base">The Anonymous Wall</h2>
                                <p className="font-body-lg text-body-lg text-on-surface-variant">
                                    A collective journal of unspoken truths, shared without judgment or identity.
                                </p>
                            </div>
                            <div className="flex gap-sm">
                                <span className="flex items-center gap-xs px-md py-xs bg-secondary-container text-on-secondary-container rounded-full text-caption font-label-md">
                                    <span className="material-symbols-outlined text-sm">verified_user</span> Moderated
                                </span>
                                <span className="flex items-center gap-xs px-md py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full text-caption font-label-md">
                                    <span className="material-symbols-outlined text-sm">visibility_off</span> 100% Anonymous
                                </span>
                            </div>
                        </div>
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-gutter space-y-gutter">
                            {/* Sample Post 1 */}
                            <div className="break-inside-avoid bg-white p-lg rounded-xl shadow-sm border border-outline-variant/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-start mb-sm">
                                    <span className="px-sm py-1 bg-surface-container-low text-secondary rounded-full text-caption font-label-md">Grief</span>
                                    <span className="text-caption text-outline">2h ago</span>
                                </div>
                                <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-md">
                                    "Some days the silence in the house is so loud I can't even hear my own thoughts. I miss her voice most of all."
                                </p>
                                <div className="flex items-center gap-sm text-outline">
                                    <span className="material-symbols-outlined text-md">favorite</span>
                                    <span className="text-caption">12 hearts</span>
                                </div>
                            </div>
                            {/* Sample Post 2 */}
                            <div className="break-inside-avoid bg-white p-lg rounded-xl shadow-sm border border-outline-variant/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-start mb-sm">
                                    <span className="px-sm py-1 bg-surface-container-low text-secondary rounded-full text-caption font-label-md">Work-Life</span>
                                    <span className="text-caption text-outline">5h ago</span>
                                </div>
                                <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-md">
                                    "I'm succeeding by everyone else's standards, but I feel like I'm drowning in my own expectations. Is it okay to just want to stop for a while?"
                                </p>
                                <div className="flex items-center gap-sm text-outline">
                                    <span className="material-symbols-outlined text-md">favorite</span>
                                    <span className="text-caption">45 hearts</span>
                                </div>
                            </div>
                            {/* Sample Post 3 */}
                            <div className="break-inside-avoid bg-white p-lg rounded-xl shadow-sm border border-outline-variant/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-start mb-sm">
                                    <span className="px-sm py-1 bg-surface-container-low text-secondary rounded-full text-caption font-label-md">Hope</span>
                                    <span className="text-caption text-outline">Just now</span>
                                </div>
                                <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-md">
                                    "Finally took that first step today. It was small, but it felt like a mountain. Grateful for the courage I found here."
                                </p>
                                <div className="flex items-center gap-sm text-outline">
                                    <span className="material-symbols-outlined text-md">favorite</span>
                                    <span className="text-caption">8 hearts</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-lg text-center">
                            <button onClick={() => navigate('/guest-wall')} className="text-primary font-label-md hover:underline flex items-center gap-xs mx-auto cursor-pointer">
                                View more from the wall <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* AI Emotion Insights Section */}
                <section id="how-it-works" className="py-xl bg-surface">
                    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-2 gap-lg items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative p-lg glass-card rounded-xl shadow-lg border-primary/10">
                                <div className="space-y-md">
                                    <div className="flex items-center gap-sm">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">psychology</span>
                                        </div>
                                        <h4 className="font-headline-md text-headline-md text-primary">Insight Report</h4>
                                    </div>
                                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[75%]"></div>
                                    </div>
                                    <div className="flex justify-between text-caption font-label-md text-on-surface-variant">
                                        <span>Emotional Resilience</span>
                                        <span>75% Stability</span>
                                    </div>
                                    <p className="font-body-md text-body-md text-on-surface-variant italic border-l-4 border-primary/20 pl-md py-xs">
                                        "Your recent posts suggest a pattern of 'Reflection' followed by 'Growth'. You are navigating this phase with awareness."
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-md">
                            <span className="text-primary font-label-md tracking-wider uppercase">Emotional Intelligence</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight">
                                Understand your feelings through AI analysis.
                            </h2>
                            <p className="font-body-lg text-body-lg text-on-surface-variant">
                                Our private AI identifies patterns in your sharing, helping you name emotions you might be struggling to define. It's like a personal emotional mirror, reflecting your progress back to you.
                            </p>
                            <ul className="space-y-sm">
                                <li className="flex items-start gap-sm">
                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                    <span className="font-body-md text-body-md text-on-surface">Detect subtle shifts in your mental well-being over time.</span>
                                </li>
                                <li className="flex items-start gap-sm">
                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                    <span className="font-body-md text-body-md text-on-surface">Privacy-first processing—your identity is never revealed.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Verified Coaches Section */}
                <section className="py-xl bg-surface-container-low">
                    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
                        <div className="text-center mb-lg">
                            <div className="inline-flex items-center gap-xs px-md py-1 bg-white border border-outline-variant rounded-full text-caption font-label-md text-secondary mb-md">
                                <span className="material-symbols-outlined text-sm">handshake</span> In partnership with Surat Psychology Club
                            </div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">Guided by Experts</h2>
                            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                                Sometimes, a listening ear needs to be a professional one. Connect with verified mental health experts for personalized support.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-gutter">
                            {/* Coach 1 */}
                            <div className="bg-white p-lg rounded-xl text-center shadow-sm border border-transparent hover:border-primary/20 transition-all group">
                                <div className="w-24 h-24 mx-auto mb-md rounded-full overflow-hidden border-4 border-surface-container">
                                    <img className="w-full h-full object-cover" alt="Dr. Ananya Mehta" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB47eql7E1shj7x9ZcoYJ4EDbMiU0U8VsGPGhAaNAsR93EX2paEufA_F87iNu5ZFGJetK4rmzd2j51eio8-RgbCuaptL3wsesmOTqE1XBJCcRcVQxmWFhzsg5S6TKACy-A3tHZdQxxWPzBdk4kxTQZ6B9YPBEiZDI15IUYTBS_holRsE0xZYwsiiBifrbOKas5Ac4sHUTPCyP5tk041LpROPdkth4M65FjqnIomVCadHZLLQ-YuAnojpTUnAZYaiCBJ68pEmfcF6UU" />
                                </div>
                                <h4 className="font-headline-md text-headline-md text-on-surface">Dr. Ananya Mehta</h4>
                                <p className="text-primary font-label-md mb-md">Trauma & Resilience</p>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Specializing in helping young adults navigate life transitions and grief.</p>
                            </div>
                            {/* Coach 2 */}
                            <div className="bg-white p-lg rounded-xl text-center shadow-sm border border-transparent hover:border-primary/20 transition-all group">
                                <div className="w-24 h-24 mx-auto mb-md rounded-full overflow-hidden border-4 border-surface-container">
                                    <img className="w-full h-full object-cover" alt="Rahul Varma" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSy_McCKYdHPcknKXNO4oAeMbh0BAdf_R0fnUgLfRADzme3-jnYzh4BhzWnPxMCrzOQqj6Jm0vXs3xcbMZY5jYlleinvw8_3b0m2oern7YvtEIMeBDb5CJIlX_2DxmhKQxEsYxSWP3FrQwMYZ2uY5dH7GJnreNOWJR7ZyodJ_4pgIkEj2zh8dE9Fv6XDHu-2lhNuYSXdyTLpRDfR169s520Kf-ZrvITQSbGibR-VXaHUv6T60ppnWPsnNXLGTGA_j3gEW3QlG5bAc" />
                                </div>
                                <h4 className="font-headline-md text-headline-md text-on-surface">Rahul Varma</h4>
                                <p className="text-primary font-label-md mb-md">Anxiety & Workplace Stress</p>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Focused on mindfulness techniques and cognitive behavioral approaches.</p>
                            </div>
                            {/* Coach 3 */}
                            <div className="bg-white p-lg rounded-xl text-center shadow-sm border border-transparent hover:border-primary/20 transition-all group">
                                <div className="w-24 h-24 mx-auto mb-md rounded-full overflow-hidden border-4 border-surface-container">
                                    <img className="w-full h-full object-cover" alt="Sara Khan" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV0nI7o881xWKdzUZ_oJcXknmph51nJFOMnVnFw1-YeTaxMX0CzTx8_Ktxp1mN8KW9phKbNof-R8juDw47uBfN8CXVcBwp-BB20cn4f3CJhT7UT8IMeCW-J_vXUyP30jgniqD_9UxgRTqP4Oq9sa0wVMCHsxsU4-6bXtv8QCFttJIZFsSORCrwfMRDGW7EVpXNgiO2312_4qaVG5J6YyW1Axy2n0lFev8lmfOX9Y9G61nnxS7z4vKEa9rCFBVSLJ9v9HK-9fmPOSM" />
                                </div>
                                <h4 className="font-headline-md text-headline-md text-on-surface">Sara Khan</h4>
                                <p className="text-primary font-label-md mb-md">Relationship Wellness</p>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Expert in family dynamics and building healthy interpersonal connections.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section className="py-xl bg-surface">
                    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
                        <h2 className="font-headline-lg text-headline-lg text-on-surface text-center mb-xl">Your journey in three steps</h2>
                        <div className="grid md:grid-cols-3 gap-lg text-center relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/4 left-[20%] right-[20%] h-px bg-outline-variant/30"></div>

                            <div className="relative space-y-md">
                                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mx-auto text-headline-md font-bold relative z-10">
                                    1
                                </div>
                                <h3 className="font-headline-md text-headline-md text-on-surface">Share</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant w-full pr-4">
                                    Post your thoughts on the wall anonymously. No accounts needed to start.
                                </p>
                            </div>
                            <div className="relative space-y-md">
                                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mx-auto text-headline-md font-bold relative z-10">
                                    2
                                </div>
                                <h3 className="font-headline-md text-headline-md text-on-surface">Reflect</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant w-full pr-4">
                                    Receive AI-driven insights about your emotional state and see how you evolve.
                                </p>
                            </div>
                            <div className="relative space-y-md">
                                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mx-auto text-headline-md font-bold relative z-10">
                                    3
                                </div>
                                <h3 className="font-headline-md text-headline-md text-on-surface">Connect</h3>
                                <p className="font-body-md text-body-md text-on-surface-variant w-full pr-4">
                                    Access a community of peers or talk privately with a verified coach.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-xl">
                    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
                        <div className="bg-primary-container p-xl rounded-[2rem] text-center text-on-primary-container shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 space-y-md max-w-2xl mx-auto">
                                <h2 className="font-display-lg text-display-lg">Ready to find your peace?</h2>
                                <p className="font-body-lg text-body-lg opacity-90">
                                    Start your journey to mental well-being today. A single post can be the beginning of a lighter heart.
                                </p>
                                <div className="pt-md">
                                    {/* BOTTOM CTA - NOW WIRED UP */}
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-primary px-xl py-4 rounded-full font-label-md text-label-md hover:shadow-lg transition-all active:scale-95 bg-white hover:bg-primary/5 cursor-pointer"
                                    >
                                        Join the Community Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-lg mt-xl bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant dark:border-outline">
                <div className="flex flex-col md:flex-row justify-between items-center gap-md px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
                    <div className="space-y-sm text-center md:text-left">
                        <div className="font-headline-md text-headline-md font-bold text-on-surface dark:text-inverse-on-surface">
                            Unsaid Wall
                        </div>
                        <p className="font-caption text-caption text-on-surface-variant dark:text-on-surface-variant">
                            © 2024 Unsaid Wall. In partnership with Surat Psychology Club.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-md">
                        <a className="font-caption text-caption text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors" href="#">
                            Privacy Policy
                        </a>
                        <a className="font-caption text-caption text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors" href="#">
                            Terms of Service
                        </a>
                        <a className="font-caption text-caption text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors" href="#">
                            Crisis Resources
                        </a>
                        <a className="font-caption text-caption text-on-surface-variant dark:text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors" href="#">
                            Contact Us
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}