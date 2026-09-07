// apps/api/src/routes/matching.js
// AI Smart Matching — pgvector "Top 5 Alumni for You"
// Scoring per docs/specs/ai-matching.md: 60% cosine similarity, 15% same
// department, 15% target-company overlap, 10% shared skills. Base cosine
// similarity must clear MIN_SIMILARITY or the pool is empty — never force
// a top-5 with no real signal.
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateEmbedding, profileText } = require('../services/embeddings');

const WEIGHTS = { similarity: 0.60, department: 0.15, company: 0.15, skills: 0.10 };
const MIN_SIMILARITY = 0.30;
const CANDIDATE_POOL_SIZE = 50; // widen past `limit` so re-ranking has room to work with

function toVectorLiteral(arr) {
  return `[${arr.map((n) => (Number.isInteger(n) ? n : n.toFixed(6))).join(',')}]`;
}

function splitList(str) {
  return (str || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Fetch a user's profile + text to embed
async function getUserContext(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, role: true, department: true, batchYear: true,
      currentCompany: true, jobTitle: true, location: true, bio: true,
      skills: true, interests: true, targetCompanies: true, isVerified: true,
    },
  });
  return user;
}

// Score one candidate against the student. Returns { composite (0-100), reasons[], sharedSkills[] }.
function scoreCandidate(student, candidate, cosineSim) {
  const reasons = [];

  const sameDept = Boolean(
    student.department && candidate.department &&
    student.department.trim().toLowerCase() === candidate.department.trim().toLowerCase()
  );
  if (sameDept) reasons.push(`Same department (${candidate.department})`);

  const targetCompanies = splitList(student.targetCompanies);
  const candidateCompany = (candidate.currentCompany || '').trim().toLowerCase();
  const companyMatch = Boolean(candidateCompany && targetCompanies.includes(candidateCompany));
  if (companyMatch) reasons.push(`Works at ${candidate.currentCompany}`);

  const studentSkills = new Set(splitList(student.skills));
  const candidateSkills = splitList(candidate.skills);
  const sharedSkills = candidateSkills.filter((s) => studentSkills.has(s));
  // Cap the skill component's contribution at 3 shared skills so one very
  // skill-heavy profile can't dominate the score on this axis alone.
  const skillScore = Math.min(sharedSkills.length, 3) / 3;
  if (sharedSkills.length > 0) {
    reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length === 1 ? '' : 's'}`);
  }

  if (candidate.isVerified) reasons.push('Verified alumnus');

  const composite =
    cosineSim * WEIGHTS.similarity +
    (sameDept ? WEIGHTS.department : 0) +
    (companyMatch ? WEIGHTS.company : 0) +
    skillScore * WEIGHTS.skills;

  return {
    matchScore: Math.max(0, Math.min(100, Math.round(composite * 100))),
    reasons,
    sharedSkills: candidateSkills.filter((s) => studentSkills.has(s)),
  };
}

// =================== GET /api/matching/top-alumni ===================
// Student-facing: top 5 alumni by composite score against the student's profile.
// Query params: department, company (both narrow the eligible pool, they never
// re-rank it), minScore (override MIN_SIMILARITY).
router.get('/top-alumni', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await getUserContext(req.user.id);
    if (!student) return res.status(404).json({ error: 'User not found' });

    const embedding = await generateEmbedding(profileText(student));
    const vec = toVectorLiteral(embedding);
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const minSimilarity = req.query.minScore ? Math.max(0, Math.min(1, parseFloat(req.query.minScore))) : MIN_SIMILARITY;
    const departmentFilter = req.query.department ? String(req.query.department).trim().toLowerCase() : null;
    const companyFilter = req.query.company ? String(req.query.company).trim().toLowerCase() : null;

    // Widen the candidate pool via cosine ordering, then re-rank the top slice
    // in application code — the extra signals (department/company/skills)
    // aren't cheap to express as a single SQL ORDER BY against comma-separated
    // text columns, and the dataset size here doesn't need that to stay fast.
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, name, "avatarUrl", "batchYear", department, "currentCompany", "jobTitle",
              location, bio, skills, interests, "isVerified",
              1 - (embedding <=> $1::vector) AS "cosineSim"
       FROM "User"
       WHERE role = 'ALUMNI' AND "isActive" = true AND "isVerified" = true AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vec, CANDIDATE_POOL_SIZE,
    );

    const eligible = rows.filter((r) => {
      if ((r.cosineSim ?? 0) < minSimilarity) return false;
      if (departmentFilter && (r.department || '').trim().toLowerCase() !== departmentFilter) return false;
      if (companyFilter && (r.currentCompany || '').trim().toLowerCase() !== companyFilter) return false;
      return true;
    });

    const ranked = eligible
      .map((r) => {
        const { matchScore, reasons, sharedSkills } = scoreCandidate(student, r, r.cosineSim ?? 0);
        return {
          id: r.id, name: r.name, avatarUrl: r.avatarUrl, batchYear: r.batchYear,
          department: r.department, currentCompany: r.currentCompany, jobTitle: r.jobTitle,
          location: r.location, bio: r.bio, skills: r.skills, interests: r.interests,
          isVerified: r.isVerified,
          matchScore, reasons, sharedSkills,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    res.json({ student: { id: student.id, name: student.name }, alumni: ranked });
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

// =================== SKILL SWAP HELPERS ===================
function parseSkills(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  return String(val)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeSkill(s) {
  return s.trim().toLowerCase().replace(/\.js$/i, '');
}

function intersection(listA, listB) {
  const setB = new Set(listB.map((s) => s.trim().toLowerCase()).filter(Boolean));
  const setBNorm = new Set(listB.map((s) => normalizeSkill(s)).filter(Boolean));

  const matched = [];
  const seen = new Set();
  for (const item of listA) {
    const trimmed = item.trim();
    const lower = trimmed.toLowerCase();
    const norm = normalizeSkill(trimmed);
    if (!lower || seen.has(lower)) continue;

    if (setB.has(lower) || setBNorm.has(norm)) {
      seen.add(lower);
      matched.push(trimmed);
    }
  }
  return matched;
}

function extractOfferedSkills(u) {
  const explicit = parseSkills(u.skillsOffered);
  if (explicit.length > 0) return explicit;
  return parseSkills(u.skills);
}

function extractWantedSkills(u) {
  const explicit = parseSkills(u.skillsWanted);
  if (explicit.length > 0) return explicit;
  return parseSkills(u.interests);
}

// =================== GET /api/matching/skill-swap ===================
// Find approved & verified peers where there is real skill overlap:
// - They offer what current user wants, or
// - Current user offers what they want
// Transparent, explainable, pure read endpoint with no side-effects or invented theater.
router.get('/skill-swap', authenticate, async (req, res) => {
  try {
    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        department: true,
        skills: true,
        skillsOffered: true,
        skillsWanted: true,
        interests: true,
      },
    });

    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 30);
    const minScore = Number.isFinite(Number(req.query.minScore)) ? Number(req.query.minScore) : 1;
    const skillFilter = req.query.skill ? String(req.query.skill).trim().toLowerCase() : null;
    const deptFilter = req.query.department ? String(req.query.department).trim() : null;

    const myOffered = extractOfferedSkills(current);
    const myWanted = extractWantedSkills(current);

    if (myWanted.length === 0 && myOffered.length === 0) {
      return res.json({
        matches: [],
        message: 'Add skills you offer or skills you want to learn to your profile to find skill swap partners.',
      });
    }

    const candidates = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        profileStatus: 'APPROVED',
        isVerified: true,
        isActive: true,
        ...(deptFilter ? { department: { equals: deptFilter, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        department: true,
        currentCompany: true,
        jobTitle: true,
        role: true,
        avatarUrl: true,
        skillsOffered: true,
        skillsWanted: true,
        skills: true,
        interests: true,
      },
    });

    const results = [];

    for (const c of candidates) {
      const offered = extractOfferedSkills(c);
      const wanted = extractWantedSkills(c);

      const theyOfferYou = intersection(myWanted, offered);
      const youOfferThem = intersection(myOffered, wanted);

      const raw = theyOfferYou.length + youOfferThem.length;
      if (raw < minScore) continue;

      // Optional skill filter
      if (skillFilter) {
        const all = [...theyOfferYou, ...youOfferThem].map((s) => s.toLowerCase());
        const normFilter = normalizeSkill(skillFilter);
        const hasSkill = all.some((s) => s === skillFilter || normalizeSkill(s) === normFilter);
        if (!hasSkill) continue;
      }

      const isSharedDept = Boolean(
        current.department &&
        c.department &&
        current.department.trim().toLowerCase() === c.department.trim().toLowerCase()
      );

      const score = Math.min(raw, 6) + (isSharedDept ? 0.5 : 0);

      const reasons = [];
      if (theyOfferYou.length > 0 && youOfferThem.length > 0) {
        reasons.push('Mutual 2-way skill swap');
      }
      if (theyOfferYou.length > 0) {
        reasons.push(`Offers: ${theyOfferYou.slice(0, 3).join(', ')}`);
      }
      if (youOfferThem.length > 0) {
        reasons.push(`Wants: ${youOfferThem.slice(0, 3).join(', ')} from you`);
      }
      if (isSharedDept) {
        reasons.push(`Same department (${c.department})`);
      }

      results.push({
        id: c.id,
        name: c.name,
        department: c.department || null,
        company: c.currentCompany || null,
        currentCompany: c.currentCompany || null,
        jobTitle: c.jobTitle || null,
        role: c.role || null,
        avatarUrl: c.avatarUrl || null,
        score,
        matchScore: Math.min(100, Math.round((score / 6.5) * 100)),
        skillsTheyOfferYou: theyOfferYou,
        skillsYouOfferThem: youOfferThem,
        sharedDepartment: isSharedDept,
        isMutualSwap: theyOfferYou.length > 0 && youOfferThem.length > 0,
        reasons,
      });
    }

    results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    res.json({ matches: results.slice(0, limit) });
  } catch (err) {
    console.error('GET /matching/skill-swap error:', err);
    res.status(500).json({ error: 'Failed to find skill swap matches' });
  }
});

module.exports = router;
