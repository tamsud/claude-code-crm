# Research: Sales CRM

**Phase**: 0 — Research & Decision Log
**Date**: 2026-06-13
**Feature**: [spec.md](spec.md)

---

## Decision Log

### D-001: Project Type

**Decision**: Backend REST API service (no frontend)
**Rationale**: Spec explicitly states "backend API only" in Assumptions. No UI in scope.
**Alternatives considered**: Full-stack with React/Vue — rejected; out of scope per spec.

---

### D-002: Python Version

**Decision**: Python 3.11+
**Rationale**: FastAPI and SQLAlchemy 2.x both have best support and performance improvements on 3.11+. Pydantic v2 requires 3.8+ but 3.11 adds typed dict improvements and exception groups useful for validation error handling.
**Alternatives considered**: Python 3.10 — compatible but misses `tomllib` stdlib and minor type system improvements.

---

### D-003: FastAPI Version & Router Organization

**Decision**: FastAPI 0.110+ with `APIRouter` per entity, mounted under `/api/v1/` prefix
**Rationale**: Versioned prefix (`/api/v1/`) allows future non-breaking additions. Per-entity routers keep files small and independently testable.
**Alternatives considered**: Single flat router file — rejected due to maintainability concerns with 5 entities × 5 endpoints each = 25+ route handlers.

---

### D-004: SQLAlchemy ORM Style & Async Driver

**Decision**: SQLAlchemy 2.x with declarative `DeclarativeBase`, async engine (`aiosqlite` for SQLite), and `AsyncSession`
**Rationale**: SQLAlchemy 2.x async support with FastAPI's async request handling avoids thread-pool overhead. `aiosqlite` is the async driver for the current SQLite target. When the project migrates to PostgreSQL, only the `DATABASE_URL` and the driver package (`asyncpg`) need to change — all ORM code stays identical because SQLAlchemy abstracts driver differences.
**Alternatives considered**: SQLAlchemy 1.4 sync style — functional but blocks the event loop; not recommended for FastAPI production use.

---

### D-005: Pydantic v2 Schema Strategy

**Decision**: Separate Pydantic models per entity: `Create`, `Update`, `Response` (and `PaginatedResponse` generic)
**Rationale**: `Create` schemas validate required fields on input. `Update` schemas use `Optional` fields with `model_config = ConfigDict(extra='ignore')` to support partial updates (PATCH semantics). `Response` schemas add computed/DB fields (id, timestamps). Keeps contract surfaces explicit.
**Alternatives considered**: Single schema per entity — insufficient; cannot distinguish required vs. optional on create vs. update.

---

### D-006: Primary Key Strategy

