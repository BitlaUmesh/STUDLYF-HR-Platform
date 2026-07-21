const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { sendDocumentEmail } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

// All document routes require HR authentication
router.use(authenticate);

// Map shorthand or case-insensitive type values to canonical enum values
const DOCUMENT_TYPE_MAP = {
  OFFER_LETTER: 'OFFER_LETTER',
  JOINING_LETTER: 'JOINING_LETTER',
  OFFER: 'OFFER_LETTER',
  JOINING: 'JOINING_LETTER',
};

function normalizeDocumentType(val) {
  if (typeof val !== 'string') return val;
  return DOCUMENT_TYPE_MAP[val.toUpperCase().replace(/[\s-]/g, '_')] || val;
}

const createSchema = z.object({
  title: z.string().optional(),
  type: z.preprocess(normalizeDocumentType, z.enum(['OFFER_LETTER', 'JOINING_LETTER'])),
  status: z.string().optional(),
  template_id: z.string().optional(),
  candidateDetails: z.record(z.any()),
  contentJSON: z.record(z.any()),
  brandingId: z.string().optional(),
  exportUrl: z.string().optional(),
});

const updateSchema = createSchema.partial();

// ── POST /api/documents/create ────────────────────────────────────────────────
router.post('/create', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const doc = await prisma.document.create({
      data: { userId: req.hrId, ...parsed.data },
    });

    await prisma.recentEdit.create({
      data: { userId: req.hrId, documentId: doc.id },
    });

    return res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/documents/ ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    let docs = await prisma.document.findMany({
      where: { userId: req.hrId },
      orderBy: { updatedAt: 'desc' },
    });

    if (docs.length === 0) {
      // Auto seed 2 starter drafts for HR
      const draft1 = await prisma.document.create({
        data: {
          userId: req.hrId,
          type: 'OFFER_LETTER',
          title: 'Offer Letter - Vikram Malhotra (Draft)',
          status: 'draft',
          candidateDetails: {
            candidateName: 'Vikram Malhotra',
            candidateEmail: 'vikram.malhotra@studlyf.com',
            jobTitle: 'Senior Software Engineer',
            salary: '$140,000 / year',
            companyName: 'StudLyf Inc.',
          },
          contentJSON: {
            html: '<p>Dear Vikram Malhotra,</p><p>We are thrilled to offer you the position of Senior Software Engineer at StudLyf Inc.</p>',
          },
        },
      });

      const draft2 = await prisma.document.create({
        data: {
          userId: req.hrId,
          type: 'JOINING_LETTER',
          title: 'Joining Letter - Neha Patil (Draft)',
          status: 'draft',
          candidateDetails: {
            candidateName: 'Neha Patil',
            candidateEmail: 'neha.patil@studlyf.com',
            jobTitle: 'Frontend Engineer',
            salary: '$115,000 / year',
            companyName: 'StudLyf Inc.',
          },
          contentJSON: {
            html: '<p>Dear Neha Patil,</p><p>Welcome to StudLyf Inc. We are excited to confirm your joining date as Frontend Engineer.</p>',
          },
        },
      });

      docs = [draft1, draft2];
    }

    return res.json(docs);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/documents/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.hrId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Update last opened timestamp
    await prisma.document.update({
      where: { id: doc.id },
      data: { lastOpenedAt: new Date() },
    });

    return res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/documents/update/:id ────────────────────────────────────────────
router.put('/update/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.issues });

    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.hrId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: { ...parsed.data, updatedAt: new Date() },
    });

    // Upsert recent edit
    await prisma.recentEdit.upsert({
      where: {
        // we need a unique identifier — use compound where workaround
        id: (await prisma.recentEdit.findFirst({
          where: { documentId: req.params.id, userId: req.hrId },
        }))?.id || 'non-existent',
      },
      update: { lastEditedAt: new Date() },
      create: { userId: req.hrId, documentId: req.params.id },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/documents/delete/:id ─────────────────────────────────────────
router.delete('/delete/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.hrId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await prisma.document.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
});

const sendSchema = z.object({
  to_email: z.string().email(),
  subject: z.string().min(1),
  html_content: z.string().min(1),
});

// ── POST /api/documents/:id/send ─────────────────────────────────────────────
router.post('/:id/send', async (req, res, next) => {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.issues });
    }

    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.hrId },
    });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await sendDocumentEmail({
      to: parsed.data.to_email,
      subject: parsed.data.subject,
      htmlContent: parsed.data.html_content,
    });

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
