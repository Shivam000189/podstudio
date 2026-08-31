import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { clerkMiddleware } from "@clerk/express";
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import recordingRoutes from './routes/recording.routes';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Attach Clerk Middleware if configured
if (process.env.CLERK_SECRET_KEY || process.env.CLERK_PUBLISHABLE_KEY) {
  app.use(clerkMiddleware());
}

const localOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
  process.env.CORS_ORIGIN
]
  .filter(Boolean)
  .flatMap((val) => (val as string).split(","))
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow non-browser requests (Postman, curl, server-to-server)
  const normalized = origin.replace(/\/$/, "");
  
  if (process.env.NODE_ENV !== "production") {
    if (localOrigins.includes(normalized)) return true;
  }
  
  if (envOrigins.includes(normalized) || envOrigins.includes("*")) {
    return true;
  }

  // If no CLIENT_URL configured in production, allow default or emit warning
  if (envOrigins.length === 0) {
    return true;
  }

  return false;
};

// Express CORS
app.use(cors((req, callback) => {
  const origin = req.header("Origin");
  if (isOriginAllowed(origin)) {
    return callback(null, { origin: true, credentials: true });
  }
  return callback(null, { origin: false, credentials: true });
}));

// Routes (Support both /api/* and root /* for seamless deployment compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/recordings', recordingRoutes);
app.use('/recordings', recordingRoutes);

app.use('/api', roomRoutes);
app.use('/', roomRoutes);

// Health check endpoints for deployment platforms (Render, Railway, Fly.io, AWS)
app.get(['/health', '/api/health', '/api'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PodStudio Recording API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PodStudio Recording API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Socket.IO Server Configuration
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const roomUsers = new Map<string, Set<string>>(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // room Join
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    
    // Track user
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId)!.add(socket.id);

    console.log(`👤 ${socket.id} joined room ${roomId}`);
    
    // Tell everyone else in the room that a new user joined
    socket.to(roomId).emit('user-joined', socket.id);
    
    // Tell the new user how many others are already there
    const otherUsers = Array.from(roomUsers.get(roomId)!).filter(id => id !== socket.id);
    socket.emit('room-users', otherUsers);
  });

  // WebRTC signaling events
  socket.on('offer', (payload) => {
    socket.to(payload.roomId).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    socket.to(payload.roomId).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    socket.to(payload.roomId).emit('ice-candidate', payload);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    
    // Remove user from all rooms
    roomUsers.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        if (users.size === 0) {
          roomUsers.delete(roomId);
        }
      }
    });
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);