**Decision**: UUID v4 (`uuid.uuid4`) as primary keys, generated in Python, stored as `TEXT` in SQLite (transparently handled by SQLAlchemy's `Uuid(native_uuid=False)` mapped type)
**Rationale**: UUIDs are safe to expose in URLs (no sequential enumeration). Generating UUIDs in Python (`default=uuid.uuid4`) works identically on SQLite and PostgreSQL — no reliance on DB-side `gen_random_uuid()` which is PostgreSQL-only. SQLAlchemy's `Uuid` type stores as `CHAR(32)` in SQLite and native `UUID` in PostgreSQL automatically.
**Alternatives considered**: Integer auto-increment — simpler but exposes record counts and ordering; creates enumeration vulnerability. PostgreSQL `gen_random_uuid()` as DB default — PostgreSQL-only, breaks SQLite portability.

---

### D-007: Lead Status State Machine — Implementation Pattern

**Decision**: Enforce transitions in the service layer (not at the DB level) using an explicit transition map
**Rationale**: DB-level CHECK constraints cannot express stateful transition rules (only current valid values). Service layer enforcement allows clear error messages with the exact violation. The allowed transition map is:
```python
VALID_TRANSITIONS = {
    "new":       {"contacted", "lost"},
    "contacted": {"qualified", "lost"},
    "qualified": {"lost"},
    "lost":      set(),  # terminal — no outbound transitions
}
```
**Alternatives considered**: DB triggers — opaque, hard to test, non-portable; rejected.

---

### D-008: Lead Conversion — Atomicity

**Decision**: Single database transaction wrapping account lookup/create, contact lookup/create, and opportunity create
**Rationale**: Spec requires "all-or-nothing atomic operation". SQLAlchemy `AsyncSession` with `async with session.begin()` provides this. On any failure, all changes roll back.
**Alternatives considered**: Saga pattern — overkill for a single-service, same-DB operation.

---

### D-009: Account Deletion Guard — Check Pattern

**Decision**: Explicit pre-delete query: count associated contacts and opportunities before issuing DELETE
**Rationale**: Cleaner error messages than relying on DB foreign key constraint violations (which produce cryptic IntegrityErrors). The service checks, builds a human-readable error, and returns 409 Conflict.
**Alternatives considered**: DB-level ON DELETE RESTRICT — valid but the IntegrityError message is not user-friendly; rejected for UX reasons.

---

### D-010: Pagination Pattern

**Decision**: Offset-based pagination with `page` (1-indexed) and `size` (default 20, max 100) query parameters; response includes `total`, `page`, `size`, `items`
**Rationale**: Offset pagination is simple to implement and sufficient for the 10,000-record scale specified in SC-007. Cursor-based pagination is more performant at scale but adds significant complexity unnecessary for v1.
**Alternatives considered**: Cursor-based — better at large scale but out of scope for v1 requirements.

---

### D-011: Testing Strategy

**Decision**: `pytest` + `pytest-asyncio` + `httpx.AsyncClient` for integration tests against a real test PostgreSQL database; no mocking of DB layer
**Rationale**: Integration tests against a real database catch ORM mapping errors, constraint violations, and transaction behavior that mocks cannot replicate. SC-002 through SC-004 require verifying rejection behavior which depends on real constraint enforcement.
**Alternatives considered**: Mock DB / in-memory SQLite — rejected; SQLite does not support PostgreSQL ENUM types or UUID natively and would produce false positives.

---

### D-012: Error Response Format

**Decision**: Consistent JSON error envelope: `{"detail": "Human-readable message", "code": "ERROR_CODE"}`
**Rationale**: FastAPI's default `{"detail": ...}` is extended with a `code` field for programmatic error handling by API consumers. HTTP status codes follow REST conventions: 400 (validation), 404 (not found), 409 (conflict), 422 (Pydantic validation failure).
**Alternatives considered**: RFC 7807 Problem Details — more standards-compliant but heavier; deferred to v2.

---

### D-013: Database Target — SQLite (Current) → PostgreSQL (Future)

**Decision**: SQLite with `aiosqlite` driver for current development; design stays database-agnostic for future PostgreSQL migration
**Rationale**: SQLite requires zero infrastructure setup (no server process, no Docker container). For a v1 single-tenant service, SQLite's write concurrency limitations are not a concern. SQLAlchemy abstracts almost all differences: ENUM columns render as `VARCHAR` in SQLite and native `ENUM` in PostgreSQL; UUID renders as `CHAR(32)` vs native `UUID`. The only migration step needed later is changing `DATABASE_URL` and swapping `aiosqlite` for `asyncpg`.
**SQLite-specific requirements**: Foreign key enforcement must be enabled explicitly via `PRAGMA foreign_keys = ON` on each connection (SQLite disables FKs by default). This is wired via a SQLAlchemy `@event.listens_for(engine, "connect")` handler in `app/database.py`.
**Alternatives considered**: PostgreSQL from day one — valid but requires a running server, complicating onboarding for contributors.

---

## Resolved Clarifications

- Database target changed from PostgreSQL to SQLite (development) during `/speckit-clarify` session 2026-06-13. Design kept portable for future PostgreSQL migration via config change only.
- Lead email uniqueness: NOT enforced (duplicate leads from same email allowed).
- Double lead conversion: Rejected with 400 error; existing `converted_opportunity_id` returned in error body.
