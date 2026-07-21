require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

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
const allowedOrigins = new Set(
  ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean)
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
      if (!origin || allowedOrigins.has(origin) || origin.endsWith('.ngrok-free.dev') || origin.endsWith('.ngrok.app')) {
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static file serving (profile uploads) ────────────────────────────────────
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
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
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.ENVIRONMENT !== 'production' && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 STUDLYF HR Backend running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.ENVIRONMENT || 'development'}`);
});

module.exports = app;
