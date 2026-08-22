// apps/api/src/routes/referrals.js
// Referral request workflow
const express = require('express');
const { Prisma } = require('@prisma/client');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { notify } = require('../services/notify');
const email = require('../services/email');

const MAX_PAGE = 1000;
const MAX_TX_RETRIES = 3;

async function withRetry(fn, retries = MAX_TX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'P2034' && attempt < retries) continue;
      throw err;
    }
  }
}

// =================== POST /api/referrals ===================
// Student requests a referral for a job
router.post('/', authenticate, requireRole('STUDENT', 'ALUMNI'), async (req, res) => {
  try {
    const { jobId, resumeUrl, coverLetter, studentNote } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    // Fetch the job to find the alumni who posted it
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'OPEN') return res.status(400).json({ error: 'Job is not open for referrals' });
    if (job.postedById === req.user.id) {
      return res.status(400).json({ error: 'You cannot request a referral for your own job post' });
    }

    // Check for duplicate request
    const existing = await prisma.referralRequest.findUnique({
      where: { jobId_requestedById: { jobId, requestedById: req.user.id } },
    });
    if (existing) return res.status(409).json({ error: 'You already requested a referral for this job' });

    // Check if referral slots are filled (atomic check within a transaction)
    const referral = await withRetry(() => prisma.$transaction(async (tx) => {
      const acceptedCount = await tx.referralRequest.count({
        where: { jobId, status: { in: ['ACCEPTED', 'REFERRED', 'HIRED'] } },
      });
      if (acceptedCount >= job.referralSlots) {
        throw new Error('SLOTS_FULL');
      }
      return tx.referralRequest.create({
        data: {
          jobId,
          requestedById: req.user.id,
          referredById: job.postedById,
          resumeUrl, coverLetter, studentNote,
        },
        include: {
          job: { select: { id: true, title: true, company: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
          referredBy: { select: { id: true, name: true, email: true } },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));

    // Notify the alumni (in-app + email + WhatsApp)
    await notify({
      userId: job.postedById,
      type: 'REFERRAL_REQUEST',
      title: 'New Referral Request',
      message: `${referral.requestedBy.name} requested a referral for ${job.title} at ${job.company}`,
      link: `/referrals/${referral.id}`,
      sendEmail: true,
      sendWhatsApp: true,
      emailTemplate: {
        fn: email.sendNewReferralEmail,
        data: { studentName: referral.requestedBy.name, jobTitle: job.title, company: job.company },
      },
    });

    res.status(201).json({ referral });
  } catch (err) {
    if (err.message === 'SLOTS_FULL') {
      return res.status(400).json({ error: 'All referral slots for this job are filled' });
    }
    console.error('POST /referrals error:', err);
    res.status(500).json({ error: 'Failed to create referral request' });
  }
});

// =================== GET /api/referrals/me/sent ===================
// Referral requests I (as student) have sent
router.get('/me/sent', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), MAX_PAGE);
    const skip = (pageNum - 1) * take;

    const [referrals, total] = await Promise.all([
      prisma.referralRequest.findMany({
        where: { requestedById: req.user.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip, take,
        include: {
          job: { select: { id: true, title: true, company: true, location: true } },
          referredBy: { select: { id: true, name: true, currentCompany: true, avatarUrl: true } },
        },
      }),
      prisma.referralRequest.count({ where: { requestedById: req.user.id } }),
    ]);

    res.json({
      referrals,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /referrals/me/sent error:', err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// =================== GET /api/referrals/me/received ===================
// Referral requests I (as alumni) have received
router.get('/me/received', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { referredById: req.user.id };
    if (status) where.status = status;

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), MAX_PAGE);
    const skip = (pageNum - 1) * take;

    const [referrals, total] = await Promise.all([
      prisma.referralRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip, take,
        include: {
          job: { select: { id: true, title: true, company: true } },
          requestedBy: { select: { id: true, name: true, email: true, batchYear: true, department: true, avatarUrl: true } },
        },
      }),
      prisma.referralRequest.count({ where }),
    ]);

    res.json({
      referrals,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /referrals/me/received error:', err);
    res.status(500).json({ error: 'Failed to fetch received referrals' });
  }
});

// =================== GET /api/referrals/:id ===================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const referral = await prisma.referralRequest.findUnique({
      where: { id: req.params.id },
      include: {
        job: true,
        requestedBy: { select: { id: true, name: true, email: true, batchYear: true, department: true, avatarUrl: true, linkedinUrl: true } },
        referredBy: { select: { id: true, name: true, email: true, currentCompany: true, jobTitle: true, avatarUrl: true } },
      },
    });

    if (!referral) return res.status(404).json({ error: 'Referral not found' });
    if (referral.requestedById !== req.user.id && referral.referredById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ referral });
  } catch (err) {
    console.error('GET /referrals/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch referral' });
  }
});

