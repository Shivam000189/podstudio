"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGuestToken = exports.signGuestToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const GUEST_SECRET = env_1.env.guestJwtSecret;
/**
 * Signs a short-lived guest JWT (4 hours) with a separate secret from the
 * main user JWT. The token carries the verified room code and email so
 * downstream handlers (Socket.IO, API) can trust the guest's identity
 * without a database lookup.
 */
const signGuestToken = ({ roomCode, email, }) => {
    return jsonwebtoken_1.default.sign({ roomCode, email, type: "guest" }, GUEST_SECRET, {
        expiresIn: "4h",
    });
};
exports.signGuestToken = signGuestToken;
/**
 * Verifies a guest JWT. Returns the decoded payload or throws if the
 * token is invalid / expired.
 */
const verifyGuestToken = (token) => {
    const payload = jsonwebtoken_1.default.verify(token, GUEST_SECRET);
    if (payload.type !== "guest") {
        throw new Error("Token is not a guest token");
    }
    return payload;
};
exports.verifyGuestToken = verifyGuestToken;
