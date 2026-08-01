import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export function useWebRTC(
  localStream: MediaStream | null,
  roomId: string | undefined,
  socket: Socket,
  hasExistingUsers: boolean
) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const hasCreatedOffer = useRef(false);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎥 Received remote track!');
      setRemoteStream(event.streams[0]);
      setConnectionState('connected');
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionState('disconnected');
        setRemoteStream(null);
      }
    };

    return pc;
  }, [roomId, socket]);

  // Set up signaling listeners IMMEDIATELY (don't wait for localStream)
  useEffect(() => {
    if (!roomId) return;

    const handleOffer = async (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('📩 Received offer');
      
      if (!localStream) {
        console.log('⏳ Local stream not ready, queuing offer...');
        pendingOffer.current = payload.sdp;
        return;
      }
      
      await processOffer(payload.sdp);
    };

    const handleAnswer = async (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('📩 Received answer');
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    };

    const handleIceCandidate = async (payload: { roomId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [roomId, socket, localStream]);

  // Process queued offer when localStream finally arrives
  useEffect(() => {
    if (localStream && pendingOffer.current && !peerConnection.current) {
      console.log('📬 Processing queued offer');
      processOffer(pendingOffer.current);
      pendingOffer.current = null;
    }
  }, [localStream]);

  // Helper to process an offer
  const processOffer = async (sdp: RTCSessionDescriptionInit) => {
    if (!localStream) return;
    
    const pc = createPeerConnection();
    peerConnection.current = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', { roomId, sdp: answer });
    setConnectionState('connecting');
  };

  // NEW USER: Create offer when we detect existing users
  useEffect(() => {
    if (!localStream || !roomId || !hasExistingUsers) return;
    if (hasCreatedOffer.current) return; // Prevent duplicate offers
    if (peerConnection.current) return; // Already connected

    const initiateCall = async () => {
      console.log('📞 Creating offer as new joiner');
      hasCreatedOffer.current = true;
      
      const pc = createPeerConnection();
      peerConnection.current = pc;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('offer', { roomId, sdp: offer });
      setConnectionState('connecting');
    };

    initiateCall();
  }, [localStream, roomId, hasExistingUsers, createPeerConnection, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setRemoteStream(null);
      hasCreatedOffer.current = false;
    };
  }, []);


      const closeConnection = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setRemoteStream(null);
        setConnectionState('idle');
        hasCreatedOffer.current = false;
    }, []);

    return { remoteStream, connectionState, closeConnection };

//   return { remoteStream, connectionState };
}