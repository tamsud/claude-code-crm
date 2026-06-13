# Implementation Plan: CRM Platform Enhancement Suite

**Branch**: `005-crm-platform-enhancements` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-crm-platform-enhancements/spec.md`

---

## Summary

Extend the existing Sales CRM (React 18 frontend + FastAPI backend) with JWT authentication, three-tier RBAC (Admin/Manager/Sales Rep), user management, mock email notification on lead create, Docker containerisation with persistent SQLite volume, database clear endpoint, UI visual improvements (brand colours + logo + badge colours), comprehensive .gitignore files, three README files, CRM demo walkthrough guide, and E2E test guide. All changes are additive to the existing codebase — no existing API contracts or frontend routes are broken.

---

## Technical Context

**Language/Version**: Python 3.12 / FastAPI ≥0.110.0 / SQLAlchemy 2.0 async (backend, existing) + TypeScript 5.4 / React 18.3 / Vite 5.4 / Node 22.17.1 / npm 10.9.2 (frontend, existing)

**New Backend Dependencies**:
- `python-jose[cryptography]>=3.3.0` — JWT signing and verification (HS256)
- `passlib[bcrypt]>=1.7.4` — bcrypt password hashing (cost factor 12)

**New Frontend Dependencies**: None — Auth state via React Context + useRef (no new npm packages)

**Storage**: SQLite (existing, via aiosqlite). Named Docker volume `crm_db_data` mounted at `/app/data/crm.db` for container persistence.

**Testing**:
- Backend: pytest + httpx (existing) — new tests for auth, users, admin endpoints
- Frontend: Vitest (existing) — no new unit tests required
- E2E: Playwright (existing) — documented in e2e-demo-guide.md

**Target Platform**: Desktop browsers Chrome/Firefox/Edge 120+ (existing) + Docker (new)

**Performance Goals**: Login endpoint ≤500ms p95. JWT verification overhead ≤5ms per request.

**Constraints**:
- `JWT_SECRET_KEY` env variable required in production (min 32 chars)
- `JWT_EXPIRE_MINUTES` env variable (default: 60)
- No breaking changes to existing API endpoints
- No new frontend npm packages
- Node 22.17.1 / npm 10.9.2 compatibility in Docker frontend build
- SQLite file path in Docker: `/app/data/crm.db`

**Scale/Scope**: 2 Alembic migrations, 1 new model (User), 4 new backend routers, ~15 new frontend files, 3 Docker files, 3 READMEs, 3 .gitignore files, 2 documentation guides, sort/filter on all 6 list endpoints + list pages

---

## Constitution Check

*The project constitution file contains placeholder template content only — no active governance rules apply. All spec-derived gates evaluated below.*

| Gate | Status | Basis |
|------|--------|-------|
| JWT not stored in localStorage/sessionStorage | PASS | FR-002; tokenStore module-singleton + React Context |
| All protected endpoints require valid JWT | PASS | FR-004; FastAPI Depends(get_current_user) on all existing + new routers |
| Backend role enforcement independent of frontend | PASS | FR-011; backend returns 403 for unauthorised operations |
| Passwords hashed with bcrypt (not plain text) | PASS | FR-012; passlib[bcrypt] cost=12 |
| Docker uses named volume (not bind-mount) | PASS | FR-021; `crm_db_data` named volume |
| Clear database preserves users table | PASS | FR-024; users table excluded from DELETE |
| Seed users operation idempotent | PASS | FR-017; upsert-or-skip (check email uniqueness first) |
| Node >=18 maintained in package.json | PASS | Existing constraint preserved in Docker build |
| No breaking changes to existing API contracts | PASS | New endpoints use new paths; sort/filter params are all optional |
| All existing API endpoints still protected | PASS | Auth middleware applies to all routes except /login and /health |
| sort_by whitelist prevents injection | PASS | Dict-mapped column whitelist per entity; invalid value → fallback |
| Search uses parameterised queries (no string interpolation) | PASS | SQLAlchemy `ilike` binds values safely |
| Profile page self-service PATCH cannot escalate role | PASS | /api/v1/users/me only allows display_name update |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-crm-platform-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 — technology decisions and patterns
├── data-model.md        # Phase 1 — User entity, JWT schema, Alembic migrations
├── quickstart.md        # Phase 1 — validation scenarios (curl + browser)
├── contracts/
│   ├── api.md           # New/modified backend API contracts
│   └── frontend.md      # New frontend component contracts
└── tasks.md             # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code Changes

```text
# ROOT
.gitignore                                # NEW: Docker + IDE + OS patterns
README.md                                 # NEW: Architecture overview + quick-start
docker-compose.yml                        # NEW: frontend + backend services + crm_db_data volume

