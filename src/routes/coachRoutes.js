// src/routes/coachRoutes.js
const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const authorize = require('../middleware/roleMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authorize(['guest', 'user', 'coach', 'admin']), coachController.getAllCoaches);
 
router.post('/', authMiddleware, authorize(['coach']), coachController.createProfile);

router.get('/me', authMiddleware, coachController.getMyProfile);

router.post('/request-session', authMiddleware, authorize(['user']), coachController.requestSession); 

module.exports = router;