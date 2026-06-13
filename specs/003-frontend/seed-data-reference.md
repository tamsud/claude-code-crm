# Frontend Dev — Seed Data Reference

> **Rule**: No hardcoded/static mock data anywhere in the frontend.
> Every component must render real data fetched from the backend API.
> Run the seed command once before starting dev; re-run any time to reset.

---

## Dev Startup Workflow

```bash
# Terminal 1 — start backend
cd backend
uvicorn app.main:app --reload
# → http://localhost:8000

# Terminal 2 — seed demo data (once, or after any reset)
curl -X POST http://localhost:8000/api/v1/seed/
# → 201 { "message": "Demo data seeded successfully.", "seeded": { ... } }

# Terminal 3 — start frontend (once scaffolded)
cd frontend
npm run dev
# → http://localhost:5173
```

**Reset for a new demo session:**
```bash
curl -X DELETE http://localhost:8000/api/v1/seed/   # wipe
curl -X POST  http://localhost:8000/api/v1/seed/    # re-seed
```

---

## Backend API Base URL

| Environment | Value |
|-------------|-------|
| Development | `http://localhost:8000` |
| Env var | `VITE_API_BASE_URL=http://localhost:8000` |

Set in `frontend/.env.local` — never hardcode in source.

---

## CORS

The backend must allow `http://localhost:5173`. Add to `backend/app/main.py` before scaffolding the frontend:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## What the Seed Creates — Complete Record Map

### Accounts (4)

| # | `name` | `industry` | `website` | `phone` |
|---|--------|------------|-----------|---------|
| 1 | TechStart Inc | Technology | https://techstart.io | +1-415-555-0101 |
| 2 | HealthCare Pro | Healthcare | https://healthcarepro.com | +1-212-555-0200 |
| 3 | Finance Solutions Ltd | Financial Services | https://financesolutions.co | — |
| 4 | Global Retail Corp | Retail | https://globalretail.com | +44-20-7946-0000 |

**Page rendering check — `/accounts`:**
- Table shows 4 rows
- Industry column has all 4 distinct values
- 2 accounts have phone, 2 don't → test nullable field rendering
- Pagination shows total=4

---

### Contacts (4)

| # | `first_name` | `last_name` | `email` | `job_title` | `phone` | `account` |
|---|-------------|------------|---------|-------------|---------|-----------|
| 1 | Tom | Wilson | tom.wilson@techstart.io | Chief Technology Officer | +1-415-555-0102 | TechStart Inc |
| 2 | Sarah | Johnson | sarah.j@healthcarepro.com | VP of Operations | — | HealthCare Pro |
| 3 | Michael | Chen | m.chen@financesolutions.co | Director of IT | — | Finance Solutions Ltd |
| 4 | Emma | Davis | emma.davis@globalretail.com | Chief Information Officer | — | Global Retail Corp |

**Page rendering check — `/contacts`:**
- 4 rows, all with email + job_title
- 1 contact has phone, 3 don't → test nullable
- Each contact links to a different account
- Filter `?account_id=<TechStart id>` → returns 1 result (Tom Wilson)

**Contact detail — `/contacts/:id`:**
- Each contact shows their account name as a clickable link
- Tom Wilson has: 1 linked opportunity, 2 activities, 2 mock emails
- Emma Davis has: 1 linked opportunity, 2 activities, 2 mock emails

---

### Leads (3)

| # | `first_name` | `last_name` | `email` | `company` | `source` | `status` | `notes` | `converted_opportunity_id` |
|---|-------------|------------|---------|-----------|----------|----------|---------|---------------------------|
| 1 | Tom | Wilson | tom.wilson@techstart.io | TechStart Inc | Website | qualified | — | → opp 1 (set) |
| 2 | James | Park | james.park@startupx.io | StartupX | Cold outreach | lost | "Budget constraints — revisit in Q4." | null |
| 3 | Lisa | Chen | lisa.chen@newco.com | NewCo Ltd | Referral | new | — | null |

**Page rendering check — `/leads`:**
- 3 rows total
- All 3 status variants present: `new`, `qualified`, `lost`
- Filter `?status=new` → 1 result (Lisa Chen)
- Filter `?status=lost` → 1 result (James Park) — shows notes field
- Filter `?status=qualified` → 1 result (Tom Wilson) — shows converted badge

**Lead detail — `/leads/:id` (Tom Wilson lead):**
- Status = `qualified` → Convert button must be **enabled**
- `converted_opportunity_id` is set → shows "Already converted" indicator + link to opportunity
- Valid next transitions from `qualified`: only `lost`

**Lead detail — `/leads/:id` (James Park lead):**
- Status = `lost` → Convert button **disabled**, no further transitions
- Notes field renders: "Budget constraints — revisit in Q4."

**Lead detail — `/leads/:id` (Lisa Chen lead):**
- Status = `new` → Convert button **disabled** (must reach `qualified` first)
- Valid next transitions: `contacted` or `lost`

---

### Opportunities (4)

