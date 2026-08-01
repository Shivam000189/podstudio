import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000'; // your backend URL

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // we'll connect manually when entering a room
  transports: ['websocket'],
});