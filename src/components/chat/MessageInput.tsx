import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MAX_UPLOAD_MB } from '@/api/config';
import { Attachment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface MessageInputProps {
  onSendMessage: (body: string, attachments: Attachment[]) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(false);
    };
  }, [onTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setErrorMessage(null);

    // Emit typing indicator with debounce
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const sizeMb = file.size / (1024 * 1024);

    if (sizeMb > MAX_UPLOAD_MB) {
      setErrorMessage(`File exceeds the maximum allowed limit of ${MAX_UPLOAD_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      sizeKb: Math.round(file.size / 1024) || 1,
      mime: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    };

    setAttachments((prev) => [...prev, newAttachment]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) {
      return;
    }

    onSendMessage(trimmed, attachments);
    setText('');
    setAttachments([]);
    setErrorMessage(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, attachments, onSendMessage, onTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = disabled || (!text.trim() && attachments.length === 0);

  return (
    <div className="border-t border-border bg-card p-3 space-y-2">
      {errorMessage && (
        <div
          data-testid="message-input-error"
          className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-destructive/80 hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachments preview tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1" data-testid="attachments-preview">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-foreground border border-border"
            >
              <FileText className="w-3.5 h-3.5 text-primary-500" />
              <span className="max-w-[150px] truncate">{att.name}</span>
              <span className="text-[10px] text-muted-foreground">({att.sizeKb} KB)</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                title="Remove attachment"
                data-testid={`remove-attachment-${att.id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input controls */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          data-testid="file-upload-input"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-2 text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          title={`Attach file (max ${MAX_UPLOAD_MB}MB)`}
          disabled={disabled}
          data-testid="attach-button"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={clsx(
              'w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              'min-h-[42px] max-h-32'
            )}
            data-testid="message-textarea"
          />
        </div>

        <Button
          type="button"
          size="sm"
          className="h-10 w-10 p-0 rounded-full shrink-0 flex items-center justify-center shadow-sm"
          disabled={isSendDisabled}
          onClick={handleSend}
          title="Send message (Enter)"
          data-testid="send-button"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
