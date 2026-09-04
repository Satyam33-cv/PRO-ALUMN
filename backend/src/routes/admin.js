// apps/api/src/routes/admin.js
// Super Admin Command Center: System Telemetry, User Governance, Content Moderation, Broadcasts, Bulk Data Tools
const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { parse } = require('csv-parse');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const email = require('../services/email');
const { sendProfileApprovalEmail, sendAchievementApprovalEmail } = require('../utils/email');
const { deleteFromStorage } = require('../services/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const csvImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many import requests, please try again later' },
});

// Apply admin guard to all routes below
router.use(authenticate, requireRole('ADMIN'));

// =================== GET /api/admin/system-health ===================
// Live database connectivity, latency, memory, uptime, table counts
router.get('/system-health', async (req, res) => {
  const startTime = Date.now();
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    const userCount = await prisma.user.count();
    const jobCount = await prisma.jobPosting.count();
    const storyCount = await prisma.successStory.count();
    const referralCount = await prisma.referralRequest.count();
    const mentorshipCount = await prisma.mentorship.count();
    const eventCount = await prisma.event.count();
    const newsletterCount = await prisma.newsletter.count().catch(() => 0);
    const logCount = await prisma.activityLog.count().catch(() => 0);

    const memory = process.memoryUsage();

    res.json({
      status: 'HEALTHY',
      database: 'CONNECTED',
      latencyMs: latency,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      tableCounts: {
        users: userCount,
        jobs: jobCount,
        stories: storyCount,
        referrals: referralCount,
        mentorships: mentorshipCount,
        events: eventCount,
        newsletters: newsletterCount,
        activityLogs: logCount,
      },
    });
  } catch (err) {
    console.error('System health check error:', err);
    res.status(500).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: err.message,
      latencyMs: Date.now() - startTime,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
});

