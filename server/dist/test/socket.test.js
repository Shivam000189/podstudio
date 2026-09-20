"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const socket_io_client_1 = require("socket.io-client");
const server_1 = require("../server");
const prismaMock_1 = require("./prismaMock");
const jwt_1 = require("../utils/jwt");
const guestToken_1 = require("../utils/guestToken");
(0, vitest_1.describe)('Socket.IO WebRTC Signaling & Room Engine', () => {
    let serverPort;
    let clientA;
    let clientB;
    const hostUserId = 'host-user-123';
    const roomCode = 'studio-rtc-test';
    const hostToken = (0, jwt_1.generateToken)(hostUserId);
    const guestToken = (0, guestToken_1.signGuestToken)({ roomCode, email: 'guest@example.com' });
    (0, vitest_1.beforeAll)(async () => {
        await new Promise((resolve) => {
            server_1.httpServer.listen(0, () => {
                serverPort = server_1.httpServer.address().port;
                resolve();
            });
        });
    });
    (0, vitest_1.afterAll)(async () => {
        if (clientA && clientA.connected)
            clientA.disconnect();
        if (clientB && clientB.connected)
            clientB.disconnect();
        await new Promise((resolve) => {
            server_1.httpServer.close(() => resolve());
        });
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should disconnect with auth-error if client joins without token', async () => {
        const unauthClient = (0, socket_io_client_1.io)(`http://localhost:${serverPort}`, {
            transports: ['websocket'],
        });
        const errorPromise = new Promise((resolve) => {
            unauthClient.on('auth-error', (err) => resolve(err));
        });
        unauthClient.emit('join-room', roomCode);
        const error = await errorPromise;
        (0, vitest_1.expect)(error.message).toContain('Authentication required');
        unauthClient.disconnect();
    });
    (0, vitest_1.it)('should allow host to join room and receive isHost: true', async () => {
        prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
            id: 'room-id-1',
            code: roomCode,
            createdBy: hostUserId,
            endedAt: null,
            participants: [hostUserId],
        });
        clientA = (0, socket_io_client_1.io)(`http://localhost:${serverPort}`, {
            auth: { token: hostToken },
            transports: ['websocket'],
        });
        const roomUsersPromise = new Promise((resolve) => {
            clientA.on('room-users', (data) => resolve(data));
        });
        clientA.emit('join-room', roomCode);
        const roomUsers = await roomUsersPromise;
        (0, vitest_1.expect)(roomUsers.isHost).toBe(true);
        (0, vitest_1.expect)(roomUsers.otherUsers).toEqual([]);
    });
    (0, vitest_1.it)('should allow guest to join and notify host with user-joined event', async () => {
        prismaMock_1.mockPrisma.room.findUnique.mockResolvedValueOnce({
            id: 'room-id-1',
            code: roomCode,
            createdBy: hostUserId,
            endedAt: null,
            participants: [hostUserId, 'guest@example.com'],
        });
        clientB = (0, socket_io_client_1.io)(`http://localhost:${serverPort}`, {
            auth: { token: guestToken },
            transports: ['websocket'],
        });
        const hostNoticePromise = new Promise((resolve) => {
            clientA.once('user-joined', (socketId) => resolve(socketId));
        });
        const guestRoomPromise = new Promise((resolve) => {
            clientB.once('room-users', (data) => resolve(data));
        });
        clientB.emit('join-room', roomCode);
        const [joinedSocketId, guestData] = await Promise.all([
            hostNoticePromise,
            guestRoomPromise,
        ]);
        (0, vitest_1.expect)(joinedSocketId).toBe(clientB.id);
        (0, vitest_1.expect)(guestData.isHost).toBe(false);
        (0, vitest_1.expect)(guestData.otherUsers).toContain(clientA.id);
    });
    (0, vitest_1.it)('should relay targeted WebRTC offer, answer, and ice-candidate', async () => {
        // 1. Host sends targeted offer to guest
        const offerPayload = {
            to: clientB.id,
            roomId: roomCode,
            sdp: { type: 'offer', sdp: 'fake-sdp-offer-data' },
        };
        const offerPromise = new Promise((resolve) => {
            clientB.once('offer', (data) => resolve(data));
        });
        clientA.emit('offer', offerPayload);
        const receivedOffer = await offerPromise;
        (0, vitest_1.expect)(receivedOffer.from).toBe(clientA.id);
        (0, vitest_1.expect)(receivedOffer.sdp.sdp).toBe('fake-sdp-offer-data');
        // 2. Guest sends targeted answer to host
        const answerPayload = {
            to: clientA.id,
            roomId: roomCode,
            sdp: { type: 'answer', sdp: 'fake-sdp-answer-data' },
        };
        const answerPromise = new Promise((resolve) => {
            clientA.once('answer', (data) => resolve(data));
        });
        clientB.emit('answer', answerPayload);
        const receivedAnswer = await answerPromise;
        (0, vitest_1.expect)(receivedAnswer.from).toBe(clientB.id);
        (0, vitest_1.expect)(receivedAnswer.sdp.sdp).toBe('fake-sdp-answer-data');
        // 3. Guest sends targeted ICE candidate to host
        const candidatePayload = {
            to: clientA.id,
            roomId: roomCode,
            candidate: { candidate: 'candidate:1 1 UDP 12345', sdpMid: '0' },
        };
        const icePromise = new Promise((resolve) => {
            clientA.once('ice-candidate', (data) => resolve(data));
        });
        clientB.emit('ice-candidate', candidatePayload);
        const receivedCandidate = await icePromise;
        (0, vitest_1.expect)(receivedCandidate.from).toBe(clientB.id);
        (0, vitest_1.expect)(receivedCandidate.candidate.candidate).toBe('candidate:1 1 UDP 12345');
    });
    (0, vitest_1.it)('should broadcast room-ended when host ends the room session', async () => {
        prismaMock_1.mockPrisma.room.updateMany.mockResolvedValueOnce({ count: 1 });
        const roomEndedPromise = new Promise((resolve) => {
            clientB.once('room-ended', (data) => resolve(data));
        });
        clientA.emit('end-room', { roomId: roomCode });
        const endedData = await roomEndedPromise;
        (0, vitest_1.expect)(endedData.reason).toBe('The host has ended the session.');
    });
});
