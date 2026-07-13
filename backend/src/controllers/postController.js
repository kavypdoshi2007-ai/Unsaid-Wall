// src/controllers/postController.js
const prisma = require('../config/db');
const crypto = require('crypto');

// Helper function to generate an anonymous username including animals and birds
function generateUniqueDisplayName() {
  const adjectives = [
    'Quiet', 'Brave', 'Gentle', 'Resilient', 'Seeking', 'Calm', 'Hopeful', 'Wandering', 'Silent', 'Wise',
    'Patient', 'Kind', 'Noble', 'Bright', 'Peaceful', 'Strong', 'Warm', 'Serene', 'Loyal', 'Pure'
  ];

  // 50 Famous/Common Animals used in daily conversations
  const animals = [
    'Cat', 'Dog', 'Puppy', 'Kitten', 'Rabbit', 'Bunny', 'Lion', 'Tiger', 'Bear', 'Panda',
    'Elephant', 'Monkey', 'Deer', 'Fox', 'Wolf', 'Horse', 'Zebra', 'Giraffe', 'Camel', 'Cow',
    'Sheep', 'Goat', 'Pig', 'Mouse', 'Squirrel', 'Koala', 'Kangaroo', 'Cheetah', 'Leopard', 'Hippopotamus',
    'Gorilla', 'Chimpanzee', 'Donkey', 'Bull', 'Otter', 'Sloth', 'Hedgehog', 'Hamster', 'Seal', 'Dolphin',
    'Whale', 'Penguin', 'Jaguar', 'Panther', 'Buffalo', 'Alpaca', 'Llama', 'Rhino', 'Badger', 'Beaver'
  ];

  // 50 Famous/Common Birds used in daily conversations
  const birds = [
    'Owl', 'Parrot', 'Dove', 'Eagle', 'Falcon', 'Sparrow', 'Pigeon', 'Robin', 'Raven', 'Crow',
    'Swan', 'Duck', 'Goose', 'Peacock', 'Flamingo', 'Hummingbird', 'Hawk', 'Seagull', 'Canary', 'Macaw',
    'Cockatoo', 'Toucan', 'Woodpecker', 'Ostrich', 'Kingfisher', 'Nightingale', 'Swallow', 'Stork', 'Crane', 'Heron',
    'Pelican', 'Albatross', 'Puffin', 'Cardinal', 'Bluejay', 'Goldfinch', 'Swift', 'Magpie', 'Lark', 'Thrush',
    'Rooster', 'Hen', 'Chick', 'Turkey', 'Kite', 'Osprey', 'Penguin', 'Pheasant', 'Ibis', 'Vulture'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  
  let identityWord;
  if (Math.random() < 0.5) {
    identityWord = birds[Math.floor(Math.random() * birds.length)];
  } else {
    identityWord = animals[Math.floor(Math.random() * animals.length)];
  }
  
  const uniqueId = crypto.randomInt(1, 101); 
  
  return `${adj}_${identityWord}${uniqueId}`;
}

const postController = {
  async getPreviewUsername(req, res, next) {
    try {
      const generatedName = generateUniqueDisplayName();
      return res.status(200).json({ display_name: generatedName });
    } catch (error) {
      next(error);
    }
  },

  async createPost(req, res, next) {
    try {
      const user_id = req.userData.id; 
      const { content, language, display_name} = req.body; 
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content field is required and must be a string." });
      }

      const finalDisplayName = display_name || generateUniqueDisplayName();

      // Define safe base defaults matching your Prisma schema enums
      let detectedEmotion = 'ANXIOUS';
      let detectedIntensity = 'low';
      let is_flagged = false;
      let flag_level = 'safe'; 
      let is_hidden = false;

      // 2. Immediate hardcoded crisis checking keyword loop
      const highRiskTriggers = ["suicide", "kill myself", "end my life", "self harm", "want to die"];
      const hasEmergencyWord = content && highRiskTriggers.some(word => 
        content.toLowerCase().includes(word)
      );

      if (hasEmergencyWord) {
        is_flagged = true;
        flag_level = 'crisis';
        is_hidden = true;
        detectedIntensity = 'high';
        detectedEmotion = 'SAD';
      }

      // 3. AI Model Classification Execution
      const getEmotionClassifier = req.app.get('emotionClassifier');
      const getSentimentClassifier = req.app.get('sentimentClassifier');
      
      const emotionClassifier = getEmotionClassifier ? getEmotionClassifier() : null;
      const sentimentClassifier = getSentimentClassifier ? getSentimentClassifier() : null;

      if (emotionClassifier && sentimentClassifier && !hasEmergencyWord) {
        try {
          // Run both models concurrently to save execution time
          const [emotionPredictions, sentimentPredictions] = await Promise.all([
            emotionClassifier(content),
            sentimentClassifier(content)
          ]);

          // --- Part A: Precise Emotion & Intensity Assignment ---
          if (emotionPredictions && emotionPredictions.length > 0) {
            const emotionResult = emotionPredictions.reduce((highest, current) => 
              (current.score > highest.score) ? current : highest, 
              emotionPredictions[0]
            );

            const rawLabel = emotionResult.label.toLowerCase(); // 'sadness', 'anger', 'fear', 'joy', 'love', 'surprise'
            const score = emotionResult.score || 0;

            // Map Hugging Face model outputs directly to your Prisma EmotionType enums
            switch (rawLabel) {
              case 'joy':
              case 'love':
              case 'hopeful': // Added explicit model text variance support
                detectedEmotion = 'HOPEFUL';
                break;
              case 'sadness':
                detectedEmotion = 'SAD';
                break;
              case 'anger':
                detectedEmotion = 'ANGRY';
                break;
              case 'fear':
              case 'anxiety':
                detectedEmotion = 'ANXIOUS';
                break;
              case 'surprise':
                detectedEmotion = 'CONFUSED';
                break;
              default:
                detectedEmotion = 'ANXIOUS';
            }

            // Dynamically Map Model Confidence Score to IntensityLevel enums
            if (score >= 0.85) {
              detectedIntensity = 'high';
            } else if (score >= 0.60) {
              detectedIntensity = 'med';
            } else {
              detectedIntensity = 'low';
            }
          }

          // --- Part B: Sentiment Validation & System Flag Safety Checking ---
          if (sentimentPredictions && sentimentPredictions.length > 0) {
            const sentimentResult = sentimentPredictions[0]; // SST-2 usually returns winning object at index 0
            const sentimentLabel = sentimentResult.label.toLowerCase(); // "positive" or "negative"
            const sentimentScore = sentimentResult.score || 0;

            const textLower = content.toLowerCase();

            // Crisis escalation block if the post is extremely negative and matches critical states
            if (sentimentLabel === 'negative' && sentimentScore >= 0.98 && detectedEmotion === 'SAD' && detectedEmotion === 'OVERWHELMED') {
              
              // Check for fatigue nuance exceptions
              const fatigueKeywords = ["tired", "exhausted", "sleepy", "drained"];
              const isJustFatigued = fatigueKeywords.some(word => textLower.includes(word));

              if (isJustFatigued) {
                is_flagged = true;
                flag_level = 'concerning'; 
                is_hidden = false;
                detectedIntensity = 'low'; 
              } else {
                is_flagged = true;
                flag_level = 'crisis';
                is_hidden = true;
                detectedIntensity = 'high'; 
              }
            } 
            // Standard concerning marker if negative score is moderately high and it's not a positive emotion
            else if (sentimentLabel === 'negative' && sentimentScore >= 0.80 && detectedEmotion !== 'HOPEFUL') {
              is_flagged = true;
              flag_level = 'concerning';
            }
          }

        } catch (classifierError) {
          console.error("🚨 Multi-Model Pipeline Error, falling back to defaults:", classifierError);
        }

        // Contextual sub-parsing keyword overrides (Runs safely right after model steps)
        const textLower = content.toLowerCase();
        if (textLower.includes('hopeful') || textLower.includes('hope') || textLower.includes('happy') || textLower.includes('glad') || textLower.includes('excited')) {
          detectedEmotion = 'HOPEFUL';
          is_flagged = false;
          flag_level = 'safe';
          is_hidden = false;
        } else if (textLower.includes('lonely') || textLower.includes('alone') || textLower.includes('isolated')) {
          detectedEmotion = 'LONELY';
        } else if (textLower.includes('overwhelmed') || textLower.includes('too much') || textLower.includes('pressure')) {
          detectedEmotion = 'OVERWHELMED';
        } else if (textLower.includes('numb') || textLower.includes('empty') || textLower.includes('hollow')) {
          detectedEmotion = 'NUMB';
        }
      }
      

      // Format casing configurations securely for database injection
      const normalizedIntensity = detectedIntensity.toLowerCase(); 
      const normalizedLanguage = language ? language.toLowerCase() : "en";
      const normalizedFlagLevel = flag_level.toLowerCase();

      // 4. Nested Database Atomic Multi-Write Execution
      const post = await prisma.post.create({
        data: { 
          user_id, 
          content: content.substring(0, 280),
          display_name: finalDisplayName, 
          emotion: detectedEmotion, 
          intensity: normalizedIntensity, 
          language: normalizedLanguage,
          is_flagged,
          flag_level: normalizedFlagLevel, 
          is_hidden,
          journal_entry: {
            create: {
              user_id,
              emotion: detectedEmotion,
              intensity: normalizedIntensity,
              note: content 
            }
          }
        },
        include: {
          journal_entry: true
        }
      });

      // Emit tracking adjustments via Socket.io Server Context
      const io = req.app.get('io');
      if (io) {
        io.emit('admin_metrics_update', {
          action: 'NEW_POST',
          post: { id: post.id, emotion: post.emotion, is_hidden: post.is_hidden }
        });
      }
      
      // 5. Automated Coach Crisis Room Assignment Interception Logic
      if (post.flag_level === 'crisis') {
        const availableCoach = await prisma.coach.findFirst({
          where: { availability: 'available' },
          include: { user: { select: { display_name_pool: true } } }
        });

        let autoSession;

        if (availableCoach) {
          const [sessionResult, coachResult] = await prisma.$transaction([
            prisma.session.create({
              data: {
                user_id: user_id,
                coach_id: availableCoach.id,
                status: 'active',
                started_at: new Date(),
                duration_minutes: 30,
                context_message: `🚨 [CRITICAL AUTO-ASSIGN] Assigned to you immediately due to system crisis alert.`
              }
            }),
            prisma.coach.update({
              where: { id: availableCoach.id },
              data: { availability: 'busy' }
            })
          ]);

          autoSession = sessionResult;

          if (io) {
            io.emit(`session_accepted_${user_id}`, { 
                sessionId: autoSession.id,
                coachName: availableCoach.user.display_name_pool?.[0] || 'A Support Specialist'
            });
            io.emit(`coach_emergency_assigned_${availableCoach.id}`, { sessionId: autoSession.id });
          }
        } else {
          autoSession = await prisma.session.create({
            data: {
              user_id: user_id,
              status: 'pending',
              duration_minutes: 30,
              context_message: `⚠️ [AUTOMATED EMERGENCY] No coaches were available for auto-assignment. Please claim immediately: "${content.substring(0, 50)}..."`
            }
          });

          const startSessionTimer = req.app.get('startSessionTimer');
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
          io.emit('crisis_alert', { postId: post.id, content: post.content, timestamp: post.created_at });
        }

        if (post.flag_level === 'crisis') {
          return res.status(403).json({
            status: "INTERCEPTED",
            message: "Your post has been kept private. We hear you, and you are not alone. Let's connect you with a supportive space right now.\n iCall (9152987821), Vandrevala Foundation (1860-2662-345)",
            sessionId: autoSession.id 
          });
        } else {
          return res.status(201).json({
            status: "AUTO_SESSION_CREATED",
            post: post,
            sessionId: autoSession.id
          });
        }
      }
      return res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  },

  async getFeed(req, res, next) {
    try {
      const posts = await prisma.post.findMany({
        where: { is_hidden: false }, 
        orderBy: { created_at: 'desc' },
        include: {
          reactions: true,
          comments: {
            orderBy: { created_at: 'asc' },
            include: {
              user: {
                select: {
                  coach_profile: { select: { name: true } }
                }
              }
            }
          }
        }
      });
      return res.json(posts);
    } catch (error) {
      next(error);
    }
  },

  async getFlaggedPost(req, res, next) {
    try {
    const dashboardPosts = await prisma.post.findMany({
      where: {
        OR: [
          { is_flagged: true }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    
    res.json(dashboardPosts);
  } catch (error) {
    // This will print the actual database error to your terminal console if something breaks
    console.error("Mod Queue Error:", error); 
    res.status(500).json({ error: "Failed to fetch moderation queue", details: error.message });
  }
  },

  async addComment(req, res, next) {
    try {
      const user_id = req.userData.id; 
      const { postId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Comment content is required and must be a string." });
      }

      const postExists = await prisma.post.findUnique({ where: { id: postId } });
      if (!postExists) {
        return res.status(404).json({ error: "Post not found." });
      }

      const comment = await prisma.comment.create({
        data: {
          post_id: postId,
          user_id: user_id,
          content: content.trim()
        },
        include: {
          user: {
            select: {
              coach_profile: { select: { name: true } } 
            }
          }
        }
      });

      return res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  },
  
  async updatePostVisibility(req, res, next) {
    try {
      const { postId } = req.params;
      const { is_hidden } = req.body;

      if (typeof is_hidden !== 'boolean') {
        return res.status(400).json({ error: "is_hidden field is required and must be a boolean." });
      }

      const postExists = await prisma.post.findUnique({ where: { id: postId } });
      if (!postExists) {
        return res.status(404).json({ error: "Post not found." });
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { is_hidden }
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('admin_metrics_update', {
          action: 'POST_VISIBILITY_CHANGED',
          post: { id: updatedPost.id, emotion: updatedPost.emotion, is_hidden: updatedPost.is_hidden }
        });
      }

      return res.status(200).json({
        message: `Post has been successfully ${updatedPost.is_hidden ? 'hidden' : 'unhidden'}.`,
        post: updatedPost
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = postController;