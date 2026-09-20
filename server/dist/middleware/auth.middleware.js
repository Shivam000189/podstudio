"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const express_1 = require("@clerk/express");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const getOrCreateClerkUser = async (clerkUserId) => {
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
    return user;
};
const authMiddleware = async (req, res, next) => {
    try {
        try {
            const clerkAuth = (0, express_1.getAuth)(req);
            if (clerkAuth?.userId) {
                const user = await getOrCreateClerkUser(clerkAuth.userId);
                req.userId = user.id;
                return next();
            }
        }
        catch { }
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = (0, jwt_1.verifyToken)(token);
                if (decoded?.userId) {
                    req.userId = decoded.userId;
                    return next();
                }
            }
            catch { }
            if (process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY) {
                try {
                    const clerkPayload = await (0, express_1.verifyToken)(token, {
                        secretKey: process.env.CLERK_SECRET_KEY,
                        jwtKey: process.env.CLERK_JWT_KEY,
                    });
                    const clerkUserId = clerkPayload?.sub;
                    if (clerkUserId) {
                        const user = await getOrCreateClerkUser(clerkUserId);
                        req.userId = user.id;
                        return next();
                    }
                }
                catch { }
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
