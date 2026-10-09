import React, { useRef, useEffect } from 'react';
import { Conversation, Message, User, Attachment } from '@/types';
import { db } from '@/api/mock/db';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { PresenceDot } from './PresenceDot';
import { ReadReceipt } from './ReadReceipt';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { formatDate } from '@/utils/format';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/features/ui/uiSlice';
import {
  ArrowLeft,
  Users,
  Paperclip,
  Download,
  Info,
  Loader2,
} from 'lucide-react';
import { AudioPlayer } from '@/components/common/AudioPlayer';
import { clsx } from 'clsx';

interface MessageThreadProps {
  conversation: Conversation;
  currentUser: User;
  messages: Message[];
  typingUserIds: string[];
  failedMessageIds: string[];
  isLoadingOlder?: boolean;
  hasMoreOlder?: boolean;
  onLoadOlder?: () => void;
  onSendMessage: (body: string, attachments: Attachment[]) => void;
  onRetryMessage: (tempId: string, body: string, attachments: Attachment[]) => void;
  onTyping: (isTyping: boolean) => void;
  onBack?: () => void;
  onViewGroupInfo?: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  currentUser,
  messages,
  typingUserIds,
  failedMessageIds,
  isLoadingOlder = false,
  hasMoreOlder = false,
  onLoadOlder,
  onSendMessage,
  onRetryMessage,
  onTyping,
  onBack,
  onViewGroupInfo,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);

  // Determine conversation details
  const isDirect = conversation.type === 'DIRECT';
  const otherUserId = isDirect
    ? conversation.memberIds.find((id) => id !== currentUser.id)
    : undefined;
  const otherUser = otherUserId ? db.users.find((u) => u.id === otherUserId) : undefined;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingUserIds.length]);

  // Handle scroll for infinite scroll upward
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMoreOlder && !isLoadingOlder && onLoadOlder) {
      previousScrollHeightRef.current = target.scrollHeight;
      onLoadOlder();
    }
  };

  // Adjust scroll after loading older messages
  useEffect(() => {
    if (scrollViewportRef.current && previousScrollHeightRef.current > 0) {
      const newScrollHeight = scrollViewportRef.current.scrollHeight;
      scrollViewportRef.current.scrollTop = newScrollHeight - previousScrollHeightRef.current;
      previousScrollHeightRef.current = 0;
    }
  }, [messages]);

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return formatDate(dateStr, 'MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col h-full bg-background" data-testid="message-thread">
      {/* Thread Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              title="Back to conversations"
              data-testid="thread-back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {isDirect ? (
            <div className="relative">
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
            <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                {isDirect ? otherUser?.name || 'Contact' : conversation.name || 'Group Chat'}
              </h2>
              {isDirect && otherUser && (
                <RoleBadge role={otherUser.role} size="sm" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isDirect ? (
                otherUser?.designation || (
                  <span className="flex items-center gap-1.5">
                    <PresenceDot userId={otherUser?.id} size="sm" />
                    <span>{otherUser ? 'Campus Member' : 'Offline'}</span>
                  </span>
                )
              ) : (
                `${conversation.memberIds.length} members`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isDirect && onViewGroupInfo && (
            <button
              onClick={onViewGroupInfo}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              title="Group details"
              data-testid="group-info-button"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Viewport */}
      <div
        ref={scrollViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        data-testid="messages-viewport"
      >
        {/* Loading older spinner */}
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send a greeting to start this conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.senderId === currentUser.id;
            const isTemp = Boolean(msg.tempId);
            const isFailed = isTemp && failedMessageIds.includes(msg.tempId!);
            const sender = db.users.find((u) => u.id === msg.senderId);

            // Date separator check
            const currentDateLabel = getDateLabel(msg.sentAt);
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator =
              !prevMessage || getDateLabel(prevMessage.sentAt) !== currentDateLabel;

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground shadow-xs">
                      {currentDateLabel}
                    </span>
                  </div>
                )}

                <MessageBubbleItem
                  msg={msg}
                  isSelf={isSelf}
                  isDirect={isDirect}
                  senderName={sender?.name}
                  isTemp={isTemp}
                  isFailed={isFailed}
                  onRetryMessage={onRetryMessage}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator inside thread */}
        {typingUserIds.length > 0 && (
          <div className="pt-1">
            <TypingIndicator typingUserIds={typingUserIds} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        placeholder={
          isDirect
            ? `Message ${otherUser?.name || 'contact'}...`
            : `Message ${conversation.name || 'group'}...`
        }
      />
    </div>
  );
};

interface MessageBubbleItemProps {
  msg: Message;
  isSelf: boolean;
  isDirect: boolean;
  senderName?: string;
  isTemp: boolean;
  isFailed: boolean;
  onRetryMessage: (tempId: string, body: string, attachments: Attachment[]) => void;
}

const MessageBubbleItem = React.memo<MessageBubbleItemProps>(
  ({ msg, isSelf, isDirect, senderName, isTemp, isFailed, onRetryMessage }) => {
    const dispatch = useAppDispatch();

    return (
      <div
        className={clsx(
          'flex flex-col max-w-[80%] md:max-w-[70%]',
          isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
        )}
        data-testid="message-bubble"
      >
        {/* Sender Name in Group chats */}
        {!isDirect && !isSelf && (
          <span className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">
            {senderName || 'Member'}
          </span>
        )}

        {/* Bubble Content */}
        <div
          className={clsx(
            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs',
            isSelf
              ? 'bg-primary-600 text-white rounded-br-xs'
              : 'bg-card border border-border text-foreground rounded-bl-xs'
          )}
        >
          {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}

          {/* Audio Note player if present on message */}
          {msg.audioUrl && (
            <div className="mt-2">
              <AudioPlayer
                src={msg.audioUrl}
                title="Voice Note"
                duration={msg.audioDurationSec}
                compact
              />
            </div>
          )}

          {/* Attachments within message */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {msg.attachments.map((att) => {
                const isAudio =
                  att.mime?.startsWith('audio/') ||
                  att.name?.toLowerCase().endsWith('.wav') ||
                  att.name?.toLowerCase().endsWith('.webm') ||
                  att.name?.toLowerCase().endsWith('.mp3') ||
                  att.name?.toLowerCase().startsWith('voice note');

                if (isAudio) {
                  return (
                    <AudioPlayer
                      key={att.id}
                      src={att.url}
                      title={att.name || 'Voice Note'}
                      compact
                    />
                  );
                }

                return (
                  <div
                    key={att.id}
                    onClick={() =>
                      dispatch(
                        addToast({
                          type: 'info',
                          message: `Simulating download of ${att.name}`,
                        })
                      )
                    }
                    className={clsx(
                      'flex items-center justify-between gap-3 p-2 rounded-xl text-xs cursor-pointer transition-colors',
                      isSelf
                        ? 'bg-primary-700/60 hover:bg-primary-700 text-white'
                        : 'bg-muted/70 hover:bg-muted text-foreground border border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">{att.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-[10px] opacity-80">
                      <span>{att.sizeKb} KB</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Meta (Time + Receipt) */}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDate(msg.sentAt, 'h:mm a')}
          </span>
          {isSelf && (
            <ReadReceipt
              status={msg.status}
              isPending={isTemp && !isFailed}
              isFailed={isFailed}
              onRetry={() =>
                isTemp && onRetryMessage(msg.tempId!, msg.body, msg.attachments)
              }
            />
          )}
        </div>
      </div>
    );
  }
);
MessageBubbleItem.displayName = 'MessageBubbleItem';
