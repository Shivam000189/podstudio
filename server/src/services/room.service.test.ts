import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../test/prismaMock';


vi.mock('./email.service', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

import {
  createRoom,
  getRoomByCode,
  addParticipant,
  endRoom,
  requestOtp,
  verifyOtp,
} from './room.service';
import * as emailService from './email.service';
import bcrypt from 'bcrypt';

describe('Room Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create room with unique code', async () => {
      mockPrisma.room.create.mockResolvedValueOnce({
        id: 'room-1',
        code: 'abc123',
        createdBy: 'host-1',
        participants: [],
      });

      const room = await createRoom('host-1');
      expect(room.code).toBe('abc123');
      expect(mockPrisma.room.create).toHaveBeenCalled();
    });

    it('should retry if unique collision occurs (P2002)', async () => {
      mockPrisma.room.create
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValueOnce({
          id: 'room-2',
          code: 'def456',
          createdBy: 'host-1',
        });

      const room = await createRoom('host-1');
      expect(room.code).toBe('def456');
      expect(mockPrisma.room.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error after 5 collisions', async () => {
      mockPrisma.room.create.mockRejectedValue({ code: 'P2002' });

      await expect(createRoom('host-1')).rejects.toEqual({
        status: 500,
        message: 'Could not generate a unique room code, please try again',
      });
      expect(mockPrisma.room.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('getRoomByCode', () => {
    it('should return room if found', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({ code: 'code123' });
      const room = await getRoomByCode('code123');
      expect(room?.code).toBe('code123');
      expect(mockPrisma.room.findUnique).toHaveBeenCalledWith({ where: { code: 'code123' } });
    });
  });

  describe('addParticipant', () => {
    it('should throw 404 if room not found', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce(null);
      await expect(addParticipant('nonexistent', 'user-1')).rejects.toEqual({
        status: 404,
        message: 'Room not found',
      });
    });

    it('should return room without update if participant already present', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({
        code: 'room-1',
        participants: ['user-1'],
      });

      const room = await addParticipant('room-1', 'user-1');
      expect(room.participants).toContain('user-1');
      expect(mockPrisma.room.update).not.toHaveBeenCalled();
    });

    it('should push participant into array when not present', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({
        code: 'room-1',
        participants: ['host-1'],
      });
      mockPrisma.room.update.mockResolvedValueOnce({
        code: 'room-1',
        participants: ['host-1', 'guest-1'],
      });

      const room = await addParticipant('room-1', 'guest-1');
      expect(room.participants).toContain('guest-1');
      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { code: 'room-1' },
        data: { participants: { push: 'guest-1' } },
      });
    });
  });

  describe('endRoom', () => {
    it('should throw 404 if room does not exist', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce(null);
      await expect(endRoom('missing', 'user-1')).rejects.toEqual({
        status: 404,
        message: 'Room not found',
      });
    });

    it('should throw 403 if requester is not room creator', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({
        code: 'room-1',
        createdBy: 'host-1',
      });

      await expect(endRoom('room-1', 'intruder')).rejects.toEqual({
        status: 403,
        message: 'Only the room creator can end this room',
      });
    });

    it('should update endedAt when creator requests ending', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({
        code: 'room-1',
        createdBy: 'host-1',
      });
      mockPrisma.room.update.mockResolvedValueOnce({
        code: 'room-1',
        endedAt: new Date(),
      });

      const res = await endRoom('room-1', 'host-1');
      expect(res.endedAt).toBeDefined();
      expect(mockPrisma.room.update).toHaveBeenCalled();
    });
  });

  describe('requestOtp', () => {
    it('should throw 404 if room does not exist', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce(null);

      await expect(requestOtp('bad-code', 'guest@test.com')).rejects.toEqual({
        status: 404,
        message: 'Room not found',
      });
    });

    it('should save hashed OTP and dispatch email when room exists', async () => {
      mockPrisma.room.findUnique.mockResolvedValueOnce({ code: 'valid-room' });
      mockPrisma.roomOtp.upsert.mockResolvedValueOnce({});

      await requestOtp('valid-room', 'guest@test.com');

      expect(mockPrisma.roomOtp.upsert).toHaveBeenCalled();
      const upsertArg = mockPrisma.roomOtp.upsert.mock.calls[0][0];
      expect(upsertArg.where.roomCode_email).toEqual({
        roomCode: 'valid-room',
        email: 'guest@test.com',
      });
      expect(upsertArg.create.otpHash).toBeDefined();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'guest@test.com',
        expect.stringMatching(/^\d{6}$/)
      );
    });
  });

  describe('verifyOtp', () => {
    it('should throw 400 if no OTP record found', async () => {
      mockPrisma.roomOtp.findUnique.mockResolvedValueOnce(null);

      await expect(verifyOtp('room-1', 'guest@test.com', '123456')).rejects.toEqual({
        status: 400,
        message: 'No verification code found. Please request a new one.',
      });
    });

    it('should throw 400 and delete record if OTP is expired', async () => {
      mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
        id: 'otp-1',
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      });

      await expect(verifyOtp('room-1', 'guest@test.com', '123456')).rejects.toEqual({
        status: 400,
        message: 'Verification code has expired. Please request a new one.',
      });
      expect(mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
    });

    it('should throw 429 if attempts exceed limit (5)', async () => {
      mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
        id: 'otp-1',
        expiresAt: new Date(Date.now() + 60000),
      });
      mockPrisma.roomOtp.update.mockResolvedValueOnce({
        id: 'otp-1',
        attempts: 6, // Exceeded max
      });

      await expect(verifyOtp('room-1', 'guest@test.com', '123456')).rejects.toEqual({
        status: 429,
        message: 'Too many incorrect attempts. Please request a new code.',
      });
      expect(mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
    });

    it('should throw 400 with remaining attempts if code does not match', async () => {
      const hash = await bcrypt.hash('654321', 10);
      mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
        id: 'otp-1',
        otpHash: hash,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockPrisma.roomOtp.update.mockResolvedValueOnce({
        id: 'otp-1',
        attempts: 2,
      });

      await expect(verifyOtp('room-1', 'guest@test.com', '000000')).rejects.toEqual({
        status: 400,
        message: 'Invalid code. 3 attempts remaining.',
      });
    });

    it('should add participant and delete OTP on valid code match', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockPrisma.roomOtp.findUnique.mockResolvedValueOnce({
        id: 'otp-1',
        otpHash: hash,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockPrisma.roomOtp.update.mockResolvedValueOnce({
        id: 'otp-1',
        attempts: 1,
      });

      // addParticipant mocks
      mockPrisma.room.findUnique.mockResolvedValueOnce({
        code: 'room-1',
        participants: ['host-1'],
      });
      mockPrisma.room.update.mockResolvedValueOnce({
        code: 'room-1',
        participants: ['host-1', 'guest@test.com'],
      });

      const room = await verifyOtp('room-1', 'guest@test.com', '123456');

      expect(room.participants).toContain('guest@test.com');
      expect(mockPrisma.roomOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
    });
  });
});
