// backend/src/routes/pages.js
// Public endpoints for CMS-created custom site pages
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { optionalAuthenticate } = require('../middleware/auth');

// GET /api/pages - List all published site pages
router.get('/', async (req, res) => {
  try {
    const pages = await prisma.sitePage.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        heroTitle: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ pages });
  } catch (err) {
    console.error('GET /api/pages error:', err);
    res.status(500).json({ error: 'Failed to fetch custom pages' });
  }
});

// GET /api/pages/:slug - Get a page by slug (public if published, or requires admin for drafts)
router.get('/:slug', optionalAuthenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await prisma.sitePage.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // If page is draft or archived, only allow if user is authenticated admin
    if (page.status !== 'PUBLISHED') {
      const isAdmin = req.user && req.user.role === 'ADMIN';
      if (!isAdmin) {
        return res.status(404).json({ error: 'Page is in draft mode and not publicly available' });
      }
    }

    res.json({ page });
  } catch (err) {
    console.error('GET /api/pages/:slug error:', err);
    res.status(500).json({ error: 'Failed to retrieve page content' });
  }
});

module.exports = router;
