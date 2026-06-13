# Quickstart Validation Guide: Sales CRM

**Phase**: 1 — Design
**Date**: 2026-06-13
**Feature**: [spec.md](spec.md) | [API Contract](contracts/api-endpoints.md)

This guide describes how to validate the CRM API end-to-end once the application is running. It covers the golden path for each user story and the key business rule rejection scenarios.

---

## Prerequisites

- Python 3.11+ installed
- PostgreSQL 14+ running locally (or via Docker)
- A test database created and migrated
- Application running at `http://localhost:8000`
- `curl` or an HTTP client (Postman, httpx, etc.) available

## Setup Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable for DB connection
export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/crm_dev"

# Run database migrations (Alembic)
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000

# Confirm server is healthy
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

---

## Validation Scenarios

### 1. Account & Contact CRUD (US-1)

```bash
# Create an account
curl -s -X POST http://localhost:8000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "industry": "Manufacturing"}' | jq .
# Expected: 201 with id, name, created_at

ACCOUNT_ID=<id from above>

# Create a contact linked to the account
curl -s -X POST http://localhost:8000/api/v1/contacts \
  -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Jane\",\"last_name\":\"Doe\",\"email\":\"jane@acme.com\",\"account_id\":\"$ACCOUNT_ID\"}" | jq .
# Expected: 201 with contact id and account_id set

CONTACT_ID=<id from above>

# Retrieve the contact
curl -s http://localhost:8000/api/v1/contacts/$CONTACT_ID | jq .
# Expected: 200 with full contact record

# Attempt to delete the account (should fail — has a contact)
curl -s -X DELETE http://localhost:8000/api/v1/accounts/$ACCOUNT_ID
# Expected: 409 with code ACCOUNT_HAS_DEPENDENTS

# Delete the contact first
curl -s -X DELETE http://localhost:8000/api/v1/contacts/$CONTACT_ID
# Expected: 204

# Now delete the account (should succeed)
curl -s -X DELETE http://localhost:8000/api/v1/accounts/$ACCOUNT_ID
# Expected: 204
```

---

### 2. Lead Status State Machine (US-2)

```bash
# Create a lead
curl -s -X POST http://localhost:8000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Bob","last_name":"Smith","email":"bob@prospect.com","company":"Prospect Inc"}' | jq .
# Expected: 201, status = "new"

LEAD_ID=<id from above>

# Valid transition: new → contacted
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}' | jq .
# Expected: 200, status = "contacted"

# Invalid transition: contacted → new (regression)
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"new"}' | jq .
# Expected: 400, code = INVALID_LEAD_TRANSITION

# Valid: contacted → qualified
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"qualified"}' | jq .
# Expected: 200, status = "qualified"

# Valid: qualified → lost
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"lost"}' | jq .
# Expected: 200, status = "lost"

# Invalid: lost → any
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"new"}' | jq .
# Expected: 400, code = INVALID_LEAD_TRANSITION
```

---

### 3. Lead Conversion (US-3)

```bash
# Create a fresh lead and qualify it
curl -s -X POST http://localhost:8000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Alice","last_name":"Jones","email":"alice@newco.com","company":"NewCo"}' | jq .
LEAD_ID=<new id>

# Attempt conversion while status is "new" — should fail
curl -s -X POST http://localhost:8000/api/v1/leads/$LEAD_ID/convert | jq .
# Expected: 400, code = LEAD_NOT_QUALIFIED

# Qualify the lead (two steps: new → contacted → qualified)
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}' | jq .
curl -s -X PATCH http://localhost:8000/api/v1/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"qualified"}' | jq .

# Convert the lead
curl -s -X POST http://localhost:8000/api/v1/leads/$LEAD_ID/convert | jq .
# Expected: 201 OpportunityResponse with account_id and contact_id set

OPP_ID=<opportunity id from response>

# Verify account "NewCo" was created
curl -s "http://localhost:8000/api/v1/accounts?page=1&size=20" | jq '.items[] | select(.name=="NewCo")'
# Expected: one account record

# Verify contact alice@newco.com was created
curl -s "http://localhost:8000/api/v1/contacts?page=1&size=100" | jq '.items[] | select(.email=="alice@newco.com")'
# Expected: one contact record

# Run conversion again on same lead — should fail (already converted)
curl -s -X POST http://localhost:8000/api/v1/leads/$LEAD_ID/convert | jq .
# Expected: 400 (lead already has converted_opportunity_id or status has changed)
```

