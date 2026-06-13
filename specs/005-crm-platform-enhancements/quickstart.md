# Quickstart Validation Guide: CRM Platform Enhancement Suite

**Feature**: `005-crm-platform-enhancements`
**Date**: 2026-06-13

---

## Prerequisites

- Node 22.17.1 / npm 10.9.2 installed
- Python 3.12 installed
- Docker Desktop installed (for Docker validation only)
- Backend running at http://localhost:8000
- Frontend dev server running at http://localhost:5173

---

## Scenario 1: Auth & Seed Users

### 1a. Seed the test users

```bash
curl -X POST http://localhost:8000/api/v1/seed/users
# Expected: {"created": 3, "skipped": 0}
```

### 1b. Login as Admin

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@crm.local", "password": "password123"}'
# Expected: {"access_token": "<jwt>", "token_type": "bearer"}
```

Save the token:
```bash
TOKEN="<paste token here>"
```

### 1c. Verify role claim in JWT

```bash
# Decode the payload (middle section base64):
echo "<middle_part_of_jwt>" | base64 -d 2>/dev/null || python3 -c "
import base64, json, sys
t = '$TOKEN'.split('.')[1]
t += '=' * (4 - len(t) % 4)
print(json.dumps(json.loads(base64.urlsafe_b64decode(t)), indent=2))
"
# Expected: { "sub": "<uuid>", "email": "admin@crm.local", "role": "admin", "exp": <timestamp> }
```

### 1d. Login as each seed user and verify roles

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@crm.local", "password": "password123"}'
# Expected: access_token with role: "manager"

curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sales@crm.local", "password": "password123"}'
# Expected: access_token with role: "sales_rep"
```

---

## Scenario 2: RBAC Enforcement

### 2a. Admin can access user list

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/users
# Expected: 200 with list of users
```

### 2b. Manager cannot access user list

```bash
MANAGER_TOKEN="<manager token from 1d>"
curl -H "Authorization: Bearer $MANAGER_TOKEN" http://localhost:8000/api/v1/users
# Expected: 403 {"detail": "Insufficient permissions"}
```

### 2c. Unauthenticated request rejected

```bash
curl http://localhost:8000/api/v1/users
# Expected: 401 {"detail": "Not authenticated"}
```

---

## Scenario 3: Frontend Login Flow

1. Open browser to http://localhost:5173
2. Expected: redirected to http://localhost:5173/login
3. Enter `admin@crm.local` / `password123` → click Login
4. Expected: redirected to dashboard
5. Open browser DevTools → Application → Local Storage, Session Storage, Cookies
6. Expected: no JWT visible in any browser storage
7. Click Logout
8. Expected: redirected to /login

---

## Scenario 4: Mock Email on Lead Create

### 4a. Create a lead

```bash
curl -X POST http://localhost:8000/api/v1/leads/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "source": "website"
  }'
# Expected: 201 Lead created
```

### 4b. Verify notification email was created

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/emails/?to=crm-leads%40company.internal"
# Expected: items contains an email with subject "New Lead: Jane Smith"
# and body containing "jane@example.com", "Acme Corp", "website"
```

---

## Scenario 5: User Management

### 5a. Create a new user (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newrep@example.com",
    "password": "testpass123",
    "role": "sales_rep",
    "display_name": "New Rep"
  }'
# Expected: 201 User object (no password field)
```

### 5b. Deactivate the user

```bash
USER_ID="<id from 5a response>"
curl -X PATCH http://localhost:8000/api/v1/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
# Expected: 200 User with is_active=false
```

### 5c. Verify deactivated user cannot login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "newrep@example.com", "password": "testpass123"}'
# Expected: 401 {"detail": "Account is deactivated"}
```

---

## Scenario 6: Clear Database (Admin Only)

### 6a. Seed demo data first

```bash
curl -X POST http://localhost:8000/api/v1/seed/ -H "Authorization: Bearer $TOKEN"
# Expected: 201 with created counts
```

### 6b. Clear all CRM data (not users)

```bash
curl -X DELETE http://localhost:8000/api/v1/admin/clear \
  -H "Authorization: Bearer $TOKEN"
# Expected: 204 No Content
```

### 6c. Verify CRM data is gone but users remain

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/leads/
# Expected: {"total": 0, "items": []}

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/users
# Expected: users still present
```

---

## Scenario 7: Docker Persistence

```bash
# Start the stack
docker compose up -d

# Seed some data
curl -X POST http://localhost:8000/api/v1/seed/users
curl -X POST http://localhost:8000/api/v1/seed/

# Restart without removing volume
docker compose restart

# Verify data persists
curl http://localhost:8000/api/v1/users
# Expected: 3 seed users still present

# Full stop without -v
docker compose down
docker compose up -d

# Verify data persists
curl http://localhost:8000/api/v1/users
# Expected: 3 seed users still present

# Destroy volume
docker compose down -v
docker compose up -d

# Verify database is empty
curl http://localhost:8000/api/v1/users
# Expected: empty (no users; must seed again)
```

---

## Scenario 9: Sorting & Filtering

### 9a. Seed demo data first

```bash
curl -X POST http://localhost:8000/api/v1/seed/ -H "Authorization: Bearer $TOKEN"
```

### 9b. Search accounts by name

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/accounts/?search=tech&sort_by=name&sort_dir=asc"
# Expected: items where name contains "tech" (case-insensitive), sorted A→Z
```

