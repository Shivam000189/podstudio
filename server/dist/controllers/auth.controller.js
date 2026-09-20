"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncClerkUser = exports.logout = exports.me = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const jwt_1 = require("../utils/jwt");
//Register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await (0, auth_service_1.registerUser)(name, email, password);
        const token = (0, jwt_1.generateToken)(user.id);
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
    }
    catch (error) {
        res.status(error.statusCode || error.status || 400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.register = register;
//Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await (0, auth_service_1.loginUser)(email, password);
        const token = (0, jwt_1.generateToken)(user.id);
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
    }
    catch (err) {
        res.status(err.statusCode || err.status || 400).json({
            success: false,
            message: err.message,
        });
    }
};
exports.login = login;
// Get me 
const me = async (req, res) => {
    try {
        const user = await (0, auth_service_1.getMe)(req.userId);
        res.json({
            success: true,
            data: {
                _id: user?.id,
                name: user?.name,
                email: user?.email,
                createdAt: user?.created_at,
            },
        });
    }
    catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch user profile",
        });
    }
};
exports.me = me;
// Logout
const logout = async (_req, res) => {
    res.json({
        success: true,
        message: "Logged out successfully",
    });
};
exports.logout = logout;
// Sync Clerk User with Prisma Database
const syncClerkUser = async (req, res) => {
    try {
        const { clerkId, name, email, avatarUrl } = req.body;
        const userId = clerkId || req.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Missing user identifier" });
        }
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.syncClerkUser = syncClerkUser;
