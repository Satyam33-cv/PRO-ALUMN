// apps/api/src/routes/announcements.js
// Faculty / Admin announcements
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// =================== POST /api/announcements ===================
// Faculty or Admin can post an announcement
router.post('/', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    const announcement = await prisma.announcement.create({
      data: { title, body, createdById: req.user.id },
      include: { createdBy: { select: { id: true, name: true, avatarUrl: true, department: true } } },
    });

    res.status(201).json({ announcement });
  } catch (err) {
    console.error('POST /announcements error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// =================== GET /api/announcements ===================
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * take;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take,
        include: {
          createdBy: { select: { id: true, name: true, avatarUrl: true, department: true, role: true } },
        },
      }),
      prisma.announcement.count(),
    ]);

    res.json({
      announcements,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /announcements error:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// =================== GET /api/announcements/:id ===================
router.get('/:id', async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true, department: true, role: true } },
      },
    });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ announcement });
  } catch (err) {
    console.error('GET /announcements/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// =================== PATCH /api/announcements/:id ===================
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    if (announcement.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this announcement' });
    }

    const data = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.body !== undefined) data.body = req.body.body;

    const updated = await prisma.announcement.update({ where: { id: req.params.id }, data });
    res.json({ announcement: updated });
  } catch (err) {
    console.error('PATCH /announcements/:id error:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// =================== DELETE /api/announcements/:id ===================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    if (announcement.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('DELETE /announcements/:id error:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
