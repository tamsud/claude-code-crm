# Tasks: Sales CRM

**Input**: Design documents from `specs/001-sales-crm/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api-endpoints.md ✅

**Tests**: Not requested — test tasks excluded per task generation rules.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project skeleton and install dependencies so all subsequent phases have a runnable environment.

- [x] T001 Create full project directory structure: `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`, `alembic/versions/`, `tests/` with `__init__.py` in each Python package directory
- [x] T002 Create `requirements.txt` with pinned versions: `fastapi>=0.110`, `sqlalchemy>=2.0`, `aiosqlite`, `pydantic>=2.0`, `pydantic-settings`, `alembic`, `uvicorn[standard]`; add comment `# swap aiosqlite for asyncpg when migrating to PostgreSQL`
- [x] T003 [P] Create `requirements-dev.txt` extending requirements.txt with: `pytest`, `pytest-asyncio`, `httpx`, `greenlet` (for asyncio test support)
- [x] T004 [P] Create `.env.example` with `DATABASE_URL=sqlite+aiosqlite:///./crm.db` and `TEST_DATABASE_URL=sqlite+aiosqlite:///./crm_test.db`; add commented-out PostgreSQL equivalents for future reference
- [x] T005 [P] Create `app/config.py` using `pydantic_settings.BaseSettings`: expose `database_url: str`, `page_size_default: int = 20`, `page_size_max: int = 100`; load from `.env` file automatically

**Checkpoint**: `pip install -r requirements.txt` succeeds; project directories exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — async DB engine, shared Pydantic types, FastAPI app factory, and the complete Alembic initial migration. **No user story work can begin until this phase is complete.**

- [x] T006 Create `app/database.py`: async SQLAlchemy engine using `DATABASE_URL` from config; add `@event.listens_for(engine.sync_engine, "connect")` handler that runs `PRAGMA foreign_keys=ON` for SQLite FK enforcement; `AsyncSessionLocal` factory (`async_sessionmaker`), `Base = DeclarativeBase()`, and `get_db()` async dependency that yields a session and closes it
- [x] T007 [P] Create `app/schemas/common.py`: define `PaginatedResponse[T]` generic model with fields `total: int`, `page: int`, `size: int`, `items: list[T]`; define `ErrorResponse` with `detail: str` and `code: str`
- [x] T008 Create `app/main.py`: FastAPI app factory with `title="Sales CRM API"`, `version="1.0.0"`; add `GET /health` returning `{"status": "ok"}`; include empty router placeholders (routers will be registered in later phases); configure global 404 and validation exception handlers to return `ErrorResponse` shape
- [x] T009 Initialize Alembic: create `alembic.ini` at repo root; create `alembic/env.py` importing `Base` from `app.database` and `DATABASE_URL` from `app.config`; configure `target_metadata = Base.metadata` for migration tracking
- [x] T010 Create `alembic/versions/001_initial_schema.py`: define `upgrade()` creating all 5 tables and 3 ENUM types in this exact order to satisfy FK dependencies:
  1. Define Python Enum classes (used by SQLAlchemy `Enum()` — stored as VARCHAR in SQLite, native ENUM in PostgreSQL): `LeadStatus('new','contacted','qualified','lost')`, `OpportunityStage('prospecting','proposal','negotiation','closed-won','closed-lost')`, `ActivityType('call','email','meeting')`
  2. Table `accounts`: id as `sqlalchemy.Uuid(native_uuid=False)` PK with `default=uuid.uuid4`, `name VARCHAR(255) NOT NULL`, `industry VARCHAR(100)`, `website VARCHAR(255)`, `phone VARCHAR(50)`, `address TEXT`, `created_at DATETIME NOT NULL DEFAULT (datetime('now'))`, `updated_at DATETIME NOT NULL DEFAULT (datetime('now'))`
  3. Table `contacts`: same UUID pattern for id; `email VARCHAR(255) NOT NULL UNIQUE`; `account_id` FK→accounts.id ON DELETE SET NULL; all timestamp columns as DATETIME
  4. Table `leads`: same UUID pattern; `status VARCHAR(20) NOT NULL DEFAULT 'new'` (SQLAlchemy `Enum(LeadStatus)` renders as VARCHAR in SQLite); `converted_opportunity_id` FK→opportunities.id nullable; no UNIQUE constraint on email (duplicate lead emails permitted per FR-009)
  5. Table `opportunities`: same UUID pattern; `stage VARCHAR(20) NOT NULL DEFAULT 'prospecting'`; `value REAL CHECK (value > 0)`; `probability INTEGER CHECK (probability >= 0 AND probability <= 100)`; `expected_close_date DATE`
  6. Table `activities`: same UUID pattern; `type VARCHAR(10) NOT NULL`; CONSTRAINT `check_has_link CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL)`
  7. Define `downgrade()` that drops all tables in reverse order (no DROP TYPE needed for SQLite)
  - **Note**: UUID defaults use Python `default=uuid.uuid4` (not `gen_random_uuid()` which is PostgreSQL-only). Alembic renders this correctly for both SQLite and PostgreSQL.

