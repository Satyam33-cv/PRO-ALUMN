const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  calculateProfileCompleteness,
  checkProfileFreshness,
  awardPoints,
} = require('../services/gamification');

// =================== GET /api/users/me ===================
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatarUrl: true,
        batchYear: true, department: true, rollNumber: true,
        currentCompany: true, jobTitle: true, location: true, linkedinUrl: true, bio: true,
        skills: true, interests: true, timeline: true, resumeUrl: true,
        isVerified: true, isActive: true, createdAt: true,
        currentStreak: true, longestStreak: true, totalPoints: true, lastActiveDate: true,
        lastProfileUpdate: true, lastJobUpdate: true, lastEducationUpdate: true, lastProjectUpdate: true,
        profileCompleteness: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const freshness = checkProfileFreshness(user);
    res.json({ user: { ...user, freshness } });
  } catch (err) {
    console.error('GET /users/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// =================== PATCH /api/users/me ===================
// Update own profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowed = [
      'name', 'phone', 'avatarUrl', 'batchYear', 'department', 'rollNumber',
      'currentCompany', 'jobTitle', 'location', 'linkedinUrl', 'bio', 'resumeUrl',
      'skills', 'interests', 'timeline',
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.batchYear) data.batchYear = parseInt(data.batchYear);

    // Profile tracking timestamps
    const now = new Date();
    data.lastProfileUpdate = now;

    if (data.currentCompany !== undefined || data.jobTitle !== undefined) {
      data.lastJobUpdate = now;
    }
    if (data.department !== undefined || data.batchYear !== undefined) {
      data.lastEducationUpdate = now;
    }
    if (data.skills !== undefined || data.interests !== undefined || data.timeline !== undefined) {
      data.lastProjectUpdate = now;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatarUrl: true,
        batchYear: true, department: true, currentCompany: true, jobTitle: true,
        location: true, linkedinUrl: true, bio: true, resumeUrl: true,
        skills: true, interests: true, timeline: true,
        currentStreak: true, longestStreak: true, totalPoints: true,
        lastProfileUpdate: true, lastJobUpdate: true, lastEducationUpdate: true, lastProjectUpdate: true,
        profileCompleteness: true,
      },
    });

    // Recompute completeness
    const completeness = calculateProfileCompleteness(user);
    if (completeness !== user.profileCompleteness) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profileCompleteness: completeness },
      });
      user.profileCompleteness = completeness;
    }

    // Award points for active profile updates (+20 pts)
    await awardPoints(req.user.id, 'PROFILE_UPDATED', 20).catch(() => {});

    const freshness = checkProfileFreshness(user);
    res.json({ user: { ...user, freshness } });
  } catch (err) {
    console.error('PATCH /users/me error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// =================== PATCH /api/users/me/password ===================
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });

    const bcrypt = require('bcrypt');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is wrong' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// =================== GET /api/users/alumni ===================
// Browse alumni directory (with filters)
router.get('/alumni', async (req, res) => {
  try {
    const {
      search, batchYear, department, company, location, page = 1, limit = 24,
    } = req.query;

    const where = { role: 'ALUMNI' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (batchYear) where.batchYear = parseInt(batchYear);
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (company) where.currentCompany = { contains: company, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const take = Math.min(Math.max(parseInt(limit) || 24, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), 1000);
    const skip = (pageNum - 1) * take;

    const [alumni, total] = await Promise.all([
      prisma.user.findMany({
        where, orderBy: [{ batchYear: 'desc' }, { name: 'asc' }, { id: 'desc' }],
        skip, take,
        select: {
          id: true, name: true, role: true, avatarUrl: true,
          batchYear: true, department: true, currentCompany: true, jobTitle: true,
          location: true, linkedinUrl: true, bio: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      alumni,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /users/alumni error:', err);
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
});

// =================== GET /api/users/:id ===================
// Public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, role: true, avatarUrl: true,
        batchYear: true, department: true, currentCompany: true, jobTitle: true,
        location: true, linkedinUrl: true, bio: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
