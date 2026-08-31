"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.loginUser = exports.registerUser = void 0;
const prisma_1 = require("../config/prisma");
const hash_1 = require("../utils/hash");
const registerUser = async (name, email, password) => {
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw { status: 409, message: "Email already exists" };
    }
    const hashedPassword = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
        },
    });
    return user;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw { status: 404, message: "No account found with this email. Please sign up first." };
    }
    if (!user.password) {
        throw { status: 400, message: "This account was created with Google OAuth. Please click 'Continue with Google' to sign in." };
    }
    const isMatch = await (0, hash_1.comparePassword)(password, user.password);
    if (!isMatch) {
        throw { status: 400, message: "Invalid email or password. Please try again." };
    }
    return user;
};
exports.loginUser = loginUser;
const getMe = async (userId) => {
    return prisma_1.prisma.user.findFirst({
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
exports.getMe = getMe;
