import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

const getOrCreateClerkUser = async (clerkUserId: string) => {
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ clerk_id: clerkUserId }, { id: clerkUserId }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: clerkUserId,
        clerk_id: clerkUserId,
        email: `${clerkUserId}@clerk.user`,
        name: "PodStudio Creator",
      },
    });
  }

  return user;
};

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    try {
      const clerkAuth = getAuth(req);
      if (clerkAuth?.userId) {
        const user = await getOrCreateClerkUser(clerkAuth.userId);
        req.userId = user.id;
        return next();
      }
    } catch {}

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const decoded = verifyToken(token);
        if (decoded?.userId) {
          req.userId = decoded.userId;
          return next();
        }
      } catch {}

      if (token.startsWith("user_")) {
        const user = await getOrCreateClerkUser(token);
        req.userId = user.id;
        return next();
      }

      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8")
          );
          if (typeof payload.sub === "string" && payload.sub.startsWith("user_")) {
            const user = await getOrCreateClerkUser(payload.sub);
            req.userId = user.id;
            return next();
          }
        }
      } catch {}
    }

    return res.status(401).json({ message: "Unauthorized - Please sign in" });
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Invalid or expired session" });
  }
};