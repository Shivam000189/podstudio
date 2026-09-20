import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { mockPrisma } from '../test/prismaMock';
import * as authService from '../services/auth.service';
import { generateToken } from '../utils/jwt';

describe('Auth Routes (REST)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with token when registration succeeds', async () => {
      vi.spyOn(authService, 'registerUser').mockResolvedValueOnce({
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

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('john@example.com');
    });

    it('should return 409 when email already exists', async () => {
      vi.spyOn(authService, 'registerUser').mockRejectedValueOnce({
        status: 409,
        message: 'Email already exists',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'existing@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with JWT on valid credentials', async () => {
      vi.spyOn(authService, 'loginUser').mockResolvedValueOnce({
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

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user._id).toBe('user-123');
    });

    it('should return 401 on invalid credentials', async () => {
      vi.spyOn(authService, 'loginUser').mockRejectedValueOnce({
        status: 401,
        message: 'Invalid email or password.',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should return 200 with profile when valid bearer token is sent', async () => {
      const token = generateToken('user-123');

      vi.spyOn(authService, 'getMe').mockResolvedValueOnce({
        id: 'user-123',
        name: 'Authorized User',
        email: 'auth@example.com',
        avatar_url: null,
        created_at: new Date(),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('user-123');
    });
  });
});
