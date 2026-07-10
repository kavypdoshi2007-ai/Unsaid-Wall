const prisma = require('../config/db');

const announcementController = {
  // 1. CREATE: Admin posts a system announcement
  async createAnnouncement(req, res, next) {
    try {
      const admin_id = req.userData.id;
      const { content, link, is_pinned, expires_at } = req.body;

      // Basic validation
      if (!admin_id || !content) {
        return res.status(400).json({ error: "Admin ID and content are required fields" });
      }

      console.log("Request Body:", req.body);
      const newAnnouncement = await prisma.announcement.create({
        data: {
          admin: {
            connect: { id: admin_id }
            },
          content,
          link: link || null,
          is_pinned: is_pinned || false,
          expires_at: expires_at ? new Date(expires_at) : null
        }
      });

      return res.status(201).json(newAnnouncement);
    } catch (error) {
      next(error);
    }
  },

  // 2. READ: Fetch all active/unexpired announcements for users
  async getActiveAnnouncements(req, res, next) {
    try {
      const now = new Date();

      const announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { expires_at: null },          // Never expires
            { expires_at: { gte: now } }   // Expiration date is in the future
          ]
        },
        orderBy: [
          { is_pinned: 'desc' },          // Show pinned alerts at the very top
          { created_at: 'desc' }          // Then show the newest announcements first
        ]
      });

      return res.json(announcements);
    } catch (error) {
      next(error);
    }
  },

  // 3. DELETE: Remove an announcement entry
  async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.announcement.delete({ where: { id } });
      return res.json({ message: "Announcement removed successfully" });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = announcementController;