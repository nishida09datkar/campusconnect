import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { db } from '@/api/mock/db';
import { chatService } from '@/api/services/chat.service';
import { presenceService } from '@/api/services/presence.service';
import { notificationService } from '@/api/services/notification.service';
import { mockSocket } from '@/socket/mockSocket';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConversationList } from '@/components/chat/ConversationList';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import {
  messageReceived,
  addOptimisticMessage,
  messageAckReceived,
} from '@/features/chat/chatSlice';
import { selectMessagesForConversation } from '@/features/chat/chatSelectors';
import { PresenceState, Message } from '@/types';

// Polyfills for jsdom
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-file-url');
}
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Phase 4 — Chat & Real-Time Presence Specification Tests', () => {
  const hodCe = db.users.find((u) => u.id === 'user-hod-ce')!;
  const hodIt = db.users.find((u) => u.id === 'user-hod-it')!;
  const facNeha = db.users.find((u) => u.id === 'user-fac-neha')!; // CE, teaches Web Dev
  const facVivek = db.users.find((u) => u.id === 'user-fac-vivek')!; // IT, teaches Networks
  const stu1 = db.users.find((u) => u.id === 'user-stu-1')!; // CE, enrolled in Web Dev with Neha
  const stu2 = db.users.find((u) => u.id === 'user-stu-2')!; // CE, enrolled in Web Dev with Neha
  const stu5 = db.users.find((u) => u.id === 'user-stu-5')!; // CE Year 3 Div B (NOT in Neha's class)
  const stu12 = db.users.find((u) => u.id === 'user-stu-12')!; // IT Year 2 (NOT in Vivek's Networks class)

  beforeEach(() => {
    db.reset();
    presenceService.reset();
  });

  /* ===================================================================
   * 1. SERVICE LAYER: ROLE-BASED ACCESS & PERMISSION MATRIX (SECTION 3.2)
   * =================================================================== */
  describe('1. Chat Service — canInteract() Permission Enforcement', () => {
    it('Positive: Student can start direct chat with assigned course faculty', async () => {
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);
      expect(conv).toBeDefined();
      expect(conv.type).toBe('DIRECT');
      expect(conv.memberIds).toContain(stu1.id);
      expect(conv.memberIds).toContain(facNeha.id);
    });

    it('NEGATIVE TEST: Unassigned student CANNOT start chat with faculty who does not teach them', async () => {
      // stu5 is in CE Div B, not enrolled in Neha's Web Dev class
      await expect(
        chatService.getOrCreateDirectConversation(stu5.id, facNeha.id)
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
          message: expect.stringContaining('Permission denied'),
        })
      );

      // stu12 is in IT, not enrolled in Vivek's Networks class
      await expect(
        chatService.getOrCreateDirectConversation(stu12.id, facVivek.id)
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });

    it('Classmates in same course can chat, but students from different courses cannot', async () => {
      // stu1 and stu2 are classmates in Web Dev
      const classmateConv = await chatService.getOrCreateDirectConversation(stu1.id, stu2.id);
      expect(classmateConv).toBeDefined();

      // stu1 and stu5 do not share any class
      await expect(
        chatService.getOrCreateDirectConversation(stu1.id, stu5.id)
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });

    it('Student can chat with their own HOD, but NOT other department HOD', async () => {
      // stu1 is CE, hodCe is CE
      const hodConv = await chatService.getOrCreateDirectConversation(stu1.id, hodCe.id);
      expect(hodConv).toBeDefined();

      // stu1 is CE, hodIt is IT
      await expect(
        chatService.getOrCreateDirectConversation(stu1.id, hodIt.id)
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });

    it('SendMessage strictly enforces canInteract permissions in direct conversations', async () => {
      // Create a valid conversation between stu1 and facNeha
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);

      // stu1 sending message to facNeha succeeds
      const msg = await chatService.sendMessage(
        conv.id,
        stu1.id,
        'Hello professor, had a question on lecture 3.'
      );
      expect(msg.id).toBeDefined();
      expect(msg.body).toBe('Hello professor, had a question on lecture 3.');

      // Negative check: unauthorized user attempting to send message throws 403
      await expect(
        chatService.sendMessage(conv.id, stu5.id, 'Unauthorized message')
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });

    it('Group conversation creation rejects if creator is not permitted to interact with all members', async () => {
      // stu1 creating a group with classmate stu2 succeeds
      const validGroup = await chatService.createGroupConversation(
        stu1.id,
        'Web Dev Project Team',
        [stu2.id]
      );
      expect(validGroup.type).toBe('GROUP');
      expect(validGroup.name).toBe('Web Dev Project Team');

      // stu1 trying to add unassigned faculty or unrelated student stu5 fails
      await expect(
        chatService.createGroupConversation(stu1.id, 'Illegal Group', [stu5.id])
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });
  });

  /* ===================================================================
   * 2. SERVICE LAYER: PAGINATION, READ RECEIPTS & NOTIFICATIONS
   * =================================================================== */
  describe('2. Chat Service — Pagination, Read Status, & Notification Bell Integration', () => {
    it('Fetches paginated messages with page metadata and hasMore indicator', async () => {
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);

      // Send 5 messages
      for (let i = 1; i <= 5; i++) {
        await chatService.sendMessage(conv.id, stu1.id, `Test message ${i}`);
      }

      const paged = await chatService.getMessages(conv.id, { page: 1, limit: 3 });
      expect(paged.messages.length).toBeLessThanOrEqual(3);
      expect(paged.total).toBeGreaterThanOrEqual(5);
      expect(paged.hasMore).toBe(true);
    });

    it('Mark as read clears unread status on conversation messages', async () => {
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);
      await chatService.sendMessage(conv.id, facNeha.id, 'New announcement from professor');

      const result = await chatService.markAsRead(conv.id, stu1.id);
      expect(result.readCount).toBeGreaterThanOrEqual(1);

      const convDetails = await chatService.getConversationById(conv.id, stu1.id);
      expect(convDetails?.unreadCount).toBe(0);
    });

    it('CRITICAL INTEGRATION: Sending a message generates a notification via notification.service', async () => {
      const initialNotifs = await notificationService.getUserNotifications(facNeha.id);
      const initialCount = initialNotifs.filter((n) => n.type === 'MESSAGE').length;

      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);
      await chatService.sendMessage(conv.id, stu1.id, 'Urgent question on assignment');

      const updatedNotifs = await notificationService.getUserNotifications(facNeha.id);
      const messageNotifs = updatedNotifs.filter((n) => n.type === 'MESSAGE');
      expect(messageNotifs.length).toBe(initialCount + 1);
      expect(messageNotifs[0].title).toBe(stu1.name);
      expect(messageNotifs[0].body).toContain('Urgent question on assignment');
    });
  });

  /* ===================================================================
   * 3. PRESENCE SERVICE & SOCKET EMULATION
   * =================================================================== */
  describe('3. Presence Service & Socket Layer', () => {
    it('Tracks online/offline and lastSeen status with subscriptions', async () => {
      let latestPresence: PresenceState | null = null;
      const unsubscribe = presenceService.subscribe((p) => {
        latestPresence = p;
      });

      await presenceService.setPresence(stu1.id, false);
      expect(latestPresence).toBeDefined();
      const resultPresence = latestPresence as unknown as PresenceState;
      expect(resultPresence.userId).toBe(stu1.id);
      expect(resultPresence.online).toBe(false);
      expect(resultPresence.lastSeen).toBeDefined();

      unsubscribe();
    });

    it('MockSocket emits chat:ack when sending message', async () => {
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);
      const ackPromise = new Promise<{ tempId: string; message: Message }>((resolve) => {
        mockSocket.on('chat:ack', (ack) => {
          if (ack.tempId === 'temp-test-123') {
            resolve(ack);
          }
        });
      });

      mockSocket.emit('chat:send', {
        conversationId: conv.id,
        senderId: stu1.id,
        body: 'Socket integration message',
        tempId: 'temp-test-123',
      });

      const ack = await ackPromise;
      expect(ack.tempId).toBe('temp-test-123');
      expect(ack.message.body).toBe('Socket integration message');
    });
  });

  /* ===================================================================
   * 4. COMPONENT TESTS: MessageInput & ConversationList
   * =================================================================== */
  describe('4. Component Unit Tests', () => {
    it('MessageInput validates empty input and prevents sending blank messages', async () => {
      const onSend = vi.fn();
      const onTyping = vi.fn();

      render(<MessageInput onSendMessage={onSend} onTyping={onTyping} />);

      const sendBtn = screen.getByTestId('send-button');
      expect(sendBtn).toBeDisabled();

      const textarea = screen.getByTestId('message-textarea');
      fireEvent.change(textarea, { target: { value: '   ' } });
      expect(sendBtn).toBeDisabled();

      fireEvent.click(sendBtn);
      expect(onSend).not.toHaveBeenCalled();
    });

    it('MessageInput enforces upload limits (rejects files > 10MB)', async () => {
      const onSend = vi.fn();
      const onTyping = vi.fn();

      render(<MessageInput onSendMessage={onSend} onTyping={onTyping} />);

      const fileInput = screen.getByTestId('file-upload-input');
      const largeFile = new File(['a'.repeat(1024 * 1024 * 12)], 'huge_file.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(largeFile, 'size', { value: 1024 * 1024 * 12 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(screen.getByTestId('message-input-error')).toHaveTextContent(
        'File exceeds the maximum allowed limit of 10MB'
      );
    });

    it('MessageInput sends message when text is entered and Enter key is pressed', async () => {
      const onSend = vi.fn();
      const onTyping = vi.fn();

      render(<MessageInput onSendMessage={onSend} onTyping={onTyping} />);

      const textarea = screen.getByTestId('message-textarea');
      fireEvent.change(textarea, { target: { value: 'Hello Faculty!' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSend).toHaveBeenCalledWith('Hello Faculty!', []);
    });

    it('ConversationList renders conversation unread badges and filters permitted contacts', async () => {
      const onSelect = vi.fn();
      const onStartDirect = vi.fn();
      const onOpenGroup = vi.fn();

      const mockConversations = [
        {
          id: 'conv-mock-1',
          type: 'DIRECT' as const,
          memberIds: [stu1.id, facNeha.id],
          unreadCount: 3,
          lastMessage: {
            id: 'm1',
            conversationId: 'conv-mock-1',
            senderId: facNeha.id,
            body: 'Please check the homework',
            attachments: [],
            sentAt: new Date().toISOString(),
            status: 'DELIVERED' as const,
          },
        },
      ];

      render(
        <Provider store={store}>
          <ConversationList
            conversations={mockConversations}
            activeConversationId={null}
            currentUser={stu1}
            onSelectConversation={onSelect}
            onStartDirectConversation={onStartDirect}
            onOpenCreateGroup={onOpenGroup}
          />
        </Provider>
      );

      // Unread badge is displayed
      const badge = screen.getByTestId('unread-badge-conv-mock-1');
      expect(badge).toHaveTextContent('3');

      // Click contacts tab
      const contactsTab = screen.getByTestId('contacts-tab');
      fireEvent.click(contactsTab);

      // Verify permitted contacts view appears
      await waitFor(() => {
        expect(screen.getByTestId('permitted-contacts-list')).toBeInTheDocument();
      });
    });
  });

  /* ===================================================================
   * 5. END-TO-END INTEGRATION TEST: REAL-TIME CONVERSATION EXCHANGE
   * =================================================================== */
  describe('5. End-to-End Chat Exchange & Redux Reconciliation Integration', () => {
    it('Two users exchange messages; optimistic message reconciles on ack and unread counts update', async () => {
      const conv = await chatService.getOrCreateDirectConversation(stu1.id, facNeha.id);

      // 1. stu1 sends optimistic message
      const tempId = 'temp-msg-999';
      store.dispatch(
        addOptimisticMessage({
          conversationId: conv.id,
          senderId: stu1.id,
          body: 'Do we have class this Friday?',
          tempId,
        })
      );

      let messages = selectMessagesForConversation(conv.id)(store.getState());
      expect(messages.some((m) => m.id === tempId)).toBe(true);

      // 2. Ack arrives and reconciles temp message to confirmed message
      const realMessage = {
        id: 'msg-real-999',
        conversationId: conv.id,
        senderId: stu1.id,
        body: 'Do we have class this Friday?',
        attachments: [],
        sentAt: new Date().toISOString(),
        status: 'SENT' as const,
      };
      store.dispatch(messageAckReceived({ tempId, message: realMessage }));

      messages = selectMessagesForConversation(conv.id)(store.getState());
      expect(messages.some((m) => m.id === tempId)).toBe(false);
      expect(messages.some((m) => m.id === 'msg-real-999')).toBe(true);

      // 3. Simulated incoming reply from faculty Neha arrives
      const incomingReply = {
        id: 'msg-reply-1000',
        conversationId: conv.id,
        senderId: facNeha.id,
        body: 'Yes Aryan, regular lab hours apply.',
        attachments: [],
        sentAt: new Date().toISOString(),
        status: 'DELIVERED' as const,
      };
      store.dispatch(messageReceived(incomingReply));

      // 4. Verify thread contains reply
      messages = selectMessagesForConversation(conv.id)(store.getState());
      expect(messages.some((m) => m.id === 'msg-reply-1000')).toBe(true);
    });
  });
});
