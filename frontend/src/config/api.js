// src/config/api.js

// Central base URL for your backend server
export const BACKEND_URL = 'https://diminish-waving-shore.ngrok-free.dev/api';

export const API_ENDPOINTS = {
    // 1. User Authentication & Profile Paths
    USERS: {
        REGISTER: `${BACKEND_URL}/users/register`,
        LOGIN: `${BACKEND_URL}/users/login`,
        ME: `${BACKEND_URL}/users/me`,
        BAN: (userId) => `${BACKEND_URL}/users/${userId}/ban`,
    },

    // 2. Expression Posts (Wall Timeline)
    POSTS: {
        GET_FEED: `${BACKEND_URL}/posts`, // Accessible by guest, user, coach, admin
        GET_MOD_QUEUE: `${BACKEND_URL}/posts/moderation-queue`,
        PREVIEW_USERNAME: `${BACKEND_URL}/posts/username`, // Get dynamic name on-the-fly
        CREATE: `${BACKEND_URL}/posts`,
        MODERATE: (postId) => `${BACKEND_URL}/posts/${postId}/moderate`, // Admin: PATCH is_flagged/flag_level/is_hidden
        ADD_COMMENT: (postId) => `${BACKEND_URL}/posts/${postId}/comments` // For coaches only
    },

    // 3. Post Reactions
    REACTIONS: {
        TOGGLE: `${BACKEND_URL}/reactions/toggle`,
        GET_BY_POST: (postId) => `${BACKEND_URL}/reactions/post/${postId}`
    },

    // 4. Coach Profiles & Interactive Requests
    COACHES: {
        GET_ALL: `${BACKEND_URL}/coaches`,
        GET_BY_ID: (id) => `${BACKEND_URL}/coaches/${id}`,
        CREATE_PROFILE: `${BACKEND_URL}/coaches`,
        GET_MY_PROFILE: `${BACKEND_URL}/coaches/me`,
        REQUEST_SESSION: `${BACKEND_URL}/coaches/request-session`
    },

    // 5. Live Support Help Sessions
    SESSIONS: {
        CREATE: `${BACKEND_URL}/sessions`, // Users opening a queue request
        UPDATE_STATUS: (sessionId) => `${BACKEND_URL}/sessions/${sessionId}/status`, // Coached accepting/declining
        GET_LISTING: `${BACKEND_URL}/sessions`, // View matching active logs
        GET_BY_ID: (sessionId) => `${BACKEND_URL}/sessions/${sessionId}`,
        SUBMIT_RATING: (sessionId) => `${BACKEND_URL}/sessions/${sessionId}/rate`, // User star reviews
        SUBMIT_NOTES: (sessionId) => `${BACKEND_URL}/sessions/${sessionId}/review-notes` // Coach case files
    },

    // 6. Direct Private Chat Messaging Data
    MESSAGES: {
        SEND: `${BACKEND_URL}/messages`,
        GET_BY_SESSION: (sessionId) => `${BACKEND_URL}/messages/session/${sessionId}`
    },

    // 7. Self-Care Personal Emotional Journals
    JOURNAL: {
        CREATE: (userId) => `${BACKEND_URL}/journal/user/${userId}`,
        GET_USER_JOURNAL: (userId) => `${BACKEND_URL}/journal/user/${userId}`,
        DELETE_ENTRY: (entryId) => `${BACKEND_URL}/journal/${entryId}`
    },

    // 8. General Community Announcements
    ANNOUNCEMENTS: {
        CREATE: `${BACKEND_URL}/announcements`,
        GET_ACTIVE: `${BACKEND_URL}/announcements`,
        DELETE: (announcementId) => `${BACKEND_URL}/announcements/${announcementId}`
    },

    // 9. Educational Resource Library
    RESOURCES: {
        GET_ALL: `${BACKEND_URL}/resource`, // Supports ?category= & search= query params
        CREATE: `${BACKEND_URL}/resource`
    }
};