**Checkpoint**: `alembic upgrade head` succeeds with SQLite (`crm.db` file created); `GET /health` returns 200.

---

## Phase 3: User Story 1 — Contact & Account Management (Priority: P1) 🎯 MVP

**Goal**: Sales reps can create accounts and contacts, link contacts to accounts, retrieve/update/delete them, and be blocked from deleting accounts that have dependents.

**Independent Test**: Create an account → create a contact linked to it → retrieve both → update contact phone → attempt to delete account (should fail) → delete contact → delete account (should succeed). All via API calls.

### Implementation for User Story 1

- [x] T011 [P] [US1] Create `app/models/account.py`: `Account` class extending `Base` mapped to `accounts` table; all columns per data-model.md; `updated_at` using `onupdate=func.now()`; `relationship("Contact", back_populates="account", lazy="selectin")` and `relationship("Opportunity", back_populates="account", lazy="selectin")`
- [x] T012 [P] [US1] Create `app/models/contact.py`: `Contact` class mapped to `contacts` table; all columns per data-model.md; `account_id` FK with `ondelete="SET NULL"`; `relationship("Account", back_populates="contacts", lazy="selectin")`
- [x] T013 [P] [US1] Create `app/schemas/account.py`: `AccountCreate(BaseModel)` with `name: str` (required) and optional fields; `AccountUpdate(BaseModel)` with all fields `Optional`; `AccountResponse(AccountCreate)` adding `id: UUID`, `created_at: datetime`, `updated_at: datetime`; configure `model_config = ConfigDict(from_attributes=True)`
- [x] T014 [P] [US1] Create `app/schemas/contact.py`: `ContactCreate` with `first_name: str`, `last_name: str`, `email: EmailStr` (required) and optional fields including `account_id: UUID | None`; `ContactUpdate` with all fields `Optional[...]`; `ContactResponse` adding `id`, timestamps; `model_config = ConfigDict(from_attributes=True)`
- [x] T015 [US1] Implement `app/services/account_service.py` with async functions: `create_account(db, data)`, `get_account(db, id)` raising 404 if missing, `list_accounts(db, page, size)` returning `PaginatedResponse`, `update_account(db, id, data)`, `delete_account(db, id)` — pre-delete check: count contacts + opportunities linked to account; if >0 raise `HTTPException(409, detail="Cannot delete account: has X contact(s) and Y opportunity(ies)", headers={"X-Error-Code": "ACCOUNT_HAS_DEPENDENTS"})`
- [x] T016 [US1] Implement `app/services/contact_service.py` with async functions: `create_contact(db, data)` checking email uniqueness (raise 409 with code `EMAIL_CONFLICT` if duplicate), `get_contact(db, id)`, `list_contacts(db, page, size, account_id=None)`, `update_contact(db, id, data)` re-checking email uniqueness on change, `delete_contact(db, id)`
- [x] T017 [US1] Implement `app/routers/accounts.py`: `APIRouter(prefix="/api/v1/accounts", tags=["accounts"])`; wire 5 endpoints: `GET /` → `list_accounts`, `POST /` (status 201) → `create_account`, `GET /{id}` → `get_account`, `PATCH /{id}` → `update_account`, `DELETE /{id}` (status 204) → `delete_account`; inject `AsyncSession` via `Depends(get_db)`
- [x] T018 [US1] Implement `app/routers/contacts.py`: same pattern as accounts router; `GET /` accepts optional `?account_id=` query param passed to service; `POST /` returns 201; `DELETE /` returns 204
- [x] T019 [US1] Register account and contact routers in `app/main.py`: `app.include_router(accounts_router)` and `app.include_router(contacts_router)`; import models in `app/models/__init__.py` so Alembic can detect them

