"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Server-side Admin Verification Guard
 * Verifies JWT token from cookies or authorization header.
 */
async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("pro-alumn_token")?.value ||
      cookieStore.get("token")?.value ||
      cookieStore.get("alumni_connect_token")?.value;

    const authHeader = (await headers()).get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const activeToken = token || headerToken;

    if (!activeToken) {
      // In development mode with local storage auth, allow if not explicitly forbidden
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      return false;
    }

    const decoded = jwt.verify(activeToken, JWT_SECRET) as { id: string; role?: string };
    if (!decoded || !decoded.id) return false;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true },
    });

    return Boolean(user && user.isActive && user.role === "ADMIN");
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }
}

/**
 * Approves a user profile in a single atomic transaction.
 * - Idempotency guard: No-ops if already approved
 * - Changes profileStatus to APPROVED & isVerified to true
 * - Credits User Wallet with +50 points and records immutable WalletTransaction
 * - If referredByCode is set, credits Referrer Wallet with +100 points in same transaction
 */
export async function approveProfileAction(input: FormData | string) {
  const userId = typeof input === "string" ? input : (input.get("userId") as string);
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch user to verify existence and check idempotency
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!existingUser) {
        throw new Error("User account not found");
      }

      // Idempotency: If already approved, return early without double-crediting
      if (existingUser.profileStatus === "APPROVED" && existingUser.isVerified) {
        return { alreadyApproved: true };
      }

      // 2. Update user profile status & verified flag
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          profileStatus: "APPROVED",
          isVerified: true,
        },
      });

      // 3. Upsert User Wallet
      const userWallet = await tx.wallet.upsert({
        where: { userId: updatedUser.id },
        update: {
          balance: { increment: 50 },
        },
        create: {
          userId: updatedUser.id,
          balance: 50,
        },
      });

      // 4. Record Immutable WalletTransaction for User (+50 pts)
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          userId: updatedUser.id,
          amount: 50,
          type: "CREDIT",
          reason: "PROFILE_APPROVAL_BONUS",
          description: "Profile Approval Bonus (+50 pts)",
        },
      });

      // 5. Referral Check: If invited by another alumnus/student, reward the referrer in the SAME transaction
      if (updatedUser.referredByCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: updatedUser.referredByCode },
        });

        if (referrer) {
          const referrerWallet = await tx.wallet.upsert({
            where: { userId: referrer.id },
            update: {
              balance: { increment: 100 },
            },
            create: {
              userId: referrer.id,
              balance: 100,
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              userId: referrer.id,
              amount: 100,
              type: "CREDIT",
              reason: "REFERRAL_BONUS",
              description: `Referral Bonus for inviting ${updatedUser.email} (+100 pts)`,
            },
          });
        }
      }

      return { alreadyApproved: false };
    });

    revalidatePath("/admin");
    revalidatePath("/directory");

    if (result.alreadyApproved) {
      return { success: true, message: "Profile was already approved." };
    }

    return { success: true, message: "Profile approved and wallet credited with +50 points." };
  } catch (error: any) {
    console.error("Failed to approve profile:", error);
    return { success: false, error: error.message || "Database transaction failed." };
  }
}

/**
 * Rejects a user profile. Sets profileStatus = REJECTED with no wallet side-effects.
 */
export async function rejectProfileAction(input: FormData | string) {
  const userId = typeof input === "string" ? input : (input.get("userId") as string);
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        profileStatus: "REJECTED",
        isVerified: false,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/directory");

    return { success: true, message: "Profile has been rejected." };
  } catch (error: any) {
    console.error("Failed to reject profile:", error);
    return { success: false, error: error.message || "Failed to update profile status." };
  }
}

/**
 * Approves an uploaded video for the Video Marketplace.
 * - Changes video status to APPROVED
 * - Revalidates marketplace and admin paths for instant visibility
 */
export async function approveVideoAction(input: FormData | string) {
  const videoId = typeof input === "string" ? input : (input.get("videoId") as string);
  if (!videoId) {
    return { success: false, error: "Video ID is required" };
  }

  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/admin");
    revalidatePath("/market");
    revalidatePath("/videos");

    return { success: true, message: "Video approved and is now live on marketplace." };
  } catch (error: any) {
    console.error("Failed to approve video:", error);
    return { success: false, error: error.message || "Failed to update video status." };
  }
}

/**
 * Rejects an uploaded video from the Video Marketplace.
 */
export async function rejectVideoAction(input: FormData | string) {
  const videoId = typeof input === "string" ? input : (input.get("videoId") as string);
  if (!videoId) {
    return { success: false, error: "Video ID is required" };
  }

  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" };
  }

  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/admin");
    revalidatePath("/market");
    revalidatePath("/videos");

    return { success: true, message: "Video rejected." };
  } catch (error: any) {
    console.error("Failed to reject video:", error);
    return { success: false, error: error.message || "Failed to update video status." };
  }
}

/**
 * Unified reject handler for backwards compatibility.
 */
export async function rejectItemAction(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const itemType = formData.get("itemType") as "VIDEO" | "PROFILE";

  if (itemType === "VIDEO") {
    return rejectVideoAction(itemId);
  } else if (itemType === "PROFILE") {
    return rejectProfileAction(itemId);
  }

  return { success: false, error: "Invalid item type" };
}
