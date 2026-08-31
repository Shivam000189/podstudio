"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const express_1 = require("@clerk/express");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Check for Clerk Auth via @clerk/express
        try {
            const clerkAuth = (0, express_1.getAuth)(req);
            if (clerkAuth && clerkAuth.userId) {
                const clerkUserId = clerkAuth.userId;
                // Find or create local user record for this Clerk User
                let user = await prisma_1.prisma.user.findFirst({
                    where: {
                        OR: [{ clerk_id: clerkUserId }, { id: clerkUserId }],
                    },
                });
                if (!user) {
                    user = await prisma_1.prisma.user.create({
                        data: {
                            id: clerkUserId,
                            clerk_id: clerkUserId,
                            email: `${clerkUserId}@clerk.user`,
                            name: "PodStudio Creator",
                        },
                    });
                }
                req.userId = user.id;
                return next();
            }
        }
        catch {
            // Clerk auth wasn't present, continue to Bearer token fallback
        }
        // 2. Check for Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            // Try local JWT decode
            try {
                const decoded = (0, jwt_1.verifyToken)(token);
                if (decoded?.userId) {
                    req.userId = decoded.userId;
                    return next();
                }
            }
            catch {
                // Fallback for custom or direct ID tokens
            }
            // Check if the bearer token is a Clerk User ID directly
            if (token.startsWith("user_")) {
                let user = await prisma_1.prisma.user.findFirst({
                    where: {
                        OR: [{ clerk_id: token }, { id: token }],
                    },
                });
                if (!user) {
                    user = await prisma_1.prisma.user.create({
                        data: {
                            id: token,
                            clerk_id: token,
                            email: `${token}@clerk.user`,
                            name: "PodStudio Creator",
                        },
                    });
                }
                req.userId = user.id;
                return next();
            }
        }
        return res.status(401).json({ message: "Unauthorized - Please sign in" });
    }
    catch (err) {
        console.error("Auth middleware error:", err);
        res.status(401).json({ message: "Invalid or expired session" });
    }
};
exports.authMiddleware = authMiddleware;