**Checkpoint**: All 10 Account + Contact endpoints respond correctly; deletion guard returns 409 when dependents exist; Contact email uniqueness enforced.

---

## Phase 4: User Story 2 — Lead Capture & Status Progression (Priority: P2)

**Goal**: Sales reps can create leads (auto-status "new"), update them through valid status transitions, be blocked from invalid transitions, and list/filter leads by status.

**Independent Test**: Create lead → verify status="new" → transition new→contacted (200) → attempt contacted→new (400 with INVALID_LEAD_TRANSITION) → transition contacted→qualified (200) → transition qualified→lost (200) → attempt any transition from lost (400).

### Implementation for User Story 2

- [x] T020 [US2] Create `app/models/lead.py`: `LeadStatus(str, Enum)` with values `new`, `contacted`, `qualified`, `lost`; `Lead` class mapped to `leads` table; all columns per data-model.md; `status` column uses `sqlalchemy.Enum(LeadStatus)` with `server_default="new"`; `converted_opportunity_id` FK to `opportunities.id` nullable
- [x] T021 [US2] Create `app/schemas/lead.py`: `LeadCreate` with required `first_name`, `last_name`, `email` and optional fields (no `status` field — always defaults to "new"); `LeadUpdate` with all fields `Optional` including `status: LeadStatus | None`; `LeadResponse` with all fields including `status`, `converted_opportunity_id`, timestamps; `model_config = ConfigDict(from_attributes=True)`
- [x] T022 [US2] Implement `app/services/lead_service.py`: define `VALID_TRANSITIONS: dict[LeadStatus, set[LeadStatus]]` = `{new: {contacted, lost}, contacted: {qualified, lost}, qualified: {lost}, lost: set()}`; implement `create_lead(db, data)`, `get_lead(db, id)`, `list_leads(db, page, size, status=None)`, `update_lead(db, id, data)` — when `data.status` is set and differs from current: validate via `VALID_TRANSITIONS`, raise `HTTPException(400, detail="Invalid status transition: '{from}' → '{to}'...", headers={"X-Error-Code": "INVALID_LEAD_TRANSITION"})` if invalid; `delete_lead(db, id)`
- [x] T023 [US2] Implement `app/routers/leads.py`: `APIRouter(prefix="/api/v1/leads", tags=["leads"])`; wire 5 CRUD endpoints; `GET /` accepts optional `?status=` query param; placeholder comment for conversion endpoint (added in Phase 5)
- [x] T024 [US2] Register lead router in `app/main.py`: `app.include_router(leads_router)`; add `Lead` import to `app/models/__init__.py`

**Checkpoint**: All 5 Lead CRUD endpoints work; state machine rejects invalid transitions with 400 and INVALID_LEAD_TRANSITION code; new leads always start with status "new".

---

## Phase 5: User Story 3 — Lead-to-Opportunity Conversion (Priority: P3)

**Goal**: A qualified lead can be converted in a single atomic POST request that creates an Opportunity and reuses or creates the linked Account and Contact. Non-qualified leads are rejected.

**Independent Test**: Create lead → qualify it (two transitions) → POST /leads/{id}/convert → verify 201 OpportunityResponse with account_id and contact_id set → verify Account "company name" exists → verify Contact with lead's email exists → attempt convert on non-qualified lead → verify 400 with LEAD_NOT_QUALIFIED.

