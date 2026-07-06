import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResourceLibrary() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['All', 'Self-Care', 'Grief', 'Anxiety', 'Journaling'];

    // Resource data now lives in an array so it can be filtered.
    const resources = [
        {
            id: 1,
            category: 'Anxiety',
            tagLabel: 'ANXIETY',
            tagClass: 'bg-secondary-container/50 text-on-secondary-container',
            icon: 'open_in_new',
            title: 'Grounding Techniques',
            description: 'A practical guide to the 5-4-3-2-1 method and other sensory exercises to manage panic attacks and severe anxiety.',
            meta: '8 min read',
            cta: 'Read Article',
        },
        {
            id: 2,
            category: 'Self-Care',
            tagLabel: 'SELF-CARE',
            tagClass: 'bg-primary/10 text-primary',
            icon: 'headphones',
            title: 'Deep Breath Guided',
            description: 'A soothing 10-minute audio meditation designed specifically for emotional decompression after a long day.',
            meta: '10 min audio',
            cta: 'Listen Now',
        },
        {
            id: 3,
            category: 'Grief',
            tagLabel: 'GRIEF',
            tagClass: 'bg-tertiary-container/50 text-on-tertiary-container',
            icon: 'auto_stories',
            title: 'Understanding the Waves',
            description: 'A compassionate exploration of how grief fluctuates over time and how to sit with your feelings without judgment.',
            meta: 'Book Summary',
            cta: 'Read More',
        },
        {
            id: 4,
            category: 'Anxiety',
            tagLabel: 'ANXIETY',
            tagClass: 'bg-secondary-container/50 text-on-secondary-container',
            icon: 'podcasts',
            title: 'The Anxiety Lab',
            description: 'Expert podcast episode discussing the biological roots of anxiety and natural ways to regulate your nervous system.',
            meta: 'Podcast',
            cta: 'Explore Episode',
        },
        // Example Journaling entry so that filter has content too — remove/replace with real data.
        {
            id: 5,
            category: 'Journaling',
            tagLabel: 'JOURNALING',
            tagClass: 'bg-secondary-container/50 text-on-secondary-container',
            icon: 'edit_note',
            title: 'Starting a Daily Practice',
            description: 'Simple prompts to help you build a consistent, judgment-free journaling habit in just five minutes a day.',
            meta: '5 min read',
            cta: 'Read Article',
        },
    ];

    // Filter by both category and search term.
    const filteredResources = resources.filter((resource) => {
        const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
        const matchesSearch =
            searchTerm.trim() === '' ||
            resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for your suggestion!');
    };

    return (
        <div className="bg-background text-on-surface font-body-md min-h-screen pb-12">

            {/* Universal Top App Bar (Only Back Button & Logo) */}
            <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/10">
                <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">

                    {/* Left: Back Button & Logo Area */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer text-2xl"
                            title="Go Back"
                        >
                            arrow_back
                        </button>
                        <div
                            onClick={() => navigate('/')}
                            className="font-headline-md text-headline-md font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            Unsaid Wall
                        </div>
                    </div>

                    {/* Right side is intentionally left blank so it works for Admins, Coaches, Users, and Guests! */}
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-screen-md mx-auto px-6 pt-24 flex flex-col gap-8 md:gap-12">

                {/* Search & Title */}
                <section className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <h2 className="font-headline-md text-headline-md text-primary">Library</h2>
                        <p className="text-on-surface-variant font-body-md">Hand-picked resources for your emotional well-being.</p>
                    </div>
                    <div className={`relative group transition-transform ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-outline-variant/30 bg-surface-container-low focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-on-surface placeholder:text-outline shadow-sm outline-none"
                            placeholder="Search resources..."
                            type="text"
                        />
                    </div>
                </section>

                {/* Crisis Ribbon (Pinned) */}
                <section className="bg-error-container/30 border border-error/10 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error flex items-center justify-center text-on-error">
                        <span className="material-symbols-outlined">support_agent</span>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-headline-md text-xl text-on-error-container font-semibold">Help is available</h3>
                        <p className="text-on-error-container/80 text-body-md mt-1">If you are in immediate danger or distress, please reach out to these 24/7 services.</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <a className="bg-error text-on-error px-6 py-2 rounded-full font-label-sm text-center transition-transform hover:opacity-90 active:scale-95 font-bold" href="tel:988">Call 988</a>
                    </div>
                </section>

                {/* Category Filter */}
                <section className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-5 py-2 rounded-full border font-label-sm transition-all hover:border-primary whitespace-nowrap cursor-pointer ${activeCategory === category
                                ? 'bg-primary-container text-on-primary-container border-primary'
                                : 'bg-surface-container border-outline/20 text-on-surface-variant'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </section>

                {/* Resource Cards Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResources.length > 0 ? (
                        filteredResources.map((resource) => (
                            <div
                                key={resource.id}
                                className="glass-card border border-outline-variant/20 rounded-lg p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`${resource.tagClass} px-3 py-1 rounded-full text-[12px] font-semibold tracking-wider`}>
                                        {resource.tagLabel}
                                    </span>
                                    <span className="material-symbols-outlined text-outline">{resource.icon}</span>
                                </div>
                                <div>
                                    <h4 className="font-headline-md text-xl text-on-surface mb-2">{resource.title}</h4>
                                    <p className="text-on-surface-variant text-body-md line-clamp-3">{resource.description}</p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    <span className="text-label-sm text-outline">{resource.meta}</span>
                                    <button className="text-primary font-semibold font-label-sm hover:underline cursor-pointer">{resource.cta}</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-12">
                            <p className="text-on-surface-variant font-body-md">No resources found for "{activeCategory}"{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
                        </div>
                    )}
                </section>

                {/* Suggest a Resource Form (BULLETPROOF CSS GRID VERSION) */}
                <section
                    className="bg-surface-container-high rounded-xl p-6 md:p-10 shadow-sm mt-8 mx-auto"
                    style={{ display: 'block', width: '100%', minWidth: '100%' }}
                >
                    <div style={{ display: 'block', width: '100%' }} className="text-center mb-8">
                        <h3 className="font-headline-md text-2xl text-primary mb-3 whitespace-nowrap sm:whitespace-normal">
                            Suggest a Resource
                        </h3>
                        <p className="text-on-surface-variant font-body-md mx-auto" style={{ maxWidth: '500px' }}>
                            Is there a book, tool, or website that helped you? Share it with the community.
                        </p>
                    </div>

                    <form
                        onSubmit={handleFormSubmit}
                        className="mx-auto"
                        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', width: '100%', maxWidth: '500px' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                            <label className="text-label-sm text-primary uppercase tracking-widest font-bold text-left">
                                Resource Title
                            </label>
                            <input
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                placeholder="e.g. The Body Keeps the Score"
                                type="text"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                            <label className="text-label-sm text-primary uppercase tracking-widest font-bold text-left">
                                Link (Optional)
                            </label>
                            <input
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                placeholder="https://..."
                                type="url"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                            <label className="text-label-sm text-primary uppercase tracking-widest font-bold text-left">
                                Why it helped
                            </label>
                            <textarea
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3.5 px-4 focus:ring-2 focus:ring-primary/50 transition-all outline-none resize-y"
                                placeholder="A brief note on why you recommend this..."
                                rows="4"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            ></textarea>
                        </div>

                        <button
                            className="bg-primary text-on-primary py-4 rounded-full font-label-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-2 cursor-pointer"
                            type="submit"
                            style={{ width: '100%', display: 'block' }}
                        >
                            Submit Suggestion
                        </button>
                    </form>
                </section>
            </main>

            {/* Background Decorative Element */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
}