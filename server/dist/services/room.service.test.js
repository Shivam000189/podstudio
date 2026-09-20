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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const prismaMock_1 = require("../test/prismaMock");
vitest_1.vi.mock('./email.service', () => ({
    sendOtpEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const room_service_1 = require("./room.service");
const emailService = __importStar(require("./email.service"));
const bcrypt_1 = __importDefault(require("bcrypt"));
(0, vitest_1.describe)('Room Service', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('createRoom', () => {
        (0, vitest_1.it)('should create room with unique code', async () => {
            prismaMock_1.mockPrisma.room.create.mockResolvedValueOnce({
                id: 'room-1',
                code: 'abc123',
                createdBy: 'host-1',
                participants: [],
            });
            const room = await (0, room_service_1.createRoom)('host-1');
            (0, vitest_1.expect)(room.code).toBe('abc123');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.create).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should retry if unique collision occurs (P2002)', async () => {
            prismaMock_1.mockPrisma.room.create
                .mockRejectedValueOnce({ code: 'P2002' })
                .mockResolvedValueOnce({
                id: 'room-2',
                code: 'def456',
                createdBy: 'host-1',
            });
            const room = await (0, room_service_1.createRoom)('host-1');
            (0, vitest_1.expect)(room.code).toBe('def456');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.create).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should throw error after 5 collisions', async () => {
            prismaMock_1.mockPrisma.room.create.mockRejectedValue({ code: 'P2002' });
            await (0, vitest_1.expect)((0, room_service_1.createRoom)('host-1')).rejects.toEqual({
                status: 500,
                message: 'Could not generate a unique room code, please try again',
            });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.create).toHaveBeenCalledTimes(5);
        });
    });
    (0, vitest_1.describe)('getRoomByCode', () => {
        (0, vitest_1.it)('should return room if found', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({ code: 'code123' });
            const room = await (0, room_service_1.getRoomByCode)('code123');
            (0, vitest_1.expect)(room?.code).toBe('code123');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.findUnique).toHaveBeenCalledWith({ where: { code: 'code123' } });
        });
    });
    (0, vitest_1.describe)('addParticipant', () => {
        (0, vitest_1.it)('should throw 404 if room not found', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, room_service_1.addParticipant)('nonexistent', 'user-1')).rejects.toEqual({
                status: 404,
                message: 'Room not found',
            });
        });
        (0, vitest_1.it)('should return room without update if participant already present', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
                code: 'room-1',
                participants: ['user-1'],
            });
            const room = await (0, room_service_1.addParticipant)('room-1', 'user-1');
            (0, vitest_1.expect)(room.participants).toContain('user-1');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.update).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should push participant into array when not present', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
                code: 'room-1',
                participants: ['host-1'],
            });
            prismaMock_1.mockPrisma.room.update.mockResolvedValueOnce({
                code: 'room-1',
                participants: ['host-1', 'guest-1'],
            });
            const room = await (0, room_service_1.addParticipant)('room-1', 'guest-1');
            (0, vitest_1.expect)(room.participants).toContain('guest-1');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.update).toHaveBeenCalledWith({
                where: { code: 'room-1' },
                data: { participants: { push: 'guest-1' } },
            });
        });
    });
    (0, vitest_1.describe)('endRoom', () => {
        (0, vitest_1.it)('should throw 404 if room does not exist', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, room_service_1.endRoom)('missing', 'user-1')).rejects.toEqual({
                status: 404,
                message: 'Room not found',
            });
        });
        (0, vitest_1.it)('should throw 403 if requester is not room creator', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
                code: 'room-1',
                createdBy: 'host-1',
            });
            await (0, vitest_1.expect)((0, room_service_1.endRoom)('room-1', 'intruder')).rejects.toEqual({
                status: 403,
                message: 'Only the room creator can end this room',
            });
        });
        (0, vitest_1.it)('should update endedAt when creator requests ending', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
                code: 'room-1',
                createdBy: 'host-1',
            });
            prismaMock_1.mockPrisma.room.update.mockResolvedValueOnce({
                code: 'room-1',
                endedAt: new Date(),
            });
            const res = await (0, room_service_1.endRoom)('room-1', 'host-1');
            (0, vitest_1.expect)(res.endedAt).toBeDefined();
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.room.update).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('requestOtp', () => {
        (0, vitest_1.it)('should throw 404 if room does not exist', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, room_service_1.requestOtp)('bad-code', 'guest@test.com')).rejects.toEqual({
                status: 404,
                message: 'Room not found',
            });
        });
        (0, vitest_1.it)('should save hashed OTP and dispatch email when room exists', async () => {
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({ code: 'valid-room' });
            prismaMock_1.mockPrisma.roomOtp.upsert.mockResolvedValueOnce({});
            await (0, room_service_1.requestOtp)('valid-room', 'guest@test.com');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.roomOtp.upsert).toHaveBeenCalled();
            const upsertArg = prismaMock_1.mockPrisma.roomOtp.upsert.mock.calls[0][0];
            (0, vitest_1.expect)(upsertArg.where.roomCode_email).toEqual({
                roomCode: 'valid-room',
                email: 'guest@test.com',
            });
            (0, vitest_1.expect)(upsertArg.create.otpHash).toBeDefined();
            (0, vitest_1.expect)(emailService.sendOtpEmail).toHaveBeenCalledWith('guest@test.com', vitest_1.expect.stringMatching(/^\d{6}$/));
        });
    });
    (0, vitest_1.describe)('verifyOtp', () => {
        (0, vitest_1.it)('should throw 400 if no OTP record found', async () => {
            prismaMock_1.mockPrisma.roomOtp.findUnique.mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, room_service_1.verifyOtp)('room-1', 'guest@test.com', '123456')).rejects.toEqual({
                status: 400,
                message: 'No verification code found. Please request a new one.',
            });
        });
        (0, vitest_1.it)('should throw 400 and delete record if OTP is expired', async () => {
            prismaMock_1.mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
                id: 'otp-1',
                expiresAt: new Date(Date.now() - 60000), // 1 minute ago
            });
            await (0, vitest_1.expect)((0, room_service_1.verifyOtp)('room-1', 'guest@test.com', '123456')).rejects.toEqual({
                status: 400,
                message: 'Verification code has expired. Please request a new one.',
            });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
        });
        (0, vitest_1.it)('should throw 429 if attempts exceed limit (5)', async () => {
            prismaMock_1.mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
                id: 'otp-1',
                expiresAt: new Date(Date.now() + 60000),
            });
            prismaMock_1.mockPrisma.roomOtp.update.mockResolvedValueOnce({
                id: 'otp-1',
                attempts: 6, // Exceeded max
            });
            await (0, vitest_1.expect)((0, room_service_1.verifyOtp)('room-1', 'guest@test.com', '123456')).rejects.toEqual({
                status: 429,
                message: 'Too many incorrect attempts. Please request a new code.',
            });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
        });
        (0, vitest_1.it)('should throw 400 with remaining attempts if code does not match', async () => {
            const hash = await bcrypt_1.default.hash('654321', 10);
            prismaMock_1.mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
                id: 'otp-1',
                otpHash: hash,
                expiresAt: new Date(Date.now() + 60000),
            });
            prismaMock_1.mockPrisma.roomOtp.update.mockResolvedValueOnce({
                id: 'otp-1',
                attempts: 2,
            });
            await (0, vitest_1.expect)((0, room_service_1.verifyOtp)('room-1', 'guest@test.com', '000000')).rejects.toEqual({
                status: 400,
                message: 'Invalid code. 3 attempts remaining.',
            });
        });
        (0, vitest_1.it)('should add participant and delete OTP on valid code match', async () => {
            const hash = await bcrypt_1.default.hash('123456', 10);
            prismaMock_1.mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
                id: 'otp-1',
                otpHash: hash,
                expiresAt: new Date(Date.now() + 60000),
            });
            prismaMock_1.mockPrisma.roomOtp.update.mockResolvedValueOnce({
                id: 'otp-1',
                attempts: 1,
            });
            // addParticipant mocks
            prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
                code: 'room-1',
                participants: ['host-1'],
            });
            prismaMock_1.mockPrisma.room.update.mockResolvedValueOnce({
                code: 'room-1',
                participants: ['host-1', 'guest@test.com'],
            });
            const room = await (0, room_service_1.verifyOtp)('room-1', 'guest@test.com', '123456');
            (0, vitest_1.expect)(room.participants).toContain('guest@test.com');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
        });
    });
});
