// src/controllers/postController.js
const prisma = require('../../src/config/db');

const postController = {
  async createPost(req, res, next) {
    try {
      const user_id = req.userData.id; 
      const { content, display_name, emotion, language } = req.body;
      
      const getClassifier = req.app.get('classifier');
      const classifier = getClassifier ? getClassifier() : null;

      let is_flagged = false;
      let flag_level = 'safe'; 
      let is_hidden = false;
      let intensity = 'low';

      const highRiskTriggers = ["suicide", "kill myself", "end my life", "self harm", "want to die"];
      const hasEmergencyWord = content && highRiskTriggers.some(word => 
        content.toLowerCase().includes(word)
      );

      if (hasEmergencyWord) {
        is_flagged = true;
        flag_level = 'crisis';
        is_hidden = true;
        intensity = 'high';
      }

      if (classifier && content && !is_hidden) {
        const predictions = await classifier(content);
        const result = predictions[0]; 
        
        if (result.label === 'NEGATIVE') {
          const confidenceScore = result.score;

          // Core Exclusion Guard for common false positives (like "dead tired at hospital")
          const fatigueKeywords = ["tired", "exhausted", "sleepy", "drained", "shift", "worked", "hospital"];
          const isJustFatigued = fatigueKeywords.some(word => content.toLowerCase().includes(word));

          if (confidenceScore >= 0.95) {
            if (isJustFatigued && !hasEmergencyWord) {
              is_flagged = true;
              flag_level = 'concerning'; 
              is_hidden = false;
              intensity = 'low'; 
            } else {
              // True crisis trigger
              is_flagged = true;
              flag_level = 'crisis';
              is_hidden = true;
              intensity = 'high'; 
            }
          } else if (confidenceScore >= 0.75) {
            is_flagged = true;
            flag_level = 'concerning';
            intensity = 'med';
          }
        }
      }

      const post = await prisma.post.create({
        data: { 
          user_id, 
          content, 
          display_name, 
          emotion, 
          intensity, 
          language,
          is_flagged,
          flag_level, 
          is_hidden
        },
      });

      const io = req.app.get('io');

      if (io) {
        io.emit('admin_metrics_update', {
          action: 'NEW_POST',
          post: {
            id: post.id,
            emotion: post.emotion,
            is_hidden: post.is_hidden
          }
        });
      }
      
      if (flag_level === 'crisis') {
        // Find the first coach whose status is explicitly set to 'available'
        const availableCoach = await prisma.coach.findFirst({
          where: { availability: 'available' },
          include: { user: { select: { display_name_pool: true } } }
        });

        let autoSession;

        if (availableCoach) {
          // Instantly assign the session to this coach and mark them busy
          autoSession = await prisma.session.create({
            data: {
              user_id: user_id,
              coach_id: availableCoach.id,
              status: 'active', // Changes directly to active since it's claimed
              started_at: new Date(),
              context_message: `🚨 [CRITICAL AUTO-ASSIGN] Assigned to you immediately due to system crisis alert.`
            }
          });

          await prisma.coach.update({
            where: { id: availableCoach.id },
            data: { availability: 'busy' }
          });

          if (io) {
            // Target the specific coach to forcefully update their active session panel
            io.emit(`session_accepted_${user_id}`, { 
                sessionId: autoSession.id,
                coachName: availableCoach.display_name_pool?.[0] || 'A Support Specialist'
            });
          }
        } else {
          // Fallback: If no coaches are online or available, open it as pending to the marketplace pool
          autoSession = await prisma.session.create({
            data: {
              user_id: user_id,
              status: 'pending',
              context_message: `⚠️ [AUTOMATED EMERGENCY] No coaches were available for auto-assignment. Please claim immediately: "${content.substring(0, 50)}..."`
            }
          });

          const startSessionTimer = req.app.get('startSessionTimer'); // We will export this in server.js
            if (startSessionTimer) {
              startSessionTimer(autoSession.id, io);
            }

          if (io) {
            io.emit('new_session_request', {
              sessionId: autoSession.id,
              contextMessage: autoSession.context_message,
              createdAt: autoSession.created_at || new Date()
            });
          }
        }

        if (io) {
          io.emit('crisis_alert', {
            postId: post.id,
            content: post.content,
            timestamp: post.created_at
          });
        }

        return res.status(403).json({
          status: "INTERCEPTED",
          message: "Your post has been kept private. We hear you, and you are not alone. Let's connect you with a supportive space right now.\n iCall (9152987821), Vandrevala Foundation (1860-2662-345), Surat Psychology Club direct contact",
          sessionId: autoSession.id 
        });
      }

      if (flag_level === 'concerning') {
        const autoSession = await prisma.session.create({
          data: {
            user_id: user_id,
            status: 'pending', // Open to all coaches
            context_message: `👀 [CONCERNING POST FLAG] System detected high-risk sentiment markers: "${content.substring(0, 60)}..."`
          }
        });

        if (io) {
          io.emit('new_session_request', {
            sessionId: autoSession.id,
            contextMessage: autoSession.context_message,
            createdAt: autoSession.created_at || new Date()
          });
        }
        return res.status(201).json(post);
      }

      // Normal safe posts return success 201 status code
      return res.status(201).json(post);
    } catch (error) {
      // Pass errors safely down to your Express error handler middleware
      next(error);
    }
  },

  async getFeed(req, res, next) {
    try {
      const posts = await prisma.post.findMany({
        where: { is_hidden: false },
        orderBy: { created_at: 'desc' },
      });
      return res.json(posts);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = postController;