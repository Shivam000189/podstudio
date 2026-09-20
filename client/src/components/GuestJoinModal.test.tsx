import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestJoinModal } from './GuestJoinModal';
import API from '../api/axios';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('GuestJoinModal', () => {
  const defaultProps = {
    roomCode: 'studio-99',
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<GuestJoinModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/join as guest/i)).not.toBeInTheDocument();
  });

  it('renders email input stage when open', () => {
    render(<GuestJoinModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send verification code/i })
    ).toBeInTheDocument();
  });

  it('shows error message if invalid email is submitted', async () => {
    render(<GuestJoinModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);

    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.submit(emailInput.closest('form')!);

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });

  it('transitions to OTP stage upon successful email submission', async () => {
    vi.mocked(API.post).mockResolvedValueOnce({ data: { success: true } });

    render(<GuestJoinModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);

    await userEvent.type(emailInput, 'guest@example.com');
    fireEvent.submit(emailInput.closest('form')!);

    expect(API.post).toHaveBeenCalledWith('/rooms/studio-99/otp/request', {
      email: 'guest@example.com',
    });

    expect(
      await screen.findByText(/verification code sent to guest@example.com/i)
    ).toBeInTheDocument();

    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);
  });

  it('pastes a 6-digit code into OTP fields and submits', async () => {
    vi.mocked(API.post)
      .mockResolvedValueOnce({ data: { success: true } }) // requestOtp
      .mockResolvedValueOnce({
        data: {
          success: true,
          guestToken: 'guest-jwt-token-xyz',
          roomId: 'studio-99',
        },
      }); // verifyOtp

    render(<GuestJoinModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    await userEvent.type(emailInput, 'guest@example.com');
    fireEvent.submit(emailInput.closest('form')!);

    await screen.findByText(/verification code sent to guest@example.com/i);

    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);

    // Simulate paste event on first box
    fireEvent.paste(otpInputs[0], {
      clipboardData: {
        getData: () => '654321',
      },
    });

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/rooms/studio-99/otp/verify', {
        email: 'guest@example.com',
        code: '654321',
      });
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        'guest-jwt-token-xyz',
        'studio-99'
      );
    });
  });
});
