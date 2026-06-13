# E2E Testing Guide

This guide covers writing, running, and extending end-to-end tests for the Sales CRM platform.

---

## Overview

The CRM uses **manual E2E testing** (documented scenarios) alongside **unit and integration tests** (pytest for backend, Vitest for frontend). Playwright-based E2E automation can be layered on top of the documented scenarios below.

---

## Backend Integration Tests

### Running Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest                         # all tests
pytest -v                      # verbose
pytest tests/test_auth.py      # single file
pytest -k "test_login"         # by name pattern
```

### Existing Test Files

| File | Coverage |
|------|---------|
| `tests/test_auth.py` | Login success/failure, protected route access, wrong password |

### Writing a New Backend Test

```python
# tests/test_leads.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_create_lead_triggers_email(http_client, auth_headers_admin):
    """Creating a lead should auto-send a notification to crm-leads@company.internal."""
    resp = await http_client.post(
        "/api/v1/leads/",
        json={"first_name": "Test", "last_name": "User", "email": "test@example.com"},
        headers=auth_headers_admin,
    )
    assert resp.status_code == 201

    # Verify notification email was created
    emails = await http_client.get(
        "/api/v1/mock-email/?to=crm-leads@company.internal",
        headers=auth_headers_admin,
    )
    assert emails.json()["total"] >= 1
    subjects = [e["subject"] for e in emails.json()["items"]]
    assert any("Test User" in s for s in subjects)
```

---

## Scenario 1: Create Lead → Convert to Opportunity

### Setup
```bash
# Seed demo users first
curl -X POST http://localhost:8000/api/v1/admin/seed-users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Steps

**1. Log in as Manager**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"manager@crm.local","password":"password123"}' | jq -r .access_token)
```

**2. Create a lead**
```bash
LEAD=$(curl -s -X POST http://localhost:8000/api/v1/leads/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Alice","last_name":"Green","email":"alice@startup.io","company":"Startup IO","source":"Website"}')
LEAD_ID=$(echo $LEAD | jq -r .id)
echo "Lead created: $LEAD_ID, status: $(echo $LEAD | jq -r .status)"
```

**3. Advance lead to qualified**
```bash
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"contacted"}'

curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"qualified"}'
```

**4. Convert to opportunity**
```bash
OPP=$(curl -s -X POST http://localhost:8000/api/v1/leads/$LEAD_ID/convert \
  -H "Authorization: Bearer $TOKEN")
echo "Opportunity created: $(echo $OPP | jq -r .id), stage: $(echo $OPP | jq -r .stage)"
```

### Expected Results

| Check | Expected |
|-------|---------|
| Lead created | status = `new` |
| After contacted PATCH | status = `contacted` |
| After qualified PATCH | status = `qualified` |
| After convert | New opportunity with stage `prospecting` |
| Email inbox | 1 notification to `crm-leads@company.internal` |
| Lead field | `converted_opportunity_id` set |

### Common Failure Modes

- **400 LEAD_NOT_QUALIFIED** — Tried to convert before reaching `qualified` status
- **400 LEAD_ALREADY_CONVERTED** — Convert called twice on same lead
- **403** — Sales Rep tried to convert a lead they didn't create

---

## Scenario 2: Send Email from Contact Page

### Steps

**1. Get or create a contact**
```bash
CONTACT=$(curl -s -X POST http://localhost:8000/api/v1/contacts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Bob","last_name":"Jones","email":"bob@client.com"}')
CONTACT_ID=$(echo $CONTACT | jq -r .id)
```

**2. Send email to this contact**
```bash
EMAIL=$(curl -s -X POST http://localhost:8000/api/v1/mock-email/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"from_email\": \"crm@company.com\",
    \"to_email\": \"bob@client.com\",
    \"subject\": \"Following up on your enquiry\",
    \"body\": \"Hi Bob, thanks for getting in touch.\"
  }")
echo "Email sent, ID: $(echo $EMAIL | jq -r .id)"
```

**3. Verify in inbox**
```bash
curl -s "http://localhost:8000/api/v1/mock-email/?to=bob@client.com" \
  -H "Authorization: Bearer $TOKEN" | jq '.total'
```

### Expected Results

| Check | Expected |
|-------|---------|
| Email send | 201 response with email ID |
| Inbox filter | `total` ≥ 1 for `to=bob@client.com` |
| Email detail | subject, body, from/to correct |

---

## Scenario 3: Seed → Verify Dashboard KPIs

### Steps

**1. Clear all data**
```bash
curl -s -X DELETE http://localhost:8000/api/v1/admin/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**2. Verify everything is empty**
```bash
curl -s http://localhost:8000/api/v1/accounts/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .total  # should be 0
```

**3. Seed demo data**
```bash
curl -s -X POST http://localhost:8000/api/v1/seed/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .seeded
```

**4. Verify dashboard figures**
```bash
echo "Accounts: $(curl -s http://localhost:8000/api/v1/accounts/ -H "Authorization: Bearer $ADMIN_TOKEN" | jq .total)"
echo "Contacts: $(curl -s http://localhost:8000/api/v1/contacts/ -H "Authorization: Bearer $ADMIN_TOKEN" | jq .total)"
echo "Leads:    $(curl -s http://localhost:8000/api/v1/leads/ -H "Authorization: Bearer $ADMIN_TOKEN" | jq .total)"
echo "Opps:     $(curl -s http://localhost:8000/api/v1/opportunities/ -H "Authorization: Bearer $ADMIN_TOKEN" | jq .total)"
```

### Expected Results

| Entity | Count after seed |
|--------|----------------|
| Accounts | 4 |
| Contacts | 4 |
| Leads | 3 (1 qualified-converted, 1 new, 1 lost) |
| Opportunities | 4 |
| Activities | 9 |
| Emails | 8 |

---

## Adding New E2E Scenarios

1. **Identify the happy path** — what is the user doing, what should happen?
2. **Identify auth requirements** — which role, what token?
3. **Write the curl sequence** — create → mutate → verify
4. **Capture expected state** — HTTP status codes, JSON fields, side effects

### Test Template

```bash
# Scenario: <name>
# Role required: <admin|manager|sales_rep>
# Setup: <prerequisites>

# Step 1: <description>
RESULT=$(curl -s -X <METHOD> http://localhost:8000/api/v1/<path> \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '<body>')

# Verify
echo "Status field: $(echo $RESULT | jq -r .<field>)"
# Expected: <value>
```

---

## Playwright Automation (Optional)

To automate the UI scenarios above, install Playwright:

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

### Example Playwright Test

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('admin can log in and see dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page).toHaveURL('/login')

  await page.fill('input[type="email"]', 'admin@crm.local')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

Run with:
```bash
npx playwright test
npx playwright test --ui     # interactive mode
```
