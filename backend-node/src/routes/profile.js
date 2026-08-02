const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const prisma = require('../db');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const uploadsDirectory = path.join(__dirname, '../../uploads/profiles');
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

fs.mkdirSync(uploadsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDirectory),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `profile-${req.hrId}-${Date.now()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) {
      callback(null, true);
      return;
    }

    const error = new Error('Profile photo must be a JPG, PNG, or WebP image.');
    error.status = 400;
    callback(error);
  },
});

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  profilePhoto: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  companyPhone: z.string().nullable().optional(),
  companyEmail: z.string().email().nullable().optional().or(z.literal('')),
  companyWebsite: z.string().nullable().optional(),
  defaultFont: z.string().nullable().optional(),
  defaultBorderColor: z.string().nullable().optional(),
  defaultLineSpacing: z.string().nullable().optional(),
  defaultLetterSpacing: z.string().nullable().optional(),
});

const brandingSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  letterheadUrl: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  sealUrl: z.string().nullable().optional(),
});

const profileSelect = {
  id: true,
  fullName: true,
  email: true,
  companyName: true,
  profilePhoto: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  country: true,
  designation: true,
  companyAddress: true,
  companyPhone: true,
  companyEmail: true,
  companyWebsite: true,
  defaultFont: true,
  defaultBorderColor: true,
  defaultLineSpacing: true,
  defaultLetterSpacing: true,
  branding: true,
  createdAt: true,
};

router.use(authenticate);

// ── GET /api/profile/ ─────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.hrId },
      select: profileSelect,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile/ ─────────────────────────────────────────────────────────
async function handleProfileUpdate(req, res, next) {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const updated = await prisma.user.update({
      where: { id: req.hrId },
      data: parsed.data,
      select: profileSelect,
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

router.put('/', handleProfileUpdate);

// ── POST /api/profile/ (alias for PUT — defensive compatibility) ──────────────
router.post('/', handleProfileUpdate);

// ── POST /api/profile/upload-photo ────────────────────────────────────────────
router.post('/upload-photo', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'A profile photo file is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.hrId },
      select: { profilePhoto: true },
    });
    if (!user) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'User not found' });
    }

    const profilePhoto = `/api/uploads/profiles/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.hrId },
      data: { profilePhoto },
      select: { profilePhoto: true },
    });

    if (user.profilePhoto?.startsWith('/api/uploads/profiles/')) {
      const previousFile = path.join(uploadsDirectory, path.basename(user.profilePhoto));
      if (previousFile !== req.file.path) {
        await fs.promises.unlink(previousFile).catch(() => {});
      }
    }

    return res.status(201).json({ profilePhoto: updated.profilePhoto });
  } catch (err) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

// ── PUT /api/profile/branding ─────────────────────────────────────────────────
router.put('/branding', async (req, res, next) => {
  try {
    const parsed = brandingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const branding = await prisma.companyBranding.upsert({
      where: { userId: req.hrId },
      update: parsed.data,
      create: { userId: req.hrId, ...parsed.data },
    });

    return res.json(branding);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/email-settings ──────────────────────────────────────────
router.get('/email-settings', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.hrId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassEncrypted: true,
        smtpFrom: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const hasGoogleConnected = !!(user.googleAccessToken || user.googleRefreshToken);
    const hasCustomSmtp = !!(user.smtpHost && user.smtpUser && user.smtpPassEncrypted);

    return res.json({
      hasGoogleConnected,
      hasCustomSmtp,
      isConfigured: hasGoogleConnected || hasCustomSmtp,
      smtpHost: user.smtpHost || '',
      smtpPort: user.smtpPort || 587,
      smtpUser: user.smtpUser || '',
      smtpFrom: user.smtpFrom || '',
      isPassSet: !!user.smtpPassEncrypted,
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile/email-settings ──────────────────────────────────────────
const { encrypt } = require('../utils/encryption');

const smtpSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().or(z.string().transform(Number)).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
});

router.put('/email-settings', async (req, res, next) => {
  try {
    const parsed = smtpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = parsed.data;

    const updateData = {};
    if (smtpHost !== undefined) updateData.smtpHost = smtpHost.trim() || null;
    if (smtpPort !== undefined) updateData.smtpPort = smtpPort || 587;
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser.trim() || null;
    if (smtpFrom !== undefined) updateData.smtpFrom = smtpFrom.trim() || null;

    if (smtpPass && smtpPass.trim() !== '' && !smtpPass.startsWith('••••')) {
      updateData.smtpPassEncrypted = encrypt(smtpPass.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.hrId },
      data: updateData,
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassEncrypted: true,
        smtpFrom: true,
      },
    });

    const hasGoogleConnected = !!(updatedUser.googleAccessToken || updatedUser.googleRefreshToken);
    const hasCustomSmtp = !!(updatedUser.smtpHost && updatedUser.smtpUser && updatedUser.smtpPassEncrypted);

    return res.json({
      message: 'Email settings saved successfully',
      hasGoogleConnected,
      hasCustomSmtp,
      isConfigured: hasGoogleConnected || hasCustomSmtp,
      smtpHost: updatedUser.smtpHost || '',
      smtpPort: updatedUser.smtpPort || 587,
      smtpUser: updatedUser.smtpUser || '',
      smtpFrom: updatedUser.smtpFrom || '',
      isPassSet: !!updatedUser.smtpPassEncrypted,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
