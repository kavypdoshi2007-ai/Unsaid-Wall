import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestWall() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleActionClick = (e) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen">
            {/* Top App Bar */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(5,139,3,0.05)]">
                <div className="flex items-center justify-between px-container-padding h-16 w-full max-w-720 mx-auto">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform hover:opacity-80">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight">Unsaid Wall</h1>
                    </div>
                    {/* Interchangable Desktop Nav added here */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/guest-wall')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/coach-directory')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                        <button onClick={() => navigate('/login')} className="py-2 px-4 bg-primary text-on-primary rounded-full font-label-sm font-bold hover:opacity-90 transition-opacity ml-4 cursor-pointer">Login</button>
                    </div>
                </div>
            </header>

            <main className="pt-20 pb-32 px-4 max-w-720 mx-auto space-y-6">
                {/* Pinned Announcement */}
                <section className="glass-card rounded-xl p-5 border-l-4 border-l-primary relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <span className="material-symbols-outlined text-6xl">campaign</span>
                    </div>
                    <div className="flex gap-3 items-start relative z-10">
                        <div className="bg-primary-container p-2 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container text-xl">campaign</span>
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-headline-md text-sm font-bold text-primary">Community Guidelines Updated</h2>
                            <p className="font-body-md text-sm text-on-surface-variant">We've added new resources for the Healing community. Please take a look at the updated moderation policy.</p>
                        </div>
                    </div>
                </section>

                {/* Controls: Sort & Filter */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="relative group">
                            <button className="flex items-center gap-1 text-on-surface-variant font-label-sm hover:text-primary transition-colors">
                                Sort By: Trending
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm shadow-sm">All Wall</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm hover:bg-primary-container transition-colors">Anxiety</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm hover:bg-primary-container transition-colors">Grief</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm hover:bg-primary-container transition-colors">Hope</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm hover:bg-primary-container transition-colors">Loneliness</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm hover:bg-primary-container transition-colors">Healing</button>
                    </div>
                </div>

                {/* Post Cards */}
                <div className="space-y-4">
                    {/* Post 1 */}
                    <article onMouseMove={handleMouseMove} className="glass-card p-6 rounded-lg space-y-4 shadow-[0px_4px_20px_rgba(5,139,3,0.03)] group transition-all duration-300">
                        <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full font-label-sm text-[11px] uppercase tracking-wider">Loneliness</span>
                            <span className="text-outline text-[11px] font-label-sm">2h ago</span>
                        </div>
                        <p className="font-body-lg text-on-surface leading-relaxed">
                            It's quiet tonight. I find myself looking at the stars and wondering if anyone else is looking at the same ones, feeling just as small and just as alone. It's okay to not be okay, right?
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 cursor-pointer">
                                <span className="material-symbols-outlined text-lg">favorite</span>
                                <span className="font-label-sm">124</span>
                            </button>
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 cursor-pointer">
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                <span className="font-label-sm">56</span>
                            </button>
                        </div>
                    </article>

                    {/* Post 2 */}
                    <article onMouseMove={handleMouseMove} className="glass-card p-6 rounded-lg space-y-4 shadow-[0px_4px_20px_rgba(5,139,3,0.03)]">
                        <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full font-label-sm text-[11px] uppercase tracking-wider">Hope</span>
                            <span className="text-outline text-[11px] font-label-sm">5h ago</span>
                        </div>
                        <p className="font-body-lg text-on-surface leading-relaxed">
                            After three years of feeling like I was underwater, I finally felt the sun on my face today. It was just for a minute, but it was there. Hold on, everyone. The sun still exists.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant cursor-pointer">
                                <span className="material-symbols-outlined text-lg">favorite</span>
                                <span className="font-label-sm">482</span>
                            </button>
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant cursor-pointer">
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                <span className="font-label-sm">203</span>
                            </button>
                        </div>
                    </article>

                    {/* Post 3 */}
                    <article onMouseMove={handleMouseMove} className="glass-card p-6 rounded-lg space-y-4 shadow-[0px_4px_20px_rgba(5,139,3,0.03)]">
                        <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-error-container/20 text-error rounded-full font-label-sm text-[11px] uppercase tracking-wider">Grief</span>
                            <span className="text-outline text-[11px] font-label-sm">8h ago</span>
                        </div>
                        <p className="font-body-lg text-on-surface leading-relaxed">
                            I still reach for my phone to text him. Then the weight of the silence hits me all over again. Today is hard. Just needed to say it out loud somewhere.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant cursor-pointer">
                                <span className="material-symbols-outlined text-lg">favorite</span>
                                <span className="font-label-sm">95</span>
                            </button>
                            <button onClick={handleActionClick} className="reaction-btn flex items-center gap-1.5 text-on-surface-variant cursor-pointer">
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                <span className="font-label-sm">31</span>
                            </button>
                        </div>
                    </article>
                </div>
            </main>

            {/* FAB */}
            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-6 bg-primary text-on-primary p-4 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform z-40 group cursor-pointer">
                <span className="material-symbols-outlined">edit_note</span>
                <span className="font-label-sm pr-2">Share Something</span>
            </button>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-xl shadow-[0px_-4px_24px_rgba(5,139,3,0.08)] z-50 rounded-t-xl">
                <div className="flex justify-around items-center px-4 py-3 pb-safe max-w-720 mx-auto">
                    <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1.5 cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                        <span className="font-label-sm text-label-sm">Wall</span>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">auto_stories</span>
                        <span className="font-label-sm text-label-sm">Journal</span>
                    </button>
                    <button onClick={() => navigate('/coach-directory')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">psychology</span>
                        <span className="font-label-sm text-label-sm">Coaches</span>
                    </button>
                    <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">local_library</span>
                        <span className="font-label-sm text-label-sm">Resources</span>
                    </button>
                </div>
            </nav>

            {/* Modal Background */}
            {isModalOpen && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                    <div className="glass-card w-full max-w-[400px] p-8 rounded-2xl shadow-2xl transition-all duration-300 transform flex flex-col text-center">

                        <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                            <span className="material-symbols-outlined text-3xl">lock</span>
                        </div>

                        <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-3">Community Space</h3>
                        <p className="text-on-surface-variant font-body-md mb-8">To protect the safety and anonymity of our wall, please login or register to share your thoughts or send empathy.</p>

                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-on-primary rounded-full font-label-sm text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                                Login / Register
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="w-full py-3 text-outline font-label-sm text-sm font-bold hover:text-primary transition-colors cursor-pointer">
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}