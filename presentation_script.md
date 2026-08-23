# PRO ALUMN: Smart India Hackathon Presentation Script


---

## 1. Introduction & The Problem (1-2 minutes)

**[Action: Start on the Home / Landing Page]**

"Hello everyone, we are excited to present **PRO ALUMN**—a next-generation, AI-powered alumni networking and career intelligence platform. 

As you can see on our landing page, our platform is built around four core pillars:

Our system is currently powering,

384-Dimensional AI Vector Matching : similarity matching calculating alignment across skills, companies, and roles.

**AI Integration:** We use **Google Gemini AI** to generate 384-dimensional dense vector embeddings of student and alumni profiles. 
This allows for semantic cosine-similarity matching—meaning the system intelligently pairs students with the exact mentors who have the skills they need.

Referral Lifecycle State Machine: 
End-to-end referral management (Pending → Accepted / Declined → Referred → Hired).
## 5. Job Referrals & Real-Time Chat (2 minutes)



The most critical outcome for our students is securing employment. We built a visual 4-stage referral state machine: **Pending → Accepted / Screened → Referred Internally → Hired & Celebrated**.

When an alumni posts an opening at their company, students can click 'Request Referral' and attach their resume. The alumni reviews the incoming requests on their dashboard. If they believe the student is a good fit, they can move them to 'Accepted' and push their resume to their internal HR. 


If the alumni needs to screen the student first, they can initiate a chat. Our messaging system utilizes **WebSockets** for real-time, instant communication. There are no page refreshes needed. Messages are emitted instantly across clients and persisted securely in our PostgreSQL database, ensuring seamless communication."


"Let’s look at of  The Directory. 
Here, users can search for alumni based on companies like Google, Microsoft, or specific roles like Machine Learning Engineers. 
Alumni Directory: Instant search across  alumni by name, company, role, skills, department, and verification status.

Here, users can search for alumni based on companies 

Because of our pgvector integration, the search isn't just looking for keywords; it understands context.
From here, a student can initiate a direct connection. If they need guidance, they can request mentorship. Which brings us to our Google Workspace integration."


## 4. Mentorship & Google Workspace Integration (1.5 minutes)

"When a student requests a mentorship session, the alumni receives a notification—both in-app and via an outbound email powered securely by the **Gmail API**.

Once the alumni approves the request, they don't have to leave the platform to schedule a meeting. With a single click of our **'Schedule Google Meet'** button, the platform interacts directly with the **Google Calendar API** to automatically generate a calendar event and a video meeting link for both parties. This drastically reduces the friction of scheduling."
## Events & Capacity RSVPs
Interactive countdowns, category filters, and real-
time capacity-controlled RSVPs synced with Google
Calendar.

## Unified Real-Time Messaging
Split-view threaded 1:1 and group conversations,
seeded directly from alumni profiles and job referral
action links.
## Spotlight Wall of Success Stories
Peer-voted and faculty-moderated career
breakthrough stories celebrating career pivots,
promotions, and startup funding.
## Giving & Philanthropy Platform
Department campaign funding, scholarship
initiatives, goal progress meters, and community
donor leaderboards.
## Skill & Career Education Center

Skillshare-style career sprint guides, technical
interview prep pathways, and verified salary
negotiation blueprints.

## Interactive Profile & Vector Sync

Career timeline, achievement badges, mentoring
availability, and a 1-tap 'Re-sync Al Profile Vector'
powered by Gemini.

## 6. Community & Extra Features (1 minute)

"To maintain a vibrant community, PRO ALUMN also features:
- **Campus Announcements:** Where faculty can pin priority notices for the entire network.
- **Success Stories:** A spotlight wall where users can upvote and celebrate recent hires and achievements.
- **Education Center & Giving:** Where alumni can give back financially or share specialized up-skilling resources with the current batch."

---

 PRO ALUMN isn't just a directory—it is an intelligent, real-time ecosystem designed to maximize graduate success rates. By combining Google Gemini's AI matching, Google Workspace APIs, and a robust real-time referral pipeline, we are fundamentally transforming how academic institutions leverage their greatest asset: their alumni.

Thank you, we’e happy to take any questions or do a deep dive into our codebase."
