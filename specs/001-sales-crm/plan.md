# Implementation Plan: Sales CRM

**Branch**: `001-sales-crm` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-sales-crm/spec.md`

---

## Summary

Build a RESTful backend API for a Sales CRM that manages Accounts, Contacts, Leads, Opportunities, and Activities with full CRUD operations, a Lead status state machine, Opportunity value validation, Lead-to-Opportunity atomic conversion, and Activity linked-entity enforcement. The implementation uses Python 3.11 + FastAPI + SQLite (current target) + SQLAlchemy 2.x (async) + Pydantic v2, organized as a single backend service with no frontend. The codebase is designed to be database-agnostic so switching to PostgreSQL later requires only a `DATABASE_URL` config change.

---

## Technical Context

**Language/Version**: Python 3.11+

**Primary Dependencies**:
- `fastapi` 0.110+ — async web framework and OpenAPI generation
- `sqlalchemy` 2.0+ — ORM with async engine support
- `aiosqlite` — async SQLite driver (current target; swap for `asyncpg` when migrating to PostgreSQL)
- `pydantic` v2 — request/response schema validation
- `alembic` — database migrations
- `uvicorn` — ASGI server
- `pytest` + `pytest-asyncio` + `httpx` — integration testing

**Storage**: SQLite (current target; file-based, zero-setup). PostgreSQL-compatible design — migration is a config-only change. SQLite requires `PRAGMA foreign_keys = ON` per connection (wired in `app/database.py`).

**Testing**: `pytest` + `pytest-asyncio` + `httpx.AsyncClient` against a real SQLite test database file (no mocking of DB layer per D-011 in research.md)

**Target Platform**: Linux server (Docker-deployable), development on any OS with Python 3.11+

**Project Type**: Web service / REST API backend

**Performance Goals**: List endpoints return paginated results for 10,000 records within 3 seconds (SC-007)

**Constraints**: No authentication in v1; no frontend; single-tenant; hard deletes only; pagination max 100 per page

**Scale/Scope**: Single-tenant; up to 10,000 records per entity; 5 entities; ~25 API endpoints

---

## Constitution Check

*The project constitution (`.specify/memory/constitution.md`) contains only placeholder template content and has no ratified principles. No constitution gates to check.*

**Status**: PASS — no violations.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-sales-crm/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 — design decisions
├── data-model.md        # Phase 1 — DB schema & ORM conventions
├── quickstart.md        # Phase 1 — end-to-end validation guide
├── contracts/
│   └── api-endpoints.md # Phase 1 — full API contract
└── tasks.md             # Phase 2 — implementation tasks (via /speckit-tasks)
```

### Source Code (monorepo layout)

```text
backend/                           # All Python/FastAPI backend code
├── app/
│   ├── main.py                    # FastAPI app factory, router registration, /health
│   ├── database.py                # Async engine, AsyncSession factory, Base
│   ├── config.py                  # Settings (DATABASE_URL, pagination defaults)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── account.py             # Account SQLAlchemy model
│   │   ├── contact.py             # Contact SQLAlchemy model
│   │   ├── lead.py                # Lead model + LeadStatus enum
│   │   ├── opportunity.py         # Opportunity model + OpportunityStage enum
│   │   └── activity.py            # Activity model + ActivityType enum
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py              # PaginatedResponse generic, error shapes
│   │   ├── account.py             # AccountCreate, AccountUpdate, AccountResponse
│   │   ├── contact.py             # ContactCreate, ContactUpdate, ContactResponse
│   │   ├── lead.py                # LeadCreate, LeadUpdate, LeadResponse
│   │   ├── opportunity.py         # OpportunityCreate, OpportunityUpdate, OpportunityResponse
│   │   └── activity.py            # ActivityCreate, ActivityUpdate, ActivityResponse
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── accounts.py
│   │   ├── contacts.py
│   │   ├── leads.py               # includes POST /leads/{id}/convert
│   │   ├── opportunities.py
│   │   └── activities.py
│   └── services/
│       ├── __init__.py
│       ├── account_service.py
│       ├── contact_service.py
│       ├── lead_service.py        # state machine + conversion transaction
│       ├── opportunity_service.py
│       └── activity_service.py
├── alembic/
│   ├── env.py
│   └── versions/001_initial_schema.py
├── tests/
│   └── conftest.py
├── alembic.ini
├── requirements.txt
├── requirements-dev.txt
└── .env.example

frontend/                          # Future frontend (React / Vue / etc.)
│
specs/                             # SDD artifacts — always at repo root
└── 001-sales-crm/

tests/
├── conftest.py                # pytest fixtures: test DB, AsyncClient, data factories
├── test_accounts.py           # CRUD + deletion guard tests
├── test_contacts.py           # CRUD + email uniqueness tests
├── test_leads.py              # CRUD + state machine tests
├── test_lead_conversion.py    # Conversion happy path + rejection cases
├── test_opportunities.py      # CRUD + value validation + stage tests
└── test_activities.py         # CRUD + linked-entity enforcement tests

alembic/
├── env.py
├── versions/
│   └── 001_initial_schema.py  # All 5 tables + ENUMs

requirements.txt               # Production dependencies
requirements-dev.txt           # Testing + dev dependencies
.env.example                   # DATABASE_URL template
```

