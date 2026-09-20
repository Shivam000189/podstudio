import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { mockPrisma } from '../test/prismaMock';
import { generateToken } from '../utils/jwt';
import * as cloudinaryService from '../services/cloudinary.service';

vi.mock('../services/cloudinary.service', () => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn().mockResolvedValue(undefined),
}));

describe('Recording Routes (REST)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const authToken = generateToken('user-recorder-1');

  describe('GET /api/recordings', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/recordings');
      expect(res.status).toBe(401);
    });

    it('should return recordings for the user', async () => {
      const mockRecordings = [
        {
          id: 'rec-1',
          title: 'Podcast Episode 1',
          videoUrl: 'https://cloudinary.com/video1.webm',
          duration: 3600,
          fileSize: 500000,
          userId: 'user-recorder-1',
          createdAt: new Date(),
        },
      ];

      mockPrisma.recording.findMany.mockResolvedValueOnce(mockRecordings);

      const res = await request(app)
        .get('/api/recordings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Podcast Episode 1');
    });
  });

  describe('PATCH /api/recordings/:id', () => {
    it('should reject empty title with 400', async () => {
      const res = await request(app)
        .patch('/api/recordings/rec-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should rename recording and return updated record', async () => {
      mockPrisma.recording.findFirst.mockResolvedValueOnce({
        id: 'rec-1',
        title: 'Old Title',
        userId: 'user-recorder-1',
      });
      mockPrisma.recording.update.mockResolvedValueOnce({
        id: 'rec-1',
        title: 'New Studio Session',
        userId: 'user-recorder-1',
      });

      const res = await request(app)
        .patch('/api/recordings/rec-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Studio Session' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Studio Session');
    });
  });

  describe('DELETE /api/recordings/:id', () => {
    it('should return 404 if recording not found', async () => {
      mockPrisma.recording.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/api/recordings/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should delete from Cloudinary and database', async () => {
      mockPrisma.recording.findFirst.mockResolvedValueOnce({
        id: 'rec-1',
        videoUrl:
          'https://res.cloudinary.com/cloud/video/upload/riverside-recordings/recording-1234.webm',
        userId: 'user-recorder-1',
      });
      mockPrisma.recording.delete.mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/api/recordings/rec-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(cloudinaryService.deleteFromCloudinary).toHaveBeenCalledWith(
        'riverside-recordings/recording-1234'
      );
      expect(mockPrisma.recording.delete).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
      });
    });
  });
});
