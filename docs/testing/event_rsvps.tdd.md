# Event RSVPs & Attendee List - TDD Evidence Report

## 1. Source Plan
- **Diagnostic Finding**:
  - **DB Write** (`POST /api/events/:id/rsvp`): Functional for all authenticated roles (`STUDENT`, `ALUMNI`, etc.).
  - **DB Read** (`GET /api/events/:id`): Functional, returned all RSVPs without role filtering.
  - **Frontend Render Layer**: Dropping RSVPs due to missing JSX attendee section in `EventDetailContent.tsx`, API envelope unwrapping mismatch in `client.ts:get`, and desynchronized local `attending` state.
- **Implemented Fix**:
  1. Updated [backend/src/routes/events.js](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/backend/src/routes/events.js): Included `role`, `currentCompany`, and `jobTitle` in the attendee `user` select. Return `{ rsvp, attending: true, message: 'RSVP confirmed' }` on POST and `{ attending: false, message: 'RSVP cancelled' }` on DELETE.
  2. Updated [frontend/lib/api/client.ts](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/lib/api/client.ts) and [frontend/lib/types.ts](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/lib/types.ts): Added `EventDetailItem` and `EventAttendee` types, unwrapped `res.event` in `events.get`, and added `events.cancelRsvp`.
  3. Updated [frontend/components/EventDetailContent.tsx](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/frontend/components/EventDetailContent.tsx): Synchronized `attending` state from `event.hasRsvp`, enabled two-way RSVP/Cancel RSVP toggle, and added an accessible Attendees grid with role badges, avatar fallbacks, and capacity indicators.

---

## 2. Test Specification & Guarantees

| # | What is Guaranteed | Test Target | Test Type | Result | Evidence / Verification |
|---|-------------------|-------------|-----------|--------|--------------------------|
| 1 | `GET /api/events/:id` returns initial 0 RSVPs and `hasRsvp: false` | `verify_event_rsvps.js:Test 2` | Integration | PASS | Empty array returned |
| 2 | `POST /api/events/:id/rsvp` succeeds for STUDENT and returns `{ attending: true }` | `verify_event_rsvps.js:Test 3` | Integration | PASS | HTTP 201, `attending: true` |
| 3 | `POST /api/events/:id/rsvp` succeeds for ALUMNI and returns `{ attending: true }` | `verify_event_rsvps.js:Test 4` | Integration | PASS | HTTP 201, `attending: true` |
| 4 | Duplicate RSVP attempts are blocked | `verify_event_rsvps.js:Test 5` | Boundary | PASS | HTTP 409 Conflict |
| 5 | `GET /api/events/:id` returns BOTH Student and Alumni with full `role` and profile metadata | `verify_event_rsvps.js:Test 6` | Integration | PASS | Both roles present in `event.rsvps` |
| 6 | `DELETE /api/events/:id/rsvp` cancels RSVP and returns `{ attending: false }` | `verify_event_rsvps.js:Test 7` | Integration | PASS | HTTP 200, student removed, alumni retained |
| 7 | Frontend compiles cleanly with TypeScript | `npx tsc --noEmit` | Compile / Type | PASS | Exited with code 0 (no errors) |

---

## 3. Test Execution Command & Output

```bash
cd backend
node tests/verify_event_rsvps.js
```

```text
🧪 Starting Event RSVPs & Attendee List Test Suite...

1️⃣ Setting up or retrieving test users and an upcoming event...
   Created test event: "Test Tech Summit 1788541940989" (ID: d990263f-67bb-4ba1-8078-d56ee5fe7f62)

2️⃣ Testing GET /api/events/:id before any RSVPs...
   ✅ Initial state verified: 0 attendees.

3️⃣ Testing POST /api/events/:id/rsvp as STUDENT...
   ✅ Student RSVP successful, returned { attending: true, message: "RSVP confirmed" }

4️⃣ Testing POST /api/events/:id/rsvp as ALUMNI...
   ✅ Alumni RSVP successful, returned { attending: true, message: "RSVP confirmed" }

5️⃣ Testing Duplicate RSVP prevention (409 Conflict)...
   ✅ Duplicate RSVP prevented with 409 Conflict.

6️⃣ Verifying GET /api/events/:id returns BOTH student & alumni with full role fields...
   Attendee Roles returned in JSON: [ 'STUDENT', 'ALUMNI' ]
   Found Alumni attendee: Demo Alumni (Role: ALUMNI)
   Found Student attendee: Demo Student (Role: STUDENT)
   ✅ Both Student & Alumni attendees are returned without any role drop or filtering.

7️⃣ Testing DELETE /api/events/:id/rsvp (Cancel RSVP)...
   ✅ Cancel RSVP successful, returned { attending: false, message: "RSVP cancelled" }
   ✅ Verified: Student removed, Alumni attendee remains intact.

8️⃣ Cleaning up test event...
   ✅ Test event cleaned up.

======================================================
🎉 ALL EVENT RSVP & ATTENDEE LIST TESTS PASSED! 🎉
======================================================
```
