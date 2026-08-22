const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// =================== GET /api/chat ===================
// List all chat threads for the user
router.get('/', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.chatThreadMember.findMany({
      where: { userId: req.user.id },
      include: {
        thread: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, role: true, avatarUrl: true } }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { thread: { updatedAt: 'desc' } }
    });

    const threads = memberships.map(m => {
      const otherMembers = m.thread.members.filter(member => member.userId !== req.user.id).map(member => member.user);
      return {
        id: m.thread.id,
        name: m.thread.name || (otherMembers[0] ? otherMembers[0].name : 'Unknown'),
        isGroup: m.thread.isGroup,
        participants: otherMembers,
        lastMessage: m.thread.messages[0] ? m.thread.messages[0].text : null,
        lastMessageAt: m.thread.messages[0] ? m.thread.messages[0].createdAt : m.thread.createdAt,
        unread: 0, // Mocked for now
      };
    });

    res.json({ threads });
  } catch (err) {
    console.error('GET /chat error:', err);
    res.status(500).json({ error: 'Failed to fetch chat threads' });
  }
});

// =================== GET /api/chat/:threadId ===================
// Get messages for a specific thread
router.get('/:threadId', authenticate, async (req, res) => {
  try {
    // verify membership
    const membership = await prisma.chatThreadMember.findUnique({
      where: {
        threadId_userId: { threadId: req.params.threadId, userId: req.user.id }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Unauthorized to view this thread' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { threadId: req.params.threadId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (err) {
    console.error('GET /chat/:threadId error:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// =================== POST /api/chat/:threadId ===================
// Send a message in a thread
router.post('/:threadId', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message text is required' });

    // verify membership
    const membership = await prisma.chatThreadMember.findUnique({
      where: {
        threadId_userId: { threadId: req.params.threadId, userId: req.user.id }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Unauthorized to send message in this thread' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId: req.params.threadId,
        senderId: req.user.id,
        text
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // Update thread updatedAt
    await prisma.chatThread.update({
      where: { id: req.params.threadId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error('POST /chat/:threadId error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// =================== POST /api/chat ===================
// Create a new 1:1 chat thread (or return existing)
router.post('/', authenticate, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot start a chat with yourself' });
    }

    // Check if 1:1 thread already exists
    const existingThreads = await prisma.chatThread.findMany({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [req.user.id, targetUserId] }
          }
        }
      },
      include: {
        members: true
      }
    });

    // Filter strictly for 2-member threads matching these two users
    const existing = existingThreads.find(t => t.members.length === 2);

    if (existing) {
      return res.json({ thread: existing });
    }

    // Create new thread
    const newThread = await prisma.chatThread.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: req.user.id },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } }
          }
        }
      }
    });

    res.status(201).json({ thread: newThread });
  } catch (err) {
    console.error('POST /chat error:', err);
    res.status(500).json({ error: 'Failed to create chat thread' });
  }
});

module.exports = router;
