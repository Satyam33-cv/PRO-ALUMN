// backend/src/services/email.js
// Centralized, unified email service for PRO ALUMN
// Primary: Resend API (3,000 free emails/mo)
// Secondary: Nodemailer (SMTP / Gmail App Password)
// Fallback: Non-blocking console mock in local development (zero errors)

const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const FROM = process.env.EMAIL_FROM || 'PRO ALUMN <support@proalumn.dpdns.org>';
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

/**
 * Core Universal Email Dispatcher
 * Supports both object style: sendEmail({ to, subject, html })
 * and positional style: sendEmail(to, subject, html)
 */
async function sendEmail(toOrOptions, subjectParam, htmlParam, textParam) {
  let to, subject, html, text;
  if (typeof toOrOptions === 'object' && toOrOptions !== null) {
    to = toOrOptions.to;
    subject = toOrOptions.subject;
    html = toOrOptions.html;
    text = toOrOptions.text;
  } else {
    to = toOrOptions;
    subject = subjectParam;
    html = htmlParam;
    text = textParam;
  }

  if (!to) {
    console.warn('[Email] Skipping send: recipient email is missing.');
    return { success: false, reason: 'missing_recipient' };
  }

  const emailSubject = subject || 'PRO ALUMN Notification';
  const emailHtml = html || `<p>${escapeHtml(text || '')}</p>`;

  try {
    // 1. Nodemailer (SMTP / Gmail App Password)
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      const from = process.env.EMAIL_FROM || `Pro Alumn <${process.env.EMAIL_USER}>`;
      const info = await transporter.sendMail({ from, to, subject: emailSubject, html: emailHtml, text });
      console.log(`[Email:Nodemailer] Sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', id: info.messageId };
    }

    // 2. Resend API
    if (process.env.RESEND_API_KEY) {
      const resendInstance = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resendInstance.emails.send({
        from: FROM,
        to,
        subject: emailSubject,
        html: emailHtml,
        text,
      });
      if (error) {
        console.error('[Email:Resend] Error:', error);
        return { success: false, provider: 'resend', error };
      }
      console.log(`[Email:Resend] Sent to ${to}. ID: ${data?.id}`);
      return { success: true, provider: 'resend', id: data?.id };
    }

    // 3. Fallback mock in development or when unconfigured
    console.warn(`[Email:Mock] Credentials not set. To: ${to} | Subject: ${emailSubject}`);
    return { success: false, reason: 'no_credentials_configured' };
  } catch (error) {
    console.error('[Email] Error sending email:', error.message || error);
    return { success: false, error: error.message || error };
  }
}

// Layout Wrapper
function layout(title, bodyHtml, ctaText, ctaHref) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: #0f172a; color: #ffffff; padding: 18px 24px; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        🎓 PRO ALUMN
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px;">${title}</h2>
        <div style="color: #475569; line-height: 1.6; font-size: 15px;">${bodyHtml}</div>
        ${ctaText && ctaHref ? `
          <div style="margin: 24px 0;">
            <a href="${ctaHref}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 600; display: inline-block;">
              ${ctaText}
            </a>
          </div>` : ''}
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">PRO ALUMN · Verified Higher-Ed Alumni &amp; Career Network</p>
      </div>
    </div>`;
}

// 1. Welcome email for CSV-imported / registered alumni
async function sendWelcomeEmail({ to, name, tempPassword }) {
  const safeName = escapeHtml(name || 'Member');
  return sendEmail({
    to,
    subject: 'Welcome to PRO ALUMN!',
    html: layout(
      'Welcome to PRO ALUMN 👋',
      `<p>Hi <strong>${safeName}</strong>, your verified alumni account has been created.</p>
       <p><strong>Email:</strong> ${escapeHtml(to)}<br/>
       <strong>Temporary password:</strong> <code style="background:#eef2ff;padding:2px 6px;border-radius:4px;font-family:monospace">${escapeHtml(tempPassword)}</code></p>
       <p>Please log in and update your profile to start connecting with batchmates, giving referrals, and mentoring students.</p>`,
      'Login to Portal',
      `${PORTAL_URL}/login`
    ),
  });
}

// 2. Profile approval notification
async function sendProfileApprovalEmail(userEmail, userName) {
  const safeName = escapeHtml(userName || 'Member');
  return sendEmail({
    to: userEmail,
    subject: 'Your Pro Alumn Profile has been Approved!',
    html: layout(
      'Profile Verified &amp; Approved! 🎉',
      `<p>Hi <strong>${safeName}</strong>,</p>
       <p>Great news! Your PRO ALUMN profile has been reviewed and approved by the college administrator.</p>
       <p>You now have full access to connect with mentors, request referrals, and participate in campus reunions.</p>`,
      'Explore Directory',
      `${PORTAL_URL}/directory`
    ),
  });
}

// 3. Referral status change (accepted / referred / hired / rejected...)
async function sendReferralStatusEmail({ to, name, status, jobTitle, company }) {
  const labels = {
    ACCEPTED: 'Your referral request was accepted',
    REJECTED: 'Your referral request was declined',
    REFERRED: 'You were referred internally',
    HIRED: '🎉 You got hired!',
    NOT_HIRED: 'Update on your referral',
  };
  const safeName = escapeHtml(name || 'Candidate');
  const safeJobTitle = escapeHtml(jobTitle || 'Role');
  const safeCompany = escapeHtml(company || 'Company');
  return sendEmail({
    to,
    subject: `PRO ALUMN — ${labels[status] || 'Referral update'}`,
    html: layout(
      labels[status] || 'Referral Update',
      `<p>Hi <strong>${safeName}</strong>,</p>
       <p>Status changed for <strong>${safeJobTitle}</strong> at <strong>${safeCompany}</strong>: 
       <span style="font-weight:700;color:#2563eb">${labels[status] || status}</span>.</p>`,
      'View My Referrals',
      `${PORTAL_URL}/jobs`
    ),
  });
}

// 4. New referral request received by alumni
async function sendNewReferralEmail({ to, name, studentName, jobTitle, company }) {
  const safeName = escapeHtml(name || 'Alum');
  const safeStudentName = escapeHtml(studentName || 'A student');
  const safeJobTitle = escapeHtml(jobTitle || 'Role');
  const safeCompany = escapeHtml(company || 'Company');
  return sendEmail({
    to,
    subject: 'You have a new referral request',
    html: layout(
      'New Referral Request ✉️',
      `<p>Hi <strong>${safeName}</strong>,</p>
       <p><strong>${safeStudentName}</strong> requested an internal referral for <strong>${safeJobTitle}</strong> at <strong>${safeCompany}</strong>.</p>
       <p>Review their pitch and attached resume on your dashboard.</p>`,
      'Review Referral Request',
      `${PORTAL_URL}/jobs`
    ),
  });
}

// 5. Achievement / Success Story approved
async function sendStoryApprovedEmail(to, storyTitle) {
  const safeStoryTitle = escapeHtml(storyTitle || 'Achievement');
  return sendEmail({
    to,
    subject: 'Your Achievement is now Live!',
    html: layout(
      'Achievement Live on Spotlight Wall 🚀',
      `<p>Hi there,</p>
       <p>Your story <em>"${safeStoryTitle}"</em> was approved by the admin and is now live on the community feed!</p>`,
      'View Spotlight Wall',
      `${PORTAL_URL}/stories`
    ),
  });
}

// 6. Support ticket confirmation
async function sendSupportTicketConfirmation(userEmail, ticketId, ticketSubject) {
  const safeId = escapeHtml(ticketId || '');
  const safeSubject = escapeHtml(ticketSubject || 'Support Request');
  return sendEmail({
    to: userEmail,
    subject: `Support Ticket Received: [${safeId}] ${safeSubject}`,
    html: layout(
      'Support Ticket Received 🎫',
      `<p>Hi there,</p>
       <p>Thank you for reaching out. We have received your ticket regarding: <strong>${safeSubject}</strong> (ID: <code>${safeId}</code>).</p>
       <p>Our administration desk will review your ticket shortly.</p>`,
      'View Support',
      `${PORTAL_URL}/help`
    ),
  });
}

// 7. Admin ticket notification
async function sendAdminTicketNotification(adminEmail, ticket) {
  if (!adminEmail || !ticket) return;
  const safeId = escapeHtml(ticket.id || '');
  const safeCategory = escapeHtml(ticket.category || 'General');
  const safeSubject = escapeHtml(ticket.subject || 'Support Ticket');
  const safeUserName = escapeHtml(ticket.user?.name || 'Unknown');
  const safeUserEmail = escapeHtml(ticket.user?.email || 'No email');
  const safeMessage = escapeHtml(ticket.message || '');
  return sendEmail({
    to: adminEmail,
    subject: `[New Ticket] ${safeCategory}: ${safeSubject}`,
    html: layout(
      'New Support Ticket Submitted 🚨',
      `<p>A new support ticket has been opened by <strong>${safeUserName}</strong> (${safeUserEmail}).</p>
       <p><strong>Category:</strong> ${safeCategory}<br/><strong>Subject:</strong> ${safeSubject}</p>
       <blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #cbd5e1;border-radius:4px">${safeMessage}</blockquote>`,
      'Review in Admin Desk',
      `${PORTAL_URL}/admin`
    ),
  });
}

// Backwards-compatible send method
async function send(options) {
  return sendEmail(options);
}

module.exports = {
  sendEmail,
  send,
  sendWelcomeEmail,
  sendProfileApprovalEmail,
  sendAchievementApprovalEmail: (email, title) => sendStoryApprovedEmail(email, title),
  sendReferralStatusEmail,
  sendNewReferralEmail,
  sendStoryApprovedEmail,
  sendSupportTicketConfirmation,
  sendAdminTicketNotification,
};
