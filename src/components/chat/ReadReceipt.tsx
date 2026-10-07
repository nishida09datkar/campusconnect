import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ReadReceiptProps {
  status: 'SENT' | 'DELIVERED' | 'READ';
  isPending?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ReadReceipt: React.FC<ReadReceiptProps> = ({
  status,
  isPending = false,
  isFailed = false,
  onRetry,
  className,
}) => {
  if (isFailed) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 text-[11px] text-destructive cursor-pointer hover:underline',
          className
        )}
        onClick={onRetry}
        title="Sending failed. Click to retry."
        data-testid="read-receipt-failed"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Retry</span>
      </span>
    );
  }

  if (isPending) {
    return (
      <span
        className={clsx('inline-flex items-center text-muted-foreground/60', className)}
        title="Sending..."
        data-testid="read-receipt-pending"
      >
        <Clock className="w-3 h-3 animate-spin" />
      </span>
    );
  }

  if (status === 'READ') {
    return (
      <span
        className={clsx('inline-flex items-center text-sky-500', className)}
        title="Read"
        data-testid="read-receipt-read"
      >
        <CheckCheck className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (status === 'DELIVERED') {
    return (
      <span
        className={clsx('inline-flex items-center text-muted-foreground/70', className)}
        title="Delivered"
        data-testid="read-receipt-delivered"
      >
        <CheckCheck className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span
      className={clsx('inline-flex items-center text-muted-foreground/70', className)}
      title="Sent"
      data-testid="read-receipt-sent"
    >
      <Check className="w-3.5 h-3.5" />
    </span>
  );
};
