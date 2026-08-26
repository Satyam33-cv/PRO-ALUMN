"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Approves a user profile.
 * - Changes profile status to APPROVED
 * - Awards points to the user's wallet
 * - Checks and processes referral bonuses
 */
export async function approveProfileAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("User ID is required");

  // In production, verify Admin session here!
  // const session = await getServerSession();
  // if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    // 1. Transaction ensures either everything succeeds or everything rolls back
    await prisma.$transaction(async (tx: any) => {
      // 2. Update the profile status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { profileStatus: "APPROVED" },
      });

      // 3. Credit Ledger: Award signup/approval bonus
      await tx.walletTransaction.create({
        data: {
          userId: userId,
          amount: 50, // 50 points for an approved profile
          type: "CREDIT",
          description: "Profile Approval Bonus",
        },
      });

      // 4. Update the user's total points balance (Credit Ledger aggregation)
      await tx.wallet.upsert({
        where: { userId: userId },
        update: {
          balance: { increment: 50 },
        },
        create: {
          userId: userId,
          balance: 50,
        },
      });

      // 5. Referral Check: If they used a code, reward the referrer
      if (updatedUser.referredByCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: updatedUser.referredByCode },
        });

        if (referrer) {
          // Reward the referrer
          await tx.walletTransaction.create({
            data: {
              userId: referrer.id,
              amount: 100, // 100 points for successful referral
              type: "CREDIT",
              description: `Referral Bonus for inviting ${updatedUser.email}`,
            },
          });
          
          await tx.wallet.update({
            where: { userId: referrer.id },
            data: { balance: { increment: 100 } },
          });
        }
      }
    });

    // 6. Refresh the moderation queue page
    revalidatePath("/admin/profiles");
    return { success: true, message: "Profile approved and wallet credited." };
  } catch (error) {
    console.error("Failed to approve profile:", error);
    return { success: false, error: "Database transaction failed." };
  }
}

/**
 * Approves an uploaded video for the Video Market.
 * - Changes video status to APPROVED, making it live for purchase.
 */
export async function approveVideoAction(formData: FormData) {
  const videoId = formData.get("videoId") as string;
  if (!videoId) throw new Error("Video ID is required");

  try {
    await (prisma as any).video.update({
      where: { id: videoId },
      data: { status: "APPROVED" },
    });

    // Refresh the moderation queue and the public video market
    revalidatePath("/admin/videos");
    revalidatePath("/market");
    
    return { success: true, message: "Video approved and is now live." };
  } catch (error) {
    console.error("Failed to approve video:", error);
    return { success: false, error: "Failed to update video status." };
  }
}

/**
 * Rejects an item and sends it back for revision.
 */
export async function rejectItemAction(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const itemType = formData.get("itemType") as "VIDEO" | "PROFILE";
  
  try {
    if (itemType === "VIDEO") {
      await (prisma as any).video.update({
        where: { id: itemId },
        data: { status: "REJECTED" }, 
      });
      revalidatePath("/admin/videos");
    } else if (itemType === "PROFILE") {
      await (prisma as any).user.update({
        where: { id: itemId },
        data: { profileStatus: "REJECTED" },
      });
      revalidatePath("/admin/profiles");
    }

    return { success: true, message: `${itemType} rejected successfully.` };
  } catch (error) {
    console.error(`Failed to reject ${itemType}:`, error);
    return { success: false, error: "Action failed." };
  }
}
