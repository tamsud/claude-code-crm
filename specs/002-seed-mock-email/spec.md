# Feature Specification: Demo Seed Management & Mock Email API

**Feature ID**: 002-seed-mock-email  
**Date**: 2026-06-13  
**Status**: Approved — implementation in progress

---

## Overview

Two companion capabilities that let developers and demo operators control the CRM's data state via REST API and simulate email workflows without a real mail server.

1. **Seed Management** — one-call endpoints to populate the database with realistic demo scenarios or wipe it clean. Essential for demos, QA resets, and onboarding.
2. **Mock Email API** — a local in-process mailbox that captures outbound emails as database records and exposes them over HTTP. Allows full e2e testing of email-triggered flows without SMTP.

---

## User Stories

### P1 — Demo Reset
*As a developer or sales engineer*, I want to seed the database with a complete set of realistic CRM scenarios in one API call, so that I can run a live demo without manual data entry.

**Acceptance criteria**
- Single `POST /api/v1/seed/` call populates accounts, contacts, leads, opportunities, activities, and mock emails.
- The call is idempotent: calling it twice yields the same end state (clears first, then seeds).
- Response body lists the count of each entity type created.

### P2 — Demo Teardown
*As a developer or sales engineer*, I want to wipe all CRM data in one API call, so that I can reset the environment between demos without touching the database directly.

**Acceptance criteria**
- `DELETE /api/v1/seed/` removes every row from all tables (including mock emails).
- Returns 204 No Content.
- After the call, every list endpoint returns `{ "total": 0, "items": [] }`.

### P3 — Send Mock Email
*As an application component or FE developer*, I want to POST an email payload to an API endpoint that stores it as a record, so that I can verify email-triggering logic without a real SMTP server.

**Acceptance criteria**
- `POST /api/v1/mock-email/` accepts `from_email`, `to_email`, `subject`, `body`, `html_body`.
- Stores the message and returns it with a UUID and `sent_at` timestamp.
- `from_email` and `to_email` must be valid email addresses.

### P4 — View Mock Inbox
*As a developer or FE developer*, I want to list all captured mock emails, optionally filtered by recipient, so that I can verify which emails were triggered.

**Acceptance criteria**
- `GET /api/v1/mock-email/` returns a paginated list of all mock emails.
- `?to=email@addr.com` filter returns only messages to that recipient.
- `GET /api/v1/mock-email/{id}` returns a single message or 404.

### P5 — Clear Mock Inbox
*As a developer or FE developer*, I want to purge the mock inbox via API, so that I can start fresh without reseeding the whole CRM.

**Acceptance criteria**
- `DELETE /api/v1/mock-email/` removes all email records.
- Returns 204 No Content.

---

## Demo Scenarios (Seed Data)

The seed populates **6 scenarios** that collectively cover every entity type, lead status, opportunity stage, activity type, and key business rule:

| # | Account | Contact | Lead Status | Opportunity Stage | Activities |
|---|---------|---------|-------------|-------------------|------------|
| 1 | TechStart Inc | Tom Wilson (CTO) | qualified → converted | prospecting ($75 k) | call + email |
| 2 | HealthCare Pro | Sarah Johnson (VP Ops) | — (direct opp) | proposal ($120 k, 60%) | meeting + email |
| 3 | Finance Solutions Ltd | Michael Chen (IT Dir.) | — (direct opp) | negotiation ($250 k, 75%) | call + meeting + call |
| 4 | Global Retail Corp | Emma Davis (CIO) | — (direct opp) | closed-won ($500 k) | email + meeting |
| 5 | — | — | lost (new→contacted→lost) | — | — |
| 6 | — | — | new (just captured) | — | — |

The seed also deposits **8 mock emails** into the mock inbox (welcome and deal-update notifications for each of the 4 contacts).

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | `POST /api/v1/seed/` clears all existing data then creates 6 demo scenarios |
| FR-002 | Seed response body is `{ "message": str, "seeded": { "accounts": int, "contacts": int, "leads": int, "opportunities": int, "activities": int, "emails": int } }` |
| FR-003 | `DELETE /api/v1/seed/` removes all rows from all tables; returns 204 |
| FR-004 | After `DELETE /api/v1/seed/`, all CRM list endpoints return empty paginated results |
| FR-005 | `POST /api/v1/mock-email/` requires `from_email`, `to_email`, `subject`; `body` and `html_body` are optional |
| FR-006 | `from_email` and `to_email` must be valid email format (422 otherwise) |
| FR-007 | `GET /api/v1/mock-email/` returns paginated emails, newest first |
| FR-008 | `GET /api/v1/mock-email/?to=<email>` filters by exact recipient address |
| FR-009 | `GET /api/v1/mock-email/{id}` returns 404 if not found |
| FR-010 | `DELETE /api/v1/mock-email/` clears inbox only (does not touch CRM data) |
| FR-011 | Email messages are stored in a separate `email_messages` table |
| FR-012 | Seeding sends 8 mock notification emails (2 per contact scenario) |

---

## Success Criteria

| ID | Criterion |
|----|-----------|
| SC-001 | `POST /api/v1/seed/` → 201, body contains non-zero counts for all entity types |
| SC-002 | Calling seed twice yields identical counts (idempotent) |
| SC-003 | `DELETE /api/v1/seed/` → 204, subsequent `GET /api/v1/accounts/` returns `total: 0` |
| SC-004 | Seed → Clear → Seed cycle completes without error |
| SC-005 | Mock email round-trip: POST → GET list → GET by id → DELETE → empty inbox |
| SC-006 | Invalid email address in mock-email POST returns 422 |
| SC-007 | After seeding, `GET /api/v1/mock-email/` returns `total: 8` |

---

## Assumptions

- Seed and mock-email endpoints carry no authentication in v1 (consistent with the rest of the API).
- The seed endpoint is intended for development/demo use only; a production deployment would omit or gate it.
- Mock emails are stored in SQLite alongside CRM data; no external mail service is required.
- Clearing seed data removes ALL rows from all tables, including any user-created data outside the seed scenarios.
