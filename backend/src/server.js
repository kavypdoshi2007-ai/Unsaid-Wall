// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const prisma = require('./config/db');
const apiRoutes = require('./routes/index');
const jwt = require('jsonwebtoken');
const { pipeline } = require('@huggingface/transformers');

const app = express();
const server = http.createServer(app);

let emotionClassifier;
let sentimentClassifier;
const activeTimers = {}; // ⏱️ Keeps track of timeouts for active sessions

async function initializeAIModels() {
  try {
    console.log("⏳ Loading Verified ONNX Multi-Model Engine Core...");
    
    // 1. Load the 6-class Emotion Model (For precise feelings & intensities)
    emotionClassifier = await pipeline('text-classification', 'nicky48/emotion-english-distilroberta-base-ONNX');
    console.log("✅ Emotion Classification Pipeline Loaded.");

    // 2. Load the Binary Sentiment Model (Your original model for auxiliary crisis/flag assistance)
    sentimentClassifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    console.log("✅ Sentiment Validation Pipeline Loaded.");
    
    console.log("🚀 Both Safety & Emotion Engines Are Fully Active.");
  } catch (err) {
    console.error("❌ Models failed to load:", err);
  }
}
initializeAIModels();

// Share the classifier instances securely with Express controllers
app.set('emotionClassifier', () => emotionClassifier);
app.set('sentimentClassifier', () => sentimentClassifier);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://diminish-waving-shore.ngrok-free.dev' // Allows standard API requests through ngrok
];

app.use(cors({
    origin: allowedOrigins, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    preflightContinue: false, // Tells the middleware to send the response directly for OPTIONS
    optionsSuccessStatus: 204
}));

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error(`[Payload Error] Malformed JSON received: ${err.message}`);
    return res.status(400).json({ 
      error: "Invalid JSON format. Ensure you aren't wrapping your request body in redundant outer string quotes." 
    });
  }
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', apiRoutes);

// Centralized error handling layer
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Custom parsing for unique database index constraints (e.g., trying to use an existing phone number)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this unique field already exists.' });
  }
  
  return res.status(500).json({ error: 'Internal Server Error' });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Adjust this to match your specific production domain requirements
    methods: ["GET", "POST"],
    allowedHeaders: ["ngrok-skip-browser-warning"],
    credentials: true
  }
});

const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// WebSocket Handshake Middleware: Validate authentication before granting access
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Access denied. Token missing."));

    const decodedClaims = jwt.verify(token, JWT_SECRET);
    socket.userData = {
      id: decodedClaims.id || decodedClaims.userId || decodedClaims.user_id,
      role: decodedClaims.role
    };
    next();
  } catch (error) {
    next(new Error("Authentication token is invalid or expired."));
  }
});

// Attach the socket instance directly to the global express app object
// This permits your HTTP controllers to access `req.app.get('io')` seamlessly
app.set('io', io);
app.set('startSessionTimer', startSessionTimer);

function startSessionTimer(sessionId, io) {
  // Clear any existing timer for this session to avoid duplicate intervals
  if (activeTimers[sessionId]) {
    clearTimeout(activeTimers[sessionId].warningTimeout);
    clearTimeout(activeTimers[sessionId].expirationTimeout);
  }

  activeTimers[sessionId] = {
    warningTimeout: null,
    expirationTimeout: null
  };

  // 1. Set Warning Timeout (19 minutes = 1,140,000 ms)
  // (For quick testing, change 19 * 60 * 1000 to 10 * 1000 for a 10-second warning)
  const warningDelay = 19 * 60 * 1000; 
  
  const warningTimeout = setTimeout(() => {
    console.log(`⚠️ Sending 1-minute warning to session: ${sessionId}`);
    
    // Notify only the coach or everyone in the session room
    io.to(sessionId).emit('timer_warning', {
      sessionId: sessionId,
      message: "1 minute remaining. Do you want to extend the session?"
    });

    // 2. Set Expiration Timeout (1 minute later = 60,000 ms)
    const expirationTimeout = setTimeout(async () => {
      console.log(`🛑 Session ${sessionId} time expired.`);
      
      // Auto-close session in Database
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'completed', ended_at: new Date() }
      });
      
      io.to(sessionId).emit('session_ended', { sessionId, reason: 'time_expired' });
      delete activeTimers[sessionId];
    }, 1 * 60 * 1000);

    activeTimers[sessionId].expirationTimeout = expirationTimeout;

  }, warningDelay);

  // Store references so we can clear/reset them later
  activeTimers[sessionId].warningTimeout = warningTimeout;
}

io.on('connection', (socket) => {

  if (socket.userData.role === 'coach') {
    socket.join('available_coaches');
  }

  socket.on('join_session', ({ sessionId }) => {
    socket.join(sessionId);
    
  });

  socket.on('send_message', ({ sessionId, messageText }) => {
    io.to(sessionId).emit('receive_message', {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_id: socket.userData.id,
      content: messageText,
      created_at: new Date()
    });
  });

  socket.on('extend_session_time', ({ sessionId }) => {
      // Security Check: Only allow if the timer exists and hasn't fully expired yet
      if (activeTimers[sessionId]) {
        console.log(`🔄 Resetting timer for session: ${sessionId}`);
        
        // Clear the pending termination timeout
        clearTimeout(activeTimers[sessionId].expirationTimeout);
        
        // Restart the 20-minute cycle completely
        startSessionTimer(sessionId, io);
        
        // Inform the frontend that the clock has reset successfully
        io.to(sessionId).emit('timer_extended', { 
          sessionId, 
          message: "Session extended by 20 minutes." 
        });
      }
    });
    
  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 3000;
// CRITICAL: Change from app.listen to server.listen so socket handlers fire!
server.listen(PORT, () => {
  console.log(`Express application & Socket.io engine active on port ${PORT}`);
});

// Clean execution pool tear-down on server drops
process.on('SIGTERM', () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});