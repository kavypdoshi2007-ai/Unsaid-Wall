// src/routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const announcementController = require('../controllers/announcementController');

router.post('/', authMiddleware, authorize(['admin']), announcementController.createAnnouncement);
router.get('/', announcementController.getActiveAnnouncements);
router.delete('/:id', authMiddleware, authorize(['admin']), announcementController.deleteAnnouncement);

module.exports = router;