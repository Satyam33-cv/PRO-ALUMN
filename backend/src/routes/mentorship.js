const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// =================== GET /api/mentorship ===================
// List mentorship requests for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const isMentor = req.user.role === 'ALUMNI' || req.user.role === 'FACULTY';
    const where = isMentor ? { mentorId: req.user.id } : { studentId: req.user.id };

    const mentorships = await prisma.mentorship.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, avatarUrl: true, department: true, batchYear: true },
        },
        mentor: {
          select: { id: true, name: true, avatarUrl: true, currentCompany: true, jobTitle: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ mentorships });
  } catch (err) {
    console.error('GET /mentorship error:', err);
    res.status(500).json({ error: 'Failed to fetch mentorship requests' });
  }
});

// =================== POST /api/mentorship ===================
// Request mentorship
router.post('/', authenticate, async (req, res) => {
  try {
    const { mentorId, area, message } = req.body;
    if (!mentorId || !area) {
      return res.status(400).json({ error: 'mentorId and area are required' });
    }

    if (req.user.id === mentorId) {
      return res.status(400).json({ error: 'Cannot request mentorship from yourself' });
    }

    // Check if a request already exists between these users
    const existing = await prisma.mentorship.findFirst({
      where: {
        studentId: req.user.id,
        mentorId: mentorId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Mentorship request already exists with this mentor' });
    }

    const mentorship = await prisma.mentorship.create({
      data: {
        studentId: req.user.id,
        mentorId,
        area,
        message,
        status: 'PENDING',
      },
    });

    res.status(201).json({ mentorship });
  } catch (err) {
    console.error('POST /mentorship error:', err);
    res.status(500).json({ error: 'Failed to request mentorship' });
  }
});

// =================== PATCH /api/mentorship/:id/status ===================
// Update mentorship status (Mentor only)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body; // 'ACCEPTED', 'DECLINED', 'COMPLETED'
    if (!['ACCEPTED', 'DECLINED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: req.params.id },
    });

    if (!mentorship) return res.status(404).json({ error: 'Mentorship request not found' });
    if (mentorship.mentorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this mentorship request' });
    }

    const updated = await prisma.mentorship.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ mentorship: updated });
  } catch (err) {
    console.error('PATCH /mentorship/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update mentorship status' });
  }
});

module.exports = router;
