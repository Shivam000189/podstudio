"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRecording = exports.deleteRecording = exports.getRecordings = exports.createRecording = void 0;
const prisma_1 = require("../config/prisma");
const cloudinary_service_1 = require("../services/cloudinary.service");
// POST /api/recordings - Upload and save recording
const createRecording = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, duration, roomId } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No video file provided"
            });
        }
        // Upload to Cloudinary
        const { url, publicId } = await (0, cloudinary_service_1.uploadToCloudinary)(file.path);
        const recording = await prisma_1.prisma.recording.create({
            data: {
                title: title || "Untitled Meeting",
                videoUrl: url, // Cloudinary URL
                publicId: publicId || null,
                duration: parseInt(duration) || 0,
                fileSize: file.size,
                roomId: roomId || null,
                userId,
            },
        });
        res.status(201).json({
            success: true,
            message: "Recording uploaded to cloud",
            data: recording,
        });
    }
    catch (error) {
        console.error("Create recording error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createRecording = createRecording;
// GET /api/recordings - List user's recordings (same as before)
const getRecordings = async (req, res) => {
    try {
        const userId = req.userId;
        const recordings = await prisma_1.prisma.recording.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            success: true,
            count: recordings.length,
            data: recordings,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRecordings = getRecordings;
// DELETE /api/recordings/:id - Delete recording
const deleteRecording = async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const recording = await prisma_1.prisma.recording.findFirst({
            where: { id, userId },
        });
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Recording not found"
            });
        }
        // Use stored publicId, with fallback to parsing URL for legacy records
        let publicId = recording.publicId;
        if (!publicId && recording.videoUrl) {
            const urlParts = recording.videoUrl.split('/');
            const filenameWithExt = urlParts[urlParts.length - 1];
            const folder = urlParts[urlParts.length - 2];
            publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
        }
        if (publicId) {
            await (0, cloudinary_service_1.deleteFromCloudinary)(publicId);
        }
        await prisma_1.prisma.recording.delete({
            where: { id },
        });
        res.json({ success: true, message: "Recording deleted from cloud" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteRecording = deleteRecording;
// PATCH /api/recordings/:id - Rename recording
const updateRecording = async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const { title } = req.body;
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }
        const recording = await prisma_1.prisma.recording.findFirst({
            where: { id, userId },
        });
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Recording not found",
            });
        }
        const updated = await prisma_1.prisma.recording.update({
            where: { id },
            data: { title: title.trim() },
        });
        res.json({
            success: true,
            message: "Recording renamed",
            data: updated,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateRecording = updateRecording;
