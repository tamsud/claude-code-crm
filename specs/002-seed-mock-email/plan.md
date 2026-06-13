# Implementation Plan: Demo Seed Management & Mock Email API

**Branch**: `002-seed-mock-email` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

---

## Summary

Add two capabilities to the existing FastAPI backend:
1. **Seed API** — two endpoints that wipe / repopulate all CRM tables with 6 realistic demo scenarios.
2. **Mock Email API** — a local in-process mailbox that stores outbound emails as database records, queryable via REST.

No new external dependencies required. Uses the same SQLAlchemy async stack, SQLite database, and Pydantic v2 schema pattern already in place.

---

## New Files

| Path | Purpose |
|------|---------|
| `app/models/email_message.py` | `EmailMessage` ORM model |
| `app/schemas/email_message.py` | `EmailSend`, `EmailResponse` Pydantic schemas |
| `app/schemas/seed.py` | `SeedCounts`, `SeedResponse` Pydantic schemas |
| `app/services/mock_email_service.py` | CRUD for email_messages |
| `app/services/seed_service.py` | `seed_demo()` + `clear_all()` |
| `app/routers/mock_email.py` | `/api/v1/mock-email/` router |
| `app/routers/seed.py` | `/api/v1/seed/` router |
| `alembic/versions/002_add_email_messages.py` | DB migration |
| `tests/test_mock_email.py` | Mock email test suite |
| `tests/test_seed.py` | Seed management test suite |

## Modified Files

| Path | Change |
|------|--------|
| `app/models/__init__.py` | Import `EmailMessage` (Alembic metadata detection) |
| `app/main.py` | Register `seed` and `mock_email` routers |
| `tests/conftest.py` | Add `email_messages` to `clean_tables` fixture |

---

## Data Model: email_messages

```
email_messages
  id           VARCHAR(36)   PK   uuid4, Python-generated
  from_email   VARCHAR(255)  NOT NULL
  to_email     VARCHAR(255)  NOT NULL   INDEX
  subject      VARCHAR(500)  NOT NULL
  body         TEXT          NULL
  html_body    TEXT          NULL
  sent_at      DATETIME      DEFAULT NOW()
  created_at   DATETIME      DEFAULT NOW()
```

No foreign keys — the mock mailbox is independent of CRM entities.

---

## API Contracts

### Seed

```
POST /api/v1/seed/
  → 201  { "message": "Demo data seeded successfully.",
            "seeded": { "accounts": 4, "contacts": 4, "leads": 6,
                        "opportunities": 4, "activities": 9, "emails": 8 } }

DELETE /api/v1/seed/
  → 204  (no body)
```

### Mock Email

```
POST /api/v1/mock-email/
  Body : { "from_email"*, "to_email"*, "subject"*, "body"?, "html_body"? }
  → 201  EmailResponse

GET /api/v1/mock-email/
  Query: ?page=1  ?size=20  ?to=<email>
  → 200  PaginatedResponse[EmailResponse]    (newest first)

GET /api/v1/mock-email/{id}
  → 200  EmailResponse   |   404

DELETE /api/v1/mock-email/
  → 204  (no body)
```

### EmailResponse shape

```json
{
  "id": "uuid",
  "from_email": "crm@demo.local",
  "to_email": "contact@company.com",
  "subject": "...",
  "body": "...",
  "html_body": null,
  "sent_at": "2026-06-13T10:00:00",
  "created_at": "2026-06-13T10:00:00"
}
```

---

## Seed Scenarios Detail

### Timing: activity_date offsets from seed time

| Activity | days_ago |
|----------|---------|
| TechStart — discovery call | 14 |
| TechStart — proposal email | 7 |
| HealthCare — requirements workshop | 21 |
| HealthCare — follow-up email | 10 |
| Finance — first negotiation call | 28 |
| Finance — review meeting | 14 |
| Finance — verbal commitment call | 5 |
| Global Retail — contract email | 45 |
| Global Retail — kickoff meeting | 30 |

### Mock emails deposited

| Subject | From | To |
|---------|------|-----|
| Welcome to Sales CRM | crm@demo.local | tom.wilson@techstart.io |
| Your proposal is ready | crm@demo.local | tom.wilson@techstart.io |
| Welcome to Sales CRM | crm@demo.local | sarah.j@healthcarepro.com |
| Annual License proposal enclosed | crm@demo.local | sarah.j@healthcarepro.com |
| Welcome to Sales CRM | crm@demo.local | m.chen@financesolutions.co |
| Security Suite contract for review | crm@demo.local | m.chen@financesolutions.co |
| Contract executed — welcome aboard! | crm@demo.local | emma.davis@globalretail.com |
| Your kickoff pack | crm@demo.local | emma.davis@globalretail.com |

---

## Implementation Phases

| Phase | Tasks |
|-------|-------|
| 1 — Model | `EmailMessage` ORM + migration |
| 2 — Schemas | `EmailSend`, `EmailResponse`, `SeedCounts`, `SeedResponse` |
| 3 — Services | `mock_email_service`, `seed_service` |
| 4 — Routers | `mock_email.py`, `seed.py`; register in `main.py` |
| 5 — Tests | `test_mock_email.py`, `test_seed.py`; update `conftest.py` |
