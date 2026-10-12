import { useEffect, useRef } from 'react';
import { socketClient } from '@/socket/socketClient';
import { SocketEventMap, ChatSendPayload } from '@/socket/events';

// Module-level so their identities are stable: callers list them in effect deps,
// and a fresh function per render would re-run those effects on every render.
const on = <E extends keyof SocketEventMap>(event: E, handler: SocketEventMap[E]) => {
  socketClient.on(event, handler);
  return () => {
    socketClient.off(event, handler);
  };
};

const emitSend = (payload: ChatSendPayload) => {
  socketClient.emit('chat:send', payload);
};

const emitTyping = (
  conversationId: string,
  userId: string,
  isTyping: boolean,
  recipientIds?: string[]
) => {
  socketClient.emit('chat:typing', { conversationId, userId, isTyping, recipientIds });
};

const emitRead = (conversationId: string, userId: string, recipientIds?: string[]) => {
  socketClient.emit('chat:read', { conversationId, userId, recipientIds });
};

export function useSocket() {
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
  handler: SocketEventMap[E]
) {
  // Subscribe once and always call the latest handler, so it never acts on stale props or state
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = ((...args: unknown[]) =>
      (handlerRef.current as (...a: unknown[]) => void)(...args)) as SocketEventMap[E];
    socketClient.on(event, listener);
    return () => {
      socketClient.off(event, listener);
    };
  }, [event]);
}
