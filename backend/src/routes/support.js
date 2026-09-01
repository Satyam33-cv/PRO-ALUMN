const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendSupportTicketConfirmation } = require('../utils/email');

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
        user: { select: { email: true, name: true } },
      },
    });

    // Send confirmation email to User
    if (ticket.user && ticket.user.email) {
      await sendSupportTicketConfirmation(ticket.user.email, ticket.id, ticket.subject);
    }
    
    // Send notification email to Admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_API_KEY ? 'onboarding@resend.dev' : null;
    if (adminEmail) {
      const { sendAdminTicketNotification } = require('../utils/email');
      await sendAdminTicketNotification(adminEmail, ticket);
    }

    res.status(201).json({ ticket, message: 'Support ticket submitted successfully' });
  } catch (err) {
    console.error('POST /support error:', err);
    res.status(500).json({ error: 'Failed to submit support ticket' });
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
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

module.exports = router;
