// apps/api/src/routes/stories.js
// Success stories: submit, list, admin approval workflow
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { notify } = require('../services/notify');
const email = require('../services/email');

// =================== POST /api/stories ===================
// Students, Alumni, Faculty, Admin can share achievements & stories
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, story, company, role, batchYear, imageUrl } = req.body;

    if (!title || !story) {
      return res.status(400).json({ error: 'title and story content are required' });
    }

    const created = await prisma.successStory.create({
      data: {
        alumniId: req.user.id,
        title,
        story,
        company: company || 'Somaiya Vidyavihar',
        role: role || (req.user.role === 'STUDENT' ? 'Student' : req.user.role === 'FACULTY' ? 'Faculty Member' : 'Alumni'),
        batchYear: batchYear ? parseInt(batchYear) : (req.user.batchYear || new Date().getFullYear()),
        imageUrl,
        isApproved: true, // Instantly available in the live achievement feed
      },
      include: {
        alumni: {
          select: { id: true, name: true, role: true, avatarUrl: true, department: true, currentCompany: true },
        },
      },
    });

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'SHARED_ACHIEVEMENT', 40).catch(() => {});

    res.status(201).json({ story: created, message: 'Achievement shared to feed successfully!' });
  } catch (err) {
    console.error('POST /stories error:', err);
    res.status(500).json({ error: 'Failed to submit achievement story' });
  }
});

// =================== GET /api/stories/pending ===================
// Admin: queue of stories awaiting approval (must be before GET /:id)
router.get('/pending', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const stories = await prisma.successStory.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'asc' },
      include: {
        alumni: { select: { id: true, name: true, currentCompany: true, jobTitle: true, avatarUrl: true } },
      },
    });
    res.json({ stories });
  } catch (err) {
    console.error('GET /stories/pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending stories' });
  }
});

// =================== GET /api/stories ===================
// Public list of approved stories (optionally featured only)
router.get('/', async (req, res) => {
  try {
    const { featured, page = 1, limit = 20 } = req.query;
    const where = { isApproved: true };
    if (featured === 'true') where.isFeatured = true;

    // We can extract user if token provided, but authenticate is strict, so we'll optionally verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        req.user = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // invalid token, ignore
      }
    }

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), 1000);
    const skip = (pageNum - 1) * take;

    const [stories, total] = await Promise.all([
      prisma.successStory.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip, take,
        include: {
          alumni: {
            select: { id: true, name: true, currentCompany: true, jobTitle: true, avatarUrl: true, department: true },
          },
          votes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true }
          } : undefined
        },
      }),
      prisma.successStory.count({ where }),
    ]);

    // Map to include hasVoted
    const mappedStories = stories.map(s => {
      const { votes, ...rest } = s;
      return { ...rest, hasVoted: votes && votes.length > 0 };
    });

    res.json({
      stories: mappedStories,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /stories error:', err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// =================== POST /api/stories/:id/approve ===================
// Admin approves a story (optional: feature it)
router.post('/:id/approve', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const story = await prisma.successStory.findUnique({
      where: { id: req.params.id },
      include: { alumni: { select: { id: true, name: true, email: true } } },
    });
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const updated = await prisma.successStory.update({
      where: { id: req.params.id },
      data: { isApproved: true, approvedBy: req.user.id, isFeatured: isFeatured === true },
    });

    // Notify the alumni that their story was approved (in-app + email)
    await notify({
      userId: story.alumniId,
      type: 'STORY_APPROVED',
      title: '✨ Story Approved',
      message: `Your story "${story.title}" is now live on the Spotlight Wall!`,
      link: `/stories/${story.id}`,
      sendEmail: true,
      emailTemplate: {
        fn: email.sendStoryApprovedEmail,
        data: { storyTitle: story.title },
      },
    });

    if (story.alumni && story.alumni.email) {
      const { sendAchievementApprovalEmail } = require('../utils/email');
      await sendAchievementApprovalEmail(story.alumni.email, story.title);
    }

    res.json({ story: updated });
  } catch (err) {
    console.error('POST /stories/:id/approve error:', err);
    res.status(500).json({ error: 'Failed to approve story' });
  }
});

// =================== GET /api/stories/:id ===================
router.get('/:id', async (req, res) => {
  try {
    const story = await prisma.successStory.findUnique({
      where: { id: req.params.id },
      include: {
        alumni: {
          select: { id: true, name: true, currentCompany: true, jobTitle: true, avatarUrl: true, department: true, batchYear: true },
        },
      },
    });
    if (!story) return res.status(404).json({ error: 'Story not found' });

    // Only approved stories (or the owner / admin) can be viewed
    if (!story.isApproved && story.alumniId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Story is pending approval' });
    }

    res.json({ story });
  } catch (err) {
    console.error('GET /stories/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// =================== PATCH /api/stories/:id ===================
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const story = await prisma.successStory.findUnique({ where: { id: req.params.id } });
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.alumniId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this story' });
    }

    const allowed = ['title', 'story', 'company', 'role', 'batchYear', 'imageUrl'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    // Editing resets approval (needs re-review)
    data.isApproved = false;
    data.approvedBy = null;

    const updated = await prisma.successStory.update({ where: { id: req.params.id }, data });
    res.json({ story: updated });
  } catch (err) {
    console.error('PATCH /stories/:id error:', err);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// =================== POST /api/stories/:id/vote ===================
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const story = await prisma.successStory.findUnique({ where: { id: storyId } });
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const existingVote = await prisma.storyVote.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.storyVote.delete({ where: { id: existingVote.id } }),
        prisma.successStory.update({
          where: { id: storyId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);
      return res.json({ message: 'Vote removed', hasVoted: false });
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.storyVote.create({ data: { storyId, userId } }),
        prisma.successStory.update({
          where: { id: storyId },
          data: { upvoteCount: { increment: 1 } },
        }),
      ]);
      return res.json({ message: 'Vote added', hasVoted: true });
    }
  } catch (err) {
    console.error('POST /stories/:id/vote error:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// =================== DELETE /api/stories/:id ===================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const story = await prisma.successStory.findUnique({ where: { id: req.params.id } });
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.alumniId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.successStory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Story deleted' });
  } catch (err) {
    console.error('DELETE /stories/:id error:', err);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

module.exports = router;
