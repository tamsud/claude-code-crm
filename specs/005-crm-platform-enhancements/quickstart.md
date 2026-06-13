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
