import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to ConstructGuard real-time WebSocket');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected from WebSocket: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
    });
  }

  return socket;
};

export const joinSiteRoom = (siteId: string) => {
  const s = getSocket();
  s.emit('join:site', siteId);
};

export const leaveSiteRoom = (siteId: string) => {
  const s = getSocket();
  s.emit('leave:site', siteId);
};
