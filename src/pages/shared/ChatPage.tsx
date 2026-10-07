import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@/features/chat/useChat';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageThread } from '@/components/chat/MessageThread';
import { GroupRoomDialog } from '@/components/chat/GroupRoomDialog';
import { chatService } from '@/api/services/chat.service';
import { conversationCreated, groupLeft } from '@/features/chat/chatSlice';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/features/ui/uiSlice';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { Conversation } from '@/types';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentUser,
    conversations,
    activeConversation,
    messages,
    typingUserIds,
    failedMessageIds,
    loading,
    selectConversation,
    sendMessage,
    retryMessage,
    setTyping,
  } = useChat();

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<Conversation | null>(null);

  // Sync route param with active conversation
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    } else {
      selectConversation(null);
    }
  }, [conversationId, selectConversation]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm font-semibold">Please log in to access Campus Chat.</p>
      </div>
    );
  }

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleBackToList = () => {
    navigate('/chat');
  };

  const handleStartDirectConversation = async (targetUserId: string) => {
    try {
      const conv = await chatService.getOrCreateDirectConversation(currentUser.id, targetUserId);
      dispatch(conversationCreated(conv));
      navigate(`/chat/${conv.id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Cannot start conversation';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  const handleGroupCreated = (newGroup: Conversation) => {
    dispatch(conversationCreated(newGroup));
    dispatch(addToast({ type: 'success', message: `Group "${newGroup.name}" created` }));
    navigate(`/chat/${newGroup.id}`);
  };

  const handleLeaveGroup = async (id: string) => {
    try {
      await chatService.leaveGroup(id, currentUser.id);
      dispatch(groupLeft({ conversationId: id, userId: currentUser.id }));
      dispatch(addToast({ type: 'info', message: 'You left the group channel' }));
      navigate('/chat');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to leave group';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  return (
    <div
      className="h-[calc(100vh-4rem)] flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      data-testid="chat-page-root"
    >
      {/* Left Pane: Conversations & Contacts */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col ${
          conversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {loading.conversations && conversations.length === 0 ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversationId={conversationId || null}
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
            onStartDirectConversation={handleStartDirectConversation}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          />
        )}
      </div>

      {/* Right Pane: Active Thread or Empty View */}
      <div
        className={`flex-1 h-full flex flex-col min-w-0 ${
          conversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <MessageThread
            conversation={activeConversation}
            currentUser={currentUser}
            messages={messages}
            typingUserIds={typingUserIds}
            failedMessageIds={failedMessageIds}
            onSendMessage={sendMessage}
            onRetryMessage={retryMessage}
            onTyping={setTyping}
            onBack={handleBackToList}
            onViewGroupInfo={() => setViewingGroup(activeConversation)}
          />
        ) : (
          <div
            className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10"
            data-testid="chat-empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mb-4 shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-foreground">Campus Unified Chat</h2>
            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
              Select an ongoing thread or pick a permitted faculty member, classmate, or HOD from
              contacts to start a conversation.
            </p>
          </div>
        )}
      </div>

      {/* Group Room Dialog (Create Mode) */}
      <GroupRoomDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        currentUser={currentUser}
        onGroupCreated={handleGroupCreated}
      />

      {/* Group Room Dialog (View & Leave Mode) */}
      {viewingGroup && (
        <GroupRoomDialog
          isOpen={Boolean(viewingGroup)}
          onClose={() => setViewingGroup(null)}
          currentUser={currentUser}
          onGroupCreated={() => {}}
          viewModeConversation={viewingGroup}
          onLeaveGroup={handleLeaveGroup}
        />
      )}
    </div>
  );
};

export default ChatPage;
