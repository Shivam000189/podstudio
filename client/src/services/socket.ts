import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 
  import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") : "") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" ? window.location.origin : 'http://localhost:4000');

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});