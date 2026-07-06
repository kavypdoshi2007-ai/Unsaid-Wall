import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoachChat() {
    const navigate = useNavigate();

    const [messages, setMessages] = useState([
        { id: 1, sender: 'user', text: "I've been feeling that tight chest sensation again today. It started right before my team meeting. I just couldn't find the words to speak up.", time: "14:02" },
        { id: 2, sender: 'coach', text: "Thank you for noticing that sensation, User #8291. It takes quiet strength to acknowledge how your body is reacting. Before we talk about the meeting, let's take a moment to breathe into that tightness together.", time: "14:05" }
    ]);
    const [chatInput, setChatInput] = useState('');

    const handleSend = () => {
        if (chatInput.trim()) {
            setMessages([...messages, { id: Date.now(), sender: 'coach', text: chatInput, time: "Just now" }]);
            setChatInput('');
        }
    };

    return (
        <div className="bg-background text-on-background font-body-md min-h-screen flex overflow-hidden">
            {/* SideNavBar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container flex-col py-4 space-y-2 shadow-md shadow-primary/5 z-50">
                <div className="px-6 mb-8">
                    <h1 className="font-headline-md text-headline-md text-secondary">Coach Workspace</h1>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Managing 12 active journeys</p>
                </div>
                <nav className="flex-1 space-y-1">
                    <button onClick={() => navigate('/coach-dashboard')} className="w-full flex items-center gap-3 py-3 px-4 mx-2 text-on-surface-variant hover:bg-surface-variant transition-all duration-300 ease-in-out cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <span className="font-label-sm">Dashboard</span>
                    </button>
                    <button onClick={() => navigate('/coach-chat')} className="w-full flex items-center gap-3 py-3 px-4 bg-secondary-container text-on-secondary-container rounded-xl mx-2 transition-all duration-300 ease-in-out cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">forum</span>
                        <span className="font-label-sm">Client Wall</span>
                    </button>
                </nav>
                <div className="px-4 py-4 space-y-2 mt-auto">
                    <button className="w-full bg-primary text-on-primary py-3 rounded-full font-bold active:scale-95 transition-transform flex justify-center items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined">add_circle</span>
                        Start Session
                    </button>
                    <div className="pt-4 space-y-1 border-t border-outline-variant/20">
                        <button onClick={() => navigate('/help-center')} className="w-full flex items-center gap-3 py-2 px-4 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">help</span>
                            <span className="font-label-sm">Help Center</span>
                        </button>
                        <button onClick={() => navigate('/logout')} className="w-full flex items-center gap-3 py-2 px-4 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="font-label-sm">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Grid */}
            <main className="lg:ml-64 flex-1 h-screen overflow-hidden relative flex flex-col lg:flex-row">

                {/* Left Panel: User History */}
                <section className="hidden xl:flex border-r border-outline-variant/20 flex-col h-full bg-surface-container-low/50 overflow-y-auto w-64 shrink-0">
                    <div className="p-6">
                        <h2 className="font-headline-md text-headline-md text-secondary mb-1">User #8291</h2>
                        <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[12px] font-bold uppercase tracking-wider mb-6">Emotive Baseline: Anxious</span>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest mb-4">Recent Emotion History</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 glass-card rounded-2xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
                                            <span className="material-symbols-outlined">sentiment_very_dissatisfied</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm">High Stress</p>
                                                <span className="text-[11px] text-on-surface-variant">2h ago</span>
                                            </div>
                                            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1">
                                                <div className="bg-error w-4/5 h-full rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 glass-card rounded-2xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                                            <span className="material-symbols-outlined">waves</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm">Quiet Clarity</p>
                                                <span className="text-[11px] text-on-surface-variant">Yesterday</span>
                                            </div>
                                            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1">
                                                <div className="bg-tertiary w-1/3 h-full rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest mb-4">Past Session Highlights</h3>
                                <div className="p-4 glass-card rounded-2xl space-y-4 border-l-4 border-primary">
                                    <p className="text-sm italic text-on-surface-variant leading-relaxed">"User mentioned feeling overwhelmed by workplace transitions. Responded well to deep breathing exercises in session #4."</p>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">bookmark</span>
                                        <span className="text-xs font-semibold text-primary">Key Growth Metric: Emotional Literacy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden aspect-square">
                                <img alt="Serene Nature" className="object-cover w-full h-full opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCia8d2bDapGEb3OzgN7ZPxuYqIAT9yD-82lFzPGHEcoGqrP7zoQwI5CCsCxZr2qcqSiuYsn76WVoOxmIPElCqMxaBfktoqEyvItJRMAhH1I0itgaVlNPq1pzI764ESQ1Dc7KxBai8faDQvo-ZhYGsE1jriXdRpdrCKiJpXTXywAWpWgKj4If5Wcc1reREFxauKdAoOoocw7H6Fm68RYwsgvI7hgsTRJZMh54jKf_62X_ACgqZ4VxsYU4JdGEk7xkxIbCXXF0brNdZD" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent flex flex-col justify-end p-4">
                                    <p className="text-xs font-bold text-on-surface-variant">Session Atmosphere</p>
                                    <p className="font-headline-md text-sm italic">"Calm morning in the garden"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Center: Chat Conversation */}
                <section className="flex flex-col h-full bg-white/40 flex-1 min-w-0">
                    {/* Chat Header */}
                    <div className="h-16 flex items-center justify-between px-4 md:px-8 bg-surface-container-low/80 backdrop-blur-md border-b border-outline-variant/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                            <span className="font-bold text-on-surface text-sm md:text-base">Active Session: 42m remaining</span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="px-3 md:px-4 py-2 rounded-full text-error font-semibold hover:bg-error/10 transition-colors text-xs md:text-sm flex items-center gap-1 md:gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">emergency_home</span>
                                <span className="hidden sm:inline">Escalate to Admin</span>
                            </button>
                            <button onClick={() => navigate('/coach-dashboard')} className="px-3 md:px-4 py-2 rounded-full bg-error text-on-error font-semibold hover:opacity-90 transition-opacity text-xs md:text-sm flex items-center gap-1 md:gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                                <span className="hidden sm:inline">End Session</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        <div className="flex flex-col items-center mb-8">
                            <span className="px-4 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">14 October 2024</span>
                        </div>

                        {messages.map((m) => (
                            m.sender === 'user' ? (
                                <div key={m.id} className="flex items-start gap-3 max-w-[90%] md:max-w-[80%]">
                                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-secondary">person_search</span>
                                    </div>
                                    <div>
                                        <div
                                            className="p-4 shadow-sm"
                                            style={{ background: 'rgba(142, 249, 164, 0.4)', borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem' }}
                                        >
                                            <p className="text-on-surface">{m.text}</p>
                                        </div>
                                        <span className="text-[11px] text-on-surface-variant mt-1 ml-1">{m.time}</span>
                                    </div>
                                </div>
                            ) : (
                                <div key={m.id} className="flex items-start gap-3 flex-row-reverse max-w-[90%] md:max-w-[80%] ml-auto">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-on-primary">psychology</span>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className="p-4 shadow-md text-left bg-primary text-on-primary"
                                            style={{ borderRadius: '1.5rem 1.5rem 0.25rem 1.5rem' }}
                                        >
                                            <p>{m.text}</p>
                                        </div>
                                        <span className="text-[11px] text-on-surface-variant mt-1 mr-1">{m.time}</span>
                                    </div>
                                </div>
                            )
                        ))}

                        {/* Shared Resource Preview (static example, matches source design) */}
                        <div className="flex items-start gap-3 flex-row-reverse max-w-[90%] md:max-w-[80%] ml-auto">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-on-primary">psychology</span>
                            </div>
                            <div className="text-right">
                                <div className="bg-secondary-container rounded-2xl overflow-hidden border border-secondary/20 max-w-sm text-left">
                                    <img alt="Meditation Resource" className="h-32 w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZPEhvjNp-E4w6uYSuStWLdOr73qyUWgZfEJPsU-3mLWbK0FmD7wyKLhv-61aeAO54myE-liBTbeu5qBgkqIDH-3wqAxfPAEPZIF3zRAeFbHV4LOUnOy1uW0AfVlp5kZtyYLmifR9PuzntYNq8s9cGdPbIPXhOi8dDrOYN6ekctwrD-Irch9Wmqly8G6zCcqrXGSDAQrXeeTeH5wFUkWwnOPsX1FlTuzfxaiFKH8-4GGlwL2TC3hnNbyIz6rHW35P_w-_SonlSjZkh" />
                                    <div className="p-4">
                                        <h4 className="font-bold text-secondary text-sm">Guided Meditation: 5-Minute Box Breathing</h4>
                                        <p className="text-xs text-on-secondary-container mt-1">Resource shared for immediate support.</p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-on-surface-variant mt-1 mr-1">14:06</span>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 pb-24 lg:pb-6 bg-surface-container-low/50 border-t border-outline-variant/10 shrink-0">
                        <div className="relative flex items-center">
                            <textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl py-4 pl-6 pr-24 md:pr-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-body-md"
                                placeholder="Message User #8291..."
                                rows="1"
                            ></textarea>
                            <div className="absolute right-4 flex items-center gap-1 md:gap-2">
                                <button className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                                </button>
                                <button className="hidden sm:inline-flex p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">attach_file</span>
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 px-2">
                            <p className="text-[11px] text-on-surface-variant italic">Press Cmd+Enter to send. Chat is end-to-end encrypted.</p>
                        </div>
                    </div>
                </section>

                {/* Right Panel: Resource & Notes */}
                <section className="hidden xl:flex border-l border-outline-variant/20 flex-col h-full bg-surface-container-low/50 overflow-y-auto w-64 shrink-0">
                    <div className="p-6 h-full flex flex-col">
                        {/* Resource Sharing Section */}
                        <div className="mb-8">
                            <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-[20px]">auto_stories</span>
                                Resource Sharing
                            </h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 glass-card rounded-2xl hover:border-primary/40 transition-all text-left cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
                                        <span className="material-symbols-outlined">mindfulness</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">Nature Walk Meditation</p>
                                        <p className="text-[10px] text-on-surface-variant">Audio • 12 mins</p>
                                    </div>
                                    <span className="material-symbols-outlined ml-auto text-primary shrink-0">chevron_right</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 glass-card rounded-2xl hover:border-primary/40 transition-all text-left cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">Understanding Anxiety</p>
                                        <p className="text-[10px] text-on-surface-variant">Article • 5 mins read</p>
                                    </div>
                                    <span className="material-symbols-outlined ml-auto text-primary shrink-0">chevron_right</span>
                                </button>
                            </div>
                            <button onClick={() => navigate('/resources')} className="w-full mt-4 py-2 border border-dashed border-outline-variant/50 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-variant/20 transition-all cursor-pointer">
                                Browse Library
                            </button>
                        </div>

                        {/* Private Notes Section */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-[20px]">sticky_note_2</span>
                                Private Notes
                            </h3>
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="flex-1 glass-card p-4 rounded-2xl relative">
                                    <textarea
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-sm placeholder:italic"
                                        placeholder="Add confidential notes for this session..."
                                    ></textarea>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                                        <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                    <h4 className="text-[10px] font-bold text-primary uppercase mb-2">Previous Insight</h4>
                                    <p className="text-xs leading-relaxed text-on-surface italic">"User reacts strongly to 'workplace hierarchy' mentions. Suggest exploring boundaries in next session."</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Status */}
                        <div className="mt-8 pt-6 border-t border-outline-variant/20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                    <img alt="Coach Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0mpFYDYej01l3zUdvzx4Z-RGuHpD5KWyhjRdxvAUUzF3G7wjr0tTmVQIpl7blaV0Ru9URp5--x8KavGVlvP1I1U9dSdlb-ZGP128pl3oS3ac8trQ0bcvK_0d3DfklYrf_HufxAqWv1SR-VQCZKoHFY5LB-vKLEt_yg3z9iVvMTE60MFUmikDmB5vNXpTf2ut-dbVu4t8fZi0N1xSja_D9DWyCHoPF8YAdP0rS1vEEEwxPpd29OqDqyNryNetgjc5_MTLdwZ5eHmiV" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">Coach Marcus</p>
                                    <p className="text-[10px] text-on-surface-variant">Active • Last synced 2m ago</p>
                                </div>
                                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">verified_user</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Coach Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full lg:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/coach-dashboard')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">dashboard</span>
                    <span className="font-label-sm text-[10px] font-semibold">Dashboard</span>
                </button>
                <button onClick={() => navigate('/coach-chat')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">forum</span>
                    <span className="font-label-sm text-[10px] font-semibold">Chats</span>
                </button>
                <button onClick={() => navigate('/user-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">view_day</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">local_library</span>
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </div>
        </div>
    );
}