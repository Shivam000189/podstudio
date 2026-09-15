import rateLimit from "express-rate-limit";

/**
 * Rate limiter for OTP endpoints.
 * Allows 5 requests per 15-minute window per IP address.
 * This prevents brute-forcing 6-digit OTPs and email-bombing.
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  },
});
