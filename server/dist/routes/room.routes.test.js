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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const roomService = __importStar(require("../services/room.service"));
const jwt_1 = require("../utils/jwt");
(0, vitest_1.describe)('Room Routes (REST)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    const authToken = (0, jwt_1.generateToken)('host-user-1');
    (0, vitest_1.describe)('POST /api/rooms/create', () => {
        (0, vitest_1.it)('should return 401 without auth token', async () => {
            const res = await (0, supertest_1.default)(server_1.app).post('/api/rooms/create');
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should create room and return 201 with room code', async () => {
            vitest_1.vi.spyOn(roomService, 'createRoom').mockResolvedValueOnce({
                id: 'room-uuid',
                code: 'studio99',
                createdBy: 'host-user-1',
                participants: [],
                endedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/create')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.GenerateID).toBe('studio99');
            (0, vitest_1.expect)(res.body.data.code).toBe('studio99');
        });
    });
    (0, vitest_1.describe)('POST /api/rooms/:id/join (Join Room)', () => {
        (0, vitest_1.it)('should add participant and return room state', async () => {
            vitest_1.vi.spyOn(roomService, 'addParticipant').mockResolvedValueOnce({
                id: 'room-uuid',
                code: 'studio99',
                createdBy: 'host-user-1',
                participants: ['host-user-1'],
                endedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/studio99/join')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.roomId).toBe('studio99');
            (0, vitest_1.expect)(res.body.participantCount).toBe(1);
        });
    });
    (0, vitest_1.describe)('POST /api/rooms/:id/otp/request', () => {
        (0, vitest_1.it)('should reject invalid email with 400', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/studio99/otp/request')
                .send({ email: 'not-an-email' });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.success).toBe(false);
            (0, vitest_1.expect)(res.body.message).toContain('valid email');
        });
        (0, vitest_1.it)('should accept valid email and return 200', async () => {
            vitest_1.vi.spyOn(roomService, 'requestOtp').mockResolvedValueOnce(undefined);
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/studio99/otp/request')
                .send({ email: 'guest@example.com' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.message).toContain('verification code has been sent');
        });
    });
    (0, vitest_1.describe)('POST /api/rooms/:id/otp/verify', () => {
        (0, vitest_1.it)('should reject missing code or email with 400', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/studio99/otp/verify')
                .send({ email: 'guest@example.com' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('should verify code and return scoped guestToken', async () => {
            vitest_1.vi.spyOn(roomService, 'verifyOtp').mockResolvedValueOnce({
                id: 'room-uuid',
                code: 'studio99',
                createdBy: 'host-user-1',
                participants: ['host-user-1', 'guest@example.com'],
                endedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/rooms/studio99/otp/verify')
                .send({ email: 'guest@example.com', code: '123456' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.guestToken).toBeDefined();
            (0, vitest_1.expect)(res.body.roomId).toBe('studio99');
        });
    });
});
