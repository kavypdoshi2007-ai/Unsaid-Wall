// src/config/api.js

// Central base URL for your backend server
export const BACKEND_URL = 'https://diminish-waving-shore.ngrok-free.dev';

export const API_ENDPOINTS = {
    // 1. User Authentication & Profile Paths
    USERS: {
        REGISTER: `${BACKEND_URL}/api/users/register`,
        LOGIN: `${BACKEND_URL}/api/users/login`,
        ME: `${BACKEND_URL}/api/users/me`,
        BAN: (userId) => `${BACKEND_URL}/api/users/${userId}/ban`,
    },

    // 2. Expression Posts (Wall Timeline)
    POSTS: {
        GET_FEED: `${BACKEND_URL}/api/posts`, // Accessible by guest, user, coach, admin
        GET_ALL_ADMIN: `${BACKEND_URL}/api/posts/admin/all`,
        GET_MOD_QUEUE: `${BACKEND_URL}/api/posts/moderation-queue`,
        PREVIEW_USERNAME: `${BACKEND_URL}/api/posts/username`, // Get dynamic name on-the-fly
        CREATE: `${BACKEND_URL}/api/posts`,
        MODERATE: (postId) => `${BACKEND_URL}/api/posts/${postId}/moderate`, // Admin: PATCH is_flagged/flag_level/is_hidden
        ADD_COMMENT: (postId) => `${BACKEND_URL}/posts/${postId}/comments` // For coaches only
    },

    // 3. Post Reactions
    REACTIONS: {
        TOGGLE: `${BACKEND_URL}/api/reactions/toggle`,
        GET_BY_POST: (postId) => `${BACKEND_URL}/api/reactions/post/${postId}`
    },

    // 4. Coach Profiles & Interactive Requests
    COACHES: {
        GET_ALL: `${BACKEND_URL}/api/coaches`,
        GET_BY_ID: (id) => `${BACKEND_URL}/api/coaches/${id}`,
        CREATE_PROFILE: `${BACKEND_URL}/api/coaches`,
        GET_MY_PROFILE: `${BACKEND_URL}/api/coaches/me`,
        REQUEST_SESSION: `${BACKEND_URL}/api/coaches/request-session`
    },

    // 5. Live Support Help Sessions
    SESSIONS: {
        CREATE: `${BACKEND_URL}/api/sessions`, // Users opening a queue request
        UPDATE_STATUS: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}/status`, // Coached accepting/declining
        GET_LISTING: `${BACKEND_URL}/api/sessions`, // View matching active logs
        GET_BY_ID: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}`,
        RESCHEDULE: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}/reschedule`,
        SUBMIT_RATING: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}/rate`, // User star reviews
        SUBMIT_NOTES: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}/review-notes`, // Coach case files
        DELETE: (sessionId) => `${BACKEND_URL}/api/sessions/${sessionId}`,
    },

    // 6. Direct Private Chat Messaging Data
    MESSAGES: {
        SEND: `${BACKEND_URL}/api/messages`,
        GET_BY_SESSION: (sessionId) => `${BACKEND_URL}/api/messages/session/${sessionId}`
    },

    // 7. Self-Care Personal Emotional Journals
    JOURNAL: {
        CREATE: (userId) => `${BACKEND_URL}/api/journal/user/${userId}`,
        GET_USER_JOURNAL: (userId) => `${BACKEND_URL}/api/journal/user/${userId}`,
        DELETE_ENTRY: (entryId) => `${BACKEND_URL}/api/journal/${entryId}`
    },

    // 8. General Community Announcements
    ANNOUNCEMENTS: {
        CREATE: `${BACKEND_URL}/api/announcements`,
        GET_ACTIVE: `${BACKEND_URL}/api/announcements`,
        DELETE: (announcementId) => `${BACKEND_URL}/api/announcements/${announcementId}`
    },

    // 9. Educational Resource Library
    RESOURCES: {
        GET_ALL: `${BACKEND_URL}/api/resource`, // Supports ?category= & search= query params
        CREATE: `${BACKEND_URL}/api/resource`
    }
};