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

export const createRoom = async (createdBy: string) => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      return await prisma.room.create({
        data: { code, createdBy },
      });
    } catch (error: any) {
      if (error.code === "P2002") continue;
      throw error;
    }
  }

  throw { status: 500, message: "Could not generate a unique room code, please try again" };
};

export const getRoomByCode = async (code: string) => {
  return prisma.room.findUnique({ where: { code } });
};

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

export const requestOtp = async (roomCode: string, email: string) => {
  const room = await getRoomByCode(roomCode);
  if (!room) {
    throw { status: 404, message: "Room not found" };
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  await prisma.roomOtp.upsert({
    where: { roomCode_email: { roomCode, email } },
    create: { roomCode, email, otpHash, expiresAt, attempts: 0 },
    update: { otpHash, expiresAt, attempts: 0 },
  });

  await sendOtpEmail(email, code);
};

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

  if (new Date() > otp.expiresAt) {
    await prisma.roomOtp.delete({ where: { id: otp.id } });
    throw { status: 400, message: "Verification code has expired. Please request a new one." };
  }

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

  const isValid = await bcrypt.compare(code, otp.otpHash);
  if (!isValid) {
    const remaining = env.otpMaxAttempts - updatedOtp.attempts;
    throw {
      status: 400,
      message: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  const room = await addParticipant(roomCode, email);
  await prisma.roomOtp.delete({ where: { id: otp.id } });

  return room;
};
