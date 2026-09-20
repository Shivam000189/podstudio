import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

export const createMockMediaStream = () => {
  const audioTrack = { kind: 'audio', enabled: true, stop: vi.fn() };
  const videoTrack = { kind: 'video', enabled: true, stop: vi.fn() };

  return {
    id: 'mock-stream-id',
    getTracks: vi.fn(() => [videoTrack, audioTrack]),
    getVideoTracks: vi.fn(() => [videoTrack]),
    getAudioTracks: vi.fn(() => [audioTrack]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
  };
};

let currentStream = createMockMediaStream();

if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn().mockImplementation(() => {
        currentStream = createMockMediaStream();
        return Promise.resolve(currentStream);
      }),
      enumerateDevices: vi.fn().mockResolvedValue([
        { deviceId: 'cam-1', kind: 'videoinput', label: 'FaceCam' },
        { deviceId: 'mic-1', kind: 'audioinput', label: 'Studio Mic' },
      ]),
    },
  });
}