---

### 4. Opportunity Value Validation (US-4)

```bash
# Create an account for the opportunity
ACCOUNT_ID=<existing or create a new one>

# Create opportunity with valid value
curl -s -X POST http://localhost:8000/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Big Deal\",\"account_id\":\"$ACCOUNT_ID\",\"value\":5000.00}" | jq .
# Expected: 201

OPP_ID=<opportunity id>

# Update with zero value — should fail
curl -s -X PATCH http://localhost:8000/api/v1/opportunities/$OPP_ID \
  -H "Content-Type: application/json" \
  -d '{"value":0}' | jq .
# Expected: 422, msg contains "greater than 0"

# Update with negative value — should fail
curl -s -X PATCH http://localhost:8000/api/v1/opportunities/$OPP_ID \
  -H "Content-Type: application/json" \
  -d '{"value":-100}' | jq .
# Expected: 422

# Move to closed-won
curl -s -X PATCH http://localhost:8000/api/v1/opportunities/$OPP_ID \
  -H "Content-Type: application/json" \
  -d '{"stage":"closed-won"}' | jq .
# Expected: 200, stage = "closed-won"

# Filter opportunities by stage
curl -s "http://localhost:8000/api/v1/opportunities?stage=closed-won" | jq '.total'
# Expected: >= 1
```

---

### 5. Activity Logging (US-5)

```bash
CONTACT_ID=<existing contact>
OPP_ID=<existing opportunity>

# Log a call linked to a contact
curl -s -X POST http://localhost:8000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"call\",\"subject\":\"Intro call\",\"contact_id\":\"$CONTACT_ID\"}" | jq .
# Expected: 201 with activity_date defaulted to now

# Log a meeting linked to both contact AND opportunity
curl -s -X POST http://localhost:8000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"meeting\",\"subject\":\"Proposal review\",\"contact_id\":\"$CONTACT_ID\",\"opportunity_id\":\"$OPP_ID\"}" | jq .
# Expected: 201

# Attempt to log without any linked entity — should fail
curl -s -X POST http://localhost:8000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d '{"type":"email","subject":"Follow-up"}' | jq .
# Expected: 400, code = ACTIVITY_NO_LINK

# Filter by type
curl -s "http://localhost:8000/api/v1/activities?type=call" | jq '.items | length'
# Expected: >= 1 (the call logged above)
```

---

## Success Criteria Verification Matrix

| SC    | Validation Command / Check                                     | Pass When                              |
|-------|----------------------------------------------------------------|----------------------------------------|
| SC-001 | Create account + contact via 2 API calls; measure wall time  | Both calls complete in < 60s           |
| SC-002 | Run invalid transition scenarios above                        | 100% return 400 with INVALID_LEAD_TRANSITION |
| SC-003 | Submit value=0 and value=-1 to opportunity endpoints          | 100% return 422                        |
| SC-004 | POST activity with no contact_id or opportunity_id            | 100% return 400 with ACTIVITY_NO_LINK  |
| SC-005 | POST /leads/{id}/convert on a qualified lead                  | Single call returns 201 with full opportunity |
| SC-006 | Run CRUD tests for all 5 entities                             | All return appropriate 2xx and 404     |
| SC-007 | Seed 10,000 records per entity; GET list endpoints            | Response time < 3s                     |
| SC-008 | DELETE account with contacts or opportunities                  | 100% return 409                        |
