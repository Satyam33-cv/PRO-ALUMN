// backend/src/services/gamification.js
const prisma = require('../db');

const DEFAULT_BADGES = [
  {
    name: 'Profile Pro',
    description: 'Completed your entire profile information',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80',
    requiredPts: 50,
  },
  {
    name: 'Pioneer',
    description: 'Early member active in the community',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    requiredPts: 100,
  },
  {
    name: 'Streak Master',
    description: 'Logged in consistently and kept up your daily streak',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
    requiredPts: 250,
  },
  {
    name: 'Active Contributor',
    description: 'Actively participating in mentorship, jobs, or stories',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80',
    requiredPts: 500,
  },
  {
    name: 'Network Titan',
    description: 'Elite alumni pillar supporting the institution ecosystem',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    requiredPts: 1000,
  },
];

/**
 * Ensures default badges exist in database
 */
async function ensureDefaultBadges() {
  try {
    for (const b of DEFAULT_BADGES) {
      const existing = await prisma.badge.findFirst({ where: { name: b.name } });
      if (!existing) {
        await prisma.badge.create({ data: b });
      }
    }
  } catch (err) {
    console.error('Error ensuring default badges:', err.message);
  }
}

/**
 * Calculate profile completeness percentage (0 - 100)
 */
function calculateProfileCompleteness(user) {
  if (!user) return 0;
  let score = 0;
  
  if (user.name) score += 10;
  if (user.email) score += 10;
  if (user.avatarUrl) score += 10;
  if (user.bio && user.bio.trim().length > 10) score += 15;
  if (user.phone) score += 5;
  if (user.batchYear || user.department) score += 15;
  if (user.skills && user.skills.trim().length > 0) score += 15;
  
  if (user.role === 'ALUMNI') {
    if (user.currentCompany) score += 10;
    if (user.jobTitle) score += 10;
  } else {
    if (user.interests) score += 10;
    if (user.resumeUrl || user.timeline) score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Check profile freshness and generate smart nudges
 */
function checkProfileFreshness(user) {
  if (!user) return { nudges: [], completeness: 0, isStale: false };

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const fourMonthsAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const nudges = [];
  const completeness = calculateProfileCompleteness(user);

  const lastJob = user.lastJobUpdate ? new Date(user.lastJobUpdate) : new Date(user.createdAt || now);
  const lastSkills = user.lastProjectUpdate ? new Date(user.lastProjectUpdate) : new Date(user.createdAt || now);
  const lastEdu = user.lastEducationUpdate ? new Date(user.lastEducationUpdate) : new Date(user.createdAt || now);

  if (user.role === 'ALUMNI') {
    // Check if job info has not been verified in 6 months
    if (lastJob < sixMonthsAgo) {
      nudges.push({
        id: 'job-freshness',
        type: 'JOB_UPDATE',
        title: 'Career Check-in',
        message: user.currentCompany 
          ? `Are you still at ${user.currentCompany}? Confirm or update your position to keep your network informed!`
          : `Add your current company and role to help students reach out for referrals.`,
        points: 50,
        actionLabel: 'Verify Career Info',
        actionHref: '/profile',
      });
    }

    // Job anniversary check
    if (lastJob < oneYearAgo && user.currentCompany) {
      nudges.push({
        id: 'job-anniversary',
        type: 'ANNIVERSARY',
        title: 'Work Anniversary!',
        message: `Over a year at ${user.currentCompany}! Any promotions or new achievements to share?`,
        points: 30,
        actionLabel: 'Update Role',
        actionHref: '/profile',
      });
    }
  } else if (user.role === 'STUDENT') {
    // Semester prompt (every 6 months)
    if (lastEdu < sixMonthsAgo) {
      nudges.push({
        id: 'student-semester',
        type: 'SEMESTER_UPDATE',
        title: 'New Semester Update',
        message: 'A new term has passed! Add your recent projects, certifications, or internship experiences.',
        points: 40,
        actionLabel: 'Update Profile',
        actionHref: '/profile',
      });
    }

    // Skill tracking (every 4 months)
    if (lastSkills < fourMonthsAgo || !user.skills) {
      nudges.push({
        id: 'student-skills',
        type: 'SKILLS_UPDATE',
        title: 'Level Up Your Skills',
        message: 'Learned new frameworks or tools recently? Add them to increase your alumni matching score.',
        points: 25,
        actionLabel: 'Add Skills',
        actionHref: '/profile',
      });
    }
  }

  // Profile completeness nudge
  if (completeness < 80) {
    nudges.push({
      id: 'profile-completeness',
      type: 'COMPLETENESS',
      title: `Profile is ${completeness}% complete`,
      message: 'Complete your bio, skills, and social links to earn the Profile Pro badge.',
      points: 50,
      actionLabel: 'Complete Profile',
      actionHref: '/profile',
    });
  }

  return {
    completeness,
    nudges,
    isStale: nudges.length > 0,
    lastJobUpdate: user.lastJobUpdate,
    lastEducationUpdate: user.lastEducationUpdate,
    lastProjectUpdate: user.lastProjectUpdate,
  };
}

/**
 * Award points, log activity, and check for badge unlocks
 */
async function awardPoints(userId, actionType, points, metadata = {}) {
  try {
    // Update user points
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points },
      },
      select: { id: true, totalPoints: true, name: true, role: true },
    });

    // Create activity log
    const log = await prisma.activityLog.create({
      data: {
        userId,
        actionType,
        pointsEarned: points,
      },
    });

    // Broadcast to admin telemetry
    try {
      const { broadcastAdminActivity } = require('../socket');
      broadcastAdminActivity({
        id: log.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        actionType,
        pointsEarned: points,
        message: `${user.name} earned ${points} pts for ${actionType}`
      });
    } catch (e) {
      console.error('Failed to broadcast admin activity', e);
    }

    // Check for badge unlocks
    const allBadges = await prisma.badge.findMany();
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedIds = new Set(existingBadges.map((b) => b.badgeId));

    for (const badge of allBadges) {
      if (!earnedIds.has(badge.id) && user.totalPoints >= badge.requiredPts) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });

        // Notify user about badge unlock
        await prisma.notification.create({
          data: {
            userId,
            type: 'REWARD_UNLOCKED',
            title: `🏆 New Badge Unlocked: ${badge.name}!`,
            message: `Congratulations! You have unlocked the ${badge.name} badge for reaching ${badge.requiredPts} points.`,
            link: '/rewards',
          },
        });
      }
    }

    return { totalPoints: user.totalPoints, pointsEarned: points };
  } catch (err) {
    console.error('Error in awardPoints:', err);
    throw err;
  }
}

