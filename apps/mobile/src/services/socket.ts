import { io, Socket } from 'socket.io-client';

const PROD_SOCKET_URL = 'https://bab-lma-production.up.railway.app';

// Configure with EXPO_PUBLIC_SOCKET_URL for real devices/simulators.
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  (__DEV__ ? 'http://127.0.0.1:3000' : PROD_SOCKET_URL);

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(accessToken: string): Socket {
  // Always tear down previous instance before creating a new one.
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
