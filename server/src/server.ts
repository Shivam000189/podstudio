import dotenv from "dotenv";
dotenv.config();
import { env } from "./config/env";
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import recordingRoutes from './routes/recording.routes';

const app = express();
const httpServer = createServer(app);  // wrap express in HTTP server
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors((req, callback) => {
  const origin = req.header("Origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const origins = process.env.NODE_ENV === "production"
    ? allowedOrigins
    : [...allowedOrigins, ...localOrigins];

  if (!origin || origin === requestOrigin || origins.includes(origin)) {
    return callback(null, { origin: true, credentials: true });
  }
  return callback(new Error("Not allowed by CORS"));
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', roomRoutes);

app.use('/api/recordings', recordingRoutes);
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Express + TypeScript + Socket.io server running!' });
});

// Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: localOrigins,
    credentials: true,
  },
});

// Track who's in which room
const roomUsers = new Map<string, Set<string>>(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // When someone joins a room
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

  // WebRTC signaling events (we'll use these in Step 4)
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