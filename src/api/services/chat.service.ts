import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Conversation, Message, Attachment, User } from '@/types';
import { canInteract } from '@/utils/permissions';
import { notificationService } from './notification.service';

export interface GetMessagesOptions {
  page?: number;
  limit?: number;
  before?: string;
}

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

export const chatService = {
  /**
   * List all conversations that the specified user participates in.
   */
  async listConversations(userId: string): Promise<Conversation[]> {
    await delay(50, 120);

    const userConversations = db.conversations.filter((c) =>
      c.memberIds.includes(userId)
    );

    // Compute unread count for current user and attach latest message
    return userConversations
      .map((conv) => {
        const convMessages = db.messages
          .filter((m) => m.conversationId === conv.id)
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

        const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : conv.lastMessage;

        const unreadCount = convMessages.filter(
          (m) => m.senderId !== userId && m.status !== 'READ'
        ).length;

        return {
          ...conv,
          lastMessage: lastMsg,
          unreadCount,
        };
      })
      .sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
        return timeB - timeA;
      });
  },

  /**
   * Get an existing conversation by ID.
   */
  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    await delay(30, 80);
    const conv = db.conversations.find(
      (c) => c.id === conversationId && c.memberIds.includes(userId)
    );
    if (!conv) return null;

    const convMessages = db.messages.filter((m) => m.conversationId === conv.id);
    const unreadCount = convMessages.filter(
      (m) => m.senderId !== userId && m.status !== 'READ'
    ).length;
    const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : conv.lastMessage;

    return {
      ...conv,
      lastMessage: lastMsg,
      unreadCount,
    };
  },

  /**
   * Get or create a direct 1:1 conversation between two users.
   * Enforces canInteract(currentUser, targetUser, 'chat') strictly!
   */
  async getOrCreateDirectConversation(userId: string, targetUserId: string): Promise<Conversation> {
    await delay(60, 150);

    if (userId === targetUserId) {
      throw { status: 400, message: 'Cannot start a conversation with yourself.' };
    }

    const currentUser = db.users.find((u) => u.id === userId);
    const targetUser = db.users.find((u) => u.id === targetUserId);

    if (!currentUser || !targetUser) {
      throw { status: 404, message: 'User not found.' };
    }

    // Role-based interaction permission check
    const allowed = canInteract(currentUser, targetUser, 'chat');
    if (!allowed) {
      throw {
        status: 403,
        message: `Permission denied: ${currentUser.role} is not permitted to chat with ${targetUser.role} under campus policy.`,
      };
    }

    // Check if direct conversation already exists
    const existing = db.conversations.find(
      (c) =>
        c.type === 'DIRECT' &&
        c.memberIds.length === 2 &&
        c.memberIds.includes(userId) &&
        c.memberIds.includes(targetUserId)
    );

    if (existing) {
      return { ...existing };
    }

    // Create new direct conversation
    const newConv: Conversation = {
      id: `conv-dir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'DIRECT',
      memberIds: [userId, targetUserId],
      unreadCount: 0,
    };

    db.conversations.unshift(newConv);
    return { ...newConv };
  },

  /**
   * Create a group conversation.
   * Creator must be permitted to interact with ALL group members!
   */
  async createGroupConversation(
    creatorId: string,
    name: string,
    memberIds: string[]
  ): Promise<Conversation> {
    await delay(80, 200);

    const creator = db.users.find((u) => u.id === creatorId);
    if (!creator) {
      throw { status: 404, message: 'Creator not found.' };
    }

    if (!name || name.trim().length === 0) {
      throw { status: 400, message: 'Group name is required.' };
    }

    const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));
    if (uniqueMemberIds.length < 2) {
      throw { status: 400, message: 'A group conversation must have at least 2 members.' };
    }

    // Verify creator can interact with every single member
    for (const memberId of uniqueMemberIds) {
      if (memberId === creatorId) continue;
      const member = db.users.find((u) => u.id === memberId);
      if (!member) {
        throw { status: 404, message: `Member ${memberId} not found.` };
      }
      const allowed = canInteract(creator, member, 'chat');
      if (!allowed) {
        throw {
          status: 403,
          message: `Permission denied: Cannot include ${member.name} (${member.role}) in this group conversation.`,
        };
      }
    }

    const newGroup: Conversation = {
      id: `conv-grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'GROUP',
      name: name.trim(),
      memberIds: uniqueMemberIds,
      unreadCount: 0,
    };

    db.conversations.unshift(newGroup);
    return { ...newGroup };
  },

  /**
   * Fetch paginated messages for a conversation.
   */
  async getMessages(
    conversationId: string,
    options: GetMessagesOptions = {}
  ): Promise<PaginatedMessages> {
    await delay(50, 120);

    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw { status: 404, message: 'Conversation not found.' };
    }

    const limit = options.limit || 30;
    const page = options.page || 1;

    let allMessages = db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

    if (options.before) {
      const beforeTime = new Date(options.before).getTime();
      allMessages = allMessages.filter(
        (m) => new Date(m.sentAt).getTime() < beforeTime
      );
    }

    const total = allMessages.length;
    const totalPages = Math.ceil(total / limit) || 1;

    // Return the latest messages for the page (reverse-window slice)
    // Page 1 is the most recent `limit` messages
    const startIndex = Math.max(0, total - page * limit);
    const endIndex = Math.max(0, total - (page - 1) * limit);
    const pagedSlice = allMessages.slice(startIndex, endIndex);

    return {
      messages: pagedSlice.map((m) => ({ ...m })),
      total,
      hasMore: startIndex > 0,
      page,
      totalPages,
    };
  },

  /**
   * Send a message in a conversation.
   * Validates membership and canInteract() for direct chats!
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
    attachments: Attachment[] = []
  ): Promise<Message> {
    await delay(60, 150);

    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw { status: 404, message: 'Conversation not found.' };
    }

    if (!conv.memberIds.includes(senderId)) {
      throw { status: 403, message: 'User is not a member of this conversation.' };
    }

    const sender = db.users.find((u) => u.id === senderId);
    if (!sender) {
      throw { status: 404, message: 'Sender not found.' };
    }

    if ((!body || body.trim().length === 0) && attachments.length === 0) {
      throw { status: 400, message: 'Message body or attachment is required.' };
    }

    // If direct chat, verify permission between sender and receiver
    if (conv.type === 'DIRECT') {
      const recipientId = conv.memberIds.find((id) => id !== senderId);
      const recipient = db.users.find((u) => u.id === recipientId);
      if (recipient) {
        const allowed = canInteract(sender, recipient, 'chat');
        if (!allowed) {
          throw {
            status: 403,
            message: `Permission denied: Cannot send message to ${recipient.name}.`,
          };
        }
      }
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId,
      body: body ? body.trim() : '',
      attachments: attachments || [],
      sentAt: new Date().toISOString(),
      status: 'SENT',
    };

    db.messages.push(newMessage);
    conv.lastMessage = newMessage;

    // Create notification for other members
    const recipientIds = conv.memberIds.filter((id) => id !== senderId);
    for (const recipientId of recipientIds) {
      const notifTitle = conv.type === 'GROUP'
        ? `${sender.name} in ${conv.name || 'Group'}`
        : sender.name;
      const notifBody = newMessage.body || `Sent ${attachments.length} attachment(s)`;

      await notificationService.createNotification({
        userId: recipientId,
        type: 'MESSAGE',
        title: notifTitle,
        body: notifBody.length > 80 ? notifBody.slice(0, 77) + '...' : notifBody,
        link: `/chat/${conversationId}`,
      });
    }

    return { ...newMessage };
  },

  /**
   * Mark all unread messages in a conversation as READ for this user.
   */
  async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ conversationId: string; readCount: number }> {
    await delay(30, 80);

    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw { status: 404, message: 'Conversation not found.' };
    }

    let readCount = 0;
    db.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId !== userId && m.status !== 'READ') {
        m.status = 'READ';
        readCount++;
      }
    });

    conv.unreadCount = 0;
    return { conversationId, readCount };
  },

  /**
   * Leave a group conversation.
   */
  async leaveGroup(conversationId: string, userId: string): Promise<boolean> {
    await delay(50, 100);

    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw { status: 404, message: 'Conversation not found.' };
    }

    if (conv.type !== 'GROUP') {
      throw { status: 400, message: 'Cannot leave a direct conversation.' };
    }

    conv.memberIds = conv.memberIds.filter((id) => id !== userId);
    return true;
  },

  /**
   * Get eligible contacts for the current user to initiate chat with.
   * Grouped by role and strictly filtered through canInteract().
   */
  async getPermittedContacts(userId: string): Promise<{
    faculty: User[];
    students: User[];
    hod: User[];
    admin: User[];
  }> {
    await delay(40, 100);

    const currentUser = db.users.find((u) => u.id === userId);
    if (!currentUser) return { faculty: [], students: [], hod: [], admin: [] };

    const permitted = db.users.filter((other) => {
      if (other.id === userId) return false;
      return canInteract(currentUser, other, 'chat');
    });

    return {
      faculty: permitted.filter((u) => u.role === 'FACULTY'),
      students: permitted.filter((u) => u.role === 'STUDENT'),
      hod: permitted.filter((u) => u.role === 'HOD'),
      admin: permitted.filter((u) => u.role === 'ADMIN'),
    };
  },
};
