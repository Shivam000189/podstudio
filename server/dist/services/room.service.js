"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endRoom = exports.addParticipant = exports.getRoomByCode = exports.createRoom = void 0;
const nanoid_1 = require("nanoid");
const prisma_1 = require("../config/prisma");
const generateCode = (0, nanoid_1.customAlphabet)("abcdefghijklmnopqrstuvwxyz0123456789", 6);
const MAX_CODE_ATTEMPTS = 5;
// Creates a room owned by an authenticated user, retrying on the
// (rare) chance the generated 6-char code already exists.
const createRoom = async (createdBy) => {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
        const code = generateCode();
        try {
            return await prisma_1.prisma.room.create({
                data: { code, createdBy },
            });
        }
        catch (error) {
            // Prisma unique-constraint violation -> code collision, try again
            if (error.code === "P2002")
                continue;
            throw error;
        }
    }
    throw { status: 500, message: "Could not generate a unique room code, please try again" };
};
exports.createRoom = createRoom;
const getRoomByCode = async (code) => {
    return prisma_1.prisma.room.findUnique({ where: { code } });
};
exports.getRoomByCode = getRoomByCode;
// Adds a participant (userId or guest id) to a room's participant list.
// Throws a 404-shaped error if the room doesn't exist so controllers
// can respond consistently.
const addParticipant = async (code, participantId) => {
    const room = await prisma_1.prisma.room.findUnique({ where: { code } });
    if (!room) {
        throw { status: 404, message: "Room not found" };
    }
    if (room.participants.includes(participantId)) {
        return room;
    }
    return prisma_1.prisma.room.update({
        where: { code },
        data: { participants: { push: participantId } },
    });
};
exports.addParticipant = addParticipant;
const endRoom = async (code, requesterId) => {
    const room = await prisma_1.prisma.room.findUnique({ where: { code } });
    if (!room) {
        throw { status: 404, message: "Room not found" };
    }
    if (room.createdBy !== requesterId) {
        throw { status: 403, message: "Only the room creator can end this room" };
    }
    return prisma_1.prisma.room.update({
        where: { code },
        data: { endedAt: new Date() },
    });
};
exports.endRoom = endRoom;
