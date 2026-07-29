// src/pages/SessionHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { API_ENDPOINTS } from '../../config/api';

export default function SessionHistory() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    
    // Auth & User details
    const token = localStorage.getItem('token');
    
    // Check role safely (handles 'coach', 'COACH', or checking stored user object)
    const storedRole = (localStorage.getItem('role') || '').toLowerCase();
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isCoach = storedRole === 'coach' || storedUser?.role?.toLowerCase() === 'coach';

    // Modals state
    const [selectedPendingSession, setSelectedPendingSession] = useState(null);
    const [schedulingSession, setSchedulingSession] = useState(null);
    const [scheduledDateTime, setScheduledDateTime] = useState('');

    const fetchSessions = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.SESSIONS.GET_LISTING, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setSessions(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load session history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchSessions();
    }, [token, navigate]);

    // Filter sessions based on tab
    const filteredSessions = sessions.filter(s => {
        const status = (s.status || '').toLowerCase().trim();
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return status === 'active';
        if (activeTab === 'scheduled') return status === 'scheduled';
        if (activeTab === 'pending') return status === 'pending';
        if (activeTab === 'completed') return status === 'completed' || status === 'declined';
        return true;
    });

    const getSessionDisplayName = (session) => {
        if (session.coach?.user?.display_name_pool?.[0]) {
            return session.coach.user.display_name_pool[0];
        }
        if (session.user?.display_name_pool?.[0]) {
            return session.user.display_name_pool[0];
        }
        return "Support Session";
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active Live</span>;
            case 'scheduled':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Scheduled</span>;
            case 'pending':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">Pending Request</span>;
            case 'completed':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">Completed</span>;
            case 'declined':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20">Declined</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">{status}</span>;
        }
    };

    const updateSessionStatus = async (sessionId, newStatus, payload = {}, e) => {
        if (e) e.stopPropagation();
        
        try {
            const res = await fetch(API_ENDPOINTS.SESSIONS.UPDATE_STATUS(sessionId), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ status: newStatus, ...payload })
            });

            if (res.ok) {
                if (selectedPendingSession) setSelectedPendingSession(null);
                if (schedulingSession) setSchedulingSession(null);
                fetchSessions();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || err.message || 'Failed to update session status'}`);
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // USER DELETE ACTION
    const handleDeleteSession = async (sessionId, e) => {
        if (e) e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this pending session request?")) {
            return;
        }

        try {
            const deleteEndpoint = API_ENDPOINTS.SESSIONS.DELETE 
                ? API_ENDPOINTS.SESSIONS.DELETE(sessionId) 
                : `${API_ENDPOINTS.SESSIONS.GET_LISTING}/${sessionId}`;

            const res = await fetch(deleteEndpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            if (res.ok) {
                if (selectedPendingSession) setSelectedPendingSession(null);
                fetchSessions();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || err.message || 'Failed to delete session request'}`);
            }
        } catch (err) {
            console.error("Failed to delete request:", err);
        }
    };

    const openScheduleModal = (session, e) => {
        if (e) e.stopPropagation();
        setSchedulingSession(session);
        setSelectedPendingSession(null);
        
        if (session.scheduled_at) {
            const formattedDate = new Date(session.scheduled_at).toISOString().slice(0, 16);
            setScheduledDateTime(formattedDate);
        } else {
            setScheduledDateTime('');
        }
    };

    const handleConfirmSchedule = async (e) => {
        e.preventDefault();
        if (!scheduledDateTime) {
            alert("Please select a valid date and time.");
            return;
        }

        const isReschedule = schedulingSession.status === 'scheduled';
        const formattedISO = new Date(scheduledDateTime).toISOString();
        const sessionId = schedulingSession.id || schedulingSession._id;

        if (isReschedule) {
            try {
                const res = await fetch(API_ENDPOINTS.SESSIONS.RESCHEDULE(sessionId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ scheduled_at: formattedISO })
                });

                if (res.ok) {
                    setSchedulingSession(null);
                    fetchSessions();
                } else {
                    const err = await res.json();
                    alert(`Error: ${err.error || err.message || 'Failed to reschedule session'}`);
                }
            } catch (err) {
                console.error("Reschedule call failed:", err);
            }
        } else {
            updateSessionStatus(sessionId, 'scheduled', { scheduled_at: formattedISO });
        }
    };

    const handleSessionClick = (session) => {
        const status = (session.status || '').toLowerCase();
        
        if (status === 'pending') {
            setSelectedPendingSession(session);
            return;
        }

        const sessionId = session.id || session._id;
        navigate('/chat', { state: { sessionId } });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="animate-pulse text-on-surface-variant font-bold">Loading Session Records...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-body-md text-on-surface relative">
            <Navbar />
            <main className="pt-28 px-6 md:px-12 pb-24 max-w-[1440px] mx-auto w-full flex-1">
                
                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-outline-variant/20 pb-4 mb-6 overflow-x-auto">
                    {['all', 'active', 'scheduled', 'pending', 'completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                                activeTab === tab
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Session Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => {
                            const sessionId = session.id || session._id;
                            const name = getSessionDisplayName(session);
                            const status = (session.status || '').toLowerCase();
                            const dateStr = session.scheduled_at 
                                ? new Date(session.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                : new Date(session.created_at || Date.now()).toLocaleDateString();

                            return (
                                <div
                                    key={sessionId}
                                    onClick={() => handleSessionClick(session)}
                                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group relative"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">{name}</h3>
                                                <p className="text-xs text-on-surface-variant">{dateStr}</p>
                                            </div>
                                            {getStatusBadge(session.status)}
                                        </div>

                                        <p className="text-sm text-on-surface-variant line-clamp-2 italic mb-4 bg-surface-container-low p-3 rounded-xl">
                                            "{session.context_message || session.context_notes || 'No additional context notes provided.'}"
                                        </p>
                                    </div>

                                    {/* PENDING ACTIONS SEPARATION */}
                                    {status === 'pending' ? (
                                        <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">hourglass_top</span> Pending
                                            </span>
                                            
                                            {/* IF COACH: Accept & Schedule + Decline */}
                                            {isCoach ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => updateSessionStatus(sessionId, 'declined', {}, e)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-error bg-error-container/40 hover:bg-error hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={(e) => openScheduleModal(session, e)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">calendar_month</span> Accept & Schedule
                                                    </button>
                                                </div>
                                            ) : (
                                                /* IF USER: Delete Option */
                                                <button
                                                    onClick={(e) => handleDeleteSession(sessionId, e)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-error bg-error-container/40 hover:bg-error hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                                                </button>
                                            )}
                                        </div>
                                    ) : status === 'scheduled' ? (
                                        <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                            {/* SCHEDULED ACTIONS VISIBLE ONLY TO COACH */}
                                            {isCoach ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => updateSessionStatus(sessionId, 'active', {}, e)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">play_arrow</span> Start Session
                                                    </button>
                                                    <button
                                                        onClick={(e) => openScheduleModal(session, e)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary-container hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">edit_calendar</span> Reschedule
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-semibold text-on-surface-variant">
                                                    Awaiting session start
                                                </span>
                                            )}

                                            <div 
                                                onClick={() => handleSessionClick(session)}
                                                className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                                            >
                                                View Chat <span className="material-symbols-outlined text-sm">lock</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end text-xs font-bold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                                            Open Chat Room <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">history_toggle_off</span>
                            <p>No sessions found matching this filter.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Schedule / Reschedule Modal Card */}
            {schedulingSession && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 min-h-screen w-screen top-0 left-0">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-[400px] max-w-[90vw] border border-outline-variant/20 shadow-2xl block shrink-0">
                        <form onSubmit={handleConfirmSchedule} className="flex flex-col gap-6 w-full">
                            <div className="flex justify-between items-start w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined">
                                            {schedulingSession.status === 'scheduled' ? 'edit_calendar' : 'calendar_today'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-on-surface">
                                            {schedulingSession.status === 'scheduled' ? 'Reschedule Session' : 'Schedule Session'}
                                        </h3>
                                        <p className="text-xs text-on-surface-variant">With {getSessionDisplayName(schedulingSession)}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSchedulingSession(null)}
                                    className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                                    Select Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={scheduledDateTime}
                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                    className="w-full p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-sm focus:outline-none focus:border-primary text-on-surface"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 w-full">
                                <button
                                    type="button"
                                    onClick={() => setSchedulingSession(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity shadow-md flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    {schedulingSession.status === 'scheduled' ? 'Update Schedule' : 'Confirm Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Details Modal Card */}
            {selectedPendingSession && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 min-h-screen w-screen top-0 left-0">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-[480px] max-w-[90vw] border border-outline-variant/20 shadow-2xl flex flex-col gap-6 shrink-0">
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
                                    Pending Approval
                                </span>
                                <h3 className="text-xl font-bold mt-2 text-on-surface">Request from {getSessionDisplayName(selectedPendingSession)}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedPendingSession(null)}
                                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col gap-2 w-full">
                            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Context & Notes</h4>
                            <p className="text-sm italic text-on-surface">
                                "{selectedPendingSession.context_message || selectedPendingSession.context_notes || 'No notes provided.'}"
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10 w-full">
                            {isCoach ? (
                                <>
                                    <button
                                        onClick={(e) => updateSessionStatus(selectedPendingSession.id || selectedPendingSession._id, 'declined', {}, e)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-error bg-error-container/40 hover:bg-error hover:text-white transition-colors cursor-pointer"
                                    >
                                        Decline Request
                                    </button>
                                    <button
                                        onClick={(e) => openScheduleModal(selectedPendingSession, e)}
                                        className="px-5 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                                    >
                                        Accept & Schedule
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={(e) => handleDeleteSession(selectedPendingSession.id || selectedPendingSession._id, e)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-error bg-error-container/40 hover:bg-error hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}