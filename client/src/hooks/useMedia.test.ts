import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMedia } from './useMedia';

describe('useMedia Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should acquire user media and initialize stream on mount', async () => {
    const { result } = renderHook(() => useMedia());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for async getUserMedia to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stream).toBeDefined();
    expect(result.current.isAudioEnabled).toBe(true);
    expect(result.current.isVideoEnabled).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: true,
      audio: true,
    });
  });

  it('should toggle audio and video track states', async () => {
    const { result } = renderHook(() => useMedia());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    act(() => {
      result.current.toggleAudio();
    });
    expect(result.current.isAudioEnabled).toBe(false);

    act(() => {
      result.current.toggleAudio();
    });
    expect(result.current.isAudioEnabled).toBe(true);

    act(() => {
      result.current.toggleVideo();
    });
    expect(result.current.isVideoEnabled).toBe(false);
  });

  it('should stop media tracks and nullify stream when stopMedia is called', async () => {
    const { result } = renderHook(() => useMedia());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.stream).not.toBeNull();

    act(() => {
      result.current.stopMedia();
    });

    expect(result.current.stream).toBeNull();
  });
});
