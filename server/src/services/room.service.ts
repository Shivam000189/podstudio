import { customAlphabet } from "nanoid";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { sendOtpEmail } from "./email.service";

const generateCode = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  6
);

const MAX_CODE_ATTEMPTS = 5;

// Creates a room owned by an authenticated user, retrying on the
// (rare) chance the generated 6-char code already exists.
export const createRoom = async (createdBy: string) => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      return await prisma.room.create({
        data: { code, createdBy },
      });
    } catch (error: any) {
      // Prisma unique-constraint violation -> code collision, try again
      if (error.code === "P2002") continue;
      throw error;
    }
  }

  throw { status: 500, message: "Could not generate a unique room code, please try again" };
};

export const getRoomByCode = async (code: string) => {
  return prisma.room.findUnique({ where: { code } });
};

// Adds a participant (userId or guest id) to a room's participant list.
// Throws a 404-shaped error if the room doesn't exist so controllers
// can respond consistently.
export const addParticipant = async (code: string, participantId: string) => {
  const room = await prisma.room.findUnique({ where: { code } });

  if (!room) {
    throw { status: 404, message: "Room not found" };
  }

  if (room.participants.includes(participantId)) {
    return room;
  }

  return prisma.room.update({
    where: { code },
    data: { participants: { push: participantId } },
  });
};

export const endRoom = async (code: string, requesterId: string) => {
  const room = await prisma.room.findUnique({ where: { code } });

  if (!room) {
    throw { status: 404, message: "Room not found" };
  }

  if (room.createdBy !== requesterId) {
    throw { status: 403, message: "Only the room creator can end this room" };
  }

  return prisma.room.update({
    where: { code },
    data: { endedAt: new Date() },
  });
};

// ─── OTP Flow ───────────────────────────────────────────────────────

/**
 * Generates a 6-digit OTP, hashes it, stores/upserts it in the database,
 * and sends the plaintext code to the guest's email.
 */
export const requestOtp = async (roomCode: string, email: string) => {
  // Validate the room exists (we don't reveal this to the client)
  const room = await getRoomByCode(roomCode);
  if (!room) {
    throw { status: 404, message: "Room not found" };
  }

  // Generate a cryptographically secure 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  // Upsert: if an OTP already exists for this room+email, replace it
  await prisma.roomOtp.upsert({
    where: { roomCode_email: { roomCode, email } },
    create: { roomCode, email, otpHash, expiresAt, attempts: 0 },
    update: { otpHash, expiresAt, attempts: 0 },
  });

  // Send the plaintext code via email (or console in dev)
  await sendOtpEmail(email, code);
};

/**
 * Verifies a guest-submitted OTP code. On success, adds the guest
 * as a participant and deletes the used OTP row.
 */
export const verifyOtp = async (
  roomCode: string,
  email: string,
  code: string
) => {
  const otp = await prisma.roomOtp.findUnique({
    where: { roomCode_email: { roomCode, email } },
  });

  if (!otp) {
    throw { status: 400, message: "No verification code found. Please request a new one." };
  }

  // Check expiry
  if (new Date() > otp.expiresAt) {
    // Clean up expired OTP
    await prisma.roomOtp.delete({ where: { id: otp.id } });
    throw { status: 400, message: "Verification code has expired. Please request a new one." };
  }

  // Increment attempts and check max
  const updatedOtp = await prisma.roomOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (updatedOtp.attempts > env.otpMaxAttempts) {
    await prisma.roomOtp.delete({ where: { id: otp.id } });
    throw {
      status: 429,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  // Compare the hash
  const isValid = await bcrypt.compare(code, otp.otpHash);
  if (!isValid) {
    const remaining = env.otpMaxAttempts - updatedOtp.attempts;
    throw {
      status: 400,
      message: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // OTP is valid — add guest as participant and clean up
  const room = await addParticipant(roomCode, email);
  await prisma.roomOtp.delete({ where: { id: otp.id } });

  return room;
};

