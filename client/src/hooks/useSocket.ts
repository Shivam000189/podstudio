import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

export function useSocket(roomId: string | undefined) {
    const [isConnected, setIsConnected] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState<string[]>([]);
    const [hasExistingUsers, setHasExistingUsers] = useState(false);

    useEffect(() => {
        if (!roomId) return;

        socket.connect();
        socket.emit('join-room', roomId);

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        socket.on('room-users', (users: string[]) => {
            console.log('Other users in room:', users);
            setUsersInRoom(users);
            if (users.length > 0) setHasExistingUsers(true);
        });

        socket.on('user-joined', (socketId: string) => {
            console.log('User joined:', socketId);
            setUsersInRoom((prev) => [...prev, socketId]);
        });

        socket.on('user-left', (socketId: string) => {
            console.log('User left:', socketId);
            setUsersInRoom((prev) => prev.filter((id) => id !== socketId));
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('room-users');
            socket.off('user-joined');
            socket.off('user-left');
            socket.disconnect();
        };
    }, [roomId]);

    const leaveRoom = () => {
        socket.disconnect();
    };

    return { isConnected, usersInRoom, hasExistingUsers, socket, leaveRoom };
}