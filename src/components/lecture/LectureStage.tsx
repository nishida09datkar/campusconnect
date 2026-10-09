import React, { useState } from 'react';
import {
  Users,
  Hand,
  MessageSquare,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import { LectureParticipant } from '@/socket/events';
import { Button } from '@/components/ui/Button';
import { MeshTransport } from './transport';

interface LectureStageProps {
  roomId: string;
  localUserId: string;
  isFaculty: boolean;
  participants: LectureParticipant[];
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  isCapExceeded: boolean;
  onRemoveParticipant?: (userId: string) => void;
  onLowerHand?: (userId: string) => void;
}

export const LectureStage: React.FC<LectureStageProps> = ({
  roomId,
  localUserId,
  isFaculty,
  participants,
  localStream,
  remoteStreams,
  isCapExceeded,
  onRemoveParticipant,
  onLowerHand,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'queue' | 'chat'>('roster');
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; text: string; time: string }[]
  >([
    {
      id: 'lmsg-1',
      sender: 'System Bot',
      text: `Welcome to lecture room ${roomId}. Use the raise hand tool or chat for questions.`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handRaisedParticipants = participants.filter((p) => p.isHandRaised);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMsg = {
      id: `lmsg-${Date.now()}`,
      sender: 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Mesh Capacity Exceeded Warning Banner */}
      {isCapExceeded && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Mesh Peer Cap Warning:</strong> There are currently {participants.length}{' '}
              participants connected (Mesh capacity limit is {MeshTransport.MESH_CAP} video streams).
              Additional peers receive audio priority. Transitioning to SFU Transport is recommended
              for large cohorts.
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20">
            P2P MESH CAP: 4
          </span>
        </div>
      )}

      {/* Main Classroom Viewport + Sidebar Grid */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Stage & Video Grid */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-border p-3 overflow-hidden">
          {/* Main Stage Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 p-1 min-h-0 overflow-y-auto">
            {/* Local participant card */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center aspect-video sm:aspect-auto">
              {localStream && localStream.getVideoTracks().some((t) => t.enabled) ? (
                <video
                  ref={(el) => {
                    if (el && localStream) el.srcObject = localStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/50 text-xs space-y-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white/80">
                    You
                  </div>
                  <span>Video Muted</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[11px] text-white font-medium flex items-center gap-1.5">
                <span>You {isFaculty ? '(Instructor)' : ''}</span>
              </div>
            </div>

            {/* Remote Participants */}
            {participants
              .filter((p) => p.userId !== localUserId)
              .map((p, idx) => (
                <div
                  key={p.userId}
                  className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center aspect-video sm:aspect-auto"
                >
                  {remoteStreams[idx] ? (
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = remoteStreams[idx];
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/50 text-xs space-y-2">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white/80">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  )}

                  {/* Name and Hand raised indicator */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[11px] text-white font-medium flex items-center gap-1.5">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-white/60">({p.role})</span>
                  </div>

                  {p.isHandRaised && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-bounce shadow-md">
                      <Hand className="w-3 h-3" />
                      <span>Hand Raised</span>
                    </div>
                  )}

                  {/* Faculty Moderation Overlay Button */}
                  {isFaculty && onRemoveParticipant && (
                    <button
                      onClick={() => onRemoveParticipant(p.userId)}
                      className="absolute top-2 left-2 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-md text-xs opacity-0 hover:opacity-100 transition-opacity"
                      title="Remove participant"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Sidebar: Roster / Raise Hand Queue / Chat */}
        <div className="w-80 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          {/* Header Tabs */}
          <div className="grid grid-cols-3 border-b border-border bg-muted/30 text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`py-3 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'roster'
                  ? 'border-b-2 border-primary text-primary bg-card'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Roster ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`py-3 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'queue'
                  ? 'border-b-2 border-primary text-primary bg-card'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hand className="w-3.5 h-3.5 text-amber-500" />
              <span>Queue ({handRaisedParticipants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-primary text-primary bg-card'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {/* Roster Tab */}
            {activeTab === 'roster' && (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <span>{p.name}</span>
                          {p.userId === localUserId && <span className="text-muted-foreground">(You)</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {p.isHandRaised && <Hand className="w-3.5 h-3.5 text-amber-500" />}
                      {isFaculty && p.userId !== localUserId && onRemoveParticipant && (
                        <button
                          onClick={() => onRemoveParticipant(p.userId)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                          title="Remove from lecture"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hand Raised Queue Tab */}
            {activeTab === 'queue' && (
              <div className="space-y-2">
                {handRaisedParticipants.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Hand className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No questions currently in the queue</p>
                  </div>
                ) : (
                  handRaisedParticipants.map((p, index) => (
                    <div
                      key={p.userId}
                      className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">
                            {index + 1}
                          </span>
                          {p.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">Waiting</span>
                      </div>
                      {isFaculty && onLowerHand && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLowerHand(p.userId)}
                          className="w-full text-[10px] h-7 border-amber-500/40"
                        >
                          Acknowledge / Lower Hand
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Live Lecture Chat Tab */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-2 overflow-y-auto pr-1 max-h-[360px]">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="p-2 rounded bg-muted/40 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold text-primary">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-foreground leading-snug">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 flex gap-1.5 border-t border-border mt-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask question in lecture..."
                    className="flex-1 bg-muted/50 border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" className="h-8 px-2.5 text-xs">
                    Send
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