// =================== GET /api/admin/stats ===================
// Platform analytics & KPIs
router.get('/stats', async (req, res) => {
  try {
    const users = await prisma.user.count();
    const byRole = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    const jobs = await prisma.jobPosting.count();
    const openJobs = await prisma.jobPosting.count({ where: { status: 'OPEN' } });
    const referrals = await prisma.referralRequest.count();
    const referralsByStatus = await prisma.referralRequest.groupBy({ by: ['status'], _count: { _all: true } });
    const storiesApproved = await prisma.successStory.count({ where: { isApproved: true } });
    const storiesPending = await prisma.successStory.count({ where: { isApproved: false } });
    const events = await prisma.event.count();
    const upcomingEvents = await prisma.event.count({ where: { date: { gte: new Date() } } });
    const announcements = await prisma.announcement.count();

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, take: 6,
      select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true, currentCompany: true, jobTitle: true },
    });

    const recentReferrals = await prisma.referralRequest.findMany({
      orderBy: { createdAt: 'desc' }, take: 6,
      select: {
        id: true, status: true, createdAt: true,
        job: { select: { title: true, company: true } },
        requestedBy: { select: { name: true } },
      },
    });

    const verified = await prisma.user.count({ where: { isVerified: true } });

    res.json({
      stats: {
        users: { total: users, verified, byRole: Object.fromEntries(byRole.map(r => [r.role, r._count._all])) },
        jobs: { total: jobs, open: openJobs },
        referrals: { total: referrals, byStatus: Object.fromEntries(referralsByStatus.map(r => [r.status, r._count._all])) },
        stories: { approved: storiesApproved, pending: storiesPending },
        events: { total: events, upcoming: upcomingEvents },
        announcements,
      },
      recentUsers,
      recentReferrals,
    });
  } catch (err) {
    console.error('GET /admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// =================== GET /api/admin/users ===================
// List all users with filtering, searching, role toggle & status
router.get('/users', async (req, res) => {
  try {
    const { role, verified, active, search, page = 1, limit = 25 } = req.query;
    const where = {};
    if (role && role !== 'ALL') where.role = role.toUpperCase();
    if (verified === 'true') where.isVerified = true;
    if (verified === 'false') where.isVerified = false;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(Math.max(parseInt(limit) || 25, 1), 100);
    const pageNum = Math.min(Math.max(parseInt(page) || 1, 1), 1000);
    const skip = (pageNum - 1) * take;

    const users = await prisma.user.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take,
      select: {
        id: true, name: true, email: true, role: true, isVerified: true, isActive: true,
        batchYear: true, department: true, currentCompany: true, jobTitle: true,
        totalPoints: true, currentStreak: true, lastActiveDate: true, profileCompleteness: true,
        createdAt: true,
      },
    });
    const total = await prisma.user.count({ where });

    res.json({ users, pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) } });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// =================== PATCH /api/admin/users/:id/verify ===================
router.patch('/users/:id/verify', async (req, res) => {
  try {
    const { verified } = req.body;
    if (typeof verified !== 'boolean') return res.status(400).json({ error: 'verified must be a boolean' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: verified },
      select: { id: true, name: true, email: true, role: true, isVerified: true },
    });

    if (verified && updated.email) {
      setImmediate(async () => {
        try {
          await sendProfileApprovalEmail(updated.email, updated.name);
        } catch (emailErr) {
          console.error('[Admin:Verify] Email delivery error:', emailErr.message || emailErr);
        }
      });
    }

    res.json({ user: updated });
  } catch (err) {
    console.error('PATCH /admin/users/:id/verify error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// =================== POST /api/admin/users/:id/approve-profile ===================
router.post('/users/:id/approve-profile', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!existingUser) {
        throw new Error('User account not found');
      }

      if (existingUser.profileStatus === 'APPROVED' && existingUser.isVerified) {
        return { alreadyApproved: true, user: existingUser };
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          profileStatus: 'APPROVED',
          isVerified: true,
          rejectionReason: null,
        },
      });

      const userWallet = await tx.wallet.upsert({
        where: { userId: updatedUser.id },
        update: { balance: { increment: 50 } },
        create: { userId: updatedUser.id, balance: 50 },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          userId: updatedUser.id,
          amount: 50,
          type: 'CREDIT',
          reason: 'PROFILE_APPROVAL_BONUS',
          description: 'Profile Approval Bonus (+50 pts)',
        },
      });

      let referralCredited = false;
      if (updatedUser.referredByCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: updatedUser.referredByCode },
        });

        if (referrer && referrer.isActive) {
          const referrerWallet = await tx.wallet.upsert({
            where: { userId: referrer.id },
            update: { balance: { increment: 100 } },
            create: { userId: referrer.id, balance: 100 },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              userId: referrer.id,
              amount: 100,
              type: 'CREDIT',
              reason: 'REFERRAL_BONUS',
              description: `Referral Bonus for inviting ${updatedUser.email} (+100 pts)`,
            },
          });
          referralCredited = true;
        }
      }

      return { alreadyApproved: false, user: updatedUser, referralCredited };
    });

    if (result.user.email) {
      setImmediate(async () => {
        try {
          await sendProfileApprovalEmail(result.user.email, result.user.name);
        } catch (emailErr) {
          console.error('[Admin:Approve] Email delivery error:', emailErr.message || emailErr);
        }
      });
    }

    const referralMsg = result.referralCredited ? ' and referrer credited (+100 pts)' : '';
    res.json({
      success: true,
      message: result.alreadyApproved
        ? 'Profile was already approved.'
        : `Profile approved! Member wallet credited (+50 pts)${referralMsg}.`,
      user: result.user,
    });
  } catch (err) {
    console.error('POST /admin/users/:id/approve-profile error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to approve profile' });
  }
});

// =================== POST /api/admin/users/:id/reject-profile ===================
router.post('/users/:id/reject-profile', async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        profileStatus: 'REJECTED',
        rejectionReason: reason || 'Credentials could not be verified with institutional records. Please update your details and resubmit.',
        isVerified: false,
      },
    });

    res.json({
      success: true,
      message: 'Profile rejected and feedback recorded.',
      user: updated,
    });
  } catch (err) {
    console.error('POST /admin/users/:id/reject-profile error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to reject profile' });
  }
});

