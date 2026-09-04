// apps/api/src/routes/events.js
// Events: create, list, detail, RSVP workflow
const express = require('express');
const { Prisma } = require('@prisma/client');
const router = express.Router();
const prisma = require('../db');
const { authenticate, optionalAuthenticate, requireRole } = require('../middleware/auth');
const { notify } = require('../services/notify');

const CREATOR_ROLES = ['ADMIN', 'ALUMNI', 'FACULTY'];
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

// =================== POST /api/events ===================
// Admin / Alumni / Faculty can create an event
router.post('/', authenticate, requireRole(...CREATOR_ROLES), async (req, res) => {
  try {
    const { title, description, date, location, mode, coverImage, maxCapacity } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ error: 'title, description, date are required' });
    }

    const event = await prisma.event.create({
      data: {
        title, description,
        date: new Date(date),
        location, mode: mode || 'ONLINE', coverImage,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { rsvps: true } },
      },
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// =================== GET /api/events ===================
// List events (optionally upcoming only)
router.get('/', async (req, res) => {
  try {
    const { upcoming, page = 1, limit = 20 } = req.query;
    const where = {};
    if (upcoming === 'true') where.date = { gte: new Date() };

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * take;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        skip, take,
        include: {
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { rsvps: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
      pagination: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// =================== GET /api/events/:id ===================
// Detail + attendee list + whether current user RSVP'd
router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true, currentCompany: true, jobTitle: true } },
        rsvps: {
          orderBy: { createdAt: 'asc' },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true,
                batchYear: true,
                department: true,
                currentCompany: true,
                jobTitle: true,
              },
            },
          },
        },
        _count: { select: { rsvps: true } },
      },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const hasRsvp = req.user ? event.rsvps.some(r => r.userId === req.user.id) : false;
    res.json({ event: { ...event, hasRsvp } });
  } catch (err) {
    console.error('GET /events/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// =================== POST /api/events/:id/rsvp ===================
router.post('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ error: 'This event has already passed' });
    }

    const attendeeLabel = req.user.name || (req.user.role === 'ALUMNI' ? 'An alumnus' : req.user.role === 'FACULTY' ? 'A faculty member' : 'A student');

    if (event.maxCapacity) {
      try {
        const rsvp = await withRetry(() => prisma.$transaction(async (tx) => {
          const count = await tx.eventRSVP.count({ where: { eventId: event.id } });
          if (count >= event.maxCapacity) {
            throw new Error('EVENT_FULL');
          }
          return tx.eventRSVP.create({
            data: { eventId: event.id, userId: req.user.id },
            include: { event: { select: { id: true, title: true, date: true } } },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));

        if (event.createdById !== req.user.id) {
          await notify({
            userId: event.createdById,
            type: 'GENERAL',
            title: '📅 New RSVP',
            message: `${attendeeLabel} RSVP'd to "${event.title}"`,
            link: `/events/${event.id}`,
          });
        }

        return res.status(201).json({ rsvp, attending: true, message: 'RSVP confirmed' });
      } catch (err) {
        if (err.message === 'EVENT_FULL') {
          return res.status(400).json({ error: 'Event is full' });
        }
        if (err.code === 'P2002') {
          return res.status(409).json({ error: 'You already RSVP\'d to this event' });
        }
        throw err;
      }
    }

    try {
      const rsvp = await prisma.eventRSVP.create({
        data: { eventId: event.id, userId: req.user.id },
        include: { event: { select: { id: true, title: true, date: true } } },
      });

      // Notify the organizer (in-app)
      if (event.createdById !== req.user.id) {
        await notify({
          userId: event.createdById,
          type: 'GENERAL',
          title: '📅 New RSVP',
          message: `${attendeeLabel} RSVP'd to "${event.title}"`,
          link: `/events/${event.id}`,
        });
      }

      res.status(201).json({ rsvp, attending: true, message: 'RSVP confirmed' });
    } catch (err) {
      // P2002 = unique constraint violation (already RSVP'd)
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'You already RSVP\'d to this event' });
      }
      throw err;
    }
  } catch (err) {
    console.error('POST /events/:id/rsvp error:', err);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// =================== DELETE /api/events/:id/rsvp ===================
router.delete('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const result = await prisma.eventRSVP.deleteMany({
      where: { eventId: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ error: 'RSVP not found' });
    res.json({ attending: false, message: 'RSVP cancelled' });
  } catch (err) {
    console.error('DELETE /events/:id/rsvp error:', err);
    res.status(500).json({ error: 'Failed to cancel RSVP' });
  }
});

// =================== PATCH /api/events/:id ===================
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }

    const allowed = ['title', 'description', 'date', 'location', 'mode', 'coverImage', 'maxCapacity'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.date) data.date = new Date(data.date);
    if (data.maxCapacity !== undefined && data.maxCapacity !== null) data.maxCapacity = parseInt(data.maxCapacity);

    const updated = await prisma.event.update({ where: { id: req.params.id }, data });
    res.json({ event: updated });
  } catch (err) {
    console.error('PATCH /events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// =================== DELETE /api/events/:id ===================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('DELETE /events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
