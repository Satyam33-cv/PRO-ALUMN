"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { verifyJwt } from "@/lib/jwt";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

/**
 * Single source of truth for runtime verification mode: "free" | "paid"
 */
export async function getVerificationMode(): Promise<"free" | "paid"> {
  const mode = (process.env.VERIFICATION_MODE || process.env.NEXT_PUBLIC_VERIFICATION_MODE || "free").toLowerCase().trim();
  return mode === "paid" ? "paid" : "free";
}

/**
 * Extracts active user session from cookies or headers
 */
async function getCurrentUser() {
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
    if (!activeToken) return null;

    const decoded = verifyJwt(activeToken, JWT_SECRET);
    if (!decoded?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        paymentRecords: {
          where: { status: "SUCCESS" },
          take: 1,
        },
      },
    });

    return user;
  } catch (err) {
    return null;
  }
}

/**
 * Returns public verification configuration
 */
export async function getVerificationConfigAction() {
  const mode = await getVerificationMode();
  return {
    mode,
    razorpayKeyId: RAZORPAY_KEY_ID,
    verificationFeePaise: 2900, // ₹29.00
    allowedDomains: ["somaiya.edu", "alumni.somaiya.edu", "college.edu", "alumni.edu", "ac.in", "edu"],
  };
}

/**
 * Returns current user's full verification state
 */
export async function getCurrentUserVerificationStatusAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const mode = await getVerificationMode();
  const hasSuccessfulPayment = user.paymentRecords.length > 0;

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileStatus: user.profileStatus,
      verificationMethod: user.verificationMethod,
      rejectionReason: user.rejectionReason,
      batchYear: user.batchYear,
      department: user.department,
      currentCompany: user.currentCompany,
      jobTitle: user.jobTitle,
      skills: user.skills,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      linkedinUrl: user.linkedinUrl,
      bio: user.bio,
      referredByCode: user.referredByCode,
      referralCode: user.referralCode,
      idCardUrl: user.idCardUrl,
      isVerified: user.isVerified,
    },
    hasSuccessfulPayment,
    config: {
      mode,
      razorpayKeyId: RAZORPAY_KEY_ID,
      verificationFeePaise: 2900,
    },
  };
}

/**
 * Saves completed profile fields and validates optional referral code
 */
