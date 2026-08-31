-- ==============================================================================
-- SQL to sync production PostgreSQL database with latest schema
-- Run this in your Neon Console (SQL Editor) or Supabase SQL Editor
-- ==============================================================================

-- 1. Add clerk_id and other columns to User table if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerk_id" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verfied_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "update_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "avatar_url" DROP NOT NULL;

-- 2. Create unique index on clerk_id
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id");

-- 3. Ensure Recording table exists
CREATE TABLE IF NOT EXISTS "Recording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Untitled Meeting',
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "roomId" TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Recording_userId_idx" ON "Recording"("userId");
CREATE INDEX IF NOT EXISTS "Recording_createdAt_idx" ON "Recording"("createdAt");
