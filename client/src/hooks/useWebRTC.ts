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

  const createPeerConnection = useCallback((peerId: string) => {
    // If existing pc for this peer, close it first
    if (peerConnections.current.has(peerId)) {
      peerConnections.current.get(peerId)?.close();
      peerConnections.current.delete(peerId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Attach local stream tracks immediately if available
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
      console.log(`🎥 Received remote track from peer ${peerId}`);
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(peerId, stream);
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
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
  }, [roomId, socket, localStream]);

  // Helper to process an incoming offer from a specific peer
  const processOffer = useCallback(async (peerId: string, sdp: RTCSessionDescriptionInit) => {
    if (!localStream || !socket) return;

    const pc = createPeerConnection(peerId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer', { to: peerId, roomId, sdp: answer });
    } catch (err) {
      console.error(`Error processing offer from ${peerId}:`, err);
    }
  }, [localStream, socket, roomId, createPeerConnection]);

  // Set up signaling listeners
  useEffect(() => {
    if (!roomId || !socket) return;

    const handleOffer = async (payload: { from: string; roomId: string; sdp: RTCSessionDescriptionInit }) => {
      const peerId = payload.from;
      if (!peerId) return;
      console.log(`📩 Received offer from ${peerId}`);

      if (!localStream) {
        console.log(`⏳ Local stream not ready for ${peerId}, queuing offer...`);
        pendingOffers.current.set(peerId, payload.sdp);
        return;
      }

      await processOffer(peerId, payload.sdp);
    };

    const handleAnswer = async (payload: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const peerId = payload.from;
      if (!peerId) return;
      console.log(`📩 Received answer from ${peerId}`);
      const pc = peerConnections.current.get(peerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (err) {
          console.error(`Error setting remote description for ${peerId}:`, err);
        }
      }
    };

    const handleIceCandidate = async (payload: { from: string; candidate: RTCIceCandidateInit }) => {
      const peerId = payload.from;
      if (!peerId) return;
      const pc = peerConnections.current.get(peerId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error(`Error adding ICE candidate from ${peerId}:`, err);
        }
      }
    };

    const handleUserLeft = (peerId: string) => {
      console.log(`👋 Peer left: ${peerId}`);
      if (peerConnections.current.has(peerId)) {
        peerConnections.current.get(peerId)?.close();
        peerConnections.current.delete(peerId);
      }
      pendingOffers.current.delete(peerId);
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
  }, [roomId, socket, localStream, processOffer]);

  // Process queued offers when localStream arrives
  useEffect(() => {
    if (localStream && pendingOffers.current.size > 0) {
      pendingOffers.current.forEach((sdp, peerId) => {
        if (!peerConnections.current.has(peerId)) {
          console.log(`📬 Processing queued offer for ${peerId}`);
          processOffer(peerId, sdp);
        }
      });
      pendingOffers.current.clear();
    }
  }, [localStream, processOffer]);

  // NEW JOINER: Create offer for each existing user in the room
  useEffect(() => {
    if (!localStream || !roomId || !socket || usersInRoom.length === 0) return;

    usersInRoom.forEach(async (peerId) => {
      if (!peerConnections.current.has(peerId)) {
        console.log(`📞 Creating offer for existing peer ${peerId}`);
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
  }, [localStream, roomId, socket, usersInRoom, createPeerConnection]);

  const closeConnection = useCallback(() => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    pendingOffers.current.clear();
    setRemoteStreams(new Map());
  }, []);

  // Cleanup on unmount
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