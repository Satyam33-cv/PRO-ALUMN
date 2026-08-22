// apps/api/src/routes/auth.js
// Full authentication: register, login, me
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

const PUBLIC_VALID_ROLES = ['ALUMNI', 'STUDENT', 'FACULTY'];

router.use(passport.initialize());

const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: `${API_BASE_URL}/api/auth/google/callback`
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails[0].value.toLowerCase();
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        user = await prisma.user.create({
          data: {
            name: profile.displayName,
            email,
            passwordHash,
            role: 'STUDENT',
            avatarUrl: profile.photos?.[0]?.value,
            isVerified: true,
          }
        });
      }
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

// =================== POST /api/auth/register ===================
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role = 'STUDENT',
      phone, batchYear, department, rollNumber,
      currentCompany, jobTitle, location, linkedinUrl, bio,
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    if (!PUBLIC_VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: ALUMNI, STUDENT, FACULTY' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name, email: email.toLowerCase(), passwordHash, role,
        phone, batchYear: batchYear ? parseInt(batchYear) : null,
        department, rollNumber, currentCompany, jobTitle, location, linkedinUrl, bio,
      },
    });

    // Auto-login: issue token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// =================== POST /api/auth/login ===================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ error: 'Account disabled' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// =================== GET /api/auth/me ===================
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatarUrl: true,
        batchYear: true, department: true, rollNumber: true,
        currentCompany: true, jobTitle: true, location: true, linkedinUrl: true, bio: true,
        isVerified: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('GET /auth/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// =================== GET /api/auth/google ===================
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// =================== GET /api/auth/google/callback ===================
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, role: req.user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
});

module.exports = router;
