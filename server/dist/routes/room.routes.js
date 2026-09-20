"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
router.post("/rooms/create", auth_middleware_1.authMiddleware, room_controller_1.createRoom);
router.post("/rooms/:id/join", auth_middleware_1.authMiddleware, room_controller_1.joinRoom);
router.patch("/rooms/:id/end", auth_middleware_1.authMiddleware, room_controller_1.endRoom);
// Guest OTP flow (no authMiddleware — guests aren't logged in)
router.post("/rooms/:id/otp/request", rateLimit_middleware_1.otpRateLimiter, room_controller_1.requestOtp);
router.post("/rooms/:id/otp/verify", rateLimit_middleware_1.otpRateLimiter, room_controller_1.verifyOtp);
exports.default = router;
