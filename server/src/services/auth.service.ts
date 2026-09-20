import {prisma }from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/hash";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  if (!password || password.length < 8) {
    throw { status: 400, message: "Password must be at least 8 characters long." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw { status: 409, message: "Email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw { status: 401, message: "Invalid email or password." };
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password." };
  }

  return user;
};


export const getMe = async (userId: string) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ id: userId }, { clerk_id: userId }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true,
      created_at: true,
    },
  });
};

