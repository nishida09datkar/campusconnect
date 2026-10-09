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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    realSocketInstance = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        token: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
      },
    });

    realSocketInstance.on('connect_error', (err) => {
      console.warn('[SocketClient] Connection error:', err.message);
    });
  }

  return realSocketInstance as unknown as AppSocket;
}

export function updateSocketAuthToken(token: string): void {
  if (realSocketInstance) {
    realSocketInstance.auth = {
      token: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    };
    if (realSocketInstance.connected) {
      realSocketInstance.disconnect().connect();
    }
  }
}

export const socketClient = getSocketClient();
