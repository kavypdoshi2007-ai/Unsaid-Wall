import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar'; // Adjust path as needed

export default function ResourceLibrary() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('guest');

    // --- Dynamic Backend & UI States ---
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // --- Form States (Mapped to Prisma Schema) ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        category: 'Stress Management',
        type: 'Article', // 🌟 Replaced read_time with type to match schema
        description: '',
        url: '', // 🌟 Renamed from external_url to match schema
        is_pinned: false // 🌟 Added pinned state
    });
    const [submitting, setSubmitting] = useState(false);

    // --- User Session Parsing States ---
    const token = localStorage.getItem('token');

    // --- Decode User Credentials ---
    useEffect(() => {
        if (token && token !== "null" && token !== "undefined") {
            try {
                const base64Url = token.split('.')[1];
                const parsedToken = JSON.parse(atob(base64Url));
                setUserRole(parsedToken.role || 'user');
            } catch (e) {
                console.error("Failed parsing user data from token:", e);
                setUserRole('guest');
            }
        } else {
            setUserRole('guest');
        }
    }, [token]);

    const categories = ['All', 'Crisis Support', 'Sleep Support', 'Stress Management', 'Anxiety', 'Meditation', 'Mindfulness'];
    const formCategories = ['Crisis Support', 'Sleep Support', 'Stress Management', 'Anxiety', 'Meditation', 'Mindfulness'];
    const resourceTypes = ['Article', 'Audio', 'Video', 'External Link'];

    // Absolute Backend Endpoint Targeting Your Express Router
    const API_RESOURCES_URL = 'https://diminish-waving-shore.ngrok-free.dev/api/resource';

    // --- Fetch Live Resources & Sort Pinned ---
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

                // 🌟 Sort: Pinned items first, then by newest date
                const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                });

                setResources(sortedData);
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
        const { name, value, type, checked } = e.target;
        setNewResource(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmitResource = async (e) => {
        e.preventDefault();

        if (userRole !== 'coach' && userRole !== 'admin') {
            alert('Unauthorized: You do not have permission to add resources.');
            return;
        }

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
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                // Send matching schema payload
                body: JSON.stringify(newResource)
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 401 || response.status === 403) {
                alert("Access Denied (401/403): You are not authorized to perform this action.");
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }

            // Success: Add to top of list (and re-sort if it was pinned)
            setResources(prev => {
                const newList = [data, ...prev];
                return newList.sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                });
            });

            setNewResource({ title: '', category: 'Stress Management', type: 'Article', description: '', url: '', is_pinned: false });
            setIsFormOpen(false);
            alert("Resource added successfully!");

        } catch (err) {
            console.error("Submission Error Details:", err);
            alert(`Submission Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to assign icons based on type
    const getTypeIcon = (type) => {
        switch ((type || '').toLowerCase()) {
            case 'article': return 'article';
            case 'audio': return 'headphones';
            case 'video': return 'play_circle';
            case 'external link': return 'link';
            default: return 'description';
        }
    };

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen">
            <Navbar />
            <main className="pt-32 pb-32 px-6 md:px-8 w-full max-w-5xl mx-auto space-y-8">

                <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <h1 className="font-display-lg text-4xl font-bold text-on-background tracking-tight">Self-Guided Resources</h1>
                        <p className="text-on-surface-variant font-body-md text-base leading-relaxed">
                            Explore mental health toolkits, therapeutic practices, and expert literature built to support your wellness.
                        </p>
                    </div>

                    {(userRole === 'coach' || userRole === 'admin') && (
                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="py-2.5 px-6 bg-primary text-on-primary font-label-sm text-sm font-bold rounded-full shadow-md hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                        >
                            {isFormOpen ? 'Close Form' : 'Add Resource'}
                        </button>
                    )}
                </section>

                {isFormOpen && (userRole === 'coach' || userRole === 'admin') && (
                    <section className="glass-card p-6 md:p-8 rounded-2xl border border-primary/20 bg-surface shadow-md animate-fade-in space-y-6">
                        <h2 className="font-headline-md text-xl font-bold text-primary">Contribute a New Resource</h2>
                        <form onSubmit={handleSubmitResource} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-on-surface-variant ml-1">Title *</label>
                                    <input
                                        type="text" name="title" value={newResource.title} onChange={handleInputChange} required placeholder="e.g., Box Breathing Guide"
                                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm focus:outline-none focus:border-primary text-on-surface"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-on-surface-variant ml-1">Category</label>
                                    <select
                                        name="category" value={newResource.category} onChange={handleInputChange}
                                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm focus:outline-none focus:border-primary text-on-surface"
                                    >
                                        {formCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-on-surface-variant ml-1">Resource Type</label>
                                    <select
                                        name="type" value={newResource.type} onChange={handleInputChange}
                                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm focus:outline-none focus:border-primary text-on-surface"
                                    >
                                        {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-on-surface-variant ml-1">Resource Link (URL)</label>
                                    <input
                                        type="url" name="url" value={newResource.url} onChange={handleInputChange} placeholder="https://example.com/resource"
                                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm focus:outline-none focus:border-primary text-on-surface"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-on-surface-variant ml-1">Description / Core Information *</label>
                                <textarea
                                    name="description" rows="3" value={newResource.description} onChange={handleInputChange} required placeholder="Summarize the core exercise, takeaways, or content details..."
                                    className="w-full p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm focus:outline-none focus:border-primary text-on-surface resize-none"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40">
                                <input
                                    type="checkbox"
                                    id="is_pinned"
                                    name="is_pinned"
                                    checked={newResource.is_pinned}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-primary focus:ring-primary border-outline-variant/50 rounded"
                                />
                                <label htmlFor="is_pinned" className="text-sm font-bold text-on-surface cursor-pointer select-none">
                                    Pin to top of Library
                                </label>
                            </div>

                            <button
                                type="submit" disabled={submitting}
                                className="w-full h-12 mt-2 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm shadow-primary/20"
                            >
                                {submitting ? 'Saving to Database...' : 'Submit Resource Node'}
                            </button>
                        </form>
                    </section>
                )}

                <section className="relative w-full">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">search</span>
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search techniques, exercises, or titles..."
                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/60 backdrop-blur-md border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-on-surface shadow-sm"
                    />
                </section>

                <section className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat} onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-6 py-2 rounded-full font-label-sm text-sm transition-all cursor-pointer ${activeCategory === cat ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </section>

                <section className="grid grid-cols-1 gap-5">
                    {loading ? (
                        <div className="text-center py-20 text-outline font-body-md italic animate-pulse">
                            Loading support library databases...
                        </div>
                    ) : error ? (
                        <div className="bg-error-container/20 text-error p-6 rounded-xl border border-error/10 text-center text-sm">
                            Trouble mapping dynamic documentation indexes: {error}
                        </div>
                    ) : resources.length > 0 ? (
                        resources.map((item) => (
                            <article
                                key={item.id || item._id}
                                className={`glass-card p-6 md:p-8 rounded-2xl border flex flex-col gap-4 shadow-sm hover:shadow-md transition-all ${item.is_pinned ? 'border-primary/40 bg-surface-container-low/80 ring-1 ring-primary/20' : 'border-outline-variant/30 bg-surface/50 hover:border-primary/30'}`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                {item.category || "General Wellness"}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant bg-surface-variant/50 px-3 py-1 rounded-full flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">{getTypeIcon(item.type)}</span>
                                                {item.type || 'Resource'}
                                            </span>
                                            {item.is_pinned && (
                                                <span className="material-symbols-outlined text-primary text-[18px]" title="Pinned Resource" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    keep
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-headline-md text-xl font-bold text-on-surface leading-tight">
                                            {item.title || "Untitled Toolkit"}
                                        </h3>
                                    </div>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant text-outline hover:text-primary transition-colors cursor-pointer shrink-0" title="Bookmark Resource">
                                        <span className="material-symbols-outlined text-2xl">bookmark_border</span>
                                    </button>
                                </div>

                                <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed">
                                    {item.description || item.content}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-2">
                                    <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                        Added: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
                                    </span>

                                    <a
                                        href={item.url || item.link || "#"}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-sm font-bold text-primary hover:text-primary-dim hover:underline flex items-center gap-1 transition-colors"
                                    >
                                        Access Resource
                                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                    </a>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl text-on-surface-variant text-sm italic">
                            No matching items located within the active parameters.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}