// =================== PATCH /api/admin/users/:id/role ===================
// Super Admin: Update User Role (ADMIN, ALUMNI, STUDENT, FACULTY)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['STUDENT', 'ALUMNI', 'FACULTY', 'ADMIN'];
    if (!role || !validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role.toUpperCase() },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user: updated, message: `Role updated to ${updated.role}` });
  } catch (err) {
    console.error('PATCH /admin/users/:id/role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// =================== PATCH /api/admin/users/:id/status ===================
// Super Admin: Suspend or Activate user account
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be a boolean' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({ user: updated, message: `Account ${isActive ? 'activated' : 'suspended'}` });
  } catch (err) {
    console.error('PATCH /admin/users/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// =================== DELETE /api/admin/users/:id ===================
// Super Admin: Delete user account & purge storage files
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own super admin account' });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { resumeUrl: true, avatarUrl: true, idCardUrl: true },
    });

    if (userToDelete) {
      if (userToDelete.resumeUrl) await deleteFromStorage('resumes', userToDelete.resumeUrl).catch(() => { });
      if (userToDelete.avatarUrl) await deleteFromStorage('avatars', userToDelete.avatarUrl).catch(() => { });
      if (userToDelete.idCardUrl) await deleteFromStorage('certificates', userToDelete.idCardUrl).catch(() => { });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User account and associated storage purged successfully' });
  } catch (err) {
    console.error('DELETE /admin/users/:id error:', err);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// =================== GET /api/admin/stories ===================
// Story moderation queue
router.get('/stories', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status === 'pending') where.isApproved = false;
    if (status === 'approved') where.isApproved = true;

    const stories = await prisma.successStory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        alumni: {
          select: { id: true, name: true, email: true, currentCompany: true, jobTitle: true, batchYear: true },
        },
      },
    });

    res.json({ stories });
  } catch (err) {
    console.error('GET /admin/stories error:', err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// =================== PATCH /api/admin/stories/:id/status ===================
router.patch('/stories/:id/status', async (req, res) => {
  try {
    const { isApproved, isFeatured } = req.body;
    const data = {};
    if (typeof isApproved === 'boolean') data.isApproved = isApproved;
    if (typeof isFeatured === 'boolean') data.isFeatured = isFeatured;

    const updated = await prisma.successStory.update({
      where: { id: req.params.id },
      data,
      include: { alumni: true },
    });

    if (isApproved === true && updated.alumni && updated.alumni.email) {
      setImmediate(async () => {
        try {
          await sendAchievementApprovalEmail(updated.alumni.email, updated.title);
        } catch (emailErr) {
          console.error('[Admin:Story] Email delivery error:', emailErr.message || emailErr);
        }
      });
    }

    res.json({ story: updated, message: 'Story status updated' });
  } catch (err) {
    console.error('PATCH /admin/stories/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update story status' });
  }
});

// =================== GET /api/admin/jobs ===================
// Job board moderation
router.get('/jobs', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: { select: { id: true, name: true, email: true, currentCompany: true } },
        _count: { select: { referrals: true } },
      },
    });

    res.json({ jobs });
  } catch (err) {
    console.error('GET /admin/jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// =================== PATCH /api/admin/jobs/:id/status ===================
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.jobPosting.update({
      where: { id: req.params.id },
      data: { status: status.toUpperCase() },
    });
    res.json({ job: updated });
  } catch (err) {
    console.error('PATCH /admin/jobs/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// =================== DELETE /api/admin/jobs/:id ===================
router.delete('/jobs/:id', async (req, res) => {
  try {
    await prisma.jobPosting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Job posting deleted' });
  } catch (err) {
    console.error('DELETE /admin/jobs/:id error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// =================== POST /api/admin/broadcast ===================
// Super Admin Broadcasts / Announcements with priority
router.post('/broadcast', async (req, res) => {
  try {
    const { title, content, targetRole = 'ALL', priority = 'NORMAL', isPinned = false } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: req.user.id,
        isPinned: Boolean(isPinned),
        targetRole: targetRole.toUpperCase(),
        priority: priority.toUpperCase(),
      },
    });

    // Notify users
    const where = {};
    if (targetRole !== 'ALL') where.role = targetRole.toUpperCase();
    const usersToNotify = await prisma.user.findMany({ where, select: { id: true } });

    if (usersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: usersToNotify.map((u) => ({
          userId: u.id,
          type: 'ANNOUNCEMENT_NEW',
          title: `Announcement: ${title}`,
          message: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
          link: '/announcements',
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({ announcement, notifiedCount: usersToNotify.length });
  } catch (err) {
    console.error('POST /admin/broadcast error:', err);
    res.status(500).json({ error: 'Failed to dispatch broadcast' });
  }
});

// =================== GET /api/admin/stale-profiles ===================
// Intelligent Network Health: Outdated profiles
router.get('/stale-profiles', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const staleUsers = await prisma.user.findMany({
      where: {
        role: 'ALUMNI',
        OR: [
          { lastJobUpdate: { lt: sixMonthsAgo } },
          { lastJobUpdate: null },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        currentCompany: true,
        jobTitle: true,
        lastJobUpdate: true,
        lastActiveDate: true,
        profileCompleteness: true,
      },
      take: 50,
      orderBy: { lastJobUpdate: 'asc' },
    });

    res.json({ count: staleUsers.length, users: staleUsers });
  } catch (err) {
    console.error('GET /admin/stale-profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch stale profiles' });
  }
});

// =================== POST /api/admin/nudge-user/:id ===================
router.post('/nudge-user/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PROFILE_UPDATE_REMINDER',
        title: 'Career Profile Check-in',
        message: 'Your alumni network wants to stay connected. Please confirm your current role or update your career details to earn +30 points!',
        link: '/profile',
      },
    });

    res.json({ message: `Re-engagement reminder sent to ${user.name}` });
  } catch (err) {
    console.error('POST /admin/nudge-user error:', err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// =================== GET /api/admin/export/:type ===================
// Export platform data as CSV
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let headers = [];

    if (type === 'users') {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isVerified: true, department: true, batchYear: true, currentCompany: true, jobTitle: true, totalPoints: true, createdAt: true },
      });
      headers = ['ID', 'Name', 'Email', 'Role', 'Verified', 'Department', 'Batch Year', 'Company', 'Job Title', 'Points', 'Joined Date'];
      data = users.map(u => [u.id, u.name, u.email, u.role, u.isVerified, u.department || '', u.batchYear || '', u.currentCompany || '', u.jobTitle || '', u.totalPoints || 0, u.createdAt.toISOString()]);
    } else if (type === 'jobs') {
      const jobs = await prisma.jobPosting.findMany({
        include: { postedBy: { select: { name: true, email: true } } },
      });
      headers = ['ID', 'Title', 'Company', 'Location', 'Type', 'Status', 'Posted By', 'Posted Date'];
      data = jobs.map(j => [j.id, j.title, j.company, j.location, j.type, j.status, j.postedBy?.name || '', j.createdAt.toISOString()]);
    } else {
      return res.status(400).json({ error: 'Invalid export type. Supported: users, jobs' });
    }

    const csvContent = [headers.join(','), ...data.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=pro-alumn-${type}-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('GET /admin/export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// =================== POST /api/admin/import-csv ===================
// Bulk import alumni from CSV
router.post('/import-csv', csvImportLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: file)' });
    if (req.file.mimetype !== 'text/csv' && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    const records = await new Promise((resolve, reject) => {
      parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true },
        (err, recs) => (err ? reject(err) : resolve(recs)));
    });

    const imported = [];
    const importedForEmail = [];
    const skipped = [];
    const failed = [];
    let index = 0;

    for (const row of records) {
      index += 1;
      const name = row.name || row.Name;
      const emailAddress = (row.email || row.Email || '').toLowerCase().trim();

      if (!name || !emailAddress) { failed.push({ row: index, reason: 'missing name/email' }); continue; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) { failed.push({ row: index, email: emailAddress, reason: 'invalid email format' }); continue; }

      const existing = await prisma.user.findUnique({
        where: { email: emailAddress },
        select: { id: true }
      });
      if (existing) { skipped.push({ row: index, email: emailAddress, reason: 'email already registered' }); continue; }

      const tempPassword = crypto.randomBytes(12).toString('base64url');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: emailAddress,
          passwordHash,
          role: 'ALUMNI',
          isVerified: false,
          batchYear: row.batchYear || row.batch ? parseInt(row.batchYear || row.batch) : null,
          department: row.department || row.dept || null,
          rollNumber: row.rollNumber || null,
          currentCompany: row.currentCompany || row.company || null,
          jobTitle: row.jobTitle || row.role2 || null,
          location: row.location || null,
          phone: row.phone || null,
          linkedinUrl: row.linkedinUrl || row.linkedin || null,
        },
        select: { id: true }
      });
      imported.push({ name: String(name).trim(), email: emailAddress });
      importedForEmail.push({ name: String(name).trim(), email: emailAddress, tempPassword });
    }

    if (importedForEmail.length > 0) {
      console.log(`📧 Enqueued ${importedForEmail.length} welcome email(s) for async background dispatch`);
      setImmediate(async () => {
        try {
          await Promise.all(importedForEmail.map((u) => email.sendWelcomeEmail({ to: u.email, name: u.name, tempPassword: u.tempPassword })));
        } catch (batchErr) {
          console.error('[Admin:CSVImport] Welcome email batch error:', batchErr.message || batchErr);
        }
      });
    }

    res.status(201).json({
      summary: {
        total: records.length,
        imported: imported.length,
        skipped: skipped.length,
        failed: failed.length,
      },
      imported, skipped, failed,
    });
  } catch (err) {
    console.error('POST /admin/import-csv error:', err);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// =================== CENTRALIZED APPROVALS DASHBOARD ===================
// GET /api/admin/approvals - Single unified queue for Stories, Jobs, Mentorships, Unverified Alumni, and Videos
router.get('/approvals', async (req, res) => {
  try {
    const pendingStories = await prisma.successStory.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'desc' },
      include: {
        alumni: {
          select: { id: true, name: true, email: true, currentCompany: true, jobTitle: true, batchYear: true, avatarUrl: true },
        },
      },
    });

    const pendingJobs = await prisma.jobPosting.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        postedBy: { select: { id: true, name: true, email: true, currentCompany: true, avatarUrl: true } },
      },
    });

    const pendingMentorships = await prisma.mentorship.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
        mentor: { select: { id: true, name: true, email: true, currentCompany: true, jobTitle: true, avatarUrl: true } },
      },
    });

    const unverifiedAlumni = await prisma.user.findMany({
      where: { role: 'ALUMNI', isVerified: false },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        profileStatus: true,
        batchYear: true,
        department: true,
        currentCompany: true,
        jobTitle: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const pendingVideos = await prisma.video.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true, currentCompany: true },
        },
      },
    });

    const totalPending =
      pendingStories.length +
      pendingMentorships.length +
      unverifiedAlumni.length +
      pendingVideos.length;

    res.json({
      summary: {
        totalPending,
        storiesCount: pendingStories.length,
        jobsCount: pendingJobs.length,
        mentorshipsCount: pendingMentorships.length,
        unverifiedCount: unverifiedAlumni.length,
        videosCount: pendingVideos.length,
      },
      pendingStories,
      pendingJobs,
      pendingMentorships,
      unverifiedAlumni,
      pendingVideos,
    });
  } catch (err) {
    console.error('GET /admin/approvals error:', err);
    res.status(500).json({ error: 'Failed to fetch centralized approvals queue' });
  }
});

