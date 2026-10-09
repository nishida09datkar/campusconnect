import React, { useState, useEffect } from 'react';
import {
  Phone,
  Video,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Filter,
  Calendar,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { callLogService, CallLogFilters } from '@/api/services/callLog.service';
import { CallLog } from '@/types/communication';
import { Button } from '@/components/ui/Button';
import { useCall } from '@/components/calls/CallContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { canInteract } from '@/utils/permissions';
import { db } from '@/api/mock/db';
import { StartCallDialog } from '@/components/calls/StartCallDialog';

export const CallHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartCallOpen, setIsStartCallOpen] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [kindFilter, setKindFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { startCall } = useCall();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const filters: CallLogFilters = {
        outcome: outcomeFilter !== 'ALL' ? outcomeFilter : undefined,
        kind: kindFilter !== 'ALL' ? kindFilter : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };
      const data = await callLogService.getCallLogs(filters);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [outcomeFilter, kindFilter, startDate, endDate]);

  const handleCallBack = (log: CallLog) => {
    // Determine the peer user ID and object
    const peerId = log.callerId === currentUser?.id ? log.calleeId : log.callerId;
    const peerName = log.callerId === currentUser?.id ? log.calleeName : log.callerName;
    const peerUser = db.users.find((u) => u.id === peerId || (peerName && u.name === peerName));
    const targetId = peerUser?.id || peerId;

    if (targetId) {
      startCall(targetId, log.kind === 'VIDEO' ? 'VIDEO' : 'VOICE', peerUser);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const callerMatch = log.callerName?.toLowerCase().includes(q) || log.callerId.toLowerCase().includes(q);
    const calleeMatch = log.calleeName?.toLowerCase().includes(q) || log.calleeId?.toLowerCase().includes(q);
    return callerMatch || calleeMatch;
  });

  const formatDuration = (sec?: number) => {
    if (!sec || sec === 0) return '-';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder}s`;
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Call & VoIP History</h1>
          <p className="text-sm text-muted-foreground">
            Audit logs and records of voice, video, and live lecture sessions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="gap-2"
            title="Refresh call logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsStartCallOpen(true)}
            className="gap-2 shadow-sm"
            title="Open campus contact directory to start a call"
          >
            <PhoneCall className="w-4 h-4" />
            <span>New Call / Directory</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Outcome:</span>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-muted/50 border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Outcomes</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>

          {/* Kind Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">Type:</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="bg-muted/50 border border-input rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Types</option>
              <option value="VOICE">Voice Call</option>
              <option value="VIDEO">Video Call</option>
              <option value="LECTURE">Live Lecture</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-muted/50 border border-input rounded-lg px-2 py-1 text-foreground"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-muted/50 border border-input rounded-lg px-2 py-1 text-foreground"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name..."
            className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-input rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Started At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    <span>Loading call history...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <PhoneOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-foreground">No call logs found</p>
                    <p className="text-[11px]">No call records match the current filter selection</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCaller = log.callerId === currentUser?.id;
                  const peerName = isCaller
                    ? log.calleeName || log.calleeId || 'Unknown Callee'
                    : log.callerName || log.callerId || 'Unknown Caller';

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      {/* Kind */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              log.kind === 'VIDEO'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : log.kind === 'LECTURE'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {log.kind === 'VIDEO' ? (
                              <Video className="w-4 h-4" />
                            ) : log.kind === 'LECTURE' ? (
                              <PhoneCall className="w-4 h-4" />
                            ) : (
                              <Phone className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{log.kind}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {isCaller ? 'Outgoing' : 'Incoming'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Participants */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-foreground block">{peerName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {isCaller ? `To: ${log.calleeName || log.calleeId}` : `From: ${log.callerName || log.callerId}`}
                          </span>
                        </div>
                      </td>

                      {/* Outcome */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            log.outcome === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : log.outcome === 'MISSED'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}
                        >
                          {log.outcome === 'COMPLETED' ? (
                            <Phone className="w-3 h-3" />
                          ) : log.outcome === 'MISSED' ? (
                            <PhoneMissed className="w-3 h-3" />
                          ) : (
                            <PhoneOff className="w-3 h-3" />
                          )}
                          <span>{log.outcome}</span>
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground/60" />
                          <span>{formatDuration(log.durationSec)}</span>
                        </div>
                      </td>

                      {/* Started At */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.startedAt)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        {log.kind !== 'LECTURE' && (() => {
                          const peerId = log.callerId === currentUser?.id ? log.calleeId : log.callerId;
                          const peerName = log.callerId === currentUser?.id ? log.calleeName : log.callerName;
                          const peerUser = db.users.find((u) => u.id === peerId || (peerName && u.name === peerName));
                          const isCallable = Boolean(peerUser && currentUser && canInteract(currentUser, peerUser, 'call'));

                          return (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={!isCallable}
                              onClick={() => handleCallBack(log)}
                              className={`h-7 text-[11px] gap-1.5 rounded-lg ${!isCallable ? 'opacity-40 cursor-not-allowed' : ''}`}
                              title={isCallable ? 'Call back participant' : 'Communication policy restricts calling this user'}
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-primary" />
                              <span>Call Back</span>
                            </Button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Call / Contact Directory Modal */}
      <StartCallDialog
        isOpen={isStartCallOpen}
        onClose={() => setIsStartCallOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default CallHistoryPage;
