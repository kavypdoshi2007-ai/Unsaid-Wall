// src/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const sessionController = require('../controllers/sessionController');

// 1. Only standard 'user' entities can initiate/create a session request
router.post(
    '/', 
    authMiddleware, 
    authorize(['user']), 
    sessionController.createSession
);

// 2. Only a 'coach' can change a session status (pending -> active / declined)
router.patch(
    '/:id/status', 
    authMiddleware, 
    authorize(['coach']), 
    sessionController.updateStatus
);

// 3. Users, Coaches, and Admins can view their relevant session listings
router.get(
    '/', 
    authMiddleware, 
    authorize(['user', 'coach', 'admin']), 
    sessionController.getSessions
);

router.patch(
    '/:id/rate', 
    authMiddleware, 
    authorize(['user']), 
    sessionController.submitUserRating
);

// Ensure this points to your new getSessionById controller action!
router.get('/:id', authMiddleware, sessionController.getSessionById);

router.patch(
    '/:id/review-notes', 
    authMiddleware, 
    authorize(['coach']), 
    sessionController.submitCoachReviewNotes
);

module.exports = router;