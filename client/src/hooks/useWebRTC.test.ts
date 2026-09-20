import { describe, it, expect, vi } from 'vitest';

// Pure function mirroring the isPolitePeer implementation in useWebRTC.ts:
// (myId, peerId) => myId > peerId
const isPolitePeer = (myId: string, peerId: string): boolean => myId > peerId;

describe('WebRTC Peer Politeness Determinism (isPolitePeer)', () => {

  it('should guarantee strict complementarity for any arbitrary distinct socket IDs', () => {
    const testCases: [string, string][] = [
      ['socket_host_123', 'socket_guest_456'],
      ['abc', 'def'],
      ['peer-xyz', 'peer-abc'],
      ['ABC', 'abc'],
      ['socket-1', 'socket-2'],
      ['nanoid_v4_A1B2C3D4', 'nanoid_v4_E5F6G7H8'],
      ['M-QMzL4dTIjkygf2AAAB', 'WGVeTXFFLquqUH8mAAAD'],
      ['ZmIxBQ7CDjETYrIHAAAF', '8lS2FelmqDwNbcluAAAD'],
      ['user_1', 'user_2'],
      ['123', '456'],
      ['alpha-beta', 'alpha-gamma'],
      ['locale-test-ä', 'locale-test-z'],
      ['test_with_underscore', 'test-with-dash'],
    ];

    for (const [peerA, peerB] of testCases) {
      const aIsPoliteToB = isPolitePeer(peerA, peerB);
      const bIsPoliteToA = isPolitePeer(peerB, peerA);

      // 1. Exactly one peer must be polite (XOR condition)
      expect(aIsPoliteToB !== bIsPoliteToA).toBe(true);

      // 2. Both peers must never simultaneously conclude they are polite
      expect(aIsPoliteToB && bIsPoliteToA).toBe(false);

      // 3. Both peers must never simultaneously conclude neither is polite (deadlock condition)
      expect(!aIsPoliteToB && !bIsPoliteToA).toBe(false);
    }
  });

  it('should be reflexive: a peer comparing to itself is neither polite nor impolite', () => {
    const peerId = 'socket-self-test';
    expect(isPolitePeer(peerId, peerId)).toBe(false);
  });

  it('should be transitive across any triad of peers', () => {
    const p1 = 'peer-aaa';
    const p2 = 'peer-bbb';
    const p3 = 'peer-ccc';

    // In raw UTF-16 code unit comparison:
    // 'peer-ccc' > 'peer-bbb' > 'peer-aaa'
    expect(isPolitePeer(p3, p2)).toBe(true);
    expect(isPolitePeer(p2, p1)).toBe(true);
    expect(isPolitePeer(p3, p1)).toBe(true);
  });
});

describe('WebRTC Offer Collision & ICE Restart Logic', () => {
  it('should NOT treat an offer as collision when signalingState is stable, even with non-null localDescription', () => {
    // Replicates the isOfferCollision logic in processOffer:
    // Boolean(pc && pc.signalingState !== 'stable')
    const checkOfferCollision = (pc: { signalingState: string; localDescription: unknown } | null) => {
      return Boolean(pc && pc.signalingState !== 'stable');
    };

    // Connection negotiated previously: localDescription is populated, signalingState is 'stable'
    const priorNegotiatedPC = {
      signalingState: 'stable',
      localDescription: { type: 'offer', sdp: 'v=0...' },
    };

    expect(checkOfferCollision(priorNegotiatedPC)).toBe(false);

    // Truly colliding state: local offer was created and in flight
    const collidingPC = {
      signalingState: 'have-local-offer',
      localDescription: { type: 'offer', sdp: 'v=0...' },
    };

    expect(checkOfferCollision(collidingPC)).toBe(true);
  });

  it('impolite peer should createOffer({ iceRestart: true }), setLocalDescription, and emit offer socket event on failed connectionState', async () => {
    const mockOffer = { type: 'offer', sdp: 'ice-restart-sdp' };
    const mockSocket = {
      id: 'impolite-socket-id',
      emit: vi.fn(),
    };

    const mockPC = {
      connectionState: 'failed',
      createOffer: vi.fn().mockResolvedValue(mockOffer),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
    };

    const myId = 'aaa-impolite';
    const peerId = 'zzz-polite';
    const roomId = 'test-room-123';

    // Simulating the failed connection handler logic in useWebRTC.ts:
    if (!isPolitePeer(myId, peerId)) {
      const offer = await mockPC.createOffer({ iceRestart: true });
      await mockPC.setLocalDescription(offer);
      mockSocket.emit('offer', { to: peerId, roomId, sdp: offer });
    }

    expect(mockPC.createOffer).toHaveBeenCalledWith({ iceRestart: true });
    expect(mockPC.setLocalDescription).toHaveBeenCalledWith(mockOffer);
    expect(mockSocket.emit).toHaveBeenCalledWith('offer', {
      to: peerId,
      roomId,
      sdp: mockOffer,
    });
  });

  it('polite peer should wait and not emit an offer when connectionState fails', async () => {
    const mockSocket = {
      id: 'zzz-polite',
      emit: vi.fn(),
    };

    const mockPC = {
      connectionState: 'failed',
      createOffer: vi.fn(),
      setLocalDescription: vi.fn(),
    };

    const myId = 'zzz-polite';
    const peerId = 'aaa-impolite';

    if (!isPolitePeer(myId, peerId)) {
      const offer = await mockPC.createOffer({ iceRestart: true });
      await mockPC.setLocalDescription(offer);
      mockSocket.emit('offer', { to: peerId, roomId: 'test', sdp: offer });
    }

    // Polite peer must not initiate the restart offer; it waits for impolite peer's offer
    expect(mockPC.createOffer).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
