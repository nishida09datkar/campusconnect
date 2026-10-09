/**
 * Lecture Transport Layer
 * Abstraction decoupling the UI from underlying media topology.
 */

export interface LectureParticipantInfo {
  userId: string;
  name: string;
  role: string;
  stream?: MediaStream;
}

export interface LectureTransportEvents {
  onParticipantJoined?: (p: LectureParticipantInfo) => void;
  onParticipantLeft?: (userId: string) => void;
  onTrackSubscribed?: (userId: string, stream: MediaStream) => void;
  onMeshCapExceeded?: (count: number) => void;
}

export interface LectureTransport {
  init(roomId: string, localUserId: string): Promise<void>;
  publishLocalStream(stream: MediaStream): Promise<void>;
  leave(): Promise<void>;
  getMaxMeshParticipants(): number;
  isCapExceeded(currentCount: number): boolean;
  destroy(): void;
}

/**
 * MeshTransport:
 * Peer-to-peer full mesh architecture (1 RTCPeerConnection per peer).
 * Capped at 4 simultaneous peer streams due to client CPU/bandwidth scaling limits (O(N^2)).
 */
export class MeshTransport implements LectureTransport {
  public static readonly MESH_CAP = 4;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private events: LectureTransportEvents;

  constructor(events: LectureTransportEvents = {}) {
    this.events = events;
  }

  async init(roomId: string, localUserId: string): Promise<void> {
    console.log(`[MeshTransport] Initialized room ${roomId} for peer ${localUserId}`);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async publishLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream;
    this.peerConnections.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, stream);
        } catch {}
      });
    });
  }

  getMaxMeshParticipants(): number {
    return MeshTransport.MESH_CAP;
  }

  isCapExceeded(currentCount: number): boolean {
    const exceeded = currentCount > MeshTransport.MESH_CAP;
    if (exceeded && this.events.onMeshCapExceeded) {
      this.events.onMeshCapExceeded(currentCount);
    }
    return exceeded;
  }

  async leave(): Promise<void> {
    this.destroy();
  }

  destroy(): void {
    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    this.peerConnections.clear();
    this.localStream = null;
  }
}

/**
 * SfuTransport:
 * Selective Forwarding Unit (SFU) Architecture Stub (TODO: Phase 6 Enterprise Scaling).
 * Designed for 1:N and N:M lectures exceeding 4 participants with LiveKit or Jitsi Videobridge.
 *
 * Migration Roadmap:
 * 1. Install LiveKit client SDK (`livekit-client`).
 * 2. Connect to LiveKit server with room token issued by Spring Boot.
 * 3. Subscribe to selective quality simulcast video layers (720p active speaker, 180p thumbnails).
 */
export class SfuTransport implements LectureTransport {
  public static readonly SFU_CAP = 250;
  private events: LectureTransportEvents;

  constructor(events: LectureTransportEvents = {}) {
    this.events = events;
  }

  getEvents(): LectureTransportEvents {
    return this.events;
  }

  async init(roomId: string, localUserId: string): Promise<void> {
    // TODO: Connect to LiveKit SFU server
    // Example:
    // const room = new Room();
    // await room.connect(process.env.VITE_LIVEKIT_URL, token);
    console.log(`[SfuTransport STUB] Connecting to SFU for room ${roomId} (local user: ${localUserId})`);
  }

  async publishLocalStream(stream: MediaStream): Promise<void> {
    // TODO: room.localParticipant.publishTrack(stream.getVideoTracks()[0]);
    console.log(`[SfuTransport STUB] Publishing stream to SFU`, stream.id);
  }

  getMaxMeshParticipants(): number {
    return SfuTransport.SFU_CAP;
  }

  isCapExceeded(_currentCount: number): boolean {
    return false; // SFU handles up to 250+ viewers easily
  }

  async leave(): Promise<void> {
    this.destroy();
  }

  destroy(): void {
    // TODO: room.disconnect();
  }
}
