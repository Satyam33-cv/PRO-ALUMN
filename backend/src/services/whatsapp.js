// apps/api/src/services/whatsapp.js
// Twilio WhatsApp wrapper — gracefully falls back to console logs when not configured
const twilio = require('twilio');

const SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

const client = SID && AUTH_TOKEN ? twilio(SID, AUTH_TOKEN) : null;

async function sendWhatsApp({ to, message }) {
  // Expects to in E.164 phone format, e.g. "+919876543210"
  if (!client || !FROM) {
    console.log(`💬 [WHATSAPP PLACEHOLDER] To: ${to} | ${message}`);
    return { delivered: false, reason: 'twilio not configured' };
  }
  if (!/^\+?[1-9]\d{9,14}$/.test(to || '')) {
    console.log(`💬 [WHATSAPP SKIPPED] Invalid phone: ${to} | ${message}`);
    return { delivered: false, reason: 'invalid phone number' };
  }
  try {
    const target = to.startsWith('+') ? to : `+${to}`;
    await client.messages.create({
      from: FROM,
      to: `whatsapp:${target}`,
      body: message,
    });
    console.log(`💬 [WHATSAPP SENT] To: ${target} | ${message.slice(0, 60)}...`);
    return { delivered: true };
  } catch (err) {
    console.error('WhatsApp send failed:', err.message);
    return { delivered: false, reason: err.message };
  }
}

module.exports = { sendWhatsApp };
