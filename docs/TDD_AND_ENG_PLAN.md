# Technical Design Document (TDD) & Engineering Plan

## 1. Technical Architecture
The PRO ALUMN platform utilizes a decoupled, modern full-stack architecture running in Docker containers.

*   **Frontend (Client):** Next.js (App Router), React, Tailwind CSS, Framer Motion.
*   **Backend (API):** Node.js / Express server for handling WebSockets and heavy business logic.
*   **Database:** PostgreSQL with `pgvector` extension for future AI/embedding matching capabilities.
*   **ORM:** Prisma Client.
*   **Infrastructure:** Docker & Docker Compose.

## 2. Engineering & Deployment Plan

### Phase 1: Foundation & Infrastructure (Completed)
*   Set up Monorepo structure (Web + API).
*   Initialize PostgreSQL database and Prisma schema.
*   Configure Docker and `docker-compose.yml` for local development.

### Phase 2: Core Platform Features (Completed)
*   Implement JWT-based Authentication.
*   Build CRUD operations for Jobs, Success Stories, Events, and Announcements.
*   Develop 8-page responsive UI with custom Design System tokens.

### Phase 3: Real-Time & Integrations (Completed)
*   Integrate `Socket.io` for real-time chat functionality.
*   Implement Google Calendar API for mentorship scheduling.
*   Implement Gmail API for external email notifications.

### Phase 4: AI & Scalability (Upcoming)
*   **Smart Matching:** Utilize `pgvector` to store profile embeddings. Implement a matching algorithm to recommend jobs and mentors to students based on vector similarity.
*   **Performance Optimization:** Implement Redis caching for high-traffic routes (e.g., Directory, Jobs).
*   **CI/CD Deployment:** Set up GitHub Actions to auto-build Docker images and deploy to AWS / DigitalOcean.

## 3. Security Considerations
*   All sensitive routes are protected by JWT middleware.
*   Environment variables (like `JWT_SECRET`, database URLs, and Google OAuth credentials) are strictly managed via `.env` files and securely passed into Docker containers.
*   Prisma prevents SQL injection natively.
