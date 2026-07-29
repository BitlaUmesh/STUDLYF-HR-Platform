const express = require('express');
const prisma = require('../db');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { sendDocumentEmail } = require('../services/email');

const router = express.Router();

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
    const docs = await prisma.document.findMany({
      where: { userId: req.hrId },
      orderBy: { updatedAt: 'desc' },
    });

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

// ── DELETE /api/documents/delete/:id & /api/documents/:id ───────────────────
const handleDeleteDocument = async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.hrId },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete related records safely
    await prisma.recentEdit.deleteMany({ where: { documentId: req.params.id } });
    await prisma.emailLog.deleteMany({ where: { documentId: req.params.id } });

    await prisma.document.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Document deleted permanently' });
  } catch (err) {
    next(err);
  }
};

router.delete('/delete/:id', handleDeleteDocument);
router.delete('/:id', handleDeleteDocument);

const sendSchema = z.object({
  to_email: z.string().email(),
  subject: z.string().min(1),
  html_content: z.string().min(1),
  attachment: z.object({
    filename: z.string(),
    content: z.string(), // base64
    contentType: z.string(),
  }).optional(),
});

// ── POST /api/documents/:id/send & /api/documents/send/:id ──────────────────
const handleSendDocument = async (req, res, next) => {
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

    const result = await sendDocumentEmail({
      to: parsed.data.to_email,
      subject: parsed.data.subject,
      htmlContent: parsed.data.html_content,
      attachment: parsed.data.attachment,
    });

    if (result && result.ok === false && result.error) {
      return res.status(500).json({ error: `Email failed: ${result.error}` });
    }

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (err) {
    console.error('[SEND-EMAIL ERROR]', err?.message || err, err?.stack);
    next(err);
  }
};

router.post('/:id/send', handleSendDocument);
router.post('/send/:id', handleSendDocument);

module.exports = router;
