-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerk_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id");