### 9c. Filter leads by status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/leads/?status=qualified&sort_by=company&sort_dir=asc"
# Expected: only qualified leads, sorted by company name A→Z
```

### 9d. Search contacts by email

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/contacts/?search=@acme"
# Expected: contacts whose email contains "@acme"
```

### 9e. Sort opportunities by value

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/opportunities/?sort_by=value&sort_dir=desc"
# Expected: opportunities sorted highest value first
```

### 9f. Invalid sort_by falls back gracefully

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/leads/?sort_by=nonexistent_field&sort_dir=asc"
# Expected: 200 with results sorted by created_at desc (silent fallback, no 422)
```

### 9g. Filter users by role (Admin only)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/users?role=manager"
# Expected: only manager@crm.local in items
```

---

## Scenario 10: Profile Page & Display Name Update

### 10a. Get current user profile

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/users/me
# Expected: {"id": "...", "email": "admin@crm.local", "role": "admin", "display_name": null, ...}
```

### 10b. Update display name

```bash
curl -X PATCH http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "CRM Admin"}'
# Expected: 200 User with display_name: "CRM Admin"
```

### 10c. Verify sidebar reflects updated name (browser)

1. Log in at http://localhost:5173
2. Navigate to any page
3. Expected: sidebar bottom shows "CRM Admin" (or email if display_name null)
4. Click the user card in the sidebar → navigates to /profile
5. Update display name → click Save → sidebar updates immediately without page reload

---

## Scenario 8: Gitignore Verification

```bash
# From repo root:
git status --short
# Expected: no node_modules/, __pycache__/, .env files, dist/, or .venv/ listed

# Verify specific patterns
git check-ignore -v frontend/node_modules frontend/.env backend/__pycache__ backend/.venv
# Expected: all matched by respective .gitignore files
```

---

## Scenario 11: UI/UX Modernisation (US16)

### 11a. Login page responsive layout

1. Open http://localhost:5173/login in a browser set to 1366×768 viewport
2. Expected: two-panel layout — brand panel (indigo/navy) on the left, login form on the right
3. Expected: entire form is visible without vertical scrolling
4. Resize browser to 768px width
5. Expected: brand panel disappears, single-column form centred on white background

### 11b. Sidebar collapse

1. Log in and navigate to the Dashboard
2. Click the chevron toggle button at the right edge of the sidebar
3. Expected: sidebar collapses to icon-only width (~64px) within 200ms smooth transition
4. Expected: text labels are hidden; icon tooltips appear on hover
5. Reload the page
6. Expected: sidebar remains collapsed (state persisted in localStorage)
7. Verify in DevTools → Application → Local Storage → `crm-sidebar-collapsed` = `"1"`
8. Click the chevron again → sidebar expands back to full width

### 11c. Mobile sidebar drawer

1. Open the app in a browser resized to 375px width (or Chrome DevTools mobile emulation)
2. Expected: sidebar is hidden; a hamburger menu button is visible in the top navigation bar
3. Click the hamburger button
4. Expected: sidebar slides in from the left as a drawer overlay
5. Click outside the drawer or press Escape
6. Expected: drawer closes

### 11d. Skeleton loaders on list pages

1. Navigate to the Accounts list page (http://localhost:5173/accounts)
2. If using Chrome DevTools, throttle the network to "Slow 3G" before navigating
3. Expected: during the data fetch, animated skeleton rows are displayed (pulsing grey bars)
4. Expected: once data loads, skeleton rows are replaced by actual account rows

### 11e. Dashboard KPI cards

1. Seed demo data: `curl -X POST http://localhost:8000/api/v1/seed/ -H "Authorization: Bearer $TOKEN"`
2. Navigate to the Dashboard (http://localhost:5173/)
3. Expected: four KPI cards are visible at the top:
   - "Total Leads" — non-zero number
   - "Open Opp. Value" — dollar value from open opportunities
   - "Active Accounts" — non-zero number
   - "Activities Due Today" — number (may be 0)
4. Expected: KPI card values match the seeded data (run quick count checks via API)
5. Expected: skeleton cards show briefly while data loads, then replaced by real values

### 11f. Typography (Inter font)

1. Open the app and inspect any text element in Chrome DevTools → Computed styles
2. Expected: `font-family` shows `Inter` as the first font in the stack

### 11g. Focus ring accessibility (WCAG 2.1 AA)

1. Open the login page
2. Press Tab to cycle through interactive elements
3. Expected: each focused element (email input, password input, Sign In button) shows a visible indigo focus ring
4. On the Dashboard, Tab through the nav links
5. Expected: each focused nav link shows a visible focus ring

### 11h. Design token verification

1. Run: `cd frontend && npx tailwindcss --content "./src/**/*.tsx" --output /tmp/out.css 2>&1`
   (Or check `tailwind.config.ts` directly)
2. Expected: `tailwind.config.ts` contains `colors.brand`, `colors.surface`, `borderRadius.card`, `boxShadow.card`, `boxShadow.dropdown` extensions
