-- AlterTable User: Add skillsOffered and skillsWanted
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "skillsOffered" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "skillsWanted" TEXT;

-- One-time data copy: migrate existing skills to skillsOffered
UPDATE "User"
SET "skillsOffered" = "skills"
WHERE "skillsOffered" IS NULL AND "skills" IS NOT NULL;
