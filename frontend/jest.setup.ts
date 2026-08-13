import '@testing-library/jest-dom';

// Mock HTMLMediaElement.prototype.play
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock WebRTC & MediaDevices APIs globally
const fakeMediaStream = {
  getTracks: () => [
    { kind: 'video', enabled: true, stop: jest.fn() },
    { kind: 'audio', enabled: true, stop: jest.fn() },
  ],
  getVideoTracks: () => [{ kind: 'video', enabled: true, stop: jest.fn() }],
  getAudioTracks: () => [{ kind: 'audio', enabled: true, stop: jest.fn() }],
} as unknown as MediaStream;

if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: jest.fn().mockResolvedValue(fakeMediaStream),
      getDisplayMedia: jest.fn().mockResolvedValue(fakeMediaStream),
    },
  });
}

class FakeRTCPeerConnection {
  addTrack = jest.fn();
  createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'fake_sdp' });
  createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'fake_sdp' });
  setLocalDescription = jest.fn().mockResolvedValue(undefined);
  setRemoteDescription = jest.fn().mockResolvedValue(undefined);
  addIceCandidate = jest.fn().mockResolvedValue(undefined);
  close = jest.fn();
  onicecandidate: ((ev: unknown) => void) | null = null;
  ontrack: ((ev: unknown) => void) | null = null;
}

(window as unknown as { RTCPeerConnection: typeof FakeRTCPeerConnection }).RTCPeerConnection = FakeRTCPeerConnection;
