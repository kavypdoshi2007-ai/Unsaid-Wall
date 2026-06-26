// src/server.js
const cors = require('cors');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const prisma = require('./config/db');
const apiRoutes = require('./routes/index');
const jwt = require('jsonwebtoken');
const { pipeline } = require('@huggingface/transformers');

const app = express();
const server = http.createServer(app);

let classifier;
async function initializeCrisisModel() {
  try {
    console.log("⏳ Loading Verified ONNX Lightweight Core...");
    
    // Using the verified repository path that contains config.json and model.onnx
    classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    
    console.log("✅ Safety Engine Active.");
  } catch (err) {
    console.error("❌ Model failed to load:", err);
  }
}
initializeCrisisModel();

// Share the classifier instance with Express controllers
app.set('classifier', () => classifier);

app.use(cors());
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
    origin: "*", // Adjust this to match your specific production domain requirements
    methods: ["GET", "POST"]
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

io.on('connection', (socket) => {

  if (socket.userData.role === 'coach') {
    socket.join('available_coaches');
    console.log(`Coach Socket [${socket.id}] added to the 'available_coaches' broadcast pool.`);
  }

  socket.on('join_session', ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`Connection socket ${socket.id} locked into Session Room: ${sessionId}`);
  });

  socket.on('send_message', ({ sessionId, messageText }) => {
    // Broadcast the message payload instantly to everyone in that private session room
    io.to(sessionId).emit('receive_message', {
      senderId: socket.userData.id,
      senderRole: socket.userData.role,
      text: messageText,
      timestamp: new Date()
    });
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