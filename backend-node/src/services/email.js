const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  try {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } catch (err) {
    console.error('[SMTP Transporter Creation Error]', err.message);
    return null;
  }
}

async function sendMailSafe(options) {
  const transporter = getTransporter();
  if (!transporter || typeof transporter.sendMail !== 'function') {
    console.log('[SMTP SKIPPED] Email credentials not configured. Subject:', options.subject);
    return { ok: true, skipped: true, message: 'SMTP credentials not configured' };
  }

  // High Priority, Alert & Deliverability Headers
  const defaultHeaders = {
    'X-Priority': '1', // 1 = Highest / Urgent
    'X-MSMail-Priority': 'High',
    'Importance': 'High',
    'Priority': 'urgent',
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
  };

  const mailOptions = {
    ...options,
    priority: 'high',
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  // Generate plain text alternative for multipart MIME deliverability (prevents spam filters)
  if (options.html && !options.text) {
    mailOptions.text = options.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP SUCCESS] Email sent to:', options.to, 'MessageId:', info?.messageId);
    return { ok: true, messageId: info?.messageId };
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send email via SMTP:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send a meeting invite to a student with a Calendly booking link.
 */
async function sendMeetingInvite({ to, hrName, companyName, title, scheduledAt, calendlyLink }) {
  const formattedTime = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Scheduled by HR';
  return await sendMailSafe({
    from: process.env.SMTP_FROM || 'no-reply@studlyf.com',
    to,
    subject: `Interview Scheduled with ${companyName} — ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2D136F; margin-top:0;">Interview Scheduled!</h2>
        <p>Hi there,</p>
        <p><strong>${hrName}</strong> from <strong>${companyName}</strong> has scheduled an interview with you regarding: <strong>${title}</strong></p>
        <div style="background-color: #f8fafc; border-left: 4px solid #2D136F; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Interview Date & Time:</p>
          <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: bold; color: #0f172a;">📅 ${formattedTime}</p>
        </div>
        <p style="color: #475569; font-size: 14px;">Please ensure you are punctual and ready for the interview at this exact time.</p>
        ${calendlyLink ? `<a href="${calendlyLink}" style="display:inline-block; background:#2D136F; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">View Meeting Link</a>` : ''}
        <p style="margin-top:24px; color:#94a3b8; font-size:12px;">Powered by STUDLYF HR Platform</p>
      </div>
    `,
  });
}

/**
 * Send a meeting cancellation notice.
 */
async function sendMeetingCancellation({ to, hrName, companyName, title }) {
  return await sendMailSafe({
    from: process.env.SMTP_FROM || 'no-reply@studlyf.com',
    to,
    subject: `Meeting Cancelled — ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #c0392b;">Meeting Cancelled</h2>
        <p>Hi there,</p>
        <p><strong>${hrName}</strong> from <strong>${companyName}</strong> has cancelled the meeting: <strong>${title}</strong>.</p>
        <p>Please reach out to them directly if you have any questions.</p>
        <p style="margin-top:20px; color:#666; font-size:12px;">Powered by STUDLYF HR Platform</p>
      </div>
    `,
  });
}

/**
 * Notify a student that they received a new message from HR.
 */
async function sendMessageNotification({ to, hrName, companyName, preview }) {
  return await sendMailSafe({
    from: process.env.SMTP_FROM || 'no-reply@studlyf.com',
    to,
    subject: `New message from ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2D136F;">New Message</h2>
        <p>You have a new message from <strong>${hrName}</strong> at <strong>${companyName}</strong>:</p>
        <blockquote style="border-left:4px solid #2D136F; padding-left:12px; color:#444;">
          ${preview}
        </blockquote>
        <p>Log in to STUDLYF to reply.</p>
      </div>
    `,
  });
}

/**
 * Notify a student of their application status change.
 */
async function sendApplicationStatusUpdate({ to, companyName, status }) {
  const statusMap = {
    offered: { label: "Congratulations! You've received an offer 🎉", color: '#27ae60' },
    rejected: { label: 'Application Update', color: '#c0392b' },
    reviewing: { label: 'Your application is under review', color: '#2D136F' },
  };

  const info = statusMap[status] || { label: 'Application Update', color: '#2D136F' };

  return await sendMailSafe({
    from: process.env.SMTP_FROM || 'no-reply@studlyf.com',
    to,
    subject: `${info.label} — ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: ${info.color};">${info.label}</h2>
        <p>Your application with <strong>${companyName}</strong> has been updated to: <strong>${status.toUpperCase()}</strong></p>
        <p>Log in to STUDLYF HR to view details.</p>
      </div>
    `,
  });
}

/**
 * Send a document (offer/joining letter) via email with an optional attachment.
 * @param {object} opts
 * @param {string} opts.to - Recipient email address
 * @param {string} opts.subject - Email subject
 * @param {string} opts.htmlContent - HTML body of the email
 * @param {{ filename: string; content: string; contentType: string }|undefined} opts.attachment - Optional base64 file attachment
 */
async function sendDocumentEmail({ to, subject, htmlContent, attachment }) {
  const fromAddress = process.env.SMTP_FROM || (process.env.SMTP_USER ? `STUDLYF HR <${process.env.SMTP_USER}>` : 'STUDLYF HR <no-reply@studlyf.com>');

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html: htmlContent,
  };

  if (attachment && attachment.content && attachment.filename) {
    mailOptions.attachments = [
      {
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'base64'),
        contentType: attachment.contentType || 'application/octet-stream',
      },
    ];
  }

  return await sendMailSafe(mailOptions);
}

module.exports = {
  sendMeetingInvite,
  sendMeetingCancellation,
  sendMessageNotification,
  sendApplicationStatusUpdate,
  sendDocumentEmail,
};
