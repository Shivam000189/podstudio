import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { signGuestToken, verifyGuestToken } from './guestToken';

describe('Guest Token Utilities', () => {
  it('should sign and verify a scoped guest token', () => {
    const payload = {
      roomCode: 'room-abc-123',
      email: 'guest@example.com',
    };

    const token = signGuestToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = verifyGuestToken(token);
    expect(verified.roomCode).toBe(payload.roomCode);
    expect(verified.email).toBe(payload.email);
    expect(verified.type).toBe('guest');
  });

  it('should reject a malformed guest token', () => {
    expect(() => verifyGuestToken('malformed-token')).toThrow();
  });

  it('should reject a standard JWT token that lacks guest type claim', () => {
    const token = jwt.sign({ userId: '123' }, env.guestJwtSecret);
    expect(() => verifyGuestToken(token)).toThrow('Token is not a guest token');
  });
});