// =================== VIDEO MARKETPLACE MODERATION ===================
// GET /api/admin/videos - List videos for moderation
router.get('/videos', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true, currentCompany: true },
        },
      },
    });

    res.json({ videos });
  } catch (err) {
    console.error('GET /admin/videos error:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// PATCH /api/admin/videos/:id/status
router.patch('/videos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'PUBLISHED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ video, message: `Video status updated to ${status}` });
  } catch (err) {
    console.error('PATCH /admin/videos/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update video status' });
  }
});

// =================== CMS: EVENTS MANAGEMENT ===================
// POST /api/admin/events
router.post('/events', async (req, res) => {
  try {
    const { title, description, date, location, mode, coverImage, maxCapacity } = req.body;
    if (!title || !description || !date) {
      return res.status(400).json({ error: 'title, description, and date are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        mode: mode || 'ONLINE',
        coverImage,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { rsvps: true } },
      },
    });

    res.status(201).json({ event, message: 'Event published successfully' });
  } catch (err) {
    console.error('POST /admin/events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/admin/events/:id
router.put('/events/:id', async (req, res) => {
  try {
    const { title, description, date, location, mode, coverImage, maxCapacity } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (date !== undefined) data.date = new Date(date);
    if (location !== undefined) data.location = location;
    if (mode !== undefined) data.mode = mode;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (maxCapacity !== undefined) data.maxCapacity = maxCapacity ? parseInt(maxCapacity) : null;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { rsvps: true } },
      },
    });

    res.json({ event, message: 'Event updated successfully' });
  } catch (err) {
    console.error('PUT /admin/events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('DELETE /admin/events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// =================== CMS: NEWSLETTERS MANAGEMENT ===================
// POST /api/admin/newsletters
router.post('/newsletters', async (req, res) => {
  try {
    const { title, issueDate, year, coverImage, fileUrl } = req.body;
    if (!title || !fileUrl) {
      return res.status(400).json({ error: 'title and fileUrl are required' });
    }

    const d = issueDate ? new Date(issueDate) : new Date();
    const yr = year ? parseInt(year) : d.getFullYear();

    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        issueDate: d,
        year: yr,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileUrl,
      },
    });

    res.status(201).json({ newsletter, message: 'Newsletter published successfully' });
  } catch (err) {
    console.error('POST /admin/newsletters error:', err);
    res.status(500).json({ error: 'Failed to publish newsletter' });
  }
});

