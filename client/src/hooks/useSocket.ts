import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket } from '../services/socket';

export function useSocket(roomId: string | undefined, token?: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState<string[]>([]);
    const [hasExistingUsers, setHasExistingUsers] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [roomEnded, setRoomEnded] = useState<{ ended: boolean; reason?: string }>({ ended: false });
    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const isWaitingForAuth = Boolean(roomId && !token);

    useEffect(() => {
        if (!roomId || !token) return;

        const sock = createSocket(token);
        socketRef.current = sock;
        setSocketInstance(sock);

        sock.on('connect', () => {
            console.log('Socket connected:', sock.id);
            setIsConnected(true);
            setAuthError(null);
            // Ensure room membership is established/restored on connect and reconnect
            sock.emit('join-room', roomId);
        });

        sock.connect();

        sock.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        sock.on('auth-error', (data: { message: string }) => {
            console.error('Socket auth error:', data.message);
            setAuthError(data.message);
        });

        sock.on('room-ended', (data: { reason?: string; message?: string }) => {
            console.warn('Room ended event received:', data);
            setRoomEnded({
                ended: true,
                reason: data.reason || data.message || 'The studio session has ended.',
            });
        });

        sock.on('room-users', (payload: string[] | { otherUsers: string[]; isHost?: boolean }) => {
            console.log('Room users received:', payload);
            if (Array.isArray(payload)) {
                setUsersInRoom(payload);
                if (payload.length > 0) setHasExistingUsers(true);
            } else if (payload && typeof payload === 'object') {
                const users = payload.otherUsers || [];
                setUsersInRoom(users);
                if (users.length > 0) setHasExistingUsers(true);
                if (typeof payload.isHost === 'boolean') {
                    setIsHost(payload.isHost);
                }
            }
        });

        sock.on('user-joined', (socketId: string) => {
            console.log('User joined:', socketId);
            setUsersInRoom((prev) => prev.includes(socketId) ? prev : [...prev, socketId]);
        });

        sock.on('user-left', (socketId: string) => {
            console.log('User left:', socketId);
            setUsersInRoom((prev) => prev.filter((id) => id !== socketId));
        });

        return () => {
            sock.off('connect');
            sock.off('disconnect');
            sock.off('auth-error');
            sock.off('room-ended');
            sock.off('room-users');
            sock.off('user-joined');
            sock.off('user-left');
            sock.disconnect();
            socketRef.current = null;
            setSocketInstance(null);
        };
    }, [roomId, token]);

    const leaveRoom = () => {
        socketRef.current?.disconnect();
    };

    const endRoomByHost = () => {
        if (socketRef.current && roomId) {
            socketRef.current.emit('end-room', { roomId });
        }
    };

    return {
        isConnected,
        isWaitingForAuth,
        usersInRoom,
        hasExistingUsers,
        isHost,
        authError,
        roomEnded,
        socket: socketInstance,
        leaveRoom,
        endRoomByHost,
    };
}