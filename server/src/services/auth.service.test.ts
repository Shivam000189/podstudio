import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../test/prismaMock';

import { registerUser, loginUser, getMe } from './auth.service';
import * as hashUtil from '../utils/hash';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should throw 400 if password is less than 8 characters', async () => {
      await expect(
        registerUser('Short Pass', 'short@example.com', '1234567')
      ).rejects.toEqual({
        status: 400,
        message: 'Password must be at least 8 characters long.',
      });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw 409 if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
      });

      await expect(
        registerUser('Test User', 'test@example.com', 'password123')
      ).rejects.toEqual({ status: 409, message: 'Email already exists' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password and create user when email is available', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed_password_xyz',
      });

      const user = await registerUser('New User', 'new@example.com', 'plainpassword123');

      expect(user.id).toBe('new-user-id');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('new@example.com');
      expect(createCall.data.password).not.toBe('plainpassword123');
    });
  });

  describe('loginUser', () => {
    it('should throw 401 if user not found (prevent user enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(loginUser('missing@example.com', 'validpassword123')).rejects.toEqual({
        status: 401,
        message: 'Invalid email or password.',
      });
    });

    it('should throw 401 if user account lacks password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'google-user',
        email: 'google@example.com',
        password: null,
      });

      await expect(loginUser('google@example.com', 'validpassword123')).rejects.toEqual({
        status: 401,
        message: 'Invalid email or password.',
      });
    });

    it('should throw 401 on incorrect password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        password: 'real_hashed_password',
      });

      vi.spyOn(hashUtil, 'comparePassword').mockResolvedValueOnce(false);

      await expect(loginUser('test@example.com', 'wrongpassword123')).rejects.toEqual({
        status: 401,
        message: 'Invalid email or password.',
      });
    });

    it('should return user record on successful password match', async () => {
      const userRecord = {
        id: 'user-1',
        name: 'Valid User',
        email: 'test@example.com',
        password: 'real_hashed_password',
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(userRecord);
      vi.spyOn(hashUtil, 'comparePassword').mockResolvedValueOnce(true);

      const result = await loginUser('test@example.com', 'correctpassword');
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('getMe', () => {
    it('should return user profile using id or clerk_id query', async () => {
      const profile = {
        id: 'user-123',
        name: 'Profile User',
        email: 'profile@example.com',
        avatar_url: null,
        created_at: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValueOnce(profile);

      const result = await getMe('user-123');
      expect(result).toEqual(profile);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
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