| # | `title` | `stage` | `value` | `probability` | `expected_close_date` | `account` | `contact` |
|---|---------|---------|---------|---------------|----------------------|-----------|-----------|
| 1 | TechStart Inc — Enterprise Platform | prospecting | $75,000 | 30% | — | TechStart Inc | Tom Wilson |
| 2 | HealthCare Pro — Annual License | proposal | $120,000 | 60% | ~79 days from seed | HealthCare Pro | Sarah Johnson |
| 3 | Finance Solutions — Security Suite | negotiation | $250,000 | 75% | ~32 days from seed | Finance Solutions Ltd | Michael Chen |
| 4 | Global Retail — Digital Transformation | closed-won | $500,000 | 100% | — | Global Retail Corp | Emma Davis |

**Page rendering check — `/opportunities`:**
- 4 cards/rows across 4 distinct stages
- Pipeline total = $945,000
- Filter `?stage=prospecting` → 1 result
- Filter `?stage=closed-won` → 1 result
- 2 opportunities have no close date (null) → test nullable date rendering
- Weighted pipeline value = $75k×0.3 + $120k×0.6 + $250k×0.75 + $500k×1.0 = $750,500

**Opportunity detail — `/opportunities/:id` (opp 1 - prospecting):**
- 2 activities linked: call (14 days ago) + email (7 days ago)
- Contact: Tom Wilson (clickable → contact detail)
- Account: TechStart Inc (clickable → account detail)

**Opportunity detail — `/opportunities/:id` (opp 3 - negotiation):**
- 3 activities linked (most active deal)
- Close date set and approaching (~32 days) → good for testing date urgency styling

**Opportunity detail — `/opportunities/:id` (opp 4 - closed-won):**
- Stage = `closed-won` → edit controls should show as read-only or locked
- 2 activities linked

---

### Activities (9)

| # | `type` | `subject` | `days_ago` | `contact` | `opportunity` |
|---|--------|-----------|-----------|-----------|---------------|
| 1 | call | Initial discovery call with Tom | 14 | Tom Wilson | TechStart opp |
| 2 | email | Sent enterprise platform proposal | 7 | — | TechStart opp |
| 3 | meeting | Requirements gathering workshop | 21 | Sarah Johnson | HealthCare opp |
| 4 | email | Follow-up on proposal | 10 | Sarah Johnson | — |
| 5 | call | Initial pricing negotiation call | 28 | — | Finance opp |
| 6 | meeting | Final review meeting with legal team | 14 | Michael Chen | Finance opp |
| 7 | call | Verbal commitment call | 5 | Michael Chen | Finance opp |
| 8 | email | Contract signed — thank you, Emma! | 45 | Emma Davis | Global Retail opp |
| 9 | meeting | Project kickoff meeting | 30 | — | Global Retail opp |

**Page rendering check — `/activities`:**
- 9 rows, chronologically spanning 5–45 days ago
- All 3 types present: `call` (3), `email` (3), `meeting` (3)
- Filter `?type=call` → 3 results
- Filter `?type=meeting` → 3 results
- Some activities have contact, some don't → test nullable link rendering
- Some activities have opportunity, some don't → test nullable link rendering
- Filter `?contact_id=<Michael Chen id>` → 2 results (activities 6 + 7)
- Filter `?opportunity_id=<Finance opp id>` → 3 results (activities 5, 6, 7)

---

### Mock Emails (8)

| # | `to_email` | `subject` | `from_email` |
|---|-----------|-----------|--------------|
| 1 | tom.wilson@techstart.io | Welcome to Sales CRM | crm@demo.local |
| 2 | tom.wilson@techstart.io | Your proposal is ready | crm@demo.local |
| 3 | sarah.j@healthcarepro.com | Welcome to Sales CRM | crm@demo.local |
| 4 | sarah.j@healthcarepro.com | Annual License proposal enclosed | crm@demo.local |
| 5 | m.chen@financesolutions.co | Welcome to Sales CRM | crm@demo.local |
| 6 | m.chen@financesolutions.co | Security Suite contract for review | crm@demo.local |
| 7 | emma.davis@globalretail.com | Contract executed — welcome aboard! | crm@demo.local |
| 8 | emma.davis@globalretail.com | Your project kickoff pack | crm@demo.local |

**Page rendering check — `/admin/mock-email`:**
- 8 rows total, all from `crm@demo.local`
- Filter `?to=tom.wilson@techstart.io` → 2 results
- Filter `?to=emma.davis@globalretail.com` → 2 results
- Filter `?to=nobody@example.com` → 0 results → EmptyState renders

---

## Page-by-Page Data Coverage Summary

