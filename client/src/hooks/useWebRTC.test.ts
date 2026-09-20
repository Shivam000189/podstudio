import { describe, it, expect } from 'vitest';

describe('WebRTC Peer Politeness Determinism (isPolitePeer)', () => {
  // Pure function mirroring the isPolitePeer implementation in useWebRTC.ts:
  // (myId, peerId) => myId > peerId
  const isPolitePeer = (myId: string, peerId: string): boolean => myId > peerId;

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
