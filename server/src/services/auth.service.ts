import {prisma }from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/hash";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw {status:409, message:"Email already exists"};
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

  if (!user) {
    throw { status: 404, message: "No account found with this email. Please sign up first." };
  }

  if (!user.password) {
    throw { status: 400, message: "This account was created with Google OAuth. Please click 'Continue with Google' to sign in." };
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw { status: 400, message: "Invalid email or password. Please try again." };
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

