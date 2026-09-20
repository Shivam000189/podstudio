import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import * as roomService from '../services/room.service';
import { generateToken } from '../utils/jwt';

describe('Room Routes (REST)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const authToken = generateToken('host-user-1');

  describe('POST /api/rooms/create', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/rooms/create');
      expect(res.status).toBe(401);
    });

    it('should create room and return 201 with room code', async () => {
      vi.spyOn(roomService, 'createRoom').mockResolvedValueOnce({
        id: 'room-uuid',
        code: 'studio99',
        createdBy: 'host-user-1',
        participants: [],
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/rooms/create')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.GenerateID).toBe('studio99');
      expect(res.body.data.code).toBe('studio99');
    });
  });

  describe('POST /api/rooms/:id/join (Join Room)', () => {
    it('should add participant and return room state', async () => {
      vi.spyOn(roomService, 'addParticipant').mockResolvedValueOnce({
        id: 'room-uuid',
        code: 'studio99',
        createdBy: 'host-user-1',
        participants: ['host-user-1'],
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/rooms/studio99/join')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roomId).toBe('studio99');
      expect(res.body.participantCount).toBe(1);
    });
  });

  describe('POST /api/rooms/:id/otp/request', () => {
    it('should reject invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/rooms/studio99/otp/request')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid email');
    });

    it('should accept valid email and return 200', async () => {
      vi.spyOn(roomService, 'requestOtp').mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/rooms/studio99/otp/request')
        .send({ email: 'guest@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verification code has been sent');
    });
  });

  describe('POST /api/rooms/:id/otp/verify', () => {
    it('should reject missing code or email with 400', async () => {
      const res = await request(app)
        .post('/api/rooms/studio99/otp/verify')
        .send({ email: 'guest@example.com' });

      expect(res.status).toBe(400);
    });

    it('should verify code and return scoped guestToken', async () => {
      vi.spyOn(roomService, 'verifyOtp').mockResolvedValueOnce({
        id: 'room-uuid',
        code: 'studio99',
        createdBy: 'host-user-1',
        participants: ['host-user-1', 'guest@example.com'],
        endedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/rooms/studio99/otp/verify')
        .send({ email: 'guest@example.com', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.guestToken).toBeDefined();
      expect(res.body.roomId).toBe('studio99');
    });
  });
});
