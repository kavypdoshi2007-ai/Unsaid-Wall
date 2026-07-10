// src/controllers/journalController.js
const prisma = require('../config/db');

const journalController = {
  async createEntry(req, res, next) {
    try {
      const user_id = req.userData.id;
      const { emotion, intensity, note } = req.body;

      if (!emotion || !intensity) {
        return res.status(400).json({ error: "Emotion and intensity are required fields" });
      }

      // Format types explicitly to match your schema requirements
      const normalizedEmotion = emotion.toUpperCase(); 
      const normalizedIntensity = intensity.toLowerCase();

      // Create a private-by-default shadow Post that cascades into an automatic Emotion Journal log block
      const journalPost = await prisma.post.create({
        data: {
          user_id,
          content: note ? note.substring(0, 280) : `Logged private tracking entry for ${normalizedEmotion}`,
          display_name: "Private Note",
          emotion: normalizedEmotion,
          intensity: normalizedIntensity,
          language: "en", 
          is_hidden: true, // Absolutely guarantees it stays private and hidden from the public feed
          flag_level: "safe",
          journal_entry: {
            create: {
              user_id,
              emotion: normalizedEmotion,
              intensity: normalizedIntensity,
              note: note
            }
          }
        },
        include: {
          journal_entry: true
        }
      });

      // Returns the interior nested journal information node back to the client interface layout
      return res.status(201).json(journalPost.journal_entry);
    } catch (error) {
      next(error);
    }
  },

  async getUserJournal(req, res, next) {
    try {
      // Cast parameter directly as string to ensure parameter safety
      const userId = String(req.params.userId);

      if (req.userData.id !== userId && req.userData.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You cannot access this user's journal records." });
      }

      const logs = await prisma.emotionJournal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' },
        include: { post: true } // Let's frontend fetch information referencing the source post if needed
      });

      return res.json(logs);
    } catch (error) {
      next(error);
    }
  },

  async deleteEntry(req, res, next) {
    try {
      const entryId = String(req.params.id);

      const entry = await prisma.emotionJournal.findUnique({ where: { id: entryId } });
      if (!entry) return res.status(404).json({ error: "Journal log entry not found." });

      if (entry.user_id !== req.userData.id && req.userData.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You do not own this journal record." });
      }

      // If this journal entry is bound to a hidden direct journal post, clear the structural parent container post
      if (entry.post_id) {
        await prisma.post.delete({ where: { id: entry.post_id } });
      } else {
        await prisma.emotionJournal.delete({ where: { id: entryId } });
      }

      return res.json({ message: "Journal record purged successfully." });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = journalController;