# Sales CRM Platform

A production-ready full-stack CRM built with **React 18 + TypeScript** (frontend) and **FastAPI + SQLAlchemy 2.0** (backend), featuring JWT authentication, RBAC, Docker containerisation, and comprehensive sort/filter support.

## Quick Start (Docker — recommended)

```bash
git clone <repo-url> && cd claude-code-crm
docker compose up --build
# App: http://localhost  |  API: http://localhost:8000/docs
```

**Data persists across restarts** via Docker named volume `crm_db_data`.
To completely wipe data: `docker compose down -v`

## Demo Accounts

After first login, seed demo users: **Admin → Admin section → Seed Demo Users**

| Email | Password | Role |
|-------|----------|------|
| admin@crm.local | password123 | Administrator |
| manager@crm.local | password123 | Manager |
| sales@crm.local | password123 | Sales Rep |

## Project Structure

```
claude-code-crm/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind CSS
├── backend/           # Python 3.12 + FastAPI + SQLAlchemy 2.0 + SQLite
├── specs/             # Feature specifications and planning documents
├── docs/              # Project documentation
└── docker-compose.yml # Production Docker setup
```

See [frontend/README.md](./frontend/README.md) and [backend/README.md](./backend/README.md) for individual setup guides.

## Features

- JWT Authentication (in-memory token — never localStorage)
- Role-Based Access Control: Admin / Manager / Sales Rep
- Full CRM: Accounts, Contacts, Leads, Opportunities, Activities
- Search, sort, and filter on all list views
- Pipeline board + table views
- Mock Email system with lead-creation notifications
- User Management (Admin)
- Profile page with display name editing
- Docker with persistent SQLite volume

## Monorepo Structure

```
sales-crm/
├── backend/          # Python · FastAPI · SQLAlchemy · SQLite
├── frontend/         # React 18 · TypeScript · Vite · Tailwind
└── specs/            # SDD design artifacts (spec, plan, tasks, data model, contracts)
```

---

## Backend

**Stack**: Python 3.11+ · FastAPI · SQLAlchemy 2.x (async) · Pydantic v2 · Alembic · SQLite

The database target is **SQLite** for development. Migrating to PostgreSQL requires only changing `DATABASE_URL` in `.env` and swapping `aiosqlite` for `asyncpg` in `requirements.txt`.

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # macOS / Linux
.venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env if you need a custom database path (default: ./crm.db)

# 4. Run database migrations
alembic upgrade head

# 5. Start the development server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs (Swagger UI) at `http://localhost:8000/docs`.

### Project Layout

```
backend/
├── app/
│   ├── main.py               # FastAPI app, router registration, error handlers
│   ├── config.py             # Settings via pydantic-settings (.env)
│   ├── database.py           # Async engine, session factory, Base
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── account.py
│   │   ├── contact.py
│   │   ├── lead.py           # includes LeadStatus enum + state machine
│   │   ├── opportunity.py    # includes OpportunityStage enum
│   │   ├── activity.py       # includes ActivityType enum
│   │   └── email_message.py  # mock email inbox (no SMTP)
│   ├── schemas/              # Pydantic v2 request / response schemas
│   │   ├── common.py         # PaginatedResponse[T], ErrorResponse
│   │   ├── account.py
│   │   ├── contact.py
│   │   ├── lead.py
│   │   ├── opportunity.py
│   │   ├── activity.py
│   │   ├── email_message.py  # EmailSend, EmailResponse
│   │   └── seed.py           # SeedResponse, SeedCounts
│   ├── routers/              # FastAPI route handlers (one file per entity)
│   └── services/             # Business logic (one file per entity)
│       ├── seed_service.py   # clear_all + seed_demo
│       └── mock_email_service.py
├── alembic/                  # Database migrations
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_add_email_messages.py
├── tests/
│   └── conftest.py           # pytest fixtures (async client, test DB)
├── alembic.ini
├── requirements.txt
├── requirements-dev.txt
└── .env.example
```

---

## API Reference

All endpoints are prefixed with `/api/v1/`. List endpoints return a paginated envelope:

```json
{ "total": 42, "page": 1, "size": 20, "items": [ ... ] }
```

