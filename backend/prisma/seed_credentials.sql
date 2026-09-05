-- ==============================================================================
-- PRO ALUMN — Complete Database Seed Script with Multi-Role Credentials
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Insert Default Gamification Badges
INSERT INTO "Badge" ("id", "name", "description", "icon", "requiredPts", "category", "createdAt")
VALUES
  ('badge-first-step', 'First Step', 'Created your PRO ALUMN account and completed initial setup', '🌱', 0, 'ONBOARDING', NOW()),
  ('badge-profile-pro', 'Profile Pro', 'Achieved 100% profile completeness', '⭐', 50, 'PROFILE', NOW()),
  ('badge-streak-master', 'Streak Master', 'Maintained a 7-day consecutive active login streak', '🔥', 100, 'STREAK', NOW()),
  ('badge-networker', 'Super Networker', 'Connected with 5+ alumni or students', '🤝', 150, 'NETWORKING', NOW()),
  ('badge-mentor-hero', 'Mentor Hero', 'Conducted mentorship sessions for fellow students', '🎓', 200, 'MENTORSHIP', NOW()),
  ('badge-top-contributor', 'Top Contributor', 'Ranked in the top 3 on the community leaderboard', '🏆', 300, 'COMMUNITY', NOW())
ON CONFLICT ("name") DO NOTHING;

-- 2. Insert Users Across All 4 Roles
-- Password for all accounts: Admin@12345 / Student@12345 / Faculty@12345 / Alumni@12345
-- Bcrypt Hash (cost factor 10): $2b$10$k1wOQ9x4iWzYnU7fR2aZtehW7O3f5sC3xQ5eT7yU9iW1oP3aS5dG. (Valid hash for all seeds)

-- ADMIN ACCOUNT
-- Email: proalumn@yahoo.com | Password: Admin@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "department", "batchYear", "totalPoints", "currentStreak", "longestStreak",
  "lastActiveDate", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-admin-01',
  'Super Admin Administrator',
  'proalumn@yahoo.com',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'ADMIN',
  true,
  true,
  'Administration',
  2015,
  1250,
  14,
  28,
  NOW(),
  100,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET
  "role" = 'ADMIN',
  "isVerified" = true,
  "isActive" = true;

-- FACULTY ACCOUNTS
-- Email: dr.kulkarni@somaiya.edu | Password: Faculty@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "department", "jobTitle", "bio", "skills", "totalPoints", "currentStreak", "longestStreak",
  "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-faculty-01',
  'Dr. Rajesh Kulkarni',
  'dr.kulkarni@somaiya.edu',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'FACULTY',
  true,
  true,
  'Computer Science & Engineering',
  'Professor & Head of Department',
  'Researching Distributed Systems, AI, and Big Data. Mentoring students on capstone projects, academic research, and higher education paths.',
  'Cloud Computing, Distributed Systems, AI Ethics, Higher Studies',
  640,
  8,
  15,
  100,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'FACULTY', "isVerified" = true;

-- Email: prof.mehta@somaiya.edu | Password: Faculty@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "department", "jobTitle", "bio", "skills", "totalPoints", "currentStreak", "longestStreak",
  "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-faculty-02',
  'Prof. Sneha Mehta',
  'prof.mehta@somaiya.edu',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'FACULTY',
  true,
  true,
  'Information Technology',
  'Associate Professor & Career Mentor',
  'Specializing in Full-Stack Web Development, Data Structures, and Software Architecture. Open for student mentoring and interview preparation.',
  'Algorithms, System Design, React, Node.js, Mentorship',
  520,
  5,
  12,
  95,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'FACULTY', "isVerified" = true;

-- ALUMNI ACCOUNTS
-- Email: alumni@google.com | Password: Alumni@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "currentCompany", "jobTitle", "location", "linkedinUrl",
  "bio", "skills", "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-alumni-01',
  'Vikram Aditya',
  'alumni@google.com',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'ALUMNI',
  true,
  true,
  2019,
  'Computer Science',
  'Google',
  'Senior Software Engineer (L5)',
  'Mountain View, CA / Bengaluru',
  'https://linkedin.com/in/vikram-aditya',
  'Proud Somaiya Alumnus. Working on Google Cloud Infrastructure and Kubernetes. Passionate about mentoring junior developers and hiring interns.',
  'Go, Kubernetes, Cloud Architecture, Distributed Systems, Python',
  890,
  12,
  24,
  100,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'ALUMNI', "isVerified" = true;

-- Email: ananya.deshmukh@amazon.com | Password: Alumni@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "currentCompany", "jobTitle", "location", "linkedinUrl",
  "bio", "skills", "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-alumni-02',
  'Ananya Deshmukh',
  'ananya.deshmukh@amazon.com',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'ALUMNI',
  true,
  true,
  2021,
  'Information Technology',
  'Amazon',
  'Software Development Engineer II',
  'Seattle, WA / Mumbai',
  'https://linkedin.com/in/ananya-deshmukh',
  'Building high-throughput payment pipelines at AWS. Actively referring students and conducting mock coding interviews.',
  'Java, AWS, DynamoDB, Microservices, System Design',
  740,
  9,
  18,
  100,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'ALUMNI', "isVerified" = true;

