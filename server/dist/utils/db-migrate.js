"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = require("../config/prisma");
async function main() {
    console.log("Checking and migrating database schema...");
    try {
        await prisma_1.prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerk_id" TEXT;`);
        console.log("✓ Added clerk_id column (if not exists)");
        await prisma_1.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id");`);
        console.log("✓ Added unique index on clerk_id (if not exists)");
        await prisma_1.prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;`);
        console.log("✓ Made password column nullable");
        console.log("Database schema successfully updated!");
    }
    catch (error) {
        console.error("Migration error:", error);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
main();