### Implementation for User Story 3

- [x] T025 [P] [US3] Create `app/models/opportunity.py`: `OpportunityStage(str, Enum)` with values `prospecting`, `proposal`, `negotiation`, `closed-won`, `closed-lost`; `Opportunity` class mapped to `opportunities` table; all columns per data-model.md; `account_id` FK NOT NULL `ondelete="RESTRICT"`; `contact_id` FK nullable `ondelete="SET NULL"`; relationships back to `Account` and `Contact`
- [x] T026 [P] [US3] Create `app/schemas/opportunity.py`: `OpportunityCreate` with required `title: str`, `account_id: UUID`, optional fields including `value: Annotated[Decimal, Field(gt=0)] | None` (Pydantic validator enforcing strictly positive); `OpportunityUpdate` with all fields `Optional` and same `value` validator; `OpportunityResponse` with all fields + `id`, timestamps; `model_config = ConfigDict(from_attributes=True)`
- [x] T027 [US3] Add `convert_lead(db, lead_id)` function to `app/services/lead_service.py`: within a single `async with session.begin()` transaction: (1) load lead, assert `status == "qualified"` else raise 400 LEAD_NOT_QUALIFIED; (2) find or create Account by case-insensitive `lead.company` match using `SELECT ... WHERE lower(name) = lower(:company) LIMIT 1`; (3) find or create Contact by `lead.email` match; (4) INSERT new Opportunity with `title=f"{lead.first_name} {lead.last_name} - Opportunity"`, `account_id`, `contact_id`, `stage="prospecting"`; (5) UPDATE lead `converted_opportunity_id = opportunity.id`; (6) return OpportunityResponse
- [x] T028 [US3] Add `POST /{id}/convert` endpoint to `app/routers/leads.py`: calls `convert_lead(db, lead_id)`, returns `OpportunityResponse` with status 201; add `Opportunity` and `OpportunityResponse` imports; add `Opportunity` import to `app/models/__init__.py`

**Checkpoint**: `POST /api/v1/leads/{id}/convert` on a qualified lead returns 201 with a full OpportunityResponse; Account and Contact are created or reused correctly; non-qualified lead returns 400.

---

## Phase 6: User Story 4 — Opportunity Pipeline Management (Priority: P4)

**Goal**: Sales reps can create, list (with filters by stage/account/contact), update, and delete Opportunities. Value must be > 0 when provided. Stage is freely updatable to any of the 5 defined stages.

**Independent Test**: Create opportunity with value=$5000 → retrieve it → filter by stage → update stage to "closed-won" → attempt to update value to $0 (422) → attempt value=-50 (422) → delete opportunity.

### Implementation for User Story 4

- [x] T029 [US4] Implement `app/services/opportunity_service.py`: `create_opportunity(db, data)` — verify `account_id` exists (404 if not), verify `contact_id` exists if provided (404 if not), insert and return; `get_opportunity(db, id)`, `list_opportunities(db, page, size, stage=None, account_id=None, contact_id=None)` returning `PaginatedResponse`; `update_opportunity(db, id, data)` — value validation is handled by Pydantic schema (no extra service logic needed); `delete_opportunity(db, id)`
- [x] T030 [US4] Implement `app/routers/opportunities.py`: `APIRouter(prefix="/api/v1/opportunities", tags=["opportunities"])`; `GET /` accepts optional `?stage=`, `?account_id=`, `?contact_id=` query params; `POST /` returns 201; `PATCH /{id}` updates partial fields; `DELETE /{id}` returns 204
- [x] T031 [US4] Register opportunity router in `app/main.py`: `app.include_router(opportunities_router)`

**Checkpoint**: All 5 Opportunity endpoints work; value=0 and value<0 return 422; stage filter returns only matching records; non-existent account_id on create returns 404.

---

## Phase 7: User Story 5 — Activity Logging (Priority: P5)

**Goal**: Sales reps can log activities (call/email/meeting) linked to a Contact and/or Opportunity. An activity with no linked entity is rejected. Activities can be listed, filtered, updated, and deleted.