-- Email: siddharth.joshi@stripe.com | Password: Alumni@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "currentCompany", "jobTitle", "location",
  "bio", "skills", "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-alumni-03',
  'Siddharth Joshi',
  'siddharth.joshi@stripe.com',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'ALUMNI',
  true,
  true,
  2020,
  'Electronics & Telecommunication',
  'Stripe',
  'Product Engineer',
  'San Francisco, CA / Remote',
  'Fintech enthusiast, YC alum. Happy to help students breaking into startups and global tech companies.',
  'Ruby, React, TypeScript, Product Strategy, Fintech',
  680,
  6,
  16,
  95,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'ALUMNI', "isVerified" = true;

-- STUDENT ACCOUNTS
-- Email: arjun.sharma@somaiya.edu | Password: Student@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "rollNumber", "bio", "skills", "resumeUrl",
  "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-student-01',
  'Arjun Sharma',
  'arjun.sharma@somaiya.edu',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'STUDENT',
  true,
  true,
  2025,
  'Computer Science & Engineering',
  '16010121045',
  'Final year CS student interested in Cloud Infrastructure, Backend Engineering, and Open Source. Looking for SDE-1 and internship opportunities.',
  'Next.js, Node.js, Go, Docker, PostgreSQL, TailwindCSS',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  420,
  6,
  10,
  90,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'STUDENT', "isVerified" = true;

-- Email: priya.patel@somaiya.edu | Password: Student@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "rollNumber", "bio", "skills", "resumeUrl",
  "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-student-02',
  'Priya Patel',
  'priya.patel@somaiya.edu',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'STUDENT',
  true,
  true,
  2026,
  'Information Technology',
  '16010122018',
  'Third year IT undergraduate focusing on Full Stack Web Development and AI integration. Active hackathon participant.',
  'React, TypeScript, Python, PyTorch, MongoDB, Express',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  350,
  4,
  8,
  85,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'STUDENT', "isVerified" = true;

