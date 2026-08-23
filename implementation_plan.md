# Production Landing Page Overhaul & Theme Contrast Architecture Plan

This plan details the full-stack design and content upgrades for **PRO ALUMN**:
1. **Fix Color Contrast & Theme Synchronization**: Resolve the low-contrast / washed-out text on the Announcements and interior pages by fully supporting Dark/Light mode in `RoleShell` and adding an in-app `ThemeToggle`.
2. **Landing Page Overhaul (Production Grade)**: Build an enterprise-grade, high-converting landing page showcasing all platform features, extra pages (Announcements, Google Workspace, Giving, Stories, Education, Mentorship, Events), and interactive live preview widgets.
3. **Update Technical Architecture Cards**: Completely replace legacy references (SendGrid, Twilio, Cloudinary) with modern **Google Ecosystem** integrations (Google OAuth 2.0, Firebase Auth & Firestore, Google Gemini AI / pgvector 384-dim, and Google Workspace Suite: Docs, Keep, Gmail, Forms, Calendar).

---

## User Review Required

> [!IMPORTANT]
> **Root Cause of the Low-Contrast Announcements Page**:
> `RoleShell.tsx` hardcoded light background colors (`bg-slate-50`, `bg-white`, `border-slate-200`) without `dark:` variants. When a user's system preference or toggle enabled dark mode (`.dark` on `<html>`), inner elements switched to light text (`dark:text-slate-100`), rendering light text on a light background. 
> We will fix `RoleShell.tsx` and all layout shells so that both Light Mode and Dark Mode render with crisp, high-contrast, WCAG AAA compliant styling, and add a `ThemeToggle` directly to the dashboard header.

---

## Proposed Changes

### Component 1: Theme Consistency & RoleShell Contrast Fixes

#### [MODIFY] [RoleShell.tsx](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/components/RoleShell.tsx)
- Add full dark mode class support across container, sidebar, top header, search bar, dropdowns, and navigation items (`dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`).
- Embed `<ThemeToggle />` into the dashboard top navigation bar next to the Role Switcher and Notification Bell.
- Ensure all hover, active, and focus states have high contrast in both themes.

#### [MODIFY] [AnnouncementsPage](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/app/announcements/page.tsx)
- Ensure all category badges, empty state cards, search inputs, and Markdown info banners have crystal-clear contrast in both light and dark modes.

---

### Component 2: Production-Grade Landing Page (`frontend/app/page.tsx`)

#### [MODIFY] [page.tsx](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/app/page.tsx)
1. **Hero & Dynamic Search**:
   - Modernized typography, glowing background mesh, live platform metrics counter (1,200+ Verified Alumni, 85% Referral Success, 384-Dim AI Vectors, 40+ Top Companies).
   - Interactive live search box filtering alumni by company (Google, Microsoft, Amazon), role (SWE, PM, ML, Design), and location.
   - High-contrast CTAs ("Get Started Free" & "Explore Live Directory").

2. **Interactive Referral Lifecycle Engine**:
   - Visual 4-stage referral machine (Pending → Accepted → Referred → Hired) with status badges and live tracker walkthrough.

3. **Expanded Feature Surfaces (Showcasing Extra Pages)**:
   - **Directory & AI Matching** (`/directory`): 384-dim semantic ranking with live multi-filter chips.
   - **Job Board & Referrals** (`/jobs`, `/referrals`): Filterable openings with instant "Ask Referral" packet builder.
   - **Campus & Alumni Announcements** (`/announcements`): Official university broadcasts with pinned priority and rich formatting.
   - **Google Workspace Suite** (`/docs`, `/keep`, `/communications`, `/forms`, `/calendar`): Native collaboration tools for Docs, Keep notes, Gmail dispatch, survey forms, and Google Calendar.
   - **Mentorship Hub** (`/mentorship`): AI-matched mentor recommendations and 1:1 scheduling.
   - **Spotlight Wall** (`/stories`): Moderated career stories and community upvoting.
   - **Alumni Giving & Philanthropy** (`/giving`): Department initiatives, scholarship funds, and donor leaderboard.
   - **Education & Career Center** (`/education`): Technical interview sprints, salary negotiation guides, and resume templates.
   - **Real-Time Messaging** (`/chat`): Threaded 1:1 and role-based group channels.
   - **Admin Command Center** (`/admin`): Verification queues, CSV bulk import, and referral funnel analytics.

4. **Technical Architecture Cards (Google Ecosystem Overhaul)**:
   - **Card 1: Google Gemini AI & pgvector**: 384-dimensional vector embeddings with PostgreSQL `pgvector` + HNSW cosine index for instant similarity matching.
   - **Card 2: Google OAuth 2.0 & Firebase**: Single Sign-On with Google OAuth 2.0, Firebase Authentication, and Firestore real-time profile replication.
   - **Card 3: Google Workspace Ecosystem**: Seamless productivity integrations with Google Docs, Google Keep, Gmail API, Google Forms, and Google Calendar.
   - **Card 4: Full-Stack Enterprise Stack**: Next.js 14 App Router, Express API on Railway, PostgreSQL database with Prisma ORM, and JWT security.
   - **Updated Code Window**: Code snippet demonstrating Google OAuth token exchange and Gemini pgvector similarity query.

---

### Component 3: PreLogin Navigation & Footer Polish

#### [MODIFY] [PreLoginNav.tsx](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/components/PreLoginNav.tsx)
- Ensure navigation links, theme toggle, and CTA buttons have high contrast and smooth backdrop blur.

---

## Verification Plan

### Automated Build & Lint Check
- Verify that Next.js TypeScript compilation and Tailwind class resolution pass without errors.

### Manual Verification
1. **Contrast & Theme Verification**:
   - Check the Announcements page in both Light Mode (`#F8FAFC`) and Dark Mode (`#090D16` / `#020617`).
   - Confirm all text (headings, subheaders, cards, badges, search bar, empty state) is readable and high-contrast.
   - Test toggling between Light and Dark mode using the `ThemeToggle` in `RoleShell` header and `PreLoginNav`.
2. **Landing Page Production Review**:
   - Verify that all extra pages (Announcements, Google Docs, Keep, Gmail, Forms, Calendar, Mentorship, Giving, Stories, Education) are clearly highlighted.
   - Verify that the Technical Architecture section displays Google OAuth 2.0, Firebase, Gemini AI, and Google Workspace integrations (with no legacy SendGrid/Twilio/Cloudinary mentions).
   - Test all buttons and links to ensure proper routing.
