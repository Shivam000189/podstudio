Fix a WebRTC negotiation deadlock in client/src/hooks/useWebRTC.ts.

The isPolitePeer() function currently decides who initiates the WebRTC
offer using String.prototype.localeCompare():

  const isPolitePeer = useCallback((peerId: string) => {
    const myId = socket?.id || '';
    return myId.localeCompare(peerId) > 0;
  }, [socket]);

localeCompare() uses locale-aware ICU collation, which can differ between
browsers/OSes. This means two peers running in different browsers can each
independently conclude they are the "polite" peer for the same pair,
causing BOTH sides to wait forever for an offer that neither ever sends —
a permanent negotiation deadlock. This matches an observed bug where a
client's console shows "Polite peer X waiting for offer from Y" for every
peer, with no corresponding "Received offer from Y" ever logging, and the
user only ever sees their own video.

Fix: replace the locale-aware comparison with plain JavaScript string
comparison operators, which compare raw UTF-16 code units and are
guaranteed identical and deterministic across every JS engine/browser:

  const isPolitePeer = useCallback((peerId: string) => {
    const myId = socket?.id || '';
    return myId > peerId;
  }, [socket]);

After making this change:
1. Also double check processOffer() and the "create offer" effect in the
   same file still work correctly with this comparison (they call
   isPolitePeer(peerId) the same way, so no other changes should be
   needed, but verify).
2. Add a unit test for isPolitePeer (or an integration test) that asserts:
   for any two arbitrary socket-id-like strings A and B, isPolitePeer
   computed from A's perspective (A > B) and from B's perspective (B > A)
   are always complementary (exactly one of them is true, never both,
   never neither) — this is the property that was silently violated by
   localeCompare across different locales/browsers, so the test should
   fail if someone reintroduces localeCompare later.
3. Run npm run build and npm test in client/ and confirm both pass.
4. Show me a diff of the change.


Fix two bugs in the WebRTC/socket client code.

1. WebRTC negotiation deadlock (client/src/hooks/useWebRTC.ts)
   isPolitePeer() uses localeCompare(), which is locale-aware and can
   disagree between browsers/OSes, letting both peers in a pair conclude
   they are "polite" and wait forever for an offer neither sends. Replace:

     const isPolitePeer = useCallback((peerId: string) => {
       const myId = socket?.id || '';
       return myId.localeCompare(peerId) > 0;
     }, [socket]);

   with plain string comparison (deterministic UTF-16 code unit order,
   identical across every JS engine):

     const isPolitePeer = useCallback((peerId: string) => {
       const myId = socket?.id || '';
       return myId > peerId;
     }, [socket]);

   Check every other call site of isPolitePeer in this file (there are at
   least two more, near the ICE-restart logic and processOffer) — they
   don't need changes since they just call the function, but verify.

2. Duplicate join-room emission (client/src/hooks/useSocket.ts)
   The socket emits 'join-room' from two places: once right after
   sock.connect(), and again inside the sock.on('connect', ...) handler
   (added for reconnect support). Since Socket.IO buffers an emit made
   before the connection completes and flushes it on 'connect', BOTH
   fire on every single connection — not just reconnects — causing the
   server to process join-room twice per join (visible as duplicate
   "joined room" log lines and duplicate 'user-joined'/'room-users'
   broadcasts). Remove the redundant standalone emit and rely only on
   the one inside 'connect' (which correctly covers both the initial
   connect AND reconnects):

     sock.on('connect', () => {
       console.log('Socket connected:', sock.id);
       setIsConnected(true);
       setAuthError(null);
       sock.emit('join-room', roomId);
     });

     sock.connect();
     // sock.emit('join-room', roomId);   <-- DELETE this line

3. Defensive dedupe on the client for 'user-joined' (belt-and-suspenders)
   In case of any future double-emit (server bug, network replay, etc.),
   make the 'user-joined' handler idempotent instead of blindly
   appending:

     sock.on('user-joined', (socketId: string) => {
       console.log('User joined:', socketId);
       setUsersInRoom((prev) => prev.includes(socketId) ? prev : [...prev, socketId]);
     });

After these three changes:
- Run npm run build and npm test in client/, confirm no regressions.
- Manually verify: open two browser tabs/windows, join the same room, and
  confirm the server terminal logs exactly ONE "joined room" line per
  participant (no duplicates), and both browser consoles show
  "Received offer from ..." / "Received remote track from peer ..." and
  actually render each other's video.
- Show me a diff of both files.