**Structure Decision**: Single backend service (Option 1 variant). No frontend. All five entity domains live under `app/` with clear layer separation: `models/` → `schemas/` → `services/` → `routers/`.

---

## Phase 0: Research Summary

See [research.md](research.md) for full decision log. Key decisions:

| Decision | Choice | Key Reason |
|----------|--------|------------|
| D-004 | SQLAlchemy 2.x async + aiosqlite (SQLite) | Avoids thread-pool blocking; swap to asyncpg for PostgreSQL migration |
| D-013 | SQLite now, PostgreSQL-portable design | Zero-setup dev; config-only migration path |
| D-005 | Separate Create/Update/Response schemas | PATCH semantics require all-Optional Update schema |
| D-006 | UUID v4 PKs | No sequential enumeration vulnerability |
| D-007 | Lead state machine in service layer | DB constraints cannot express stateful transition rules |
| D-008 | Conversion in single DB transaction | Spec requires atomic, all-or-nothing operation |
| D-009 | Pre-delete query (not FK exception) | Human-readable 409 error instead of cryptic IntegrityError |
| D-011 | Real test DB (no mocks) | Mock DB cannot replicate ENUM/UUID/CHECK constraint behavior |

---

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](data-model.md) for full schema, relationships, indexes, and ORM conventions.

**Five tables**: `accounts`, `contacts`, `leads`, `opportunities`, `activities`
**Three PostgreSQL ENUMs**: `lead_status`, `opportunity_stage`, `activity_type`
**Key constraint**: `activities` table has `CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL)`

### API Contract

See [contracts/api-endpoints.md](contracts/api-endpoints.md) for all 26 endpoints with request/response shapes and error codes.

**Endpoint count**: 25 endpoints across 5 resources (5 standard CRUD + 1 convert action on leads)
**Versioning**: All endpoints under `/api/v1/`

### Quickstart Validation

See [quickstart.md](quickstart.md) for runnable curl-based validation scenarios covering all 5 user stories and all 8 Success Criteria.

---

## Implementation Phases (for /speckit-tasks)

The following phasing is recommended for task generation:

| Phase | Scope | Rationale |
|-------|-------|-----------|
| **Phase 1** | Project scaffolding, DB config, Alembic, health endpoint | Foundation — all other phases depend on this |
| **Phase 2** | Account & Contact models + schemas + routers + tests | P1 user story; fewest dependencies |
| **Phase 3** | Lead model + state machine + CRUD + tests | Depends on Contact/Account for conversion |
| **Phase 4** | Opportunity model + CRUD + value validation + tests | Depends on Account and Contact |
| **Phase 5** | Activity model + linked-entity enforcement + tests | Depends on Contact and Opportunity |
| **Phase 6** | Lead conversion endpoint + integration tests | Depends on all prior phases |

---

## Complexity Tracking

*(No constitution violations — section left empty as specified.)*