Query parameters available on all list endpoints: `?page=1&size=20` (max size: 100).

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check — returns `{ "status": "ok" }` |

### Accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/accounts/` | List accounts |
| `POST` | `/api/v1/accounts/` | Create account |
| `GET` | `/api/v1/accounts/{id}` | Get account |
| `PATCH` | `/api/v1/accounts/{id}` | Update account |
| `DELETE` | `/api/v1/accounts/{id}` | Delete account (blocked if contacts or opportunities exist) |

### Contacts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/contacts/` | List contacts · `?account_id=` filter |
| `POST` | `/api/v1/contacts/` | Create contact (email must be unique) |
| `GET` | `/api/v1/contacts/{id}` | Get contact |
| `PATCH` | `/api/v1/contacts/{id}` | Update contact |
| `DELETE` | `/api/v1/contacts/{id}` | Delete contact |

### Leads

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/leads/` | List leads · `?status=new\|contacted\|qualified\|lost` filter |
| `POST` | `/api/v1/leads/` | Create lead (status defaults to `new`) |
| `GET` | `/api/v1/leads/{id}` | Get lead |
| `PATCH` | `/api/v1/leads/{id}` | Update lead (status transitions validated) |
| `DELETE` | `/api/v1/leads/{id}` | Delete lead |
| `POST` | `/api/v1/leads/{id}/convert` | Convert qualified lead → Opportunity + Contact + Account |

**Lead status state machine:**

```
new → contacted → qualified
 │        │           │
 └────────┴───────────┴──→ lost (terminal)
```

### Opportunities

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/opportunities/` | List · `?stage=` `?account_id=` `?contact_id=` filters |
| `POST` | `/api/v1/opportunities/` | Create opportunity (`value` must be > 0 if provided) |
| `GET` | `/api/v1/opportunities/{id}` | Get opportunity |
| `PATCH` | `/api/v1/opportunities/{id}` | Update opportunity |
| `DELETE` | `/api/v1/opportunities/{id}` | Delete opportunity |

**Stages**: `prospecting` · `proposal` · `negotiation` · `closed-won` · `closed-lost`

### Activities

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/activities/` | List · `?type=call\|email\|meeting` `?contact_id=` `?opportunity_id=` |
| `POST` | `/api/v1/activities/` | Log activity (must link to at least one contact or opportunity) |
| `GET` | `/api/v1/activities/{id}` | Get activity |
| `PATCH` | `/api/v1/activities/{id}` | Update activity |
| `DELETE` | `/api/v1/activities/{id}` | Delete activity |

### Seed (Demo Data)

Used to populate the database with realistic demo scenarios for presentations, or to wipe everything for a clean reset. Both endpoints are idempotent and safe to call repeatedly.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/seed/` | **Seed demo data** — clears all existing data, then inserts 6 demo scenarios |
| `DELETE` | `/api/v1/seed/` | **Clear all data** — deletes every row from every table |

**`POST /api/v1/seed/` response (201):**
```json
{
  "message": "Demo data seeded successfully.",
  "seeded": {
    "accounts": 4,
    "contacts": 4,
    "leads": 3,
    "opportunities": 4,
    "activities": 9,
    "emails": 8
  }
}
```

**Demo scenarios seeded:**

| # | Account | Contact | Lead status | Opportunity stage | Value |
|---|---------|---------|-------------|-------------------|-------|
| 1 | TechStart Inc | Tom Wilson (CTO) | qualified → converted | prospecting | $75,000 |
| 2 | HealthCare Pro | Sarah Johnson (VP Ops) | — | proposal | $120,000 |
| 3 | Finance Solutions Ltd | Michael Chen (IT Dir) | — | negotiation | $250,000 |
| 4 | Global Retail Corp | Emma Davis (CIO) | — | closed-won | $500,000 |
| 5 | — | — | James Park — **lost** | — | — |
| 6 | — | — | Lisa Chen — **new** | — | — |

