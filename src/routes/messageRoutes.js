// src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const messageController = require('../controllers/messageController');


router.post('/', authMiddleware, authorize(['user', 'coach']), messageController.sendMessage);
router.get('/session/:sessionId', authMiddleware, authorize(['user', 'coach']), messageController.getSessionMessages);

module.exports = router;