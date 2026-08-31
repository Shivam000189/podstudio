"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const recording_controller_1 = require("../controllers/recording.controller");
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, _file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "recording-" + uniqueSuffix + ".webm");
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});
// Routes
router.post("/", auth_middleware_1.authMiddleware, upload.single("video"), recording_controller_1.createRecording);
router.get("/", auth_middleware_1.authMiddleware, recording_controller_1.getRecordings);
router.patch("/:id", auth_middleware_1.authMiddleware, recording_controller_1.updateRecording);
router.delete("/:id", auth_middleware_1.authMiddleware, recording_controller_1.deleteRecording);
exports.default = router;
