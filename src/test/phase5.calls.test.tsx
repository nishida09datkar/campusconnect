import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';
import authReducer from '@/features/auth/authSlice';
import { db } from '@/api/mock/db';
import { socketClient } from '@/socket/socketClient';
import { useWebRTC } from '@/hooks/useWebRTC';
import { IncomingCallModal } from '@/components/calls/IncomingCallModal';
import { CallControls } from '@/components/calls/CallControls';
import { CallProvider, useCall } from '@/components/calls/CallContext';
import { ActiveCallData } from '@/hooks/useWebRTC';
import { callLogService } from '@/api/services/callLog.service';
import { CallHistoryPage } from '@/pages/shared/CallHistoryPage';

// Lets a test run the hook the way it behaves against the live backend, where USE_MOCKS is off
const runtimeConfig = vi.hoisted(() => ({ useMocks: true }));
vi.mock('@/api/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/config')>()),
  get USE_MOCKS() {
    return runtimeConfig.useMocks;
  },
}));

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

  /* ===================================================================
   * 6. CALL SIGNALING EDGE CASES
   * =================================================================== */
  describe('6. Call Signaling Edge Cases', () => {
    const StartCallButton = () => {
      const { startCall } = useCall();
      return <button onClick={() => startCall(facNeha.id, 'VOICE')}>Start test call</button>;
    };

    const renderCallUi = (user: any) =>
      render(
        <Provider store={createTestStore(user)}>
          <CallProvider>
            <StartCallButton />
          </CallProvider>
        </Provider>
      );

    it('Cancelling an outgoing call tells the callee to stop ringing', async () => {
      const emitSpy = vi.spyOn(socketClient, 'emit');
      renderCallUi(stu1);

      await act(async () => {
        fireEvent.click(screen.getByText('Start test call'));
      });
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(emitSpy).toHaveBeenCalledWith(
        'call:cancel',
        expect.objectContaining({ calleeId: facNeha.id })
      );
      expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
    });

    const renderCallHook = (user: any) => {
      const store = createTestStore(user);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );
      return renderHook(() => useWebRTC(), { wrapper });
    };

    // Makes facNeha ring stu1
    const ringStudent = (callId: string) => {
      act(() => {
        socketClient.emit('call:incoming', {
          callId,
          callerId: facNeha.id,
          callerName: facNeha.name,
          calleeId: stu1.id,
          kind: 'VOICE',
        });
      });
    };

    it("Keeps ringing when somebody else's call ends", () => {
      const { result } = renderCallHook(stu1);
      ringStudent('call-mine');
      expect(result.current.callState).toBe('ringing');

      act(() => {
        socketClient.emit('call:end', {
          callId: 'call-of-others',
          callerId: 'user-stu-2',
          calleeId: 'user-fac-rohan',
          kind: 'VOICE',
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          outcome: 'COMPLETED',
        });
      });

      expect(result.current.callState).toBe('ringing');
      expect(result.current.activeCall?.callId).toBe('call-mine');
    });

    it('Can receive a new call after a signaling error', async () => {
      const onSpy = vi.spyOn(socketClient, 'on');
      const { result } = renderCallHook(stu1);
      // The mock socket never raises call:error itself, so call the registered listener directly
      const raiseCallError = onSpy.mock.calls.find(([event]) => event === 'call:error')![1] as (
        payload: { message: string }
      ) => void;

      await act(async () => {
        await result.current.startCall(facNeha.id, 'VOICE');
      });
      act(() => {
        raiseCallError({ message: 'Callee could not be reached' });
      });
      expect(result.current.activeCall).toBeNull();

      ringStudent('call-after-error');
      expect(result.current.callState).toBe('ringing');
    });

    it('Ignores a late decline once the call has been answered', async () => {
      const { result } = renderCallHook(stu1);
      await act(async () => {
        await result.current.startCall(facNeha.id, 'VOICE');
      });
      const callId = result.current.activeCall!.callId;
      const respond = (accepted: boolean) =>
        socketClient.emit('call:response', {
          callId,
          callerId: stu1.id,
          calleeId: facNeha.id,
          accepted,
          reason: accepted ? undefined : 'Timeout',
        });

      await act(async () => {
        respond(true);
      });
      // e.g. the callee's second tab timing out after the first one answered
      await act(async () => {
        respond(false);
      });

      expect(result.current.callState).toBe('connecting');
      expect(result.current.activeCall?.callId).toBe(callId);
    });

    it('Shows the call screen with a hang-up control while the call is connecting', async () => {
      renderCallUi(stu1);
      ringStudent('call-connecting');

      await act(async () => {
        fireEvent.click(screen.getByLabelText(/Accept Call/i));
      });

      expect(screen.getByLabelText(/End Call/i)).toBeDefined();
    });

    const answerThenHangUp = async (callId: string) => {
      const { result } = renderCallHook(stu1);
      ringStudent(callId);
      await act(async () => {
        await result.current.acceptCall();
      });
      act(() => {
        result.current.endCall();
      });
      return result;
    };

    it('Leaves the call log to the signaling server when the backend is live', async () => {
      runtimeConfig.useMocks = false;
      const logSpy = vi.spyOn(callLogService, 'createCallLog').mockResolvedValue({} as never);
      try {
        const result = await answerThenHangUp('call-live');

        expect(result.current.callState).toBe('ended');
        // The server records every call once; a second write from here would duplicate it under the wrong caller
        expect(logSpy).not.toHaveBeenCalled();
      } finally {
        logSpy.mockRestore();
        runtimeConfig.useMocks = true;
      }
    });

    it('Records the call log itself when running on mock data', async () => {
      const logSpy = vi.spyOn(callLogService, 'createCallLog');
      try {
        await answerThenHangUp('call-mock');

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({ callerId: facNeha.id, calleeId: stu1.id, outcome: 'COMPLETED' })
        );
      } finally {
        logSpy.mockRestore();
      }
    });
  });

  describe('7. Call History Filters', () => {
    it('Returns only the calls that started inside the chosen date range', async () => {
      const callOn = (startedAt: string) =>
        callLogService.createCallLog({ callerId: facNeha.id, calleeId: stu1.id, kind: 'VOICE', startedAt, outcome: 'COMPLETED' });
      await callOn('2020-01-10T10:00:00.000Z');
      await callOn('2020-01-20T10:00:00.000Z');
      await callOn('2020-01-30T10:00:00.000Z');

      const logs = await callLogService.getCallLogs({
        startDate: '2020-01-15T00:00:00.000Z',
        endDate: '2020-01-25T00:00:00.000Z',
      });

      expect(logs.map((l) => l.startedAt)).toEqual(['2020-01-20T10:00:00.000Z']);
    });

    it('Returns only the calls the given user took part in', async () => {
      const logs = await callLogService.getCallLogs({ userId: stu1.id });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every((l) => l.callerId === stu1.id || l.calleeId === stu1.id)).toBe(true);
    });

    it("Keeps other people's calls out of the signed-in user's history", async () => {
      vi.useRealTimers();
      const [lecture] = await callLogService.getCallLogs({ kind: 'LECTURE' });
      const lectureDay = format(new Date(lecture.startedAt), 'yyyy-MM-dd');

      const { container } = render(
        <Provider store={createTestStore(stu5)}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CallProvider>
              <CallHistoryPage />
            </CallProvider>
          </MemoryRouter>
        </Provider>
      );
      const [from, to] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
      fireEvent.change(from, { target: { value: lectureDay } });
      fireEvent.change(to, { target: { value: lectureDay } });

      expect(await screen.findByText('No call logs found')).toBeInTheDocument();
      expect(screen.queryByText(/Neha Kulkarni/)).not.toBeInTheDocument();
    });

    it('Includes calls made late on the last day of the chosen range', async () => {
      vi.useRealTimers();
      await callLogService.createCallLog({
        callerId: facNeha.id,
        calleeId: 'late-evening-callee',
        kind: 'VOICE',
        startedAt: new Date(2021, 2, 5, 22, 0).toISOString(),
        outcome: 'COMPLETED',
      });

      const { container } = render(
        <Provider store={createTestStore(facNeha)}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CallProvider>
              <CallHistoryPage />
            </CallProvider>
          </MemoryRouter>
        </Provider>
      );
      const [from, to] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
      fireEvent.change(from, { target: { value: '2021-03-05' } });
      fireEvent.change(to, { target: { value: '2021-03-05' } });

      expect(await screen.findByText('late-evening-callee')).toBeInTheDocument();
    });

    it('Names the lecture room for a lecture the user hosted, which has no callee', async () => {
      vi.useRealTimers();
      const [lecture] = await callLogService.getCallLogs({ kind: 'LECTURE' });
      const lectureDay = format(new Date(lecture.startedAt), 'yyyy-MM-dd');

      const { container } = render(
        <Provider store={createTestStore(facNeha)}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CallProvider>
              <CallHistoryPage />
            </CallProvider>
          </MemoryRouter>
        </Provider>
      );
      const [from, to] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
      fireEvent.change(from, { target: { value: lectureDay } });
      fireEvent.change(to, { target: { value: lectureDay } });

      expect(await screen.findByText('To: room-ce-301')).toBeInTheDocument();
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });
  });
});
