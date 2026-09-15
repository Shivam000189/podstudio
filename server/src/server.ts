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
import { verifyGuestToken } from './utils/guestToken';
import { verifyToken } from './utils/jwt';
import { prisma } from './config/prisma';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(express.json());

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
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");

  if (process.env.NODE_ENV !== "production" && localOrigins.includes(normalized)) {
    return true;
  }

  if (envOrigins.includes(normalized) || envOrigins.includes("*")) {
    return true;
  }

  return envOrigins.length === 0;
};

app.use(cors((req, callback) => {
  const origin = req.header("Origin");
  if (isOriginAllowed(origin)) {
    return callback(null, { origin: true, credentials: true });
  }
  return callback(null, { origin: false, credentials: true });
}));

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/recordings', '/recordings'], recordingRoutes);
app.use(['/api', '/'], roomRoutes);

app.get(['/health', '/api/health', '/api', '/'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PodStudio Recording API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export const io = new Server(httpServer, {
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

const roomUsers = new Map<string, Set<string>>();
const roomHosts = new Map<string, string>();
const roomTerminationTimers = new Map<string, NodeJS.Timeout>();
const HOST_DISCONNECT_GRACE_MS = 15000;

export const terminateRoomSession = async (roomId: string, reason: string) => {
  const pendingTimer = roomTerminationTimers.get(roomId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    roomTerminationTimers.delete(roomId);
  }

  try {
    await prisma.room.updateMany({
      where: { code: roomId, endedAt: null },
      data: { endedAt: new Date() },
    });
    console.log(`Room ${roomId} marked as ended: ${reason}`);
  } catch (err) {
    console.error(`Error terminating room ${roomId}:`, err);
  }

  io.to(roomId).emit('room-ended', { reason });
  roomHosts.delete(roomId);
  roomUsers.delete(roomId);
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', async (roomId: string) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      console.warn(`Socket ${socket.id} tried to join ${roomId} with no token`);
      socket.emit('auth-error', { message: 'Authentication required to join a room.' });
      socket.disconnect(true);
      return;
    }

    try {
      const room = await prisma.room.findUnique({ where: { code: roomId } });
      if (!room) {
        socket.emit('auth-error', { message: 'Room does not exist.' });
        socket.disconnect(true);
        return;
      }

      if (room.endedAt) {
        socket.emit('room-ended', { reason: 'This studio session has already ended.' });
        socket.disconnect(true);
        return;
      }

      let isHost = false;
      let participantIdentifier = '';

      try {
        const guestPayload = verifyGuestToken(token);
        if (guestPayload.roomCode !== roomId) {
          socket.emit('auth-error', { message: 'Token is not valid for this room.' });
          socket.disconnect(true);
          return;
        }
        isHost = false;
        participantIdentifier = guestPayload.email;
      } catch {
        try {
          const userPayload = verifyToken(token) as { userId: string; email?: string };
          participantIdentifier = userPayload.userId;
          if (room.createdBy === userPayload.userId) {
            isHost = true;
          }
        } catch {
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(
                Buffer.from(parts[1], "base64url").toString("utf-8")
              );
              if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.startsWith("user_")) {
                throw new Error("Not a Clerk token");
              }
              const dbUser = await prisma.user.findFirst({
                where: { clerk_id: payload.sub },
              });
              if (dbUser) {
                participantIdentifier = dbUser.id;
                if (room.createdBy === dbUser.id) {
                  isHost = true;
                }
              } else {
                participantIdentifier = payload.sub;
              }
            } else {
              throw new Error("Invalid token format");
            }
          } catch {
            console.warn(`Socket ${socket.id} failed auth for room ${roomId}`);
            socket.emit('auth-error', { message: 'Invalid or expired token.' });
            socket.disconnect(true);
            return;
          }
        }
      }

      socket.data.isHost = isHost;
      socket.data.roomId = roomId;

      if (isHost) {
        roomHosts.set(roomId, socket.id);
        const pendingTimer = roomTerminationTimers.get(roomId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          roomTerminationTimers.delete(roomId);
          console.log(`Host reconnected to room ${roomId} within grace period. Termination cancelled.`);
        }
        console.log(`Host ${socket.id} (${participantIdentifier}) joined room ${roomId}`);
      } else {
        console.log(`Guest/Participant ${socket.id} (${participantIdentifier}) joined room ${roomId}`);
      }

      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId)!.add(socket.id);

      socket.to(roomId).emit('user-joined', socket.id);

      const otherUsers = Array.from(roomUsers.get(roomId)!).filter(id => id !== socket.id);
      socket.emit('room-users', { otherUsers, isHost });
    } catch (err) {
      console.error('Error during room join:', err);
      socket.emit('auth-error', { message: 'An error occurred while joining the room.' });
      socket.disconnect(true);
    }
  });

  socket.on('end-room', async (payload: { roomId: string }) => {
    const targetRoomId = payload?.roomId || socket.data.roomId;
    if (targetRoomId && (socket.data.isHost || roomHosts.get(targetRoomId) === socket.id)) {
      console.log(`Host ${socket.id} explicitly ended room ${targetRoomId}`);
      await terminateRoomSession(targetRoomId, 'The host has ended the session.');
    }
  });

  socket.on('offer', (payload: { to?: string; roomId: string; sdp: any }) => {
    if (payload.to) {
      io.to(payload.to).emit('offer', { ...payload, from: socket.id });
    } else {
      socket.to(payload.roomId).emit('offer', { ...payload, from: socket.id });
    }
  });

  socket.on('answer', (payload: { to?: string; roomId: string; sdp: any }) => {
    if (payload.to) {
      io.to(payload.to).emit('answer', { ...payload, from: socket.id });
    } else {
      socket.to(payload.roomId).emit('answer', { ...payload, from: socket.id });
    }
  });

  socket.on('ice-candidate', (payload: { to?: string; roomId: string; candidate: any }) => {
    if (payload.to) {
      io.to(payload.to).emit('ice-candidate', { ...payload, from: socket.id });
    } else {
      socket.to(payload.roomId).emit('ice-candidate', { ...payload, from: socket.id });
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

    if (socket.data.isHost && socket.data.roomId) {
      const roomId = socket.data.roomId;
      if (roomHosts.get(roomId) === socket.id) {
        console.log(`Host disconnected from room ${roomId}. Starting ${HOST_DISCONNECT_GRACE_MS / 1000}s grace period...`);

        const existingTimer = roomTerminationTimers.get(roomId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(async () => {
          roomTerminationTimers.delete(roomId);
          console.log(`Grace period expired for room ${roomId}. Terminating session.`);
          await terminateRoomSession(roomId, 'The host has left the studio.');
        }, HOST_DISCONNECT_GRACE_MS);

        roomTerminationTimers.set(roomId, timer);
      }
    }

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

httpServer.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
