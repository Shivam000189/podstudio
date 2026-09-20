import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';
import { httpServer } from '../server';
import { mockPrisma } from './prismaMock';
import { generateToken } from '../utils/jwt';
import { signGuestToken } from '../utils/guestToken';
import type { AddressInfo } from 'net';

describe('Socket.IO WebRTC Signaling & Room Engine', () => {
  let serverPort: number;
  let clientA: Socket;
  let clientB: Socket;

  const hostUserId = 'host-user-123';
  const roomCode = 'studio-rtc-test';
  const hostToken = generateToken(hostUserId);
  const guestToken = signGuestToken({ roomCode, email: 'guest@example.com' });

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientA && clientA.connected) clientA.disconnect();
    if (clientB && clientB.connected) clientB.disconnect();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should disconnect with auth-error if client joins without token', async () => {
    const unauthClient = Client(`http://localhost:${serverPort}`, {
      transports: ['websocket'],
    });

    const errorPromise = new Promise<{ message: string }>((resolve) => {
      unauthClient.on('auth-error', (err) => resolve(err));
    });

    unauthClient.emit('join-room', roomCode);

    const error = await errorPromise;
    expect(error.message).toContain('Authentication required');
    unauthClient.disconnect();
  });

  it('should allow host to join room and receive isHost: true', async () => {
    mockPrisma.room.findUnique.mockResolvedValueOnce({
      id: 'room-id-1',
      code: roomCode,
      createdBy: hostUserId,
      endedAt: null,
      participants: [hostUserId],
    });

    clientA = Client(`http://localhost:${serverPort}`, {
      auth: { token: hostToken },
      transports: ['websocket'],
    });

    const roomUsersPromise = new Promise<{ otherUsers: string[]; isHost: boolean }>((resolve) => {
      clientA.on('room-users', (data) => resolve(data));
    });

    clientA.emit('join-room', roomCode);

    const roomUsers = await roomUsersPromise;
    expect(roomUsers.isHost).toBe(true);
    expect(roomUsers.otherUsers).toEqual([]);
  });

  it('should allow guest to join and notify host with user-joined event', async () => {
    mockPrisma.room.findUnique.mockResolvedValueOnce({
      id: 'room-id-1',
      code: roomCode,
      createdBy: hostUserId,
      endedAt: null,
      participants: [hostUserId, 'guest@example.com'],
    });

    clientB = Client(`http://localhost:${serverPort}`, {
      auth: { token: guestToken },
      transports: ['websocket'],
    });

    const hostNoticePromise = new Promise<string>((resolve) => {
      clientA.once('user-joined', (socketId) => resolve(socketId));
    });

    const guestRoomPromise = new Promise<{ otherUsers: string[]; isHost: boolean }>((resolve) => {
      clientB.once('room-users', (data) => resolve(data));
    });

    clientB.emit('join-room', roomCode);

    const [joinedSocketId, guestData] = await Promise.all([
      hostNoticePromise,
      guestRoomPromise,
    ]);

    expect(joinedSocketId).toBe(clientB.id);
    expect(guestData.isHost).toBe(false);
    expect(guestData.otherUsers).toContain(clientA.id);
  });

  it('should relay targeted WebRTC offer, answer, and ice-candidate', async () => {
    // 1. Host sends targeted offer to guest
    const offerPayload = {
      to: clientB.id,
      roomId: roomCode,
      sdp: { type: 'offer', sdp: 'fake-sdp-offer-data' },
    };

    const offerPromise = new Promise<{ from: string; sdp: any }>((resolve) => {
      clientB.once('offer', (data) => resolve(data));
    });

    clientA.emit('offer', offerPayload);
    const receivedOffer = await offerPromise;
    expect(receivedOffer.from).toBe(clientA.id);
    expect(receivedOffer.sdp.sdp).toBe('fake-sdp-offer-data');

    // 2. Guest sends targeted answer to host
    const answerPayload = {
      to: clientA.id,
      roomId: roomCode,
      sdp: { type: 'answer', sdp: 'fake-sdp-answer-data' },
    };

    const answerPromise = new Promise<{ from: string; sdp: any }>((resolve) => {
      clientA.once('answer', (data) => resolve(data));
    });

    clientB.emit('answer', answerPayload);
    const receivedAnswer = await answerPromise;
    expect(receivedAnswer.from).toBe(clientB.id);
    expect(receivedAnswer.sdp.sdp).toBe('fake-sdp-answer-data');

    // 3. Guest sends targeted ICE candidate to host
    const candidatePayload = {
      to: clientA.id,
      roomId: roomCode,
      candidate: { candidate: 'candidate:1 1 UDP 12345', sdpMid: '0' },
    };

    const icePromise = new Promise<{ from: string; candidate: any }>((resolve) => {
      clientA.once('ice-candidate', (data) => resolve(data));
    });

    clientB.emit('ice-candidate', candidatePayload);
    const receivedCandidate = await icePromise;
    expect(receivedCandidate.from).toBe(clientB.id);
    expect(receivedCandidate.candidate.candidate).toBe('candidate:1 1 UDP 12345');
  });

  it('should broadcast room-ended when host ends the room session', async () => {
    mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 1 });

    const roomEndedPromise = new Promise<{ reason: string }>((resolve) => {
      clientB.once('room-ended', (data) => resolve(data));
    });

    clientA.emit('end-room', { roomId: roomCode });

    const endedData = await roomEndedPromise;
    expect(endedData.reason).toBe('The host has ended the session.');
  });
});
