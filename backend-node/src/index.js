// Load environment variables from multiple possible locations (Hostinger, Render, Local)
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const renderSecretPath = '/etc/secrets/.env';
const localBackendEnvPath = path.resolve(__dirname, '../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(renderSecretPath)) {
  dotenv.config({ path: renderSecretPath });
} else if (fs.existsSync(localBackendEnvPath)) {
  dotenv.config({ path: localBackendEnvPath });
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else {
  dotenv.config();
}

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const documentsRoutes = require('./routes/documents');
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');
const studentsRoutes = require('./routes/students');
const applicationsRoutes = require('./routes/applications');
const questionsRoutes = require('./routes/questions');
const meetingsRoutes = require('./routes/meetings');
const messagesRoutes = require('./routes/messages');

const app = express();
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    'https://studlyf-hr-platform.vercel.app',
    'https://olivedrab-chimpanzee-507172.hostingersite.com',
    frontendUrl,
  ].filter(Boolean)
);

// ── Security Headers Middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
  const isProd = process.env.ENVIRONMENT === 'production';
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: blob: https:;"
  );
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.ngrok-free.dev') || origin.endsWith('.ngrok.app')) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ── Static file serving (profile uploads) ────────────────────────────────────
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'healthy', service: 'studlyf-hr-api', version: '2.0.0' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/messages', messagesRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.status || err.statusCode ||
    (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : 500);

  let userMessage = err.message || 'Internal Server Error';
  if (
    userMessage.includes('prisma') ||
    userMessage.includes('PrismaClient') ||
    userMessage.includes('invocation') ||
    userMessage.includes('gitHubStats') ||
    userMessage.includes('hackathonProjects') ||
    userMessage.includes('Unknown field')
  ) {
    userMessage = 'Unable to complete request. Please try again.';
  }

  res.status(status).json({
    error: userMessage,
    ...(process.env.ENVIRONMENT !== 'production' && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 STUDLYF HR Backend running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.ENVIRONMENT || 'development'}`);

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ WARNING: DATABASE_URL is not set in environment variables! Database operations will fail.');
  } else {
    console.log('✅ DATABASE_URL is configured.');
  }

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET is not set in environment variables! Auth operations will fail.');
  } else {
    console.log('✅ JWT_SECRET is configured.');
  }
});

module.exports = app;
