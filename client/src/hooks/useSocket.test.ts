import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import * as socketService from '../services/socket';

describe('useSocket Hook', () => {
  let mockSocket: {
    id: string;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };
  let eventHandlers: Record<string, (...args: unknown[]) => void>;

  beforeEach(() => {
    eventHandlers = {};
    mockSocket = {
      id: 'mock-socket-1',
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
      }),
      off: vi.fn((event: string) => {
        delete eventHandlers[event];
      }),
    };

    vi.spyOn(socketService, 'createSocket').mockReturnValue(mockSocket as unknown as ReturnType<typeof socketService.createSocket>);
  });

  it('should not connect when roomId or token is missing', () => {
    const { result } = renderHook(() => useSocket(undefined, null));
    expect(result.current.isConnected).toBe(false);
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('should connect and join room when roomId and token are present', () => {
    const { result } = renderHook(() => useSocket('room-123', 'valid-token'));

    expect(socketService.createSocket).toHaveBeenCalledWith('valid-token');
    expect(mockSocket.connect).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('join-room', 'room-123');

    // Simulate connect event
    act(() => {
      eventHandlers['connect']?.();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should update room users and isHost flag when room-users event arrives', () => {
    const { result } = renderHook(() => useSocket('room-123', 'valid-token'));

    act(() => {
      eventHandlers['room-users']?.({
        otherUsers: ['peer-1', 'peer-2'],
        isHost: true,
      });
    });

    expect(result.current.usersInRoom).toEqual(['peer-1', 'peer-2']);
    expect(result.current.isHost).toBe(true);
    expect(result.current.hasExistingUsers).toBe(true);
  });

  it('should capture auth-error when emitted by server', () => {
    const { result } = renderHook(() => useSocket('room-123', 'invalid-token'));

    act(() => {
      eventHandlers['auth-error']?.({ message: 'Token expired' });
    });

    expect(result.current.authError).toBe('Token expired');
  });

  it('should clean up listeners and disconnect on unmount', () => {
    const { unmount } = renderHook(() => useSocket('room-123', 'valid-token'));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('room-users');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
