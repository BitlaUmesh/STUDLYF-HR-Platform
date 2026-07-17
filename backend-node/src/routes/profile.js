const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

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

// ── GET /api/profile/ ─────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.hrId },
      select: {
        id: true, fullName: true, email: true, companyName: true,
        profilePhoto: true, phone: true, address: true,
        city: true, state: true, country: true, designation: true,
        companyAddress: true, companyPhone: true, companyEmail: true, companyWebsite: true,
        defaultFont: true, defaultBorderColor: true, defaultLineSpacing: true, defaultLetterSpacing: true,
        branding: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile/ ─────────────────────────────────────────────────────────
router.put('/', async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const updated = await prisma.user.update({
      where: { id: req.hrId },
      data: parsed.data,
      select: {
        id: true, fullName: true, email: true, companyName: true,
        phone: true, designation: true, city: true, state: true, country: true,
      },
    });

    return res.json(updated);
  } catch (err) {
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
