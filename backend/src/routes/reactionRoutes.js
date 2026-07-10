// src/routes/reactionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const reactionController = require('../controllers/reactionController');

router.post('/toggle', authMiddleware, authorize(['user', 'coach']), reactionController.toggleReaction);

router.get('/post/:post_id', authorize(['guest', 'user', 'coach', 'admin']), reactionController.getPostReactions);

module.exports = router;