// PUT /api/admin/newsletters/:id
router.put('/newsletters/:id', async (req, res) => {
  try {
    const { title, issueDate, year, coverImage, fileUrl } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (issueDate !== undefined) data.issueDate = new Date(issueDate);
    if (year !== undefined) data.year = parseInt(year);
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;

    const newsletter = await prisma.newsletter.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ newsletter, message: 'Newsletter updated successfully' });
  } catch (err) {
    console.error('PUT /admin/newsletters/:id error:', err);
    res.status(500).json({ error: 'Failed to update newsletter' });
  }
});

// DELETE /api/admin/newsletters/:id
router.delete('/newsletters/:id', async (req, res) => {
  try {
    await prisma.newsletter.delete({ where: { id: req.params.id } });
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (err) {
    console.error('DELETE /admin/newsletters/:id error:', err);
    res.status(500).json({ error: 'Failed to delete newsletter' });
  }
});

// =================== CMS: SITE PAGES / PAGE BUILDER ===================
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'register',
  'home',
  'directory',
  'jobs',
  'referrals',
  'stories',
  'announcements',
  'chat',
  'events',
  'mentorship',
  'education',
  'docs',
  'keep',
  'communications',
  'forms',
  'calendar',
  'profile',
  'rewards',
  'settings',
  'newsletter',
  'newsletters',
  'matching',
  'help',
  'dashboard',
  'requests',
]);

