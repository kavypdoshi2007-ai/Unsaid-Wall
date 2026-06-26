// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const postController = require('../controllers/postController');

// Anyone (including guests) can view posts
router.get('/', authorize(['guest', 'user', 'coach', 'admin']), postController.getFeed);

// Only registered 'user' accounts can create posts
router.post('/', authMiddleware, authorize(['user']), postController.createPost);

module.exports = router;