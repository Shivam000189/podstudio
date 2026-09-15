import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as roomService from "../services/room.service";
import { signGuestToken } from "../utils/guestToken";

// POST /api/rooms/create - requires auth, so every room has a real owner
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const room = await roomService.createRoom(userId);

    // Keep "GenerateID" as the top-level field: the client
    // (Home.tsx) already reads response.data.GenerateID directly.
    res.status(201).json({
      success: true,
      GenerateID: room.code,
      data: room,
    });
  } catch (error: any) {
    console.error("Create room error:", error);
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Failed to create room" });
  }
};

// GET /api/rooms/:id - now requires authMiddleware so only logged-in
// users can join directly. Guests must go through the OTP flow.
export const joinRoom = async (req: AuthRequest, res: Response) => {
  try {
    const code = req.params.id as string;
    const participantId = req.userId!;

    const room = await roomService.addParticipant(code, participantId);

    res.json({
      success: true,
      roomId: room.code,
      participants: room.participants,
      participantCount: room.participants.length,
    });
  } catch (error: any) {
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Failed to join room" });
  }
};

// PATCH /api/rooms/:id/end - only the creator can close out a room
export const endRoom = async (req: AuthRequest, res: Response) => {
  try {
    const code = req.params.id as string;
    const userId = req.userId!;

    const room = await roomService.endRoom(code, userId);

    res.json({ success: true, message: "Room ended", data: room });
  } catch (error: any) {
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Failed to end room" });
  }
};

// ─── OTP Endpoints (no authMiddleware — guests aren't logged in) ────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/rooms/:id/otp/request
export const requestOtp = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.id as string;
    const { email } = req.body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
      return;
    }

    try {
      await roomService.requestOtp(roomCode, email.trim().toLowerCase());
    } catch (err: any) {
      if (err?.status === 404) {
        console.warn(`⚠️ [requestOtp] Room "${roomCode}" not found in database. No email sent.`);
      } else {
        console.error("❌ [requestOtp] Failed to send OTP email:", err);
      }
    }

    // Always return success to prevent room code enumeration
    res.json({
      success: true,
      message: "If a room with that code exists, a verification code has been sent to your email.",
    });
  } catch (error: any) {
    console.error("Request OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// POST /api/rooms/:id/otp/verify
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.id as string;
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
      return;
    }

    const room = await roomService.verifyOtp(
      roomCode,
      email.trim().toLowerCase(),
      code.trim()
    );

    // Sign a guest JWT so the client can authenticate on Socket.IO
    const guestToken = signGuestToken({
      roomCode: room.code,
      email: email.trim().toLowerCase(),
    });

    res.json({
      success: true,
      guestToken,
      roomId: room.code,
      participants: room.participants,
      participantCount: room.participants.length,
    });
  } catch (error: any) {
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Verification failed." });
  }
};
