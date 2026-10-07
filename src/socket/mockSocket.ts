import { SocketEventMap, ChatSendPayload, ChatTypingPayload, ChatReadPayload } from './events';
import { db } from '@/api/mock/db';
import { chatService } from '@/api/services/chat.service';
import { presenceService } from '@/api/services/presence.service';

type Listener = (...args: unknown[]) => void;

class MockSocket {
  public connected: boolean = false;
  private listeners: Map<string, Set<Listener>> = new Map();
  private presenceInterval: NodeJS.Timeout | null = null;
  private pendingReplyTimeouts: NodeJS.Timeout[] = [];

  constructor() {
    this.connect();
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
    this.pendingReplyTimeouts.forEach(clearTimeout);
    this.pendingReplyTimeouts = [];
    this.trigger('disconnect', 'client disconnect');
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

  private trigger(event: string, ...args: unknown[]): void {
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

      // 2. Emit message to conversation subscribers
      this.trigger('chat:message', savedMessage);

      // 3. Check if simulated reply should be triggered for seeded contacts
      this.maybeScheduleReply(payload.conversationId, payload.senderId, payload.body);
    } catch (err: unknown) {
      console.error('MockSocket handleSend error:', err);
      // Emit ack failure if needed (or keep pending/fail in caller)
    }
  }

  private maybeScheduleReply(conversationId: string, senderId: string, _userMessageBody: string): void {
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || conv.type !== 'DIRECT') return;

    const recipientId = conv.memberIds.find((id) => id !== senderId);
    if (!recipientId) return;

    const recipient = db.users.find((u) => u.id === recipientId);
    if (!recipient) return;

    // List of simulated replies based on recipient role
    const getSimulatedReply = (): string => {
      if (recipient.role === 'FACULTY') {
        const replies = [
          `Thank you for reaching out. I've noted this regarding the class material and will review it before tomorrow's lecture.`,
          `Good question. Please make sure to cross-check the reference notes in the LMS module. Feel free to stop by during office hours if you need further help!`,
          `Got it! Let's discuss this briefly in the next class session as well so everyone can benefit from the explanation.`,
        ];
        return replies[Math.floor(Math.random() * replies.length)];
      }

      if (recipient.role === 'HOD') {
        return `Acknowledged. Please submit the departmental documentation so we can review it during the weekly council.`;
      }

      // Student reply
      return `Hey! Thanks for sharing this. Let me check the code and try it out on my branch.`;
    };

    // 1. Start typing after 500-800ms
    const typingTimer = setTimeout(() => {
      this.trigger('chat:typing', {
        conversationId,
        userId: recipientId,
        isTyping: true,
      });
    }, 600);
    this.pendingReplyTimeouts.push(typingTimer);

    // 2. Send reply after 1.8 - 2.6 seconds
    const replyDelay = 1800 + Math.floor(Math.random() * 800);
    const replyTimer = setTimeout(async () => {
      // Turn off typing
      this.trigger('chat:typing', {
        conversationId,
        userId: recipientId,
        isTyping: false,
      });

      try {
        const replyMessage = await chatService.sendMessage(
          conversationId,
          recipientId,
          getSimulatedReply()
        );
        this.trigger('chat:message', replyMessage);
      } catch (err) {
        console.error('Failed to dispatch simulated reply:', err);
      }
    }, replyDelay);
    this.pendingReplyTimeouts.push(replyTimer);
  }

  private startPresenceSimulation(): void {
    this.stopPresenceSimulation();

    // Pool of users whose presence toggles occasionally to demonstrate real-time presence
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