// =================== PATCH /api/referrals/:id/status ===================
// Alumni updates the referral status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, alumniNote, rejectionReason } = req.body;
    const allowed = ['ACCEPTED', 'REJECTED', 'REFERRED', 'HIRED', 'NOT_HIRED', 'WITHDRAWN'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const referral = await prisma.referralRequest.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    // Authorization rules
    if (['ACCEPTED', 'REJECTED', 'REFERRED', 'HIRED', 'NOT_HIRED'].includes(status)) {
      if (referral.referredById !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only the alumni can change this status' });
      }
    }
    if (status === 'WITHDRAWN' && referral.requestedById !== req.user.id) {
      return res.status(403).json({ error: 'Only the student can withdraw' });
    }

    const data = { status, alumniNote, rejectionReason };
    if (status === 'REFERRED') data.referredAt = new Date();
    if (status === 'HIRED' || status === 'NOT_HIRED') data.finalOutcomeAt = new Date();

    const updated = await prisma.referralRequest.update({
      where: { id: req.params.id },
      data,
      include: {
        job: { select: { title: true, company: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    // Notify the student (in-app + email + WhatsApp on HIRED)
    const notifMap = {
      ACCEPTED: { type: 'REFERRAL_ACCEPTED', title: '✅ Referral Accepted', message: `Your referral request for ${updated.job.title} was accepted!` },
      REJECTED: { type: 'REFERRAL_REJECTED', title: '❌ Referral Declined', message: `Your referral request for ${updated.job.title} was declined. ${rejectionReason || ''}` },
      REFERRED: { type: 'REFERRAL_ACCEPTED', title: '🚀 Referred to Company', message: `You have been referred for ${updated.job.title} at ${updated.job.company}!` },
      HIRED: { type: 'REFERRAL_HIRED', title: '🎉 You got Hired!', message: `Congrats! You got hired via referral for ${updated.job.title}` },
      NOT_HIRED: { type: 'REFERRAL_REJECTED', title: 'Update on Referral', message: `Outcome updated for ${updated.job.title}` },
    };
    const notif = notifMap[status];
    if (notif) {
      await notify({
        userId: updated.requestedBy.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: `/referrals/${updated.id}`,
        sendEmail: true,
        sendWhatsApp: status === 'HIRED',
        emailTemplate: {
          fn: email.sendReferralStatusEmail,
          data: { status, jobTitle: updated.job.title, company: updated.job.company },
        },
      });
    }

    res.json({ referral: updated });
  } catch (err) {
    console.error('PATCH /referrals/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update referral status' });
  }
});

// =================== GET /api/referrals/job/:jobId ===================
// All referrals for a specific job (job poster or admin)
router.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.postedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), MAX_PAGE);
    const skip = (pageNum - 1) * take;

    const where = { jobId: req.params.jobId };
    const [referrals, total] = await Promise.all([
      prisma.referralRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip, take,
        include: { requestedBy: { select: { id: true, name: true, email: true, batchYear: true, department: true } } },
      }),
      prisma.referralRequest.count({ where }),
    ]);

    res.json({
      referrals,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /referrals/job/:jobId error:', err);
    res.status(500).json({ error: 'Failed to fetch job referrals' });
  }
});

module.exports = router;
