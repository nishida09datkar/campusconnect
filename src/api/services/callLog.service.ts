import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { CallLog } from '@/types/communication';

export interface CreateCallLogDto {
  callerId: string;
  calleeId?: string;
  roomId?: string;
  kind: 'VOICE' | 'VIDEO' | 'LECTURE';
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  outcome: 'COMPLETED' | 'MISSED' | 'DECLINED';
}

export interface CallLogFilters {
  outcome?: string;
  kind?: string;
  startDate?: string;
  endDate?: string;
}

// Initial mock call logs for testing/offline mode
const initialMockLogs: CallLog[] = [
  {
    id: 'call-log-1',
    callerId: 'user-fac-neha',
    callerName: 'Prof. Neha Kulkarni',
    calleeId: 'user-stu-1',
    calleeName: 'Aryan Sharma',
    kind: 'VIDEO',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 2 + 180000).toISOString(),
    durationSec: 180,
    outcome: 'COMPLETED',
  },
  {
    id: 'call-log-2',
    callerId: 'user-stu-2',
    callerName: 'Diya Patel',
    calleeId: 'user-fac-neha',
    calleeName: 'Prof. Neha Kulkarni',
    kind: 'VOICE',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 86400000 + 45000).toISOString(),
    durationSec: 0,
    outcome: 'MISSED',
  },
  {
    id: 'call-log-3',
    callerId: 'user-fac-rohan',
    callerName: 'Prof. Rohan Desai',
    calleeId: 'user-fac-neha',
    calleeName: 'Prof. Neha Kulkarni',
    kind: 'VOICE',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 + 12000).toISOString(),
    durationSec: 0,
    outcome: 'DECLINED',
  },
  {
    id: 'call-log-4',
    callerId: 'user-fac-neha',
    callerName: 'Prof. Neha Kulkarni',
    roomId: 'room-ce-301',
    kind: 'LECTURE',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
    durationSec: 3600,
    outcome: 'COMPLETED',
  },
];

let mockLogsStorage: CallLog[] = [...initialMockLogs];

export const callLogService = {
  async getCallLogs(filters?: CallLogFilters): Promise<CallLog[]> {
    if (USE_MOCKS) {
      let filtered = [...mockLogsStorage];
      if (filters?.outcome && filters.outcome !== 'ALL') {
        filtered = filtered.filter((log) => log.outcome === filters.outcome);
      }
      if (filters?.kind && filters.kind !== 'ALL') {
        filtered = filtered.filter((log) => log.kind === filters.kind);
      }
      return filtered;
    }

    const params: Record<string, string> = {};
    if (filters?.outcome && filters.outcome !== 'ALL') params.outcome = filters.outcome;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const res = await apiClient.get<CallLog[]>('/api/calls/logs', { params });
    let logs = res.data;
    if (filters?.kind && filters.kind !== 'ALL') {
      logs = logs.filter((log) => log.kind === filters.kind);
    }
    return logs;
  },

  async createCallLog(data: CreateCallLogDto): Promise<CallLog> {
    if (USE_MOCKS) {
      const newLog: CallLog = {
        id: `call-log-${Date.now()}`,
        ...data,
      };
      mockLogsStorage.unshift(newLog);
      return newLog;
    }

    const res = await apiClient.post<CallLog>('/api/calls/logs', data);
    return res.data;
  },
};
