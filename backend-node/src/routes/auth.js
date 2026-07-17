const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authLimiter, signupLimiter } = require('../middleware/ratelimit');

const router = express.Router();
const prisma = new PrismaClient();

const isProd = process.env.ENVIRONMENT === 'production';

// ── Cookie config helpers ──────────────────────────────────────────────────────
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge,
  path: '/',
});

function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  });
}

function createRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

// ── Validation Schemas ────────────────────────────────────────────────────────
const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────
router.post('/signup', signupLimiter, async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.issues });
    }

    const { fullName, email, password, companyName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        hashedPassword,
        companyName,
        branding: { create: {} }, // auto-create empty branding profile
      },
      select: {
        id: true, fullName: true, email: true, companyName: true, createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.issues });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    res.cookie('access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = createAccessToken(user.id);
    res.cookie('access_token', newAccessToken, cookieOptions(24 * 60 * 60 * 1000));

    return res.json({ message: 'Token refreshed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('access_token', cookieOptions(0));
  res.clearCookie('refresh_token', cookieOptions(0));
  return res.json({ message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, fullName: true, email: true, companyName: true,
        profilePhoto: true, phone: true, designation: true,
        city: true, state: true, country: true, createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub OAuth — Step 1: Redirect to GitHub
// GET /api/auth/github
// ─────────────────────────────────────────────────────────────────────────────
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub OAuth — Step 2: Callback handler
// GET /api/auth/github/callback
// ─────────────────────────────────────────────────────────────────────────────
router.get('/github/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing GitHub OAuth code' });

    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token: githubToken } = tokenRes.data;
    if (!githubToken) {
      return res.status(400).json({ error: 'Failed to obtain GitHub access token' });
    }

    // Fetch GitHub user profile
    const { data: ghUser } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}`, 'User-Agent': 'StudLyf-HR' },
    });

    // Fetch primary email if not public
    let email = ghUser.email;
    if (!email) {
      const { data: emails } = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubToken}`, 'User-Agent': 'StudLyf-HR' },
      });
      email = emails.find((e) => e.primary)?.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from GitHub' });
    }

    // Upsert Student record
    const student = await prisma.student.upsert({
      where: { githubId: String(ghUser.id) },
      update: {
        name: ghUser.name || ghUser.login,
        email,
        avatarUrl: ghUser.avatar_url,
        githubUsername: ghUser.login,
        githubAccessToken: githubToken,
      },
      create: {
        name: ghUser.name || ghUser.login,
        email,
        avatarUrl: ghUser.avatar_url,
        githubUsername: ghUser.login,
        githubId: String(ghUser.id),
        githubAccessToken: githubToken,
        skills: [],
      },
    });

    // Trigger background GitHub stats sync (non-blocking)
    const { syncGitHubStats } = require('../services/github');
    syncGitHubStats(student.id, githubToken).catch(console.error);

    // Issue student JWT
    const accessToken = jwt.sign({ sub: student.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.cookie('student_access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));

    // Redirect to frontend
    return res.redirect(`${process.env.FRONTEND_URL}/student/dashboard`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
