// apps/api/src/routes/matching.js
// AI Smart Matching — pgvector "Top 5 Alumni for You"
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateEmbedding, profileText } = require('../services/embeddings');

function toVectorLiteral(arr) {
  return `[${arr.map((n) => (Number.isInteger(n) ? n : n.toFixed(6))).join(',')}]`;
}

const PROFILE_SELECT = {
  id: true, name: true, avatarUrl: true, role: true, batchYear: true, department: true,
  currentCompany: true, jobTitle: true, location: true, bio: true, skills: true,
  interests: true, isVerified: true,
};

// Fetch a user's profile + text to embed
async function getUserContext(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, role: true, department: true, batchYear: true,
      currentCompany: true, jobTitle: true, location: true, bio: true,
      skills: true, interests: true, isVerified: true,
    },
  });
  return user;
}

// =================== GET /api/matching/top-alumni ===================
// Student-facing: top 5 alumni by cosine similarity to the student's profile
router.get('/top-alumni', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await getUserContext(req.user.id);
    if (!student) return res.status(404).json({ error: 'User not found' });

    const embedding = await generateEmbedding(profileText(student));
    const vec = toVectorLiteral(embedding);
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, name, "avatarUrl", "batchYear", department, "currentCompany", "jobTitle",
              location, bio, skills, interests, "isVerified",
              1 - (embedding <=> $1::vector) AS score
       FROM "User"
       WHERE role = 'ALUMNI' AND "isActive" = true AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vec, limit,
    );

    const alumni = rows.map((r) => ({
      id: r.id, name: r.name, avatarUrl: r.avatarUrl, batchYear: r.batchYear,
      department: r.department, currentCompany: r.currentCompany, jobTitle: r.jobTitle,
      location: r.location, bio: r.bio, skills: r.skills, interests: r.interests,
      isVerified: r.isVerified,
      matchScore: Math.max(0, Math.round((r.score ?? 0) * 100)), // similarity → percentage
    }));

    res.json({ student: { id: student.id, name: student.name }, alumni });
  } catch (err) {
    console.error('GET /matching/top-alumni error:', err);
    res.status(500).json({ error: 'Failed to compute matches' });
  }
});

// =================== POST /api/matching/sync ===================
// Admin: (re)embed all users so matching has fresh vectors
router.post('/sync', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, role: true, department: true, batchYear: true,
        currentCompany: true, jobTitle: true, location: true, bio: true,
        skills: true, interests: true,
      },
    });

    let updated = 0;
    let skipped = 0;
    for (const user of users) {
      const text = profileText(user);
      if (!text.replace(/[^a-z]/gi, '')) { skipped += 1; continue; }
      const vec = await generateEmbedding(text);
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET embedding = $1::vector WHERE id = $2`,
        toVectorLiteral(vec), user.id,
      );
      updated += 1;
    }

    res.json({ message: 'Embedding sync complete', total: users.length, updated, skipped });
  } catch (err) {
    console.error('POST /matching/sync error:', err);
    res.status(500).json({ error: 'Failed to sync embeddings' });
  }
});

// =================== POST /api/matching/sync-me ===================
// Any user: (re)embed just themselves (called after profile edits)
router.post('/sync-me', authenticate, async (req, res) => {
  try {
    const user = await getUserContext(req.user.id);
    const text = profileText(user);
    if (!text.replace(/[^a-z]/gi, '')) {
      return res.status(400).json({ error: 'Profile is too empty to embed — add bio, skills or interests' });
    }
    const vec = await generateEmbedding(text);
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET embedding = $1::vector WHERE id = $2`,
      toVectorLiteral(vec), req.user.id,
    );
    res.json({ message: 'Your profile embedding is up to date' });
  } catch (err) {
    console.error('POST /matching/sync-me error:', err);
    res.status(500).json({ error: 'Failed to embed profile' });
  }
});

module.exports = router;
