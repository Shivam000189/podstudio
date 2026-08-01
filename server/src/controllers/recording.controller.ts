import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import fs from "fs";
import path from "path";

// POST /api/recordings - Upload and save recording
export const createRecording = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, duration, roomId } = req.body;
    
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "No video file provided" 
      });
    }

    // Local file URL (will be replaced by Cloud URL in Step 4)
    const videoUrl = `/uploads/${file.filename}`;

    const recording = await prisma.recording.create({
      data: {
        title: title || "Untitled Meeting",
        videoUrl,
        duration: parseInt(duration) || 0,
        fileSize: file.size,
        roomId: roomId || null,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Recording saved",
      data: recording,
    });
  } catch (error: any) {
    console.error("Create recording error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/recordings - List user's recordings
export const getRecordings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const recordings = await prisma.recording.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      count: recordings.length,
      data: recordings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/recordings/:id - Delete recording
export const deleteRecording = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const  id  = req.params.id as string;

    const recording = await prisma.recording.findFirst({
      where: { id , userId },
    });

    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        message: "Recording not found" 
      });
    }

    // Delete local file if it exists
    if (recording.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), recording.videoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.recording.delete({
      where: { id },
    });

    res.json({ success: true, message: "Recording deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};