import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_ENDPOINTS } from '../../config/api';
import Navbar from '../../components/Navbar';

export default function MySessions() {
    const navigate = useNavigate();
    const location = useLocation();

    // Read activeSessionId directly from route state passed by SessionHistory or CoachDashboard
    const activeSessionId = location.state?.sessionId;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [activeSession, setActiveSession] = useState(null);

    const [coachProfile, setCoachProfile] = useState({
        name: "Support Specialist",
        role: "Professional Coach",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256"
    });

    const socketRef = useRef(null);
    const chatContainerRef = useRef(null);
    const token = localStorage.getItem('token');

    // 1. Fetch metadata for the selected session
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (!activeSessionId) {
            // Fallback if accessed directly without selecting a session
            navigate('/sessions');
            return;
        }

        fetch(API_ENDPOINTS.SESSIONS.GET_BY_ID(activeSessionId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setActiveSession(data);
                if (data.coach) {
                    setCoachProfile({
                        name: data.coach.user?.display_name_pool?.[0] || data.coach.name || "Assigned Coach",
                        role: data.coach.specialty || "Professional Coach",
                        avatar: data.coach.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256"
                    });
                }
            })
            .catch((err) => console.error("Could not fetch session details:", err));
    }, [token, activeSessionId, navigate]);

    // 2. Real-time Socket logic
    useEffect(() => {
        if (!token || !activeSessionId || activeSession?.status !== 'active') return;

        socketRef.current = io('https://diminish-waving-shore.ngrok-free.dev', {
            transports: ['websocket'],
            auth: { token }
        });

        socketRef.current.emit('join_session', { sessionId: activeSessionId });

        socketRef.current.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socketRef.current.on('session_ended', () => {
            alert("The support session has wrapped up.");
            navigate('/sessions');
        });

        socketRef.current.on('timer_warning', (data) => {
            const extend = window.confirm(`${data.message}`);
            if (extend) {
                socketRef.current.emit('extend_session_time', { sessionId: data.sessionId });
            }
        });

        socketRef.current.on('timer_extended', (data) => {
            alert("Success: " + data.message);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token, activeSessionId, activeSession, navigate]);

    // 3. Load historical messages
    useEffect(() => {
        if (!token || !activeSessionId) return;

        setMessages([]);

        fetch(API_ENDPOINTS.MESSAGES.GET_BY_SESSION(activeSessionId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMessages(data);
                }
            })
            .catch((err) => console.error("Could not load conversational history:", err));
    }, [token, activeSessionId]);

    // 4. Auto scroll
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // 5. Send Message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !token || !activeSessionId || activeSession?.status !== 'active') return;

        const currentMsg = input.trim();
        setInput('');

        try {
            const response = await fetch(API_ENDPOINTS.MESSAGES.SEND, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    session_id: activeSessionId,
                    content: currentMsg
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Message error:", errData.error);
            }
        } catch (err) {
            console.error("Communication failure:", err);
        }
    };

    // 6. Terminate session
    const handleEndSession = async () => {
        if (!window.confirm("Are you sure you want to end this session?")) return;

        try {
            const response = await fetch(API_ENDPOINTS.SESSIONS.UPDATE_STATUS(activeSessionId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (response.ok) {
                setActiveSession(prev => ({ ...prev, status: 'completed' }));
            } else {
                const err = await response.json();
                alert(`Failed to end session: ${err.error || 'Unknown Error'}`);
            }
        } catch (err) {
            console.error("Server connection error:", err);
        }
    };

    let myUserId = null;
    if (token) {
        try {
            const parsedToken = JSON.parse(atob(token.split('.')[1]));
            myUserId = parsedToken.id || parsedToken.userId || parsedToken.user_id;
        } catch (e) {
            console.error("JWT parse error:", e);
        }
    }

    const getPlaceholderText = () => {
        if (!activeSessionId) return "Select a session from history to begin.";
        if (activeSession?.status === 'scheduled') return "This session is scheduled for later. Chat is locked.";
        if (activeSession?.status === 'completed') return "This session is completed. Chat history is read-only.";
        return "Share what's on your mind...";
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-secondary text-white';
            case 'scheduled': return 'bg-primary-container text-on-primary-container';
            case 'completed': return 'bg-surface-variant text-on-surface-variant';
            default: return 'bg-outline text-white';
        }
    };

    return (
        <div className="font-body-md text-on-surface bg-background h-screen flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 flex overflow-hidden pt-16">
                {/* Chat Interface Layout */}
                <section className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">

                    {/* Top Bar */}
                    <header className="h-16 px-4 md:px-6 border-b border-outline-variant/10 flex items-center justify-between bg-white/40 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3">
                            {activeSessionId && (
                                <>
                                    <span className="material-symbols-outlined text-secondary hidden md:block">verified_user</span>
                                    <div>
                                        <h3 className="font-bold text-sm leading-tight">Session with {coachProfile.name}</h3>
                                        <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.status === 'active' ? 'bg-secondary animate-pulse' : 'bg-outline'}`}></span>
                                            {activeSession?.status === 'active' ? 'Live & Encrypted' : 'Encrypted Record'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {activeSession?.status === 'active' && (
                            <button
                                onClick={handleEndSession}
                                className="text-xs font-bold text-error bg-error-container/50 hover:bg-error hover:text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                                End Session
                            </button>
                        )}
                    </header>

                    {/* Chat Messages Container */}
                    <div className="flex-1 relative overflow-hidden">

                        {/* FIXED CENTERED SCHEDULED SESSION CARD OVERLAY */}
                        {activeSession?.status === 'scheduled' && (
                            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
                                <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-outline-variant/20 w-[90%] max-w-md min-w-[320px] shrink-0 mx-auto flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-primary-container/40 rounded-full flex items-center justify-center mb-4 shrink-0">
                                        <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_clock</span>
                                    </div>

                                    <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2 whitespace-nowrap">
                                        Session Scheduled
                                    </h3>

                                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6 px-2 min-w-[250px]">
                                        This room is securely locked until your scheduled session with <span className="font-bold text-primary whitespace-nowrap">{coachProfile.name}</span>.
                                    </p>

                                    {activeSession.scheduled_at && (
                                        <div className="inline-flex items-center justify-center bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full text-xs font-bold tracking-wide shadow-sm whitespace-nowrap shrink-0">
                                            {new Date(activeSession.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div ref={chatContainerRef} className="absolute inset-0 overflow-y-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">
                            {messages.length === 0 ? (
                                <div className="text-center text-xs text-on-surface-variant/55 pt-8">
                                    Secure communication pipeline opened.
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === myUserId || msg.sender === 'user';
                                    const timestamp = msg.created_at
                                        ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : "Just now";

                                    return (
                                        <div key={msg.id || idx} className={`flex gap-3 md:gap-4 max-w-[85%] md:max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                            {isMe ? (
                                                <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex-shrink-0 flex items-center justify-center text-[10px] font-bold">ME</div>
                                            ) : (
                                                <img alt="Coach avatar" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" src={coachProfile.avatar} />
                                            )}
                                            <div className={`space-y-1 md:space-y-2 ${isMe ? 'text-right' : ''}`}>
                                                <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm leading-relaxed text-left ${isMe
                                                    ? 'bg-primary text-on-primary rounded-tr-none'
                                                    : 'bg-white/60 backdrop-blur-xl border border-primary/10 rounded-tl-none'
                                                    }`}>
                                                    {msg.content || msg.text}
                                                </div>
                                                <span className="text-[10px] text-on-surface-variant mx-1 block">{timestamp}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Input Box */}
                    <form onSubmit={sendMessage} className="p-4 md:p-6 bg-white/40 backdrop-blur-xl border-t border-outline-variant/10 shrink-0 pb-[90px] md:pb-6 relative z-30">
                        <div className={`flex items-center gap-3 bg-surface-container-lowest border rounded-2xl p-2 pr-4 shadow-inner transition-colors ${activeSession?.status === 'active' ? 'border-primary/30' : 'border-outline-variant/20 bg-surface-variant/20'}`}>
                            <input
                                disabled={!activeSessionId || activeSession?.status !== 'active'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 md:px-4 outline-none text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={getPlaceholderText()}
                            />
                            <button
                                type="submit"
                                disabled={!activeSessionId || activeSession?.status !== 'active'}
                                className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </form>
                </section>

                {/* Right Metadata Sidebar */}
                <aside className="w-80 border-l border-outline-variant/10 bg-surface-container-lowest p-6 hidden lg:block overflow-y-auto">
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 mb-6 text-center border border-primary/10">
                        <img alt={coachProfile.name} className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-secondary/10 mb-4" src={coachProfile.avatar} />
                        <h4 className="font-headline-md text-lg text-primary">{coachProfile.name}</h4>
                        <p className="text-xs text-on-surface-variant mb-4">{coachProfile.role}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                            <h5 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Session Status</h5>
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full inline-block ${getStatusStyles(activeSession?.status)}`}>
                                {activeSession?.status || 'Unknown'}
                            </span>
                        </div>

                        {(activeSession?.context_message || activeSession?.context_notes) && (
                            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                                <h5 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Subject Context</h5>
                                <p className="text-xs italic text-on-surface leading-relaxed">"{activeSession.context_message || activeSession.context_notes}"</p>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}