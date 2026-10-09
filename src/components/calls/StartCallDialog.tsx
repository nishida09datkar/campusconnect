import React, { useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { User, Role } from '@/types';
import { db } from '@/api/mock/db';
import { canInteract } from '@/utils/permissions';
import { useCall } from './CallContext';
import {
  Phone,
  Video,
  Search,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StartCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const StartCallDialog: React.FC<StartCallDialogProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'CALLABLE' | Role>('CALLABLE');
  const { startCall } = useCall();
  const navigate = useNavigate();

  // Evaluate all contacts with policy permissions
  const contactList = useMemo(() => {
    if (!currentUser) return [];

    return db.users
      .filter((u) => u.id !== currentUser.id && u.isActive)
      .map((user) => {
        const callable = canInteract(currentUser, user, 'call');
        const chatable = canInteract(currentUser, user, 'chat');

        // Resolve department name
        const dept = db.departments.find((d) => d.id === user.departmentId);

        return {
          user,
          callable,
          chatable,
          departmentName: dept?.name || '',
          departmentCode: dept?.code || '',
        };
      });
  }, [currentUser]);

  // Filter contacts by tab and search query
  const filteredContacts = useMemo(() => {
    return contactList.filter((item) => {
      // Tab filter
      if (selectedRole === 'CALLABLE' && !item.callable) return false;
      if (
        selectedRole !== 'ALL' &&
        selectedRole !== 'CALLABLE' &&
        item.user.role !== selectedRole
      ) {
        return false;
      }

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchName = item.user.name.toLowerCase().includes(q);
      const matchEmail = item.user.email.toLowerCase().includes(q);
      const matchRoll = item.user.rollNo?.toLowerCase().includes(q);
      const matchDept = item.departmentName.toLowerCase().includes(q) || item.departmentCode.toLowerCase().includes(q);

      return matchName || matchEmail || matchRoll || matchDept;
    });
  }, [contactList, selectedRole, search]);

  const callableCount = contactList.filter((c) => c.callable).length;

  const handleStartCall = (contact: User, kind: 'VOICE' | 'VIDEO') => {
    onClose();
    startCall(contact.id, kind, contact);
  };

  const handleOpenChat = (contact: User) => {
    onClose();
    navigate('/chat', { state: { selectedUserId: contact.id } });
  };

  if (!currentUser) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Start a Call or Direct Contact"
      description="Connect instantly via WebRTC audio/video or chat based on campus communication policy"
      className="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        {/* Admin Policy Notice banner if user is Admin */}
        {currentUser.role === 'ADMIN' && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Administrator Call Policy Notice</p>
              <p className="text-muted-foreground mt-0.5">
                Per CampusConnect institutional policies, Administrator accounts publish broadcast notices and monitor text support. Peer-to-peer VoIP calls are restricted for admin accounts.
              </p>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, department, or student roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedRole('CALLABLE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              selectedRole === 'CALLABLE'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Callable Now ({callableCount})</span>
          </button>

          <button
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedRole === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            All Contacts ({contactList.length})
          </button>

          <button
            onClick={() => setSelectedRole('STUDENT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedRole === 'STUDENT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            Students
          </button>

          <button
            onClick={() => setSelectedRole('FACULTY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedRole === 'FACULTY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            Faculty
          </button>

          <button
            onClick={() => setSelectedRole('HOD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedRole === 'HOD'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            HODs
          </button>
        </div>

        {/* Contact List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 px-4 bg-muted/20 border border-dashed border-border rounded-xl">
              <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">No contacts found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedRole === 'CALLABLE'
                  ? 'No contacts currently match your institutional calling permissions.'
                  : 'Try adjusting your search query or selected category.'}
              </p>
            </div>
          ) : (
            filteredContacts.map(({ user, callable, chatable, departmentCode }) => (
              <div
                key={user.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  callable
                    ? 'bg-card hover:bg-muted/40 border-border shadow-sm'
                    : 'bg-muted/15 border-border/60 opacity-80'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="md"
                      className="border border-border"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                        callable ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                      }`}
                      title={callable ? 'Eligible for VoIP Call' : 'Chat Only / Restricted'}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {user.name}
                      </span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{user.email}</span>
                      {departmentCode && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{departmentCode}</span>
                        </>
                      )}
                      {user.rollNo && (
                        <>
                          <span>•</span>
                          <span>Roll: {user.rollNo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {callable ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartCall(user, 'VOICE')}
                        className="h-8 px-3 text-xs gap-1.5 rounded-lg"
                        title={`Voice call ${user.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Voice</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartCall(user, 'VIDEO')}
                        className="h-8 px-3 text-xs gap-1.5 rounded-lg"
                        title={`Video call ${user.name}`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video</span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground px-2 py-1 rounded bg-muted/60">
                        {chatable ? 'Chat Only (Policy)' : 'Restricted (Policy)'}
                      </span>
                      {chatable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenChat(user)}
                          className="h-8 px-2.5 text-xs gap-1 rounded-lg"
                          title={`Message ${user.name}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Chat</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
          <span>CampusConnect VoIP Policy Enforced</span>
          <Button variant="outline" size="sm" onClick={onClose} className="px-4">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