/**
 * Handle daily login streak
 */
async function recordDailyLogin(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        totalPoints: true,
      },
    });

    if (!user) return null;

    const now = new Date();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

    let newStreak = user.currentStreak || 0;
    let streakIncremented = false;
    let pointsAwarded = 0;

    if (!lastActive) {
      // First active day
      newStreak = 1;
      streakIncremented = true;
      pointsAwarded = 10;
    } else {
      // Compare calendar days in UTC
      const nowDateStr = now.toISOString().slice(0, 10);
      const lastDateStr = lastActive.toISOString().slice(0, 10);

      if (nowDateStr !== lastDateStr) {
        const diffDays = Math.round((new Date(nowDateStr) - new Date(lastDateStr)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
          streakIncremented = true;
          pointsAwarded = 5 + (newStreak % 7 === 0 ? 20 : 0); // Bonus 20 points every 7 days!
        } else {
          // Streak broken
          newStreak = 1;
          streakIncremented = true;
          pointsAwarded = 5;
        }
      }
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActiveDate: now,
        ...(pointsAwarded > 0 ? { totalPoints: { increment: pointsAwarded } } : {}),
      },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        totalPoints: true,
        lastActiveDate: true,
      },
    });

    if (pointsAwarded > 0) {
      await prisma.activityLog.create({
        data: {
          userId,
          actionType: 'DAILY_LOGIN',
          pointsEarned: pointsAwarded,
        },
      });
    }

    return {
      streak: updatedUser.currentStreak,
      longestStreak: updatedUser.longestStreak,
      totalPoints: updatedUser.totalPoints,
      streakIncremented,
      pointsAwarded,
    };
  } catch (err) {
    console.error('Error in recordDailyLogin:', err);
    return null;
  }
}

/**
 * Get full gamification status for a user
 */
async function getGamificationStatus(userId) {
  await ensureDefaultBadges();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      phone: true,
      batchYear: true,
      department: true,
      currentCompany: true,
      jobTitle: true,
      skills: true,
      interests: true,
      timeline: true,
      resumeUrl: true,
      currentStreak: true,
      longestStreak: true,
      totalPoints: true,
      lastActiveDate: true,
      lastProfileUpdate: true,
      lastJobUpdate: true,
      lastEducationUpdate: true,
      lastProjectUpdate: true,
      profileCompleteness: true,
    },
  });

  if (!user) throw new Error('User not found');

  // Trigger login streak check
  const loginResult = await recordDailyLogin(userId);

  const [allBadges, userBadges, recentActivities, totalUsersAhead] = await Promise.all([
    prisma.badge.findMany({ orderBy: { requiredPts: 'asc' } }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints },
      },
    }),
  ]);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const badgesWithStatus = allBadges.map((b) => ({
    ...b,
    isUnlocked: earnedBadgeIds.has(b.id),
    unlockedAt: userBadges.find((ub) => ub.badgeId === b.id)?.earnedAt || null,
    progress: Math.min(100, Math.round((user.totalPoints / b.requiredPts) * 100)),
  }));

  const freshness = checkProfileFreshness(user);

  // Update profileCompleteness if changed
  if (user.profileCompleteness !== freshness.completeness) {
    await prisma.user.update({
      where: { id: userId },
      data: { profileCompleteness: freshness.completeness },
    });
  }

  return {
    streak: {
      current: loginResult ? loginResult.streak : user.currentStreak,
      longest: loginResult ? loginResult.longestStreak : user.longestStreak,
      lastActiveDate: user.lastActiveDate,
    },
    totalPoints: loginResult ? loginResult.totalPoints : user.totalPoints,
    rank: totalUsersAhead + 1,
    completeness: freshness.completeness,
    freshness,
    badges: badgesWithStatus,
    recentActivities,
  };
}

module.exports = {
  ensureDefaultBadges,
  calculateProfileCompleteness,
  checkProfileFreshness,
  awardPoints,
  recordDailyLogin,
  getGamificationStatus,
};
