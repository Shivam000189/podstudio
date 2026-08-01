import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.service";

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

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(file.path);

    const recording = await prisma.recording.create({
      data: {
        title: title || "Untitled Meeting",
        videoUrl: url,           // Cloudinary URL
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
  } catch (error: any) {
    console.error("Create recording error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/recordings - List user's recordings (same as before)
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
      where: { id, userId },
    });

    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        message: "Recording not found" 
      });
    }

    // Extract public_id from Cloudinary URL for deletion
    // URL format: https://res.cloudinary.com/.../riverside-recordings/recording-xxx.webm
    const urlParts = recording.videoUrl.split('/');
    const filenameWithExt = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;

    await deleteFromCloudinary(publicId);

    await prisma.recording.delete({
      where: { id },
    });

    res.json({ success: true, message: "Recording deleted from cloud" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};