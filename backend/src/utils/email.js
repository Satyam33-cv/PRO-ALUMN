const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = 'support@proalumn.dpdns.org'; // Updated to your new domain

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Skipping email send.');
      return;
    }
    
    const { data, error } = await resend.emails.send({
      from: `Pro Alumn <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return;
    }
    
    console.log(`Email sent to ${to} successfully. ID: ${data?.id}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendProfileApprovalEmail = async (userEmail, userName) => {
  const subject = 'Your Pro Alumn Profile has been Approved!';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Profile Approved! 🎉</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your Pro Alumn profile has been reviewed and approved by our team.</p>
      <p>You now have full access to connect with mentors, share achievements, and browse the Education Centre.</p>
      <br />
      <p>Best,</p>
      <p><strong>The Pro Alumn Team</strong></p>
    </div>
  `;
  await sendEmail(userEmail, subject, html);
};

const sendAchievementApprovalEmail = async (userEmail, achievementTitle) => {
  const subject = 'Your Achievement is now Live!';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2196F3;">Achievement Approved! 🚀</h2>
      <p>Hi there,</p>
      <p>Your recent achievement "<strong>${achievementTitle}</strong>" has been approved and is now live on the platform!</p>
      <p>Thank you for contributing to the community.</p>
      <br />
      <p>Best,</p>
      <p><strong>The Pro Alumn Team</strong></p>
    </div>
  `;
  await sendEmail(userEmail, subject, html);
};

const sendSupportTicketConfirmation = async (userEmail, ticketId, ticketSubject) => {
  const emailSubject = 'Support Ticket Received - Pro Alumn';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3b82f6;">We've received your request</h2>
      <p>Hi there,</p>
      <p>Thank you for reaching out to Pro Alumn Support. We have received your ticket regarding: <strong>${ticketSubject}</strong>.</p>
      <p>Your ticket ID is <strong>${ticketId}</strong>.</p>
      <p>Our team will review it and get back to you shortly.</p>
      <br />
      <p>Best,</p>
      <p><strong>Pro Alumn Support</strong></p>
    </div>
  `;
  await sendEmail(userEmail, emailSubject, html);
};

const sendAdminTicketNotification = async (adminEmail, ticket) => {
  const emailSubject = `[New Ticket] ${ticket.category}: ${ticket.subject}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ef4444;">New Support Ticket Submitted</h2>
      <p>A new support ticket has been opened.</p>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>User:</strong> ${ticket.user?.name || 'Unknown'} (${ticket.user?.email || 'No email'})</li>
        <li><strong>Category:</strong> ${ticket.category}</li>
        <li><strong>Subject:</strong> ${ticket.subject}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f9fafb; padding: 15px; border-left: 4px solid #d1d5db; border-radius: 4px;">
        ${ticket.message}
      </blockquote>
      <p>Please log in to the admin dashboard to review and resolve this ticket.</p>
    </div>
  `;
  await sendEmail(adminEmail, emailSubject, html);
};

module.exports = {
  sendProfileApprovalEmail,
  sendAchievementApprovalEmail,
  sendSupportTicketConfirmation,
  sendAdminTicketNotification,
};
