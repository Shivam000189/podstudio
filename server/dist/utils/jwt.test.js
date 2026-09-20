"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jwt_1 = require("./jwt");
(0, vitest_1.describe)('JWT Utilities', () => {
    (0, vitest_1.it)('should generate a valid JWT token with userId payload', () => {
        const userId = 'user-12345';
        const token = (0, jwt_1.generateToken)(userId);
        (0, vitest_1.expect)(token).toBeDefined();
        (0, vitest_1.expect)(typeof token).toBe('string');
        const decoded = (0, jwt_1.verifyToken)(token);
        (0, vitest_1.expect)(decoded.userId).toBe(userId);
    });
    (0, vitest_1.it)('should throw an error when verifying a malformed token', () => {
        (0, vitest_1.expect)(() => (0, jwt_1.verifyToken)('invalid.token.here')).toThrow();
    });
    (0, vitest_1.it)('should throw an error when token signature does not match', () => {
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.wrongsignature';
        (0, vitest_1.expect)(() => (0, jwt_1.verifyToken)(fakeToken)).toThrow();
    });
});
