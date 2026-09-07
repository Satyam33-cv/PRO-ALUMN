# Spec: AI Matching (Directory)

**Status:** Draft — needs sign-off
**Owners:** Product (decision) + Engineering (implementation)
**Related code:** `backend/src/routes/matching.js`, `backend/src/services/embeddings.js`, `frontend/app/matching/page.tsx`

---

## Purpose (one sentence)

A student gets a short, ranked list of verified alumni they can *do something with* — chat for mentorship, or request a referral into a company they're targeting — where every match explains *why* it appeared.

## Who & roles

- **Students** get the AI-matched feed (`/matching`). This is the current behavior and stays.
- **Alumni** browse the Directory directly and never see a matched feed of other alumni. Matching remains student-only.

## Workflow (states, step by step)

1. **Profile saved → auto-embed.** `POST /matching/sync-me` fires automatically on profile save / registration completion. The manual "Refresh Embeddings" button stays as an override only.
2. **Student opens `/matching`** → picks an intent filter: **All · Career mentors · Target companies · Referral-ready**. (This is how the four possible jobs — find a mentor, find a foot in the door, find people like me, feed the referral pipeline — all happen through one interface.)
3. **Ranked cards render**, each showing:
   - Match score (0–100, real)
   - The alumni's company and role
   - **"Why this match" chips**: e.g. *same department · works at Google · 3 shared skills · verified*
   - **Two live actions:**
     - **Message** → opens a chat thread with that alumni (wires up the current dead button → existing Chat module).
     - **Request referral** → shown only when the alumni works at a company the student targets (saved target company or an open job posted there). Clicking creates a referral that enters the existing **Pending → Accepted → Referred → Hired** pipeline, tracked on `/referrals`. Rejection surfaces the reason so the student can move to the next match.
4. **Empty state is honest:** below the threshold it says *"complete your profile or widen your filters"* — never "no exact matches."

## Algorithm (semantic ranking + hard eligibility filters)

### Eligibility (all must pass)
- `role = ALUMNI`
- `isActive = true`
- `isVerified = true`
- `embedding IS NOT NULL`
- Intent filters (department, target company) narrow the pool — they never re-rank it.

### Score = 0–100 composite
| Component | Weight | Notes |
|---|---|---|
| Cosine similarity of profile embeddings | 60% | Current pgvector math, kept |
| Same department | 15% | Student vs. alumni `department` |
| Target-company overlap | 15% | Student's saved target companies ∩ alumni `currentCompany` |
| Shared skills | 10% | Overlap count between student and alumni `skills`, capped |

### Threshold
Base similarity must be ≥ **0.30** or the card pool is empty — never force a top-5 with no signal.

### Explainability
Computed, not hand-waved: the "why" chips are the components that fired (department match, company overlap, shared skills).

## Concrete bugs this kills

- **100% on every ring:** backend already sends `matchScore` as 0–100; the frontend multiplies by 100 again and `MatchRing` clamps. Remove the `× 100`.
- **Dead buttons:** Message and Profile have no `onClick`. Wire Message → chat; Profile → existing profile page.
- **No threshold:** empty state says "No exact matches yet" but top-5 is always returned regardless of quality.
- **Stale embeddings:** nothing re-embeds on profile edit; the student must remember to click "Refresh Embeddings".

## API deltas

- `GET /api/matching/top-alumni` gains query params: `mode`, `department`, `company`, `minScore`.
- Response adds: `reasons[]`, `sharedSkills[]`, `canRefer`, `referrableJobIds[]`. `matchScore` stays 0–100.
- `POST /api/matching/sync-me` unchanged server-side; the frontend calls it automatically on profile save.

## Open decisions (defaults in place until overridden)

- Weights above (60/15/15/10) are defaults — tune after seeing real distributions.
- Threshold 0.30 is a guess — calibrate against real similarity scores.
- "Target company" source: student's saved target companies *and/or* jobs they've interacted with on the Job Board.