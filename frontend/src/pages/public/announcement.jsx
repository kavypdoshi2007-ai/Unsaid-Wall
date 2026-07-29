import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar'; // Adjust path as needed
import { API_ENDPOINTS } from '../../config/api'; // Adjust path as needed   

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🌟 Fetch Database Announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            const token = localStorage.getItem('token');   
            try {
                setIsLoading(true);
                const response = await fetch(API_ENDPOINTS.ANNOUNCEMENTS.GET_ACTIVE, {   
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,   
                        'ngrok-skip-browser-warning': 'true' // Bypasses the ngrok blockpage screen   
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch announcements.');
                }

                const data = await response.json();
                
                // Formatter mapped explicitly to match your Prisma backend properties   
                const formattedData = data.map((ann) => {
                    // Generate a preview summary title since the database stores pure text in 'content'   
                    const words = (ann.content || '').split(' ');   
                    const titleFallback = words.length > 6 
                        ? words.slice(0, 6).join(' ') + '...' 
                        : ann.content || 'System Update';   

                    return {
                        id: ann.id,   
                        title: titleFallback,
                        message: ann.content || '',   
                        link: ann.link || null,   
                        type: 'System', // Standard default type matching schema context   
                        postedAt: ann.created_at || new Date().toISOString(),   
                        dueDate: ann.expires_at || null, // Handles cases where expires_at might be null   
                        priority: ann.is_pinned ? 'high' : 'normal',   
                        isPinned: ann.is_pinned || false   
                    };
                });

                setAnnouncements(formattedData);
            } catch (err) {
                console.error("Error loading announcements:", err);   
                setError(err.message);
            } finally {
                setIsLoading(false);   
            }
        };

        fetchAnnouncements();
    }, []);

    // Calculate days remaining until the expiration/due date
    const getDaysRemaining = (dueDateStr) => {
        if (!dueDateStr) return 'Always Active'; // For items with expires_at = null   
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Expires Today';
        if (diffDays === 1) return 'Expires Tomorrow';
        return `${diffDays} days left`;
    };

    // Toggle local pinning view state change
    const togglePin = (id) => {
        setAnnouncements(prev => prev.map(ann => 
            ann.id === id ? { ...ann, isPinned: !ann.isPinned } : ann
        ));
    };

    // Sort announcements: Pinned items stay at the top   
    const sortedAnnouncements = [...announcements].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.postedAt) - new Date(a.postedAt);
    });

    return (
        <div className="bg-background text-on-surface min-h-screen antialiased overflow-x-hidden flex flex-col">
            <Navbar />

            <main className="flex-1 pt-28 px-6 md:px-12 pb-24 max-w-[1000px] mx-auto w-full">
                {/* Header Section */}
                <header className="mb-10 text-center md:text-left">
                    <h1 className="font-display-lg text-display-lg text-primary mb-3">Platform Announcements</h1>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Stay up to date with the latest events, system updates, and new resources on the Unsaid Wall. Action items and deadlines are highlighted below.
                    </p>
                </header>

                {/* Announcements List Container */}
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/30 text-on-surface-variant animate-pulse">
                            Loading active announcements from database...
                        </div>
                    ) : error ? (
                        <div className="glass-card rounded-2xl p-12 text-center border border-error/40 bg-error/5">
                            <span className="material-symbols-outlined text-5xl mb-4 text-error">error</span>
                            <h3 className="font-headline-md text-xl text-error mb-2">Something went wrong</h3>
                            <p className="text-on-surface-variant">{error}</p>
                        </div>
                    ) : sortedAnnouncements.length > 0 ? (
                        sortedAnnouncements.map((item) => {
                            const daysRemaining = getDaysRemaining(item.dueDate);
                            const isUrgent = daysRemaining === 'Expires Today' || daysRemaining === 'Expires Tomorrow' || item.priority === 'high';

                            return (
                                <article key={item.id} className={`glass-card relative overflow-hidden rounded-2xl p-6 md:p-8 border ${isUrgent ? 'border-error/40 shadow-[0_0_15px_rgba(176,37,0,0.05)]' : 'border-outline-variant/30 shadow-sm'} ${item.isPinned ? 'ring-2 ring-primary/20 bg-surface-container-low/80' : ''} transition-all hover:-translate-y-1`}>
                                    
                                    {/* Left Accent Color Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isUrgent ? 'bg-error' : 'bg-primary'}`}></div>

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-2">
                                        
                                        {/* Content Area */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUrgent ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                                                    <span className="material-symbols-outlined">build</span>
                                                </div>
                                                <h3 className="font-headline-md text-xl text-on-surface font-bold">{item.title}</h3>
                                                <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {item.type}
                                                </span>
                                                
                                                {/* Pin Toggle Button */}
                                                <button 
                                                    onClick={() => togglePin(item.id)} 
                                                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer ${item.isPinned ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
                                                    title={item.isPinned ? "Unpin Announcement" : "Pin to Top"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: item.isPinned ? "'FILL' 1" : "'FILL' 0" }}>keep</span>
                                                </button>
                                                {item.isPinned && (
                                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1">
                                                        Pinned
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="font-body-md text-on-surface leading-relaxed ml-1 md:ml-14 mb-4">
                                                {item.message}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant ml-1 md:ml-14 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    Posted: {new Date(item.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                {item.link && (
                                                    <a 
                                                        href={item.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">link</span>
                                                        View Details
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expiration Banner / Date Box */}
                                        <div className={`shrink-0 rounded-xl p-4 min-w-[140px] text-center border ${isUrgent ? 'bg-error/5 border-error/20' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                                                Visibility
                                            </p>
                                            <p className={`font-bold text-sm ${isUrgent ? 'text-error' : 'text-primary'}`}>
                                                {item.dueDate ? new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Permanent'}
                                            </p>
                                            <p className={`text-xs mt-1 font-bold ${isUrgent ? 'text-error' : 'text-on-surface-variant'}`}>
                                                {daysRemaining}
                                            </p>
                                        </div>

                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center border border-outline-variant/20">
                            <span className="material-symbols-outlined text-5xl mb-4 text-primary opacity-50">campaign</span>
                            <h3 className="font-headline-md text-xl text-on-surface mb-2">No Active Announcements</h3>
                            <p className="text-on-surface-variant">You're all caught up! Check back later for updates.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}