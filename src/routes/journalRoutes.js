// src/routes/journalRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const journalController = require('../controllers/journalController');


router.post('/', authMiddleware, authorize(['user']), journalController.createEntry);

router.get('/user/:userId', authMiddleware, authorize(['user']), journalController.getUserJournal);

router.delete('/:id', authMiddleware, authorize(['user']), journalController.deleteEntry);

module.exports = router;