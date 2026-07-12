import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io as socketIOClient } from 'socket.io-client';
import { API_ENDPOINTS, BACKEND_URL } from '../../config/api';
import Navbar from '../../components/Navbar'; // Adjust path as needed
// The API base is BACKEND_URL + '/api'; Socket.io runs on the bare host, not under /api
const SOCKET_URL = BACKEND_URL.replace(/\/api\/?$/, '');

export default function CoachChat() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract the live session context sent over from the dashboard selection
    const routeSessionId = location.state?.sessionId || null;

    // Core Connection and UI States
    const [sessionId, setSessionId] = useState(routeSessionId);
    const [sessionMeta, setSessionMeta] = useState(null);
    const [latestPost, setLatestPost] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [privateNotes, setPrivateNotes] = useState('');
    const [lastSavedNote, setLastSavedNote] = useState(''); // Tracking the last explicitly saved note
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [dbResources, setDbResources] = useState([]);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const socketRef = useRef(null);
    const currentUserIdRef = useRef(null);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    // Auto-scroll utility for modern interaction feedback
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch resources from database
    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.RESOURCES.GET_ALL, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDbResources(data.slice(0, 2));
                }
            }
        } catch (err) {
            console.error("Failed to fetch database resources:", err);
        }
    };

    // Fetch the latest post of the user directly from the database using their ID
    const fetchLatestUserPost = async (metaData) => {
        // Extract the target client/user ID from your session metadata
        const targetUserId = metaData?.clientId || metaData?.userId || metaData?.client?._id || metaData?.user?.id || metaData?.client;

        if (!targetUserId) {
            console.warn("Could not find a valid user ID inside session metadata.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/posts`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (res.ok) {
                const allPosts = await res.json();

                if (Array.isArray(allPosts)) {
                    // Look through feed array to find the first match for this user_id
                    const latestPostForUser = allPosts.find(post => {
                        // Extract the post's user_id value (checking if it's an object with an ID or a string directly)
                        const postUserId = post.user_id?._id || post.user_id?.id || post.user_id;

                        // Convert both sides to strings to safely handle formatting/type mismatches
                        return String(postUserId) === String(targetUserId);
                    });

                    if (latestPostForUser) {
                        setLatestPost(latestPostForUser);
                    } else {
                        setLatestPost(null);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch user's latest post via feed:", err);
        }
    };
    // 1. Initial Connection Setup and Context Tracking
    useEffect(() => {
        const initializationHandshake = async () => {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            };

            fetchResources();

            // Decode our own user id from the JWT so we can tell "my messages" (sender_id === me)
            // apart from the client's, since the Message model has no role flag of its own.
            let myId = null;
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    myId = payload.id || payload.userId || payload.user_id || null;
                    setCurrentUserId(myId);
                } catch (e) {
                    console.error("Failed to decode auth token:", e);
                }
            }

            try {
                let activeId = sessionId;

                // Fallback: If no explicit session ID was directed, scan active sessions
                if (!activeId) {
                    const trackingRes = await fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, { headers });
                    if (trackingRes.ok) {
                        const sessionsData = await trackingRes.json();
                        const firstActive = sessionsData.find(s => {
                            const status = (s.status || '').toLowerCase().trim();
                            return status === 'active' || status === 'ongoing' || status === 'accepted';
                        });
                        if (firstActive) {
                            activeId = firstActive.id || firstActive._id;
                            setSessionId(activeId);
                        }
                    }
                }

                if (activeId) {
                    // Fetch Specific Live Session Attributes
                    const metaRes = await fetch(API_ENDPOINTS.SESSIONS.GET_BY_ID(activeId), { headers });
                    if (metaRes.ok) {
                        const metaData = await metaRes.json();
                        setSessionMeta(metaData);

                        if (metaData.coach_notes) {
                            setPrivateNotes(metaData.coach_notes);
                            setLastSavedNote(metaData.coach_notes);
                        }

                        // PASS THE METADATA HERE to get the User ID dynamically from the DB
                        await fetchLatestUserPost(metaData);
                    }

                    // Initial load for messages
                    await fetchMessages(activeId, myId);
                }
            } catch (err) {
                console.error("Error setting up backend workspace sync:", err);
            } finally {
                setLoading(false);
            };
        };

        initializationHandshake();
    }, [sessionId]);

    // 2. Continuous Dynamic Message Synchronizer (Polling Pipeline)
    useEffect(() => {
        if (!sessionId) return;

        const syncInterval = setInterval(() => {
            fetchMessages(sessionId);
        }, 8000); // Reduced frequency now that the socket handles instant delivery

        return () => clearInterval(syncInterval);
    }, [sessionId]);

    // 2b. Real-time Socket.io Connection
    useEffect(() => {
        if (!sessionId) return;

        const token = localStorage.getItem('token');
        const socket = socketIOClient(SOCKET_URL, {
            auth: { token },
            extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
            transports: ['polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_session', { sessionId });
        });

        const handleIncomingMessage = (msg) => {
            if (msg.session_id && msg.session_id !== sessionId) return;

            const myId = currentUserIdRef.current;
            const isMine = myId != null && msg.sender_id === myId;
            const incoming = {
                id: msg.id,
                sender: isMine ? 'coach' : 'user',
                text: msg.content || '',
                time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
            };

            setMessages(prev => {
                if (incoming.id && prev.some(m => m.id === incoming.id)) return prev;
                return [...prev, incoming];
            });
        };

        socket.on('receive_message', handleIncomingMessage);

        return () => {
            socket.off('receive_message', handleIncomingMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId]);

    useEffect(() => {
        if (messages.length === 0) return;
        const latestId = messages[messages.length - 1].id;

        if (latestId === lastMessageIdRef.current) return; // nothing new, skip
        const isFirstLoad = lastMessageIdRef.current === null;
        lastMessageIdRef.current = latestId;

        const container = messagesContainerRef.current;
        const nearBottom = container
            ? container.scrollHeight - container.scrollTop - container.clientHeight < 150
            : true;

        if (isFirstLoad || nearBottom) {
            scrollToBottom();
        }
    }, [messages]);

    const fetchMessages = async (targetSessionId, myIdOverride) => {
        if (!targetSessionId) return;
        const myId = myIdOverride !== undefined ? myIdOverride : currentUserIdRef.current;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.MESSAGES.GET_BY_SESSION(targetSessionId), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (res.ok) {
                const incomingData = await res.json();
                const alignedMessages = incomingData.map(msg => {
                    const isMine = myId != null && msg.sender_id === myId;
                    return {
                        id: msg.id,
                        sender: isMine ? 'coach' : 'user',
                        text: msg.content || '',
                        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                    };
                });
                setMessages(alignedMessages);
            }
        } catch (error) {
            console.error("Failed sync of message history packet:", error);
        }
    };

    const handleSend = async () => {
        if (!chatInput.trim() || !sessionId) return;

        const textToSend = chatInput;
        setChatInput('');

        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            sender: 'coach',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.MESSAGES.SEND, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    content: textToSend,
                    message_type: 'text'
                })
            });

            if (res.ok) {
                const savedMessage = await res.json();
                setMessages(prev => prev.map(m => m.id === tempId ? {
                    id: savedMessage.id,
                    sender: 'coach',
                    text: savedMessage.content || textToSend,
                    time: savedMessage.created_at
                        ? new Date(savedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : m.time
                } : m));
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setChatInput(textToSend);
                console.error("Server rejected chat payload dispatch.");
            }
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setChatInput(textToSend);
            console.error("Disconnection encountered during dispatch transmission:", error);
        }
    };

    // Explicit Trigger Action to submit notes to backend database
    const handleSavePrivateNotes = async () => {
        if (!sessionId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.SESSIONS.SUBMIT_NOTES(sessionId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ coach_notes: privateNotes })
            });
            if (res.ok) {
                setLastSavedNote(privateNotes);
                alert("Notes saved successfully!");
            }
        } catch (error) {
            console.error("Failed to commit notes structure updates:", error);
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) return;
        if (!window.confirm("Are you sure you want to finalize and close this active support session?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.SESSIONS.UPDATE_STATUS(sessionId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                navigate('/coach-dashboard');
            }
        } catch (error) {
            console.error("Critical error modifying session state transition:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getResolvedUserName = () => {
        if (!sessionMeta) return "User #8291";
        return sessionMeta.clientName || sessionMeta.userName || sessionMeta.username || `User #${String(sessionId).slice(-4)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
                <p className="font-body-lg text-body-lg animate-pulse">Establishing workspace backend synchronization link...</p>
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background font-body-md min-h-screen flex overflow-hidden">
            <Navbar />
            {/* SideNavBar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container flex-col py-4 space-y-2 shadow-md shadow-primary/5 z-50">
                <div className="px-6 mb-8">
                    <h1 className="font-headline-md text-headline-md text-secondary">Coach Workspace</h1>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Managing active connections</p>
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
                    <button onClick={() => navigate('/coach-dashboard')} className="w-full bg-primary text-on-primary py-3 rounded-full font-bold active:scale-95 transition-transform flex justify-center items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined">add_circle</span>
                        Start Session
                    </button>
                    <div className="pt-4 space-y-1 border-t border-outline-variant/20">
                        <button onClick={() => navigate('/help-center')} className="w-full flex items-center gap-3 py-2 px-4 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[20px]">help</span>
                            <span className="font-label-sm">Help Center</span>
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 py-2 px-4 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all cursor-pointer">
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
                        <h2 className="font-headline-md text-headline-md text-secondary mb-1">{getResolvedUserName()}</h2>
                        <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[12px] font-bold uppercase tracking-wider mb-6">
                            Focus: {sessionMeta?.focusArea || "Mindfulness Support"}
                        </span>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest mb-4">Recent Emotion History</h3>
                                <div className="space-y-3">
                                    {/* Card 1: Shows Emotion of Latest Post */}
                                    <div className="flex items-center gap-3 p-3 glass-card rounded-2xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
                                            <span className="material-symbols-outlined">sentiment_very_dissatisfied</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm">
                                                    {latestPost?.emotion || latestPost?.sentiment || "High Stress"}
                                                </p>
                                                <span className="text-[11px] text-on-surface-variant">Emotion</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Card 2: Shows Intensity of Latest Post */}
                                    <div className="flex items-center gap-3 p-3 glass-card rounded-2xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                                            <span className="material-symbols-outlined">waves</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm">
                                                    Intensity: {latestPost?.intensity || latestPost?.score || "80%"}
                                                </p>
                                                <span className="text-[11px] text-on-surface-variant">Level</span>
                                            </div>
                                            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1">
                                                <div
                                                    className="bg-tertiary h-full rounded-full"
                                                    style={{ width: `${sessionMeta?.latestPostIntensity || 80}%` }}
                                                ></div>
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
                            <span className="font-bold text-on-surface text-sm md:text-base">
                                {sessionId ? "Active Handshake Connected" : "Awaiting Client Session Assignment"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="px-3 md:px-4 py-2 rounded-full text-error font-semibold hover:bg-error/10 transition-colors text-xs md:text-sm flex items-center gap-1 md:gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">emergency_home</span>
                                <span className="hidden sm:inline">Escalate to Admin</span>
                            </button>
                            <button onClick={handleEndSession} className="px-3 md:px-4 py-2 rounded-full bg-error text-on-error font-semibold hover:opacity-90 transition-opacity text-xs md:text-sm flex items-center gap-1 md:gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                                <span className="hidden sm:inline">End Session</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col w-full">
                        <div className="flex flex-col items-center mb-8 shrink-0 w-full">
                            <span className="px-4 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">Today</span>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-center text-on-surface-variant py-12 font-body-md italic w-full">
                                No session transmissions found. Type a message down below to break the ice.
                            </div>
                        ) : (
                            messages.map((m) => (
                                m.sender === 'user' ? (
                                    <div key={m.id} className="flex items-start gap-3 max-w-[90%] md:max-w-[80%] self-start mr-auto text-left">
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
                                            <span className="text-[11px] text-on-surface-variant mt-1 ml-1 block">{m.time}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={m.id} className="flex items-start gap-3 flex-row-reverse max-w-[90%] md:max-w-[80%] self-end ml-auto text-right">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-on-primary">psychology</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div
                                                className="p-4 shadow-md text-left bg-primary text-on-primary"
                                                style={{ borderRadius: '1.5rem 1.5rem 0.25rem 1.5rem' }}
                                            >
                                                <p>{m.text}</p>
                                            </div>
                                            <span className="text-[11px] text-on-surface-variant mt-1 mr-1 block">{m.time}</span>
                                        </div>
                                    </div>
                                )
                            ))
                        )}

                        <div ref={messagesEndRef} />
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
                                disabled={!sessionId}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl py-4 pl-6 pr-24 md:pr-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none font-body-md disabled:opacity-50"
                                placeholder={sessionId ? `Message ${getResolvedUserName()}...` : "Select an active session from the dashboard to chat..."}
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
                                    disabled={!sessionId}
                                    className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 px-2">
                            <p className="text-[11px] text-on-surface-variant italic">Press Cmd+Enter or Ctrl+Enter to send. Chat is end-to-end encrypted.</p>
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
                                {dbResources.length > 0 ? (
                                    dbResources.map((resource, idx) => (
                                        <button key={resource._id || resource.id || idx} className="w-full flex items-center gap-3 p-3 glass-card rounded-2xl hover:border-primary/40 transition-all text-left cursor-pointer">
                                            <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
                                                <span className="material-symbols-outlined">
                                                    {resource.type?.toLowerCase().includes('audio') ? 'mindfulness' : 'description'}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{resource.title}</p>
                                                <p className="text-[10px] text-on-surface-variant">{resource.type || 'Resource'} • {resource.duration || '5 mins'}</p>
                                            </div>
                                            <span className="material-symbols-outlined ml-auto text-primary shrink-0">chevron_right</span>
                                        </button>
                                    ))
                                ) : (
                                    <>
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
                                    </>
                                )}
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
                                <div className="flex-1 glass-card p-4 rounded-2xl relative flex flex-col justify-between">
                                    <textarea
                                        value={privateNotes}
                                        onChange={(e) => setPrivateNotes(e.target.value)}
                                        disabled={!sessionId}
                                        className="w-full flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-md text-sm placeholder:italic outline-none disabled:opacity-50"
                                        placeholder="Add confidential notes for this session..."
                                    ></textarea>
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={handleSavePrivateNotes}
                                            disabled={!sessionId}
                                            className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {lastSavedNote ? 'Update Note' : 'Add Note'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                    <h4 className="text-[10px] font-bold text-primary uppercase mb-2">Previous Insight</h4>
                                    <p className="text-xs leading-relaxed text-on-surface italic">
                                        {lastSavedNote ? `"${lastSavedNote}"` : `"No insights saved yet. Type a note above and press Add Note."`}
                                    </p>
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
                                    <p className="text-xs font-bold">Workspace Monitor</p>
                                    <p className="text-[10px] text-on-surface-variant">Synced with API</p>
                                </div>
                                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">verified_user</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
