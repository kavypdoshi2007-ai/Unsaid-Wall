import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResourceLibrary() {
    const navigate = useNavigate();

    // --- Dynamic Backend & UI States ---
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // --- Form States (Restored) ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        category: 'Anxiety',
        description: '',
        read_time: '',
        external_url: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const categories = ['All', 'Anxiety', 'Grief', 'Meditation', 'Mindfulness', 'Guides'];
    const formCategories = ['Anxiety', 'Grief', 'Meditation', 'Mindfulness', 'Guides'];

    // Absolute Backend Endpoint Targeting Your Express Router
    const API_RESOURCES_URL = 'https://diminish-waving-shore.ngrok-free.dev/api/resource';

    // --- Fetch Live Resources ---
    useEffect(() => {
        async function fetchResources() {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams();
                if (activeCategory !== 'All') queryParams.append('category', activeCategory);
                if (searchTerm.trim() !== '') queryParams.append('search', searchTerm);

                const response = await fetch(`${API_RESOURCES_URL}?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (!response.ok) throw new Error(`Server status error: ${response.status}`);
                const data = await response.json();
                setResources(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Express resource library connection breakdown:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchResources();
    }, [activeCategory, searchTerm]);

    // --- Handle Resource Submission ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewResource(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitResource = async (e) => {
        e.preventDefault();
        if (!newResource.title || !newResource.description) {
            alert('Please fill out the Title and Description fields.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(API_RESOURCES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(newResource)
            });

            if (!response.ok) throw new Error('Failed to save resource to database');

            const savedResource = await response.json();

            // Append new resource onto state immediately for seamless live updates
            setResources(prev => [savedResource, ...prev]);

            // Reset Form Values
            setNewResource({
                title: '',
                category: 'Anxiety',
                description: '',
                read_time: '',
                external_url: ''
            });
            setIsFormOpen(false);
        } catch (err) {
            alert(`Submission failure: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(5,139,3,0.05)]">
                <div className="flex items-center justify-between px-container-padding h-16 w-full max-w-720 mx-auto">
                    <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform hover:opacity-80">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-display-lg text-lg font-bold tracking-tight text-primary">Unsaid Wall</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/guest-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/coach-directory')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Resources</button>
                        <button onClick={() => navigate('/login')} className="py-2 px-4 bg-primary text-on-primary rounded-full font-label-sm font-bold hover:opacity-90 transition-opacity ml-4 cursor-pointer">Login</button>
                    </div>
                </div>
            </header>

            {/* Main Container Layout */}
            <main className="pt-24 pb-32 px-container-padding w-full max-w-720 mx-auto space-y-6">

                {/* Section Hero Headline Block & Action Button */}
                <section className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                        <h1 className="font-display-lg text-2xl font-extrabold text-on-background tracking-tight">Self-Guided Resources</h1>
                        <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                            Explore mental health toolkits, therapeutic practices, and expert literature built to support your wellness.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="py-2 px-4 bg-primary text-on-primary font-label-sm text-xs font-bold rounded-full shadow hover:bg-primary/90 transition-all whitespace-nowrap cursor-pointer shrink-0"
                    >
                        {isFormOpen ? 'Close Form' : 'Add Resource'}
                    </button>
                </section>

                {/* Restored: Dynamic Resource Contribution Form Toggle Window */}
                {isFormOpen && (
                    <section className="glass-card p-6 rounded-xl border border-primary/20 bg-surface shadow-md animate-fade-in space-y-4">
                        <h2 className="font-headline-md text-base font-bold text-primary">Contribute a New Resource</h2>
                        <form onSubmit={handleSubmitResource} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-on-surface-variant">Title *</label>
                                    <input
                                        type="text" name="title" value={newResource.title} onChange={handleInputChange} required placeholder="e.g., Box Breathing Guide"
                                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-on-surface-variant">Category</label>
                                    <select
                                        name="category" value={newResource.category} onChange={handleInputChange}
                                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface"
                                    >
                                        {formCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-on-surface-variant">Read / Duration Time</label>
                                    <input
                                        type="text" name="read_time" value={newResource.read_time} onChange={handleInputChange} placeholder="e.g., 5 min read, 10 min audio"
                                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-on-surface-variant">Resource Link (URL)</label>
                                    <input
                                        type="url" name="external_url" value={newResource.external_url} onChange={handleInputChange} placeholder="https://example.com/resource"
                                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-on-surface-variant">Description / Core Information *</label>
                                <textarea
                                    name="description" rows="3" value={newResource.description} onChange={handleInputChange} required placeholder="Summarize the core exercise, takeaways, or content details..."
                                    className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-on-surface resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit" disabled={submitting}
                                className="w-full h-10 bg-primary text-on-primary font-label-sm text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {submitting ? 'Saving to Database...' : 'Submit Resource Node'}
                            </button>
                        </form>
                    </section>
                )}

                {/* Search Bar Element */}
                <section className="relative w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none">search</span>
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search techniques, exercises, or titles..."
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                    />
                </section>

                {/* Horizontal Scrolling Pill Filters Ribbon */}
                <section className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat} onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-sm text-xs transition-colors cursor-pointer ${activeCategory === cat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-container'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </section>

                {/* Dynamic Content Cards Feed Grid */}
                <section className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-20 text-outline font-body-md italic animate-pulse">
                            Loading support library databases...
                        </div>
                    ) : error ? (
                        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/10 text-center text-xs">
                            Trouble mapping dynamic documentation indexes: {error}
                        </div>
                    ) : resources.length > 0 ? (
                        resources.map((item) => (
                            <article
                                key={item.id || item._id}
                                className="glass-card p-5 rounded-xl border border-outline-variant/30 bg-surface flex flex-col gap-3 shadow-[0_2px_12px_rgba(118,138,126,0.02)] hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded">
                                            {item.category || "General Wellness"}
                                        </span>
                                        <h3 className="font-headline-md text-base font-bold text-on-surface pt-1">
                                            {item.title || "Untitled Toolkit"}
                                        </h3>
                                    </div>
                                    <span className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl cursor-pointer" title="Bookmark Resource">
                                        bookmark
                                    </span>
                                </div>

                                <p className="text-on-surface-variant font-body-md text-xs leading-relaxed line-clamp-3">
                                    {item.description || item.content}
                                </p>

                                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 mt-1">
                                    <span className="text-[11px] font-medium text-outline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        {item.read_time || item.duration || "5 min read"}
                                    </span>

                                    <a
                                        href={item.external_url || item.link || "#"}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                                    >
                                        Access Resource
                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </a>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-outline text-xs italic">
                            No matching items located within the active parameters.
                        </div>
                    )}
                </section>
            </main>

            {/* Bottom Menu Navigation Bar Ribbon (Mobile Viewport Layout) */}
            <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-xl shadow-[0px_-4px_24px_rgba(5,139,3,0.08)] z-50 rounded-t-xl">
                <div className="flex justify-around items-center px-4 py-3 pb-safe max-w-720 mx-auto">
                    <button onClick={() => navigate('/guest-wall')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">grid_view</span>
                        <span className="font-label-sm text-label-sm">Wall</span>
                    </button>
                    <button onClick={() => navigate('/login')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">auto_stories</span>
                        <span className="font-label-sm text-label-sm">Journal</span>
                    </button>
                    <button onClick={() => navigate('/coach-directory')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-5 py-1.5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined">psychology</span>
                        <span className="font-label-sm text-label-sm">Coaches</span>
                    </button>
                    <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1.5 cursor-pointer">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
                        <span className="font-label-sm text-label-sm">Resources</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}