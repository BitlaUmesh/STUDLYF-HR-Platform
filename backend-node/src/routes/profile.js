const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
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
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  designation: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyWebsite: z.string().url().optional(),
  defaultFont: z.string().optional(),
  defaultBorderColor: z.string().optional(),
  defaultLineSpacing: z.string().optional(),
  defaultLetterSpacing: z.string().optional(),
});

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  letterheadUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  sealUrl: z.string().optional(),
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

module.exports = router;
