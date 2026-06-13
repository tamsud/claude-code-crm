# Data Model: Sales CRM

**Phase**: 1 — Design
**Date**: 2026-06-13
**Feature**: [spec.md](spec.md) | [research.md](research.md)

---

## Entity Relationship Overview

```
Account ──────────┬──── 1:N ────> Contact
                  │                   │
                  └──── 1:N ────> Opportunity ──── N:1 ──> Contact (optional)
                                      │
Lead ──── (converts to) ──────────────┘
           (creates/reuses Account & Contact)

Activity ──── N:1 ──> Contact      (nullable, at least one required)
         └─── N:1 ──> Opportunity  (nullable, at least one required)
```

---

## Tables

### `accounts`

| Column       | Type                      | Constraints                      | Notes                    |
|--------------|---------------------------|----------------------------------|--------------------------|
| `id`         | `UUID`                    | PRIMARY KEY, default `gen_random_uuid()` | —              |
| `name`       | `VARCHAR(255)`            | NOT NULL                         | Company/org name         |
| `industry`   | `VARCHAR(100)`            | NULLABLE                         | e.g., "SaaS", "Finance"  |
| `website`    | `VARCHAR(255)`            | NULLABLE                         | Full URL                 |
| `phone`      | `VARCHAR(50)`             | NULLABLE                         | Any format               |
| `address`    | `TEXT`                    | NULLABLE                         | Free-text address        |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`       | —                        |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`       | Updated via ORM event    |

**Indexes**: PRIMARY KEY on `id`; optional index on `lower(name)` for lead conversion lookup.

**Deletion rule**: BLOCKED if any `contacts.account_id` or `opportunities.account_id` references this row (enforced at service layer, returns HTTP 409).

---

### `contacts`

| Column       | Type                      | Constraints                             | Notes                  |
|--------------|---------------------------|-----------------------------------------|------------------------|
| `id`         | `UUID`                    | PRIMARY KEY, default `gen_random_uuid()` | —                     |
| `first_name` | `VARCHAR(100)`            | NOT NULL                                | —                      |
| `last_name`  | `VARCHAR(100)`            | NOT NULL                                | —                      |
| `email`      | `VARCHAR(255)`            | NOT NULL, UNIQUE                        | System-wide uniqueness |
| `phone`      | `VARCHAR(50)`             | NULLABLE                                | —                      |
| `job_title`  | `VARCHAR(100)`            | NULLABLE                                | —                      |
| `account_id` | `UUID`                    | NULLABLE, FK → `accounts.id` ON DELETE SET NULL | Contact survives account deletion |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`              | —                      |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`              | —                      |

**Indexes**: UNIQUE on `email`; INDEX on `account_id` (for filter queries).

---

### `leads`

| Column                    | Type                      | Constraints                             | Notes                            |
|---------------------------|---------------------------|-----------------------------------------|----------------------------------|
| `id`                      | `UUID`                    | PRIMARY KEY, default `gen_random_uuid()` | —                               |
| `first_name`              | `VARCHAR(100)`            | NOT NULL                                | —                                |
| `last_name`               | `VARCHAR(100)`            | NOT NULL                                | —                                |
| `email`                   | `VARCHAR(255)`            | NOT NULL                                | Not globally unique (a lead may share email with a contact) |
| `phone`                   | `VARCHAR(50)`             | NULLABLE                                | —                                |
| `company`                 | `VARCHAR(255)`            | NULLABLE                                | Used for account lookup on convert |
| `status`                  | `lead_status` (ENUM)      | NOT NULL, default `'new'`               | See state machine below          |
| `source`                  | `VARCHAR(100)`            | NULLABLE                                | e.g., "website", "referral"      |
| `notes`                   | `TEXT`                    | NULLABLE                                | —                                |
| `converted_opportunity_id`| `UUID`                    | NULLABLE, FK → `opportunities.id`       | Set on successful conversion     |
| `created_at`              | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`              | —                                |
| `updated_at`              | `TIMESTAMP WITH TIME ZONE` | NOT NULL, default `now()`              | —                                |

**ENUM type**: `lead_status` = `('new', 'contacted', 'qualified', 'lost')`

**Indexes**: INDEX on `status` (for filter queries).

**State machine** (enforced at service layer):

```
        ┌──────────────────────────┐
        ▼                          │
[new] ──► [contacted] ──► [qualified] ──► [lost] (terminal)
  └─────────────────────────────────────────────►