# BACKEND (backend/)
backend/
├── .gitignore                            # NEW: Python patterns
├── README.md                             # NEW: FastAPI setup + commands
├── .env.example                          # NEW: JWT_SECRET_KEY, JWT_EXPIRE_MINUTES
├── Dockerfile                            # NEW: Python 3.12-slim multi-stage
├── requirements.txt                      # MODIFIED: + python-jose[cryptography], passlib[bcrypt]
├── app/
│   ├── config.py                         # MODIFIED: + jwt_secret_key, jwt_expire_minutes
│   ├── main.py                           # MODIFIED: include auth, users, admin routers
│   ├── models/
│   │   ├── user.py                       # NEW: User model + UserRole enum
│   │   └── __init__.py                   # MODIFIED: + import User
│   ├── schemas/
│   │   ├── user.py                       # NEW: UserCreate, UserUpdate, UserResponse, UserListResponse
│   │   └── auth.py                       # NEW: LoginRequest, TokenResponse
│   ├── auth/
│   │   ├── __init__.py                   # NEW
│   │   ├── jwt.py                        # NEW: create_access_token, decode_token
│   │   ├── password.py                   # NEW: hash_password, verify_password (passlib)
│   │   └── dependencies.py              # NEW: get_current_user, require_admin, require_manager_or_above, require_any_authenticated
│   ├── services/
│   │   ├── user_service.py               # NEW: create_user, update_user, list_users, get_by_email, get_current (me)
│   │   ├── auth_service.py               # NEW: authenticate_user (verify pw + return User)
│   │   ├── lead_service.py               # MODIFIED: + search/sort params; create_lead() sends mock email
│   │   ├── account_service.py            # MODIFIED: + search/sort params
│   │   ├── contact_service.py            # MODIFIED: + search/sort params
│   │   ├── opportunity_service.py        # MODIFIED: + sort params
│   │   ├── activity_service.py           # MODIFIED: + sort params
│   │   └── seed_service.py               # MODIFIED: + seed_users() function
│   └── routers/
│       ├── auth.py                       # NEW: POST /api/v1/auth/login
│       ├── users.py                      # NEW: GET /api/v1/users, POST /api/v1/users, PATCH /api/v1/users/{id}, GET+PATCH /api/v1/users/me
│       ├── admin.py                      # NEW: DELETE /api/v1/admin/clear
│       ├── seed.py                       # MODIFIED: + POST /api/v1/seed/users
│       ├── leads.py                      # MODIFIED: + search/sort Query params; auth dependency
│       ├── accounts.py                   # MODIFIED: + search/sort Query params; auth dependency
│       ├── contacts.py                   # MODIFIED: + search/sort Query params; auth dependency
│       ├── opportunities.py              # MODIFIED: + sort Query params; auth dependency
│       └── activities.py                 # MODIFIED: + sort Query params; auth dependency
├── alembic/versions/
│   ├── 003_add_users_table.py            # NEW
│   └── 004_add_created_by_to_leads_activities.py  # NEW
└── tests/
    ├── test_auth.py                      # NEW: login success/fail, token expiry
    ├── test_users.py                     # NEW: CRUD, role enforcement
    └── test_admin.py                     # NEW: clear endpoint, role check