function formatSlug(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/admin/pages - List all custom pages (all statuses)
router.get('/pages', async (req, res) => {
  try {
    const pages = await prisma.sitePage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ pages });
  } catch (err) {
    console.error('GET /admin/pages error:', err);
    res.status(500).json({ error: 'Failed to fetch custom pages' });
  }
});

// POST /api/admin/pages - Create new custom page
router.post('/pages', async (req, res) => {
  try {
    const { title, slug, description, heroTitle, heroSubtitle, blocks = [], status = 'DRAFT' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Page title is required' });
    }

    const cleanSlug = formatSlug(slug || title);
    if (!cleanSlug) {
      return res.status(400).json({ error: 'Valid URL slug is required' });
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      return res.status(400).json({
        error: `The slug "${cleanSlug}" is a reserved system path and cannot be overwritten. Please choose a different slug (e.g. "${cleanSlug}-page").`,
      });
    }

    const existing = await prisma.sitePage.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ error: `A page with slug "${cleanSlug}" already exists.` });
    }

    const pageStatus = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())
      ? status.toUpperCase()
      : 'DRAFT';

    const newPage = await prisma.sitePage.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        description: description ? description.trim() : null,
        heroTitle: heroTitle ? heroTitle.trim() : null,
        heroSubtitle: heroSubtitle ? heroSubtitle.trim() : null,
        blocks: Array.isArray(blocks) ? blocks : [],
        status: pageStatus,
        authorId: req.user.id,
        publishedAt: pageStatus === 'PUBLISHED' ? new Date() : null,
      },
    });

    res.status(201).json({ page: newPage, message: `Page "${newPage.title}" created successfully!` });
  } catch (err) {
    console.error('POST /admin/pages error:', err);
    res.status(500).json({ error: 'Failed to create custom page' });
  }
});

