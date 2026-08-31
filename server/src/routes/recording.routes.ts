import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middleware/auth.middleware";
import { createRecording, getRecordings, deleteRecording, updateRecording } from "../controllers/recording.controller";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, _file, cb) => {
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
router.patch("/:id", authMiddleware, updateRecording);
router.delete("/:id", authMiddleware, deleteRecording);

export default router;