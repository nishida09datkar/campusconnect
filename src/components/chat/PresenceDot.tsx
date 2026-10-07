import React from 'react';
import { usePresence } from '@/hooks/usePresence';
import { formatDate } from '@/utils/format';
import { clsx } from 'clsx';

interface PresenceDotProps {
  userId?: string;
  online?: boolean;
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const PresenceDot: React.FC<PresenceDotProps> = ({
  userId,
  online: propOnline,
  lastSeen: propLastSeen,
  size = 'md',
  showTooltip = true,
  className,
}) => {
  const presence = usePresence(userId);

  const isOnline = propOnline !== undefined ? propOnline : presence.online;
  const lastSeen = propLastSeen !== undefined ? propLastSeen : presence.lastSeen;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const getTooltipText = () => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    try {
      return `Last seen ${formatDate(lastSeen, 'MMM d, h:mm a')}`;
    } catch {
      return 'Offline';
    }
  };

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center shrink-0', className)}
      title={showTooltip ? getTooltipText() : undefined}
      data-testid="presence-dot"
      data-status={isOnline ? 'online' : 'offline'}
    >
      <span
        className={clsx(
          'rounded-full ring-2 ring-card transition-colors duration-300',
          sizeClasses[size],
          isOnline
            ? 'bg-emerald-500 animate-pulse'
            : 'bg-muted-foreground/40'
        )}
      />
    </div>
  );
};
