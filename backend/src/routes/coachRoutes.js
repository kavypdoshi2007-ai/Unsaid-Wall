const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const authorize = require('../middleware/roleMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Public/Guest accessible directory route
router.get('/', coachController.getAllCoaches);

//  UPDATE: Static routes must be parsed before parameterized wildcards
router.get('/me', authMiddleware, coachController.getMyProfile);
router.get('/:id', coachController.getCoachById);
 
// Profile management and incoming session queues
router.post('/', authMiddleware, authorize(['coach']), coachController.createProfile);
router.post('/request-session', authMiddleware, authorize(['user']), coachController.requestSession); 

module.exports = router;