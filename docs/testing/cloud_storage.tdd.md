# Cloud Storage & Production 503 Resolution - TDD Evidence Report

## 1. Source Plan
- **Objective**: Resolve the `Cloud storage is required in production environments` (HTTP 503) error on Railway production affecting avatar uploads, resume uploads, and admin video previews.
- **Root Cause**: In [backend/src/routes/uploads.js](file:///c:/Users/vishw/Documents/GitHub/SIH-Alumnia/Alumnia/backend/src/routes/uploads.js), production mode (`NODE_ENV=production`) strictly halts local disk fallback with HTTP 503 if the cloud storage client is not initialized. Supabase client initialization requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. While configured locally in `backend/.env`, these variables were not set in the Railway production environment dashboard.

---

## 2. User Journeys
1. **Avatar Upload**: As an authenticated member, I want to upload a profile photo so that other alumni can identify me, receiving an immediate public CDN URL.
2. **Private Resume Upload**: As a student/applicant, I want to upload my resume (.pdf, .doc, .docx) to private cloud storage with path isolation (`supabase://resumes/{userId}/...`), so that only authorized alumni and admins can view it via short-lived signed URLs.
3. **Media / Video Upload**: As an admin or mentor, I want media and video previews uploaded to cloud storage buckets without hitting 503 service unavailable errors in production.

---

## 3. Test Specification & Guarantees

| # | What is Guaranteed | Test Target | Test Type | Result | Evidence / Verification |
|---|-------------------|-------------|-----------|--------|--------------------------|
| 1 | Supabase client initializes with service role credentials | `verify_cloud_storage.js:Test 1` | Unit | PASS | `supabase` client is non-null |
| 2 | Required public and private buckets exist (`avatars`, `resumes`, `stories`, `documents`, `videos`, `certificates`, `id_cards`) | `verify_cloud_storage.js:Test 2` | Integration | PASS | `ensureStorageBuckets()` verified 7 buckets on remote project |
| 3 | Public bucket upload returns valid `https://` public URL and is directly accessible | `verify_cloud_storage.js:Test 3` | Integration | PASS | Uploaded to `avatars/`, HTTP GET returned `200 OK`, cleaned up |
| 4 | Private bucket upload returns `supabase://` identifier, generates time-limited signed URL, and permits secure download | `verify_cloud_storage.js:Test 4` | Integration / Security | PASS | Uploaded to `resumes/`, generated signed URL, HTTP GET returned `200 OK`, cleaned up |
| 5 | Production 503 guard blocks unconfigured uploads in production, but succeeds when cloud storage is configured | `verify_cloud_storage.js:Test 5` | Regression / Boundary | PASS | Simulated missing storage in prod -> 503; with storage -> 201 |

---

## 4. Execution Command & Output Excerpt

```bash
cd backend
node tests/verify_cloud_storage.js
```

```text
🧪 Starting Cloud Storage Verification Suite...

1️⃣ Checking Supabase Client Initialization...
   ✅ Supabase client is initialized.

2️⃣ Verifying Storage Buckets via ensureStorageBuckets()...
   Existing buckets: [
  'stories',
  'documents',
  'videos',
  'avatars',
  'resumes',
  'certificates',
  'id_cards'
]
   ✅ All required public & private buckets exist.

3️⃣ Testing Avatar Upload (Public Bucket)...
   Uploaded Avatar Public URL: https://rbcswrdndqylswladdue.supabase.co/storage/v1/object/public/avatars/test-runner/avatar-test-1788541553610.png
   ✅ Public avatar is directly accessible (HTTP 200).
   ✅ Test avatar cleaned up.

4️⃣ Testing Resume Upload & Signed URL (Private Bucket)...
   Stored Path Identifier: supabase://resumes/test-runner/resume-test-1788541556221.pdf
   Generated Signed URL: https://rbcswrdndqylswladdue.supabase.co/storage/v1/object/sign/resumes/test-runner/resume-test-1788541556221.pdf?token=...
   ✅ Private resume accessed via short-lived signed URL (HTTP 200).
   ✅ Test resume cleaned up.

5️⃣ Verifying Production 503 Guard (Simulating missing storage client in production)...
   ✅ 503 guard correctly halts uploads when credentials are absent in production.
   ✅ Cloud storage upload proceeds when credentials are provided in production.

🎉 ALL CLOUD STORAGE TESTS PASSED SUCCESSFULLY!
```

---

## 5. Railway Production Setup Instructions

In Railway Dashboard -> **Backend Service** -> **Variables**:

| Variable Name | Required Value | Notes |
|---------------|----------------|-------|
| `SUPABASE_URL` | `https://rbcswrdndqylswladdue.supabase.co` | Your Supabase project endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Set from your backend/.env secret)* | Grants backend permissions to create buckets & bypass RLS |

> [!NOTE]
> Do not use `SUPABASE_ANON_KEY` for `SUPABASE_SERVICE_ROLE_KEY`. The backend requires the `service_role` secret to create missing buckets and upload private files.
