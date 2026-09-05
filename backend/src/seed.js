// apps/api/src/seed.js
// Comprehensive Multi-Role Seed Script (Admin, Faculty, Alumni, Students)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateEmbedding, profileText } = require('./services/embeddings');
const { ensureDefaultBadges } = require('./services/gamification');

const prisma = new PrismaClient();

async function upsertUser(data, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return await prisma.user.update({
      where: { email: data.email },
      data: { ...data, passwordHash },
    });
  }
  return await prisma.user.create({
    data: { ...data, passwordHash },
  });
}

async function embedUser(id, text) {
  try {
    if (!text || !text.replace(/[^a-z]/gi, '')) return;
    const vec = await generateEmbedding(text);
    const literal = `[${vec.map((n) => (Number.isInteger(n) ? n : n.toFixed(6))).join(',')}]`;
    await prisma.$executeRawUnsafe(`UPDATE "User" SET embedding = $1::vector WHERE id = $2`, literal, id);
    console.log(`   🧠 embedded: ${id}`);
  } catch (err) {
    // Embedding is optional if local model isn't active
  }
}

async function main() {
  console.log('🌱 Seeding PRO ALUMN Multi-Role Database...');

  // Ensure default gamification badges
  await ensureDefaultBadges().catch(() => {});

  // 1. ADMIN
  const admin = await upsertUser({
    name: 'Super Admin Administrator',
    email: 'proalumn@yahoo.com',
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
    department: 'Administration',
    totalPoints: 1250,
    currentStreak: 14,
    longestStreak: 28,
  }, 'Admin@12345');
  console.log('👑 Admin:', admin.email);

  // 2. FACULTY
  const faculty1 = await upsertUser({
    name: 'Dr. Rajesh Kulkarni',
    email: 'dr.kulkarni@somaiya.edu',
    role: 'FACULTY',
    isVerified: true,
    isActive: true,
    department: 'Computer Science & Engineering',
    jobTitle: 'Professor & Head of Department',
    bio: 'Researching Distributed Systems, Cloud Architecture, and Big Data. Mentoring students on capstone projects and higher studies.',
    skills: 'Cloud Computing, Distributed Systems, AI Ethics, Higher Studies',
    totalPoints: 640,
    currentStreak: 8,
    longestStreak: 15,
  }, 'Faculty@12345');

  const faculty2 = await upsertUser({
    name: 'Prof. Sneha Mehta',
    email: 'prof.mehta@somaiya.edu',
    role: 'FACULTY',
    isVerified: true,
    isActive: true,
    department: 'Information Technology',
    jobTitle: 'Associate Professor & Career Mentor',
    bio: 'Specializing in Full-Stack Web Development, Data Structures, and Software Architecture. Open for student mentoring.',
    skills: 'Algorithms, System Design, React, Node.js, Mentorship',
    totalPoints: 520,
    currentStreak: 5,
    longestStreak: 12,
  }, 'Faculty@12345');
  console.log('👨‍🏫 Faculty:', faculty1.email, '&', faculty2.email);

  // 3. ALUMNI
  const alumni1 = await upsertUser({
    name: 'Vikram Aditya',
    email: 'alumni@google.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2019,
    department: 'Computer Science',
    currentCompany: 'Google',
    jobTitle: 'Senior Software Engineer (L5)',
    location: 'Bengaluru / Mountain View',
    linkedinUrl: 'https://linkedin.com/in/vikram-aditya',
    bio: 'Proud Somaiya Alumnus. Working on Google Cloud Infrastructure and Kubernetes. Happy to refer students and review resumes.',
    skills: 'Go, Kubernetes, Cloud Architecture, Distributed Systems, Python',
    totalPoints: 890,
    currentStreak: 12,
    longestStreak: 24,
  }, 'Alumni@12345');

  const alumni2 = await upsertUser({
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@amazon.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2021,
    department: 'Information Technology',
    currentCompany: 'Amazon',
    jobTitle: 'Software Development Engineer II',
    location: 'Mumbai / Seattle',
    linkedinUrl: 'https://linkedin.com/in/ananya-deshmukh',
    bio: 'Building high-throughput payment pipelines at AWS. Actively referring students for SDE roles and internships.',
    skills: 'Java, AWS, DynamoDB, Microservices, System Design',
    totalPoints: 740,
    currentStreak: 9,
    longestStreak: 18,
  }, 'Alumni@12345');

  const alumni3 = await upsertUser({
    name: 'Siddharth Joshi',
    email: 'siddharth.joshi@stripe.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2020,
    department: 'Electronics & Telecommunication',
    currentCompany: 'Stripe',
    jobTitle: 'Product Engineer',
    location: 'San Francisco / Remote',
    bio: 'Fintech enthusiast, YC alum. Happy to help students breaking into startups and global tech companies.',
    skills: 'Ruby, React, TypeScript, Product Strategy, Fintech',
    totalPoints: 680,
    currentStreak: 6,
    longestStreak: 16,
  }, 'Alumni@12345');
  console.log('🎓 Alumni:', alumni1.email, ',', alumni2.email, ',', alumni3.email);

  // 4. STUDENTS
  const student1 = await upsertUser({
    name: 'Arjun Sharma',
    email: 'arjun.sharma@somaiya.edu',
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    batchYear: 2025,
    department: 'Computer Science & Engineering',
    rollNumber: '16010121045',
    bio: 'Final year CS student interested in Cloud Infrastructure, Backend Engineering, and Open Source. Looking for SDE-1 roles.',
    skills: 'Next.js, Node.js, Go, Docker, PostgreSQL, TailwindCSS',
    resumeUrl: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
    totalPoints: 420,
    currentStreak: 6,
    longestStreak: 10,
  }, 'Student@12345');

  const student2 = await upsertUser({
    name: 'Priya Patel',
    email: 'priya.patel@somaiya.edu',
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    batchYear: 2026,
    department: 'Information Technology',
    rollNumber: '16010122018',
    bio: 'Third year IT undergraduate focusing on Full Stack Web Development and AI integration. Active hackathon participant.',
    skills: 'React, TypeScript, Python, PyTorch, MongoDB, Express',
    resumeUrl: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
    totalPoints: 350,
    currentStreak: 4,
    longestStreak: 8,
  }, 'Student@12345');
  console.log('🎒 Students:', student1.email, '&', student2.email);

  // Generate embeddings
  await embedUser(alumni1.id, profileText(alumni1));
  await embedUser(alumni2.id, profileText(alumni2));
  await embedUser(student1.id, profileText(student1));

  // Seed sample jobs posted by alumni
  const job1 = await prisma.jobPosting.create({
    data: {
      postedById: alumni1.id,
      title: 'Software Engineer I (Cloud Infrastructure)',
      company: 'Google',
      location: 'Bengaluru / Hyderabad',
      jobType: 'FULL_TIME',
      experienceLevel: 'ENTRY',
      description: 'Join Google Cloud Core Infrastructure team to build scalable microservices and distributed storage engines.',
      requirements: 'BS/BTech in CS/IT. Strong foundation in DSA and Operating Systems.',
      skills: 'Go, Python, Kubernetes, Linux, Distributed Systems',
      salaryMin: 1800000,
      salaryMax: 2400000,
      referralSlots: 5,
      status: 'OPEN',
    },
  }).catch(() => null);

  const job2 = await prisma.jobPosting.create({
    data: {
      postedById: alumni2.id,
      title: 'Software Development Engineer Intern (Summer 2026)',
      company: 'Amazon',
      location: 'Mumbai / Remote',
      jobType: 'INTERNSHIP',
      experienceLevel: 'ENTRY',
      description: 'Summer 2026 Software Development Internships for AWS payment infrastructure.',
      requirements: 'Currently enrolled in CS/IT degree. Strong coding skills in Java/Python.',
      skills: 'Java, Data Structures, OOP, SQL, Problem Solving',
      salaryMin: 80000,
      salaryMax: 100000,
      referralSlots: 8,
      status: 'OPEN',
    },
  }).catch(() => null);

  // Seed sample applications with resumes
  if (job1 && student1) {
    await prisma.referralRequest.upsert({
      where: { jobId_requestedById: { jobId: job1.id, requestedById: student1.id } },
      update: {},
      create: {
        jobId: job1.id,
        requestedById: student1.id,
        referredById: alumni1.id,
        resumeUrl: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
        studentNote: 'Hi Vikram sir, I built Go microservices and would love a referral for Google Cloud!',
        status: 'ACCEPTED',
      },
    }).catch(() => {});
  }

  // Seed official announcements
  await prisma.announcement.create({
    data: {
      title: '🌟 Annual Alumni Grand Homecoming & Tech Summit 2026',
      content: 'We are delighted to invite all Alumni, Faculty, and Students to the Annual Homecoming Summit on September 15, 2026. Featuring keynotes from global alumni CXOs, panel discussions, and career networking dinners.',
      authorId: admin.id,
      targetRole: 'ALL',
      priority: 'NORMAL',
      isPinned: true,
    },
  }).catch(() => {});

  await prisma.announcement.create({
    data: {
      title: '🚨 Campus Placement Season 2026: Phase-1 Registrations Open',
      content: 'All final year students (Batch of 2026) are required to complete their profile verification and upload their updated resumes on PRO ALUMN before August 30.',
      authorId: admin.id,
      targetRole: 'STUDENT',
      priority: 'URGENT',
      isPinned: true,
    },
  }).catch(() => {});

  console.log('\n✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
