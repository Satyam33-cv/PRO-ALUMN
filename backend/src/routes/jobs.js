// apps/api/src/routes/jobs.js
// Job posting, applicant review, resume export & browsing endpoints
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// =================== GET /api/jobs/my-postings ===================
// Alumni / Admin: Fetch jobs posted by me with full applicant & resume details
router.get('/my-postings', authenticate, async (req, res) => {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: req.user.role === 'ADMIN' ? {} : { postedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        referrals: {
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                batchYear: true,
                department: true,
                rollNumber: true,
                resumeUrl: true,
                skills: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { referrals: true } },
      },
    });

    res.json({ jobs });
  } catch (err) {
    console.error('GET /jobs/my-postings error:', err);
    res.status(500).json({ error: 'Failed to fetch your job postings' });
  }
});

// =================== GET /api/jobs/:id/applicants/export ===================
// Export all applicants & resumes for a specific job as CSV
router.get('/:id/applicants/export', authenticate, async (req, res) => {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id: req.params.id },
      include: {
        referrals: {
          include: {
            requestedBy: {
              select: {
                name: true,
                email: true,
                batchYear: true,
                department: true,
                rollNumber: true,
                resumeUrl: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to export applicants for this job' });
    }

    const headers = ['Applicant Name', 'Email', 'Phone', 'Roll Number', 'Department', 'Batch Year', 'Status', 'Resume URL', 'Cover Letter / Note', 'Applied Date'];
    const data = job.referrals.map((r) => [
      r.requestedBy?.name || '',
      r.requestedBy?.email || '',
      r.requestedBy?.phone || '',
      r.requestedBy?.rollNumber || '',
      r.requestedBy?.department || '',
      r.requestedBy?.batchYear || '',
      r.status,
      r.resumeUrl || r.requestedBy?.resumeUrl || '',
      r.studentNote || r.coverLetter || '',
      r.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...data.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=applicants-${job.company}-${job.title.replace(/[^a-z0-9]/gi, '_')}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('GET /jobs/:id/applicants/export error:', err);
    res.status(500).json({ error: 'Failed to export applicants' });
  }
});

// =================== PATCH /api/jobs/:id/applicants/:requestId/status ===================
// Alumni / Admin: Update candidate application status (HIRED, ACCEPTED, REJECTED, etc.)
router.patch('/:id/applicants/:requestId/status', authenticate, async (req, res) => {
  try {
    const { status, alumniNote } = req.body;
    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'REFERRED', 'HIRED', 'NOT_HIRED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.referralRequest.update({
      where: { id: req.params.requestId },
      data: {
        status: status.toUpperCase(),
        alumniNote: alumniNote || undefined,
        referredAt: status.toUpperCase() === 'REFERRED' ? new Date() : undefined,
        finalOutcomeAt: ['HIRED', 'NOT_HIRED'].includes(status.toUpperCase()) ? new Date() : undefined,
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Award bonus points to alumni if candidate hired
    if (status.toUpperCase() === 'HIRED') {
      const { awardPoints } = require('../services/gamification');
      await awardPoints(req.user.id, 'CANDIDATE_HIRED', 100).catch(() => {});
    }

    res.json({ request: updated, message: `Candidate status updated to ${status.toUpperCase()}` });
  } catch (err) {
    console.error('PATCH applicant status error:', err);
    res.status(500).json({ error: 'Failed to update applicant status' });
  }
});

// =================== POST /api/jobs ===================
// Alumni or Admin can post a job
router.post('/', authenticate, requireRole('ALUMNI', 'ADMIN'), async (req, res) => {
  try {
    const {
      title, company, location, jobType, experienceLevel,
      description, requirements, skills, salaryMin, salaryMax,
      currency, applyLink, deadline, referralSlots,
    } = req.body;

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

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'POSTED_JOB', 50).catch(() => {});

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
router.get('/:id', async (req, res) => {
  try {
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
