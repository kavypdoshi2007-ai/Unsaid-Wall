// src/controllers/journalController.js
const prisma = require('../config/db');

const journalController = {
  async createEntry(req, res, next) {
    try {
      // SECURE: Enforce that the user can only create an entry for their own profile
      const user_id = req.userData.id;
      const { emotion, intensity, post_id, note } = req.body;

      if (!emotion || !intensity) {
        return res.status(400).json({ error: "Emotion and intensity are required fields" });
      }

      const newEntry = await prisma.emotionJournal.create({
        data: { user_id, emotion, intensity, post_id: post_id || null, note }
      });

      return res.status(201).json(newEntry);
    } catch (error) {
      next(error);
    }
  },

  async getUserJournal(req, res, next) {
    try {
      const { userId } = req.params;

      // SECURE CONTEXT CHECK: Block users from reading another person's private emotional journal logs
      if (req.userData.id !== userId && req.userData.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You cannot access this user's journal records." });
      }

      const logs = await prisma.emotionJournal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' }
      });

      return res.json(logs);
    } catch (error) {
      next(error);
    }
  },

  async deleteEntry(req, res, next) {
    try {
      const { id } = req.params;

      const entry = await prisma.emotionJournal.findUnique({ where: { id } });
      if (!entry) return res.status(404).json({ error: "Journal log entry not found." });

      // SECURE CONTEXT CHECK: Only allow deletions if they own the node
      if (entry.user_id !== req.userData.id && req.userData.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You do not own this journal record." });
      }

      await prisma.emotionJournal.delete({ where: { id } });
      return res.json({ message: "Journal record purged successfully." });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = journalController;