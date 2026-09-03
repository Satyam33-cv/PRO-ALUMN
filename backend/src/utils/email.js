const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Support both Resend and Nodemailer (Gmail / SMTP app password)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Universal email dispatcher:
 * 1. Nodemailer if EMAIL_USER and EMAIL_APP_PASSWORD exist
 * 2. Resend if RESEND_API_KEY exists
 * 3. Non-blocking console mock fallback otherwise
 */
const sendEmail = async (to, subject, html) => {
  if (!to) {
    console.warn('[Email] Skipping send: recipient email is missing.');
    return { success: false, reason: 'missing_recipient' };
  }

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
      const info = await transporter.sendMail({ from, to, subject, html });
      console.log(`[Email:Nodemailer] Sent to ${to}. MessageId: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', id: info.messageId };
    }

    // 2. Resend API
    if (resend) {
      const from = process.env.EMAIL_FROM || 'Pro Alumn <support@proalumn.dpdns.org>';
      const { data, error } = await resend.emails.send({ from, to, subject, html });
      if (error) {
        console.error('[Email:Resend] Error:', error);
        return { success: false, provider: 'resend', error };
      }
      console.log(`[Email:Resend] Sent to ${to}. ID: ${data?.id}`);
      return { success: true, provider: 'resend', id: data?.id };
    }

    // 3. Fallback mock in development or when unconfigured
    console.warn(`[Email:Mock] Credentials not set. To: ${to} | Subject: ${subject}`);
    return { success: false, reason: 'no_credentials_configured' };
  } catch (error) {
    console.error('[Email] Error sending email:', error.message || error);
    return { success: false, error: error.message || error };
  }
};

const sendProfileApprovalEmail = async (userEmail, userName) => {
  if (!userEmail) return;
  const safeName = escapeHtml(userName || 'Member');
  const subject = 'Your Pro Alumn Profile has been Approved!';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #10b981; margin: 0 0 8px;">Profile Approved! 🎉</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Welcome to the verified PRO ALUMN network</p>
      </div>
      <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${safeName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">Great news! Your PRO ALUMN profile has been reviewed and approved by our team.</p>
      <p style="font-size: 15px; line-height: 1.6;">You now have full access to connect with mentors, share achievements, and browse the Education Centre.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/directory" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Explore Alumni Directory</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Best regards,<br /><strong style="color: #475569;">The PRO ALUMN Team</strong></p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
};

const sendAchievementApprovalEmail = async (userEmail, achievementTitle) => {
  if (!userEmail) return;
  const safeTitle = escapeHtml(achievementTitle || 'Achievement');
  const subject = 'Your Achievement is now Live!';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2196F3; margin: 0 0 8px;">Achievement Approved! 🚀</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Your story is now live on the Spotlight Feed</p>
      </div>
      <p style="font-size: 15px; line-height: 1.6;">Hi there,</p>
      <p style="font-size: 15px; line-height: 1.6;">Your recent achievement "<strong>${safeTitle}</strong>" has been approved and is now live on the platform!</p>
      <p style="font-size: 15px; line-height: 1.6;">Thank you for contributing to the community.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/stories" style="background-color: #2196F3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View on Spotlight Wall</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Best regards,<br /><strong style="color: #475569;">The PRO ALUMN Team</strong></p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
};

const sendSupportTicketConfirmation = async (userEmail, ticketId, ticketSubject) => {
  if (!userEmail) return;
  const safeId = escapeHtml(ticketId || '');
  const safeSubject = escapeHtml(ticketSubject || 'Support Request');
  const emailSubject = `Support Ticket Received: [${safeId}] ${safeSubject}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin: 0 0 8px;">We've received your request 🎫</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Ticket ID: <strong>${safeId}</strong></p>
      </div>
      <p style="font-size: 15px; line-height: 1.6;">Hi there,</p>
      <p style="font-size: 15px; line-height: 1.6;">Thank you for reaching out to PRO ALUMN Support. We have received your ticket regarding: <strong>${safeSubject}</strong>.</p>
      <p style="font-size: 15px; line-height: 1.6;">Our team will review it and get back to you shortly.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/help" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Support Desk</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Best regards,<br /><strong style="color: #475569;">PRO ALUMN Support Desk</strong></p>
    </div>
  `;
  return await sendEmail(userEmail, emailSubject, html);
};

const sendAdminTicketNotification = async (adminEmail, ticket) => {
  if (!adminEmail || !ticket) return;
  const safeId = escapeHtml(ticket.id || '');
  const safeCategory = escapeHtml(ticket.category || 'General');
  const safeSubject = escapeHtml(ticket.subject || 'Support Ticket');
  const safeUserName = escapeHtml(ticket.user?.name || 'Unknown');
  const safeUserEmail = escapeHtml(ticket.user?.email || 'No email');
  const safeMessage = escapeHtml(ticket.message || '');
  const emailSubject = `[New Ticket] ${safeCategory}: ${safeSubject}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #ef4444; margin: 0 0 12px;">New Support Ticket Submitted</h2>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">A new support ticket has been opened.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Ticket ID:</strong></td><td style="padding: 6px 0;">${safeId}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;"><strong>User:</strong></td><td style="padding: 6px 0;">${safeUserName} (${safeUserEmail})</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Category:</strong></td><td style="padding: 6px 0;"><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${safeCategory}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Subject:</strong></td><td style="padding: 6px 0;"><strong>${safeSubject}</strong></td></tr>
      </table>
      <p style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 6px;">Message:</p>
      <blockquote style="background: #f9fafb; padding: 15px; border-left: 4px solid #d1d5db; border-radius: 4px; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
        ${safeMessage}
      </blockquote>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.WEB_URL || 'http://localhost:3000'}/admin?tab=support" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Review in Admin Dashboard</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">PRO ALUMN Admin Desk</p>
    </div>
  `;
  return await sendEmail(adminEmail, emailSubject, html);
};

module.exports = {
  sendEmail,
  sendProfileApprovalEmail,
  sendAchievementApprovalEmail,
  sendSupportTicketConfirmation,
  sendAdminTicketNotification,
};
