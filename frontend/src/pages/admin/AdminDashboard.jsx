import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { API_ENDPOINTS } from '../../config/api';

export default function AdminDashboard() {
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [animateBars, setAnimateBars] = useState(false);
    const navigate = useNavigate();

    // --- Backend Form State ---
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastLink, setBroadcastLink] = useState('');

    // --- Backend Fetched Metrics & Profile States ---
    const [adminAvatar, setAdminAvatar] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuDl3F6qPzoXfe2w4-D88uz6J_tSlsVuNX1v0jO-qfMXmwDehoaBPqp-Phf7SGqAgWAikmJGqUHxms1qKw5FhP0sPrBfotqlVJVsXchKrKsFdZkyMT5Tkk49bPGXivCA32aLc3qwPo-JtqqiUbhb-pb9KZmCXez9lLLMtnQlnYLtAe0j5fJlibEjK-26qNLvlrf98pN3LogJy7OwqgKrJ7lvBwdu_9Ttn916l1ajAM3lWxBjok5zj0I_ZBuVETFyP4Zmp-QWFb7iXRnw");
    const [activeSessionsCount, setActiveSessionsCount] = useState(1482); 
    const [postsTodayCount, setPostsTodayCount] = useState(1482);  
    
    const [emotionDistribution, setEmotionDistribution] = useState({
        HOPEFUL: 0,
        ANXIOUS: 0,
        OVERWHELMED: 0,
        SAD: 0,
        LONELY: 0,
        ANGRY: 0,
        NUMB: 0,
        CONFUSED: 0
    });

    // --- Dynamic Coaches List State (Pre-filled with database models) ---
    const [coaches, setCoaches] = useState([
        {
            id: "1",
            name: "Dr. Elena Rostova",
            specialty: "Trauma Specialist",
            experience: 12,
            profile_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOBCZviZZXD6L0U6x3jk4JCq_auon3aaa5C1OVjR4okk254UMheb-B3VQ24UDh5lHv5p7CMgTCTQyMOBXHCU8teNSSVXz-dfq1OXOnN-R5OEx6GfJ2uAyvMK__9DU5_NxrIF84cfMT1DDZNWoRqfAOXHviT7Z8cl4CfnH2UxOeyZREfvbsLMNGz5JAz1sRNMdJeNy8mlna4J3O8b56rRtTZbjlZDJNkvuL60chqHlxMyvuVZQ_u_Eo-6UwaEL4zY-BLrBfu5xAG4ZC",
            status: "active"
        },
        {
            id: "2",
            name: "Marcus Thorne",
            specialty: "Cognitive Behavioral",
            experience: 8,
            profile_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAG8rDiGhvKTIX1Iu9YTDMK4aKEKyIp26aj3UJeUMAw0nKJAPl1E6o_Ig9Vvb-K1w6yNSc4f1FqyRSiYhWh0UdKzDOA7xw729TBJ8aidbBCyhlGiV65tKDBJ7AIXi6-0HZlAR8Hmt4bXnHHgiAqojRPFs_4hJKHY1Bm6PvicjDSNJDwgOy_Z2Ipy27kqgA_APnyP5-mkWjDyU4bKsOVRdO1TkSp3NzXm08pGyRkxDrnHT8gR7_wty6Y4KIiwj0V9uJ4B5EbgxdxPesy",
            status: "busy"
        },
        {
            id: "3",
            name: "Sarah Jenkins",
            specialty: "Mindfulness Coach",
            experience: 5,
            profile_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbQZLYvPokMQNvWjwy6r53j-cy0WjS6ubQUDjOwgIE2CpX2vTcEdNm2qcHQS-Y51zuQxEshzWXGJLl8hu8tAz_npoIv163eTHJkFo5kiq6qj-TokgqXf_ILdQti567t_iaZNHnoJKPmkLEpNdkUN-D8K5xwir_-0T6Fx5EJCDCx2FKKbNMkPcl_bdG3wlB1XaIhf8mGiQagtCZqzUgD27wYl1HVlWJ9X6HTH9ecYozJMfaBAyDXxzWPVI-ahaRM4hCD7r0xfxsVGEq",
            status: "away"
        }
    ]);

    // --- Dynamic Crisis Alerts State (Pre-filled matching your Post Prisma model fields) ---
    const [crisisAlerts, setCrisisAlerts] = useState([
        {
            id: 'static-1',
            title: 'User_8291 (The Wall)',
            flagLabel: 'Flag: Self-Harm',
            snippet: `"I just don't see the light at the end of this tunnel anymore, the quiet is too heavy..."`,
            timeAgo: '2 mins ago',
            severity: 'high'
        },
        {
            id: 'static-2',
            title: 'Journal Entry #AF-22',
            flagLabel: 'Flag: Anxiety Spike',
            snippet: 'Keyword density high for \'chest pain\', \'cannot breathe\'. Cognitive analysis suggests panic attack.',
            timeAgo: '14 mins ago',
            severity: 'medium',
            coachAlertSent: true
        }
    ]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const determineTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const delta = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
        if (delta < 60) return `${delta}s ago`;
        const minutes = Math.floor(delta / 60);
        if (minutes < 60) return `${minutes} mins ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hrs ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimateBars(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // --- Live Data Integration Pipeline ---
    useEffect(() => {
        const headers = getAuthHeaders();

        // 1. Get Me Profile Data
        fetch(API_ENDPOINTS.USERS.ME, { headers })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    const avatar = data.profile_image || data.avatarUrl;
                    if (avatar) setAdminAvatar(avatar);
                }
            })
            .catch(err => console.error("Error loading admin metadata:", err));

        // 2. Active Session Metrics
        fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, { headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    // Filter pending/scheduled/active out based on backend SessionStatus enum
                    const openSessions = data.filter(s => ['active'].includes(s.status));
                    setActiveSessionsCount(openSessions.length || data.length);
                }
            })
            .catch(err => console.error("Error fetching live sessions metrics:", err));

        // 3. Posts Metrics
        fetch(API_ENDPOINTS.POSTS.GET_FEED, { headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                if (list.length > 0) {
                    // Filter posts matching today's date
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);

                    const todayPosts = list.filter(post => {
                        const postDate = new Date(post.created_at );
                        return postDate >= startOfToday;
                    });

                    setPostsTodayCount(todayPosts.length);

                    const counts = {
                        HOPEFUL: 0, 
                        ANXIOUS: 0, 
                        OVERWHELMED: 0, 
                        SAD: 0, 
                        LONELY: 0, 
                        ANGRY: 0, 
                        NUMB: 0, 
                        CONFUSED: 0
                    };

                    // 2. Count instances across all live posts
                    list.forEach(post => {
                        if (post.emotion && counts[post.emotion] !== undefined) {
                            counts[post.emotion]++;
                        }
                    });

                    // 3. Convert aggregate counts into percentage values for the metrics
                    const totalParsed = Object.values(counts).reduce((a, b) => a + b, 0);
                    if (totalParsed > 0) {
                        const percentages = {};
                        Object.keys(counts).forEach(key => {
                            percentages[key] = Math.round((counts[key] / totalParsed) * 100);
                        });
                        
                        // 4. Update state to re-render the distribution UI and chart seamlessly
                        setEmotionDistribution(percentages);
                    }
                }
            })
            .catch(err => console.error("Error parsing posts list metrics:", err));

        // 4. Coaches Directory Parsing
        fetch(API_ENDPOINTS.COACHES.GET_ALL, { headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.coaches || [];
                if (list.length > 0) {
                    setCoaches(list.map((c, idx) => {
                        // Maps backend AvailabilityStatus options to frontend lowercase identifiers
                        let uiStatus = 'away';
                        if (c.availability === 'available') uiStatus = 'active';
                        if (c.availability === 'busy') uiStatus = 'busy';

                        return {
                            id: c.id || idx,
                            name: c.name || "Unnamed Coach",
                            specialty: c.specializations?.[0] || "Mental Health Professional",
                            experience: c.sessions_count || 0, // Fallback database structural metric safely
                            profile_image: c.profile_image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAOBCZviZZXD6L0U6x3jk4JCq_auon3aaa5C1OVjR4okk254UMheb-B3VQ24UDh5lHv5p7CMgTCTQyMOBXHCU8teNSSVXz-dfq1OXOnN-R5OEx6GfJ2uAyvMK__9DU5_NxrIF84cfMT1DDZNWoRqfAOXHviT7Z8cl4CfnH2UxOeyZREfvbsLMNGz5JAz1sRNMdJeNy8mlna4J3O8b56rRtTZbjlZDJNkvuL60chqHlxMyvuVZQ_u_Eo-6UwaEL4zY-BLrBfu5xAG4ZC",
                            status: uiStatus
                        };
                    }));
                }
            })
            .catch(err => console.error("Error building live coach registries:", err));

        // 5. Moderation Queue Layout Parsing
        fetch(API_ENDPOINTS.POSTS.GET_MOD_QUEUE, { headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                if (list.length > 0) {
                    setCrisisAlerts(list.map((item, idx) => {
                        const isHighPriority = item.flag_level === 'crisis' || item.emotion === 'OVERWHELMED';
                        return {
                            id: item.id || idx,
                            title: item.display_name || `User (${String(item.user_id || '').slice(0,6)})`,
                            flagLabel: item.emotion ? `Flag: ${item.emotion}` : 'Flag: Distress Pattern',
                            snippet: item.content || '',
                            timeAgo: determineTimeAgo(item.created_at),
                            severity: isHighPriority ? 'high' : 'medium',
                            coachAlertSent: item.is_flagged
                        };
                    }));
                }
            })
            .catch(err => console.error("Error loading mod queue reports:", err));
    }, []);

    const handleDismissAlert = (id) => {
        setCrisisAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleSendBroadcast = (e) => {
        e.preventDefault();
        if (!broadcastMessage.trim()) return;

        fetch(API_ENDPOINTS.ANNOUNCEMENTS.CREATE, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                content: broadcastMessage, // maps exactly to database field
                link: broadcastLink || undefined
            })
        })
        .then(res => {
            if (res.ok) {
                setBroadcastMessage('');
                setBroadcastLink('');
                setShowBroadcast(false);
            }
        })
        .catch(err => console.error("Failed creating dynamic announcement:", err));
    };

    const highPriorityCount = crisisAlerts.filter(a => a.severity === 'high').length;

    return (
        <div className="font-body-md text-on-surface antialiased overflow-x-hidden min-h-screen" style={{ background: 'radial-gradient(circle at 0% 0%, #cdfdd0 0%, #dfffde 100%)' }}>

            <Navbar />

            <main className="pt-28 px-6 md:px-12 pb-24 max-w-[1440px] mx-auto">

                {/* Header Row */}
                <header className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="font-display-lg text-display-lg text-primary">Platform Overview</h2>
                        <p className="text-on-surface-variant font-body-md mt-2">Real-time health monitoring & administrative control.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => setShowBroadcast(true)}
                            className="bg-primary text-on-primary px-6 py-3 rounded-full flex items-center gap-2 font-bold transition-all hover:brightness-110 active:scale-95 ring-4 ring-primary/30 cursor-pointer"
                        >
                            <span className="material-symbols-outlined">campaign</span>
                            Broadcast Tool
                        </button>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                            <img alt="Admin Avatar" className="w-full h-full object-cover" src={adminAvatar} />
                        </div>
                    </div>
                </header>

                {/* Broadcast Modal Overlay */}
                {showBroadcast && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 w-screen h-screen">

                        {/* 🌟 FIX: Added min-w-[320px], sm:w-[500px], and shrink-0 to prevent collapsing */}
                        <div className="bg-surface-container-lowest w-[90%] sm:w-[500px] min-w-[320px] shrink-0 p-8 rounded-xl shadow-xl border border-outline-variant/20 animate-fade-in">

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-headline-md text-primary text-xl font-bold whitespace-nowrap">New Global Broadcast</h3>
                                <button
                                    className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0 ml-4"
                                    onClick={() => setShowBroadcast(false)}
                                >
                                    close
                                </button>
                            </div>

                            <form onSubmit={handleSendBroadcast} className="space-y-5 w-full">
                                <div className="w-full">
                                    <label className="block text-label-sm font-bold mb-2 uppercase tracking-wider text-on-surface">
                                        Announcement Message
                                    </label>
                                    <textarea
                                        className="block w-full bg-surface-container-low border border-outline-variant/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                                        placeholder="Enter broadcast message..." rows="4"
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="w-full">
                                    <label className="block text-label-sm font-bold mb-2 uppercase tracking-wider text-on-surface">
                                        URL LINK (OPTIONAL)
                                    </label>
                                    <input
                                        className="block w-full bg-surface-container-low border border-outline-variant/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        placeholder="https://... (Optional)" type="url"
                                        value={broadcastLink}
                                        onChange={(e) => setBroadcastLink(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                    {/* 🌟 FIX: Added whitespace-nowrap so button text never stacks */}
                                    <button type="submit" className="flex-1 bg-primary text-on-primary py-3 px-4 rounded-full font-bold hover:brightness-110 transition-all cursor-pointer whitespace-nowrap">
                                        Send Broadcast
                                    </button>
                                    <button
                                        type="button"
                                        className="py-3 px-8 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer whitespace-nowrap"
                                        onClick={() => setShowBroadcast(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Stats Top Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-lg border border-outline-variant/10 shadow-sm shadow-primary/5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">Active Sessions</span>
                            <span className="material-symbols-outlined text-primary">groups</span>
                        </div>
                        <div className="text-4xl font-bold text-primary">{activeSessionsCount.toLocaleString()}</div>
                        <div className="mt-2 text-primary-dim text-sm flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                            +12% from last hour
                        </div>
                    </div>

                    <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-lg border border-outline-variant/10 shadow-sm shadow-primary/5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">Posts Today</span>
                            <span className="material-symbols-outlined text-tertiary">forum</span>
                        </div>
                        <div className="text-4xl font-bold text-tertiary">{postsTodayCount.toLocaleString()}</div>
                        <div className="mt-2 text-tertiary-dim text-sm flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                            +12% from last hour
                        </div>
                    </div>

                    {/* 🛠️ RECOLORED DYNAMIC EMOTION DISTRIBUTION CARD */}
                    <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-lg border border-outline-variant/10 shadow-sm shadow-primary/5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">Emotion Distribution</span>
                            <span className="material-symbols-outlined text-secondary">analytics</span>
                        </div>
                        <div className="space-y-4">
                            {/* Dynamic Continuous Multi-Segment Progress Bar with Fresh Contrast Colors */}
                            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${emotionDistribution.HOPEFUL || 0}%` }} title={`Hopeful: ${emotionDistribution.HOPEFUL || 0}%`}></div>
                                <div className="bg-sky-400 h-full transition-all duration-500" style={{ width: `${emotionDistribution.ANXIOUS || 0}%` }} title={`Anxious: ${emotionDistribution.ANXIOUS || 0}%`}></div>
                                <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${emotionDistribution.OVERWHELMED || 0}%` }} title={`Overwhelmed: ${emotionDistribution.OVERWHELMED || 0}%`}></div>
                                <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${emotionDistribution.SAD || 0}%` }} title={`Sad: ${emotionDistribution.SAD || 0}%`}></div>
                                <div className="bg-fuchsia-500 h-full transition-all duration-500" style={{ width: `${emotionDistribution.LONELY || 0}%` }} title={`Lonely: ${emotionDistribution.LONELY || 0}%`}></div>
                                <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${emotionDistribution.ANGRY || 0}%` }} title={`Angry: ${emotionDistribution.ANGRY || 0}%`}></div>
                                <div className="bg-slate-400 h-full transition-all duration-500" style={{ width: `${emotionDistribution.NUMB || 0}%` }} title={`Numb: ${emotionDistribution.NUMB || 0}%`}></div>
                                <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${emotionDistribution.CONFUSED || 0}%` }} title={`Confused: ${emotionDistribution.CONFUSED || 0}%`}></div>
                            </div>

                            {/* Recolored Grid Layout matching the progress bar exactly */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-[110px] overflow-y-auto pr-1">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-on-surface-variant">HOPEFUL</span></div><span className="text-[10px] font-bold text-emerald-600">{emotionDistribution.HOPEFUL || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-400"></div><span className="text-[10px] font-bold text-on-surface-variant">ANXIOUS</span></div><span className="text-[10px] font-bold text-sky-500">{emotionDistribution.ANXIOUS || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] font-bold text-on-surface-variant">OVERWHELM</span></div><span className="text-[10px] font-bold text-indigo-600">{emotionDistribution.OVERWHELMED || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-on-surface-variant">SAD</span></div><span className="text-[10px] font-bold text-rose-600">{emotionDistribution.SAD || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-fuchsia-500"></div><span className="text-[10px] font-bold text-on-surface-variant">LONELY</span></div><span className="text-[10px] font-bold text-fuchsia-600">{emotionDistribution.LONELY || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold text-on-surface-variant">ANGRY</span></div><span className="text-[10px] font-bold text-orange-600">{emotionDistribution.ANGRY || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"></div><span className="text-[10px] font-bold text-on-surface-variant">NUMB</span></div><span className="text-[10px] font-bold text-slate-500">{emotionDistribution.NUMB || 0}%</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div><span className="text-[10px] font-bold text-on-surface-variant">CONFUSED</span></div><span className="text-[10px] font-bold text-amber-600">{emotionDistribution.CONFUSED || 0}%</span></div>
                            </div>
                        </div>
                    </div>
                </div>                
                
                {/* Middle Section: Active Crisis Alerts */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6 w-full">
                        <h3 className="font-headline-md text-headline-md text-on-surface">Active Crisis Alerts</h3>
                        <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold animate-pulse">
                            {highPriorityCount} HIGH PRIORITY
                        </span>
                    </div>

                    <div className="space-y-4 w-full">
                        {crisisAlerts.map((alert) => {
                            const isHigh = alert.severity === 'high';
                            return isHigh ? (
                                <div key={alert.id} className="bg-surface-container-lowest/90 backdrop-blur-xl p-6 rounded-lg border-l-4 border-error flex flex-col md:flex-row items-start justify-between shadow-[0_0_20px_rgba(176,37,0,0.15)] gap-4 w-full">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container shrink-0">
                                            <span className="material-symbols-outlined">warning</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg">{alert.title}</h4>
                                                <span className="px-2 py-0.5 bg-error text-white text-[10px] font-bold rounded uppercase">{alert.flagLabel}</span>
                                            </div>
                                            <p className="text-on-surface-variant italic mb-3">{alert.snippet}</p>
                                            <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {alert.timeAgo}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                                        <button className="bg-error text-on-error px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:brightness-110 transition-all">Intervene Now</button>
                                        <button 
                                            onClick={() => handleDismissAlert(alert.id)}
                                            className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:brightness-95 transition-all"
                                        >
                                            Dismiss (False Positive)
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div key={alert.id} className="bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-lg border-l-4 border-secondary/40 flex flex-col md:flex-row items-start justify-between gap-4 w-full">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                                            <span className="material-symbols-outlined">priority_high</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg">{alert.title}</h4>
                                                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">{alert.flagLabel}</span>
                                            </div>
                                            <p className="text-on-surface-variant italic mb-3">{alert.snippet}</p>
                                            <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {alert.timeAgo}</span>
                                                {alert.coachAlertSent && (
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">psychology</span> Coach Alert Sent</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                                        <button className="bg-secondary text-on-secondary px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:brightness-110 transition-all">Deploy Breathing Tool</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bottom Section: Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Dynamic Coach Status List */}
                    <section className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-lg border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline-md text-headline-md">Coach Status</h3>
                            <button className="bg-primary text-on-primary px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm transition-all hover:brightness-110 active:scale-95 cursor-pointer">
                                <span className="material-symbols-outlined text-sm">person_add</span>Invite Coach
                            </button>
                        </div>

                        <div className="space-y-6">
                            {coaches.map((coach) => {
                                const isActive = coach.status?.toLowerCase() === 'active';
                                const isBusy = coach.status?.toLowerCase() === 'busy';
                                const isAway = coach.status?.toLowerCase() === 'away';

                                const dotColor = isActive ? 'bg-green-500' : isBusy ? 'bg-red-500' : isAway ? 'bg-amber-400' : 'bg-zinc-400';
                                const badgeColor = isActive ? 'bg-green-100 text-green-700' : isBusy ? 'bg-red-100 text-red-700' : isAway ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600';

                                return (
                                    <div key={coach.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    alt={coach.name || 'Coach'}
                                                    className="w-12 h-12 rounded-full object-cover border border-outline-variant/20"
                                                    src={coach.profile_image}
                                                />
                                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor}`}></div>
                                            </div>

                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    {coach.name}
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold ${badgeColor}`}>
                                                        {coach.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-on-surface-variant">
                                                    {coach.specialty} • {coach.experience} sessions completed
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Large Community Vibe Chart */}
                    {/* Large Community Vibe Chart with Dynamic Matching Colors */}
                    {/* MODERN, FIX-HEIGHT 8-COLUMN BAR GRAPH COMPONENT */}
                    <section className="bg-surface-container-highest/60 backdrop-blur-xl p-8 rounded-lg border border-outline-variant/10 relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="mb-6">
                                <h3 className="font-headline-md text-headline-md">Community Vibe</h3>
                                <p className="text-on-surface-variant text-sm">Real-time aggregate emotional tone across all data streams</p>
                            </div>
                            
                            {/* Chart Canvas Area (Height: 14rem / h-56) */}
                            <div className="flex items-end justify-between h-56 gap-2 sm:gap-3 px-2 pt-4 border-b border-outline-variant/20" style={{ display: 'flex', alignItems: 'flex-end', height: '14rem' }}>
                                
                                {/* HOPEFUL */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-emerald-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.HOPEFUL || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-emerald-600">{emotionDistribution.HOPEFUL || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">HOPE</span>
                                </div>

                                {/* ANXIOUS */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-sky-400 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.ANXIOUS || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-sky-500">{emotionDistribution.ANXIOUS || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">ANX</span>
                                </div>

                                {/* OVERWHELMED */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-indigo-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.OVERWHELMED || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-indigo-600">{emotionDistribution.OVERWHELMED || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">OVRW</span>
                                </div>

                                {/* SAD */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-rose-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.SAD || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-rose-600">{emotionDistribution.SAD || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">SAD</span>
                                </div>

                                {/* LONELY */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-fuchsia-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.LONELY || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-fuchsia-600">{emotionDistribution.LONELY || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">LONE</span>
                                </div>

                                {/* ANGRY */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-orange-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.ANGRY || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-orange-600">{emotionDistribution.ANGRY || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">ANGR</span>
                                </div>

                                {/* NUMB */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-slate-400 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.NUMB || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-slate-500">{emotionDistribution.NUMB || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">NUMB</span>
                                </div>

                                {/* CONFUSED */}
                                <div className="flex-1 flex flex-col justify-end items-center group h-full" style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                    <div className="w-full bg-amber-400 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110" 
                                         style={{ height: `${emotionDistribution.CONFUSED || 0}%`, minHeight: '4px', width: '100%' }}></div>
                                    <span className="text-[9px] font-bold mt-2 text-amber-600">{emotionDistribution.CONFUSED || 0}%</span>
                                    <span className="text-[8px] tracking-tighter text-on-surface-variant uppercase font-bold mb-1 opacity-70">CONF</span>
                                </div>
                            </div>
                        </div>

                        {/* Text Summary Info Footer */}
                        <div className="mt-6 flex items-center gap-4 p-4 bg-white/40 rounded-xl border border-outline-variant/5 shadow-inner">
                            <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                            <p className="text-xs text-on-surface font-medium leading-relaxed">
                                System parsing confirms <span className="font-bold text-emerald-600">HOPEFUL ({emotionDistribution.HOPEFUL || 0}%)</span> and <span className="font-bold text-sky-500">ANXIOUS ({emotionDistribution.ANXIOUS || 0}%)</span> are driving the core platform equilibrium trends this cycle.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}