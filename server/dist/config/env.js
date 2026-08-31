"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parseOrigins = (value) => value
    ?.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean) ?? [];
const corsOriginEnv = process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_URL ??
    process.env.CLIENT_URL;
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 5000),
    corsOrigins: parseOrigins(corsOriginEnv),
    jwtSecret: process.env.JWT_SECRET ??
        (process.env.NODE_ENV === "production"
            ? (() => {
                throw new Error("JWT_SECRET must be defined in production");
            })()
            : "riverside-development-secret"),
};
exports.isProduction = exports.env.nodeEnv === "production";
