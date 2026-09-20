"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const guestToken_1 = require("./guestToken");
(0, vitest_1.describe)('Guest Token Utilities', () => {
    (0, vitest_1.it)('should sign and verify a scoped guest token', () => {
        const payload = {
            roomCode: 'room-abc-123',
            email: 'guest@example.com',
        };
        const token = (0, guestToken_1.signGuestToken)(payload);
        (0, vitest_1.expect)(token).toBeDefined();
        (0, vitest_1.expect)(typeof token).toBe('string');
        const verified = (0, guestToken_1.verifyGuestToken)(token);
        (0, vitest_1.expect)(verified.roomCode).toBe(payload.roomCode);
        (0, vitest_1.expect)(verified.email).toBe(payload.email);
        (0, vitest_1.expect)(verified.type).toBe('guest');
    });
    (0, vitest_1.it)('should reject a malformed guest token', () => {
        (0, vitest_1.expect)(() => (0, guestToken_1.verifyGuestToken)('malformed-token')).toThrow();
    });
    (0, vitest_1.it)('should reject a standard JWT token that lacks guest type claim', () => {
        const token = jsonwebtoken_1.default.sign({ userId: '123' }, env_1.env.guestJwtSecret);
        (0, vitest_1.expect)(() => (0, guestToken_1.verifyGuestToken)(token)).toThrow('Token is not a guest token');
    });
});
