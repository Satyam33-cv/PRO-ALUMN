# Platform Updates Summary & End-to-End Testing Guide

This document summarizes all new platform systems added to **PRO ALUMN** and outlines a step-by-step workflow to test every feature locally.

---

## 1. Summary of All New Systems & Changes

### 📡 A. Real-Time Telemetry & Presence Monitoring
- **Live WebSocket Engine**: Replaced polling with bidirectional Socket.io broadcasts (`presence_snapshot`, `presence_update`, `activity_stream`).
- **Telemetry Dashboard in `/admin`**:
  - Live Online User count with animated pulse pill.
  - Database latency monitor & connection health status.
  - Real-time audit activity feed with Pause/Resume stream controls.

---

### 🎨 B. Unified CMS & Custom Page Builder
- **Site Page Builder**: Added visual builder in Admin Panel under **CMS -> Custom Pages**.
- **Block Types**:
  - **Markdown / Rich Text**: Formatted text, headers, and code blocks.
  - **Features Grid**: Multi-card capability showcases with category tags.
  - **Call to Action (CTA)**: Hero banner with custom action buttons and routes.
  - **FAQ Accordion**: Expandable questions and answers.
- **Dynamic Routing**: Instant publishing to `http://localhost:3000/[slug]` with SEO-optimized metadata and reserved slug protection.

---

### 🎬 C. Video Marketplace Moderation
- **Moderation Queue**: Dedicated queue in Admin Panel under **Moderation -> Video Marketplace**.
- **Server Action Pipeline**:
  - Direct video preview link.
  - `approveVideoAction`: Publishes video to marketplace.
  - `rejectVideoAction`: Rejects inappropriate or broken media.

---

### 💰 D. Wallet Credit Ledger & Direct Point Adjustments
- **Immutable Ledger**: Every point movement creates an auditable `WalletTransaction` record (`CREDIT` / `DEBIT`) linked to a user `Wallet`.
- **Admin Adjustment Tool**: Manual point awards or deductions with required audit reasons and auto-creation of missing wallets.
- **Live Gamification Nav**: Navbar displays real-time wallet balance and daily login streak indicator (`🔥 {streak}d streak`).

---

### 🛡️ E. Profile Verification, Gate & Referral Crediting
- **Config-Driven Verification**:
  - Controlled by `VERIFICATION_MODE = "free" | "paid"`.
  - **Paid Mode (₹29)**: Razorpay order generation + server-side HMAC-SHA256 signature verification.
  - **Free Mode**: College domain validation (`@somaiya.edu`, `.edu`, `.ac.in`), ID card document upload, or 6-digit OTP (`123456`).
  - **No-Double-Charge Guarantee**: Resubmitting after admin rejection checks existing successful `PaymentRecord` entries to skip payment.
- **Navigation Gate**: Next.js Middleware automatically intercepts unverified users:
  - `INCOMPLETE` / `REJECTED` $\rightarrow$ Redirects to `/complete-profile`.
  - `PENDING` $\rightarrow$ Redirects to `/verify-profile` holding screen.
  - `APPROVED` $\rightarrow$ Full dashboard access.
- **Approval-Gated Referral Rewards**: Inside an atomic `prisma.$transaction`:
  - Member receives **+50 pts** welcome bonus.
  - Referrer receives **+100 pts** referral bonus.
  - Missing/inactive referrer accounts fail gracefully without blocking member approval.

---

## 2. Step-by-Step Workflow to Test Everything

### Prerequisites: Start Dev Servers
```bash
# Terminal 1: Start Backend API (Port 4000)
cd backend
npm run dev

# Terminal 2: Start Frontend Next.js (Port 3000)
cd frontend
npm run dev
```

---

### Test Flow 1: Profile Completion, Verification Gate & Referral Crediting

1. **Get Referrer Code**:
   - Open `http://localhost:3000/login` and log in with an existing user or admin (`admin@college.edu` / `Admin@12345`).
   - Note the user's `referralCode` (e.g. `PRO-XXXXXX`) in `/profile` or the DB.
2. **Register a New Member**:
   - Open an Incognito Window $\rightarrow$ Navigate to `http://localhost:3000/register`.
   - Register a new student account (`newstudent@somaiya.edu`).
3. **Verify Middleware Gate**:
   - Try navigating to `http://localhost:3000/home` or `http://localhost:3000/jobs`.
   - Notice the automatic redirect to `http://localhost:3000/complete-profile`.
4. **Complete Profile Details**:
   - Fill in: Full Name, Department, Batch Year (e.g., `2025`), Skills, LinkedIn URL.
   - In the **Referral Code** field, enter the referrer code from Step 1.
   - Click **Continue to Verification Step**.
5. **Verify Identity (Free Mode or Paid Mode)**:
   - **Free Mode**: Select **College Email** (or **ID Upload** / **OTP** `123456`) and click **Submit Verification**.
   - **Paid Mode** (when `VERIFICATION_MODE="paid"` in `.env`): Click **Pay ₹29 & Submit**.
6. **Verify Holding Screen**:
   - You are redirected to `http://localhost:3000/verify-profile`.
   - Shows "Profile Under Admin Review", verification badge, and background polling.
7. **Admin Approval & Ledger Check**:
   - Switch to the Admin browser window $\rightarrow$ Go to `http://localhost:3000/admin` $\rightarrow$ **Moderation** tab.
   - Locate the new user in the **Alumni Credential Verification Queue** with their verification badge and referral tag.
   - Click **Approve (+50 pts)**.
8. **Verify Automatic Redirect & Balances**:
   - Switch back to the student's Incognito window. Within a few seconds, the holding screen detects approval and redirects to `http://localhost:3000/home`.
   - Check the top navbar: Student has **50 pts**.
   - Check the Referrer's profile: Referrer received **+100 pts**.

---

### Test Flow 2: Rejection & Resubmission (No-Double-Charge Check)

1. In the Admin Panel (`/admin` $\rightarrow$ **Moderation**), click **Reject** on a pending profile.
2. Enter feedback in the Rejection Reason Modal (e.g. *"Please re-enter correct graduation year"*).
3. Log in as that rejected user:
   - Redirected to `/complete-profile` with the admin's feedback banner displayed at the top.
4. Correct details $\rightarrow$ Resubmit.
5. In Paid mode, verify it recognizes the prior payment receipt and submits without charging again!

---

### Test Flow 3: CMS Custom Page Builder & Live Dynamic Route

1. Go to `http://localhost:3000/admin` $\rightarrow$ **CMS** tab $\rightarrow$ **Custom Pages**.
2. Click **+ Create Custom Page**.
3. Fill in:
   - **Page Title**: `Campus Innovation Hub`
   - **URL Slug**: `innovation-hub`
   - **Hero Headline**: `Welcome to the Innovation Center`
4. Add content blocks:
   - Click **+ Text** and enter markdown details.
   - Click **+ Features** to display 3 highlight cards.
   - Click **+ CTA Banner** with button linking to `/directory`.
   - Click **+ FAQ** with questions.
5. Select **Publish Immediately** $\rightarrow$ Click **Create & Save Page**.
6. Open `http://localhost:3000/innovation-hub` in your browser to view the live page.

---

### Test Flow 4: Real-Time Telemetry & Video Market Moderation

1. Open `/admin` $\rightarrow$ **Mission Control** tab.
2. Open another browser tab/window $\rightarrow$ log in.
3. Observe the **Online Now** count and live activity stream update in real time over WebSockets.
4. Go to **Moderation** tab $\rightarrow$ **Video Marketplace** queue.
5. Click **Preview Video** or **Approve & Publish** to test video catalog moderation.
