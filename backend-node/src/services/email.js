const axios = require('axios');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const prisma = require('../db');
const { decrypt } = require('../utils/encryption');

/**
 * Get a global Resend client instance (used as system fallback for platform OTPs).
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Get a fresh Google OAuth access token for a user, auto-refreshing if expired.
 */
async function getFreshGoogleToken(user) {
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return null;
  }

  const isExpired = !user.googleTokenExpiry || new Date(user.googleTokenExpiry).getTime() <= Date.now() + 60000;

  if (!isExpired && user.googleAccessToken) {
    return user.googleAccessToken;
  }

  if (!user.googleRefreshToken) {
    return user.googleAccessToken || null;
  }

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.googleRefreshToken,
      grant_type: 'refresh_token',
    });

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;
    const newExpiry = new Date(Date.now() + expiresIn * 1000);

    // Save refreshed token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleAccessToken: newAccessToken,
        googleTokenExpiry: newExpiry,
      },
    }).catch(console.error);

    return newAccessToken;
  } catch (err) {
    console.error('[Gmail Token Refresh Error]', err?.response?.data || err.message);
    return user.googleAccessToken || null;
  }
}

/**
 * Construct an RFC 2822 MIME raw message encoded as Base64URL for Gmail API.
 */
function buildMimeMessage({ from, to, subject, html, attachments }) {
  const boundary = `__STUDLYF_HR_BOUNDARY_${Date.now()}__`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `MIME-Version: 1.0`,
  ];

  if (attachments && attachments.length > 0) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`, '');
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/html; charset=UTF-8`, `Content-Transfer-Encoding: base64`, '');
    lines.push(Buffer.from(html).toString('base64'), '');

    for (const att of attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.contentType || 'application/octet-stream'}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`, '');
      const contentBase64 = typeof att.content === 'string' ? att.content : Buffer.from(att.content).toString('base64');
      lines.push(contentBase64, '');
    }
    lines.push(`--${boundary}--`);
  } else {
    lines.push(`Content-Type: text/html; charset=UTF-8`, `Content-Transfer-Encoding: base64`, '');
    lines.push(Buffer.from(html).toString('base64'));
  }

  const mimeString = lines.join('\r\n');
  return Buffer.from(mimeString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Primary send mail function evaluated on per-user basis.
 * Priority order:
 * 1. Google OAuth / Gmail API (Sends directly out of HR's inbox)
 * 2. User's Encrypted Custom SMTP (Hostinger, MS 365, etc.)
 * 3. Returns explicit EMAIL_NOT_CONFIGURED error if neither is available.
 */
async function sendMailForUser(user, options) {
  if (!user) {
    return {
      ok: false,
      code: 'EMAIL_NOT_CONFIGURED',
      error: 'User account required to verify email credentials.',
    };
  }

  const hrName = user.fullName || 'HR';
  const hrEmail = user.email;

  // ── 1. Google OAuth / Gmail API ─────────────────────────────────────────────
  const googleToken = await getFreshGoogleToken(user);
  if (googleToken) {
    try {
      const fromString = `"${hrName}" <${hrEmail}>`;
      const rawMessage = buildMimeMessage({
        from: fromString,
        to: options.to,
        subject: options.subject,
        html: options.htmlContent || options.html,
        attachments: options.attachments,
      });

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: rawMessage },
        {
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[GMAIL API SUCCESS] Sent from ${hrEmail} to ${options.to} | MessageId: ${response.data.id}`);
      return { ok: true, messageId: response.data.id, provider: 'gmail_api' };
    } catch (gmailErr) {
      const apiErr = gmailErr?.response?.data?.error?.message || gmailErr.message;
      console.error('[GMAIL API ERROR]', apiErr);
      // If Gmail API failed due to ungranted scope or invalid token, continue to SMTP check below
    }
  }

  // ── 2. User's Encrypted Custom SMTP ─────────────────────────────────────────
  if (user.smtpHost && user.smtpUser && user.smtpPassEncrypted) {
    try {
      const decryptedPassword = decrypt(user.smtpPassEncrypted);
      if (decryptedPassword) {
        const port = user.smtpPort || 587;
        const transporter = nodemailer.createTransport({
          host: user.smtpHost,
          port: port,
          secure: port === 465,
          auth: {
            user: user.smtpUser,
            pass: decryptedPassword,
          },
          tls: { rejectUnauthorized: false },
        });

        const fromAddr = user.smtpFrom || `"${hrName}" <${user.smtpUser}>`;
        const mailOptions = {
          from: fromAddr,
          to: options.to,
          subject: options.subject,
          html: options.htmlContent || options.html,
          replyTo: hrEmail,
          attachments: options.attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[CUSTOM SMTP SUCCESS] Sent from ${user.smtpUser} to ${options.to} | MessageId: ${info.messageId}`);
        return { ok: true, messageId: info.messageId, provider: 'custom_smtp' };
      }
    } catch (smtpErr) {
      console.error('[CUSTOM SMTP ERROR]', smtpErr.message);
      return { ok: false, error: `Custom SMTP error: ${smtpErr.message}` };
    }
  }

  // ── 3. Explicit UNCONFIGURED handling (No generic automatic fallback) ──────
  return {
    ok: false,
    code: 'EMAIL_NOT_CONFIGURED',
    error: 'Your account is not connected to Google Workspace/Gmail, and no custom SMTP settings were found. Please connect your Google account or configure your custom SMTP credentials in Profile Settings.',
  };
}

/**
 * System OTP sender (used for password reset / signup OTPs). Uses Resend if present.
 */
async function sendSystemMail(options) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[SYSTEM EMAIL] Resend not configured. Printing to console:');
    console.log(`[SYSTEM EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return { ok: true, messageId: 'dev_console' };
  }

  try {
    const fromAddress = process.env.RESEND_FROM || 'STUDLYF HR <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Document email sender used by documents.js route.
 */
async function sendDocumentEmail({ user, to, subject, htmlContent, attachment }) {
  const attachments = [];
  if (attachment && attachment.content && attachment.filename) {
    attachments.push({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
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
