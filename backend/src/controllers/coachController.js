const prisma = require('../config/db');

const coachController = {
  // CREATE Profile (Used when an approved user fills out their coach application)
  async createProfile(req, res, next) {
    try {
      const user_id = req.userData.id;
      const { name ,bio, specializations, languages, invite_token } = req.body;
      
      const newCoach = await prisma.coach.create({
        data: {
          user_id,
          name,
          bio,
          specializations: specializations || [], // Handles legacy array format safely
          languages: languages || [],       // Handles legacy array format safely
          availability: 'available',
          rating: 0.0, // Matches precise Decimal formatting rule in schema.prisma
          sessions_count: 0,
          invite_token
        }
      });
      return res.status(201).json(newCoach);
    } catch (error) {
      next(error);
    }
  },

  // READ ALL (Includes filters for availability/languages/specializations)
  async getAllCoaches(req, res, next) {
    try {
      const { specialization, language } = req.query;
      
      const coaches = await prisma.coach.findMany({
        where: {
          //availability: 'available',
          ...(specialization && { specializations: { has: specialization } }),
          ...(language && { languages: { has: language } })
        },
        select: {
          id: true,
          name: true,            
          bio: true,
          specializations: true,
          languages: true,
          availability: true,
          rating: true,
          sessions_count: true,
          
          user: { 
            select: { 
              phone_number: true, 
              is_banned: true    
            } 
          }
        }
      });
      return res.json(coaches);
    } catch (error) {
      next(error);
    }
  },

  async getCoachById(req, res, next) {
    try {
      const { id } = req.params; // Extracts the dynamic coach ID from the URL

      const coach = await prisma.coach.findUnique({
        where: { id: id },
        select: {
          id: true,
          name: true,            
          bio: true,
          specializations: true,
          languages: true,
          availability: true,
          rating: true,
          sessions_count: true,
          // Optional: Include fields your layout defaults to if present in your schema
          // avatar_url: true,
          // tagline: true,
          // title: true,
          user: { 
            select: { 
              phone_number: true, 
              is_banned: true    
            } 
          }
        }
      });

      if (!coach) {
        return res.status(404).json({ error: "The profile requested could not be found inside the directory." });
      }

      return res.json(coach);
    } catch (error) {
      next(error);
    }
  },

  async getMyProfile(req, res, next) {
    try {
      const user_id = req.userData.id; // Sourced securely via your authorization token decoded payload
      const coachProfile = await prisma.coach.findFirst({
        where: { user_id: user_id }
      });
  
      if (!coachProfile) {
        return res.status(404).json({ error: "No coach profile found linked to this registered account." });
      }
      return res.json(coachProfile);
    } catch (error) {
      next(error);
    }
  },

  // Handles session creation for both old and new users seamlessly
  async requestSession(req, res, next) {
  try {
    const { context_message } = req.body;
    const user_id = req.userData.id; 

    // 1. Create a pool session entry without attaching a fixed coach yet
    const newSession = await prisma.session.create({
      data: {
        user_id,
        coach_id: null, // Left empty! Waiting for a coach to claim it.
        status: 'pending',
        context_message: context_message || ""
      },
      include: {
        user: { select: { id: true, phone_number: true } } // Fetch user metadata to display to coaches
      }
    });

    // 2. Fetch the Socket.io instance from Express app settings
    const io = req.app.get('io');
    if (io) {
      // Broadcast to every coach currently online in our pool room
      io.to('available_coaches').emit('new_session_request', {
        sessionId: newSession.id,
        userId: user_id,
        contextMessage: newSession.context_message,
        createdAt: newSession.created_at
      });
    }

    return res.status(201).json({
      message: "Session request broadcasted to all available coaches!",
      session: newSession
    });
  } catch (error) {
    next(error);
  }
}
};

module.exports = coachController;