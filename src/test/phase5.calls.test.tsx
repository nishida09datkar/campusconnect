import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import { db } from '@/api/mock/db';
import { socketClient } from '@/socket/socketClient';
import { useWebRTC } from '@/hooks/useWebRTC';
import { IncomingCallModal } from '@/components/calls/IncomingCallModal';
import { CallControls } from '@/components/calls/CallControls';
import { ActiveCallData } from '@/hooks/useWebRTC';

// Web Audio API mock
class MockAudioContext {
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
  close() {
    return Promise.resolve();
  }
  currentTime = 0;
  destination = {};
}

// WebRTC RTCPeerConnection Mock
class MockRTCPeerConnection {
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  addTrack = vi.fn();
  close = vi.fn();
  getSenders = vi.fn().mockReturnValue([]);
  ontrack: any = null;
  onicecandidate: any = null;
}

const mockTrack = {
  kind: 'video',
  enabled: true,
  stop: vi.fn(),
};

const mockMediaStream = {
  id: 'stream-1',
  getTracks: vi.fn().mockReturnValue([mockTrack]),
  getAudioTracks: vi.fn().mockReturnValue([{ enabled: true, stop: vi.fn() }]),
  getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
};

describe('Phase 5 — WebRTC Calls & Live Lectures Specification Tests', () => {
  const facNeha = db.users.find((u) => u.id === 'user-fac-neha')!; // CE, teaches Web Dev
  const stu1 = db.users.find((u) => u.id === 'user-stu-1')!; // CE, enrolled in Web Dev with Neha
  const stu5 = db.users.find((u) => u.id === 'user-stu-5')!; // CE Div B (NOT in Neha's class)

  beforeEach(() => {
    vi.useFakeTimers();
    (window as any).AudioContext = MockAudioContext;
    (window as any).RTCPeerConnection = MockRTCPeerConnection;
    (window as any).RTCSessionDescription = vi.fn((init) => init);
    (window as any).RTCIceCandidate = vi.fn((init) => init);

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockMediaStream);
    } else {
      (navigator as any).mediaDevices = {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream),
      };
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createTestStore = (user: any) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          accessToken: 'mock-token',
          status: 'authenticated' as const,
          error: null,
        },
      },
    });
  };

  /* ===================================================================
   * 1. PERMISSION-CHECK NEGATIVE TEST
   * =================================================================== */
  describe('1. WebRTC Permission Enforcement', () => {
    it('NEGATIVE TEST: Unassigned student call request is strictly rejected before any signaling', async () => {
      const emitSpy = vi.spyOn(socketClient, 'emit');
      const store = createTestStore(stu5); // stu5 is NOT enrolled in Neha's class

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useWebRTC(), { wrapper });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.startCall(facNeha.id, 'VOICE');
      });

      // Must be rejected
      expect(success).toBe(false);
      expect(result.current.permissionError).toContain('Communication policy restricts');

      // CRITICAL: socketClient.emit must NEVER be called with call:request
      expect(emitSpy).not.toHaveBeenCalledWith('call:request', expect.anything());
    });

    it('POSITIVE TEST: Enrolled student can initiate call with assigned faculty', async () => {
      const emitSpy = vi.spyOn(socketClient, 'emit');
      const store = createTestStore(stu1); // stu1 is enrolled with Neha

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useWebRTC(), { wrapper });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.startCall(facNeha.id, 'VOICE');
      });

      expect(success).toBe(true);
      expect(result.current.callState).toBe('calling');
      expect(emitSpy).toHaveBeenCalledWith('call:request', expect.objectContaining({
        callerId: stu1.id,
        calleeId: facNeha.id,
        kind: 'VOICE',
      }));
    });
  });

  /* ===================================================================
   * 2. CALL STATE TRANSITIONS
   * =================================================================== */
  describe('2. Call State Transitions', () => {
    it('Transitions through idle -> calling -> ringing -> connected -> ended', async () => {
      const store = createTestStore(stu1);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useWebRTC(), { wrapper });
      expect(result.current.callState).toBe('idle');

      // 1. Caller starts call -> 'calling'
      await act(async () => {
        await result.current.startCall(facNeha.id, 'VIDEO');
      });
      expect(result.current.callState).toBe('calling');

      // End outgoing call before testing incoming
      act(() => {
        result.current.endCall();
      });

      // 2. Callee receives incoming -> 'ringing'
      act(() => {
        socketClient.emit('call:incoming', {
          callId: 'call-test-99',
          callerId: facNeha.id,
          callerName: facNeha.name,
          calleeId: stu1.id,
          kind: 'VIDEO',
        });
      });
      expect(result.current.callState).toBe('ringing');
      expect(result.current.activeCall?.callerName).toBe(facNeha.name);

      // 3. Accepted -> 'connecting' / 'connected'
      await act(async () => {
        await result.current.acceptCall();
      });
      expect(['connecting', 'connected']).toContain(result.current.callState);

      // 4. End call -> 'ended'
      act(() => {
        result.current.endCall();
      });
      expect(result.current.callState).toBe('ended');
      expect(result.current.activeCall).toBeNull();
    });
  });

  /* ===================================================================
   * 3. CLEANUP ON UNMOUNT
   * =================================================================== */
  describe('3. Stream and Track Cleanup on Unmount', () => {
    it('Stops all active audio and video tracks and closes peer connection on unmount', async () => {
      const testTrack = {
        kind: 'video',
        enabled: true,
        stop: vi.fn(),
      };
      const testStream = {
        id: 'stream-test',
        getTracks: vi.fn().mockReturnValue([testTrack]),
        getAudioTracks: vi.fn().mockReturnValue([{ enabled: true, stop: vi.fn() }]),
        getVideoTracks: vi.fn().mockReturnValue([testTrack]),
      };
      (navigator as any).mediaDevices.getUserMedia = vi.fn().mockResolvedValue(testStream);

      const store = createTestStore(stu1);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result, unmount } = renderHook(() => useWebRTC(), { wrapper });

      await act(async () => {
        await result.current.startCall(facNeha.id, 'VIDEO');
      });

      expect(testTrack.stop).not.toHaveBeenCalled();

      // Trigger unmount
      unmount();

      // Track cleanup verification
      expect(testTrack.stop).toHaveBeenCalled();
    });
  });

  /* ===================================================================
   * 4. INCOMING CALL MODAL: ACCEPT, DECLINE & 30S TIMEOUT
   * =================================================================== */
  describe('4. IncomingCallModal Behavior', () => {
    const mockCall: ActiveCallData = {
      callId: 'call-incoming-1',
      callerId: facNeha.id,
      callerName: facNeha.name,
      calleeId: stu1.id,
      kind: 'VIDEO',
      startedAt: new Date().toISOString(),
    };

    it('Fires onAccept when Accept button is clicked', () => {
      const onAccept = vi.fn();
      const onDecline = vi.fn();

      render(
        <IncomingCallModal
          call={mockCall}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      );

      expect(screen.getByText(facNeha.name)).toBeDefined();
      expect(screen.getByText(/Incoming VIDEO Call/i)).toBeDefined();

      const acceptBtn = screen.getByLabelText(/Accept Call/i);
      fireEvent.click(acceptBtn);
      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('Fires onDecline when Decline button is clicked', () => {
      const onAccept = vi.fn();
      const onDecline = vi.fn();

      render(
        <IncomingCallModal
          call={mockCall}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      );

      const declineBtn = screen.getByLabelText(/Decline Call/i);
      fireEvent.click(declineBtn);
      expect(onDecline).toHaveBeenCalledWith('Declined');
    });

    it('Automatically triggers onDecline("Timeout") when 30s expires', () => {
      const onAccept = vi.fn();
      const onDecline = vi.fn();

      render(
        <IncomingCallModal
          call={mockCall}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      );

      expect(screen.getByText(/Auto-misses in 30s/i)).toBeDefined();

      // Advance timers by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(onDecline).toHaveBeenCalledWith('Timeout');
    });
  });

  /* ===================================================================
   * 5. CALL CONTROLS TOGGLE STATES
   * =================================================================== */
  describe('5. CallControls Toggle States', () => {
    it('Triggers respective toggle and action callbacks on button click', () => {
      const onToggleMute = vi.fn();
      const onToggleCamera = vi.fn();
      const onToggleScreenShare = vi.fn();
      const onEndCall = vi.fn();

      render(
        <CallControls
          isMuted={false}
          isCameraOff={false}
          isSharingScreen={false}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
          qualityBadge="HD"
        />
      );

      // Verify quality badge
      expect(screen.getByText('HD')).toBeDefined();

      // Mute toggle
      const muteBtn = screen.getByLabelText(/Mute microphone/i);
      fireEvent.click(muteBtn);
      expect(onToggleMute).toHaveBeenCalledTimes(1);

      // Camera toggle
      const camBtn = screen.getByLabelText(/Turn camera off/i);
      fireEvent.click(camBtn);
      expect(onToggleCamera).toHaveBeenCalledTimes(1);

      // Screen share toggle
      const screenBtn = screen.getByLabelText(/Share screen/i);
      fireEvent.click(screenBtn);
      expect(onToggleScreenShare).toHaveBeenCalledTimes(1);

      // End call
      const endBtn = screen.getByLabelText(/End Call/i);
      fireEvent.click(endBtn);
      expect(onEndCall).toHaveBeenCalledTimes(1);
    });
  });
});
