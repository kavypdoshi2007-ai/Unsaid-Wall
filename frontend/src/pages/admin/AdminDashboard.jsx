import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- ADDED: Navigation hook
import Navbar from '../../components/Navbar'; // Adjust path as needed

export default function AdminDashboard() {
    const [showBroadcast, setShowBroadcast] = useState(false);
    const navigate = useNavigate(); // <-- ADDED: Initialize navigation

    return (
        <div className="bg-background text-on-surface antialiased min-h-screen">
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
            <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container flex flex-col py-4 z-50 pt-12 shadow-md">
                <div className="px-6 py-6 mb-4">
                    <h1 className="font-headline-md text-headline-md text-secondary">Admin Workspace</h1>
                    <p className="font-label-sm text-on-surface-variant">Managing 12 active journeys</p>
                </div>
                <nav className="flex-1 space-y-1 px-2">
                    <button className="w-full bg-secondary-container text-on-secondary-container rounded-xl flex items-center px-4 py-3 text-left">
                        <span className="material-symbols-outlined mr-3">dashboard</span> Dashboard
                    </button>
                    {/* <-- ADDED: Client Wall routing to Admin Moderation --> */}
                    <button
                        onClick={() => navigate('/admin-moderation')}
                        className="w-full text-on-surface-variant hover:bg-surface-variant rounded-xl flex items-center px-4 py-3 text-left transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined mr-3">forum</span> Client Wall
                    </button>
                </nav>
            </aside>

            <main className="ml-64 pt-20 px-container-padding pb-section-gap">
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="font-display-lg text-primary">Platform Overview</h2>
                        <p className="text-on-surface-variant mt-2">Real-time health monitoring.</p>
                    </div>
                    <button
                        onClick={() => setShowBroadcast(true)}
                        className="bg-primary text-on-primary px-6 py-3 rounded-full flex items-center gap-2 font-bold hover:brightness-110 active:scale-95 cursor-pointer">
                        <span className="material-symbols-outlined">campaign</span> Broadcast Tool
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    {['Active Sessions', 'Posts Today'].map((stat, i) => (
                        <div key={i} className="glass-panel p-6 rounded-lg border border-outline-variant/10">
                            <span className="text-on-surface-variant font-label-sm uppercase">{stat}</span>
                            <div className="text-4xl font-bold text-primary mt-2">1,482</div>
                        </div>
                    ))}
                </div>

                {/* Crisis Alerts */}
                <section className="mb-12">
                    <h3 className="font-headline-md mb-6">Active Crisis Alerts</h3>
                    <div className="space-y-4">
                        <div className="p-6 rounded-lg border-l-4 border-error bg-error/5 flex justify-between">
                            <div>
                                <h4 className="font-bold">User_8291 (The Wall)</h4>
                                <p className="italic text-on-surface-variant">"I don't see the light anymore..."</p>
                            </div>
                            <button className="bg-error text-white px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:brightness-110">Intervene</button>
                        </div>
                    </div>
                </section>

                {/* Broadcast Modal */}
                {showBroadcast && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
                        <div className="bg-surface-container-lowest w-full max-w-lg p-8 rounded-xl shadow-2xl">
                            <h3 className="font-headline-md text-primary mb-4">New Global Broadcast</h3>
                            <textarea className="w-full bg-surface-container-low rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-primary/50" rows="3" placeholder="Enter message..."></textarea>
                            <div className="flex gap-3">
                                <button className="flex-1 bg-primary text-on-primary py-3 rounded-full font-bold cursor-pointer hover:brightness-110">Send</button>
                                <button onClick={() => setShowBroadcast(false)} className="px-6 py-3 rounded-full font-bold cursor-pointer hover:bg-surface-variant/50">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