```

| From        | Allowed `to` values    |
|-------------|------------------------|
| `new`       | `contacted`, `lost`    |
| `contacted` | `qualified`, `lost`    |
| `qualified` | `lost`                 |
| `lost`      | *(none — terminal)*    |

---

### `opportunities`

| Column                | Type                        | Constraints                             | Notes                           |
|-----------------------|-----------------------------|-----------------------------------------|---------------------------------|
| `id`                  | `UUID`                      | PRIMARY KEY, default `gen_random_uuid()` | —                              |
| `title`               | `VARCHAR(255)`              | NOT NULL                                | —                               |
| `account_id`          | `UUID`                      | NOT NULL, FK → `accounts.id`            | Required; account owns the deal |
| `contact_id`          | `UUID`                      | NULLABLE, FK → `contacts.id` ON DELETE SET NULL | Optional deal contact  |
| `stage`               | `opportunity_stage` (ENUM)  | NOT NULL, default `'prospecting'`       | See values below                |
| `value`               | `NUMERIC(15, 2)`            | NULLABLE, CHECK (`value > 0`)           | USD; null = unquoted deal       |
| `probability`         | `SMALLINT`                  | NULLABLE, CHECK (`0 <= probability <= 100`) | Percentage                  |
| `expected_close_date` | `DATE`                      | NULLABLE                                | Past dates allowed (legacy data)|
| `created_at`          | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`              | —                               |
| `updated_at`          | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`              | —                               |

**ENUM type**: `opportunity_stage` = `('prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost')`

**Indexes**: INDEX on `account_id`; INDEX on `contact_id`; INDEX on `stage`.

**Stage transitions**: Non-linear — any stage may transition to any other stage (service layer applies no gate). Default on create is `prospecting`.

---

### `activities`

| Column           | Type                        | Constraints                                                     | Notes                         |
|------------------|-----------------------------|-----------------------------------------------------------------|-------------------------------|
| `id`             | `UUID`                      | PRIMARY KEY, default `gen_random_uuid()`                       | —                             |
| `type`           | `activity_type` (ENUM)      | NOT NULL                                                        | See values below              |
| `subject`        | `VARCHAR(255)`              | NOT NULL                                                        | —                             |
| `notes`          | `TEXT`                      | NULLABLE                                                        | —                             |
| `activity_date`  | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`                                       | Defaults to creation time     |
| `contact_id`     | `UUID`                      | NULLABLE, FK → `contacts.id` ON DELETE SET NULL                 | —                             |
| `opportunity_id` | `UUID`                      | NULLABLE, FK → `opportunities.id` ON DELETE SET NULL            | —                             |
| `created_at`     | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`                                       | —                             |
| `updated_at`     | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`                                       | —                             |

**ENUM type**: `activity_type` = `('call', 'email', 'meeting')`

**Table constraint**: `CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL)` — enforced at DB level as a safety net; primary enforcement is Pydantic validator in service layer with a friendly error message.

**Indexes**: INDEX on `contact_id`; INDEX on `opportunity_id`; INDEX on `type`.

---

## SQLAlchemy ORM Model Conventions

- All models inherit from a shared `Base = DeclarativeBase()`
- `updated_at` uses SQLAlchemy's `onupdate=func.now()` server-side default
- ENUM columns use `sqlalchemy.Enum(PythonEnum)` to keep Python and DB in sync
- Foreign keys use `ForeignKey("table.id", ondelete="SET NULL")` or `"RESTRICT"` per entity rules
- Relationships use `relationship(..., lazy="selectin")` for async-safe eager loading on single-record fetches; list endpoints use explicit joins to avoid N+1

## SQLite Compatibility Notes

The current database target is **SQLite**. SQLAlchemy abstracts the differences transparently, but the following specifics apply:

| Feature | PostgreSQL | SQLite (current) | How handled |
|---------|-----------|-----------------|-------------|
| ENUM types | Native `CREATE TYPE` | `VARCHAR` + Python validation | `sqlalchemy.Enum(PythonEnum)` renders correctly for both |
| UUID columns | Native `UUID` type | `CHAR(32)` text | `sqlalchemy.Uuid(native_uuid=False)` — transparent |
| UUID generation | `gen_random_uuid()` DB function | Not available | Use `default=uuid.uuid4` in Python model definition |
| Timestamps | `TIMESTAMPTZ` | `DATETIME` (no TZ) | Store UTC; SQLAlchemy maps both |
| Foreign key enforcement | Always on | Off by default | Enable via `PRAGMA foreign_keys = ON` per connection in `app/database.py` |
| `NUMERIC(15,2)` | Native | `REAL` / stored as float | Sufficient for v1; use `Decimal` in Python for precision |
| Concurrent writes | Full | Single-writer lock | Acceptable for single-tenant v1 |

**Migration path to PostgreSQL**: Change `DATABASE_URL` to `postgresql+asyncpg://...`, swap `aiosqlite` for `asyncpg` in requirements, run `alembic upgrade head` against PostgreSQL. No ORM model or service code changes required.

---

## Pydantic v2 Schema Pattern (per entity)

```
{Entity}Create   — required fields only; used for POST body validation
{Entity}Update   — all fields Optional; used for PATCH body validation  
{Entity}Response — all fields including id, created_at, updated_at; used for response serialization
PaginatedResponse[{Entity}Response] — generic wrapper: { total, page, size, items }
```

---

## Lead Conversion — Atomic Operation Detail

```
POST /api/v1/leads/{id}/convert

Transaction steps (all-or-nothing):
1. Load lead; assert status == 'qualified' else raise 400
2. ACCOUNT: SELECT accounts WHERE lower(name) == lower(lead.company) LIMIT 1
   → if not found: INSERT accounts(name=lead.company)
3. CONTACT: SELECT contacts WHERE email == lead.email LIMIT 1
   → if not found: INSERT contacts(first_name, last_name, email, phone, account_id)
4. INSERT opportunities(title="{lead.first_name} {lead.last_name} - Opportunity",
                        account_id=<account.id>,
                        contact_id=<contact.id>,
                        stage='prospecting')
5. UPDATE leads SET converted_opportunity_id = <opportunity.id>
6. COMMIT

Response: OpportunityResponse (the created opportunity)
```
