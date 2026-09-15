"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminateRoomSession = exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const express_2 = require("@clerk/express");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const recording_routes_1 = __importDefault(require("./routes/recording.routes"));
const guestToken_1 = require("./utils/guestToken");
const jwt_1 = require("./utils/jwt");
const prisma_1 = require("./config/prisma");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 4000;
app.use(express_1.default.json());
if (process.env.CLERK_SECRET_KEY || process.env.CLERK_PUBLISHABLE_KEY) {
    app.use((0, express_2.clerkMiddleware)());
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
    .flatMap((val) => val.split(","))
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
const isOriginAllowed = (origin) => {
    if (!origin)
        return true;
    const normalized = origin.replace(/\/$/, "");
    if (process.env.NODE_ENV !== "production" && localOrigins.includes(normalized)) {
        return true;
    }
    if (envOrigins.includes(normalized) || envOrigins.includes("*")) {
        return true;
    }
    return envOrigins.length === 0;
};
app.use((0, cors_1.default)((req, callback) => {
    const origin = req.header("Origin");
    if (isOriginAllowed(origin)) {
        return callback(null, { origin: true, credentials: true });
    }
    return callback(null, { origin: false, credentials: true });
}));
app.use(['/api/auth', '/auth'], auth_routes_1.default);
app.use(['/api/recordings', '/recordings'], recording_routes_1.default);
app.use(['/api', '/'], room_routes_1.default);
app.get(['/health', '/api/health', '/api', '/'], (_req, res) => {
    res.json({
        status: 'ok',
        service: 'PodStudio Recording API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
exports.io = new socket_io_1.Server(httpServer, {
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
const roomUsers = new Map();
const roomHosts = new Map();
const roomTerminationTimers = new Map();
const HOST_DISCONNECT_GRACE_MS = 15000;
const terminateRoomSession = async (roomId, reason) => {
    const pendingTimer = roomTerminationTimers.get(roomId);
    if (pendingTimer) {
        clearTimeout(pendingTimer);
        roomTerminationTimers.delete(roomId);
    }
    try {
        await prisma_1.prisma.room.updateMany({
            where: { code: roomId, endedAt: null },
            data: { endedAt: new Date() },
        });
        console.log(`Room ${roomId} marked as ended: ${reason}`);
    }
    catch (err) {
        console.error(`Error terminating room ${roomId}:`, err);
    }
    exports.io.to(roomId).emit('room-ended', { reason });
    roomHosts.delete(roomId);
    roomUsers.delete(roomId);
};
exports.terminateRoomSession = terminateRoomSession;
exports.io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join-room', async (roomId) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            console.warn(`Socket ${socket.id} tried to join ${roomId} with no token`);
            socket.emit('auth-error', { message: 'Authentication required to join a room.' });
            socket.disconnect(true);
            return;
        }
        try {
            const room = await prisma_1.prisma.room.findUnique({ where: { code: roomId } });
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
                const guestPayload = (0, guestToken_1.verifyGuestToken)(token);
                if (guestPayload.roomCode !== roomId) {
                    socket.emit('auth-error', { message: 'Token is not valid for this room.' });
                    socket.disconnect(true);
                    return;
                }
                isHost = false;
                participantIdentifier = guestPayload.email;
            }
            catch {
                try {
                    const userPayload = (0, jwt_1.verifyToken)(token);
                    participantIdentifier = userPayload.userId;
                    if (room.createdBy === userPayload.userId) {
                        isHost = true;
                    }
                }
                catch {
                    try {
                        const parts = token.split(".");
                        if (parts.length === 3) {
                            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
                            if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.startsWith("user_")) {
                                throw new Error("Not a Clerk token");
                            }
                            const dbUser = await prisma_1.prisma.user.findFirst({
                                where: { clerk_id: payload.sub },
                            });
                            if (dbUser) {
                                participantIdentifier = dbUser.id;
                                if (room.createdBy === dbUser.id) {
                                    isHost = true;
                                }
                            }
                            else {
                                participantIdentifier = payload.sub;
                            }
                        }
                        else {
                            throw new Error("Invalid token format");
                        }
                    }
                    catch {
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
            }
            else {
                console.log(`Guest/Participant ${socket.id} (${participantIdentifier}) joined room ${roomId}`);
            }
            socket.join(roomId);
            if (!roomUsers.has(roomId)) {
                roomUsers.set(roomId, new Set());
            }
            roomUsers.get(roomId).add(socket.id);
            socket.to(roomId).emit('user-joined', socket.id);
            const otherUsers = Array.from(roomUsers.get(roomId)).filter(id => id !== socket.id);
            socket.emit('room-users', { otherUsers, isHost });
        }
        catch (err) {
            console.error('Error during room join:', err);
            socket.emit('auth-error', { message: 'An error occurred while joining the room.' });
            socket.disconnect(true);
        }
    });
    socket.on('end-room', async (payload) => {
        const targetRoomId = payload?.roomId || socket.data.roomId;
        if (targetRoomId && (socket.data.isHost || roomHosts.get(targetRoomId) === socket.id)) {
            console.log(`Host ${socket.id} explicitly ended room ${targetRoomId}`);
            await (0, exports.terminateRoomSession)(targetRoomId, 'The host has ended the session.');
        }
    });
    socket.on('offer', (payload) => {
        if (payload.to) {
            exports.io.to(payload.to).emit('offer', { ...payload, from: socket.id });
        }
        else {
            socket.to(payload.roomId).emit('offer', { ...payload, from: socket.id });
        }
    });
    socket.on('answer', (payload) => {
        if (payload.to) {
            exports.io.to(payload.to).emit('answer', { ...payload, from: socket.id });
        }
        else {
            socket.to(payload.roomId).emit('answer', { ...payload, from: socket.id });
        }
    });
    socket.on('ice-candidate', (payload) => {
        if (payload.to) {
            exports.io.to(payload.to).emit('ice-candidate', { ...payload, from: socket.id });
        }
        else {
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
                    await (0, exports.terminateRoomSession)(roomId, 'The host has left the studio.');
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