// PUT /api/admin/pages/:id - Update existing custom page
router.put('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, heroTitle, heroSubtitle, blocks, status } = req.body;

    const page = await prisma.sitePage.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (heroTitle !== undefined) data.heroTitle = heroTitle ? heroTitle.trim() : null;
    if (heroSubtitle !== undefined) data.heroSubtitle = heroSubtitle ? heroSubtitle.trim() : null;
    if (blocks !== undefined) data.blocks = Array.isArray(blocks) ? blocks : [];

    if (slug !== undefined) {
      const cleanSlug = formatSlug(slug);
      if (!cleanSlug) {
        return res.status(400).json({ error: 'Slug cannot be empty' });
      }
      if (RESERVED_SLUGS.has(cleanSlug)) {
        return res.status(400).json({
          error: `The slug "${cleanSlug}" is reserved and cannot be used.`,
        });
      }
      if (cleanSlug !== page.slug) {
        const existing = await prisma.sitePage.findUnique({ where: { slug: cleanSlug } });
        if (existing) {
          return res.status(400).json({ error: `A page with slug "${cleanSlug}" already exists.` });
        }
        data.slug = cleanSlug;
      }
    }

    if (status !== undefined) {
      const pageStatus = ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())
        ? status.toUpperCase()
        : 'DRAFT';
      data.status = pageStatus;
      if (pageStatus === 'PUBLISHED' && !page.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await prisma.sitePage.update({
      where: { id },
      data,
    });

    res.json({ page: updated, message: 'Page updated successfully' });
  } catch (err) {
    console.error('PUT /admin/pages/:id error:', err);
    res.status(500).json({ error: 'Failed to update custom page' });
  }
});

// DELETE /api/admin/pages/:id - Delete custom page
router.delete('/pages/:id', async (req, res) => {
  try {
    await prisma.sitePage.delete({ where: { id: req.params.id } });
    res.json({ message: 'Page deleted successfully' });
  } catch (err) {
    console.error('DELETE /admin/pages/:id error:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

module.exports = router;

