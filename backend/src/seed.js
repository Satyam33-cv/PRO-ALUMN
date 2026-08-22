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
