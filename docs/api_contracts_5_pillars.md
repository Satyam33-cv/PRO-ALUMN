# Stage 2: Full Algorithmic & API Specification
## The 5 Essential Pillars & Leaflet OpenStreetMap Geo-Pipeline

---

### Pillar 1: Verified Alumni Directory & Leaflet Geo-Map

#### 1.1 `GET /api/users/alumni`
Browse and filter verified alumni with token-based query matching and pagination.
* **Query Parameters**:
  * `search` (string, optional): Full-text name, company, or job title.
  * `batchYear` (number, optional): Graduation cohort (e.g. `2021`).
  * `department` (string, optional): Department filter (e.g. `Computer Science`).
  * `company` (string, optional): Target employer (e.g. `Google`, `Amazon`).
  * `location` (string, optional): City or geographic filter.
  * `page` (number, default: `1`): Current page offset.
  * `limit` (number, default: `24`, max: `100`): Page size.
* **Response Envelope (`200 OK`)**:
```json
{
  "alumni": [
    {
      "id": "cly1234567890",
      "name": "Vikram Aditya",
      "role": "ALUMNI",
      "avatarUrl": "https://lh3.googleusercontent.com/...",
      "batchYear": 2019,
      "department": "Computer Science",
      "currentCompany": "Google",
      "jobTitle": "Senior Software Engineer (L5)",
      "location": "Bengaluru, India",
      "linkedinUrl": "https://linkedin.com/in/vikram-aditya",
      "bio": "Working on Google Cloud Infrastructure. Open for referrals and resume reviews.",
      "coordinates": {
        "city": "Bengaluru",
        "country": "India",
        "lat": 12.9716,
        "lng": 77.5946
      }
    }
  ],
  "pagination": {
    "total": 482,
    "page": 1,
    "limit": 24,
    "pages": 21
  }
}
```

#### 1.2 `GET /api/users/geo-distribution`
Aggregated geo-coordinates cluster map for rendering marker clusters in Leaflet OpenStreetMap.
* **Response Envelope (`200 OK`)**:
```json
{
  "clusters": [
    {
      "city": "Bengaluru",
      "country": "India",
      "lat": 12.9716,
      "lng": 77.5946,
      "count": 142,
      "alumni": [
        {
          "id": "cly12345",
          "name": "Vikram Aditya",
          "currentCompany": "Google",
          "jobTitle": "Senior Software Engineer",
          "avatarUrl": "https://..."
        }
      ]
    },
    {
      "city": "San Francisco",
      "country": "USA",
      "lat": 37.7749,
      "lng": -122.4194,
      "count": 38,
      "alumni": [...]
    }
  ]
}
```

---

### Pillar 2: Career & Referral Hub

#### 2.1 `GET /api/jobs`
List verified job openings and referral quotas.
* **Query Parameters**: `search`, `type` (`FULL_TIME`, `INTERNSHIP`, `CONTRACT`), `location`, `remote` (`true`/`false`).
* **Response Envelope (`200 OK`)**:
```json
{
  "jobs": [
    {
      "id": "job_01",
      "title": "Software Development Engineer II",
      "company": "Amazon",
      "type": "FULL_TIME",
      "location": "Mumbai / Hybrid",
      "remote": true,
      "description": "Looking for junior alumni with 1-3 years experience in Java/Distributed Systems.",
      "requirements": ["Java", "AWS", "Data Structures"],
      "referralAvailable": true,
      "postedBy": {
        "id": "usr_99",
        "name": "Ananya Deshmukh",
        "avatarUrl": "https://...",
        "currentCompany": "Amazon",
        "jobTitle": "SDE II"
      },
      "createdAt": "2026-09-01T10:00:00.000Z"
    }
  ]
}
```

#### 2.2 `POST /api/referrals`
Submit a high-trust referral request to an alumni poster.
* **Request Headers**: `Authorization: Bearer <jwt_token>`
* **Request Body**:
```json
{
  "jobId": "job_01",
  "studentNote": "Hi Ananya, I worked on AWS microservices in my final year capstone. Would appreciate your referral!",
  "resumeUrl": "https://xyz.supabase.co/storage/v1/object/public/resumes/my-resume.pdf"
}
```
* **Response Envelope (`201 Created`)**:
```json
{
  "id": "ref_55",
  "jobId": "job_01",
  "studentId": "std_10",
  "alumniId": "usr_99",
  "status": "PENDING",
  "studentNote": "Hi Ananya...",
  "resumeUrl": "https://...",
  "createdAt": "2026-09-05T01:30:00.000Z"
}
```

#### 2.3 `PATCH /api/referrals/:id/status`
Alumni accepts or rejects the referral request.
* **Request Body**: `{ "status": "ACCEPTED" }` (or `"REJECTED"`, `"IN_REVIEW"`)
* **Response Envelope (`200 OK`)**:
```json
{
  "id": "ref_55",
  "status": "ACCEPTED",
  "updatedAt": "2026-09-05T01:35:00.000Z"
}
```

---

### Pillar 3: Mentorship & Flash 1-on-1 Sessions

