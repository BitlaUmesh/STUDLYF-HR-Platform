const { Resend } = require('resend');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EMAIL DELIVERY — RESEND ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 * All outbound mail (documents, meeting invites, notifications, OTPs) is sent
 * through Resend using STUDLYF's own verified sender address.
 *
 * For HR-initiated mail the envelope is shaped so that:
 *   From     : "{HR Name} via STUDLYF" <sender@studlyf-domain>
 *   Reply-To : the HR's real email address
 *
 * This means the candidate sees who the mail is from, but any reply they write
 * goes straight to the HR's own inbox. STUDLYF does not receive, store, or
 * process replies — there is no inbound mail handling in this system — so the
 * conversation after the initial send is entirely between HR and candidate.
 */

/** Address STUDLYF sends from. Swap to a verified domain address in .env. */
function getSenderAddress() {
  return process.env.RESEND_SENDER_ADDRESS || 'onboarding@resend.dev';
}

/** From header used for platform/system mail (OTPs) with no HR attribution. */
function getSystemFromAddress() {
  return process.env.RESEND_FROM || `STUDLYF HR <${getSenderAddress()}>`;
}

/**
 * Strip characters that would corrupt an RFC 5322 display name.
 */
function sanitizeDisplayName(name) {
  return String(name || '')
    .replace(/[\r\n"\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build the "{HR Name} via STUDLYF" <sender> From header.
 */
function buildHrFromAddress(hrName) {
  const safeName = sanitizeDisplayName(hrName) || 'HR';
  return `"${safeName} via STUDLYF" <${getSenderAddress()}>`;
}

/**
 * Get a Resend client, or null when no API key is configured.
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Normalize attachments into the shape Resend expects.
 *
 * Resend's API wants `content` as a Base64 string. Passing a Buffer would be
 * JSON-serialized as a byte array, which roughly triples the request size and
 * counts against the 40MB email limit — so Buffers are encoded here instead.
 */
function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined;

  return attachments
    .filter((att) => att && att.filename && att.content)
    .map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
      ...(att.contentType ? { contentType: att.contentType } : {}),
    }));
}

/**
 * Low-level Resend dispatch shared by all senders.
 */
async function dispatch({ from, to, replyTo, subject, html, attachments, logLabel }) {
  const resend = getResendClient();

  if (!resend) {
    console.error('[EMAIL] RESEND_API_KEY is not set — cannot send email.');
    return {
      ok: false,
      code: 'EMAIL_NOT_CONFIGURED',
      error: 'Email delivery is not configured on the server. Please contact your administrator.',
    };
  }

  if (!to) {
    return { ok: false, error: 'A recipient email address is required.' };
  }

  if (!html) {
    return { ok: false, error: 'Email content is required.' };
  }

  try {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject: subject || '(no subject)',
      html,
    };

    if (replyTo) payload.replyTo = replyTo;

    const normalizedAttachments = normalizeAttachments(attachments);
    if (normalizedAttachments && normalizedAttachments.length > 0) {
      payload.attachments = normalizedAttachments;
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error(`[${logLabel} FAILED]`, error.message || error);
      return { ok: false, error: error.message || 'Resend rejected the email.' };
    }

    console.log(`[${logLabel}] to=${to} replyTo=${replyTo || 'none'} id=${data?.id}`);
    return { ok: true, messageId: data?.id, provider: 'resend' };
  } catch (err) {
    console.error(`[${logLabel} ERROR]`, err?.message || err);
    return { ok: false, error: err?.message || 'Unexpected error while sending email.' };
  }
}

/**
 * Send mail on behalf of an HR user.
 *
 * Sends via STUDLYF's Resend sender, attributed to the HR by display name,
 * with Reply-To pointed at the HR's real inbox so replies bypass STUDLYF.
 *
 * When no user is supplied (e.g. signup OTPs, where no HR exists yet) this
 * falls back to the neutral system sender.
 */
