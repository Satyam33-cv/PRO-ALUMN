// apps/api/src/seed.js
// Seed script: creates an admin account + demo users (idempotent)
// Usage: node src/seed.js   (or: npm run seed)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateEmbedding, profileText } = require('./services/embeddings');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@college.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function upsertUser(data, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: { ...data, passwordHash },
  });
}

async function embedUser(id, text) {
  if (!text.replace(/[^a-z]/gi, '')) return;
  const vec = await generateEmbedding(text);
  const literal = `[${vec.map((n) => (Number.isInteger(n) ? n : n.toFixed(6))).join(',')}]`;
  await prisma.$executeRawUnsafe(`UPDATE "User" SET embedding = $1::vector WHERE id = $2`, literal, id);
  console.log(`   🧠 embedded: ${id}`);
}

async function main() {
  console.log('🌱 Seeding database...');

  const admin = await upsertUser({
    name: 'College Admin', email: ADMIN_EMAIL, role: 'ADMIN', isVerified: true,
  }, ADMIN_PASSWORD);
  console.log('👤 Admin:', admin.email);

  const alumni = await upsertUser({
    name: 'Demo Alumni', email: 'alumni@college.edu', role: 'ALUMNI', isVerified: true,
    batchYear: 2018, department: 'CSE', currentCompany: 'Google', jobTitle: 'Software Engineer',
    location: 'Bengaluru', bio: 'Demo alumni account. 5+ years in backend engineering.',
    skills: 'JavaScript, Node.js, PostgreSQL, System Design', interests: 'Mentoring, Backend, Cloud',
  }, 'Alumni@12345');
  console.log('👤 Alumni:', alumni.email);

  const student = await upsertUser({
    name: 'Demo Student', email: 'student@college.edu', role: 'STUDENT', isVerified: true,
    batchYear: 2026, department: 'CSE', bio: 'Demo student account.',
    skills: 'React, Node.js, DSA', interests: 'Backend, AI, Startups',
  }, 'Student@12345');
  console.log('👤 Student:', student.email);

  console.log('\n🧠 Building profile embeddings for smart matching...');
  await embedUser(admin.id, profileText(admin));
  await embedUser(alumni.id, profileText(alumni));
  await embedUser(student.id, profileText(student));

  // Seed sample jobs
  const jobCount = await prisma.jobPosting.count();
  if (jobCount === 0) {
    console.log('💼 Seeding sample job postings...');
    await prisma.jobPosting.createMany({
      data: [
        {
          title: 'Full Stack Engineer',
          company: 'Google',
          location: 'Bengaluru / Hybrid',
          jobType: 'FULL_TIME',
          experienceLevel: 'ENTRY',
          description: 'Join our Cloud & Developer Infrastructure team building distributed platforms.',
          requirements: 'B.Tech/BE in CS/IT. Strong problem-solving skills in JS/Python.',
          skills: 'React, Node.js, TypeScript, PostgreSQL',
          salaryMin: 1800000,
          salaryMax: 2800000,
          referralSlots: 3,
          postedById: alumni.id,
        },
        {
          title: 'Frontend Intern',
          company: 'Razorpay',
          location: 'Bengaluru / Remote',
          jobType: 'INTERNSHIP',
          experienceLevel: 'ENTRY',
          description: 'Work on checkout experiences and merchant dashboards used by millions.',
          requirements: 'Proficiency with React, Tailwind CSS, and RESTful APIs.',
          skills: 'React, Tailwind, Next.js',
          salaryMin: 45000,
          salaryMax: 60000,
          referralSlots: 2,
          postedById: alumni.id,
        },
      ],
    });
  }

  // Seed sample events
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    console.log('📅 Seeding sample events...');
    await prisma.event.createMany({
      data: [
        {
          title: 'Alumni Tech Talk: Scalable Systems in 2026',
          description: 'Join our senior alumni from Google and Microsoft sharing insights on distributed architectures.',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Main Auditorium / Online Stream',
          mode: 'ONLINE',
          maxCapacity: 250,
          createdById: admin.id,
        },
        {
          title: 'Annual Alumni & Student Career Mixer',
          description: 'Face-to-face networking, resume reviews, and coffee chats with alumni in tech and product.',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'University Campus Center',
          mode: 'OFFLINE',
          maxCapacity: 100,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log('\n✅ Seed complete. Login with:');
  console.log(`   Admin   → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('   Alumni  → alumni@college.edu / Alumni@12345');
  console.log('   Student → student@college.edu / Student@12345');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
