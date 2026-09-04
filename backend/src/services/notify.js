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

  // Fan out external notifications asynchronously (non-blocking - Commandment 08)
  if ((sendEmail && user?.email) || (sendWhatsApp && user?.phone)) {
    setImmediate(async () => {
      if (sendEmail && user?.email) {
        try {
          if (emailTemplate && typeof emailTemplate.fn === 'function') {
            await emailTemplate.fn({ to: user.email, name: user.name, ...emailTemplate.data });
          } else {
            await email.send({
              to: user.email,
              subject: title,
              text: `${message}\n\nLink: ${process.env.WEB_URL || 'http://localhost:3000'}${link || ''}`,
            });
          }
        } catch (e) {
          console.error('[Notify:Email] Async delivery error:', e.message || e);
        }
      }

      if (sendWhatsApp && user?.phone) {
        try {
          await whatsapp.sendWhatsApp({
            to: user.phone,
            message: `🎓 PRO ALUMN\n${title}\n${message}`,
          });
        } catch (e) {
          console.error('[Notify:WhatsApp] Async delivery error:', e.message || e);
        }
      }
    });
  }

  return { notification };
}

module.exports = { notify };
