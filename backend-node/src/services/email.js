const nodemailer = require('nodemailer');

const isSmtpConfigured =
  process.env.SMTP_HOST &&
  !process.env.SMTP_HOST.startsWith('your_') &&
  !process.env.SMTP_HOST.includes('placeholder') &&
  process.env.SMTP_USER;

const transporter = isSmtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

async function sendMailSafe(options) {
  if (!isSmtpConfigured || !transporter) {
    console.log('[SMTP SKIPPED] Email sending skipped (unconfigured):', options.subject);
    return;
  }
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.warn('[SMTP ERROR] Failed to send email via SMTP, but continuing:', err.message);
  }
}

/**
 * Send a meeting invite to a student with a Calendly booking link.
 */
async function sendMeetingInvite({ to, hrName, companyName, title, scheduledAt, calendlyLink }) {
  const formattedTime = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Scheduled by HR';
  await sendMailSafe({
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
  await sendMailSafe({
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
  await sendMailSafe({
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

  await sendMailSafe({
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

async function sendDocumentEmail({ to, subject, htmlContent }) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: htmlContent,
  });
}

module.exports = {
  sendMeetingInvite,
  sendMeetingCancellation,
  sendMessageNotification,
  sendApplicationStatusUpdate,
  sendDocumentEmail,
};
