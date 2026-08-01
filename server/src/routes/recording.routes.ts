import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware";
import { createRecording, getRecordings, deleteRecording } from "../controllers/recording.controller";

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "recording-" + uniqueSuffix + ".webm");
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// Routes
router.post("/", authMiddleware, upload.single("video"), createRecording);
router.get("/", authMiddleware, getRecordings);
router.delete("/:id", authMiddleware, deleteRecording);

export default router;