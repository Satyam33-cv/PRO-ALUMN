-- AlterTable Video: Add durationSeconds
ALTER TABLE "Video" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

-- AlterTable UnlockedVideo: Add watchedSeconds and completedAt
ALTER TABLE "UnlockedVideo" ADD COLUMN IF NOT EXISTS "watchedSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UnlockedVideo" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
