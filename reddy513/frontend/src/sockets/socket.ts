import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinRooms(role: string, department?: string, userId?: string) {
  const s = getSocket();
  if (role === 'ADMIN') s.emit('join:room', { room: 'admin-room' });
  if (role === 'DEPARTMENT' && department) {
    s.emit('join:room', { room: `dept-${department.toLowerCase()}` });
  }
  if (role === 'USER_PILOT' && userId) {
    s.emit('join:room', { room: `pilot-${userId}` });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
