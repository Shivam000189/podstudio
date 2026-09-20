import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { otpRateLimiter } from "../middleware/rateLimit.middleware";
import {
  createRoom,
  joinRoom,
  endRoom,
  requestOtp,
  verifyOtp,
} from "../controllers/room.controller";

const router = Router();

router.post("/rooms/create", authMiddleware, createRoom);
router.post("/rooms/:id/join", authMiddleware, joinRoom);
router.patch("/rooms/:id/end", authMiddleware, endRoom);

// Guest OTP flow (no authMiddleware — guests aren't logged in)
router.post("/rooms/:id/otp/request", otpRateLimiter, requestOtp);
router.post("/rooms/:id/otp/verify", otpRateLimiter, verifyOtp);

export default router;