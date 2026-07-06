// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const postController = require('../controllers/postController');

// Anyone (including guests) can view posts
router.get('/', authorize(['guest', 'user', 'coach', 'admin']), postController.getFeed);

router.get('/username', authMiddleware, authorize(['user']), postController.getPreviewUsername);
router.post('/', authMiddleware, authorize(['user']), postController.createPost);

router.post('/:postId/comments', authMiddleware, authorize(['coach']), postController.addComment);

router.patch('/:postId/visibility', authMiddleware, authorize(['admin']), postController.updatePostVisibility);

module.exports = router;