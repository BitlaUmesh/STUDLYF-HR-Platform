const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
const prisma = require('../db');
const { z } = require('zod');
const { authLimiter, signupLimiter } = require('../middleware/ratelimit');

const router = express.Router();

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

function validatePasswordPolicy(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one capital letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one small letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[@\.\-\/]/.test(password)) {
    return 'Password must contain at least one special character from @ . - /';
  }
  return null;
}

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

    const policyErr = validatePasswordPolicy(password);
    if (policyErr) {
      return res.status(400).json({ error: policyErr });
    }

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
      token: accessToken,
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
    let token = null;
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
        token = parts[1];
      }
    }
    if (!token && req.cookies?.refresh_token) {
      token = req.cookies.refresh_token;
    }

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

    return res.json({ message: 'Token refreshed successfully', token: newAccessToken });
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
    let token = null;
    let authSource = 'none';

    // Prioritize Authorization Bearer header from localStorage
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
        token = parts[1];
        authSource = 'header';
      }
    }

    // Try Bearer token first
    let payload = null;
    if (token) {
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Bearer token failed, clear token so cookie fallback can be attempted below if available
        token = null;
      }
    }

    // Fall back to access_token cookie if Bearer token was missing or invalid
    if (!payload && req.cookies?.access_token) {
      token = req.cookies.access_token;
      authSource = 'cookie';
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        payload = null;
      }
    }

    if (!payload) {
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
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const policyErr = validatePasswordPolicy(newPassword);
    if (policyErr) {
      return res.status(400).json({ error: policyErr });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password cannot be the same as your current password.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.hrId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.hashedPassword);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password cannot be the same as your current password.' });
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
// ── OTP Mailer Helper ────────────────────────────────────────────────────────
const { sendDocumentEmail } = require('../services/email');

async function sendOtpEmail(email, otp, title, subtitle) {
  const htmlContent = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
      <div style="margin-bottom:24px;text-align:center;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#FF2A5F 0%,#D946EF 50%,#2D136F 100%);color:white;font-weight:900;font-size:24px;box-shadow:0 4px 14px rgba(217,70,239,0.35);">
          S
        </div>
        <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin-top:12px;margin-bottom:4px;letter-spacing:-0.5px;">STUDLYF HR</h1>
      </div>
      
      <div style="background-color:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:24px;text-align:center;">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:8px;">${title}</h2>
        <p style="color:#64748b;font-size:13px;line-height:1.5;margin-top:0;margin-bottom:20px;">
          ${subtitle}
        </p>

        <div style="letter-spacing:10px;font-size:32px;font-weight:900;color:#2D136F;background:white;border:2px dashed #D946EF;padding:14px 20px;border-radius:12px;display:inline-block;margin:0 auto 16px auto;">
          ${otp}
        </div>

        <p style="color:#94a3b8;font-size:11px;margin:0;">
          This 6-digit verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;border-t:1px solid #f1f5f9;padding-top:16px;">
        <p style="color:#cbd5e1;font-size:11px;margin:0;">
          © ${new Date().getFullYear()} STUDLYF HR Platform. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await sendDocumentEmail({
    to: email,
    subject: `[STUDLYF HR] ${otp} is your verification code`,
    htmlContent,
  });
  
  // Dev Fallback console print
  console.log(`\n==========================================`);
  console.log(`[STUDLYF 6-DIGIT OTP] Email: ${email} | Code: ${otp}`);
  console.log(`==========================================\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signup 6-Digit OTP Endpoints
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-signup-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete older OTPs for this email & type
    await prisma.otpVerification.deleteMany({ where: { email, type: 'signup' } });
    await prisma.otpVerification.create({
      data: { email, otp, type: 'signup', expiresAt },
    });

    await sendOtpEmail(email, otp, 'Verify Your Email Address', 'Enter this 6-digit verification code to complete your STUDLYF HR account registration:');
    return res.json({ message: '6-digit verification code sent to your Gmail', email });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-signup-otp', async (req, res, next) => {
  try {
    const { email, otp, fullName, password, companyName } = req.body;
    if (!email || !otp || !fullName || !password || !companyName) {
      return res.status(400).json({ error: 'All signup fields and 6-digit OTP code are required.' });
    }

    const validRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp: otp.trim(),
        type: 'signup',
        expiresAt: { gt: new Date() },
      },
    });

    if (!validRecord) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit OTP verification code.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        hashedPassword,
        companyName,
        branding: { create: {} },
      },
      select: { id: true, fullName: true, email: true, companyName: true, createdAt: true },
    });

    await prisma.otpVerification.deleteMany({ where: { email, type: 'signup' } });

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    res.cookie('access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(201).json({ message: 'Account verified and created successfully', user });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Forgot Password 6-Digit OTP Endpoints (with legacy route aliases)
// ─────────────────────────────────────────────────────────────────────────────
const handleForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.deleteMany({ where: { email, type: 'forgot_password' } });
    await prisma.otpVerification.create({
      data: { email, otp, type: 'forgot_password', expiresAt },
    });

    await sendOtpEmail(email, otp, 'Reset Password Verification', 'Use this 6-digit verification code to reset your STUDLYF HR password:');
    return res.json({ message: '6-digit verification code sent to your Gmail', email });
  } catch (err) {
    next(err);
  }
};

router.post('/forgot-password-otp', handleForgotPasswordOtp);
router.post('/forgot-password', handleForgotPasswordOtp);

const handleVerifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });

    const validRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp: otp.trim(),
        type: 'forgot_password',
        expiresAt: { gt: new Date() },
      },
    });

    if (!validRecord) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit verification code.' });
    }

    return res.json({ message: 'OTP verified successfully', valid: true });
  } catch (err) {
    next(err);
  }
};

router.post('/verify-reset-otp', handleVerifyResetOtp);
router.post('/verify-otp', handleVerifyResetOtp);

const handleResetPasswordOtp = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Email, valid 6-digit OTP, and a password of at least 8 characters are required.' });
    }

    const validRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp: otp.trim(),
        type: 'forgot_password',
        expiresAt: { gt: new Date() },
      },
    });

    if (!validRecord) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit verification code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { hashedPassword, needsPasswordSetup: false },
    });

    await prisma.otpVerification.deleteMany({ where: { email, type: 'forgot_password' } });

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

router.post('/reset-password-otp', handleResetPasswordOtp);
router.post('/reset-password', handleResetPasswordOtp);

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth First-time Password Setup
// ─────────────────────────────────────────────────────────────────────────────
router.post('/set-google-password', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { hashedPassword, needsPasswordSetup: false },
      select: { id: true, fullName: true, email: true, companyName: true },
    });

    const accessToken = createAccessToken(updatedUser.id);
    const refreshToken = createRefreshToken(updatedUser.id);
    res.cookie('access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.json({ message: 'Password saved successfully! You can now sign in using Email + Password or Google.', user: updatedUser });
  } catch (err) {
    next(err);
  }
});

function getGoogleRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  if (process.env.GOOGLE_REDIRECT_URL) return process.env.GOOGLE_REDIRECT_URL;
  const host = req.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://${host}/api/auth/google/callback`;
  }
  return 'https://studlyf-hr-platform.onrender.com/api/auth/google/callback';
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth — Step 1: Redirect to Google
// GET /api/auth/google
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Redirect to frontend with error so user sees a readable message
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return res.redirect(`${frontend}/login?error=google_not_configured`);
  }

  const redirectUri = getGoogleRedirectUri(req);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
    prompt: 'consent select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth — Step 2: Callback
// GET /api/auth/google/callback
// ─────────────────────────────────────────────────────────────────────────────
router.get('/google/callback', async (req, res, next) => {
  const targetFrontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  try {
    const { code, error: oauthError } = req.query;

    // Google returned an error (e.g. user denied permission)
    if (oauthError) {
      console.warn('[Google OAuth] Google returned error:', oauthError);
      return res.redirect(`${targetFrontend}/login?error=google_denied`);
    }

    if (!code) {
      return res.redirect(`${targetFrontend}/login?error=google_no_code`);
    }

    // Must exactly match what was sent in Step 1
    const redirectUri = getGoogleRedirectUri(req);

    // Exchange code for tokens
    let tokenRes;
    try {
      tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
    } catch (tokenErr) {
      console.error('[Google OAuth] Token exchange failed:', tokenErr?.response?.data || tokenErr.message);
      return res.redirect(`${targetFrontend}/login?error=google_token_failed`);
    }

    const {
      access_token: googleAccessToken,
      refresh_token: googleRefreshToken,
      expires_in: expiresIn,
    } = tokenRes.data;

    if (!googleAccessToken) {
      return res.redirect(`${targetFrontend}/login?error=google_no_access_token`);
    }

    const googleTokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const googleData = {
      googleAccessToken,
      ...(googleRefreshToken && { googleRefreshToken }),
      ...(googleTokenExpiry && { googleTokenExpiry }),
    };

    // Fetch Google user profile
    let googleUser;
    try {
      const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      googleUser = profileRes.data;
    } catch (profileErr) {
      console.error('[Google OAuth] Profile fetch failed:', profileErr.message);
      return res.redirect(`${targetFrontend}/login?error=google_profile_failed`);
    }

    const { email, name, picture } = googleUser;
    if (!email) {
      return res.redirect(`${targetFrontend}/login?error=google_no_email`);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          fullName: name || email.split('@')[0],
          email,
          hashedPassword: await bcrypt.hash(Math.random().toString(36), 12),
          companyName: email.split('@')[1]?.split('.')[0] || 'My Company',
          profilePhoto: picture || null,
          needsPasswordSetup: true,
          ...googleData,
          branding: { create: {} },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(picture && !user.profilePhoto ? { profilePhoto: picture } : {}),
          ...googleData,
        },
      });
    }

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    // Set cookies (will work if same domain; also passing token in URL as fallback
    // since the frontend is on Vercel and the backend is on Render — cross-site)
    res.cookie('access_token', accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    // If new Google user or needs password setup, redirect to /set-password
    if (isNewUser || user.needsPasswordSetup) {
      return res.redirect(
        `${targetFrontend}/set-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(accessToken)}`
      );
    }

    // Embed access token in URL so the Vercel frontend can store it in
    // localStorage (cross-site cookies are blocked by browsers)
    return res.redirect(`${targetFrontend}/dashboard?token=${encodeURIComponent(accessToken)}`);
  } catch (err) {
    console.error('[Google OAuth] Unexpected error:', err.message);
    return res.redirect(`${targetFrontend}/login?error=google_unexpected`);
  }
});

module.exports = router;

