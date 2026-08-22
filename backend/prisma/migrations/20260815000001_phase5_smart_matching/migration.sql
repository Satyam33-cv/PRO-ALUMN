-- Phase 5: AI Smart Matching
-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Student match fields
ALTER TABLE "User" ADD COLUMN "skills" TEXT;
ALTER TABLE "User" ADD COLUMN "interests" TEXT;

-- 3. 384-dim embedding vector (pgvector)
ALTER TABLE "User" ADD COLUMN "embedding" vector(384);

-- 4. HNSW index for fast similarity search
CREATE INDEX "User_embedding_idx" ON "User" USING hnsw (embedding vector_cosine_ops);
