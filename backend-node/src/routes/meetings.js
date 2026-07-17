const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { createOneOffMeeting, cancelMeeting, verifyWebhookSignature } = require('../services/calendly');
const { sendMeetingInvite, sendMeetingCancellation } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

// ── POST /api/meetings/ ───────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { applicationId, title, duration, startTime, description } = req.body;
    if (!applicationId || !title) return res.status(400).json({ error: 'applicationId and title are required' });

    const application = await prisma.application.findFirst({
      where: { id: applicationId, hrId: req.hrId },
      include: {
        student: true,
        hr: true,
      },
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // 1. Create Calendly one-off event link
    const { schedulingUrl, eventUri } = await createOneOffMeeting({
      name: title,
      duration,
      startTime,
    });

    // 2. Save meeting to DB
    const meeting = await prisma.meeting.create({
      data: {
        hrId: req.hrId,
        applicationId,
        title,
        description,
        calendlyEventUrl: schedulingUrl,
        calendlyEventId: eventUri,
        status: 'scheduled',
      },
    });

    // 3. Send email to student
    await sendMeetingInvite({
      to: application.student.email,
      hrName: application.hr.fullName,
      companyName: application.hr.companyName,
      title,
      calendlyLink: schedulingUrl,
    });

    return res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/meetings/ ────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: { hrId: req.hrId },
      include: { application: { include: { student: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(meetings);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/meetings/:id ──────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: { id: req.params.id, hrId: req.hrId },
      include: { application: { include: { student: true, hr: true } } },
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Cancel in Calendly if it's already booked (has invitee URI)
    if (meeting.calendlyInviteeUri) {
      try {
        await cancelMeeting(meeting.calendlyInviteeUri);
      } catch (err) {
        console.error('Failed to cancel Calendly meeting:', err.message);
      }
    }

    // Update DB status
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: 'cancelled' },
    });

    // Send cancellation email
    if (meeting.application) {
      await sendMeetingCancellation({
        to: meeting.application.student.email,
        hrName: meeting.application.hr.fullName,
        companyName: meeting.application.hr.companyName,
        title: meeting.title,
      });
    }

    return res.json({ message: 'Meeting cancelled' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/meetings/webhooks/calendly ──────────────────────────────────────
router.post('/webhooks/calendly', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['calendly-webhook-signature'];
    const payload = req.body.toString(); // assuming express.raw is used

    // Verify webhook
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    const { event: eventType, payload: eventData } = event;

    if (eventType === 'invitee.created') {
      const eventUri = eventData.event;
      // Find meeting matching this event URI
      const meeting = await prisma.meeting.findFirst({
        where: { calendlyEventId: eventUri },
      });

      if (meeting) {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            status: 'confirmed',
            scheduledAt: new Date(eventData.event_start_time), // Note: need to fetch actual event for start time if not in payload
            calendlyInviteeUri: eventData.uri,
          },
        });
      }
    } else if (eventType === 'invitee.canceled') {
      const inviteeUri = eventData.uri;
      await prisma.meeting.updateMany({
        where: { calendlyInviteeUri: inviteeUri },
        data: { status: 'cancelled' },
      });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
