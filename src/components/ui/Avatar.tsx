import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getInitials } from '@/utils/format';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name = '', size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold overflow-hidden border border-border select-none bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300',
          sizes[size],
          className
        )
      )}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};