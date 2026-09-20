import { Request, Response } from "express";
import { registerUser, loginUser, getMe } from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth.middleware";



//Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      expiresIn: "24h",
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || error.status || 400).json({
      success: false,
      message: error.message,
    });
  }
};


//Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      expiresIn: "24h",
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    res.status(err.statusCode || err.status || 400).json({
      success: false,
      message: err.message,
    });
  }
};


// Get me 
export const me = async (req:AuthRequest, res:Response) => {
  try{
    const user = await getMe(req.userId!);

    res.json({
      success:true,
      data:{
        _id:user?.id,
        name:user?.name,
        email:user?.email,
        createdAt: user?.created_at,
      },
    });
  }
  catch (err: any) {
    console.error("Error fetching user profile:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch user profile",
    });
  }

}

// Logout
export const logout = async (_req:Request, res:Response) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Sync Clerk User with Prisma Database
export const syncClerkUser = async (req: AuthRequest, res: Response) => {
  try {
    const { clerkId, name, email, avatarUrl } = req.body;
    const userId = clerkId || req.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user identifier" });
    }

    const { prisma } = await import("../config/prisma");

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: name || undefined,
        email: email || undefined,
        avatar_url: avatarUrl || undefined,
        clerk_id: clerkId || userId,
      },
      create: {
        id: userId,
        clerk_id: clerkId || userId,
        name: name || "PodStudio Creator",
        email: email || `${userId}@clerk.user`,
        avatar_url: avatarUrl || null,
      },
    });

    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
