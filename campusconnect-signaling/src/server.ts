import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifySocketAuth } from './middleware/auth.js';
import { registerPresenceHandlers } from './handlers/presenceHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { registerCallHandlers } from './handlers/callHandler.js';
import { registerLectureHandlers } from './handlers/lectureHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT || '5000', 10);
const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const SPRING_BOOT_URL = process.env.SPRING_BOOT_URL || 'http://localhost:8080';
const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')
  .split(',')
  .map((o) => o.trim());

// Express Middleware
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'campusconnect-signaling',
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Authentication Handshake Middleware
io.use(verifySocketAuth(JWT_SECRET));

// Connection Lifecycle
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`[Socket] User connected: ${user?.email} (${user?.userId}) [socketId: ${socket.id}]`);

  // Register domain handlers
  registerPresenceHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerCallHandlers(io, socket, SPRING_BOOT_URL);
  registerLectureHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User disconnected: ${user?.email} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CampusConnect Signaling Server running on port ${PORT}`);
  console.log(`   JWT Secret configured: Yes`);
  console.log(`   Spring Boot URL: ${SPRING_BOOT_URL}`);
  console.log(`   Allowed Origins: ${clientOrigins.join(', ')}`);
  console.log(`=======================================================`);
});
