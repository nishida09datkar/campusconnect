import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString?: string, formatPattern = 'MMM d, yyyy'): string => {
  if (!dateString) return '—';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '—';
    return format(date, formatPattern);
  } catch {
    return '—';
  }
};

export const formatTime = (dateString?: string): string => {
  return formatDate(dateString, 'h:mm a');
};

export const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
};

export const formatFileSize = (sizeKb: number): string => {
  if (sizeKb < 1024) {
    return `${sizeKb} KB`;
  }
  return `${(sizeKb / 1024).toFixed(1)} MB`;
};

export const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
