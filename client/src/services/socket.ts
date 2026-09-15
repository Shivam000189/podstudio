import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 
  import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") : "") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" ? window.location.origin : 'http://localhost:4000');

/**
 * Creates a new Socket.IO client with optional auth token.
 * The token is passed in the handshake so the server can validate it
 * before allowing the client to join a room.
 */
export const createSocket = (token?: string | null): Socket => {
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: token ? { token } : undefined,
  });
};

// Keep the default singleton for backward compatibility, but new code
// should use createSocket(token) to pass auth credentials.
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});