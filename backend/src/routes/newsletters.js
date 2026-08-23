// backend/src/routes/newsletters.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const SAMPLE_NEWSLETTERS = [
  {
    title: 'Somaiya Sparsh - December 2024 Special Edition',
    issueDate: new Date('2024-12-15'),
    year: 2024,
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - September 2024 Quarterly',
    issueDate: new Date('2024-09-10'),
    year: 2024,
    coverImage: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - May 2024 Alumni Homecoming',
    issueDate: new Date('2024-05-20'),
    year: 2024,
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - Annual Retrospective 2023',
    issueDate: new Date('2023-12-20'),
    year: 2023,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - July 2023 Innovations Issue',
    issueDate: new Date('2023-07-15'),
    year: 2023,
    coverImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - Spring 2022 Milestone Edition',
    issueDate: new Date('2022-04-10'),
    year: 2022,
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd8?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Somaiya Sparsh - October 2021 Global Alumni Chapter',
    issueDate: new Date('2021-10-05'),
    year: 2021,
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];

async function seedSampleNewslettersIfEmpty() {
  try {
    const count = await prisma.newsletter.count();
    if (count === 0) {
      for (const item of SAMPLE_NEWSLETTERS) {
        await prisma.newsletter.create({ data: item });
      }
    }
  } catch (err) {
    console.error('Error seeding newsletters:', err.message);
  }
}

// =================== GET /api/newsletters ===================
router.get('/', async (req, res) => {
  try {
    await seedSampleNewslettersIfEmpty();

    const { year, search } = req.query;
    const where = {};

    if (year && year !== 'all') {
      where.year = parseInt(year);
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const newsletters = await prisma.newsletter.findMany({
      where,
      orderBy: [{ issueDate: 'desc' }, { year: 'desc' }],
    });

    // Get list of distinct available years
    const allYears = await prisma.newsletter.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    res.json({
      newsletters,
      years: allYears.map((y) => y.year),
    });
  } catch (err) {
    console.error('GET /newsletters error:', err);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

// =================== POST /api/newsletters ===================
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { title, issueDate, year, coverImage, fileUrl } = req.body;
    if (!title || !fileUrl) {
      return res.status(400).json({ error: 'Title and fileUrl are required' });
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        year: year ? parseInt(year) : new Date().getFullYear(),
        coverImage: coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileUrl,
      },
    });

    res.status(201).json({ newsletter });
  } catch (err) {
    console.error('POST /newsletters error:', err);
    res.status(500).json({ error: 'Failed to create newsletter' });
  }
});

// =================== DELETE /api/newsletters/:id ===================
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.newsletter.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (err) {
    console.error('DELETE /newsletters/:id error:', err);
    res.status(500).json({ error: 'Failed to delete newsletter' });
  }
});

module.exports = router;
