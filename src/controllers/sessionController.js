// src/controllers/sessionController.js
const prisma = require('../config/db');

const sessionController = {
  // 1. CREATE: User requests a session with a Coach
  // 1. CREATE: User requests an open support session or direct coach booking
  async createSession(req, res, next) {
    try {
      const { coach_id, context_message } = req.body;
      const authenticatedUserId = req.userData.id; 

      const sessionData = {
        user: {
          connect: { id: authenticatedUserId }
        },
        status: 'pending',
        context_message: context_message || ""
      };

      // If a user clicked a specific coach's profile card, connect them directly
      if (coach_id) {
        const coach = await prisma.coach.findUnique({ where: { id: coach_id } });
        if (!coach || coach.availability !== 'available') {
          return res.status(400).json({ error: "Coach is currently unavailable or doesn't exist." });
        }
        if (coach.user_id === authenticatedUserId) {
          return res.status(400).json({ error: "You cannot request a support session with your own profile." });
        }
        
        sessionData.coach = {
          connect: { id: coach.id }
        };
      } 
      // If no coach_id is passed, it safely skips adding the coach field,
      // creating an unassigned waiting room session since we added Coach? to the schema!

      const newSession = await prisma.session.create({
        data: sessionData
      });

      // Broadcast the request into the coach marketplace pool in real-time
      const io = req.app.get('io');
      if (io) {
        io.emit('new_session_request', {
          sessionId: newSession.id,
          contextMessage: newSession.context_message
        });
      }

      return res.status(201).json(newSession);
    } catch (error) {
      next(error);
    }
  },
  
  // 2. UPDATE: Coach accepts or declines the session
  async updateStatus(req, res, next) {
  try {
    const { id } = req.params; // Session ID UUID
    const { status } = req.body; // 'active', 'declined', or 'completed'
    const authenticatedUserId = req.userData.id; // Sourced securely via JWT

    if (!['active', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status state assignment." });
    }

    // Resolve who this coach profile belongs to
    const coachProfile = await prisma.coach.findFirst({
      where: { user_id: authenticatedUserId }
    });

    if (!coachProfile) {
      return res.status(404).json({ error: "Coach profile context missing." });
    }

    // Fetch the target session from database
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ error: "Session record not found." });
    }

    // =================================================================
    // CRITICAL FIRST-RESPONDER CONFLICT GUARD
    // =================================================================
    if (status === 'active') {
      // If another coach already bound themselves to this session row, block execution!
      if (session.coach_id !== null && session.coach_id !== coachProfile.id) {
        return res.status(409).json({ 
          error: "Too late! Another support coach has already accepted this session request." 
        });
      }

      // Check if this specific coach is already busy with someone else
      if (coachProfile.availability === 'busy') {
        return res.status(400).json({ error: "You are currently busy and cannot accept new requests." });
      }
    }

    const updateData = { status };

    if (status === 'active') {
      updateData.started_at = new Date();
      updateData.coach_id = coachProfile.id; // Permanently link the winning coach to this session

      // Lock the coach profile availability status to busy
      await prisma.coach.update({
        where: { id: coachProfile.id },
        data: { availability: 'busy' }
      });

      // Clear the session request out of the market across all other active coach UI dashboards
      // Inside sessionController.js -> updateStatus method -> if (status === 'active')
      const io = req.app.get('io');
      if (io) {
          // Notify all coaches to remove the card from their incoming queues
          io.emit('session_request_claimed', { sessionId: id });

          // CRITICAL: Notify the exact student/user who created it that their session is active!
          io.emit(`session_accepted_${session.user_id}`, { 
              sessionId: id,
              coachName: coachProfile.display_name_pool?.[0] || 'A Support Specialist'
          });
      }
    } 
    
    else if (status === 'completed' || status === 'declined') {
      if (status === 'completed') {
            const io = req.app.get('io');
            if (io) {
                io.to(id).emit('session_ended', { sessionId: id });
            }
        }
      
      // Release the coach profile resource state back to available
      await prisma.coach.update({
        where: { id: coachProfile.id },
        data: { 
          availability: 'available',
          ...(status === 'completed' && { sessions_count: { increment: 1 } })
        }
      });
    }

    // Commit changes to database
    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData
    });

    return res.json(updatedSession);
  } catch (error) {
    next(error);
  }
},

  // 3. READ: Fetch listings based on authenticated role constraints
 async getSessions(req, res, next) {
    try {
      const authenticatedUserId = req.userData.id;
      const userRole = req.userData.role;
      let queryFilter = {};

      if (userRole === 'user') {
        queryFilter = { user_id: authenticatedUserId };
      } else if (userRole === 'coach') {
        if (!authenticatedUserId) {
          return res.status(401).json({ error: "Unauthorized: Missing authenticated user context." });
        }

        const coachProfile = await prisma.coach.findFirst({ 
          where: { user_id: authenticatedUserId } 
        });
        
        if (!coachProfile) return res.json([]); 
        
        // FIX: Allow coaches to fetch their own assigned sessions OR any open pending requests
        queryFilter = {
          OR: [
            { coach_id: coachProfile.id },
            {
              AND: [
                { status: 'pending' },
                { coach_id: null }
              ]
            }
          ]
        };
      } else if (userRole === 'admin') {
        queryFilter = {};
      }

      const sessions = await prisma.session.findMany({
        where: queryFilter,
        include: {
          user: { select: { id: true, phone_number: true, display_name_pool: true } },
          coach: { include: { user: { select: { display_name_pool: true } } } },
          messages: { take: 5, orderBy: { created_at: 'desc' } }
        }
      });
      sessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

      return res.json(sessions);
    } catch (error) {
      next(error);
    }
  },

      async getSessionById(req, res, next) {
      try {
        const { id } = req.params; // Extracts the single sessionId from /api/sessions/:id
        const authenticatedUserId = req.userData.id;
        const userRole = req.userData.role;

        const session = await prisma.session.findUnique({
          where: { id: id },
          include: {
            user: { select: { id: true, phone_number: true, display_name_pool: true } },
            coach: { include: { user: { select: { display_name_pool: true } } } }
          }
        });

        if (!session) {
          return res.status(404).json({ error: "Session record not found." });
        }

        // SECURITY GUARD: Ensure users/coaches can't snoop on sessions that aren't theirs
        if (userRole === 'user' && session.user_id !== authenticatedUserId) {
          return res.status(403).json({ error: "Forbidden: Access Denied." });
        }
        
        if (userRole === 'coach') {
          const coachProfile = await prisma.coach.findFirst({ 
            where: { user_id: authenticatedUserId } 
          });
          if (!coachProfile || session.coach_id !== coachProfile.id) {
            return res.status(403).json({ error: "Forbidden: Access Denied." });
          }
        }

        // Returns a single object {} containing coach_notes cleanly to Step 2!
        return res.json(session);
      } catch (error) {
        next(error);
      }
    },

  // 4. UPDATE: Submit user rating or private coach notes upon completion securely
  async submitUserRating(req, res, next) {
    try {
      const { id } = req.params; // Session ID
      const { rating } = req.body;
      const authenticatedUserId = req.userData.id;

      if (!rating) {
        return res.status(400).json({ error: "Rating score value is a required field." });
      }

      // Fetch session with coach structure to verify ownership
      const session = await prisma.session.findUnique({
        where: { id },
        include: { coach: true }
      });

      if (!session) {
        return res.status(404).json({ error: "Session record not found." });
      }

      // SECURE VERIFICATION: Ensure the logged-in user is actually the one who attended this session
      if (session.user_id !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden: You cannot rate another user's session." });
      }

      // Update the rating column on the session record
      const updatedSession = await prisma.session.update({
        where: { id },
        data: { rating: parseInt(rating) }
      });

      // Recalculate the overall running average score for the coach profile
      if (session.coach_id) {
        const allCoachSessions = await prisma.session.findMany({
          where: { coach_id: session.coach_id, rating: { not: null } }
        });
        
        if (allCoachSessions.length > 0) {
          const totalRatingSum = allCoachSessions.reduce((acc, curr) => acc + curr.rating, 0);
          const avgRating = totalRatingSum / allCoachSessions.length;

          await prisma.coach.update({
            where: { id: session.coach_id },
            data: { rating: parseFloat(avgRating.toFixed(2)) }
          });
        }
      }

      return res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  },

  // =========================================================================
  // 2. COACH ACTION: Write summary/evaluation notes concerning a user session
  // =========================================================================
  async submitCoachReviewNotes(req, res, next) {
    try {
      const { id } = req.params; // Session ID
      const { coach_notes } = req.body;
      const authenticatedUserId = req.userData.id;

      if (!coach_notes) {
        return res.status(400).json({ error: "coach_notes text is a required field." });
      }

      // Fetch the session record with the assigned coach relation
      const session = await prisma.session.findUnique({
        where: { id },
        include: { coach: true }
      });

      if (!session) {
        return res.status(404).json({ error: "Session record not found." });
      }

      // SECURE VERIFICATION: Ensure the logged-in coach is the one assigned to this session
      if (!session.coach || session.coach.user_id !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden: You cannot edit notes for another coach's session." });
      }

      // Natively update the professional summary notes field
      const updatedSession = await prisma.session.update({
        where: { id },
        data: { coach_notes: coach_notes }
      });

      return res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sessionController;