import { SocketEventMap, ChatSendPayload, ChatTypingPayload, ChatReadPayload } from './events';
import { chatService } from '@/api/services/chat.service';
import { presenceService } from '@/api/services/presence.service';

type Listener = (...args: unknown[]) => void;

class MockSocket {
  public connected: boolean = false;
  private listeners: Map<string, Set<Listener>> = new Map();
  private presenceInterval: NodeJS.Timeout | null = null;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.initBroadcastChannel();
    this.connect();
  }

  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('campusconnect_socket_channel');
        this.channel.onmessage = (e) => {
          if (e.data && e.data.event) {
            this.triggerLocal(e.data.event, ...(e.data.args || []));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped:', err);
      }
    }
  }

  connect(): this {
    if (this.connected) return this;
    this.connected = true;
    setTimeout(() => {
      this.trigger('connect');
    }, 10);

    this.startPresenceSimulation();
    return this;
  }

  disconnect(): this {
    this.connected = false;
    this.stopPresenceSimulation();
    this.trigger('disconnect', 'client disconnect');
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignore
      }
      this.channel = null;
    }
    return this;
  }

  on<E extends keyof SocketEventMap>(event: E, listener: SocketEventMap[E]): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
    return this;
  }

  off<E extends keyof SocketEventMap>(event: E, listener?: SocketEventMap[E]): this {
    if (!this.listeners.has(event)) return this;
    if (listener) {
      this.listeners.get(event)!.delete(listener as Listener);
    } else {
      this.listeners.delete(event);
    }
    return this;
  }

  /**
   * Triggers local listeners and broadcasts to other tabs/windows
   */
  private trigger(event: string, ...args: unknown[]): void {
    this.triggerLocal(event, ...args);

    if (this.channel && event !== 'connect' && event !== 'disconnect') {
      try {
        this.channel.postMessage({ event, args });
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err);
      }
    }
  }

  private triggerLocal(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(...args);
        } catch (err) {
          console.error(`MockSocket handler error for event "${event}":`, err);
        }
      });
    }
  }

  emit<E extends keyof SocketEventMap>(event: E, ...args: Parameters<SocketEventMap[E]>): this {
    const payload = args[0];

    if (event === 'chat:send') {
      this.handleSend(payload as unknown as ChatSendPayload);
    } else if (event === 'chat:typing') {
      const typingPayload = payload as unknown as ChatTypingPayload;
      this.trigger('chat:typing', typingPayload);
    } else if (event === 'chat:read') {
      const readPayload = payload as unknown as ChatReadPayload;
      chatService.markAsRead(readPayload.conversationId, readPayload.userId).catch(console.error);
      this.trigger('chat:read', readPayload);
    }

    return this;
  }

  private async handleSend(payload: ChatSendPayload): Promise<void> {
    try {
      const savedMessage = await chatService.sendMessage(
        payload.conversationId,
        payload.senderId,
        payload.body,
        payload.attachments || []
      );

      // 1. Emit ack back to the sender
      this.trigger('chat:ack', {
        tempId: payload.tempId,
        message: savedMessage,
      });

      // 2. Emit message to conversation subscribers (both locally and across tabs)
      this.trigger('chat:message', savedMessage);
    } catch (err: unknown) {
      console.error('MockSocket handleSend error:', err);
    }
  }

  private startPresenceSimulation(): void {
    this.stopPresenceSimulation();

    // Pool of users whose presence toggles occasionally
    const togglePool = ['user-fac-rohan', 'user-stu-2', 'user-fac-anita'];
    let toggleIndex = 0;

    this.presenceInterval = setInterval(async () => {
      if (!this.connected) return;
      const targetUserId = togglePool[toggleIndex % togglePool.length];
      toggleIndex++;

      const current = await presenceService.getUserPresence(targetUserId);
      const nextOnline = !current.online;
      const updated = await presenceService.setPresence(targetUserId, nextOnline);

      this.trigger('presence:update', updated);
    }, 28000);
  }

  private stopPresenceSimulation(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }
}

export const mockSocket = new MockSocket();
