import React from 'react';
import { db } from '@/api/mock/db';
import { clsx } from 'clsx';

interface TypingIndicatorProps {
  typingUserIds: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUserIds,
  className,
}) => {
  if (!typingUserIds || typingUserIds.length === 0) return null;

  const names = typingUserIds
    .map((id) => {
      const user = db.users.find((u) => u.id === id);
      return user ? user.name.split(' ')[0] : 'Someone';
    })
    .join(', ');

  const label = typingUserIds.length === 1 ? `${names} is typing...` : `${names} are typing...`;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground animate-fadeIn',
        className
      )}
      data-testid="typing-indicator"
    >
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" />
      </div>
      <span className="font-medium text-[11px]">{label}</span>
    </div>
  );
};
