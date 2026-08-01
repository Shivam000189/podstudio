/*
  Warnings:

  - You are about to drop the column `display_name` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "display_name",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email_verfied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL,
ADD COLUMN     "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "avatar_url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Meeting',
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "roomId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recording_userId_idx" ON "Recording"("userId");

-- CreateIndex
CREATE INDEX "Recording_createdAt_idx" ON "Recording"("createdAt");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
