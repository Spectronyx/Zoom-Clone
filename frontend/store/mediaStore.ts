/* Zustand store for local media state (mic, camera, screen share). */

import { create } from 'zustand';

interface MediaState {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  cameraError: string | null;
  micError: string | null;

  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setMuted: (muted: boolean) => void;
  setVideoOff: (off: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setCameraError: (err: string | null) => void;
  setMicError: (err: string | null) => void;
  reset: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  localStream: null,
  screenStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  cameraError: null,
  micError: null,

  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    set({ isVideoOff: !isVideoOff });
  },

  setMuted: (muted) => {
    const { localStream } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
    }
    set({ isMuted: muted });
  },

  setVideoOff: (off) => {
    const { localStream } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !off));
    }
    set({ isVideoOff: off });
  },

  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setCameraError: (err) => set({ cameraError: err }),
  setMicError: (err) => set({ micError: err }),

  reset: () => {
    const { localStream, screenStream } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    set({
      localStream: null,
      screenStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      cameraError: null,
      micError: null,
    });
  },
}));
