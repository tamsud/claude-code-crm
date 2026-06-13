# Quickstart Validation Guide: Sales CRM Frontend

**Feature**: 004-crm-frontend | **Date**: 2026-06-13

This guide describes how to stand up the frontend, seed test data, and run validation scenarios to confirm the application works end-to-end. All scenarios correspond to test cases in `spec.md`.

---

## Prerequisites

1. **Backend running**: `uvicorn app.main:app --reload` from `backend/` → `http://localhost:8000`
2. **Backend healthy**: `curl http://localhost:8000/health` → `{"status":"ok"}`
3. **Node.js 22.17.1 + npm 10.9.2** installed (verify with `node --version`, `npm --version`)
4. **Frontend installed**: see Setup below

---

## Setup (first time only)

```powershell
# From repo root
cd frontend
npm install                         # clean install, no --legacy-peer-deps
cp .env.local.example .env.local    # copy env template
# .env.local contains: VITE_API_BASE_URL=http://localhost:8000
```

---

## Start Development Server

```powershell
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
# → http://localhost:5173
```

---

## Seed Demo Data

```powershell
# Seed (from any terminal)
curl -X POST http://localhost:8000/api/v1/seed/
# → 201 { "seeded": { "accounts": 4, "contacts": 4, "leads": 3, "opportunities": 4, "activities": 9, "emails": 8 } }
```

Or use the Seed Manager page at `http://localhost:5173/admin/seed` → click "Seed demo data".

---

## Validation Scenarios

### V-01: Dashboard KPIs (TC-I001)
1. Seed demo data
2. Open `http://localhost:5173/`
3. Verify:
   - "Total Accounts" card shows **4**
   - "Active Leads" card shows **2** (Lisa Chen: new; Tom Wilson: qualified)
   - "Open Pipeline" card shows **$445,000**
   - "Weighted Pipeline" card shows **$237,500**
   - "Win Rate" card shows **100%**
   - Activity feed shows 5 entries; most recent = "Verbal commitment call" (5 days ago)

### V-02: Dashboard Empty State (TC-I002)
1. Clear all data: `curl -X DELETE http://localhost:8000/api/v1/seed/`
2. Reload `http://localhost:5173/`
3. Verify all KPI cards show 0/empty and activity feed shows "No recent activity"

### V-03: Contact Detail CRM Layout (TC-I006)
1. Seed data
2. Navigate to `http://localhost:5173/contacts`
3. Click Tom Wilson
4. Verify:
   - Header title reads **"Tom Wilson, TechStart Inc"**
   - Left sidebar shows: avatar (initials "TW"), "Chief Technology Officer", phone "+1-415-555-0101", email "tom.wilson@techstart.io", "TechStart Inc" as clickable link
   - Three tabs visible: Overview, History, Emails
   - Header shows "Log Activity" and "Compose Email" buttons

### V-04: Contact Overview Tab — Days Since Contact (TC-I009)
1. With demo data seeded
2. Open Tom Wilson contact → Overview tab
3. Verify "Days since last contact" shows **7** (most recent activity: "Sent enterprise platform proposal", 7 days ago)
4. Verify linked opportunity card shows "TechStart Inc — Enterprise Platform"

### V-05: Contact History Tab (TC-I010)
1. Open Tom Wilson → History tab
2. Verify 2 activities listed in reverse chronological order:
   - "Sent enterprise platform proposal" (email, 7 days ago)
   - "Initial discovery call with Tom" (call, 14 days ago)

### V-06: Contact Emails Tab (TC-I011)
1. Open Tom Wilson → Emails tab
2. Verify 2 emails shown: "Welcome to Sales CRM" and "Your proposal is ready" (both from crm@demo.local)
3. Click one email → full body displayed

