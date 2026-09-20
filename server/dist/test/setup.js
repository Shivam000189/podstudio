"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mockPrisma = {
    user: {
        findUnique: vitest_1.vi.fn(),
        findFirst: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        upsert: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
    },
    room: {
        findUnique: vitest_1.vi.fn(),
        findFirst: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        updateMany: vitest_1.vi.fn(),
    },
    roomOtp: {
        findFirst: vitest_1.vi.fn(),
        findUnique: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        upsert: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        deleteMany: vitest_1.vi.fn(),
    },
    recording: {
        findMany: vitest_1.vi.fn(),
        findFirst: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
    },
    $transaction: vitest_1.vi.fn((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.resolve())),
};
vitest_1.vi.mock('../config/prisma', () => ({
    prisma: mockPrisma,
}));
vitest_1.vi.mock('@clerk/express', () => ({
    clerkMiddleware: () => (_req, _res, next) => next(),
    getAuth: () => ({ userId: null }),
}));
globalThis.__mockPrisma = mockPrisma;
