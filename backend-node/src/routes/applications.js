const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendApplicationStatusUpdate } = require('../services/email');

const router = express.Router();

router.use(authenticate);

// ── POST /api/applications/invite/:studentId ──────────────────────────────────
router.post('/invite/:studentId', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Prevent duplicate applications
    const existing = await prisma.application.findUnique({
      where: { hrId_studentId: { hrId: req.hrId, studentId: student.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already applied to this student' });

    const application = await prisma.application.create({
      data: { hrId: req.hrId, studentId: student.id, status: 'invited' },
      include: { student: { select: { id: true, name: true, email: true, skills: true } } },
    });

    return res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/applications/ ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const applications = await prisma.application.findMany({
      where: { hrId: req.hrId, ...(status && { status }) },
      orderBy: { updatedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, bio: true, skills: true, avatarUrl: true, githubUsername: true,
            githubStats: true,
          },
        },
        meeting: { select: { id: true, status: true, scheduledAt: true, calendlyEventUrl: true } },
      },
    });
    return res.json(applications);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/applications/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    let application;
    
    // Tier 1: Look up by Application ID
    try {
      application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
          student: { include: { githubStats: true, projects: true } },
          screeningResponses: { include: { question: true } },
          meeting: true,
        },
      });
    } catch (primaryErr) {
      console.warn('[Application GET /:id] Full query by ID failed, trying minimal include:', primaryErr.message);
      application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
          student: true,
          meeting: true,
        },
      });
    }

    // Tier 2: Look up by Student ID if Application ID didn't match
    if (!application) {
      try {
        application = await prisma.application.findFirst({
          where: { studentId: req.params.id },
          include: {
            student: { include: { githubStats: true, projects: true } },
            screeningResponses: { include: { question: true } },
            meeting: true,
          },
        });
      } catch (studentIdErr) {
        console.warn('[Application GET /:id] Lookup by studentId failed:', studentIdErr.message);
      }
    }

    // Tier 3: Find student directly and generate application dossier view
    if (!application) {
      const student = await prisma.student.findUnique({
        where: { id: req.params.id },
        include: { githubStats: true, projects: true },
      });

      if (student) {
        application = {
          id: `app-${student.id}`,
          hrId: req.hrId || '',
          studentId: student.id,
          status: 'invited',
          notes: null,
          createdAt: student.createdAt || new Date(),
          updatedAt: student.updatedAt || new Date(),
          student,
          screeningResponses: [],
          meeting: null,
        };
      }
    }

    if (!application) {
      return res.status(404).json({ error: 'Candidate details not found.' });
    }

    // Defensive fallback defaults for student properties to guarantee clean rendering
    if (application.student) {
      application.student.skills = application.student.skills || [];
      application.student.projects = application.student.projects || [];
      application.student.githubStats = application.student.githubStats || null;
    }

    const responseData = {
      ...application,
      responses: application.screeningResponses || [],
    };
    return res.json(responseData);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/applications/:id/status ───────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['invited', 'reviewing', 'questions_sent', 'offered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await prisma.application.findFirst({
      where: { id: req.params.id, hrId: req.hrId },
      include: {
        student: { select: { email: true } },
        hr: { select: { fullName: true, companyName: true } },
      },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, ...(notes && { notes }) },
    });

    // Send email notification for significant status changes
    if (['offered', 'rejected', 'reviewing'].includes(status)) {
      sendApplicationStatusUpdate({
        to: application.student.email,
        companyName: application.hr.companyName,
        status,
      }).catch(console.error);
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/applications/:id/suggested ───────────────────────────────────────
// Returns similar student profiles based on the applied student's skills + GitHub languages
router.get('/:id/suggested', async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, hrId: req.hrId },
      include: { student: { include: { githubStats: true } } },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const targetSkills = application.student.skills || [];
    const targetLangs = Object.keys(application.student.githubStats?.topLanguages || {});
    const allKeywords = [...targetSkills, ...targetLangs].map((k) => k.toLowerCase());

    // Fetch all other students (excluding already-applied ones from this HR)
    const appliedStudentIds = (
      await prisma.application.findMany({
        where: { hrId: req.hrId },
        select: { studentId: true },
      })
    ).map((a) => a.studentId);

    const candidates = await prisma.student.findMany({
      where: { id: { notIn: appliedStudentIds } },
      include: { githubStats: true, projects: true },
    });

    const scored = candidates
      .map((s) => {
        const sSkills = (s.skills || []).map((k) => k.toLowerCase());
        const sLangs = Object.keys(s.githubStats?.topLanguages || {}).map((l) => l.toLowerCase());
        const overlap = [...sSkills, ...sLangs].filter((k) => allKeywords.includes(k)).length;
        return { ...s, overlap };
      })
      .filter((s) => s.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5)
      .map(({ githubAccessToken, githubId, ...safe }) => safe);

    return res.json({ suggested: scored });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
