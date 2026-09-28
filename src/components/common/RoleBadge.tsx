import React from 'react';
import { Role } from '@/types';
import { ROLE_COLORS, ROLE_LABELS } from '@/utils/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface RoleBadgeProps {
  role: Role;
  className?: string;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className, size = 'sm' }) => {
  const color = ROLE_COLORS[role] || ROLE_COLORS.STUDENT;
  const label = ROLE_LABELS[role] || role;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-semibold rounded-full border tracking-wide uppercase',
          color.bg,
          color.text,
          color.border,
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
          className
        )
      )}
    >
      {label}
    </span>
  );
};
