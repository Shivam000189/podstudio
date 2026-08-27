import jwt from "jsonwebtoken";
import { env } from "../config/env";

const JWT_SECRET = env.jwtSecret;

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: "24h",
    });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
};





