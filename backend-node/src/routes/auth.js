const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
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

const JWT_SECRET = process.env.JWT_SECRET || '26a7805549a9746b06e65a3666b410d4ff72ded6d01bde669bfc9606f16249cd';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '98fea5779bba9e1127e4d5acbf637ffe03f0c492db1435521a311267346862a9';

function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  });
}

function createRefreshToken(userId) {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
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
      payload = jwt.verify(token, JWT_REFRESH_SECRET);
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
      payload = jwt.verify(token, JWT_SECRET);
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
    redirect_uri: process.env.GITHUB_REDIRECT_URL || process.env.GITHUB_REDIRECT_URI,
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
        redirect_uri: process.env.GITHUB_REDIRECT_URL || process.env.GITHUB_REDIRECT_URI,
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
    const accessToken = jwt.sign({ sub: student.id }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.cookie('student_access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));

    // Redirect to frontend
    const targetFrontend = (process.env.FRONTEND_URL || 'https://studlyf-hr-platform.vercel.app').replace(/\/$/, '');
    return res.redirect(`${targetFrontend}/dashboard`);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
const { authenticate } = require('../middleware/auth');
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.hrId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.hrId },
      data: { hashedPassword },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const RESET_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET + '_reset';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return 200 to avoid email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const resetToken = jwt.sign({ sub: user.id, purpose: 'password_reset' }, RESET_SECRET, { expiresIn: '15m' });
    const frontendUrl = (process.env.FRONTEND_URL || 'https://studlyf-hr-platform.vercel.app').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `STUDLYF HR <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset your StudLyf HR password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <div style="margin-bottom:24px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:#4338ca;">
              <span style="color:white;font-weight:700;font-size:18px;">S</span>
            </div>
          </div>
          <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px;">Reset your password</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;">
            Hi ${user.fullName}, you requested a password reset for your StudLyf HR account.
            Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetLink}" style="display:inline-block;background:#4338ca;color:white;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        </div>
      `,
    });

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Token and a password of at least 8 characters are required.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, RESET_SECRET);
    } catch {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: payload.sub },
      data: { hashedPassword },
    });

    return res.json({ message: 'Password updated successfully. Please sign in.' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth — Step 1: Redirect to Google
// GET /api/auth/google
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: 'Google OAuth is not configured on this server.' });
  }
  const frontendUrl = (process.env.FRONTEND_URL || 'https://studlyf-hr-platform.vercel.app').replace(/\/$/, '');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || `https://studlyf-hr-platform.onrender.com/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth — Step 2: Callback
// GET /api/auth/google/callback
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing OAuth code from Google' });

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || `https://studlyf-hr-platform.onrender.com/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token: googleAccessToken } = tokenRes.data;

    // Fetch Google user profile
    const { data: googleUser } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    const { email, name, picture } = googleUser;
    if (!email) return res.status(400).json({ error: 'Could not retrieve email from Google' });

    // Upsert HR User record
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: name || email.split('@')[0],
          email,
          hashedPassword: await bcrypt.hash(Math.random().toString(36), 12), // random unusable password
          companyName: email.split('@')[1]?.split('.')[0] || 'My Company',
          profilePhoto: picture || null,
          branding: { create: {} },
        },
      });
    } else if (picture && !user.profilePhoto) {
      // Sync profile photo from Google if not set
      await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: picture } });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    res.cookie('access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    const targetFrontend = (process.env.FRONTEND_URL || 'https://studlyf-hr-platform.vercel.app').replace(/\/$/, '');
    return res.redirect(`${targetFrontend}/dashboard`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
