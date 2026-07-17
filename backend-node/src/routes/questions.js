const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authenticateStudent } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/questions/ ───────────────────────────────────────────────────────
// Get all screening questions for the HR
router.get('/', authenticate, async (req, res, next) => {
  try {
    const questions = await prisma.screeningQuestion.findMany({
      where: { hrId: req.hrId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(questions);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/questions/ ──────────────────────────────────────────────────────
// Create a new screening question
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { question, isTemplate } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const newQuestion = await prisma.screeningQuestion.create({
      data: {
        hrId: req.hrId,
        question,
        isTemplate: isTemplate || false,
      },
    });
    return res.status(201).json(newQuestion);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/questions/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const question = await prisma.screeningQuestion.findFirst({
      where: { id: req.params.id, hrId: req.hrId },
    });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    await prisma.screeningQuestion.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/questions/assign/:applicationId ─────────────────────────────────
// Assign multiple questions to an application
router.post('/assign/:applicationId', authenticate, async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || !questionIds.length) {
      return res.status(400).json({ error: 'questionIds array is required' });
    }

    const application = await prisma.application.findFirst({
      where: { id: req.params.applicationId, hrId: req.hrId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Create empty responses for the assigned questions
    const responses = await Promise.all(
      questionIds.map((qId) =>
        prisma.screeningResponse.create({
          data: {
            applicationId: application.id,
            questionId: qId,
          },
        })
      )
    );

    // Update application status
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'questions_sent' },
    });

    return res.json({ message: 'Questions assigned', responses });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/questions/respond/:applicationId ────────────────────────────────
// Student submits answers to the assigned questions
router.post('/respond/:applicationId', authenticateStudent, async (req, res, next) => {
  try {
    const { answers } = req.body; // { responseId: "answer text" }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required' });
    }

    const application = await prisma.application.findFirst({
      where: { id: req.params.applicationId, studentId: req.studentId },
      include: { responses: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const updatePromises = Object.entries(answers).map(([responseId, answer]) => {
      const exists = application.responses.find((r) => r.id === responseId);
      if (exists) {
        return prisma.screeningResponse.update({
          where: { id: responseId },
          data: { answer, submittedAt: new Date() },
        });
      }
    });

    await Promise.all(updatePromises.filter(Boolean));
    return res.json({ message: 'Responses submitted successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questions/responses/:applicationId ───────────────────────────────
// HR views student answers
router.get('/responses/:applicationId', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: { id: req.params.applicationId, hrId: req.hrId },
      include: {
        responses: {
          include: { question: true },
        },
      },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    return res.json(application.responses);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
