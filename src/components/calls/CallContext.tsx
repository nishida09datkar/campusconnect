import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { IncomingCallModal } from './IncomingCallModal';
import { OutgoingCallOverlay } from './OutgoingCallOverlay';
import { CallScreen } from './CallScreen';
import { PermissionErrorDialog } from './PermissionErrorDialog';

type CallContextType = ReturnType<typeof useWebRTC>;

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const rtc = useWebRTC();

  return (
    <CallContext.Provider value={rtc}>
      {children}

      {/* Global Incoming Call Ringing Dialog */}
      {rtc.callState === 'ringing' && rtc.activeCall && (
        <IncomingCallModal
          call={rtc.activeCall}
          onAccept={rtc.acceptCall}
          onDecline={rtc.declineCall}
        />
      )}

      {/* Global Outgoing Call Ringing Overlay */}
      {rtc.callState === 'calling' && rtc.activeCall && (
        <OutgoingCallOverlay
          call={rtc.activeCall}
          onCancel={rtc.cancelCall}
        />
      )}

      {/* Global Active Call Viewport (also while connecting, so the user can always hang up) */}
      {(rtc.callState === 'connecting' || rtc.callState === 'connected') && rtc.activeCall && (
        <CallScreen
          call={rtc.activeCall}
          localStream={rtc.localStream}
          remoteStream={rtc.remoteStream}
          isMuted={rtc.isMuted}
          isCameraOff={rtc.isCameraOff}
          isSharingScreen={rtc.isSharingScreen}
          onToggleMute={rtc.toggleMute}
          onToggleCamera={rtc.toggleCamera}
          onToggleScreenShare={rtc.isSharingScreen ? rtc.stopScreenShare : rtc.startScreenShare}
          onEndCall={rtc.endCall}
        />
      )}

      {/* Recoverable Permission Denial Dialog */}
      <PermissionErrorDialog
        error={rtc.permissionError}
        onClose={rtc.clearPermissionError}
      />
    </CallContext.Provider>
  );
};

export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
