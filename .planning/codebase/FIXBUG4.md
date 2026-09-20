Fix two related bugs in client/src/hooks/useWebRTC.ts around connection
recovery and renegotiation.

1. isOfferCollision incorrectly checks pc.localDescription !== null
   Once a peer connection successfully negotiates, localDescription stays
   non-null even while signalingState is 'stable', so this check treats
   every later offer (including legitimate renegotiation/ICE-restart
   offers) as a collision. Fix by only checking signalingState:

     const isOfferCollision = Boolean(pc && pc.signalingState !== 'stable');

2. The 'failed' connectionstatechange handler calls pc.restartIce() but
   never follows through with an actual offer, so it does nothing useful.
   Replace it with a real ICE restart: the impolite peer should create a
   fresh offer with iceRestart: true, set it as local description, and
   send it over the signaling channel — same as the normal offer flow:

     } else if (pc.connectionState === 'failed') {
       const pendingTimer = disconnectTimers.current.get(peerId);
       if (pendingTimer) {
         clearTimeout(pendingTimer);
         disconnectTimers.current.delete(peerId);
       }
       if (!isPolitePeer(peerId)) {
         console.log(`Attempting ICE restart for failed connection with ${peerId}`);
         (async () => {
           try {
             const offer = await pc.createOffer({ iceRestart: true });
             await pc.setLocalDescription(offer);
             socket?.emit('offer', { to: peerId, roomId, sdp: offer });
           } catch (err) {
             console.error(`ICE restart failed for ${peerId}:`, err);
             setRemoteStreams((prev) => {
               if (!prev.has(peerId)) return prev;
               const next = new Map(prev);
               next.delete(peerId);
               return next;
             });
           }
         })();
       } else {
         // Polite peer just waits — the impolite peer will send a fresh
         // ICE-restart offer, which processOffer() will now handle
         // correctly since isOfferCollision no longer false-positives.
         console.log(`Polite peer waiting for ICE-restart offer from ${peerId}`);
       }
     }

After this change, an ICE-restart offer arriving via processOffer() should
be handled as a normal (non-collision) offer in the vast majority of cases,
since signalingState will genuinely be 'stable' before the restart offer
is sent.

3. Add a test in useWebRTC.test.ts (or a new test) that:
   - Simulates a peer connection reaching connectionState 'failed'
   - Asserts the impolite peer calls createOffer with { iceRestart: true }
     and emits an 'offer' socket event (not just restartIce() alone)
   - Asserts isOfferCollision-driven rollback/recreate does NOT trigger
     for an incoming offer when signalingState is 'stable', even if
     localDescription is non-null from a prior successful negotiation

Run npm run build and npm test in client/ afterward and show me the diff.