/* WebRTC Peer Connection Manager.
 *
 * Manages mesh topology: each participant opens an RTCPeerConnection
 * to every other participant. Uses the SignalingSocket for offer/answer/ICE relay.
 */

import { SignalingSocket } from './socket';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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
      const [remoteStream] = event.streams;
      if (remoteStream) {
        peerInfo.stream = remoteStream;
        this.onRemoteStream(participantId, remoteStream);
      }
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
