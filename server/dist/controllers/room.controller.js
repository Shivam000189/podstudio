"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.endRoom = exports.joinRoom = exports.createRoom = void 0;
const roomService = __importStar(require("../services/room.service"));
// POST /api/rooms/create - requires auth, so every room has a real owner
const createRoom = async (req, res) => {
    try {
        const userId = req.userId;
        const room = await roomService.createRoom(userId);
        // Keep "GenerateID" as the top-level field: the client
        // (Home.tsx) already reads response.data.GenerateID directly.
        res.status(201).json({
            success: true,
            GenerateID: room.code,
            data: room,
        });
    }
    catch (error) {
        console.error("Create room error:", error);
        res
            .status(error.status || 500)
            .json({ success: false, message: error.message || "Failed to create room" });
    }
};
exports.createRoom = createRoom;
// GET /api/rooms/:id - left open (no authMiddleware) so invited guests
// without an account can still join via the shared link.
const joinRoom = async (req, res) => {
    try {
        const code = req.params.id;
        const headerUserId = req.headers["x-user-id"];
        const participantId = (Array.isArray(headerUserId) ? headerUserId[0] : headerUserId) ||
            `guest_${Math.random().toString(36).slice(2, 7)}`;
        const room = await roomService.addParticipant(code, participantId);
        res.json({
            success: true,
            roomId: room.code,
            participants: room.participants,
            participantCount: room.participants.length,
        });
    }
    catch (error) {
        res
            .status(error.status || 500)
            .json({ success: false, message: error.message || "Failed to join room" });
    }
};
exports.joinRoom = joinRoom;
// PATCH /api/rooms/:id/end - only the creator can close out a room
const endRoom = async (req, res) => {
    try {
        const code = req.params.id;
        const userId = req.userId;
        const room = await roomService.endRoom(code, userId);
        res.json({ success: true, message: "Room ended", data: room });
    }
    catch (error) {
        res
            .status(error.status || 500)
            .json({ success: false, message: error.message || "Failed to end room" });
    }
};
exports.endRoom = endRoom;
