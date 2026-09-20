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
const vitest_1 = require("vitest");
const prismaMock_1 = require("../test/prismaMock");
const auth_service_1 = require("./auth.service");
const hashUtil = __importStar(require("../utils/hash"));
(0, vitest_1.describe)('Auth Service', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('registerUser', () => {
        (0, vitest_1.it)('should throw 400 if password is less than 8 characters', async () => {
            await (0, vitest_1.expect)((0, auth_service_1.registerUser)('Short Pass', 'short@example.com', '1234567')).rejects.toEqual({
                status: 400,
                message: 'Password must be at least 8 characters long.',
            });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.user.findUnique).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should throw 409 if email already exists', async () => {
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce({
                id: 'user-1',
                email: 'test@example.com',
            });
            await (0, vitest_1.expect)((0, auth_service_1.registerUser)('Test User', 'test@example.com', 'password123')).rejects.toEqual({ status: 409, message: 'Email already exists' });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.user.create).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should hash password and create user when email is available', async () => {
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            prismaMock_1.mockPrisma.user.create.mockResolvedValueOnce({
                id: 'new-user-id',
                name: 'New User',
                email: 'new@example.com',
                password: 'hashed_password_xyz',
            });
            const user = await (0, auth_service_1.registerUser)('New User', 'new@example.com', 'plainpassword123');
            (0, vitest_1.expect)(user.id).toBe('new-user-id');
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.user.create).toHaveBeenCalled();
            const createCall = prismaMock_1.mockPrisma.user.create.mock.calls[0][0];
            (0, vitest_1.expect)(createCall.data.email).toBe('new@example.com');
            (0, vitest_1.expect)(createCall.data.password).not.toBe('plainpassword123');
        });
    });
    (0, vitest_1.describe)('loginUser', () => {
        (0, vitest_1.it)('should throw 401 if user not found (prevent user enumeration)', async () => {
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            await (0, vitest_1.expect)((0, auth_service_1.loginUser)('missing@example.com', 'validpassword123')).rejects.toEqual({
                status: 401,
                message: 'Invalid email or password.',
            });
        });
        (0, vitest_1.it)('should throw 401 if user account lacks password', async () => {
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce({
                id: 'google-user',
                email: 'google@example.com',
                password: null,
            });
            await (0, vitest_1.expect)((0, auth_service_1.loginUser)('google@example.com', 'validpassword123')).rejects.toEqual({
                status: 401,
                message: 'Invalid email or password.',
            });
        });
        (0, vitest_1.it)('should throw 401 on incorrect password', async () => {
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce({
                id: 'user-1',
                email: 'test@example.com',
                password: 'real_hashed_password',
            });
            vitest_1.vi.spyOn(hashUtil, 'comparePassword').mockResolvedValueOnce(false);
            await (0, vitest_1.expect)((0, auth_service_1.loginUser)('test@example.com', 'wrongpassword123')).rejects.toEqual({
                status: 401,
                message: 'Invalid email or password.',
            });
        });
        (0, vitest_1.it)('should return user record on successful password match', async () => {
            const userRecord = {
                id: 'user-1',
                name: 'Valid User',
                email: 'test@example.com',
                password: 'real_hashed_password',
            };
            prismaMock_1.mockPrisma.user.findUnique.mockResolvedValueOnce(userRecord);
            vitest_1.vi.spyOn(hashUtil, 'comparePassword').mockResolvedValueOnce(true);
            const result = await (0, auth_service_1.loginUser)('test@example.com', 'correctpassword');
            (0, vitest_1.expect)(result.id).toBe('user-1');
            (0, vitest_1.expect)(result.email).toBe('test@example.com');
        });
    });
    (0, vitest_1.describe)('getMe', () => {
        (0, vitest_1.it)('should return user profile using id or clerk_id query', async () => {
            const profile = {
                id: 'user-123',
                name: 'Profile User',
                email: 'profile@example.com',
                avatar_url: null,
                created_at: new Date(),
            };
            prismaMock_1.mockPrisma.user.findFirst.mockResolvedValueOnce(profile);
            const result = await (0, auth_service_1.getMe)('user-123');
            (0, vitest_1.expect)(result).toEqual(profile);
            (0, vitest_1.expect)(prismaMock_1.mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [{ id: 'user-123' }, { clerk_id: 'user-123' }],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar_url: true,
                    created_at: true,
                },
            });
        });
    });
});
