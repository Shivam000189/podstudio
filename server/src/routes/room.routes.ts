import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createRoom, joinRoom, endRoom } from "../controllers/room.controller";

const router = Router();

router.post("/rooms/create", authMiddleware, createRoom);
router.get("/rooms/:id", joinRoom);
router.patch("/rooms/:id/end", authMiddleware, endRoom);

export default router;