async function sendMailForUser(user, options = {}) {
  const hrEmail = user?.email;

  if (!hrEmail) {
    return await sendSystemMail({
      to: options.to,
      subject: options.subject,
      html: options.htmlContent || options.html,
      attachments: options.attachments,
    });
  }

  return await dispatch({
    from: buildHrFromAddress(user.fullName),
    to: options.to,
    replyTo: hrEmail,
    subject: options.subject,
    html: options.htmlContent || options.html,
    attachments: options.attachments,
    logLabel: 'RESEND HR EMAIL',
  });
}

/**
 * Platform mail with no HR attribution (OTPs, account notices).
 * Deliberately carries no Reply-To.
 */
async function sendSystemMail(options = {}) {
  return await dispatch({
    from: getSystemFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.htmlContent || options.html,
    attachments: options.attachments,
    logLabel: 'RESEND SYSTEM EMAIL',
  });
}

/**
 * Document email sender used by the documents route (offer / joining letters).
 */
async function sendDocumentEmail({ user, to, subject, htmlContent, attachment }) {
  const attachments = [];
  if (attachment && attachment.content && attachment.filename) {
    // attachment.content already arrives Base64-encoded from the builder.
    attachments.push({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType || 'application/octet-stream',
    });
  }

  return await sendMailForUser(user, {
    to,
    subject,
    htmlContent,
    attachments,
  });
}

/**
 * Send meeting invite.
 */
async function sendMeetingInvite({ user, to, hrName, companyName, title, scheduledAt, calendlyLink }) {
  const formattedTime = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Scheduled by HR';
  return await sendMailForUser(user, {
    to,
    subject: `Interview Scheduled with ${companyName} — ${title}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2D136F; margin-top:0;">Interview Scheduled!</h2>
        <p>Hi there,</p>
        <p><strong>${hrName}</strong> from <strong>${companyName}</strong> has scheduled an interview with you regarding: <strong>${title}</strong></p>
        <div style="background-color: #f8fafc; border-left: 4px solid #2D136F; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;">Interview Date & Time:</p>
          <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: bold; color: #0f172a;">📅 ${formattedTime}</p>
        </div>
        ${calendlyLink ? `<a href="${calendlyLink}" style="display:inline-block; background:#2D136F; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">View Meeting Link</a>` : ''}
        <p style="margin-top:24px; color:#94a3b8; font-size:12px;">Powered by STUDLYF HR Platform</p>
      </div>
    `,
  });
}

/**
 * Send meeting cancellation notice.
 */
async function sendMeetingCancellation({ user, to, hrName, companyName, title }) {
  return await sendMailForUser(user, {
    to,
    subject: `Meeting Cancelled — ${title}`,
    htmlContent: `
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
 * Notify student of new message.
 */
async function sendMessageNotification({ user, to, hrName, companyName, preview }) {
  return await sendMailForUser(user, {
    to,
    subject: `New message from ${companyName}`,
    htmlContent: `
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
 * Send application status update.
 */
async function sendApplicationStatusUpdate({ user, to, companyName, status }) {
  const statusMap = {
    offered: { label: "Congratulations! You've received an offer 🎉", color: '#27ae60' },
    rejected: { label: 'Application Update', color: '#c0392b' },
    reviewing: { label: 'Your application is under review', color: '#2D136F' },
  };

  const info = statusMap[status] || { label: 'Application Update', color: '#2D136F' };

  return await sendMailForUser(user, {
    to,
    subject: `${info.label} — ${companyName}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: ${info.color};">${info.label}</h2>
        <p>Your application with <strong>${companyName}</strong> has been updated to: <strong>${status.toUpperCase()}</strong></p>
        <p>Log in to STUDLYF HR to view details.</p>
      </div>
    `,
  });
}

module.exports = {
  sendMailForUser,
  sendSystemMail,
  sendDocumentEmail,
  sendMeetingInvite,
  sendMeetingCancellation,
  sendMessageNotification,
  sendApplicationStatusUpdate,
};