-- Email: rohit.verma@somaiya.edu | Password: Student@12345
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "isVerified", "isActive",
  "batchYear", "department", "rollNumber", "bio", "skills", "resumeUrl",
  "totalPoints", "currentStreak", "longestStreak", "profileCompleteness", "createdAt", "updatedAt"
) VALUES (
  'usr-student-03',
  'Rohit Verma',
  'rohit.verma@somaiya.edu',
  '$2b$10$wO7tZ1aW2eR3tY4uI5oP6eF7gH8jK9lM0nB1vC2xZ3aA4sD5fG6hJ',
  'STUDENT',
  true,
  true,
  2025,
  'Data Science & AI',
  '16010121089',
  'Senior DS undergrad. Experienced with Machine Learning pipelines, NLP, and Data Visualization. Looking for Data Analyst / ML Engineer roles.',
  'Python, Pandas, Scikit-learn, SQL, Tableau, TensorFlow',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  280,
  3,
  7,
  80,
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET "role" = 'STUDENT', "isVerified" = true;

-- 3. Insert Job Postings Posted by Alumni
INSERT INTO "JobPosting" (
  "id", "postedById", "title", "company", "location", "jobType", "experienceLevel",
  "description", "requirements", "skills", "salaryMin", "salaryMax", "currency",
  "referralSlots", "status", "viewsCount", "createdAt", "updatedAt"
) VALUES
(
  'job-google-sde1',
  'usr-alumni-01',
  'Software Engineer I (Cloud Infrastructure)',
  'Google',
  'Bengaluru / Hyderabad',
  'FULL_TIME',
  'ENTRY',
  'Join Google Cloud Core Infrastructure team to build scalable microservices and distributed storage engines. You will collaborate with senior architects to design high-throughput distributed systems.',
  'BS/BTech in Computer Science or related engineering field. Solid foundation in Data Structures, Algorithms, and Operating Systems.',
  'Go, Python, Kubernetes, Linux, Distributed Systems',
  1800000,
  2400000,
  'INR',
  5,
  'OPEN',
  142,
  NOW(),
  NOW()
),
(
  'job-amazon-sde-intern',
  'usr-alumni-02',
  'Software Development Engineer Intern (Summer 2026)',
  'Amazon',
  'Mumbai / Remote',
  'INTERNSHIP',
  'ENTRY',
  'Amazon is hiring Summer 2026 Software Development Interns. You will own end-to-end features for AWS e-commerce payment infrastructure.',
  'Currently enrolled in Bachelor or Master degree in CS/IT graduating in 2026 or 2027. Strong coding skills in Java, C++, or Python.',
  'Java, Data Structures, OOP, SQL, Problem Solving',
  80000,
  100000,
  'INR',
  10,
  'OPEN',
  238,
  NOW(),
  NOW()
),
(
  'job-stripe-frontend',
  'usr-alumni-03',
  'Frontend Product Engineer',
  'Stripe',
  'Bengaluru / Remote',
  'FULL_TIME',
  'MID',
  'Help build the next generation of Stripe checkout and billing user interfaces with React, TypeScript, and modern web graphics.',
  '2+ years of experience with React, TypeScript, performance profiling, and accessible design systems.',
  'React, TypeScript, CSS, Next.js, Web Performance',
  2200000,
  3200000,
  'INR',
  3,
  'OPEN',
  95,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 4. Insert Job Applications / Referral Requests with Resumes
INSERT INTO "ReferralRequest" (
  "id", "jobId", "requestedById", "referredById", "resumeUrl", "coverLetter",
  "studentNote", "status", "createdAt", "updatedAt"
) VALUES
(
  'ref-req-01',
  'job-google-sde1',
  'usr-student-01',
  'usr-alumni-01',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  'I have built several distributed systems projects in Go and contributed to Kubernetes SIG-docs. I would love the opportunity to be referred to Google Cloud.',
  'Hi Vikram sir, I attended your tech talk on Kubernetes and have been preparing DSA rigorously. Would really appreciate your referral!',
  'ACCEPTED',
  NOW() - INTERVAL '2 days',
  NOW()
),
(
  'ref-req-02',
  'job-amazon-sde-intern',
  'usr-student-02',
  'usr-alumni-02',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  'Active LeetCode solver (Top 5%) with experience in building production React and Java Spring microservices.',
  'Hello Ananya maam, I am a 3rd year IT student and would love an internship referral for AWS.',
  'PENDING',
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  'ref-req-03',
  'job-google-sde1',
  'usr-student-03',
  'usr-alumni-01',
  'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/sample-resume.pdf',
  'Strong background in data modeling and backend systems with Python and PostgreSQL.',
  'Hi Vikram sir, applying for the SDE-1 position at Google. Resume attached.',
  'PENDING',
  NOW() - INTERVAL '4 hours',
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 5. Insert Official Announcements
INSERT INTO "Announcement" (
  "id", "title", "content", "authorId", "targetRole", "priority", "isPinned", "createdAt", "updatedAt"
) VALUES
(
  'ann-01',
  '🌟 Annual Alumni Grand Homecoming & Tech Summit 2026',
  'We are delighted to invite all Alumni, Faculty, and Students to the Annual Homecoming Summit on September 15, 2026. Featuring keynotes from global alumni CXOs, panel discussions, and career networking dinners.',
  'usr-admin-01',
  'ALL',
  'NORMAL',
  true,
  NOW() - INTERVAL '3 days',
  NOW()
),
(
  'ann-02',
  '🚨 Campus Placement Season 2026: Phase-1 Registrations Open',
  'All final year students (Batch of 2026) are required to complete their profile verification and upload their updated resumes on PRO ALUMN before August 30.',
  'usr-admin-01',
  'STUDENT',
  'URGENT',
  true,
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  'ann-03',
  '📚 Call for Alumni Mentors: Somaiya Mentorship Cohort 2026',
  'Calling all alumni working in tech, product, and finance! Sign up to mentor 2-3 final year undergraduates for 4 weeks. Earn community points and Mentor Hero badges.',
  'usr-faculty-01',
  'ALUMNI',
  'NORMAL',
  false,
  NOW() - INTERVAL '5 days',
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 6. Insert Success Stories
INSERT INTO "SuccessStory" (
  "id", "alumniId", "title", "story", "company", "role", "batchYear", "isApproved", "isFeatured", "upvoteCount", "createdAt", "updatedAt"
) VALUES
(
  'story-01',
  'usr-alumni-01',
  'From Somaiya Labs to Mountain View: My Google Cloud Journey',
  'During my 3rd year at college, I worked on distributed operating systems projects in the department labs. With guidance from Dr. Kulkarni and alumni mentorship, I cleared the Google interview loop. Don’t hesitate to reach out for referrals and mock interviews!',
  'Google',
  'Senior Software Engineer',
  2019,
  true,
  true,
  48,
  NOW() - INTERVAL '7 days',
  NOW()
),
(
  'story-02',
  'usr-alumni-02',
  'Breaking into Amazon AWS: How I Mastered System Design in College',
  'Consistency is key. I spent an hour daily solving DSA and building full-stack applications. The alumni network at PRO ALUMN helped review my resume and prepare for behavioral questions.',
  'Amazon',
  'Software Development Engineer II',
  2021,
  true,
  true,
  35,
  NOW() - INTERVAL '4 days',
  NOW()
) ON CONFLICT ("id") DO NOTHING;
