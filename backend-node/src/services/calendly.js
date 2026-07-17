const axios = require('axios');

const CALENDLY_API = 'https://api.calendly.com';

const headers = () => ({
  Authorization: `Bearer ${process.env.CALENDLY_API_TOKEN}`,
  'Content-Type': 'application/json',
});

/**
 * Creates a one-off Calendly meeting event type and returns the scheduling link.
 * @param {object} options
 * @returns {{ schedulingUrl: string, eventUri: string }}
 */
async function createOneOffMeeting({ name, duration = 30, startTime }) {
  // Create a one-off event using Calendly's one-off-meeting API
  const { data } = await axios.post(
    `${CALENDLY_API}/one_off_event_types`,
    {
      name,
      host: process.env.CALENDLY_USER_URI,
      duration,
      // If a specific start time is given, restrict availability
      ...(startTime && {
        date_setting: {
          type: 'date_range',
          start_date: new Date(startTime).toISOString().split('T')[0],
          end_date: new Date(new Date(startTime).getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      }),
    },
    { headers: headers() }
  );

  return {
    schedulingUrl: data.resource.booking_url,
    eventUri: data.resource.uri,
  };
}

/**
 * Registers a webhook subscription to receive Calendly booking events.
 * Should be called once during server setup / via an admin endpoint.
 */
async function registerWebhook(callbackUrl) {
  const { data } = await axios.post(
    `${CALENDLY_API}/webhook_subscriptions`,
    {
      url: callbackUrl,
      events: ['invitee.created', 'invitee.canceled'],
      organization: process.env.CALENDLY_USER_URI,
      scope: 'user',
      signing_key: process.env.CALENDLY_WEBHOOK_SECRET,
    },
    { headers: headers() }
  );
  return data;
}

/**
 * Cancels a scheduled Calendly event.
 * @param {string} inviteeUri - Calendly invitee URI
 */
async function cancelMeeting(inviteeUri) {
  await axios.post(
    `${inviteeUri}/cancellation`,
    { reason: 'Cancelled by HR' },
    { headers: headers() }
  );
}

/**
 * Verifies Calendly webhook signature.
 * @param {string} payload - Raw request body string
 * @param {string} signature - Value from Calendly-Webhook-Signature header
 */
function verifyWebhookSignature(payload, signature) {
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', process.env.CALENDLY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOneOffMeeting, registerWebhook, cancelMeeting, verifyWebhookSignature };
