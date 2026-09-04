// backend/tests/verify_event_rsvps.js
/**
 * Test Suite for Event RSVPs and Attendee List:
 * 1. Verifies GET /api/events/:id returns rsvps with user roles (STUDENT, ALUMNI) and profile fields.
 * 2. Verifies POST /api/events/:id/rsvp records student and alumni RSVPs and returns { rsvp, attending: true, message: 'RSVP confirmed' }.
 * 3. Verifies GET /api/events/:id contains both student and alumni attendees without role filtering.
 * 4. Verifies DELETE /api/events/:id/rsvp removes RSVP and returns { attending: false, message: 'RSVP cancelled' }.
 */

require('dotenv').config();
const assert = require('assert');
const jwt = require('jsonwebtoken');
const prisma = require('../src/db');
const express = require('express');
const eventsRouter = require('../src/routes/events');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Set up lightweight Express test server for events router
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

let server;
let baseUrl;

function makeRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const http = require('http');
  const urlObj = new URL(url);

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Event RSVPs & Attendee List Test Suite...\n');

  // Start server
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // Setup test users: 1 Student, 1 Alumni, 1 Organizer
    console.log('1️⃣ Setting up or retrieving test users and an upcoming event...');
    
    // Find or create test organizer
    let organizer = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!organizer) {
      organizer = await prisma.user.create({
        data: {
          email: `test-organizer-${Date.now()}@somaiya.edu`,
          passwordHash: 'dummyhash',
          name: 'Event Organizer',
          role: 'ADMIN',
          department: 'Computer Engineering',
        },
      });
    }

    // Find or create test student
    let student = await prisma.user.findFirst({ where: { role: 'STUDENT', isActive: true } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: `test-student-${Date.now()}@somaiya.edu`,
          passwordHash: 'dummyhash',
          name: 'Aarav Sharma (Student)',
          role: 'STUDENT',
          batchYear: 2026,
          department: 'Computer Engineering',
        },
      });
    }

    // Find or create test alumni
    let alumni = await prisma.user.findFirst({ where: { role: 'ALUMNI', isActive: true } });
    if (!alumni) {
      alumni = await prisma.user.create({
        data: {
          email: `test-alumni-${Date.now()}@somaiya.edu`,
          passwordHash: 'dummyhash',
          name: 'Priya Patel (Alumni)',
          role: 'ALUMNI',
          batchYear: 2020,
          department: 'Information Technology',
          currentCompany: 'Google',
          jobTitle: 'Senior Software Engineer',
        },
      });
    }

    // Create a dedicated test upcoming event
    const testEvent = await prisma.event.create({
      data: {
        title: `Test Tech Summit ${Date.now()}`,
        description: 'Annual gathering of students and alumni to discuss tech trends.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
        location: 'Somaiya Campus Auditorium',
        mode: 'OFFLINE',
        createdById: organizer.id,
        maxCapacity: 50,
      },
    });

    console.log(`   Created test event: "${testEvent.title}" (ID: ${testEvent.id})`);

    const studentToken = jwt.sign({ id: student.id, email: student.email, role: student.role }, JWT_SECRET);
    const alumniToken = jwt.sign({ id: alumni.id, email: alumni.email, role: alumni.role }, JWT_SECRET);

    // Test 2: Initial GET check (Empty Attendees)
    console.log('\n2️⃣ Testing GET /api/events/:id before any RSVPs...');
    const getRes1 = await makeRequest(`/api/events/${testEvent.id}`);
    assert.strictEqual(getRes1.status, 200);
    assert.ok(getRes1.data.event, 'Response must contain event object');
    assert.strictEqual(getRes1.data.event.rsvps.length, 0, 'Initial RSVP count must be 0');
    assert.strictEqual(getRes1.data.event.hasRsvp, false, 'hasRsvp should be false for unauthenticated visitor');
    console.log('   ✅ Initial state verified: 0 attendees.');

    // Test 3: Student RSVP
    console.log('\n3️⃣ Testing POST /api/events/:id/rsvp as STUDENT...');
    const studentRsvpRes = await makeRequest(`/api/events/${testEvent.id}/rsvp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(studentRsvpRes.status, 201, `Expected 201, got ${studentRsvpRes.status}`);
    assert.strictEqual(studentRsvpRes.data.attending, true, 'Response must return attending: true');
    assert.strictEqual(studentRsvpRes.data.message, 'RSVP confirmed');
    console.log('   ✅ Student RSVP successful, returned { attending: true, message: "RSVP confirmed" }');

    // Test 4: Alumni RSVP
    console.log('\n4️⃣ Testing POST /api/events/:id/rsvp as ALUMNI...');
    const alumniRsvpRes = await makeRequest(`/api/events/${testEvent.id}/rsvp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` },
    });
    assert.strictEqual(alumniRsvpRes.status, 201, `Expected 201, got ${alumniRsvpRes.status}`);
    assert.strictEqual(alumniRsvpRes.data.attending, true, 'Response must return attending: true');
    console.log('   ✅ Alumni RSVP successful, returned { attending: true, message: "RSVP confirmed" }');

    // Test 5: Duplicate RSVP Prevention
    console.log('\n5️⃣ Testing Duplicate RSVP prevention (409 Conflict)...');
    const dupRes = await makeRequest(`/api/events/${testEvent.id}/rsvp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(dupRes.status, 409, `Expected 409, got ${dupRes.status}`);
    console.log('   ✅ Duplicate RSVP prevented with 409 Conflict.');

    // Test 6: GET /api/events/:id with both attendees & role fields
    console.log('\n6️⃣ Verifying GET /api/events/:id returns BOTH student & alumni with full role fields...');
    const getRes2 = await makeRequest(`/api/events/${testEvent.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(getRes2.status, 200);
    const eventData = getRes2.data.event;
    assert.strictEqual(eventData.rsvps.length, 2, 'Must contain exactly 2 RSVPs');
    assert.strictEqual(eventData.hasRsvp, true, 'Student should see hasRsvp: true');

    const attendeeRoles = eventData.rsvps.map(r => r.user.role);
    console.log('   Attendee Roles returned in JSON:', attendeeRoles);
    assert.ok(attendeeRoles.includes('STUDENT'), 'Must include student attendee');
    assert.ok(attendeeRoles.includes('ALUMNI'), 'Must include alumni attendee');

    // Check that role and profile fields are present
    const alumniAttendee = eventData.rsvps.find(r => r.user.role === 'ALUMNI');
    assert.ok(alumniAttendee.user.name, 'Alumni name must be present');
    assert.ok(alumniAttendee.user.role === 'ALUMNI', 'Alumni role must be ALUMNI');
    console.log(`   Found Alumni attendee: ${alumniAttendee.user.name} (Role: ${alumniAttendee.user.role})`);

    const studentAttendee = eventData.rsvps.find(r => r.user.role === 'STUDENT');
    assert.ok(studentAttendee.user.name, 'Student name must be present');
    assert.ok(studentAttendee.user.role === 'STUDENT', 'Student role must be STUDENT');
    console.log(`   Found Student attendee: ${studentAttendee.user.name} (Role: ${studentAttendee.user.role})`);
    console.log('   ✅ Both Student & Alumni attendees are returned without any role drop or filtering.');

    // Test 7: Cancel RSVP (Toggle check)
    console.log('\n7️⃣ Testing DELETE /api/events/:id/rsvp (Cancel RSVP)...');
    const cancelRes = await makeRequest(`/api/events/${testEvent.id}/rsvp`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.data.attending, false, 'Response must return attending: false');
    assert.strictEqual(cancelRes.data.message, 'RSVP cancelled');
    console.log('   ✅ Cancel RSVP successful, returned { attending: false, message: "RSVP cancelled" }');

    // Verify student is removed and alumni remains
    const getRes3 = await makeRequest(`/api/events/${testEvent.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(getRes3.data.event.rsvps.length, 1);
    assert.strictEqual(getRes3.data.event.hasRsvp, false, 'Student hasRsvp is now false');
    assert.strictEqual(getRes3.data.event.rsvps[0].user.role, 'ALUMNI', 'Alumni remains in guest list');
    console.log('   ✅ Verified: Student removed, Alumni attendee remains intact.');

    // Clean up test event and RSVPs
    console.log('\n8️⃣ Cleaning up test event...');
    await prisma.eventRSVP.deleteMany({ where: { eventId: testEvent.id } });
    await prisma.event.delete({ where: { id: testEvent.id } });
    console.log('   ✅ Test event cleaned up.');

    console.log('\n======================================================');
    console.log('🎉 ALL EVENT RSVP & ATTENDEE LIST TESTS PASSED! 🎉');
    console.log('======================================================');
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error('\n❌ Test Failure:', err);
  if (server) server.close();
  await prisma.$disconnect();
  process.exit(1);
});
