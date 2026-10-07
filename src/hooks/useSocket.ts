import { useEffect } from 'react';
import { socketClient } from '@/socket/socketClient';
import { SocketEventMap, ChatSendPayload } from '@/socket/events';

export function useSocket() {
  const on = <E extends keyof SocketEventMap>(event: E, handler: SocketEventMap[E]) => {
    socketClient.on(event, handler);
    return () => {
      socketClient.off(event, handler);
    };
  };

  const emitSend = (payload: ChatSendPayload) => {
    socketClient.emit('chat:send', payload);
  };

  const emitTyping = (conversationId: string, userId: string, isTyping: boolean) => {
    socketClient.emit('chat:typing', { conversationId, userId, isTyping });
  };

  const emitRead = (conversationId: string, userId: string) => {
    socketClient.emit('chat:read', { conversationId, userId });
  };

  return {
    socket: socketClient,
    on,
    emitSend,
    emitTyping,
    emitRead,
    connected: socketClient.connected,
  };
}

export function useSocketEvent<E extends keyof SocketEventMap>(
  event: E,
  handler: SocketEventMap[E],
  deps: React.DependencyList = []
) {
  useEffect(() => {
    socketClient.on(event, handler);
    return () => {
      socketClient.off(event, handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
