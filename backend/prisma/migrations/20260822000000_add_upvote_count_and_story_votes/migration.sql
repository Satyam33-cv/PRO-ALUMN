-- AlterTable: Add upvoteCount to SuccessStory
ALTER TABLE "SuccessStory" ADD COLUMN "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: StoryVote (tracks which user voted on which story)
CREATE TABLE "StoryVote" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryVote_storyId_idx" ON "StoryVote"("storyId");

-- CreateIndex
CREATE INDEX "StoryVote_userId_idx" ON "StoryVote"("userId");

-- CreateIndex (unique: one vote per user per story)
CREATE UNIQUE INDEX "StoryVote_storyId_userId_key" ON "StoryVote"("storyId", "userId");

-- AddForeignKey
ALTER TABLE "StoryVote" ADD CONSTRAINT "StoryVote_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "SuccessStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryVote" ADD CONSTRAINT "StoryVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
