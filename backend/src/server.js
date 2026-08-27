// apps/api/src/server.js
// Main Express server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Security Headers ---
app.use(helmet({
  contentSecurityPolicy: false, // disabled — frontend may inline scripts/styles
  crossOriginEmbedderPolicy: false,
}));

// --- Request Logging ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

// --- CORS ---
const allowedOrigins = new Set([
  'https://sihproalumn.vercel.app',
  process.env.WEB_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools or server-to-server requests
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.has(origin)) return callback(null, true);
    
    // Allow any *.vercel.app deployment
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('.vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }
    } catch {
      // Invalid URL format
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// --- Favicon handler ---
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- Health check (before auth-protected routes) ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'alumni-api', time: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/events', require('./routes/events'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/matching', require('./routes/matching'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/newsletters', require('./routes/newsletters'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/search', require('./routes/search'));
// --- Local file uploads (auth-protected) ---
const { authenticate } = require('./middleware/auth');
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// --- Start server ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: Array.from(allowedOrigins),
    credentials: true,
  },
});
initSocket(io);

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`PRO ALUMN API running on port ${PORT}`);
});

// --- Graceful shutdown ---
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    const prisma = require('./db');
    prisma.$disconnect().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
