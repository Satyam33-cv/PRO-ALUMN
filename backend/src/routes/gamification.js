// backend/src/routes/gamification.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  getGamificationStatus,
  awardPoints,
  ensureDefaultBadges,
} = require('../services/gamification');

// =================== GET /api/gamification/status ===================
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await getGamificationStatus(req.user.id);
    res.json(status);
  } catch (err) {
    console.error('GET /gamification/status error:', err);
    res.status(500).json({ error: 'Failed to fetch gamification status' });
  }
});

// =================== GET /api/gamification/leaderboard ===================
router.get('/leaderboard', async (req, res) => {
  try {
    const { role, limit = 20 } = req.query;
    const where = {};
    if (role && ['ALUMNI', 'STUDENT', 'FACULTY'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const topUsers = await prisma.user.findMany({
      where,
      orderBy: [{ totalPoints: 'desc' }, { currentStreak: 'desc' }, { createdAt: 'asc' }],
      take,
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        department: true,
        batchYear: true,
        currentCompany: true,
        jobTitle: true,
        totalPoints: true,
        currentStreak: true,
        badges: {
          take: 3,
          include: { badge: true },
        },
      },
    });

    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      ...u,
      badges: u.badges.map((ub) => ub.badge),
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('GET /gamification/leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// =================== GET /api/gamification/badges ===================
router.get('/badges', async (req, res) => {
  try {
    await ensureDefaultBadges();
    const badges = await prisma.badge.findMany({
      orderBy: { requiredPts: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    res.json({ badges });
  } catch (err) {
    console.error('GET /gamification/badges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// =================== POST /api/gamification/verify-job ===================
// Single-click confirmation that alumnus is still at current company
router.post('/verify-job', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        lastJobUpdate: new Date(),
        lastProfileUpdate: new Date(),
      },
    });

    const result = await awardPoints(req.user.id, 'CAREER_VERIFIED', 30);
    res.json({
      message: 'Career information verified! Earned 30 points.',
      totalPoints: result.totalPoints,
    });
  } catch (err) {
    console.error('POST /gamification/verify-job error:', err);
    res.status(500).json({ error: 'Failed to verify job status' });
  }
});

// =================== POST /api/gamification/claim-action ===================
router.post('/claim-action', authenticate, async (req, res) => {
  try {
    const { actionType } = req.body;
    let points = 20;

    if (actionType === 'SEMESTER_UPDATE') {
      points = 40;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastEducationUpdate: new Date(), lastProfileUpdate: new Date() },
      });
    } else if (actionType === 'SKILLS_UPDATE') {
      points = 25;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastProjectUpdate: new Date(), lastProfileUpdate: new Date() },
      });
    } else if (actionType === 'PROFILE_COMPLETION') {
      points = 50;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastProfileUpdate: new Date() },
      });
    }

    const result = await awardPoints(req.user.id, actionType || 'PROFILE_ENGAGEMENT', points);
    res.json({
      message: `Earned ${points} points!`,
      totalPoints: result.totalPoints,
      pointsEarned: points,
    });
  } catch (err) {
    console.error('POST /gamification/claim-action error:', err);
    res.status(500).json({ error: 'Failed to claim action points' });
  }
});

// =================== GET /api/gamification/wallet ===================
router.get('/wallet', authenticate, async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: req.user.id, balance: 0 },
        include: { transactions: true },
      });
    }

    res.json({ wallet });
  } catch (err) {
    console.error('GET /gamification/wallet error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

module.exports = router;
