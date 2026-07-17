const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { sendMessageNotification } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ── POST /api/messages/ ───────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { studentId, content } = req.body;
    if (!studentId || !content) return res.status(400).json({ error: 'studentId and content are required' });

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const hr = await prisma.user.findUnique({ where: { id: req.hrId } });

    const message = await prisma.message.create({
      data: {
        hrId: req.hrId,
        studentId,
        content,
      },
    });

    // Send email notification to student
    await sendMessageNotification({
      to: student.email,
      hrName: hr.fullName,
      companyName: hr.companyName,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    });

    return res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/messages/conversations ───────────────────────────────────────────
router.get('/conversations', async (req, res, next) => {
  try {
    // Get unique students that HR has messaged
    const messages = await prisma.message.findMany({
      where: { hrId: req.hrId },
      orderBy: { sentAt: 'desc' },
      include: { student: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Group by student
    const conversations = {};
    for (const msg of messages) {
      if (!conversations[msg.studentId]) {
        conversations[msg.studentId] = {
          student: msg.student,
          lastMessage: msg,
          unreadCount: !msg.isRead ? 1 : 0, // This needs to be calculated for student replies if 2-way
        };
      } else if (!msg.isRead) {
        conversations[msg.studentId].unreadCount++;
      }
    }

    return res.json(Object.values(conversations));
  } catch (err) {
    next(err);
  }
});

// ── GET /api/messages/:studentId ──────────────────────────────────────────────
router.get('/:studentId', async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { hrId: req.hrId, studentId: req.params.studentId },
      orderBy: { sentAt: 'asc' },
    });
    return res.json(messages);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/messages/:id/read ──────────────────────────────────────────────
router.patch('/:id/read', async (req, res, next) => {
  try {
    const message = await prisma.message.findFirst({
      where: { id: req.params.id, hrId: req.hrId },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
