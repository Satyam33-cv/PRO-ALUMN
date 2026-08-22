// apps/api/src/routes/jobs.js
// Job posting & browsing endpoints
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// =================== POST /api/jobs ===================
// Alumni or Admin can post a job
router.post('/', authenticate, requireRole('ALUMNI', 'ADMIN'), async (req, res) => {
  try {
    const {
      title, company, location, jobType, experienceLevel,
      description, requirements, skills, salaryMin, salaryMax,
      currency, applyLink, deadline, referralSlots,
    } = req.body;

    // Validation
    if (!title || !company || !location || !description) {
      return res.status(400).json({ error: 'title, company, location, description are required' });
    }

    const job = await prisma.jobPosting.create({
      data: {
        postedById: req.user.id,
        title, company, location, jobType, experienceLevel,
        description, requirements,
        skills: Array.isArray(skills) ? skills.join(',') : skills,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        currency: currency || 'INR',
        applyLink, deadline: deadline ? new Date(deadline) : null,
        referralSlots: referralSlots ? parseInt(referralSlots) : 1,
      },
      include: {
        postedBy: { select: { id: true, name: true, currentCompany: true, jobTitle: true, avatarUrl: true } },
        _count: { select: { referrals: true } },
      },
    });

    res.status(201).json({ job });
  } catch (err) {
    console.error('POST /jobs error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// =================== GET /api/jobs ===================
// List jobs with filters
router.get('/', async (req, res) => {
  try {
    const {
      search, company, location, jobType, status = 'OPEN',
      page = 1, limit = 20,
    } = req.query;

    const where = { status };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (company) where.company = { contains: company, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (jobType) where.jobType = jobType;

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take,
        include: {
          postedBy: { select: { id: true, name: true, currentCompany: true, jobTitle: true, avatarUrl: true, batchYear: true } },
          _count: { select: { referrals: true } },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    res.json({
      jobs,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// =================== GET /api/jobs/:id ===================
// Job detail
router.get('/:id', async (req, res) => {
  try {
    // Increment view count
    const job = await prisma.jobPosting.update({
      where: { id: req.params.id },
      data: { viewsCount: { increment: 1 } },
      include: {
        postedBy: {
          select: {
            id: true, name: true, currentCompany: true, jobTitle: true,
            avatarUrl: true, batchYear: true, department: true, linkedinUrl: true,
          },
        },
        referrals: {
          select: { id: true, status: true, createdAt: true },
        },
        _count: { select: { referrals: true } },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    console.error('GET /jobs/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// =================== PATCH /api/jobs/:id ===================
// Update job (only by poster or admin)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const allowed = ['title', 'company', 'location', 'jobType', 'description', 'requirements',
      'skills', 'salaryMin', 'salaryMax', 'currency', 'applyLink', 'deadline', 'referralSlots', 'status'];

    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.deadline) data.deadline = new Date(data.deadline);

    const updated = await prisma.jobPosting.update({ where: { id: req.params.id }, data });
    res.json({ job: updated });
  } catch (err) {
    console.error('PATCH /jobs/:id error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// =================== DELETE /api/jobs/:id ===================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.jobPosting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('DELETE /jobs/:id error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
