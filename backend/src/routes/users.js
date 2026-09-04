const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  calculateProfileCompleteness,
  checkProfileFreshness,
  awardPoints,
} = require('../services/gamification');
const { resolveCoordinates } = require('../utils/geo');

// =================== GET /api/users/me ===================
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatarUrl: true,
        batchYear: true, department: true, rollNumber: true,
        currentCompany: true, jobTitle: true, location: true, linkedinUrl: true, bio: true,
        skills: true, skillsOffered: true, skillsWanted: true, interests: true, timeline: true, resumeUrl: true,
        isVerified: true, isActive: true, createdAt: true,
        profileStatus: true, verificationMethod: true, rejectionReason: true, idCardUrl: true, referralCode: true, referredByCode: true,
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
      'skills', 'skillsOffered', 'skillsWanted', 'interests', 'timeline', 'referredByCode',
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
    if (data.skills !== undefined || data.skillsOffered !== undefined || data.skillsWanted !== undefined || data.interests !== undefined || data.timeline !== undefined) {
      data.lastProjectUpdate = now;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatarUrl: true,
        batchYear: true, department: true, currentCompany: true, jobTitle: true,
        location: true, linkedinUrl: true, bio: true, resumeUrl: true,
        skills: true, skillsOffered: true, skillsWanted: true, interests: true, timeline: true, isVerified: true,
        createdAt: true, currentStreak: true, longestStreak: true, totalPoints: true,
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

// =================== POST /api/users/verify-evidence ===================
router.post('/verify-evidence', authenticate, async (req, res) => {
  try {
    const { method, collegeEmail, idCardUrl, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (method === 'college_email') {
      const emailToCheck = (collegeEmail || user.email).toLowerCase().trim();
      const allowedPatterns = [/@somaiya\.edu$/, /@alumni\.somaiya\.edu$/, /\.edu$/, /\.ac\.in$/];
      const isCollegeDomain = allowedPatterns.some((p) => p.test(emailToCheck));
      if (!isCollegeDomain) {
        return res.status(400).json({
          error: `Email "${emailToCheck}" does not match an accredited institutional domain (@somaiya.edu, .edu, .ac.in). Please use your college email or upload an ID card.`,
        });
      }
    } else if (method === 'id_upload') {
      if (!idCardUrl || !idCardUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Please provide a valid uploaded ID card document URL.' });
      }
    } else if (method === 'otp') {
      if (!otp || otp.trim().length !== 6) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit verification OTP.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid verification method selected.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        profileStatus: 'PENDING',
        verificationMethod: method,
        idCardUrl: idCardUrl || user.idCardUrl,
        rejectionReason: null,
      },
    });

    res.json({
      success: true,
      message: 'Verification evidence submitted. Your profile is now under campus admin review.',
      user: updated,
    });
  } catch (err) {
    console.error('POST /users/verify-evidence error:', err);
    res.status(500).json({ error: 'Failed to submit verification evidence' });
  }
});

// =================== PATCH /api/users/me/password ===================
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });

    const bcrypt = require('bcryptjs');
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      select: { id: true, passwordHash: true }
    });
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

    const enrichedAlumni = alumni.map((u) => ({
      ...u,
      coordinates: resolveCoordinates(u.location),
    }));

    res.json({
      alumni: enrichedAlumni,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /users/alumni error:', err);
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
});

// =================== GET /api/users/geo-distribution ===================
// Aggregated geo coordinates for Leaflet OpenStreetMap
router.get('/geo-distribution', async (req, res) => {
  try {
    const alumni = await prisma.user.findMany({
      where: { role: 'ALUMNI', isActive: true, location: { not: null } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        currentCompany: true,
        jobTitle: true,
        batchYear: true,
        location: true,
      },
    });

    const clustersMap = new Map();

    for (const a of alumni) {
      const coords = resolveCoordinates(a.location);
      if (!coords) continue;

      const clusterKey = `${coords.city}, ${coords.country}`;
      if (!clustersMap.has(clusterKey)) {
        clustersMap.set(clusterKey, {
          city: coords.city,
          country: coords.country,
          lat: coords.lat,
          lng: coords.lng,
          count: 0,
          alumni: [],
        });
      }

      const cluster = clustersMap.get(clusterKey);
      cluster.count += 1;
      if (cluster.alumni.length < 5) {
        cluster.alumni.push({
          id: a.id,
          name: a.name,
          currentCompany: a.currentCompany,
          jobTitle: a.jobTitle,
          avatarUrl: a.avatarUrl,
        });
      }
    }

    res.json({
      clusters: Array.from(clustersMap.values()),
    });
  } catch (err) {
    console.error('GET /users/geo-distribution error:', err);
    res.status(500).json({ error: 'Failed to fetch geo distribution' });
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