**Independent Test**: Log call linked to contact → log meeting linked to opportunity → log email linked to both contact AND opportunity → attempt log with no link (400 ACTIVITY_NO_LINK) → filter by type="call" → filter by contact_id → delete activity.

### Implementation for User Story 5

- [x] T032 [P] [US5] Create `app/models/activity.py`: `ActivityType(str, Enum)` with values `call`, `email`, `meeting`; `Activity` class mapped to `activities` table; all columns per data-model.md; both FKs nullable with `ondelete="SET NULL"`; relationships to `Contact` and `Opportunity`
- [x] T033 [P] [US5] Create `app/schemas/activity.py`: `ActivityCreate` with required `type: ActivityType`, `subject: str`, optional `notes`, `activity_date`, `contact_id: UUID | None`, `opportunity_id: UUID | None`; add Pydantic `model_validator(mode="after")` that raises `ValueError("Activity must be linked to at least one Contact or Opportunity.")` if both `contact_id` and `opportunity_id` are `None`; `ActivityUpdate` with all fields `Optional` and same validator; `ActivityResponse` with all fields + `id`, timestamps
- [x] T034 [US5] Implement `app/services/activity_service.py`: `create_activity(db, data)` — Pydantic schema already validates linked-entity constraint; verify `contact_id` exists in DB if provided (404); verify `opportunity_id` exists in DB if provided (404); insert and return; `get_activity(db, id)`, `list_activities(db, page, size, type=None, contact_id=None, opportunity_id=None)`, `update_activity(db, id, data)` — re-validate that at least one link remains after partial update, `delete_activity(db, id)`
- [x] T035 [US5] Implement `app/routers/activities.py`: `APIRouter(prefix="/api/v1/activities", tags=["activities"])`; `GET /` accepts optional `?type=`, `?contact_id=`, `?opportunity_id=` query params; wire all 5 endpoints; wire 400 handler that catches the Pydantic linked-entity ValueError and returns `{"detail": "...", "code": "ACTIVITY_NO_LINK"}`
- [x] T036 [US5] Register activity router in `app/main.py`: `app.include_router(activities_router)`; add `Activity` import to `app/models/__init__.py`

**Checkpoint**: All 5 Activity endpoints work; POST without contact_id and opportunity_id returns 400 with ACTIVITY_NO_LINK; dual-linked activity (both contact and opportunity) is accepted; type filter returns only matching records.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final wiring, validation, and developer-experience improvements across all user stories.

