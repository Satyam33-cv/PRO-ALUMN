const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate: authMiddleware, requireRole } = require('../middleware/auth');
const { sendSupportTicketConfirmation, sendAdminTicketNotification } = require('../utils/email');

// =================== POST /api/support ===================
// Submit a new support ticket
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        category,
        subject,
        message,
        status: 'OPEN',
      },
      include: {
        user: { select: { email: true, name: true, role: true } },
      },
    });

    // Send confirmation email to User
    if (ticket.user && ticket.user.email) {
      await sendSupportTicketConfirmation(ticket.user.email, ticket.id, ticket.subject);
    }
    
    // Send notification email to Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'proalumn@yahoo.com';
    if (adminEmail) {
      await sendAdminTicketNotification(adminEmail, ticket);
    }

    res.status(201).json({ ticket, message: 'Support ticket submitted successfully' });
  } catch (err) {
    console.error('POST /support error:', err);
    res.status(500).json({ error: 'Failed to submit support ticket', details: err.message, stack: err.stack });
  }
});

// =================== GET /api/support ===================
// Get user's own tickets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tickets });
  } catch (err) {
    console.error('GET /support error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
  }
});

// =================== GET /api/support/admin/all ===================
// Get all tickets across platform (Admin only)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { status, category } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tickets });
  } catch (err) {
    console.error('GET /support/admin/all error:', err);
    res.status(500).json({ error: 'Failed to fetch all tickets', details: err.message });
  }
});

// =================== PATCH /api/support/:id/status ===================
// Update support ticket status (Admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { status } = req.body;
    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ ticket, message: `Ticket status updated to ${status}` });
  } catch (err) {
    console.error('PATCH /support/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update ticket status', details: err.message });
  }
});

module.exports = router;
