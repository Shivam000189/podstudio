"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.requestOtp = exports.endRoom = exports.addParticipant = exports.getRoomByCode = exports.createRoom = void 0;
const nanoid_1 = require("nanoid");
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const email_service_1 = require("./email.service");
const generateCode = (0, nanoid_1.customAlphabet)("abcdefghijklmnopqrstuvwxyz0123456789", 6);
const MAX_CODE_ATTEMPTS = 5;
const createRoom = async (createdBy) => {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
        const code = generateCode();
        try {
            return await prisma_1.prisma.room.create({
                data: { code, createdBy },
            });
        }
        catch (error) {
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
const requestOtp = async (roomCode, email) => {
    const room = await (0, exports.getRoomByCode)(roomCode);
    if (!room) {
        throw { status: 404, message: "Room not found" };
    }
    const code = crypto_1.default.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt_1.default.hash(code, 10);
    const expiresAt = new Date(Date.now() + env_1.env.otpExpiryMinutes * 60 * 1000);
    await prisma_1.prisma.roomOtp.upsert({
        where: { roomCode_email: { roomCode, email } },
        create: { roomCode, email, otpHash, expiresAt, attempts: 0 },
        update: { otpHash, expiresAt, attempts: 0 },
    });
    await (0, email_service_1.sendOtpEmail)(email, code);
};
exports.requestOtp = requestOtp;
const verifyOtp = async (roomCode, email, code) => {
    const otp = await prisma_1.prisma.roomOtp.findUnique({
        where: { roomCode_email: { roomCode, email } },
    });
    if (!otp) {
        throw { status: 400, message: "No verification code found. Please request a new one." };
    }
    if (new Date() > otp.expiresAt) {
        await prisma_1.prisma.roomOtp.delete({ where: { id: otp.id } });
        throw { status: 400, message: "Verification code has expired. Please request a new one." };
    }
    const updatedOtp = await prisma_1.prisma.roomOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
    });
    if (updatedOtp.attempts > env_1.env.otpMaxAttempts) {
        await prisma_1.prisma.roomOtp.delete({ where: { id: otp.id } });
        throw {
            status: 429,
            message: "Too many incorrect attempts. Please request a new code.",
        };
    }
    const isValid = await bcrypt_1.default.compare(code, otp.otpHash);
    if (!isValid) {
        const remaining = env_1.env.otpMaxAttempts - updatedOtp.attempts;
        throw {
            status: 400,
            message: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        };
    }
    const room = await (0, exports.addParticipant)(roomCode, email);
    await prisma_1.prisma.roomOtp.delete({ where: { id: otp.id } });
    return room;
};
exports.verifyOtp = verifyOtp;
