import { io, Socket } from 'socket.io-client';
import { USE_MOCKS, SOCKET_URL } from '@/api/config';
import { mockSocket } from './mockSocket';
import { SocketEventMap } from './events';

export interface AppSocket {
  connected: boolean;
  on<E extends keyof SocketEventMap>(event: E, listener: SocketEventMap[E]): this;
  off<E extends keyof SocketEventMap>(event: E, listener?: SocketEventMap[E]): this;
  emit<E extends keyof SocketEventMap>(event: E, ...args: Parameters<SocketEventMap[E]>): this;
  connect(): this;
  disconnect(): this;
}

let realSocketInstance: Socket | null = null;

export function getSocketClient(): AppSocket {
  if (USE_MOCKS) {
    return mockSocket as unknown as AppSocket;
  }

  if (!realSocketInstance) {
    realSocketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  return realSocketInstance as unknown as AppSocket;
}

export const socketClient = getSocketClient();
