// src/controllers/postController.js
const prisma = require('../../src/config/db');

const postController = {
  async createPost(req, res, next) {
    try {
      // 1. Securely grab the authenticated user ID from the request object
      const user_id = req.userData.id; 
      const { content, display_name, emotion, language } = req.body;
      
      // Pull the verified model instance from Express globals
      const getClassifier = req.app.get('classifier');
      const classifier = getClassifier ? getClassifier() : null;

      // Base default data states matching schema expectations
      let is_flagged = false;
      let flag_level = 'safe'; 
      let is_hidden = false;
      let intensity = 'low';

      // ========================================================
      // LAYER 1: Core Critical Keyword Fallback Safety Barrier
      // ========================================================
      const highRiskTriggers = ["suicide", "kill myself", "end my life", "self harm", "want to die"];
      const hasEmergencyWord = content && highRiskTriggers.some(word => 
        content.toLowerCase().includes(word)
      );

      if (hasEmergencyWord) {
        is_flagged = true;
        flag_level = 'crisis';
        is_hidden = true;
      }

      // ========================================================
      // LAYER 2: Live ONNX Model Context Analysis
      // ========================================================
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
              // If they are just tired, downgrade the flag level and let it post normally
              is_flagged = true;
              flag_level = 'concerning'; 
              is_hidden = false; 
            } else {
              // True crisis trigger
              is_flagged = true;
              flag_level = 'crisis';
              is_hidden = true; 
            }
          } else if (confidenceScore >= 0.75) {
            is_flagged = true;
            flag_level = 'concerning';
          }
        }
      }

      // ========================================================
      // LAYER 3: Prisma Transaction Engine Commits Data to Postgres
      // ========================================================
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

      // ========================================================
      // LAYER 4: Real-time Socket Dispatch & Frontend Interception
      // ========================================================
      if (flag_level === 'crisis') {
        const io = req.app.get('io');
        if (io) {
          io.emit('admin_crisis_alert', {
            postId: post.id,
            content: post.content,
            emotion: post.emotion,
            intensity: post.intensity,
            timestamp: post.created_at
          });
        }

        return res.status(403).json({
          status: "INTERCEPTED",
          message: "Your post has been kept private. We hear you, and you are not alone. Let's connect you with a supportive space right now.",
          sessionId: null 
        });
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