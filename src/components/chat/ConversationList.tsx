import React, { useState, useEffect } from 'react';
import { Conversation, User } from '@/types';
import { db } from '@/api/mock/db';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { PresenceDot } from './PresenceDot';
import { chatService } from '@/api/services/chat.service';
import { formatDate } from '@/utils/format';
import {
  Search,
  Users,
  MessageSquare,
  UserPlus,
  Plus,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentUser: User;
  onSelectConversation: (conversationId: string) => void;
  onStartDirectConversation: (targetUserId: string) => void;
  onOpenCreateGroup: () => void;
  className?: string;
}

type TabType = 'conversations' | 'contacts';

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  currentUser,
  onSelectConversation,
  onStartDirectConversation,
  onOpenCreateGroup,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [search, setSearch] = useState('');
  const [permittedContacts, setPermittedContacts] = useState<{
    faculty: User[];
    students: User[];
    hod: User[];
    admin: User[];
  }>({ faculty: [], students: [], hod: [], admin: [] });

  useEffect(() => {
    chatService.getPermittedContacts(currentUser.id).then(setPermittedContacts).catch(console.error);
  }, [currentUser.id]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    if (c.name && c.name.toLowerCase().includes(query)) return true;
    if (c.type === 'DIRECT') {
      const otherId = c.memberIds.find((id) => id !== currentUser.id);
      const other = db.users.find((u) => u.id === otherId);
      if (other && (other.name.toLowerCase().includes(query) || other.email.toLowerCase().includes(query))) {
        return true;
      }
    }
    if (c.lastMessage?.body && c.lastMessage.body.toLowerCase().includes(query)) {
      return true;
    }
    return false;
  });

  // Filter contacts
  const filterList = (users: User[]) =>
    users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.designation && u.designation.toLowerCase().includes(search.toLowerCase()))
    );

  const filteredFaculty = filterList(permittedContacts.faculty);
  const filteredStudents = filterList(permittedContacts.students);
  const filteredHod = filterList(permittedContacts.hod);
  const filteredAdmin = filterList(permittedContacts.admin);

  return (
    <div
      className={clsx('flex flex-col h-full bg-card border-r border-border', className)}
      data-testid="conversation-list"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <span>Messages</span>
          </h1>
          <button
            onClick={onOpenCreateGroup}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Create Group Channel"
            data-testid="new-group-button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-0.5 rounded-xl bg-muted/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('conversations')}
            className={clsx(
              'flex-1 py-1.5 rounded-lg transition-all text-center',
              activeTab === 'conversations'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
            data-testid="conversations-tab"
          >
            Chats ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={clsx(
              'flex-1 py-1.5 rounded-lg transition-all text-center',
              activeTab === 'contacts'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
            data-testid="contacts-tab"
          >
            Contacts
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'conversations' ? 'Search chats...' : 'Search contacts...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            data-testid="conversation-search-input"
          />
        </div>
      </div>

      {/* Tab 1: Conversations List */}
      {activeTab === 'conversations' && (
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs font-medium">No conversations found</p>
              <button
                onClick={() => setActiveTab('contacts')}
                className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Start a chat from Contacts
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isDirect = conv.type === 'DIRECT';
              const otherId = isDirect
                ? conv.memberIds.find((id) => id !== currentUser.id)
                : undefined;
              const otherUser = otherId ? db.users.find((u) => u.id === otherId) : undefined;
              const isSelected = activeConversationId === conv.id;

              const title = isDirect
                ? otherUser?.name || 'Campus Contact'
                : conv.name || 'Group Chat';

              const lastBody = conv.lastMessage?.body
                ? conv.lastMessage.body
                : conv.lastMessage?.attachments?.length
                ? `[Attachment: ${conv.lastMessage.attachments[0].name}]`
                : 'No messages yet';

              const timeStr = conv.lastMessage?.sentAt
                ? formatDate(conv.lastMessage.sentAt, 'h:mm a')
                : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={clsx(
                    'flex items-center gap-3 p-3 cursor-pointer transition-colors relative',
                    isSelected
                      ? 'bg-primary-500/10 border-l-4 border-primary-600'
                      : 'hover:bg-muted/40'
                  )}
                  data-testid={`conversation-item-${conv.id}`}
                >
                  {isDirect ? (
                    <div className="relative shrink-0">
                      <Avatar
                        src={otherUser?.avatarUrl}
                        name={otherUser?.name || 'Contact'}
                        size="md"
                      />
                      <PresenceDot
                        userId={otherUser?.id}
                        className="absolute -bottom-0.5 -right-0.5"
                        size="md"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {title}
                      </span>
                      {timeStr && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {timeStr}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-muted-foreground truncate">
                        {lastBody}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold"
                          data-testid={`unread-badge-${conv.id}`}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Permitted Contacts Grouped by Role */}
      {activeTab === 'contacts' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-4" data-testid="permitted-contacts-list">
          {/* HOD */}
          {filteredHod.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Department Head ({filteredHod.length})
              </span>
              <div className="mt-1 divide-y divide-border/40">
                {filteredHod.map((u) => (
                  <ContactRow
                    key={u.id}
                    user={u}
                    onClick={() => onStartDirectConversation(u.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Faculty */}
          {filteredFaculty.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Faculty ({filteredFaculty.length})
              </span>
              <div className="mt-1 divide-y divide-border/40">
                {filteredFaculty.map((u) => (
                  <ContactRow
                    key={u.id}
                    user={u}
                    onClick={() => onStartDirectConversation(u.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Students */}
          {filteredStudents.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Classmates & Peers ({filteredStudents.length})
              </span>
              <div className="mt-1 divide-y divide-border/40">
                {filteredStudents.map((u) => (
                  <ContactRow
                    key={u.id}
                    user={u}
                    onClick={() => onStartDirectConversation(u.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin */}
          {filteredAdmin.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Administration ({filteredAdmin.length})
              </span>
              <div className="mt-1 divide-y divide-border/40">
                {filteredAdmin.map((u) => (
                  <ContactRow
                    key={u.id}
                    user={u}
                    onClick={() => onStartDirectConversation(u.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredFaculty.length === 0 &&
            filteredStudents.length === 0 &&
            filteredHod.length === 0 &&
            filteredAdmin.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No permitted contacts found matching search
              </div>
            )}
        </div>
      )}
    </div>
  );
};

interface ContactRowProps {
  user: User;
  onClick: () => void;
}

const ContactRow: React.FC<ContactRowProps> = ({ user, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
    data-testid={`contact-row-${user.id}`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="relative shrink-0">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <PresenceDot
          userId={user.id}
          className="absolute -bottom-0.5 -right-0.5"
          size="sm"
        />
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-foreground truncate block">
          {user.name}
        </span>
        <span className="text-[10px] text-muted-foreground truncate block">
          {user.designation || user.email}
        </span>
      </div>
    </div>
    <RoleBadge role={user.role} size="sm" />
  </div>
);
