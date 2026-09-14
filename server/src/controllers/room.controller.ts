import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as roomService from "../services/room.service";

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

// GET /api/rooms/:id - left open (no authMiddleware) so invited guests
// without an account can still join via the shared link.
export const joinRoom = async (req: Request, res: Response) => {
  try {
    const code = req.params.id as string;

    const headerUserId = req.headers["x-user-id"];
    const participantId =
      (Array.isArray(headerUserId) ? headerUserId[0] : headerUserId) ||
      `guest_${Math.random().toString(36).slice(2, 7)}`;

    const room = await roomService.addParticipant(code, participantId as string);

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