**Demo workflow:**
```bash
# Populate demo data (idempotent — safe to repeat)
curl -X POST http://localhost:8000/api/v1/seed/

# Run the demo...

# Wipe everything after the demo
curl -X DELETE http://localhost:8000/api/v1/seed/

# Populate again for the next session
curl -X POST http://localhost:8000/api/v1/seed/
```

### Mock Email

A local in-process email inbox — no SMTP, no external service. Emails are stored in the database and fully queryable. Use this to test any flow that would normally trigger real email sending.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/mock-email/` | Send (store) a mock email |
| `GET` | `/api/v1/mock-email/` | List inbox · `?to=` filter · `?page=` `?size=` |
| `GET` | `/api/v1/mock-email/{id}` | Get a specific email |
| `DELETE` | `/api/v1/mock-email/` | Clear the entire inbox |

**Send a mock email:**
```json
POST /api/v1/mock-email/
{
  "from_email": "crm@yourdomain.com",
  "to_email": "contact@example.com",
  "subject": "Your proposal is ready",
  "body": "Plain text body",
  "html_body": "<p>HTML body (optional)</p>"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "from_email": "crm@yourdomain.com",
  "to_email": "contact@example.com",
  "subject": "Your proposal is ready",
  "body": "Plain text body",
  "html_body": "<p>HTML body (optional)</p>",
  "sent_at": "2026-06-13T10:00:00",
  "created_at": "2026-06-13T10:00:00"
}
```

**Filter inbox by recipient:**
```bash
GET /api/v1/mock-email/?to=contact@example.com
```

The seed endpoint (`POST /api/v1/seed/`) pre-populates 8 mock emails (2 per contact, all from `crm@demo.local`) so demo scenarios include a populated inbox out of the box.

### Error Responses

All errors return a consistent JSON shape:

```json
{ "detail": "Human-readable message", "code": "ERROR_CODE" }
```

| HTTP | Code | When |
|------|------|------|
| 400 | `INVALID_LEAD_TRANSITION` | Invalid lead status change |
| 400 | `LEAD_NOT_QUALIFIED` | Conversion attempted on non-qualified lead |
| 400 | `LEAD_ALREADY_CONVERTED` | Lead was already converted (body includes existing opportunity ID) |
| 400 | `ACTIVITY_NO_LINK` | Activity has no contact or opportunity linked |
| 404 | `*_NOT_FOUND` | Resource not found |
| 409 | `ACCOUNT_HAS_DEPENDENTS` | Account deletion blocked by contacts / opportunities |
| 409 | `EMAIL_CONFLICT` | Contact email already in use |
| 422 | `VALIDATION_ERROR` | Pydantic schema validation failure (e.g. opportunity value ≤ 0) |

---

## Development

### Running tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

### Database migrations

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Generate a new migration after changing models
alembic revision --autogenerate -m "describe change"
```

### Migrating to PostgreSQL

1. Swap the driver:
   ```bash
   pip install asyncpg
   # remove aiosqlite from requirements.txt
   ```
2. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/crm
   ```
3. Apply migrations:
   ```bash
   alembic upgrade head
   ```

No application code changes are required — the design is database-agnostic.

---

## Design Artifacts

### `specs/001-sales-crm/` — Core CRM

| File | Contents |
|------|----------|
| `spec.md` | Feature specification — entities, user stories, business rules, success criteria |
| `plan.md` | Implementation plan — architecture, tech decisions, project structure |
| `research.md` | Design decision log (D-001 through D-013) |
| `data-model.md` | Full database schema, relationships, ORM conventions |
| `contracts/api-endpoints.md` | Complete API contract with request/response examples |
| `quickstart.md` | End-to-end curl validation scenarios for all 5 user stories |
| `tasks.md` | Dependency-ordered implementation task list (42 tasks) |

### `specs/002-seed-mock-email/` — Seed & Mock Email

| File | Contents |
|------|----------|
| `spec.md` | Feature specification — 5 user stories, demo scenarios, functional requirements |
| `plan.md` | Implementation plan — data model, full API contracts, seed scenario data, 5 implementation phases |

---

## Roadmap

- [ ] Frontend (React / Vue)
- [ ] Authentication & authorization
- [ ] Search and full-text filtering
- [ ] CSV import / export
- [ ] PostgreSQL production deployment