# FRONTEND (frontend/)
frontend/
├── .gitignore                            # NEW: Node/TS patterns
├── README.md                             # NEW: React setup + commands (Node 22.17.1)
├── Dockerfile                            # NEW: node:22-alpine build + nginx:alpine serve
├── nginx.conf                            # NEW: static file server config for SPA
├── src/
│   ├── api/
│   │   ├── client.ts                     # MODIFIED: + auth interceptors (attach Bearer, handle 401)
│   │   ├── tokenStore.ts                 # NEW: module singleton { token, setToken }
│   │   └── auth.ts                       # NEW: loginApi(email, password) → TokenResponse
│   ├── contexts/
│   │   └── AuthContext.tsx               # NEW: AuthProvider + useAuth hook
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx                 # MODIFIED: brand colours per status/stage value
│   │   │   └── RoleGuard.tsx             # NEW: conditional render by role
│   │   └── layout/
│   │       └── NavSidebar.tsx            # MODIFIED: indigo-900 bg, logo, logout button, role-aware links
│   ├── hooks/
│   │   ├── useSortFilter.ts              # NEW: shared sort/filter/search state hook
│   │   └── useConfirmDialog.ts           # existing
│   ├── features/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx             # NEW: /login route
│   │   ├── admin/
│   │   │   ├── SeedManagerPage.tsx       # MODIFIED: + Clear DB + Seed Users buttons (Admin only)
│   │   │   ├── UserManagementPage.tsx    # NEW: /admin/users (Admin only)
│   │   │   └── useUsers.ts               # NEW: useUsers, useCreateUser, useUpdateUser, useCurrentUser, useUpdateCurrentUser
│   │   ├── profile/
│   │   │   └── ProfilePage.tsx           # NEW: /profile (any authenticated user) — display_name edit + Admin Users tab
│   │   ├── accounts/
│   │   │   └── AccountsListPage.tsx      # MODIFIED: + SortFilterBar (search, sort)
│   │   ├── contacts/
│   │   │   └── ContactsListPage.tsx      # MODIFIED: + SortFilterBar (search, account filter, sort)
│   │   ├── leads/
│   │   │   └── LeadsListPage.tsx         # MODIFIED: + SortFilterBar (search, sort; status chips already exist)
│   │   ├── opportunities/
│   │   │   └── OpportunitiesListPage.tsx # MODIFIED: + SortFilterBar (stage filter, sort by value/close date)
│   │   └── activities/
│   │       └── ActivitiesLogPage.tsx     # MODIFIED: + SortFilterBar (type filter, sort)
│   ├── components/
│   │   └── ui/
│   │       └── SortFilterBar.tsx         # NEW: search input + sort dropdown + filter chips
│   ├── router/
│   │   ├── index.tsx                     # MODIFIED: + /login, /profile, /settings redirect, /admin/users; wrap all in ProtectedRoute
│   │   └── ProtectedRoute.tsx            # NEW: redirects unauthenticated users to /login
│   └── App.tsx                           # MODIFIED: wrap RouterProvider with AuthProvider

# DOCUMENTATION
docs/
├── demo-guide.md                         # NEW: 8-stage CRM walkthrough
└── e2e-demo-guide.md                     # NEW: Playwright test guide + 3 worked examples
```

**Structure Decision**: Additive web application (Option 2 equivalent). Backend auth logic lives in `backend/app/auth/` module. Frontend auth lives in `frontend/src/contexts/` + `frontend/src/features/auth/`. Docker files in their respective project directories. Documentation in `docs/` at project root.

---

## Phase 0 Research Output

See [research.md](research.md)

## Phase 1 Design Output

See [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [contracts/frontend.md](contracts/frontend.md), [quickstart.md](quickstart.md)
