import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PermissionErrorDialogProps {
  error: string | null;
  onClose: () => void;
}

export const PermissionErrorDialog: React.FC<PermissionErrorDialogProps> = ({ error, onClose }) => {
  if (!error) return null;

  const isPolicyError = error.toLowerCase().includes('policy') || error.toLowerCase().includes('restrict');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-destructive/30 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {isPolicyError ? 'Communication Policy Notice' : 'Media Permission Notice'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isPolicyError ? 'Institutional access control policy' : 'Action required to enable audio/video'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed bg-muted/40 p-3 rounded-lg border border-border">
          {error}
        </p>

        {isPolicyError ? (
          <div className="text-xs text-muted-foreground space-y-1 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
            <p className="font-medium text-amber-500">Institutional Policy Rules:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Students:</strong> May only call faculty whose classes they are currently enrolled in (calls to other students are restricted).</li>
              <li><strong>Faculty:</strong> May call enrolled students, other faculty, or department HODs.</li>
              <li><strong>Admins:</strong> Manage announcements and text support; direct VoIP calls are not permitted.</li>
            </ul>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Troubleshooting tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>Click the padlock/settings icon in your browser URL bar.</li>
              <li>Ensure Microphone and Camera permissions are set to "Allow".</li>
              <li>Verify your headset or webcam is not in use by another app.</li>
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose} className="px-5">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