- [x] T037 Audit `app/main.py`: confirm all 5 routers (accounts, contacts, leads, opportunities, activities) are registered; confirm `/health` endpoint still works; confirm OpenAPI docs load at `/docs` with all 26 endpoints listed
- [x] T038 [P] Create `tests/conftest.py`: async pytest fixtures — `engine` (test DB engine), `db_session` (fresh transaction per test with rollback), `client` (`httpx.AsyncClient` wrapping the FastAPI app), and factory helpers `make_account()`, `make_contact()`, `make_lead()`, `make_opportunity()`, `make_activity()` for use when tests are written
- [x] T039 [P] Create `alembic/versions/001_initial_schema.py` `downgrade()` smoke-test: verify `alembic downgrade base` then `alembic upgrade head` completes without errors (manual verification step)
- [x] T040 [P] Add `Decimal` precision handling: ensure all `NUMERIC(15,2)` opportunity values serialized through `OpportunityResponse` are returned as JSON numbers with 2 decimal places; add `json_encoders = {Decimal: float}` to model config or use `model_serializer`
- [x] T041 Review error responses: ensure all 5 routers consistently return `{"detail": "...", "code": "..."}` shape for 400 and 409 errors (not FastAPI default shape); spot-check against contracts/api-endpoints.md error examples
- [x] T042 Run `quickstart.md` validation: execute curl sequences for all 5 user stories against a running local server; confirm all SC-001 through SC-008 pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)          → No dependencies
Phase 2 (Foundational)   → Requires Phase 1 ⚠️ BLOCKS all user stories
Phase 3 (US1 P1)         → Requires Phase 2
Phase 4 (US2 P2)         → Requires Phase 2 (independent of Phase 3)
Phase 5 (US3 P3)         → Requires Phase 3 + Phase 4 (conversion needs accounts, contacts, leads)
Phase 6 (US4 P4)         → Requires Phase 5 (Opportunity model created in Phase 5)
Phase 7 (US5 P5)         → Requires Phase 3 + Phase 6 (activities link to contacts and opportunities)
Phase 8 (Polish)         → Requires all prior phases
```

### User Story Dependencies

| Story | Priority | Depends On | Can Parallelize With |
|-------|----------|------------|----------------------|
| US1 (Account+Contact) | P1 | Phase 2 only | US2 |
| US2 (Lead CRUD) | P2 | Phase 2 only | US1 |
| US3 (Conversion) | P3 | US1 + US2 + US4 model | — |
| US4 (Opportunity CRUD) | P4 | US3 model (T025/T026) | — |
| US5 (Activities) | P5 | US1 + US4 | — |

> **Note on US3 vs priority**: US3 is P3 in the spec but is implemented after US4's data model because the conversion creates an Opportunity record. The Opportunity ORM model (T025/T026) is introduced in Phase 5 (US3's phase) as a prerequisite to both conversion AND full CRUD. US4's service/router (Phase 6) builds on top of the model established in Phase 5.

### Within Each Phase

- Tasks marked `[P]` within a phase can start simultaneously
- Models → Schemas → Services → Routers (strict order within each story)
- Register router in `app/main.py` last (after router file is complete)

---

## Parallel Execution Examples

### Phase 3 (US1): Accounts & Contacts

```
Can start simultaneously:
  T011 → app/models/account.py
  T012 → app/models/contact.py
  T013 → app/schemas/account.py
  T014 → app/schemas/contact.py

Then sequentially (models and schemas must exist):
  T015 → app/services/account_service.py
  T016 → app/services/contact_service.py  (can parallel with T015)
  T017 → app/routers/accounts.py
  T018 → app/routers/contacts.py          (can parallel with T017)
  T019 → app/main.py (register both)
```

### Phase 5 (US3): Conversion prerequisites

```
Can start simultaneously:
  T025 → app/models/opportunity.py
  T026 → app/schemas/opportunity.py

Then sequentially:
  T027 → app/services/lead_service.py (add convert_lead)
  T028 → app/routers/leads.py (add /convert endpoint)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (run `alembic upgrade head`)
3. Complete Phase 3: US1 — Account + Contact CRUD
4. **STOP and VALIDATE**: Run quickstart.md US-1 scenarios
5. Demo: working account + contact address book via API

### Incremental Delivery

```
After Phase 2: Database ready, /health works
After Phase 3: Account + Contact CRUD (MVP — full address book)
After Phase 4: Lead capture + status state machine
After Phase 5: Lead conversion → Opportunity creation
After Phase 6: Full Opportunity pipeline management
After Phase 7: Activity logging
After Phase 8: All 8 Success Criteria verified
```

### Parallel Team Strategy (2 developers)

```
Phase 1 + 2: Both work together (foundation)
Phase 3 + 4: Developer A → US1, Developer B → US2 (independent!)
Phase 5: Both collaborate (conversion bridges US1+US2+US4)
Phase 6 + 7: Developer A → US4, Developer B → US5 (independent!)
Phase 8: Both verify together
```

---

## Notes

- `[P]` tasks operate on different files — no write conflicts
- `[USn]` label maps each task to its spec user story for traceability
- Each phase ends with a named **Checkpoint** — stop and validate before proceeding
- The Alembic migration (T010) creates ALL 5 tables upfront; ORM model classes are created incrementally per phase
- No test tasks generated (not requested); `tests/conftest.py` (T038) is scaffolded for future use
- Pydantic v2 value validation for `opportunity.value > 0` is handled at the schema layer (T026) — no service-layer duplication needed
- Activity linked-entity enforcement uses Pydantic `model_validator` (T033) as primary check; DB CHECK constraint (from T010) is the safety net
