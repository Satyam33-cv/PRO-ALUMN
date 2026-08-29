"use server";

import prisma from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function submitVideoAction(formData: FormData) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pro-alumn_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("alumni_connect_token")?.value;

  if (!token) throw new Error("Unauthorized");

  const session = verifyJwt(token, JWT_SECRET);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const videoUrl = formData.get("videoUrl") as string;

  if (!title || !description || !videoUrl) {
    throw new Error("Missing required fields");
  }

  const video = await prisma.video.create({
    data: {
      title,
      description,
      videoUrl,
      status: "PENDING",
      authorId: session.id,
    },
  });

  revalidatePath("/market");
  return { success: true, video };
}

export async function unlockVideoAction(videoId: string) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("pro-alumn_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("alumni_connect_token")?.value;

  if (!token) throw new Error("Unauthorized");

  const session = verifyJwt(token, JWT_SECRET);
  if (!session) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch video and its price
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new Error("Video not found");

  if (video.price === 0) {
    // If it's free, just unlock it instantly
    await prisma.unlockedVideo.upsert({
      where: { userId_videoId: { userId: session.id, videoId } },
      create: { userId: session.id, videoId },
      update: {},
    });
    revalidatePath("/market");
    return { success: true };
  }

  // 2. Start a transaction to deduct points and unlock
  return await prisma.$transaction(async (tx: any) => {
    // Lock the wallet row for update
    const wallet = await tx.wallet.findUnique({
      where: { userId: session.id },
    });

    if (!wallet) throw new Error("Wallet not found. Complete your profile to set up a wallet.");
    if (wallet.balance < video.price) {
      throw new Error("Insufficient points to unlock this video.");
    }

    // Deduct points
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: video.price } },
    });

    // Create transaction log
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: session.id,
        amount: video.price,
        type: "DEBIT",
        reason: "VIDEO_UNLOCK",
        description: `Unlocked premium video: ${video.title}`,
      },
    });

    // Create unlock record
    await tx.unlockedVideo.upsert({
      where: { userId_videoId: { userId: session.id, videoId } },
      create: { userId: session.id, videoId },
      update: {},
    });

    revalidatePath("/market");
    return { success: true };
  });
}
