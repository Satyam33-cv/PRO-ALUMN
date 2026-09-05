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

// --- Rate Limiting (Commandment 07) ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
  },
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

// --- GraphQL Apollo Server Integration ---
const { ApolloServer, HeaderMap } = require('@apollo/server');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const jwt = require('jsonwebtoken');
const prisma = require('./db');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

let expressMiddleware;
try {
  expressMiddleware = require('@apollo/server/express4').expressMiddleware;
} catch {
  // Resilient fallback if subpath exports vary across environments
  const { parse } = require('url');
  expressMiddleware = (server, options = {}) => {
    const context = options.context || (async () => ({}));
    return (req, res, next) => {
      if (!req.body) {
        return res.status(500).send('req.body is required for GraphQL requests');
      }
      const headers = new HeaderMap();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      const httpGraphQLRequest = {
        method: req.method.toUpperCase(),
        headers,
        search: parse(req.url).search || '',
        body: req.body,
      };
      server
        .executeHTTPGraphQLRequest({
          httpGraphQLRequest,
          context: () => context({ req, res }),
        })
        .then(async (httpGraphQLResponse) => {
          for (const [key, value] of httpGraphQLResponse.headers) {
            res.setHeader(key, value);
          }
          res.statusCode = httpGraphQLResponse.status || 200;
          if (httpGraphQLResponse.body.kind === 'complete') {
            res.send(httpGraphQLResponse.body.string);
            return;
          }
          for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
            res.write(chunk);
          }
          res.end();
        })
        .catch(next);
    };
  };
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
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
app.use('/api/video', require('./routes/video'));
app.use('/api/support', require('./routes/support'));
// ponytail: Giving route disabled per product direction; upgrade to dedicated endowment module if needed later.

// --- Local file uploads (auth-protected) ---
const { authenticate } = require('./middleware/auth');
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// --- Global Centralized Error Handler (Commandment 04) ---
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  console.error(`🚨 [${new Date().toISOString()}] Error on ${req.method} ${req.path}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error occurred'
      : (err.message || 'An unexpected error occurred'),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
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

let server;

async function startServer() {
  await apolloServer.start();
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const header = req.headers.authorization;
        let user = null;
        if (header && header.startsWith('Bearer ')) {
          try {
            const token = header.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            user = { id: decoded.id, email: decoded.email, role: decoded.role };
          } catch (_) {}
        }
        return { user, prisma };
      },
    })
  );

  // --- 404 handler (after all routes & graphql) ---
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PRO ALUMN API running on port ${PORT}`);
    console.log(`🚀 GraphQL Endpoint ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
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
