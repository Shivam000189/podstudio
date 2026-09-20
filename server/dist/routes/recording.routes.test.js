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
const prismaMock_1 = require("../test/prismaMock");
const jwt_1 = require("../utils/jwt");
const cloudinaryService = __importStar(require("../services/cloudinary.service"));
vitest_1.vi.mock('../services/cloudinary.service', () => ({
    uploadToCloudinary: vitest_1.vi.fn(),
    deleteFromCloudinary: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
(0, vitest_1.describe)('Recording Routes (REST)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    const authToken = (0, jwt_1.generateToken)('user-recorder-1');
    (0, vitest_1.describe)('GET /api/recordings', () => {
        (0, vitest_1.it)('should return 401 without auth', async () => {
            const res = await (0, supertest_1.default)(server_1.app).get('/api/recordings');
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('should return recordings for the user', async () => {
            const mockRecordings = [
                {
                    id: 'rec-1',
                    title: 'Podcast Episode 1',
                    videoUrl: 'https://cloudinary.com/video1.webm',
                    duration: 3600,
                    fileSize: 500000,
                    userId: 'user-recorder-1',
                    createdAt: new Date(),
                },
            ];
            prismaMock_1.mockPrisma.recording.findMany.mockResolvedValueOnce(mockRecordings);
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/recordings')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.count).toBe(1);
            (0, vitest_1.expect)(res.body.data[0].title).toBe('Podcast Episode 1');
        });
    });
    (0, vitest_1.describe)('PATCH /api/recordings/:id', () => {
        (0, vitest_1.it)('should reject empty title with 400', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .patch('/api/recordings/rec-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: '   ' });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.success).toBe(false);
        });
        (0, vitest_1.it)('should rename recording and return updated record', async () => {
            prismaMock_1.mockPrisma.recording.findFirst.mockResolvedValueOnce({
                id: 'rec-1',
                title: 'Old Title',
                userId: 'user-recorder-1',
            });
            prismaMock_1.mockPrisma.recording.update.mockResolvedValueOnce({
                id: 'rec-1',
                title: 'New Studio Session',
                userId: 'user-recorder-1',
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .patch('/api/recordings/rec-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'New Studio Session' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.data.title).toBe('New Studio Session');
        });
    });
    (0, vitest_1.describe)('DELETE /api/recordings/:id', () => {
        (0, vitest_1.it)('should return 404 if recording not found', async () => {
            prismaMock_1.mockPrisma.recording.findFirst.mockResolvedValueOnce(null);
            const res = await (0, supertest_1.default)(server_1.app)
                .delete('/api/recordings/nonexistent')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)('should delete from Cloudinary and database', async () => {
            prismaMock_1.mockPrisma.recording.findFirst.mockResolvedValueOnce({
                id: 'rec-1',
                videoUrl: 'https://res.cloudinary.com/cloud/video/upload/riverside-recordings/recording-1234.webm',
                userId: 'user-recorder-1',
            });
            prismaMock_1.mockPrisma.recording.delete.mockResolvedValueOnce({});
            const res = await (0, supertest_1.default)(server_1.app)
                .delete('/api/recordings/rec-1')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(cloudinaryService.deleteFromCloudinary).toHaveBeenCalledWith('riverside-recordings/recording-1234');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.recording.delete).toHaveBeenCalledWith({
                where: { id: 'rec-1' },
            });
        });
    });
});
