import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { PresenceDot } from './PresenceDot';
import { User, Conversation } from '@/types';
import { chatService } from '@/api/services/chat.service';
import { db } from '@/api/mock/db';
import { Check, Search, LogOut } from 'lucide-react';

interface GroupRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onGroupCreated: (newGroup: Conversation) => void;
  // If viewModeConversation is passed, the dialog operates in "View Members & Leave" mode
  viewModeConversation?: Conversation | null;
  onLeaveGroup?: (conversationId: string) => void;
}

export const GroupRoomDialog: React.FC<GroupRoomDialogProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGroupCreated,
  viewModeConversation,
  onLeaveGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [permittedContacts, setPermittedContacts] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load permitted contacts for the current user
  useEffect(() => {
    if (isOpen && !viewModeConversation) {
      chatService
        .getPermittedContacts(currentUser.id)
        .then((res) => {
          const allPermitted = [
            ...res.faculty,
            ...res.students,
            ...res.hod,
            ...res.admin,
          ];
          setPermittedContacts(allPermitted);
        })
        .catch(console.error);

      setGroupName('');
      setSelectedUserIds([]);
      setError(null);
      setSearch('');
    }
  }, [isOpen, currentUser.id, viewModeConversation]);

  const toggleUserSelection = (userId: string) => {
    setError(null);
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least 1 member to add.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newGroup = await chatService.createGroupConversation(
        currentUser.id,
        groupName.trim(),
        selectedUserIds
      );
      onGroupCreated(newGroup);
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to create group';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = permittedContacts.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // VIEW MEMBERS MODE
  if (viewModeConversation) {
    const members = viewModeConversation.memberIds
      .map((id) => db.users.find((u) => u.id === id))
      .filter(Boolean) as User[];

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={viewModeConversation.name || 'Group Members'}
        description={`${members.length} participants in this channel`}
        className="max-w-md"
      >
        <div className="space-y-4 py-2" data-testid="group-members-dialog">
          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-card">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                    <PresenceDot
                      userId={member.id}
                      size="sm"
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {member.name}
                      </span>
                      {member.id === currentUser.id && (
                        <span className="text-[10px] text-muted-foreground font-normal">(You)</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {member.designation || member.email}
                    </span>
                  </div>
                </div>
                <RoleBadge role={member.role} size="sm" />
              </div>
            ))}
          </div>

          {onLeaveGroup && (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <Button
                variant="danger"
                size="sm"
                className="gap-2"
                onClick={() => {
                  onLeaveGroup(viewModeConversation.id);
                  onClose();
                }}
                data-testid="leave-group-button"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Group</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </Dialog>
    );
  }

  // CREATE GROUP MODE
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      description="Connect permitted faculty, peers, and department colleagues"
      className="max-w-lg"
    >
      <form onSubmit={handleCreateGroup} className="space-y-4 py-2" data-testid="create-group-dialog">
        {error && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">
            Group Name
          </label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., CE-301 Study Group, Web Dev Lab Team"
            required
            data-testid="group-name-input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground">
              Add Permitted Members ({selectedUserIds.length} selected)
            </label>
            <span className="text-[11px] text-muted-foreground">
              Filtered by Section 3.2 Matrix
            </span>
          </div>

          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search eligible contacts..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-card">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No permitted contacts found matching search
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedUserIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleUserSelection(contact.id)}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer transition-colors"
                    data-testid={`contact-item-${contact.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar src={contact.avatarUrl} name={contact.name} size="sm" />
                        <PresenceDot
                          userId={contact.id}
                          size="sm"
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {contact.name}
                          </span>
                          <RoleBadge role={contact.role} size="sm" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {contact.designation || contact.email}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !groupName.trim() || selectedUserIds.length === 0}
            data-testid="confirm-create-group"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
