const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { optionalAuthenticate } = require('../middleware/auth');
const { resolveCoordinates } = require('../utils/geo');

// =================== GET /api/search ===================
// Token-based multi-token search across alumni, jobs, events, stories, and announcements
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: {} });

    const rawQuery = String(q).trim();
    const tokens = rawQuery.split(/\s+/).filter((t) => t.length > 0);
    const types = type ? [type] : ['alumni', 'jobs', 'events', 'stories', 'announcements'];
    const results = {};
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    if (types.includes('alumni')) {
      const rawAlumni = await prisma.user.findMany({
        where: {
          role: 'ALUMNI',
          isActive: true,
          AND: tokens.map((t) => ({
            OR: [
              { name: { contains: t, mode: 'insensitive' } },
              { currentCompany: { contains: t, mode: 'insensitive' } },
              { jobTitle: { contains: t, mode: 'insensitive' } },
              { skills: { contains: t, mode: 'insensitive' } },
              { department: { contains: t, mode: 'insensitive' } },
              { location: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        take,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          currentCompany: true,
          jobTitle: true,
          batchYear: true,
          department: true,
          location: true,
        },
      });

      results.alumni = rawAlumni.map((u) => ({
        ...u,
        coordinates: resolveCoordinates(u.location),
      }));
    }

    if (types.includes('jobs')) {
      results.jobs = await prisma.jobPosting.findMany({
        where: {
          status: 'OPEN',
          AND: tokens.map((t) => ({
            OR: [
              { title: { contains: t, mode: 'insensitive' } },
              { company: { contains: t, mode: 'insensitive' } },
              { description: { contains: t, mode: 'insensitive' } },
              { skills: { contains: t, mode: 'insensitive' } },
              { location: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        take,
        include: { postedBy: { select: { name: true, avatarUrl: true } } },
      });
    }

    if (types.includes('events')) {
      results.events = await prisma.event.findMany({
        where: {
          AND: tokens.map((t) => ({
            OR: [
              { title: { contains: t, mode: 'insensitive' } },
              { description: { contains: t, mode: 'insensitive' } },
              { location: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        take,
      });
    }

    if (types.includes('stories')) {
      results.stories = await prisma.successStory.findMany({
        where: {
          isApproved: true,
          AND: tokens.map((t) => ({
            OR: [
              { title: { contains: t, mode: 'insensitive' } },
              { story: { contains: t, mode: 'insensitive' } },
              { company: { contains: t, mode: 'insensitive' } },
              { role: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        take,
        include: { alumni: { select: { name: true, avatarUrl: true } } },
      });
    }

    if (types.includes('announcements')) {
      results.announcements = await prisma.announcement.findMany({
        where: {
          AND: tokens.map((t) => ({
            OR: [
              { title: { contains: t, mode: 'insensitive' } },
              { body: { contains: t, mode: 'insensitive' } },
            ],
          })),
        },
        take,
        include: { createdBy: { select: { name: true, avatarUrl: true } } },
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
