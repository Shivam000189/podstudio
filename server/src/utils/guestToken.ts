import jwt from "jsonwebtoken";
import { env } from "../config/env";

const GUEST_SECRET = env.guestJwtSecret;

export interface GuestTokenPayload {
  roomCode: string;
  email: string;
  type: "guest";
}

/**
 * Signs a short-lived guest JWT (4 hours) with a separate secret from the
 * main user JWT. The token carries the verified room code and email so
 * downstream handlers (Socket.IO, API) can trust the guest's identity
 * without a database lookup.
 */
export const signGuestToken = ({
  roomCode,
  email,
}: {
  roomCode: string;
  email: string;
}): string => {
  return jwt.sign({ roomCode, email, type: "guest" } as GuestTokenPayload, GUEST_SECRET, {
    expiresIn: "4h",
  });
};

/**
 * Verifies a guest JWT. Returns the decoded payload or throws if the
 * token is invalid / expired.
 */
export const verifyGuestToken = (token: string): GuestTokenPayload => {
  const payload = jwt.verify(token, GUEST_SECRET) as GuestTokenPayload;
  if (payload.type !== "guest") {
    throw new Error("Token is not a guest token");
  }
  return payload;
};