#### 3.1 `GET /api/mentorship`
Fetch scheduled and pending mentorship bookings.
* **Response Envelope (`200 OK`)**:
```json
{
  "mentorships": [
    {
      "id": "ment_01",
      "mentorId": "usr_99",
      "studentId": "std_10",
      "area": "Career Guidance & Resume Review",
      "message": "Seeking guidance for campus placements in cloud engineering.",
      "status": "CONFIRMED",
      "scheduledFor": "2026-09-12T10:00:00.000Z",
      "durationMins": 30,
      "mentor": {
        "id": "usr_99",
        "name": "Ananya Deshmukh",
        "email": "ananya.deshmukh@amazon.com",
        "avatarUrl": "https://..."
      },
      "student": {
        "id": "std_10",
        "name": "Rahul Verma",
        "email": "rahul.verma@somaiya.edu"
      }
    }
  ]
}
```

#### 3.2 `POST /api/mentorship`
Create a 15-minute or 30-minute flash mentorship request.
* **Request Body**:
```json
{
  "mentorId": "usr_99",
  "area": "Cloud Engineering Roadmap",
  "message": "Would love 15 minutes of your advice on preparing for AWS certification.",
  "scheduledFor": "2026-09-15T11:00:00.000Z",
  "durationMins": 15
}
```
* **Response Envelope (`201 Created`)**:
```json
{
  "mentorship": {
    "id": "ment_02",
    "status": "PENDING",
    "area": "Cloud Engineering Roadmap"
  }
}
```

---

### Pillar 4: Events, Reunions & Capacity RSVPs

#### 4.1 `GET /api/events`
List campus reunions, networking mixers, and webinars.
* **Response Envelope (`200 OK`)**:
```json
{
  "events": [
    {
      "id": "evt_01",
      "title": "Annual Alumni Gala & Homecoming 2026",
      "detail": "Join fellow graduates for networking, keynote addresses, and college banquet.",
      "place": "Campus Auditorium & Lawn",
      "date": "2026-10-15",
      "startsAt": "2026-10-15T18:00:00.000Z",
      "category": "IN_PERSON",
      "capacity": 300,
      "attending": 184,
      "isRegistered": false
    }
  ]
}
```

#### 4.2 `POST /api/events/:id/rsvp`
Capacity-gated 1-click registration using database transaction to prevent overbooking.
* **Response Envelope (`200 OK`)**:
```json
{
  "attending": true,
  "message": "RSVP confirmed! Ticket saved to your profile.",
  "rsvp": {
    "id": "rsvp_77",
    "eventId": "evt_01",
    "userId": "std_10",
    "status": "REGISTERED",
    "createdAt": "2026-09-05T01:40:00.000Z"
  }
}
```

#### 4.3 `DELETE /api/events/:id/rsvp`
Cancel registration and immediately restore event capacity.
* **Response Envelope (`200 OK`)**:
```json
{
  "attending": false,
  "message": "RSVP successfully cancelled."
}
```

---

### Pillar 5: Community Feed & Success Stories

#### 5.1 `GET /api/stories`
Paginated feed of verified alumni achievements and startup milestones.
* **Response Envelope (`200 OK`)**:
```json
{
  "stories": [
    {
      "id": "story_01",
      "title": "How our College Robotics Club became a $10M Seed-Funded Startup",
      "story": "Five years after graduation, we scaled our autonomous warehouse robot to 20 facilities...",
      "company": "Kinetix Robotics",
      "role": "Co-Founder & CTO",
      "batchYear": 2018,
      "likesCount": 42,
      "isApproved": true,
      "alumni": {
        "id": "usr_77",
        "name": "Prateek Shah",
        "avatarUrl": "https://...",
        "batchYear": 2018
      },
      "createdAt": "2026-08-28T14:20:00.000Z"
    }
  ],
  "pagination": {
    "total": 18,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### 5.2 `POST /api/stories`
Submit a milestone story (routes to admin moderation before appearing on public wall).
* **Request Body**:
```json
{
  "title": "Promoted to Principal Engineer at Microsoft",
  "story": "Grateful for the foundations built during my B.Tech...",
  "company": "Microsoft",
  "role": "Principal Engineer"
}
```
* **Response Envelope (`201 Created`)**:
```json
{
  "success": true,
  "message": "Story submitted successfully and queued for admin moderation.",
  "story": {
    "id": "story_02",
    "title": "Promoted to Principal Engineer at Microsoft",
    "isApproved": false
  }
}
```

---

### Token-Based Global Search Pipeline

#### `GET /api/search?q={query}&type={optional_type}&limit=20`
* **Algorithm**:
  1. Input `q` is trimmed and tokenized by whitespace regex `/\s+/`.
  2. Each individual token generates a case-insensitive `contains` filter across candidate fields (`name`, `currentCompany`, `jobTitle`, `skills`, `department`, `location`).
  3. All tokens are composed with SQL `AND` operators, allowing natural cross-field matching (e.g. `"Google Cloud"` matches company + skills, `"Mumbai SDE"` matches location + job title).
  4. Alumni results are enriched with instant offline geo-coordinates.
* **Response Envelope (`200 OK`)**:
```json
{
  "results": {
    "alumni": [
      {
        "id": "cly12345",
        "name": "Vikram Aditya",
        "avatarUrl": "https://...",
        "currentCompany": "Google",
        "jobTitle": "Senior Software Engineer (L5)",
        "batchYear": 2019,
        "department": "Computer Science",
        "location": "Bengaluru, India",
        "coordinates": {
          "city": "Bengaluru",
          "country": "India",
          "lat": 12.9716,
          "lng": 77.5946
        }
      }
    ],
    "jobs": [...],
    "events": [...],
    "stories": [...],
    "announcements": [...]
  }
}
```
