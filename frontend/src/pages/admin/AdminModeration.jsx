import React from 'react';
import Navbar from '../../components/Navbar'; // Adjust path as needed
export default function AdminModeration() {
    const posts = [
        { id: 1, user: 'Anonymous #8821', flag: 'Harmful Speech', emotion: 'Rage', content: "I can't believe how everyone just pretends..." },
        { id: 2, user: 'Anonymous #9104', flag: 'Self-Harm Risk', emotion: 'Despair', content: "There is no light at the end of this tunnel..." }
    ];

    return (
        <div className="bg-background text-on-surface min-h-screen">
            <Navbar />
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Admin Console</span>
                    </div>

                    {/* Right: Admin Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/admin-dashboard')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Dashboard</button>
                        <button onClick={() => navigate('/admin-moderation')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Moderation</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>
            <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container pt-20 px-2">
                {/* Navigation omitted for brevity, same as Dashboard */}
            </aside>

            <main className="md:ml-64 pt-20 px-container-padding pb-section-gap">
                <header className="mb-8">
                    <h1 className="font-display-lg text-on-surface mb-2">Post Moderation Queue</h1>
                    <p className="text-on-surface-variant">Review flagged content for safety.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="glass-card rounded-xl p-6 border border-outline-variant/30">
                                <div className="flex justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold">{post.user}</h3>
                                        <span className="text-[10px] uppercase font-bold bg-error-container text-on-error-container px-2 rounded-full">Flag: {post.flag}</span>
                                    </div>
                                </div>
                                <p className="italic mb-6 border-l-4 border-primary/20 pl-4">{post.content}</p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 rounded-full border border-error text-error text-sm font-bold hover:bg-error hover:text-white">Hide</button>
                                    <button className="px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-bold">Keep</button>
                                    <button className="px-4 py-2 rounded-full border border-secondary text-secondary text-sm font-bold">Send Support</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <aside className="xl:col-span-4 space-y-6">
                        <div className="glass-card p-6 rounded-xl border border-outline-variant/30">
                            <h2 className="font-headline-md mb-4">Queue Health</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase"><span>Avg Response Time</span><span>14m 20s</span></div>
                                    <div className="w-full bg-surface-container h-2 rounded-full mt-2"><div className="bg-primary h-full rounded-full" style={{ width: '78%' }}></div></div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
