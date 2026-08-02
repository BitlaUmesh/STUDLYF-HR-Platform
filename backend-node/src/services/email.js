const { Resend } = require('resend');

/**
 * Get a Resend client instance.
 * Returns null if RESEND_API_KEY is not configured.
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * The verified FROM address to use.
 * If you haven't verified a domain on Resend, use the default onboarding address.
 * Once your domain is verified, set RESEND_FROM in env vars.
 */
function getFromAddress() {
  return process.env.RESEND_FROM || process.env.SMTP_FROM || 'STUDLYF HR <onboarding@resend.dev>';
}

/**
 * Core send function. All email functions route through here.
 */
async function sendMailSafe(options) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('[RESEND WARNING] RESEND_API_KEY not configured on server.');
    return { ok: false, error: 'Email service not configured. Please set RESEND_API_KEY on the server.' };
  }

  const fromAddress = options.from || getFromAddress();

  const mailPayload = {
    from: fromAddress,
    to: [options.to],
    subject: options.subject,
    html: options.html,
    reply_to: options.replyTo,
  };

  // Attach plain text alternative if provided
  if (options.text) {
    mailPayload.text = options.text;
  }

  // Attach file attachments if provided
  if (options.attachments && options.attachments.length > 0) {
    mailPayload.attachments = options.attachments.map((a) => ({
      filename: a.filename,
      content: a.content, // Buffer or base64 string
    }));
  }

  try {
    const { data, error } = await resend.emails.send(mailPayload);

    if (error) {
      console.error('[RESEND ERROR] Failed to send email:', error.message, '| To:', options.to);
      return { ok: false, error: error.message };
    }

    console.log('[RESEND SUCCESS] Email sent to:', options.to, 'ID:', data?.id);
    return { ok: true, messageId: data?.id };
  } catch (err) {
    console.error('[RESEND EXCEPTION]', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Verify Resend API key is configured. Useful for health checks.
 */
async function verifySmtpConnection() {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }
  // Resend doesn't have a verify endpoint, but we can check the key is present
  return { ok: true, message: 'Resend API key is configured' };
}

/**
 * Send a meeting invite to a student with a Calendly booking link.
 */
async function sendMeetingInvite({ to, hrName, companyName, title, scheduledAt, calendlyLink, replyTo }) {
  const formattedTime = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Scheduled by HR';
  return await sendMailSafe({
    to,
    subject: `Interview Scheduled with ${companyName} — ${title}`,
    replyTo,
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
async function sendMeetingCancellation({ to, hrName, companyName, title, replyTo }) {
  return await sendMailSafe({
    to,
    subject: `Meeting Cancelled — ${title}`,
    replyTo,
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
async function sendMessageNotification({ to, hrName, companyName, preview, replyTo }) {
  return await sendMailSafe({
    to,
    subject: `New message from ${companyName}`,
    replyTo,
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
async function sendApplicationStatusUpdate({ to, companyName, status, replyTo }) {
  const statusMap = {
    offered: { label: "Congratulations! You've received an offer 🎉", color: '#27ae60' },
    rejected: { label: 'Application Update', color: '#c0392b' },
    reviewing: { label: 'Your application is under review', color: '#2D136F' },
  };

  const info = statusMap[status] || { label: 'Application Update', color: '#2D136F' };

  return await sendMailSafe({
    to,
    subject: `${info.label} — ${companyName}`,
    replyTo,
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
 * @param {string|undefined} opts.replyTo - Reply-To address (HR email)
 */
async function sendDocumentEmail({ to, subject, htmlContent, attachment, replyTo }) {
  const mailOptions = {
    to,
    subject,
    html: htmlContent,
    replyTo,
  };

  if (attachment && attachment.content && attachment.filename) {
    mailOptions.attachments = [
      {
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'base64'),
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
  verifySmtpConnection,
};
