// apps/api/src/services/notify.js
// Central notification service: in-app + email + WhatsApp in one call
const prisma = require('../db');
const email = require('./email');
const whatsapp = require('./whatsapp');

/**
 * Create an in-app notification and optionally fan out to email / WhatsApp.
 * @param {Object} opts
 * @param {string} opts.userId     - recipient user id
 * @param {string} opts.type       - NotificationType enum value
 * @param {string} opts.title      - short title
 * @param {string} opts.message    - body text
 * @param {string} [opts.link]     - deep link
 * @param {boolean} [opts.sendEmail=false]
 * @param {boolean} [opts.sendWhatsApp=false]
 * @param {Object} [opts.emailTemplate] - optional: { to, name, fn } where fn is one of the email service senders
 */
async function notify({ userId, type, title, message, link, sendEmail = false, sendWhatsApp = false, emailTemplate }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  const results = {};

  if (sendEmail && user?.email) {
    if (emailTemplate && typeof emailTemplate.fn === 'function') {
      results.email = await emailTemplate.fn({ to: user.email, name: user.name, ...emailTemplate.data });
    } else {
      results.email = await email.send({
        to: user.email,
        subject: title,
        text: `${message}\n\nLink: ${process.env.WEB_URL || 'http://localhost:3000'}${link || ''}`,
      });
    }
  }

  if (sendWhatsApp && user?.phone) {
    results.whatsapp = await whatsapp.sendWhatsApp({
      to: user.phone,
      message: `🎓 PRO ALUMN\n${title}\n${message}`,
    });
  }

  return { notification, results };
}

module.exports = { notify };
