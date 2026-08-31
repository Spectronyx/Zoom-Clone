/* WebRTC Peer Connection Manager.
 *
 * Manages mesh topology: each participant opens an RTCPeerConnection
 * to every other participant. Uses the SignalingSocket for offer/answer/ICE relay.
 */

import { SignalingSocket } from './socket';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Free TURN servers for mobile NAT traversal
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export type PeerInfo = {
  channelName: string;
  participantId: string;
  displayName: string;
  isHost: boolean;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  pendingIceCandidates: RTCIceCandidateInit[];
};

type OnStreamCallback = (participantId: string, stream: MediaStream) => void;
type OnTrackRemovedCallback = (participantId: string) => void;

export class WebRTCManager {
  private peers: Map<string, PeerInfo> = new Map();
  private localStream: MediaStream | null = null;
  private socket: SignalingSocket;
  private onRemoteStream: OnStreamCallback;
  private onTrackRemoved: OnTrackRemovedCallback;

  constructor(
    socket: SignalingSocket,
    onRemoteStream: OnStreamCallback,
    onTrackRemoved: OnTrackRemovedCallback,
  ) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onTrackRemoved = onTrackRemoved;
    this.setupSignalingHandlers();
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;

    // Add local tracks to any existing connections that don't have senders
    for (const [, peer] of this.peers) {
      const senders = peer.connection.getSenders();
      if (senders.length === 0) {
        stream.getTracks().forEach((track) => {
          peer.connection.addTrack(track, stream);
        });
      }
    }
  }

  private setupSignalingHandlers() {
    this.socket.on('existing-participants', (msg) => {
      const participants = msg.participants as Array<{
        channel_name: string;
        participant_id: string;
        display_name: string;
        is_host: boolean;
      }>;

      participants.forEach((p) => {
        this.createPeerAndOffer(p.channel_name, p.participant_id, p.display_name, p.is_host);
      });
    });

    this.socket.on('offer', async (msg) => {
      const senderChannel = msg.sender_channel as string;
      const participantId = msg.participant_id as string;
      const displayName = msg.display_name as string;
      const isHost = msg.is_host as boolean;
      const offer = msg.offer as RTCSessionDescriptionInit;

      await this.handleOffer(senderChannel, participantId, displayName, isHost, offer);
    });

    this.socket.on('answer', async (msg) => {
      const senderChannel = msg.sender_channel as string;
      const answer = msg.answer as RTCSessionDescriptionInit;

      const peer = this.peers.get(senderChannel);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
          await this.processPendingIceCandidates(peer);
        } catch (err) {
          console.error('[WebRTC] Error setting remote description (answer):', err);
        }
      }
    });

    this.socket.on('ice-candidate', async (msg) => {
      const senderChannel = msg.sender_channel as string;
      const candidate = msg.candidate as RTCIceCandidateInit;

      const peer = this.peers.get(senderChannel);
      if (peer && candidate) {
        if (peer.connection.remoteDescription) {
          try {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('[WebRTC] Error adding ICE candidate:', err);
          }
        } else {
          // Queue candidate until remote description is set
          peer.pendingIceCandidates.push(candidate);
        }
      }
    });

    this.socket.on('participant-left', (msg) => {
      const participantId = msg.participant_id as string;
      this.removePeerByParticipantId(participantId);
      this.onTrackRemoved(participantId);
    });

    this.socket.on('participant-removed', (msg) => {
      const participantId = msg.participant_id as string;
      this.removePeerByParticipantId(participantId);
      this.onTrackRemoved(participantId);
    });
  }

  private async processPendingIceCandidates(peer: PeerInfo) {
    while (peer.pendingIceCandidates.length > 0) {
      const candidate = peer.pendingIceCandidates.shift();
      if (candidate) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error processing queued ICE candidate:', err);
        }
      }
    }
  }

  private createPeerConnection(channelName: string, participantId: string, displayName: string, isHost: boolean): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    const peerInfo: PeerInfo = {
      channelName,
      participantId,
      displayName,
      isHost,
      connection: pc,
      stream: null,
      pendingIceCandidates: [],
    };

    this.peers.set(channelName, peerInfo);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
      
      // Ensure we can receive video if we only have audio, and vice versa
      const hasAudio = this.localStream.getAudioTracks().length > 0;
      const hasVideo = this.localStream.getVideoTracks().length > 0;
      
      if (!hasAudio) pc.addTransceiver('audio', { direction: 'recvonly' });
      if (!hasVideo) pc.addTransceiver('video', { direction: 'recvonly' });
    } else {
      // If no local stream at all, ensure we can still receive remote media
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.send({
          type: 'ice-candidate',
          target_channel: channelName,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Track received:', event.track.kind, 'from participant:', participantId);
      let stream = peerInfo.stream;
      if (!stream) {
        stream = event.streams[0] || new MediaStream([event.track]);
        peerInfo.stream = stream;
      } else {
        if (!stream.getTracks().some((t) => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
      }

      // Create a fresh MediaStream instance reference so React/Zustand detects state change and re-renders VideoTile
      const updatedStream = new MediaStream(stream.getTracks());
      peerInfo.stream = updatedStream;

      // Re-trigger playback if track unmutes or finishes loading
      event.track.onunmute = () => {
        console.log('[WebRTC] Track unmuted:', event.track.kind);
        const refreshed = new MediaStream(peerInfo.stream?.getTracks() || []);
        this.onRemoteStream(participantId, refreshed);
      };

      this.onRemoteStream(participantId, updatedStream);
    };

    return pc;
  }

  private async createPeerAndOffer(
    channelName: string,
    participantId: string,
    displayName: string,
    isHost: boolean,
  ) {
    const pc = this.createPeerConnection(channelName, participantId, displayName, isHost);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.send({
        type: 'offer',
        target_channel: channelName,
        offer: offer,
      });
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    }
  }

  private async handleOffer(
    senderChannel: string,
    participantId: string,
    displayName: string,
    isHost: boolean,
    offer: RTCSessionDescriptionInit,
  ) {
    let peer = this.peers.get(senderChannel);
    let pc: RTCPeerConnection;

    if (!peer) {
      pc = this.createPeerConnection(senderChannel, participantId, displayName, isHost);
      peer = this.peers.get(senderChannel)!;
    } else {
      pc = peer.connection;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.processPendingIceCandidates(peer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.send({
        type: 'answer',
        target_channel: senderChannel,
        answer: answer,
      });
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  }

  private removePeerByParticipantId(participantId: string) {
    for (const [channelName, peer] of this.peers) {
      if (peer.participantId === participantId) {
        peer.connection.close();
        this.peers.delete(channelName);
        break;
      }
    }
  }

  async replaceVideoTrack(newTrack: MediaStreamTrack) {
    for (const [, peer] of this.peers) {
      const sender = peer.connection.getSenders().find(
        (s) => s.track?.kind === 'video'
      );
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }
  }

  destroy() {
    for (const [, peer] of this.peers) {
      peer.connection.close();
    }
    this.peers.clear();
  }
}
