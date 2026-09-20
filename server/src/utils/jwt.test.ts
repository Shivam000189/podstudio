import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from './jwt';

describe('JWT Utilities', () => {
  it('should generate a valid JWT token with userId payload', () => {
    const userId = 'user-12345';
    const token = generateToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(userId);
  });

  it('should throw an error when verifying a malformed token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('should throw an error when token signature does not match', () => {
    const fakeToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.wrongsignature';
    expect(() => verifyToken(fakeToken)).toThrow();
  });
});
