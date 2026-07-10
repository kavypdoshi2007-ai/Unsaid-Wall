// src/controllers/messageController.js
const prisma = require('../config/db');

const messageController = {
  // 1. CREATE: Save a new message sent in a session + Broadcast in Real-Time
  async sendMessage(req, res, next) {
    try {
      const { session_id, content, message_type } = req.body;
      const authenticatedUserId = req.userData.id; // SECURE: Taken from verified JWT token payload

      if (!session_id || !content) {
        return res.status(400).json({ error: "session_id and content are required fields." });
      }

      // Fetch the session along with its connected coach record to inspect who owns it
      const session = await prisma.session.findUnique({ 
        where: { id: session_id },
        include: { coach: true }
      });

      if (!session) {
        return res.status(404).json({ error: "Session workspace not found." });
      }

      // Enforce State Machine: Ensure the session is actually active before saving messages
      if (session.status !== 'active') {
        return res.status(400).json({ error: "Cannot send messages to a closed or pending session." });
      }

      // SECURE CONTEXT VERIFICATION: 
      // Verify if the authenticated sender is either the user or the coach mapped to this session
      const isAuthorizedUser = session.user_id === authenticatedUserId;
      const isAuthorizedCoach = session.coach && session.coach.user_id === authenticatedUserId;

      if (!isAuthorizedUser && !isAuthorizedCoach) {
        return res.status(403).json({ error: "Forbidden: You are not a participant in this support workspace." });
      }

      // Execute database insertion
      const newMessage = await prisma.message.create({
        data: {
          session_id,
          sender_id: authenticatedUserId, // Guarded against payload body spoofing
          content,
          message_type: message_type || 'text' // Fallbacks to MessageType enum default
        }
      });

      // ====================================================
      // 🚀 SOCKET.IO REAL-TIME BROADCAST INTEGRATION
      // ====================================================
      // Pull the configured socket server instance out of the express app context
      const io = req.app.get('io');
      
      if (io) {
        // Emit the freshly baked message data directly to the session room channel
        io.to(session_id).emit('receive_message', newMessage);
      } else {
        console.warn("[Socket Warning] 'io' object could not be retrieved from req.app framework.");
      }
      // ====================================================

      return res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  },

  // 2. READ: Fetch all chat messages for a specific session (Ordered chronologically)
  async getSessionMessages(req, res, next) {
    try {
      const { sessionId } = req.params;
      const authenticatedUserId = req.userData.id; // SECURE: Taken from verified JWT token payload

      // Fetch session data to evaluate access controls
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { coach: true }
      });

      if (!session) {
        return res.status(404).json({ error: "Session record not found." });
      }

      // SECURE CONTEXT VERIFICATION: Prevent external users from snooping on private chat logs
      const isAuthorizedUser = session.user_id === authenticatedUserId;
      const isAuthorizedCoach = session.coach && session.coach.user_id === authenticatedUserId;
      const isAdmin = req.userData.role === 'admin';

      if (!isAuthorizedUser && !isAuthorizedCoach && !isAdmin) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to view this chat history." });
      }

      const messages = await prisma.message.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'asc' }
      });

      return res.json(messages);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = messageController;