| Page | Seed covers | Edge cases present |
|------|-------------|-------------------|
| `/` Dashboard | 4 accounts, 3 leads (all statuses), 4 opps (all stages), 9 activities | Pipeline across all stages |
| `/accounts` | 4 accounts, mix of fields | 2 with phone / 2 without |
| `/accounts/:id` | Each account has 1 contact + 1 opportunity | — |
| `/contacts` | 4 contacts, all with job_title | 1 with phone / 3 without |
| `/contacts/:id` | Each has activities + opportunity + emails | Varies by contact (2–3 activities) |
| `/leads` | 3 leads — new / qualified / lost | All status variants, one with notes, one converted |
| `/leads/:id` | Tom=convertable, James=lost terminal, Lisa=new | Convert enabled/disabled states |
| `/opportunities` | 4 deals across all 5 stages (prospecting→closed-won) | 2 with close date / 2 without |
| `/opportunities/:id` | Activities: opp1=2, opp2=2, opp3=3, opp4=2 | opp3 has most activity |
| `/activities` | 9 activities, all types, mixed links | Some contact-only, some opp-only, some both |
| `/admin/mock-email` | 8 emails, 2 per contact | Filter by `to` works across all 4 contacts |
| `/admin/seed` | POST/DELETE both tested | Idempotent — safe to trigger from UI |

---

## API Response Shapes (TypeScript types)

These are the exact shapes the backend returns. Use these to define your TypeScript interfaces — do not guess field names.

```typescript
// GET /api/v1/accounts/:id
interface Account {
  id: string;           // UUID
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;   // ISO datetime
  updated_at: string;
}

// GET /api/v1/contacts/:id
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/v1/leads/:id
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  notes: string | null;
  converted_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/v1/opportunities/:id
interface Opportunity {
  id: string;
  title: string;
  account_id: string;
  contact_id: string | null;
  stage: 'prospecting' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  value: number | null;           // USD, must be > 0 if set
  probability: number | null;     // 0–100
  expected_close_date: string | null;  // date string "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

// GET /api/v1/activities/:id
interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting';
  subject: string;
  notes: string | null;
  activity_date: string | null;   // ISO datetime
  contact_id: string | null;
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/v1/mock-email/:id
interface EmailMessage {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string | null;
  html_body: string | null;
  sent_at: string;
  created_at: string;
}

// All list endpoints
interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}
```

---

## Lead Status Transition Rules (enforce in UI)

The backend rejects invalid transitions with HTTP 400. The frontend must pre-validate to avoid wasted requests and show correct options.

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  new:       ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['lost'],
  lost:      [],            // terminal — no transitions
};

// Convert is only available when:
// status === 'qualified' && converted_opportunity_id === null
```

---

## Dashboard Derived Metrics (compute client-side from API data)

The dashboard KPIs are computed from list endpoint responses — no dedicated stats endpoint exists.

| KPI | Computation |
|-----|-------------|
| Total accounts | `accounts.total` |
| Active leads | `leads` where status in `['new','contacted','qualified']` — count |
| Pipeline value | sum of `opportunity.value` where stage not in `['closed-won','closed-lost']` |
| Weighted pipeline | sum of `(opportunity.value × opportunity.probability / 100)` |
| Win rate | `closed-won count / (closed-won + closed-lost count)` |
| Recent activity | latest 5 from `GET /api/v1/activities/?size=5&page=1` |

**With seed data these values will be:**
- Total accounts: **4**
- Active leads: **2** (Lisa Chen = new, Tom Wilson = qualified)
- Pipeline value: **$445,000** (opps 1+2+3, excluding closed-won)
- Weighted pipeline: **$237,500** ($75k×0.30 + $120k×0.60 + $250k×0.75)
- Win rate: **100%** (1 closed-won, 0 closed-lost)
- Most recent activity: "Verbal commitment call" (5 days ago)

---

## React Query Key Reference

```typescript
// Use these exact keys so queries invalidate correctly across components
export const queryKeys = {
  accounts:      (params = {}) => ['accounts', params] as const,
  account:       (id: string) => ['account', id] as const,
  contacts:      (params = {}) => ['contacts', params] as const,
  contact:       (id: string) => ['contact', id] as const,
  leads:         (params = {}) => ['leads', params] as const,
  lead:          (id: string) => ['lead', id] as const,
  opportunities: (params = {}) => ['opportunities', params] as const,
  opportunity:   (id: string) => ['opportunity', id] as const,
  activities:    (params = {}) => ['activities', params] as const,
  activity:      (id: string) => ['activity', id] as const,
  emails:        (params = {}) => ['emails', params] as const,
  email:         (id: string) => ['email', id] as const,
} as const;
```

---

## What Is NOT in the Seed (keep as null/empty state in UI)

These fields/states exist in the schema but are not populated by the seed. Every component that can receive them must handle the empty/null case:

| Field / State | Where | Seed value |
|---------------|-------|------------|
| `phone` on contacts 2, 3, 4 | Contact detail | `null` |
| `phone` on accounts 3 | Account detail | `null` |
| `expected_close_date` on opps 1 + 4 | Opportunity detail | `null` |
| `contact_id` on activities 2, 5, 9 | Activity card | `null` |
| `opportunity_id` on activity 4 | Activity card | `null` |
| `notes` on leads 1 + 3 | Lead detail | `null` |
| `html_body` on all emails | Email view | `null` |
| Zero-result list | Any list page with filter | Use FilterBar to trigger EmptyState |
| `closed-lost` stage | Opportunities | Not seeded — create manually to test |
| `contacted` lead status | Leads | Not seeded — transition Lisa Chen to test |