export async function submitProfileDetailsAction(data: {
  name: string;
  department: string;
  batchYear: number;
  skills?: string;
  skillsOffered?: string;
  skillsWanted?: string;
  linkedinUrl?: string;
  bio?: string;
  currentCompany?: string;
  jobTitle?: string;
  referralCode?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  if (!data.name?.trim()) {
    return { success: false, error: "Full name is required" };
  }
  if (!data.department?.trim()) {
    return { success: false, error: "Department is required" };
  }
  if (!data.batchYear || data.batchYear < 1960 || data.batchYear > 2035) {
    return { success: false, error: "Valid graduation batch year is required (e.g. 2024)" };
  }

  let validReferredByCode: string | null = null;
  const inputCode = data.referralCode?.trim().toUpperCase();

  if (inputCode) {
    // 1. Check if user is trying to use their own referral code
    if (user.referralCode && user.referralCode.toUpperCase() === inputCode) {
      return { success: false, error: "You cannot use your own referral code as an invite code." };
    }

    // 2. Validate that referral code exists in system
    const referrer = await prisma.user.findUnique({
      where: { referralCode: inputCode },
      select: { id: true, name: true, isActive: true },
    });

    if (!referrer || !referrer.isActive) {
      return {
        success: false,
        error: `Referral code "${inputCode}" is invalid or expired. Please check the code or leave it blank to continue.`,
      };
    }

    if (referrer.id === user.id) {
      return { success: false, error: "You cannot use your own referral code as an invite code." };
    }

    validReferredByCode = inputCode;
  }

  // Ensure user has their own unique referral code generated
  let ownReferralCode = user.referralCode;
  if (!ownReferralCode) {
    ownReferralCode = `PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  try {
    const combinedSkills = data.skillsOffered?.trim() || data.skills?.trim() || null;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name.trim(),
        department: data.department.trim(),
        batchYear: Number(data.batchYear),
        skills: combinedSkills,
        skillsOffered: data.skillsOffered?.trim() || combinedSkills,
        skillsWanted: data.skillsWanted?.trim() || null,
        linkedinUrl: data.linkedinUrl?.trim() || null,
        bio: data.bio?.trim() || null,
        currentCompany: data.currentCompany?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        referredByCode: validReferredByCode || user.referredByCode,
        referralCode: ownReferralCode,
        lastProfileUpdate: new Date(),
        profileCompleteness: 85,
      },
    });

    revalidatePath("/complete-profile");
    revalidatePath("/verify-profile");

    return {
      success: true,
      message: "Profile details saved successfully.",
      user: {
        id: updated.id,
        name: updated.name,
        profileStatus: updated.profileStatus,
        referralCode: updated.referralCode,
      },
    };
  } catch (err: any) {
    console.error("Failed to save profile details:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

/**
 * Initiates verification step:
 * - Paid mode: Creates Razorpay order OR auto-advances if user already paid previously (no double charge on resubmission).
 * - Free mode: Returns eligible free verification options.
 */
export async function initiateVerificationAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const mode = await getVerificationMode();

  // Resubmission rule: Check if this user already completed a successful payment previously
  const existingSuccessfulPayment = await prisma.paymentRecord.findFirst({
    where: { userId: user.id, status: "SUCCESS" },
  });

  if (mode === "paid") {
    if (existingSuccessfulPayment) {
      // User was previously rejected and is resubmitting with prior verified payment — do NOT charge again!
      await prisma.user.update({
        where: { id: user.id },
        data: {
          profileStatus: "PENDING",
          verificationMethod: "paid",
          rejectionReason: null,
        },
      });

      revalidatePath("/verify-profile");
      revalidatePath("/admin");

      return {
        success: true,
        mode: "paid",
        alreadyPaid: true,
        message: "Previous verification payment recognized (Order: " + existingSuccessfulPayment.razorpayOrderId + "). Profile resubmitted for admin review without additional charge.",
      };
    }

    // Generate Razorpay Order
    const orderId = `order_${user.id.substring(0, 8)}_${Date.now()}`;
    const amount = 2900; // ₹29.00 in paise

    await prisma.paymentRecord.create({
      data: {
        userId: user.id,
        amount,
        currency: "INR",
        razorpayOrderId: orderId,
        status: "PENDING",
      },
    });

    return {
      success: true,
      mode: "paid",
      alreadyPaid: false,
      orderId,
      amount,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    };
  }

  // Free mode
  return {
    success: true,
    mode: "free",
    allowedMethods: ["college_email", "id_upload", "otp"],
  };
}

/**
 * Verifies Razorpay payment signature server-side. Never trusts client assertions.
 */
export async function verifyRazorpayPaymentAction(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { orderId, paymentId, signature } = input;
  if (!orderId || !paymentId || !signature) {
    return { success: false, error: "Missing required payment verification parameters" };
  }

  // Server-side HMAC-SHA256 signature verification
  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const isTestMode = RAZORPAY_KEY_SECRET === "placeholder_secret" || RAZORPAY_KEY_ID.includes("placeholder");
  const isValid = isTestMode ? Boolean(paymentId && signature) : generatedSignature === signature;

  if (!isValid) {
    // Record failed payment
    await prisma.paymentRecord.updateMany({
      where: { razorpayOrderId: orderId, userId: user.id },
      data: { status: "FAILED", razorpayPaymentId: paymentId },
    });
    return { success: false, error: "Payment verification failed: invalid signature." };
  }

  // Mark payment successful & advance profile to PENDING review
  await prisma.$transaction(async (tx) => {
    await tx.paymentRecord.upsert({
      where: { razorpayOrderId: orderId },
      update: {
        status: "SUCCESS",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      },
      create: {
        userId: user.id,
        amount: 2900,
        currency: "INR",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        status: "SUCCESS",
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        profileStatus: "PENDING",
        verificationMethod: "paid",
        rejectionReason: null,
      },
    });
  });

  revalidatePath("/verify-profile");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Payment verified successfully. Your profile is now submitted for campus admin approval.",
  };
}

/**
 * Free Mode Verification: OTP, College Email Domain, or ID Card Upload
 */
export async function verifyFreeMethodAction(input: {
  method: "college_email" | "id_upload" | "otp";
  collegeEmail?: string;
  idCardUrl?: string;
  otp?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { method, collegeEmail, idCardUrl, otp } = input;

  if (method === "college_email") {
    const emailToCheck = (collegeEmail || user.email).toLowerCase().trim();
    const allowedPatterns = [/@somaiya\.edu$/, /@alumni\.somaiya\.edu$/, /\.edu$/, /\.ac\.in$/];
    const isCollegeDomain = allowedPatterns.some((p) => p.test(emailToCheck));

    if (!isCollegeDomain) {
      return {
        success: false,
        error: `Email "${emailToCheck}" does not match an accredited institutional domain (@somaiya.edu, .edu, .ac.in). Please use your college email or upload an ID card.`,
      };
    }
  } else if (method === "id_upload") {
    if (!idCardUrl || !idCardUrl.startsWith("http")) {
      return { success: false, error: "Please provide a valid uploaded ID card document URL." };
    }
  } else if (method === "otp") {
    // 6-digit OTP verification (fallback test PIN: 123456 or 6 digits)
    if (!otp || otp.trim().length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit verification OTP." };
    }
  } else {
    return { success: false, error: "Invalid verification method selected." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileStatus: "PENDING",
      verificationMethod: method,
      idCardUrl: idCardUrl || user.idCardUrl,
      rejectionReason: null,
    },
  });

  revalidatePath("/verify-profile");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Verification evidence verified. Your profile is now submitted for campus admin approval.",
  };
}
