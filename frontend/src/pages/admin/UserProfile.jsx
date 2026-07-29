import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { API_ENDPOINTS } from '../../config/api';

export default function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            };

            try {
                const userEndpoint = API_ENDPOINTS?.USERS?.GET_BY_ID 
                    ? API_ENDPOINTS.USERS.GET_BY_ID(userId) 
                    : `/api/users/${userId}`;

                const postsEndpoint = `/api/users/${userId}/posts`;

                const [userRes, postsRes] = await Promise.all([
                    fetch(userEndpoint, { headers }),
                    fetch(postsEndpoint, { headers })
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                } else {
                    setError("Failed to load user profile information.");
                }

                if (postsRes.ok) {
                    const postsData = await postsRes.json();
                    setUserPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError("Network error loading user details.");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    // Handle Ban / Unban User Toggle
    const handleToggleBan = async () => {
        if (!user) return;
        const newBanStatus = !user.is_banned;
        
        const confirmMsg = newBanStatus 
            ? "Are you sure you want to ban this user?" 
            : "Are you sure you want to unban this user?";

        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/users/${userId}/ban`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ is_banned: newBanStatus })
            });

            const data = await res.json();

            if (res.ok) {
                setUser(prev => ({ ...prev, is_banned: newBanStatus }));
                alert(data.message || `User successfully ${newBanStatus ? 'banned' : 'unbanned'}.`);
            } else {
                alert(data.error || "Failed to update ban status.");
            }
        } catch (err) {
            console.error("Error toggling ban status:", err);
            alert("Network error updating ban status.");
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to extract primary display name
    const getPrimaryDisplayName = () => {
        if (user?.display_name) return user.display_name;
        if (user?.display_name_pool && user.display_name_pool.length > 0) {
            return user.display_name_pool[0];
        }
        return `User_${userId.slice(-4)}`;
    };

    const primaryName = getPrimaryDisplayName();

    return (
        <div className="bg-background text-on-surface min-h-screen antialiased overflow-x-hidden">
            <Navbar />

            <main className="pt-28 px-6 md:px-12 pb-24 max-w-[1440px] mx-auto">
                {/* Back Button Header */}
                <div className="mb-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to Moderation
                    </button>
                </div>

                {loading ? (
                    <div className="glass-card rounded-xl p-8 border border-outline-variant/30 text-center animate-pulse text-on-surface-variant">
                        Loading profile data...
                    </div>
                ) : error ? (
                    <div className="glass-card rounded-xl p-8 border border-outline-variant/30 text-center text-error">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Sidebar: User Details & Actions */}
                        <aside className="xl:col-span-4 space-y-6">
                            <div className="glass-card rounded-xl p-6 border border-outline-variant/30 shadow-sm">
                                <div className="flex flex-col items-center text-center pb-6 border-b border-outline-variant/10">
                                    <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl mb-3">
                                        {primaryName[0].toUpperCase()}
                                    </div>
                                    
                                    {/* Display Primary Name */}
                                    <h2 className="font-bold text-xl text-on-surface">
                                        {primaryName}
                                    </h2>
                                    
                                    {/* Display Phone Number */}
                                    <p className="text-sm font-medium text-on-surface-variant mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">call</span>
                                        {user?.phone_number || 'No phone number provided'}
                                    </p>
                                    
                                    <span className={`mt-3 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                        user?.is_banned ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'
                                    }`}>
                                        {user?.is_banned ? 'Banned' : 'Active Account'}
                                    </span>
                                </div>

                                

                                <div className="space-y-4 pt-6 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-on-surface-variant">User ID:</span>
                                        <span className="font-mono text-xs font-semibold">{userId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-on-surface-variant">Joined Date:</span>
                                        <span className="font-semibold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-on-surface-variant">Total Posts:</span>
                                        <span className="font-bold text-primary">{userPosts.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-on-surface-variant">Flagged Posts:</span>
                                        <span className="font-bold text-error">
                                            {userPosts.filter(p => p.flag_level && p.flag_level !== 'safe').length}
                                        </span>
                                    </div>
                                </div>

                                {/* Ban / Unban Action Button */}
                                <div className="pt-6 border-t border-outline-variant/10 mt-6">
                                    {user?.is_banned ? (
                                        <button
                                            onClick={handleToggleBan}
                                            disabled={actionLoading}
                                            className="w-full py-2.5 rounded-full border border-tertiary text-tertiary font-bold hover:bg-tertiary hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            {actionLoading ? "Updating..." : "Unban User"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleToggleBan}
                                            disabled={actionLoading}
                                            className="w-full py-2.5 rounded-full bg-error text-on-error font-bold hover:bg-error/90 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">block</span>
                                            {actionLoading ? "Updating..." : "Ban User"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Main Feed: All User Posts */}
                        <div className="xl:col-span-8 space-y-4">
                            <h2 className="font-headline-md text-headline-md text-secondary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">article</span>
                                User Post History ({userPosts.length})
                            </h2>

                            {userPosts.length > 0 ? (
                                userPosts.map((post) => (
                                    <div key={post.id || post._id} className="glass-card rounded-xl p-6 border border-outline-variant/30 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {post.flag_level && post.flag_level !== 'safe' && (
                                                    <span className="text-[10px] uppercase font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">flag</span>
                                                        {post.flag_level}
                                                    </span>
                                                )}
                                                {post.is_hidden ? (
                                                    <span className="text-[10px] uppercase font-bold bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">visibility_off</span> Hidden
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] uppercase font-bold bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">visibility</span> Public
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-on-surface-variant">
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                                            </span>
                                        </div>

                                        <p className="italic border-l-4 border-primary/40 pl-4 text-on-surface leading-relaxed">
                                            "{post.content || post.text}"
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="glass-card rounded-xl p-8 text-center text-on-surface-variant">
                                    No posts found for this user.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}