### V-07: Lead Status Machine (TC-I012 + TC-I013)
1. Open Lisa Chen lead (`/leads`)
2. Verify status is **new** with badge (blue)
3. Click status control — only "Contacted" and "Lost" available (not "Qualified")
4. Advance to "Contacted", then "Qualified"
5. Click "Convert to Opportunity" → new opportunity created
6. Verify lead shows "Converted" badge with link to opportunity

### V-08: Lead Terminal State (TC-I014)
1. Open James Park lead
2. Verify status is **lost** (gray badge)
3. No status transition controls shown
4. "Convert to Opportunity" button absent or disabled

### V-09: Pipeline Board (TC-I015)
1. Open `http://localhost:5173/opportunities`
2. Switch to board view
3. Verify 4 columns with cards:
   - Prospecting: "TechStart Inc — Enterprise Platform" ($75,000)
   - Proposal: "HealthCare Pro — Annual License" ($120,000)
   - Negotiation: "Finance Solutions — Security Suite" ($250,000)
   - Closed-Won: "Global Retail — Digital Transformation" ($500,000)
4. Each column shows stage total

### V-10: Activity Type Filter (TC-I021)
1. Open `http://localhost:5173/activities`
2. Set type filter to "Meeting"
3. Verify exactly 3 results: "Requirements gathering workshop", "Final review meeting with legal team", "Project kickoff meeting"

### V-11: Mock Email Inbox (TC-I023)
1. Open `http://localhost:5173/admin/mock-email`
2. Verify 8 emails listed (all from crm@demo.local)
3. Filter by recipient: enter "emma.davis@globalretail.com" → 2 results

### V-12: Compose Email from Contact (TC-I022)
1. Open Sarah Johnson contact → Emails tab
2. Click "Compose"
3. Verify "To" field is pre-filled with "sarah.j@healthcarepro.com" and cannot be changed
4. Fill in From, Subject, Body and send
5. New email appears at top of tab list

### V-13: Seed Manager (V-01 repeat via UI)
1. Open `http://localhost:5173/admin/seed`
2. Click "Clear all data" → confirm dialog appears → confirm
3. Navigate to `/accounts` → empty state shown
4. Return to Seed Manager → click "Seed demo data"
5. Verify result panel shows: accounts=4, contacts=4, leads=3, opportunities=4, activities=9, emails=8
6. Navigate to `/accounts` → 4 rows shown

### V-14: Error Handling — Backend Unreachable (TC-I029)
1. Stop backend (Ctrl+C)
2. Open any list page
3. Verify error banner shown with readable message and "Retry" button
4. Restart backend, click Retry → data loads

### V-15: Account Delete Blocked (TC-I004)
1. With demo data seeded
2. Navigate to Accounts, click "TechStart Inc"
3. Click Delete
4. Verify error message: "Cannot delete — linked contacts (or opportunities) exist"
5. Account remains in list

---

## Run Unit Tests

```powershell
cd frontend
npm run test:unit
# Runs Vitest against tests/unit/**/*.test.ts
# Expected: 22 tests pass (TC-U001–TC-U022)
```

---

## Run Integration/E2E Tests

```powershell
# Requires: backend running on localhost:8000, frontend running on localhost:5173
cd frontend
npm run test:e2e
# Runs Playwright against tests/e2e/**/*.spec.ts
# Expected: 30 scenarios pass (TC-I001–TC-I030)
# HTML report: playwright-report/index.html
```

---

## Package Scripts (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server on :5173 |
| `build` | `vite build` | Production bundle to `dist/` |
| `preview` | `vite preview` | Preview production build |
| `test:unit` | `vitest run` | Run unit tests once |
| `test:unit:watch` | `vitest` | Unit tests in watch mode |
| `test:e2e` | `playwright test` | Run all e2e tests headless |
| `test:e2e:ui` | `playwright test --ui` | E2e tests with Playwright UI |
| `typecheck` | `tsc --noEmit` | TypeScript type check only |
| `lint` | `eslint src tests` | Lint source and tests |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

Set in `frontend/.env.local` (not committed to git).
