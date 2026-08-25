const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const searchTerm = String(q);
    const types = type ? [type] : ['alumni', 'jobs', 'events', 'stories', 'announcements'];
    const results = {};

    if (types.includes('alumni')) {
      results.alumni = await prisma.user.findMany({
        where: { 
          role: 'ALUMNI', 
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { currentCompany: { contains: searchTerm, mode: 'insensitive' } },
            { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
            { skills: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit),
        select: { id: true, name: true, avatarUrl: true, currentCompany: true, jobTitle: true, batchYear: true, department: true }
      });
    }

    if (types.includes('jobs')) {
      results.jobs = await prisma.jobPosting.findMany({
        where: { 
          status: 'OPEN',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { company: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { skills: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit),
        include: { postedBy: { select: { name: true, avatarUrl: true } } }
      });
    }

    if (types.includes('events')) {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { location: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit)
      });
    }

    if (types.includes('stories')) {
      results.stories = await prisma.story.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit),
        include: { author: { select: { name: true, avatarUrl: true } } }
      });
    }

    if (types.includes('announcements')) {
      results.announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit)
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
