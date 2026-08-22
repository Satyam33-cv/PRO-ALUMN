# User Flows

This document outlines the standard journeys users take through the PRO ALUMN platform.

## 1. Onboarding Flow
1.  **Landing Page:** User clicks "Get Started".
2.  **Registration:** Selects role (Student, Alumni, etc.), fills in basic info (Email, Password).
3.  **Profile Setup:** Prompts user to fill in role-specific data (e.g., `batchYear` for students, `currentCompany` for alumni).
4.  **Dashboard:** Redirected to their role-specific dashboard.

## 2. Job Referral Flow (Student)
1.  **Discover:** Student navigates to the "Jobs" page and browses active postings.
2.  **Request Referral:** Student clicks "Request Referral" on a specific job.
3.  **Application:** Student submits a note and their resume link.
4.  **Notification:** The Alumni who posted the job receives a notification (and an email via Gmail API).
5.  **Action:** Alumni reviews the request and clicks "Accept" or "Reject".
6.  **Outcome:** If accepted, Alumni refers the student internally at their company and updates the status to "Referred".

## 3. Mentorship Booking Flow
1.  **Directory:** Student browses the Alumni Directory.
2.  **Profile View:** Student clicks on an Alumni profile and selects "Request Mentorship".
3.  **Request Details:** Student specifies the topic (e.g., "Mock Interview").
4.  **Alumni Approval:** Alumni approves the request.
5.  **Scheduling:** Both users can click "Schedule Google Meet" which interacts with the Google Calendar API to generate a meeting link automatically.

## 4. Real-Time Chat Flow
1.  **Initiation:** User clicks the "Message" button on another user's profile.
2.  **Thread Creation:** System checks if a `ChatThread` exists between them; if not, creates one.
3.  **Messaging:** User types a message. The WebSocket emits the message instantly to the other user's client without a page refresh.
4.  **Persistence:** Message is saved to the PostgreSQL database for history.
