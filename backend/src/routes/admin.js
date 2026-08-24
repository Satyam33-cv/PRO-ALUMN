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

    const [userCount, jobCount, storyCount, referralCount, mentorshipCount, eventCount, newsletterCount, logCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.jobPosting.count(),
        prisma.successStory.count(),
        prisma.referralRequest.count(),
        prisma.mentorshipRequest.count(),
        prisma.event.count(),
        prisma.newsletter.count().catch(() => 0),
        prisma.activityLog.count().catch(() => 0),
      ]);

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
    const [users, byRole, jobs, openJobs, referrals, referralsByStatus, storiesApproved, storiesPending, events, upcomingEvents, announcements] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
        prisma.jobPosting.count(),
        prisma.jobPosting.count({ where: { status: 'OPEN' } }),
        prisma.referralRequest.count(),
        prisma.referralRequest.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.successStory.count({ where: { isApproved: true } }),
        prisma.successStory.count({ where: { isApproved: false } }),
        prisma.event.count(),
        prisma.event.count({ where: { date: { gte: new Date() } } }),
        prisma.announcement.count(),
      ]);

    const [recentUsers, recentReferrals] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true, currentCompany: true, jobTitle: true },
      }),
      prisma.referralRequest.findMany({
        orderBy: { createdAt: 'desc' }, take: 6,
        select: {
          id: true, status: true, createdAt: true,
          job: { select: { title: true, company: true } },
          requestedBy: { select: { name: true } },
        },
      }),
    ]);

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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        select: {
          id: true, name: true, email: true, role: true, isVerified: true, isActive: true,
          batchYear: true, department: true, currentCompany: true, jobTitle: true,
          totalPoints: true, currentStreak: true, lastActiveDate: true, profileCompleteness: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

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

    res.json({ user: updated });
  } catch (err) {
    console.error('PATCH /admin/users/:id/verify error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
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
// Super Admin: Delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own super admin account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User account deleted successfully' });
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
    });

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
        _count: { select: { applications: true, referralRequests: true } },
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
      console.log(`📧 Sending ${importedForEmail.length} welcome email(s)`);
      await Promise.all(importedForEmail.map((u) => email.sendWelcomeEmail({ to: u.email, name: u.name, tempPassword: u.tempPassword })).catch(() => {}));
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

module.exports = router;
