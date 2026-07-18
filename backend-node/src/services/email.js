const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a meeting invite to a student with a Calendly booking link.
 */
async function sendMeetingInvite({ to, hrName, companyName, title, calendlyLink }) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Meeting Invitation from ${companyName} — ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2D136F;">You've been invited to a meeting!</h2>
        <p>Hi there,</p>
        <p><strong>${hrName}</strong> from <strong>${companyName}</strong> would like to schedule a meeting with you regarding: <strong>${title}</strong></p>
        <p>Please use the link below to choose a time that works best for you:</p>
        <a href="${calendlyLink}" style="display:inline-block; background:#2D136F; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; margin-top:10px;">
          📅 Book Your Meeting
        </a>
        <p style="margin-top:20px; color:#666; font-size:12px;">Powered by STUDLYF HR Platform</p>
      </div>
    `,
  });
}

/**
 * Send a meeting cancellation notice.
 */
async function sendMeetingCancellation({ to, hrName, companyName, title }) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
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
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
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
