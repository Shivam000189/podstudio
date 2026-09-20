import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type RemotePeer = {
  peerId: string;
  stream: MediaStream;
};

export function useWebRTC(
  localStream: MediaStream | null,
  roomId: string | undefined,
  socket: Socket | null,
  usersInRoom: string[]
) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingOffers = useRef<Map<string, RTCSessionDescriptionInit>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const disconnectTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const isPolitePeer = useCallback((peerId: string) => {
    const myId = socket?.id || '';
    return myId > peerId;
  }, [socket]);

  const flushPendingIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const candidates = pendingIceCandidates.current.get(peerId);
    if (candidates && candidates.length > 0) {
      console.log(`Flushing ${candidates.length} queued ICE candidate(s) for ${peerId}`);
      const remaining: RTCIceCandidateInit[] = [];
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error(`Error applying queued ICE candidate for ${peerId}:`, err);
          remaining.push(candidate);
        }
      }
      if (remaining.length > 0) {
        pendingIceCandidates.current.set(peerId, remaining);
      } else {
        pendingIceCandidates.current.delete(peerId);
      }
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    const existingTimer = disconnectTimers.current.get(peerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      disconnectTimers.current.delete(peerId);
    }

    if (peerConnections.current.has(peerId)) {
      peerConnections.current.get(peerId)?.close();
      peerConnections.current.delete(peerId);
      // Retain pendingIceCandidates for peerId so they can be applied to the replacement connection
    }

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

    if (turnUrl) {
      const urls = turnUrl.includes(',') 
        ? turnUrl.split(',').map((u: string) => u.trim()) 
        : turnUrl;

      iceServers.push({
        urls,
        ...(turnUsername ? { username: turnUsername } : {}),
        ...(turnCredential ? { credential: turnCredential } : {}),
      });
    }

    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10
    });

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId && socket) {
        socket.emit('ice-candidate', { to: peerId, roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received remote track from peer ${peerId}`);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(peerId, stream);
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);

      if (pc.connectionState === 'connected') {
        const pendingTimer = disconnectTimers.current.get(peerId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          disconnectTimers.current.delete(peerId);
          console.log(`Connection recovered for ${peerId}`);
        }
      } else if (pc.connectionState === 'disconnected') {
        // Transient state: ICE attempts self-healing. Give a 5s grace period before removing stream.
        if (!disconnectTimers.current.has(peerId)) {
          const timer = setTimeout(() => {
            disconnectTimers.current.delete(peerId);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
              setRemoteStreams((prev) => {
                if (!prev.has(peerId)) return prev;
                const next = new Map(prev);
                next.delete(peerId);
                return next;
              });
            }
          }, 5000);
          disconnectTimers.current.set(peerId, timer);
        }
      } else if (pc.connectionState === 'failed') {
        const pendingTimer = disconnectTimers.current.get(peerId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          disconnectTimers.current.delete(peerId);
        }
        if (!isPolitePeer(peerId) && typeof pc.restartIce === 'function') {
          console.log(`Attempting ICE restart for failed connection with ${peerId}`);
          try {
            pc.restartIce();
          } catch (err) {
            console.error(`ICE restart failed for ${peerId}:`, err);
          }
        } else {
          setRemoteStreams((prev) => {
            if (!prev.has(peerId)) return prev;
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      } else if (pc.connectionState === 'closed') {
        const pendingTimer = disconnectTimers.current.get(peerId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          disconnectTimers.current.delete(peerId);
        }
        setRemoteStreams((prev) => {
          if (!prev.has(peerId)) return prev;
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [roomId, socket, localStream, isPolitePeer]);

  const processOffer = useCallback(async (peerId: string, sdp: RTCSessionDescriptionInit) => {
    if (!localStream || !socket) return;

    let pc = peerConnections.current.get(peerId);
    const isPolite = isPolitePeer(peerId);
    const isOfferCollision = Boolean(pc && (pc.signalingState !== 'stable' || pc.localDescription !== null));

    if (pc && isOfferCollision) {
      if (!isPolite) {
        // Impolite peer ignores colliding offer and maintains its own in-flight offer
        console.log(`Impolite peer ${socket.id} ignoring colliding offer from ${peerId}`);
        return;
      }

      console.log(`Polite peer ${socket.id} yielding to colliding offer from ${peerId}`);
      try {
        await pc.setLocalDescription({ type: 'rollback' });
      } catch {
        pc = createPeerConnection(peerId);
      }
    }

    if (!pc) {
      pc = createPeerConnection(peerId);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingIceCandidates(peerId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer', { to: peerId, roomId, sdp: answer });
    } catch (err) {
      console.error(`Error processing offer from ${peerId}:`, err);
    }
  }, [localStream, socket, roomId, createPeerConnection, flushPendingIceCandidates, isPolitePeer]);

  useEffect(() => {
    if (!roomId || !socket) return;

    const handleOffer = async (payload: { from: string; roomId: string; sdp: RTCSessionDescriptionInit }) => {
      const peerId = payload.from;
      if (!peerId) return;
      console.log(`Received offer from ${peerId}`);

      if (!localStream) {
        console.log(`Local stream not ready for ${peerId}, queuing offer...`);
        pendingOffers.current.set(peerId, payload.sdp);
        return;
      }

      await processOffer(peerId, payload.sdp);
    };

    const handleAnswer = async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const peerId = payload.from;
      if (!peerId) return;
      console.log(`Received answer from ${peerId}`);
      const pc = peerConnections.current.get(peerId);
      if (pc) {
        if (pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await flushPendingIceCandidates(peerId, pc);
          } catch (err) {
            console.error(`Error setting remote description for ${peerId}:`, err);
          }
        } else {
          console.warn(`Ignoring answer from ${peerId} because signalingState is ${pc.signalingState}`);
        }
      }
    };

    const handleIceCandidate = async (payload: { from: string; candidate: RTCIceCandidateInit }) => {
      const peerId = payload.from;
      if (!peerId || !payload.candidate) return;
      const pc = peerConnections.current.get(peerId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error(`Error adding ICE candidate from ${peerId}:`, err);
        }
      } else {
        console.log(`Queueing early ICE candidate for peer ${peerId}`);
        if (!pendingIceCandidates.current.has(peerId)) {
          pendingIceCandidates.current.set(peerId, []);
        }
        pendingIceCandidates.current.get(peerId)!.push(payload.candidate);
      }
    };

    const handleUserLeft = (peerId: string) => {
      console.log(`Peer left: ${peerId}`);
      const pendingTimer = disconnectTimers.current.get(peerId);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        disconnectTimers.current.delete(peerId);
      }
      if (peerConnections.current.has(peerId)) {
        peerConnections.current.get(peerId)?.close();
        peerConnections.current.delete(peerId);
      }
      pendingOffers.current.delete(peerId);
      pendingIceCandidates.current.delete(peerId);
      setRemoteStreams((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);
    };
  }, [roomId, socket, localStream, processOffer, flushPendingIceCandidates]);

  useEffect(() => {
    if (localStream && pendingOffers.current.size > 0) {
      pendingOffers.current.forEach((sdp, peerId) => {
        if (!peerConnections.current.has(peerId)) {
          console.log(`Processing queued offer for ${peerId}`);
          processOffer(peerId, sdp);
        }
      });
      pendingOffers.current.clear();
    }
  }, [localStream, processOffer]);

  useEffect(() => {
    if (!localStream || !roomId || !socket || usersInRoom.length === 0) return;

    usersInRoom.forEach(async (peerId) => {
      // Polite/impolite pattern: only the impolite peer initiates the offer.
      // The polite peer waits to receive the offer from the impolite peer to prevent glare.
      if (isPolitePeer(peerId)) {
        console.log(`Polite peer ${socket.id} waiting for offer from ${peerId}`);
        return;
      }

      if (!peerConnections.current.has(peerId)) {
        console.log(`Impolite peer ${socket.id} creating offer for ${peerId}`);
        const pc = createPeerConnection(peerId);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { to: peerId, roomId, sdp: offer });
        } catch (err) {
          console.error(`Error creating offer for ${peerId}:`, err);
        }
      }
    });
  }, [localStream, roomId, socket, usersInRoom, createPeerConnection, isPolitePeer]);

  const closeConnection = useCallback(() => {
    disconnectTimers.current.forEach((t) => clearTimeout(t));
    disconnectTimers.current.clear();
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    pendingOffers.current.clear();
    pendingIceCandidates.current.clear();
    setRemoteStreams(new Map());
  }, []);

  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  const remoteStreamsList: RemotePeer[] = Array.from(remoteStreams.entries()).map(
    ([peerId, stream]) => ({
      peerId,
      stream,
    })
  );

  return {
    remoteStreams: remoteStreamsList,
    remoteStreamsMap: remoteStreams,
    closeConnection,
  };
}