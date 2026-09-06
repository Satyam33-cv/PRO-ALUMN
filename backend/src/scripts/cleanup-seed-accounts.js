// backend/src/scripts/cleanup-seed-accounts.js
// Utility to neutralize or remove hardcoded seed accounts from active databases
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const SEED_EMAILS = [
  'proalumn@yahoo.com',
  'dr.kulkarni@somaiya.edu',
  'prof.mehta@somaiya.edu',
  'alumni@google.com',
  'ananya.deshmukh@amazon.com',
  'siddharth.joshi@stripe.com',
  'rohan.kulkarni@apple.com',
  'tanvi.varma@openai.com',
  'devendra.parekh@datadog.com',
  'meera.iyer@snowflake.com',
  'kabir@finscale.io',
  'shreya.sen@microsoft.com',
  'arjun.sharma@somaiya.edu',
  'priya.patel@somaiya.edu',
];

async function run() {
  const isDelete = process.argv.includes('--delete');
  const isRotate = process.argv.includes('--rotate') || !isDelete;

  console.log(`🛡️  PRO ALUMN Seed Account Neutralizer`);
  console.log(`Mode: ${isDelete ? 'DELETE (Purge seed accounts)' : 'ROTATE (Overwrite with unguessable random hashes)'}\n`);

  const foundUsers = await prisma.user.findMany({
    where: { email: { in: SEED_EMAILS } },
    select: { id: true, email: true, name: true, role: true },
  });

  if (foundUsers.length === 0) {
    console.log('✅ No hardcoded seed accounts found in the database. Environment is clean.');
    return;
  }

  console.log(`Found ${foundUsers.length} seed account(s):`);
  foundUsers.forEach((u) => console.log(` - [${u.role}] ${u.email} (${u.name})`));

  if (isDelete) {
    console.log('\nPurging seed dependencies and accounts...');
    const userIds = foundUsers.map((u) => u.id);

    // Remove foreign-key dependencies
    await prisma.referralRequest.deleteMany({
      where: { OR: [{ requestedById: { in: userIds } }, { referredById: { in: userIds } }] },
    }).catch(() => {});

    await prisma.mentorship.deleteMany({
      where: { OR: [{ studentId: { in: userIds } }, { mentorId: { in: userIds } }] },
    }).catch(() => {});

    await prisma.eventRSVP.deleteMany({
      where: { userId: { in: userIds } },
    }).catch(() => {});

    await prisma.event.deleteMany({
      where: { createdById: { in: userIds } },
    }).catch(() => {});

    await prisma.successStory.deleteMany({
      where: { alumniId: { in: userIds } },
    }).catch(() => {});

    await prisma.jobPosting.deleteMany({
      where: { postedById: { in: userIds } },
    }).catch(() => {});

    await prisma.announcement.deleteMany({
      where: { createdById: { in: userIds } },
    }).catch(() => {});

    const deleted = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(`\n✅ Successfully deleted ${deleted.count} seed account(s) and associated records.`);
  } else if (isRotate) {
    console.log('\nRotating password hashes to secure 256-bit random tokens...');
    for (const u of foundUsers) {
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const randomHash = await bcrypt.hash(randomSecret, 12);
      await prisma.user.update({
        where: { id: u.id },
        data: {
          passwordHash: randomHash,
          isActive: false, // Deactivate default seed logins
        },
      });
      console.log(` 🔒 Neutralized & deactivated: ${u.email}`);
    }
    console.log('\n✅ All seed account credentials have been rotated and deactivated.');
  }
}

run()
  .catch((err) => {
    console.error('❌ Error cleaning seed accounts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
