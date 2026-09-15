import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import "../App.css";

interface GuestJoinModalProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (guestToken: string, roomCode: string) => void;
}

type Stage = "email" | "otp";

export function GuestJoinModal({
  roomCode,
  isOpen,
  onClose,
  onSuccess,
}: GuestJoinModalProps) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStage("email");
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setError(null);
      setSuccessMsg(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Auto-focus first OTP input when stage changes to OTP
  useEffect(() => {
    if (stage === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [stage]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await API.post(`/rooms/${roomCode}/otp/request`, {
        email: trimmedEmail,
      });
      setStage("otp");
      setSuccessMsg(`Verification code sent to ${trimmedEmail}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send verification code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    setError(null);
    const finalCode = code || otp.join("");

    if (finalCode.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post(`/rooms/${roomCode}/otp/verify`, {
        email: email.trim().toLowerCase(),
        code: finalCode,
      });

      const { guestToken, roomId } = response.data;
      onSuccess(guestToken, roomId);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Verification failed. Please try again."
      );
      // Clear OTP inputs on failure
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMsg(null);
    setOtp(["", "", "", "", "", ""]);
    setIsLoading(true);
    try {
      await API.post(`/rooms/${roomCode}/otp/request`, {
        email: email.trim(),
      });
      setSuccessMsg("New verification code sent!");
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to resend code. Try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="studio-modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="guest-join-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="guest-modal-header">
            <div className="guest-modal-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <h3 className="guest-modal-title">
              {stage === "email" ? "Join as Guest" : "Enter Verification Code"}
            </h3>
            <p className="guest-modal-subtitle">
              {stage === "email"
                ? "Enter your email to receive a one-time join code."
                : `We sent a 6-digit code to ${email}`}
            </p>
            <button
              type="button"
              className="modal-close-button"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Room Code Badge */}
          <div className="guest-room-badge">
            <span className="guest-room-badge-label">Room</span>
            <span className="guest-room-badge-code">{roomCode}</span>
          </div>

          {/* Success message */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                className="guest-msg guest-msg-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="guest-msg guest-msg-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage 1: Email Input */}
          {stage === "email" && (
            <form onSubmit={handleRequestOtp} className="guest-form">
              <div className="guest-input-group">
                <label htmlFor="guest-email" className="guest-input-label">
                  Email Address
                </label>
                <input
                  id="guest-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="guest-email-input"
                  autoFocus
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="guest-submit-btn"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-mini" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Stage 2: OTP Input */}
          {stage === "otp" && (
            <div className="guest-form">
              <div className="guest-otp-group" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="guest-otp-input"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="button"
                className="guest-submit-btn"
                disabled={isLoading || otp.some((d) => !d)}
                onClick={() => handleVerifyOtp()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-mini" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Join Studio</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <div className="guest-otp-footer">
                <span className="guest-otp-hint">Didn't receive the code?</span>
                <button
                  type="button"
                  className="guest-resend-btn"
                  onClick={handleResend}
                  disabled={isLoading}
                >
                  Resend Code
                </button>
                <span className="guest-otp-divider">·</span>
                <button
                  type="button"
                  className="guest-resend-btn"
                  onClick={() => {
                    setStage("email");
                    setError(null);
                    setSuccessMsg(null);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  disabled={isLoading}
                >
                  Change Email
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
