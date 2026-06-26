// src/routes/index.js
const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const reactionRoutes = require('./reactionRoutes');
const coachRoutes = require('./coachRoutes');
const sessionRoutes = require('./sessionRoutes');
const messageRoutes = require("./messageRoutes");
const journalRoutes = require('./journalRoutes');
const announcementRoutes = require('./announcementRoutes');
const resourceRoutes = require('./resourceRoutes');

// Mount individual domain sub-routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/reactions', reactionRoutes);
router.use('/coaches', coachRoutes);
router.use('/sessions', sessionRoutes);
router.use('/messages',messageRoutes);
router.use('/journal', journalRoutes);
router.use('/announcements', announcementRoutes);
router.use('/resource', resourceRoutes);

module.exports = router;