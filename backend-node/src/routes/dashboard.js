const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ── GET /api/dashboard/metrics ────────────────────────────────────────────────
router.get('/metrics', async (req, res, next) => {
  try {
    const [documentsCreated, exportData, activeTemplates] = await Promise.all([
      prisma.document.count({ where: { userId: req.hrId } }),
      prisma.document.aggregate({
        where: { userId: req.hrId },
        _sum: { exportCount: true },
      }),
      prisma.template.count(),
    ]);

    const recentExports = exportData._sum.exportCount || 0;

    // Time saved: 10 mins per document
    const totalMins = documentsCreated * 10;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const timeSaved = hrs > 0
      ? mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hrs`
      : `${totalMins} mins`;

    return res.json({
      documentsCreated,
      recentExports,
      activeTemplates,
      timeSaved,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/dashboard/recent-documents ───────────────────────────────────────
router.get('/recent-documents', async (req, res, next) => {
  try {
    const recent = await prisma.recentEdit.findMany({
      where: { userId: req.hrId },
      orderBy: { lastEditedAt: 'desc' },
      take: 10,
      include: {
        document: {
          select: { id: true, title: true, type: true, status: true, updatedAt: true },
        },
      },
    });
    return res.json(recent.map((r) => r.document).filter(Boolean));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
