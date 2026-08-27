-- Migration: 20260827000000_admin_moderation_credit_ledger
-- Description: Video Marketplace Moderation, ItemStatus Enum, Profile Status, and Immutable Wallet Credit Ledger

-- Create ItemStatus enum
DO $$ BEGIN
  CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create WalletTransactionType enum if not exists
DO $$ BEGIN
  CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alter User table with profileStatus and referral fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileStatus" "ItemStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredByCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Create unique index for referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- Create Video table
CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL DEFAULT 'PENDING',
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- Create Wallet table
CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- Create WalletTransaction table (Immutable Ledger)
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "type" "WalletTransactionType" NOT NULL DEFAULT 'CREDIT',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- Unique index for Wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_userId_key" ON "Wallet"("userId");

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "Video_status_idx" ON "Video"("status");
CREATE INDEX IF NOT EXISTS "Video_uploaderId_idx" ON "Video"("uploaderId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- Foreign key constraints
DO $$ BEGIN
  ALTER TABLE "Video" ADD CONSTRAINT "Video_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
