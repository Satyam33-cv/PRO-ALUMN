"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { verifyJwt } from "@/lib/jwt";

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

    const decoded = verifyJwt(activeToken, JWT_SECRET);
    if (!decoded || !decoded.id) return false;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true },
    });

    return Boolean(user && user.isActive && user.role === "ADMIN");
  } catch {
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
 * - If referredByCode is set, credits Referrer Wallet with +100 points in same transaction (gated strictly on approval)
 * - If referrer is missing/suspended, fails gracefully without blocking the referee's approval
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
        return { alreadyApproved: true, user: existingUser };
      }

      // 2. Update user profile status & verified flag
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          profileStatus: "APPROVED",
          isVerified: true,
          rejectionReason: null,
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

      // 5. Referral Check: Strictly gated on admin approval
      let referralCredited = false;
      if (updatedUser.referredByCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: updatedUser.referredByCode },
        });

        // Graceful handling: only credit if referrer exists and is active; never block approval if referrer is missing
        if (referrer && referrer.isActive) {
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
          referralCredited = true;
        } else {
          console.warn(`Referrer with code ${updatedUser.referredByCode} not found or inactive; skipping referral credit.`);
        }
      }

      return { alreadyApproved: false, user: updatedUser, referralCredited };
    });

    revalidatePath("/admin");
    revalidatePath("/directory");
    revalidatePath("/verify-profile");

    if (result.alreadyApproved) {
      return { success: true, message: "Profile was already approved." };
    }

    const referralMsg = result.referralCredited ? " and referrer credited (+100 pts)" : "";
    return {
      success: true,
      message: `Profile approved! Member wallet credited (+50 pts)${referralMsg}.`,
    };
  } catch (error: unknown) {
    console.error("Failed to approve profile:", error);
    const message = error instanceof Error ? error.message : "Database transaction failed.";
    return { success: false, error: message };
  }
}

/**
 * Rejects a user profile with an optional reason.
 * - Sets profileStatus = REJECTED
 * - Records rejectionReason
 * - Resubmission allows fixing form without double-charging in paid mode
 */
export async function rejectProfileAction(input: FormData | string | { userId: string; reason?: string }) {
  let userId: string;
  let reason: string | undefined;

  if (typeof input === "string") {
    userId = input;
  } else if (input instanceof FormData) {
    userId = input.get("userId") as string;
    reason = (input.get("reason") as string) || undefined;
  } else {
    userId = input.userId;
    reason = input.reason;
  }

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
        rejectionReason: reason || "Credentials could not be verified with institutional records. Please update your details and resubmit.",
        isVerified: false,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/directory");
    revalidatePath("/verify-profile");

    return {
      success: true,
      message: "Profile rejected and feedback recorded. Member can resubmit corrections.",
    };
  } catch (error: unknown) {
    console.error("Failed to reject profile:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile status.";
    return { success: false, error: message };
  }
}

/**
 * Approves an uploaded video for the Video Marketplace.
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
  } catch (error: unknown) {
    console.error("Failed to approve video:", error);
    const message = error instanceof Error ? error.message : "Failed to update video status.";
    return { success: false, error: message };
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
  } catch (error: unknown) {
    console.error("Failed to reject video:", error);
    const message = error instanceof Error ? error.message : "Failed to update video status.";
    return { success: false, error: message };
  }
}

/**
 * Unified reject handler for backwards compatibility.
 */
export async function rejectItemAction(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const itemType = formData.get("itemType") as "VIDEO" | "PROFILE";
  const reason = formData.get("reason") as string | null;

  if (itemType === "VIDEO") {
    return rejectVideoAction(itemId);
  } else if (itemType === "PROFILE") {
    return rejectProfileAction({ userId: itemId, reason: reason || undefined });
  }

  return { success: false, error: "Invalid item type" };
}
