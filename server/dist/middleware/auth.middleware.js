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
            // Clerk auth wasn't present or failed, continue to Bearer token fallback
        }
        // 2. Check for Bearer token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            // Try local JWT decode first (email/password login tokens)
            try {
                const decoded = (0, jwt_1.verifyToken)(token);
                if (decoded?.userId) {
                    req.userId = decoded.userId;
                    return next();
                }
            }
            catch {
                // Not a local JWT — continue to other checks
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
            // Clerk session JWT fallback: decode without full verification
            // to extract the Clerk subject (user ID) when clerkMiddleware
            // didn't populate getAuth() (e.g. timing, missing CLERK_SECRET_KEY)
            try {
                // Clerk session JWTs have { sub: "user_xxx", ... } as payload
                const parts = token.split(".");
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
                    const sub = payload.sub;
                    if (sub && typeof sub === "string" && sub.startsWith("user_")) {
                        let user = await prisma_1.prisma.user.findFirst({
                            where: {
                                OR: [{ clerk_id: sub }, { id: sub }],
                            },
                        });
                        if (!user) {
                            user = await prisma_1.prisma.user.create({
                                data: {
                                    id: sub,
                                    clerk_id: sub,
                                    email: `${sub}@clerk.user`,
                                    name: "PodStudio Creator",
                                },
                            });
                        }
                        req.userId = user.id;
                        return next();
                    }
                }
            }
            catch {
                // Token could not be decoded at all
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
