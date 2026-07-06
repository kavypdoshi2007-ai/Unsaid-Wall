import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_ENDPOINTS } from '../../config/api'; // Adjust the import path based on your folder structure

export default function MySessions() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Sessions Collection and Tracking Matrix
    const [sessionsList, setSessionsList] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeSession, setActiveSession] = useState(null);

    const [coachProfile, setCoachProfile] = useState({
        name: "Dr. Sarah Jenkins",
        role: "PhD, Clinical Psychology • 8+ Yrs Exp",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256"
    });

    const socketRef = useRef(null);
    const endOfMessagesRef = useRef(null);
    const token = localStorage.getItem('token');

    

    // 1. DISCOVER ACTIVE USER SESSIONS ON ENGINE BOOT
    useEffect(() => {
        if (!token) {
            console.warn("User authentication credentials missing.");
            return;
        }

        // Fetch user's current session listing arrays from database tracking endpoints
        fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const sessions = Array.isArray(data) ? data : (data.sessions || []);
                setSessionsList(sessions);

                if (sessions.length > 0) {
                    // CRITICAL FIX: Prioritize an active or approved session to prevent sending messages to a closed/pending timeline
                    const openSession = sessions.find(s => s.status === 'active' || s.status === 'approved');

                    if (openSession) {
                        const targetSessionId = openSession.id || openSession.session_id;
                        setActiveSessionId(targetSessionId);
                        setActiveSession(openSession);

                        // Populate coach profile identity frames dynamically
                        if (openSession.coach) {
                            setCoachProfile({
                                name: openSession.coach.user?.display_name || openSession.coach.name || "Dr. Sarah Jenkins",
                                role: openSession.coach.specialty || "PhD, Clinical Psychology • 8+ Yrs Exp",
                                avatar: openSession.coach.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256"
                            });
                        }
                    } else {
                        // Reset if no actively open session timeline exists
                        setActiveSessionId(null);
                        setActiveSession(null);
                    }
                }
            })
            .catch((err) => console.error("Could not fetch user session listings:", err));
    }, [token]);

    // 2. WEBSOCKET PIPELINE & REAL-TIME EVENT HOOKS SETUP
    useEffect(() => {
        if (!token || !activeSessionId) return;

        // Establish connection matching the backend root parameters
        socketRef.current = io('https://diminish-waving-shore.ngrok-free.dev', { 
            transports: ['websocket'],
            auth: { token } 
        });

        // Notify server rooms about connection channel assignment
        socketRef.current.emit('join_session', { sessionId: activeSessionId });

        // Listen for real-time incoming messaging updates
        socketRef.current.on('receive_message', (msg) => {
            console.log("Real-time message received:", msg);
            setMessages((prev) => [...prev, msg]);
        });

        // Listen for session completion status broadcasts
        socketRef.current.on('session_ended', () => {
            alert("The support session timeline has wrapped up.");
            navigate('/user-wall');
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
    }, [token, activeSessionId, navigate]);

    // 3. FETCH CONVERSATION CHRONOLOGY FOR SELECTIVE CHANNEL ID
    useEffect(() => {
        if (!token || !activeSessionId) return;

        fetch(API_ENDPOINTS.MESSAGES.GET_BY_SESSION(activeSessionId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' // FIXED: Bypasses ngrok CORS filters
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMessages(data);
                }
            })
            .catch((err) => console.error("Could not load conversational history segments:", err));
    }, [token, activeSessionId]);

    // 4. SCROLL ANCHOR MANAGEMENT ENGINE
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5. OUTBOUND FORM DISPATCH SUBMIT TERMINAL
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !token || !activeSessionId) return;

        const currentMsg = input.trim();
        setInput('');

        try {
            const response = await fetch(API_ENDPOINTS.MESSAGES.SEND, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // FIXED: Bypasses ngrok CORS filters
                },
                body: JSON.stringify({
                    session_id: activeSessionId,
                    content: currentMsg
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Message rejected by core routing tiers:", errData.error);
            }
        } catch (err) {
            console.error("Communication failure dispatching data streams:", err);
        }
    };

    // 6. TERMINATE ACTIVE SESSION HANDLER
    const handleEndSession = async () => {
        if (!window.confirm("Are you sure you want to end this secure session? This will finalize the record.")) return;

        try {
            const response = await fetch(API_ENDPOINTS.SESSIONS.UPDATE_STATUS(activeSessionId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // FIXED: Prevents ngrok warning layout from dropping PATCH preflights
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (response.ok) {
                navigate('/user-wall');
            } else {
                const err = await response.json();
                alert(`Failed to close tracking timeline logs: ${err.error || 'Unknown Error'}`);
            }
        } catch (err) {
            console.error("Server connection abort encountered:", err);
        }
    };

    // Extract Sender ID payload metrics from token vectors
    let myUserId = null;
    if (token) {
        try {
            const parsedToken = JSON.parse(atob(token.split('.')[1]));
            myUserId = parsedToken.id || parsedToken.userId || parsedToken.user_id;
        } catch (e) {
            console.error("JWT tracking format evaluation failed:", e);
        }
    }

    return (
        <div className="font-body-md text-on-surface bg-background h-screen flex flex-col overflow-hidden">

            {/* CLEANED HEADER */}
            <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-7xl mx-auto">
                    <div onClick={() => navigate('/user-wall')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                        <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Unsaid Wall</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/user-wall')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Wall</button>
                        <button onClick={() => navigate('/emotion-journal')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Journal</button>
                        <button onClick={() => navigate('/coach-profile')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Coaches</button>
                        <button onClick={() => navigate('/my-sessions')} className="font-label-sm font-semibold text-primary bg-primary-container/20 px-4 py-2 rounded-full cursor-pointer">Sessions</button>
                        <button onClick={() => navigate('/resources')} className="font-label-sm font-semibold text-outline hover:opacity-80 transition-opacity cursor-pointer">Resources</button>
                    </div>
                </div>
            </header>

            {/* CONTAINER CONTAINER */}
            <main className="flex-1 flex overflow-hidden pt-16">

                {/* Session List Sidebar */}
                <aside className="w-80 bg-surface-container-low border-r border-outline-variant/10 flex flex-col hidden md:flex">
                    <div className="p-6">
                        <h2 className="font-headline-md text-xl text-primary mb-4">My Sessions</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                        <div className="mt-2 mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60">Active Now</div>

                        {sessionsList.length === 0 ? (
                            <div className="text-xs text-outline italic px-2 pt-2">No session records found.</div>
                        ) : (
                            sessionsList.map((session, index) => {
                                const isCurrent = (session.id || session.session_id) === activeSessionId;
                                const cName = session.coach?.user?.display_name || session.coach?.name || "Assigned Coach";
                                const cAvatar = session.coach?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256";

                                return (
                                    <button
                                        key={session.id || index}
                                        onClick={() => {
                                            setActiveSessionId(session.id || session.session_id);
                                            setActiveSession(session);
                                        }}
                                        className={`w-full text-left p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer flex gap-3 ${isCurrent
                                            ? 'bg-secondary-container/40 border-secondary/20'
                                            : 'bg-white/40 border-transparent hover:bg-white/80'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img alt={cName} className="w-12 h-12 rounded-full object-cover" src={cAvatar} />
                                            {session.status === 'active' && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-surface-container-low rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm truncate">{cName}</span>
                                                <span className="text-[10px] text-secondary font-bold uppercase">{session.status}</span>
                                            </div>
                                            <p className="text-xs text-on-surface-variant truncate">
                                                {session.context_notes || "Private support session workspace"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Chat Interface Layout */}
                <section className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">
                    <header className="h-16 px-6 border-b border-outline-variant/10 flex items-center justify-between bg-white/40 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">verified_user</span>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">Secure Session with {coachProfile.name}</h3>
                                <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
                                    Encrypted & Private
                                </p>
                            </div>
                        </div>
                        {activeSessionId && (
                            <button onClick={handleEndSession} className="px-4 py-2 text-xs font-bold bg-error/10 text-error hover:bg-error hover:text-white rounded-full transition-all cursor-pointer">End Session</button>
                        )}
                    </header>

                    {/* Chat Feed Window Block */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-24 md:pb-8">
                        {!activeSessionId ? (
                            <div className="text-center text-xs text-on-surface-variant/55 pt-12">
                                Looking for verified session pathways... Request one from the Coaches panel if empty.
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-xs text-on-surface-variant/55 pt-8">
                                Secure communication pipeline opened. Share what's on your mind...
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.sender_id === myUserId || msg.sender === 'user';
                                const timestamp = msg.created_at
                                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : "Just now";

                                return (
                                    <div key={msg.id || idx} className={`flex gap-4 max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                        {isMe ? (
                                            <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex-shrink-0 flex items-center justify-center text-[10px] font-bold">ME</div>
                                        ) : (
                                            <img alt="Coach avatar" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" src={coachProfile.avatar} />
                                        )}
                                        <div className={`space-y-2 ${isMe ? 'text-right' : ''}`}>
                                            <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed text-left ${isMe
                                                ? 'bg-primary text-on-primary rounded-tr-none'
                                                : 'bg-white/60 backdrop-blur-xl border border-primary/10 rounded-tl-none'
                                                }`}>
                                                {msg.content || msg.text}
                                            </div>
                                            <span className="text-[10px] text-on-surface-variant mx-1">{timestamp}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Message Composition Area */}
                <form onSubmit={sendMessage} className="p-6 bg-white/40 backdrop-blur-xl border-t border-outline-variant/10 shrink-0 pb-[90px] md:pb-6">
                    <div className="flex items-center gap-3 bg-surface-container-lowest border border-primary/20 rounded-2xl p-2 pr-4 shadow-inner">
                        <input
                            // ✅ FIX: Disable input if session doesn't exist OR if it isn't explicitly active
                            disabled={!activeSessionId || activeSession?.status !== 'active'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-4 outline-none text-on-surface disabled:opacity-50"
                            placeholder={
                                !activeSessionId 
                                    ? "Waiting for channel verification options..." 
                                    : activeSession?.status !== 'active'
                                        ? `This session is ${activeSession?.status || 'closed'}.`
                                        : "Share what's on your mind..."
                            }
                        />
                        <button 
                            type="submit" 
                            // ✅ FIX: Disable the submit button matching the new guard logic
                            disabled={!activeSessionId || activeSession?.status !== 'active'} 
                            className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </form>
                </section>

                {/* Profile Meta Sidebar */}
                <aside className="w-80 border-l border-outline-variant/10 bg-surface-container-lowest p-6 hidden lg:block overflow-y-auto">
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 mb-6 text-center border border-primary/10">
                        <img alt={coachProfile.name} className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-secondary/10 mb-4" src={coachProfile.avatar} />
                        <h4 className="font-headline-md text-lg text-primary">{coachProfile.name}</h4>
                        <p className="text-xs text-on-surface-variant mb-4">{coachProfile.role}</p>
                    </div>
                    {activeSession?.context_notes && (
                        <div className="mt-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                            <h5 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Session Subject Context</h5>
                            <p className="text-xs italic text-on-surface">"{activeSession.context_notes}"</p>
                        </div>
                    )}
                </aside>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] rounded-t-xl">
                <button onClick={() => navigate('/user-wall')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_awesome</span>
                    <span className="font-label-sm text-[10px] font-semibold">Wall</span>
                </button>
                <button onClick={() => navigate('/emotion-journal')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">auto_stories</span>
                    <span className="font-label-sm text-[10px] font-semibold">Journal</span>
                </button>
                <button onClick={() => navigate('/coach-profile')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">psychology</span>
                    <span className="font-label-sm text-[10px] font-semibold">Coaches</span>
                </button>
                <button onClick={() => navigate('/my-sessions')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-5 py-1.5 cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">forum</span>
                    <span className="font-label-sm text-[10px] font-semibold">Sessions</span>
                </button>
                <button onClick={() => navigate('/resources')} className="flex flex-col items-center justify-center text-on-surface-variant px-2 py-1 hover:text-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined mb-1 text-xl">local_library</span>
                    <span className="font-label-sm text-[10px] font-semibold">Resources</span>
                </button>
            </div>

        </div>
    );
}