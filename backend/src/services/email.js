// apps/api/src/services/email.js
// SendGrid email wrapper — gracefully falls back to console logs when not configured
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = process.env.EMAIL_FROM || 'PRO ALUMN <no-reply@pro-alumn.local>';
const PORTAL_URL = process.env.WEB_URL || 'http://localhost:3000';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function send({ to, subject, text, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`📧 [EMAIL PLACEHOLDER] To: ${to} | Subject: ${subject}\n${text}`);
    return { delivered: false, reason: 'no SENDGRID_API_KEY' };
  }
  try {
    await sgMail.send({ to, from: FROM, subject, text, html });
    console.log(`📧 [EMAIL SENT] To: ${to} | ${subject}`);
    return { delivered: true };
  } catch (err) {
    console.error('Email send failed:', err.response?.body || err.message);
    return { delivered: false, reason: err.response?.body || err.message };
  }
}

function layout(title, bodyHtml, ctaText, ctaHref) {
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#4f46e5;color:#fff;padding:18px 24px;font-size:18px;font-weight:700">🎓 PRO ALUMN</div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px;color:#1e293b">${title}</h2>
        <div style="color:#475569;line-height:1.6">${bodyHtml}</div>
        ${ctaText && ctaHref ? `<div style="margin:20px 0"><a href="${ctaHref}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">${ctaText}</a></div>` : ''}
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">PRO ALUMN · Alumni Engagement &amp; Career Referral Platform</p>
      </div>
    </div>`;
}

// Welcome email for CSV-imported alumni
async function sendWelcomeEmail({ to, name, tempPassword }) {
  const safeName = escapeHtml(name);
  return send({
    to,
    subject: 'Welcome to PRO ALUMN!',
    text: `Hi ${name},\n\nYour alumni account has been created.\n\nLogin at ${PORTAL_URL}\nEmail: ${to}\nTemporary password: ${tempPassword}\n\nPlease change your password after first login.`,
    html: layout('Welcome to PRO ALUMN 👋',
      `<p>Hi <strong>${safeName}</strong>, your verified alumni account is ready.</p>
       <p><strong>Email:</strong> ${escapeHtml(to)}<br/><strong>Temporary password:</strong> <code style="background:#eef2ff;padding:2px 6px;border-radius:4px">${escapeHtml(tempPassword)}</code></p>
       <p>Sign in and update your profile to start posting jobs, giving referrals, and mentoring students.</p>`,
      'Login to Portal', PORTAL_URL),
  });
}

// Referral status change (accepted / referred / hired / rejected...)
async function sendReferralStatusEmail({ to, name, status, jobTitle, company }) {
  const labels = {
    ACCEPTED: 'Your referral request was accepted',
    REJECTED: 'Your referral request was declined',
    REFERRED: 'You were referred to the company',
    HIRED: '🎉 You got hired!',
    NOT_HIRED: 'Update on your referral',
  };
  const safeName = escapeHtml(name);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeCompany = escapeHtml(company);
  return send({
    to,
    subject: `PRO ALUMN — ${labels[status] || 'Referral update'}`,
    text: `Hi ${name},\n\n${labels[status] || 'Your referral status changed'} for ${jobTitle} at ${company}.\nTrack it at ${PORTAL_URL}/referrals/me`,
    html: layout(labels[status] || 'Referral update',
      `<p>Hi <strong>${safeName}</strong>,</p><p>${labels[status] || 'Your referral status changed'} for <strong>${safeJobTitle}</strong> at <strong>${safeCompany}</strong>.</p>`,
      'View My Referrals', `${PORTAL_URL}/referrals/me`),
  });
}

// New referral request received by alumni
async function sendNewReferralEmail({ to, name, studentName, jobTitle, company }) {
  const safeName = escapeHtml(name);
  const safeStudentName = escapeHtml(studentName);
  const safeJobTitle = escapeHtml(jobTitle);
  const safeCompany = escapeHtml(company);
  return send({
    to,
    subject: 'You have a new referral request',
    text: `Hi ${name},\n\n${studentName} requested a referral for ${jobTitle} at ${company}.\nReview it at ${PORTAL_URL}/referrals/me`,
    html: layout('New Referral Request ✉️',
      `<p>Hi <strong>${safeName}</strong>,</p><p><strong>${safeStudentName}</strong> requested a referral for <strong>${safeJobTitle}</strong> at <strong>${safeCompany}</strong>.</p>`,
      'Review Request', `${PORTAL_URL}/referrals/me`),
  });
}

// Story approved
async function sendStoryApprovedEmail({ to, name, storyTitle }) {
  const safeName = escapeHtml(name);
  const safeStoryTitle = escapeHtml(storyTitle);
  return send({
    to,
    subject: 'Your success story is live!',
    text: `Hi ${name},\n\nYour story "${storyTitle}" was approved and is now on the Spotlight Wall.\nSee it at ${PORTAL_URL}/stories`,
    html: layout('Story Approved ✨',
      `<p>Hi <strong>${safeName}</strong>,</p><p>Your story <em>"${safeStoryTitle}"</em> was approved and is now live on the Spotlight Wall.</p>`,
      'View Stories', `${PORTAL_URL}/stories`),
  });
}

module.exports = { send, sendWelcomeEmail, sendReferralStatusEmail, sendNewReferralEmail, sendStoryApprovedEmail };
