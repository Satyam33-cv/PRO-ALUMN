// apps/api/src/seed.js
// Comprehensive Multi-Role Seed Script (Admin, Faculty, Alumni, Students)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateEmbedding, profileText } = require('./services/embeddings');
const { ensureDefaultBadges } = require('./services/gamification');

const crypto = require('crypto');
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
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PRODUCTION !== 'true') {
    console.error('⛔ Refusing to run seed script in production!');
    console.error('If you explicitly intend to seed production, set ALLOW_SEED_IN_PRODUCTION=true and specify SEED_ADMIN_PASSWORD in environment variables.');
    process.exit(1);
  }

  function resolveSeedPassword(envVar, roleName) {
    if (process.env[envVar]) {
      return process.env[envVar];
    }
    const generated = crypto.randomBytes(16).toString('hex');
    console.log(`🔑 [SEED] Generated random password for ${roleName} (${envVar} not set): ${generated}`);
    return generated;
  }

  const ADMIN_PASSWORD = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'Admin');
  const FACULTY_PASSWORD = resolveSeedPassword('SEED_FACULTY_PASSWORD', 'Faculty');
  const ALUMNI_PASSWORD = resolveSeedPassword('SEED_ALUMNI_PASSWORD', 'Alumni');
  const STUDENT_PASSWORD = resolveSeedPassword('SEED_STUDENT_PASSWORD', 'Student');
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@proalumn.edu';

  console.log('🌱 Seeding PRO ALUMN Multi-Role Database...');

  // Ensure default gamification badges
  await ensureDefaultBadges().catch(() => {});

  // 1. ADMIN
  const admin = await upsertUser({
    name: 'Super Admin Administrator',
    email: ADMIN_EMAIL,
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
    department: 'Administration',
    totalPoints: 1250,
    currentStreak: 14,
    longestStreak: 28,
  }, ADMIN_PASSWORD);
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
  }, FACULTY_PASSWORD);

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
  }, FACULTY_PASSWORD);
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
  }, ALUMNI_PASSWORD);

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
  }, ALUMNI_PASSWORD);

  const alumni3 = await upsertUser({
    name: 'Siddharth Joshi',
    email: 'siddharth.joshi@stripe.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2020,
    department: 'Electronics & Telecommunication',
    currentCompany: 'Stripe',
    jobTitle: 'Staff Infrastructure Engineer',
    location: 'San Francisco / Remote',
    linkedinUrl: 'https://linkedin.com/in/siddharth-joshi',
    bio: 'Fintech infrastructure and high-throughput settlement systems. YC alum. Passionate about helping students break into global tech and startups.',
    skills: 'Go, Ruby, React, Distributed Consensus, High-TPS Payments, Microservices',
    skillsOffered: 'Fintech Architecture, System Design, Startup Pitching',
    skillsWanted: 'Rust, eBPF, Kernel Optimization',
    totalPoints: 680,
    currentStreak: 6,
    longestStreak: 16,
  }, ALUMNI_PASSWORD);

  const alumni4 = await upsertUser({
    name: 'Dr. Rohan Kulkarni',
    email: 'rohan.kulkarni@apple.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2017,
    department: 'Computer Science',
    currentCompany: 'Apple',
    jobTitle: 'Principal Silicon & Compiler Engineer',
    location: 'London / Cupertino',
    linkedinUrl: 'https://linkedin.com/in/rohan-kulkarni-silicon',
    bio: 'Working on Apple Silicon toolchains, LLVM optimization passes, and neural accelerator architectures. Somaiya 2017 batch.',
    skills: 'C++, LLVM, Compilers, Computer Architecture, Rust, Performance Profiling',
    skillsOffered: 'Compiler Engineering, Low-level Systems, PhD & Research Guidance',
    skillsWanted: 'CUDA, TensorRT, Formal Verification',
    totalPoints: 920,
    currentStreak: 15,
    longestStreak: 30,
  }, ALUMNI_PASSWORD);

  const alumni5 = await upsertUser({
    name: 'Tanvi Varma',
    email: 'tanvi.varma@openai.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2021,
    department: 'Information Technology',
    currentCompany: 'OpenAI',
    jobTitle: 'Research Engineer (Inference Systems)',
    location: 'San Francisco / Bay Area',
    linkedinUrl: 'https://linkedin.com/in/tanvi-varma-ai',
    bio: 'Optimizing frontier transformer serving, FlashAttention kernels, and distributed GPU clusters. Open to mentoring women in STEM and systems engineering.',
    skills: 'Python, PyTorch, CUDA, Triton, GPU Architecture, Distributed Training',
    skillsOffered: 'Deep Learning Systems, GPU Kernel Dev, Research Internships',
    skillsWanted: 'FPGA Acceleration, Quantization Hardware',
    totalPoints: 810,
    currentStreak: 11,
    longestStreak: 22,
  }, ALUMNI_PASSWORD);

  const alumni6 = await upsertUser({
    name: 'Devendra Parekh',
    email: 'devendra.parekh@datadog.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2018,
    department: 'Computer Science',
    currentCompany: 'Datadog',
    jobTitle: 'Staff Systems Architect',
    location: 'New York / Remote',
    linkedinUrl: 'https://linkedin.com/in/devendra-parekh-datadog',
    bio: 'Observability at hyper-scale: ingesting trillions of telemetry events daily using Rust, Kafka, and eBPF. Active open source contributor.',
    skills: 'Rust, Kafka, eBPF, Distributed Tracing, Linux Kernel, Go',
    skillsOffered: 'Observability, High-Throughput Pipelines, Open Source Mentorship',
    skillsWanted: 'Vector Databases, HNSW Indexing',
    totalPoints: 760,
    currentStreak: 8,
    longestStreak: 19,
  }, ALUMNI_PASSWORD);

  const alumni7 = await upsertUser({
    name: 'Meera Iyer',
    email: 'meera.iyer@snowflake.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2020,
    department: 'Information Technology',
    currentCompany: 'Snowflake',
    jobTitle: 'Database Engine Specialist',
    location: 'Berlin / Amsterdam',
    linkedinUrl: 'https://linkedin.com/in/meera-iyer-db',
    bio: 'Columnar storage formats, vectorized query execution, and cache hierarchy optimization. Somaiya 2020 batch.',
    skills: 'C++, SIMD, Database Internals, Vectorized Execution, Query Planners',
    skillsOffered: 'Database Systems, C++ Optimization, European Tech Relocation',
    skillsWanted: 'Wasm Runtimes, Distributed Transactions',
    totalPoints: 690,
    currentStreak: 7,
    longestStreak: 14,
  }, ALUMNI_PASSWORD);

  const alumni8 = await upsertUser({
    name: 'Kabir Saxena',
    email: 'kabir@finscale.io',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2019,
    department: 'Computer Science',
    currentCompany: 'FinScale (YC W23)',
    jobTitle: 'Founder & CEO',
    location: 'Bengaluru / San Francisco',
    linkedinUrl: 'https://linkedin.com/in/kabir-saxena-founder',
    bio: 'Founded FinScale (YC W23) — real-time B2B cross-border clearing rails. Grew to $4M ARR. Eager to back and mentor Somaiya student founders.',
    skills: 'Product Strategy, TypeScript, Distributed Consensus, B2B Sales, Fundraising',
    skillsOffered: 'Founder Office Hours, YC Application Reviews, Angel Introductions',
    skillsWanted: 'Applied ML, Autonomous Agents',
    totalPoints: 950,
    currentStreak: 20,
    longestStreak: 45,
  }, ALUMNI_PASSWORD);

  const alumni9 = await upsertUser({
    name: 'Shreya Sen',
    email: 'shreya.sen@microsoft.com',
    role: 'ALUMNI',
    isVerified: true,
    isActive: true,
    batchYear: 2018,
    department: 'Computer Science',
    currentCompany: 'Microsoft',
    jobTitle: 'Cloud Security Architect',
    location: 'Seattle / Redmond',
    linkedinUrl: 'https://linkedin.com/in/shreya-sen-security',
    bio: 'Zero-trust cloud infrastructure, confidential computing enclaves, and cryptographic identity pipelines at Microsoft Azure.',
    skills: 'Cloud Security, Cryptography, Azure, Zero-Trust, Rust, Go',
    skillsOffered: 'Infosec Careers, Cloud Architecture, Mock Technical Interviews',
    skillsWanted: 'Quantum Key Distribution, Post-Quantum Cryptography',
    totalPoints: 730,
    currentStreak: 9,
    longestStreak: 18,
  }, ALUMNI_PASSWORD);

  console.log('🎓 Alumni seeded (9 profiles): Google, Amazon, Stripe, Apple, OpenAI, Datadog, Snowflake, FinScale, Microsoft');

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
    skillsOffered: 'Full-Stack React, Node.js',
    skillsWanted: 'Kubernetes, Distributed Systems, Go',
    resumeUrl: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
    totalPoints: 420,
    currentStreak: 6,
    longestStreak: 10,
  }, STUDENT_PASSWORD);

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
    skillsOffered: 'Frontend UI, Python Scripting',
    skillsWanted: 'AWS DynamoDB, System Design, Scalable APIs',
    resumeUrl: 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
    totalPoints: 350,
    currentStreak: 4,
    longestStreak: 8,
  }, STUDENT_PASSWORD);
  console.log('🎒 Students:', student1.email, '&', student2.email);

  // Generate embeddings for spatial and vector search
  const embedTargets = [alumni1, alumni2, alumni3, alumni4, alumni5, alumni6, alumni7, alumni8, alumni9, student1];
  for (const target of embedTargets) {
    await embedUser(target.id, profileText(target));
  }

  // 5. JOBS
  const job1 = await prisma.jobPosting.create({
    data: {
      postedById: alumni1.id,
      title: 'Software Engineer I (Cloud Infrastructure)',
      company: 'Google',
      location: 'Bengaluru / Hyderabad',
      jobType: 'FULL_TIME',
      experienceLevel: 'ENTRY',
      description: 'Join Google Cloud Core Infrastructure team to build scalable microservices and distributed storage engines for global enterprise tenants.',
      requirements: 'BS/BTech in CS/IT. Strong foundation in DSA, Operating Systems, and Networking.',
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
      description: 'Summer 2026 Software Development Internships for AWS payment infrastructure. Work directly with senior principal engineers on payment settlement pipelines.',
      requirements: 'Currently enrolled in CS/IT degree. Strong coding skills in Java/Python and algorithmic problem solving.',
      skills: 'Java, Data Structures, OOP, SQL, Problem Solving',
      salaryMin: 80000,
      salaryMax: 100000,
      referralSlots: 8,
      status: 'OPEN',
    },
  }).catch(() => null);

  const job3 = await prisma.jobPosting.create({
    data: {
      postedById: alumni4.id,
      title: 'Compiler & Toolchain Engineer',
      company: 'Apple',
      location: 'London / Remote UK',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      description: 'Design and optimize LLVM compiler passes for Apple Silicon neural accelerators. Focus on cache hierarchy locality and code generation throughput.',
      requirements: 'Degree in Computer Science or Electrical Engineering. Proficient in C++17/20, compiler internals, and assembly level profiling.',
      skills: 'C++, LLVM, Compilers, Computer Architecture, Performance Profiling',
      salaryMin: 6500000,
      salaryMax: 9000000,
      referralSlots: 3,
      status: 'OPEN',
    },
  }).catch(() => null);

  const job4 = await prisma.jobPosting.create({
    data: {
      postedById: alumni5.id,
      title: 'Inference Infrastructure Engineer (Triton / CUDA)',
      company: 'OpenAI',
      location: 'San Francisco, CA / Remote US',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      description: 'Accelerate real-time inference latency across multi-node GPU clusters. Develop custom Triton kernels, continuous batching schedulers, and KV-cache optimizations.',
      requirements: 'Deep understanding of GPU architecture, CUDA memory hierarchies, and low-latency C++/Python runtimes.',
      skills: 'CUDA, Triton, PyTorch, Distributed Systems, GPU Optimization',
      salaryMin: 18000000,
      salaryMax: 28000000,
      referralSlots: 4,
      status: 'OPEN',
    },
  }).catch(() => null);

  const job5 = await prisma.jobPosting.create({
    data: {
      postedById: alumni7.id,
      title: 'Database Engine Engineer (Vector & Columnar Execution)',
      company: 'Snowflake',
      location: 'Berlin / Amsterdam',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      description: 'Work on the next generation of Snowflake columnar execution engine with SIMD vectorization and lock-free concurrency.',
      requirements: 'Experience developing storage engines, query execution planners, or high-concurrency systems in C++ or Rust.',
      skills: 'C++, Rust, Database Internals, Vectorized Execution, SIMD',
      salaryMin: 5500000,
      salaryMax: 7800000,
      referralSlots: 5,
      status: 'OPEN',
    },
  }).catch(() => null);

  const job6 = await prisma.jobPosting.create({
    data: {
      postedById: alumni3.id,
      title: 'Senior Product Engineer (Global Settlement Rails)',
      company: 'Stripe',
      location: 'San Francisco / Remote',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      description: 'Architect multi-currency clearing and settlement rails handling tens of billions in annual transaction volume with zero downtime.',
      requirements: 'Strong product sense and expertise with distributed ledgers, relational databases, and resilient microservices.',
      skills: 'Go, Ruby, React, Distributed Consensus, High-TPS Payments',
      salaryMin: 12000000,
      salaryMax: 16000000,
      referralSlots: 6,
      status: 'OPEN',
    },
  }).catch(() => null);

  console.log('💼 Job Postings seeded (6 postings across Google, Amazon, Apple, OpenAI, Snowflake, Stripe)');

  // 6. EVENTS
  const event1 = await prisma.event.create({
    data: {
      title: '🌟 Annual Alumni Grand Homecoming & Tech Summit 2026',
      description: 'The premier annual gathering of Somaiya alumni, faculty, and graduating students. Keynotes from Silicon Valley CXOs, interactive panel sessions on AI infrastructure, and an evening networking banquet.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days ahead
      location: 'Main Auditorium, Somaiya Vidyavihar Campus, Mumbai',
      mode: 'OFFLINE',
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      maxCapacity: 350,
      createdById: admin.id,
    },
  }).catch(() => null);

  const event2 = await prisma.event.create({
    data: {
      title: '⚡ High-Performance Systems & Distributed Databases Fireside',
      description: 'Deep dive into columnar storage formats, vectorized query execution, and high-throughput telemetry pipelines with alumni engineers from Snowflake and Datadog.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days ahead
      location: 'Virtual Enclave (Google Meet / Zoom)',
      mode: 'ONLINE',
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      maxCapacity: 500,
      createdById: faculty1.id,
    },
  }).catch(() => null);

  const event3 = await prisma.event.create({
    data: {
      title: '🤖 Frontier LLM Architecture & GPU Kernel Optimization Masterclass',
      description: 'Exclusive masterclass with OpenAI research engineer Tanvi Varma covering Triton kernel construction, FlashAttention internals, and LLM inference serving architectures.',
      date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days ahead
      location: 'Virtual Room 4A // Stream Link provided upon RSVP',
      mode: 'ONLINE',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      maxCapacity: 250,
      createdById: faculty2.id,
    },
  }).catch(() => null);

  const event4 = await prisma.event.create({
    data: {
      title: '🌉 Bay Area & Silicon Valley Alumni Networking Mixer',
      description: 'Informal evening mixer in downtown San Francisco for Bay Area Somaiya alumni across tech, venture capital, and startups. Drinks and appetizers sponsored.',
      date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days ahead
      location: 'Press Club, 20 Yerba Buena Ln, San Francisco, CA',
      mode: 'OFFLINE',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      maxCapacity: 120,
      createdById: alumni3.id,
    },
  }).catch(() => null);

  // Seed Event RSVPs
  if (event1) {
    await prisma.eventRSVP.createMany({
      data: [
        { eventId: event1.id, userId: alumni1.id },
        { eventId: event1.id, userId: alumni2.id },
        { eventId: event1.id, userId: student1.id },
        { eventId: event1.id, userId: student2.id },
      ],
      skipDuplicates: true,
    }).catch(() => {});
  }

  if (event2) {
    await prisma.eventRSVP.createMany({
      data: [
        { eventId: event2.id, userId: alumni6.id },
        { eventId: event2.id, userId: alumni7.id },
        { eventId: event2.id, userId: student1.id },
      ],
      skipDuplicates: true,
    }).catch(() => {});
  }

  console.log('📅 Events & RSVPs seeded (4 major events across Mumbai, SF, and Online)');

  // 7. SUCCESS STORIES
  await prisma.successStory.createMany({
    data: [
      {
        alumniId: alumni8.id,
        title: 'Bootstrapping FinScale to $4M ARR & Y Combinator W23',
        story: 'Started as a campus capstone project in 2019 exploring cross-border settlement latency. After 3 years of engineering and surviving countless rejections, we got into YC W23 and now clear billions in annual transaction volume for enterprises worldwide. My biggest takeaway for current students: master system fundamentals first, the frameworks change every two years.',
        company: 'FinScale (YC W23)',
        role: 'Founder & CEO',
        batchYear: 2019,
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
        isApproved: true,
        isFeatured: true,
        upvoteCount: 142,
      },
      {
        alumniId: alumni2.id,
        title: 'From Somaiya Labs to Architecting AWS Core Payment Systems',
        story: 'When I graduated in 2021, I was terrified of large distributed codebases. At AWS, I realized that the foundational operating systems and database coursework from our professors directly prepared me to handle real-world mission-critical outages. Today I lead payment settlement pipelines across millions of daily transactions.',
        company: 'Amazon',
        role: 'Software Development Engineer II',
        batchYear: 2021,
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
        isApproved: true,
        isFeatured: true,
        upvoteCount: 98,
      },
      {
        alumniId: alumni1.id,
        title: 'Scaling Google Cloud Kubernetes Fleet to 10M+ Containers',
        story: 'Six years ago I was an engineering student debugging my first Go routine. Today at Google, our team ensures multi-tenant container orchestration stays reliable during global regional network partitions. Grateful to the alumni network for mentoring me during my initial campus placement prep.',
        company: 'Google',
        role: 'Senior Software Engineer (L5)',
        batchYear: 2019,
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        isApproved: true,
        isFeatured: true,
        upvoteCount: 86,
      },
      {
        alumniId: alumni7.id,
        title: 'Building Snowflake Next-Gen Vectorized Query Engine',
        story: 'Database internals are often seen as intimidating, but working on columnar memory layouts and SIMD registers at Snowflake in Berlin has been the most rewarding engineering journey of my life. Keep an open mind to European tech opportunities!',
        company: 'Snowflake',
        role: 'Database Engine Specialist',
        batchYear: 2020,
        imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
        isApproved: true,
        isFeatured: true,
        upvoteCount: 64,
      },
      {
        alumniId: alumni5.id,
        title: 'Frontier AI Research: Building Low-Latency Triton Inference Kernels',
        story: 'At OpenAI, optimizing model latency means squeezing every microsecond out of GPU tensor cores. The math and computer organization lectures at Somaiya laid the groundwork for everything I do today. Proud to give back through PRO-ALUMN flash advisory sessions.',
        company: 'OpenAI',
        role: 'Research Engineer',
        batchYear: 2021,
        imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
        isApproved: true,
        isFeatured: true,
        upvoteCount: 119,
      },
    ],
    skipDuplicates: true,
  }).catch(() => {});
  console.log('🏆 Success Stories seeded (5 approved & featured stories across YC, AWS, Google, Snowflake, OpenAI)');

  // 8. MENTORSHIP & REFERRALS
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

  // Seed Mentorship relationship with dual-handshake
  await prisma.mentorship.upsert({
    where: { studentId_mentorId: { studentId: student1.id, mentorId: alumni1.id } },
    update: {},
    create: {
      studentId: student1.id,
      mentorId: alumni1.id,
      area: 'Distributed Systems & Cloud Architecture',
      message: 'Seeking guidance on Go microservice optimization and capstone project review.',
      status: 'ACCEPTED',
      creditsCharged: 30,
      isCompleted: false,
      studentConfirmed: true,
      mentorConfirmed: true,
    },
  }).catch(() => {});

  await prisma.mentorship.upsert({
    where: { studentId_mentorId: { studentId: student2.id, mentorId: alumni2.id } },
    update: {},
    create: {
      studentId: student2.id,
      mentorId: alumni2.id,
      area: 'Backend Engineering & System Design',
      message: 'Preparing for summer SDE internship interviews at AWS.',
      status: 'ACCEPTED',
      creditsCharged: 30,
      isCompleted: false,
      studentConfirmed: true,
      mentorConfirmed: false,
    },
  }).catch(() => {});
  console.log('🤝 Mentorship connections seeded');

  // 9. OFFICIAL ANNOUNCEMENTS
  await prisma.announcement.create({
    data: {
      title: '🌟 Annual Alumni Grand Homecoming & Tech Summit 2026',
      body: 'We are delighted to invite all Alumni, Faculty, and Students to the Annual Homecoming Summit on September 15, 2026. Featuring keynotes from global alumni CXOs, panel discussions, and career networking dinners.',
      createdById: admin.id,
    },
  }).catch(() => {});

  await prisma.announcement.create({
    data: {
      title: '🚨 Campus Placement Season 2026: Phase-1 Registrations Open',
      body: 'All final year students (Batch of 2026) are required to complete their profile verification and upload their updated resumes on PRO ALUMN before August 30.',
      createdById: admin.id,
    },
  }).catch(() => {});

  console.log('📢 Announcements seeded');
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
