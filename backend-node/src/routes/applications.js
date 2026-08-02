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

// Helper to safely fetch student and related stats/projects without fragile Prisma relation includes
async function fetchStudentWithRelations(studentId) {
  if (!studentId) return null;
  let student = null;
  try {
    student = await prisma.student.findUnique({ where: { id: studentId } });
  } catch (e) {
    console.warn('[Prisma] Error finding student by id:', e.message);
  }
  if (!student) return null;

  let githubStats = null;
  try {
    githubStats = await prisma.gitHubStats.findUnique({ where: { studentId } });
  } catch (e) {
    try {
      githubStats = await prisma.gitHubStats.findFirst({ where: { studentId } });
    } catch {}
  }

  let projects = [];
  try {
    projects = await prisma.hackathonProject.findMany({
      where: { studentId },
      orderBy: { juryRating: 'desc' },
    });
  } catch (e) {
    console.warn('[Prisma] Error finding projects:', e.message);
  }

  return {
    ...student,
    skills: student.skills || [],
    githubStats: githubStats || null,
    projects: projects || [],
  };
}

// ── GET /api/applications/ ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let applications = [];
    try {
      applications = await prisma.application.findMany({
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
    } catch (primaryErr) {
      console.warn('[Applications GET /] findMany with include failed, using fallback:', primaryErr.message);
      applications = await prisma.application.findMany({
        where: { hrId: req.hrId, ...(status && { status }) },
        orderBy: { updatedAt: 'desc' },
        include: {
          meeting: { select: { id: true, status: true, scheduledAt: true, calendlyEventUrl: true } },
        },
      });
      for (const app of applications) {
        app.student = await fetchStudentWithRelations(app.studentId);
      }
    }
    return res.json(applications);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/applications/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const paramId = req.params.id;
    let application = null;

    // 1. Try finding Application by primary ID
    try {
      application = await prisma.application.findUnique({
        where: { id: paramId },
        include: { meeting: true },
      });
    } catch (e) {
      console.warn('[Applications GET /:id] Application findUnique failed:', e.message);
    }

    // 2. If not found by application ID, try by studentId
    if (!application) {
      try {
        application = await prisma.application.findFirst({
          where: { studentId: paramId },
          include: { meeting: true },
        });
      } catch (e) {
        console.warn('[Applications GET /:id] Application findFirst by studentId failed:', e.message);
      }
    }

    const studentId = application ? application.studentId : paramId;
    const student = await fetchStudentWithRelations(studentId);

    if (!application && !student) {
      return res.status(404).json({ error: 'Candidate details not found.' });
    }

    // Safely load screening responses
    let screeningResponses = [];
    if (application) {
      try {
        screeningResponses = await prisma.screeningResponse.findMany({
          where: { applicationId: application.id },
          include: { question: true },
        });
      } catch (e) {
        console.warn('[Applications GET /:id] Screening responses query failed:', e.message);
      }
    }

    // Synthetic application object if student exists without formal application
    if (!application && student) {
      application = {
        id: `app-${student.id}`,
        hrId: req.hrId || '',
        studentId: student.id,
        status: 'invited',
        notes: null,
        createdAt: student.createdAt || new Date().toISOString(),
        updatedAt: student.updatedAt || new Date().toISOString(),
        meeting: null,
      };
    }

    const responseData = {
      ...application,
      student,
      screeningResponses,
      responses: screeningResponses,
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
        hr: { select: { fullName: true, companyName: true, email: true } },
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
        user: application.hr,
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
