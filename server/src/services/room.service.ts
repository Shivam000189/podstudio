import { customAlphabet } from "nanoid";
import { prisma } from "../config/prisma";

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
