# PRD (Product Requirements Document) & Design Brief

## 1. Product Overview
**Product Name:** PRO ALUMN (formerly Alumnia)
**Mission:** To bridge the gap between current students and successful alumni by providing a unified platform for mentorship, networking, and career advancement.

## 2. Target Audience
*   **Students:** Looking for guidance, internships, job referrals, and career advice.
*   **Alumni:** Wanting to give back, recruit talent for their companies, and stay connected with their alma mater.
*   **Faculty/Admins:** Monitoring engagement, posting official announcements, and approving content (like success stories).

## 3. Core Features & Requirements
*   **Role-Based Access Control:** Secure authentication routing users to specific dashboards based on their role (Student, Alumni, Faculty, Admin).
*   **Job Board & Referral System:** Alumni can post jobs with specific "referral slots". Students can request referrals directly through the platform.
*   **Mentorship & Scheduling:** Students can request mentorship from alumni. Integrated with Google Calendar to easily schedule Google Meet sessions.
*   **Real-Time Chat:** WebSockets-powered messaging for instant 1:1 and group communication.
*   **Success Stories:** A feed of alumni achievements that can be upvoted by the community.
*   **Event Management:** Platform to create, RSVP, and manage online/offline networking events.
*   **Smart Matching (Future/Ongoing):** AI/Vector-based matching using `pgvector` to connect students with the most relevant alumni based on skills and interests.

## 4. Design Brief
*   **Aesthetic:** Professional, trustworthy, and modern. 
*   **Design System:** Built on a custom Tailwind configuration using specific semantic tokens: `ink`, `sage`, `brass`, `clay`, `mist`, and `paper`.
*   **Typography:** **Inter** for clean, legible UI text and **Plus Jakarta Sans** for impactful display headings.
*   **Accessibility & UX:** Fully responsive 8-page UI system, Masonry layouts for content-heavy pages, and native Dark Mode support out of the box.
