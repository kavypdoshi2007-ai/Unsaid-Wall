// src/controllers/reactionController.js
const prisma = require('../config/db');

const reactionController = {
  // Toggle Reaction (Like / Heart / Support)
  async toggleReaction(req, res, next) {
  try {
    const user_id = req.userData.id;
    const { post_id, reaction_type } = req.body;

    if (!post_id || !user_id || !reaction_type) {
      return res.status(400).json({ error: "post_id, user_id, and reaction_type are required fields." });
    }

    // ✅ FIX: Query ONLY by post and user to find ANY pre-existing reaction
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        post_id_user_id: { post_id, user_id }
      }
    });

    if (existingReaction) {
      // Scenario A: If they clicked the SAME reaction, remove it (Undo)
      if (existingReaction.reaction_type === reaction_type) {
        await prisma.reaction.delete({
          where: {
            post_id_user_id: { post_id, user_id }
          }
        });
        return res.status(200).json({ message: "Reaction removed", action: "removed" });
      } else { 
        // Scenario B: If they chose a DIFFERENT reaction, update it safely
        const updatedReaction = await prisma.reaction.update({
          where: {
            post_id_user_id: { post_id, user_id }
          },
          data: { reaction_type }
        });
        return res.status(200).json({ ...updatedReaction, action: "updated" });
      }
    }

    // Scenario C: No reaction exists at all, create a fresh one safely
    const newReaction = await prisma.reaction.create({
      data: { post_id, user_id, reaction_type }
    });
    return res.status(201).json({ ...newReaction, action: "added" });

  } catch (error) {
    next(error);
  }
},
  // Get all reactions for a specific post
  async getPostReactions(req, res, next) {
    try {
    const { post_id } = req.params;
    // Extract the logged-in user id safely if a token is present in the request
    const currentUserId = req.userData?.id || null;

    // 1. Fetch grouped reaction counts from Prisma
    const aggregations = await prisma.reaction.groupBy({
      by: ['reaction_type'],
      where: { post_id: post_id },
      _count: true,
    });

    // 2. Query to see which specific reactions the current user has on this post
    let userActiveReactions = [];
    if (currentUserId) {
      const userReactions = await prisma.reaction.findMany({
        where: {
          post_id: post_id,
          user_id: currentUserId
        },
        select: { reaction_type: true }
      });
      userActiveReactions = userReactions.map(r => r.reaction_type);
    }

    // 3. Combine counts with a true/false flag so the frontend knows what to light up
    const reactionMetrics = aggregations.map(item => ({
      reaction_type: item.reaction_type,
      count: item._count,
      // ✨ CRITICAL FLAG: Returns true if this specific type was clicked by the user
      userHasReacted: userActiveReactions.includes(item.reaction_type)
    }));

    return res.json(reactionMetrics);
  } catch (error) {
    next(error);
  }
}
};

module.exports = reactionController;