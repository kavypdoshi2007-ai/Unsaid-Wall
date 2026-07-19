import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper function to check if the path is active
    const isActive = (path) => location.pathname === path;

    // --- State to hold the current user's role ---
    const [userRole, setUserRole] = useState('guest');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- Extract Role from Token on Mount ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
            setIsAuthenticated(true);
            try {
                const base64Url = token.split('.')[1];
                const parsedToken = JSON.parse(atob(base64Url));
                setUserRole(parsedToken.role || 'user');
            } catch (e) {
                console.error("Failed to parse token in Navbar:", e);
                setUserRole('user'); // Fallback
            }
        } else {
            setIsAuthenticated(false);
            setUserRole('guest');
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            // 1. Tell the backend to clear the httpOnly cookie securely
            await fetch('https://diminish-waving-shore.ngrok-free.dev/api/users/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (err) {
            console.error("Backend logout clean failed:", err);
        }

        // 2. Clear out local client cookies using the js-cookie package
        Cookies.remove('token', { path: '/' });

        // 3. Clear application state and route away
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <>
            {/* 🌟 DESKTOP NAVBAR */}
            <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(5,139,3,0.05)] border-b border-outline-variant/10">
                <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">

                    {/* Dynamic Logo Click based on Role */}
                    <div
                        onClick={() => {
                            if (!isAuthenticated) navigate('/');
                            else if (userRole === 'coach') navigate('/coach-dashboard');
                            else if (userRole === 'admin') navigate('/admin-dashboard');
                            else navigate('/user-wall');
                        }}
                        className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform hover:opacity-80"
                    >
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <h1 className="font-display-lg-mobile text-[20px] text-primary tracking-tight font-bold">Unsaid Wall</h1>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">

                        {/* 1. GUEST VIEW */}
                        {!isAuthenticated && (
                            <>
                                <button onClick={() => navigate('/guest-wall')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/guest-wall') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>TheWall</button>
                                <button onClick={() => navigate('/coach-directory')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/coach-directory') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Coaches</button>
                                <button onClick={() => navigate('/resources')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/resources') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Resource Library</button>
                                <button onClick={() => navigate('/announcements')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/announcements') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Announcements</button>
                                <button onClick={() => navigate('/login')} className="py-2 px-6 bg-primary text-on-primary rounded-full font-label-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">Login / Register</button>
                            </>
                        )}

                        {/* 2. STANDARD USER VIEW */}
                        {isAuthenticated && userRole === 'user' && (
                            <>
                                <button onClick={() => navigate('/user-wall')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/user-wall') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>TheWall</button>
                                <button onClick={() => navigate('/emotion-journal')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/emotion-journal') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Journal</button>
                                <button onClick={() => navigate('/coach-profile')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/coach-profile') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Coaches</button>
                                <button onClick={() => navigate('/my-sessions')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/my-sessions') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Sessions</button>
                                <button onClick={() => navigate('/resources')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/resources') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Resource Library</button>
                                <button onClick={() => navigate('/announcements')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/announcements') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Announcements</button>
                                <button onClick={handleLogout} className="py-2 px-4 bg-outline/10 text-outline rounded-full font-label-sm font-bold hover:bg-error/10 hover:text-error transition-all cursor-pointer">Logout</button>
                            </>
                        )}

                        {/* 3. COACH VIEW */}
                        {isAuthenticated && userRole === 'coach' && (
                            <>
                                <button onClick={() => navigate('/coach-dashboard')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/coach-dashboard') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Dashboard</button>
                                <button onClick={() => navigate('/resources')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/resources') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Resource Library</button>
                                <button onClick={() => navigate('/announcements')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/announcements') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Announcements</button>
                                <button onClick={handleLogout} className="py-2 px-4 bg-outline/10 text-outline rounded-full font-label-sm font-bold hover:bg-error/10 hover:text-error transition-all cursor-pointer">Logout</button>
                            </>
                        )}

                        {/* 4. ADMIN VIEW */}
                        {isAuthenticated && userRole === 'admin' && (
                            <>
                                <button onClick={() => navigate('/admin-dashboard')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/admin-dashboard') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Admin Dashboard</button>
                                <button onClick={() => navigate('/admin-moderation')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/admin-moderation') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Moderation</button>
                                <button onClick={() => navigate('/announcements')} className={`font-label-sm font-semibold transition-colors cursor-pointer ${isActive('/announcements') ? 'text-primary bg-primary-container/20 px-4 py-2 rounded-full' : 'text-outline hover:text-primary'}`}>Announcements</button>
                                <button onClick={handleLogout} className="py-2 px-4 bg-outline/10 text-outline rounded-full font-label-sm font-bold hover:bg-error/10 hover:text-error transition-all cursor-pointer">Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* 🌟 MOBILE BOTTOM NAVBAR */}
            <nav className="fixed bottom-0 left-0 w-full md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-xl shadow-[0px_-4px_24px_rgba(5,139,3,0.08)] z-50 rounded-t-xl overflow-x-auto hide-scrollbar">
                <div className="flex justify-around items-center px-2 py-3 pb-safe min-w-max mx-auto gap-2">

                    {/* 1. GUEST VIEW */}
                    {!isAuthenticated && (
                        <>
                            <button onClick={() => navigate('/guest-wall')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/guest-wall') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/guest-wall') ? "'FILL' 1" : "'FILL' 0" }}>auto_awesome</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">TheWall</span>
                            </button>
                            <button onClick={() => navigate('/coach-directory')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/coach-directory') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/coach-directory') ? "'FILL' 1" : "'FILL' 0" }}>psychology</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Coaches</span>
                            </button>
                            <button onClick={() => navigate('/resources')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/resources') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/resources') ? "'FILL' 1" : "'FILL' 0" }}>local_library</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Resource Library</span>
                            </button>
                            <button onClick={() => navigate('/announcements')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/announcements') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/announcements') ? "'FILL' 1" : "'FILL' 0" }}>campaign</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Announcements</span>
                            </button>
                            <button onClick={() => navigate('/login')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/login') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/login') ? "'FILL' 1" : "'FILL' 0" }}>login</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Login / Register</span>
                            </button>
                        </>
                    )}

                    {/* 2. STANDARD USER VIEW */}
                    {isAuthenticated && userRole === 'user' && (
                        <>
                            <button onClick={() => navigate('/user-wall')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/user-wall') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/user-wall') ? "'FILL' 1" : "'FILL' 0" }}>auto_awesome</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">TheWall</span>
                            </button>
                            <button onClick={() => navigate('/emotion-journal')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/emotion-journal') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/emotion-journal') ? "'FILL' 1" : "'FILL' 0" }}>auto_stories</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Journal</span>
                            </button>
                            <button onClick={() => navigate('/coach-profile')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/coach-profile') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/coach-profile') ? "'FILL' 1" : "'FILL' 0" }}>psychology</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Coaches</span>
                            </button>
                            <button onClick={() => navigate('/my-sessions')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/my-sessions') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/my-sessions') ? "'FILL' 1" : "'FILL' 0" }}>forum</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Sessions</span>
                            </button>
                            <button onClick={() => navigate('/resources')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/resources') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/resources') ? "'FILL' 1" : "'FILL' 0" }}>local_library</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Resource Library</span>
                            </button>
                            <button onClick={() => navigate('/announcements')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/announcements') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/announcements') ? "'FILL' 1" : "'FILL' 0" }}>campaign</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Announcements</span>
                            </button>
                            <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-error px-2 py-1 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined mb-1 text-xl">logout</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Logout</span>
                            </button>
                        </>
                    )}

                    {/* 3. COACH VIEW */}
                    {isAuthenticated && userRole === 'coach' && (
                        <>
                            <button onClick={() => navigate('/coach-dashboard')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/coach-dashboard') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/coach-dashboard') ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Dashboard</span>
                            </button>
                            <button onClick={() => navigate('/resources')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/resources') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/resources') ? "'FILL' 1" : "'FILL' 0" }}>local_library</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Resource Library</span>
                            </button>
                            <button onClick={() => navigate('/announcements')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/announcements') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/announcements') ? "'FILL' 1" : "'FILL' 0" }}>campaign</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Announcements</span>
                            </button>
                            <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-error px-2 py-1 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined mb-1 text-xl">logout</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Logout</span>
                            </button>
                        </>
                    )}

                    {/* 4. ADMIN VIEW */}
                    {isAuthenticated && userRole === 'admin' && (
                        <>
                            <button onClick={() => navigate('/admin-dashboard')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/admin-dashboard') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/admin-dashboard') ? "'FILL' 1" : "'FILL' 0" }}>admin_panel_settings</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Admin Dashboard</span>
                            </button>
                            <button onClick={() => navigate('/admin-moderation')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/admin-moderation') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/admin-moderation') ? "'FILL' 1" : "'FILL' 0" }}>gavel</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Moderation</span>
                            </button>
                            <button onClick={() => navigate('/announcements')} className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/announcements') ? 'bg-primary-container text-on-primary-container rounded-full px-5 py-1.5' : 'text-on-surface-variant hover:text-primary px-2 py-1'}`}>
                                <span className="material-symbols-outlined mb-1 text-xl" style={{ fontVariationSettings: isActive('/announcements') ? "'FILL' 1" : "'FILL' 0" }}>campaign</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Announcements</span>
                            </button>
                            <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-error px-2 py-1 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined mb-1 text-xl">logout</span>
                                <span className="font-label-sm text-[10px] font-semibold whitespace-nowrap">Logout</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </>
    );
}