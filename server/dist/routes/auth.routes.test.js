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
const authService = __importStar(require("../services/auth.service"));
const jwt_1 = require("../utils/jwt");
(0, vitest_1.describe)('Auth Routes (REST)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('POST /api/auth/register', () => {
        (0, vitest_1.it)('should return 201 with token when registration succeeds', async () => {
            vitest_1.vi.spyOn(authService, 'registerUser').mockResolvedValueOnce({
                id: 'new-user-1',
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedpassword',
                clerk_id: null,
                avatar_url: null,
                email_verfied_at: new Date(),
                created_at: new Date(),
                update_at: new Date(),
                deleted_at: null,
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/register')
                .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.token).toBeDefined();
            (0, vitest_1.expect)(res.body.user.email).toBe('john@example.com');
        });
        (0, vitest_1.it)('should return 409 when email already exists', async () => {
            vitest_1.vi.spyOn(authService, 'registerUser').mockRejectedValueOnce({
                status: 409,
                message: 'Email already exists',
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/register')
                .send({ name: 'John Doe', email: 'existing@example.com', password: 'password123' });
            (0, vitest_1.expect)(res.status).toBe(409);
            (0, vitest_1.expect)(res.body.success).toBe(false);
            (0, vitest_1.expect)(res.body.message).toBe('Email already exists');
        });
    });
    (0, vitest_1.describe)('POST /api/auth/login', () => {
        (0, vitest_1.it)('should return 200 with JWT on valid credentials', async () => {
            vitest_1.vi.spyOn(authService, 'loginUser').mockResolvedValueOnce({
                id: 'user-123',
                name: 'Logged In User',
                email: 'login@example.com',
                password: 'hashedpassword',
                clerk_id: null,
                avatar_url: null,
                email_verfied_at: new Date(),
                created_at: new Date(),
                update_at: new Date(),
                deleted_at: null,
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/login')
                .send({ email: 'login@example.com', password: 'password123' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.token).toBeDefined();
            (0, vitest_1.expect)(res.body.user._id).toBe('user-123');
        });
        (0, vitest_1.it)('should return 401 on invalid credentials', async () => {
            vitest_1.vi.spyOn(authService, 'loginUser').mockRejectedValueOnce({
                status: 401,
                message: 'Invalid email or password.',
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/login')
                .send({ email: 'login@example.com', password: 'wrongpassword' });
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('GET /api/auth/me', () => {
        (0, vitest_1.it)('should return 401 when no token is provided', async () => {
            const res = await (0, supertest_1.default)(server_1.app).get('/api/auth/me');
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.message).toContain('Unauthorized');
        });
        (0, vitest_1.it)('should return 200 with profile when valid bearer token is sent', async () => {
            const token = (0, jwt_1.generateToken)('user-123');
            vitest_1.vi.spyOn(authService, 'getMe').mockResolvedValueOnce({
                id: 'user-123',
                name: 'Authorized User',
                email: 'auth@example.com',
                avatar_url: null,
                created_at: new Date(),
            });
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.success).toBe(true);
            (0, vitest_1.expect)(res.body.data._id).toBe('user-123');
        });
        (0, vitest_1.it)('regression: should reject raw user_ attacker token with 401', async () => {
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer user_someoneElsesId');
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.message).toContain('Unauthorized');
        });
        (0, vitest_1.it)('regression: should reject forged unsigned JWT with sub claim with 401', async () => {
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({ sub: 'user_someoneElsesId' })).toString('base64url');
            const forgedToken = `${header}.${payload}.unsignedGarbageSignature`;
            const res = await (0, supertest_1.default)(server_1.app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${forgedToken}`);
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body.message).toContain('Unauthorized');
        });
    });
});
