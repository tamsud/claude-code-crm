# Tasks: CRM Platform Enhancement Suite

**Input**: Design documents from `specs/005-crm-platform-enhancements/`

**Feature**: 005-crm-platform-enhancements | **Date**: 2026-06-13

**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story this task belongs to (US1–US15)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies, update config, create module scaffolding. No existing files are broken.

- [x] T001 Add `python-jose[cryptography]>=3.3.0` and `passlib[bcrypt]>=1.7.4` to `backend/requirements.txt`
- [x] T002 [P] Add `jwt_secret_key: str`, `jwt_expire_minutes: int = 60` fields to `backend/app/config.py` Settings class
- [x] T003 [P] Create `backend/.env.example` with `JWT_SECRET_KEY=changeme-min-32-chars` and `JWT_EXPIRE_MINUTES=60`
- [x] T004 [P] Create `docs/` directory at project root; create placeholder `docs/.gitkeep`
- [x] T005 [P] Create `backend/app/auth/__init__.py` (empty, marks module)
- [x] T006 [P] Create `frontend/src/contexts/` directory; create `frontend/src/contexts/.gitkeep`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: User model + auth module on backend; AuthContext + tokenStore on frontend. ALL user stories with auth depend on this phase.

**⚠️ CRITICAL**: No user story phase can begin until all Phase 2 tasks are complete.

- [x] T007 Create `backend/app/models/user.py` — `UserRole` enum (`admin`, `manager`, `sales_rep`) + `User` SQLAlchemy model (id, email, display_name, hashed_password, role, is_active, created_at, updated_at) per `data-model.md`
- [x] T008 Update `backend/app/models/__init__.py` to add `from app.models.user import User  # noqa: F401`
- [x] T009 Create `backend/app/schemas/auth.py` — `LoginRequest(email, password)` and `TokenResponse(access_token, token_type)` Pydantic schemas
- [x] T010 Create `backend/app/schemas/user.py` — `UserCreate`, `UserUpdate`, `UserResponse` (no password field), `UserMeUpdate(display_name only)` Pydantic schemas
- [x] T011 Create `backend/app/auth/password.py` — `hash_password(plain: str) -> str` using `passlib[bcrypt]`; `verify_password(plain, hashed) -> bool`
- [x] T012 Create `backend/app/auth/jwt.py` — `create_access_token(data: dict) -> str` using python-jose HS256; `decode_token(token: str) -> dict`; reads `settings.jwt_secret_key` and `settings.jwt_expire_minutes`
- [x] T013 Create `backend/app/auth/dependencies.py` — `get_current_user(token: str = Depends(oauth2_scheme), db) -> User`; `require_admin(user = Depends(get_current_user)) -> User`; `require_manager_or_above(user) -> User`; `require_any_authenticated(user) -> User`
- [x] T014 Create Alembic migration `backend/alembic/versions/003_add_users_table.py` — creates `users` table with all fields from data-model.md; creates unique index on `users.email`; run `alembic upgrade head` to verify
- [x] T015 Create Alembic migration `backend/alembic/versions/004_add_created_by_to_leads_activities.py` — adds nullable `created_by_user_id` FK column to `leads` and `activities` tables (SET NULL on delete); run `alembic upgrade head`
- [x] T016 [P] Create `frontend/src/api/tokenStore.ts` — module singleton `{ token: string | null; setToken(t: string | null): void }` (plain object, no React)
- [x] T017 [P] Create `frontend/src/contexts/AuthContext.tsx` — `AuthUser` interface `{ id, email, role, displayName }`; `AuthContextValue` interface with `user, isAuthenticated, login, logout`; `AuthProvider` component that stores token in `tokenStore`, decodes JWT payload for user info; `useAuth()` hook exported
- [x] T018 [P] Modify `frontend/src/api/client.ts` — add request interceptor reading `tokenStore.token` to attach `Authorization: Bearer`; add response interceptor handling 401 (call `tokenStore.setToken(null)` then redirect to `/login`)

---

## Phase 3: User Story 1 — JWT Authentication & Login (Priority: P1) 🎯 MVP

**Goal**: Users can log in via /login page; JWT stored in memory; all routes protected; unauthenticated users redirected.

**Independent Test**: Open app unauthenticated → redirected to /login. Log in with admin@crm.local / password123 → dashboard renders. Check DevTools storage → no JWT visible. Log out → back to /login.

- [x] T019 [US1] Create `backend/app/services/auth_service.py` — `authenticate_user(db, email, password) -> User | None` that fetches user by email, verifies password with `verify_password`, checks `is_active`, returns User or None
- [x] T020 [US1] Create `backend/app/routers/auth.py` — `POST /api/v1/auth/login` accepting `LoginRequest`; calls `auth_service.authenticate_user`; on success calls `create_access_token({"sub": user.id, "email": user.email, "role": user.role})`; returns `TokenResponse`; raises 401 on failure
- [x] T021 [US1] Update `backend/app/main.py` to `include_router(auth_router)` for the new auth router (no auth dependency on /auth/login itself)
- [x] T022 [US1] Create `frontend/src/api/auth.ts` — `loginApi(email: string, password: string): Promise<TokenResponse>` calling `POST /api/v1/auth/login`
- [x] T023 [US1] Create `frontend/src/features/auth/LoginPage.tsx` — form with email + password fields using `react-hook-form`; calls `useAuth().login()`; shows error message on failure; redirects to original URL or `/` on success; uses brand-styled card layout
- [x] T024 [US1] Create `frontend/src/router/ProtectedRoute.tsx` — reads `useAuth().isAuthenticated`; if false redirects to `/login` preserving current location in state; if `allowedRoles` prop provided checks `user.role`; renders `<Outlet />`
- [x] T025 [US1] Update `frontend/src/router/index.tsx` — add `/login` route (public, no ProtectedRoute); wrap all existing routes (dashboard, accounts, contacts, leads, opportunities, activities, emails, admin/seed) inside `ProtectedRoute`; add `/profile` and `/admin/users` routes
- [x] T026 [US1] Update `frontend/src/App.tsx` — wrap `<RouterProvider>` with `<AuthProvider>` so all routes have auth context
- [x] T027 [US1] Write `backend/tests/test_auth.py` — test valid login returns 200 + access_token; test wrong password returns 401; test deactivated user returns 401; test expired token returns 401 on protected endpoint

**Checkpoint**: App now redirects unauthenticated users to /login. Login works with seed users (created in US3). JWT stays out of browser storage.

---

## Phase 4: User Story 2 — Role-Based Access Control (Priority: P2)

**Goal**: Backend enforces Admin/Manager/Sales Rep permissions on every endpoint. Frontend hides/shows UI elements by role.

**Independent Test**: Log in as manager@crm.local → GET /api/v1/users returns 403. Log in as admin@crm.local → 200. Log in as sales@crm.local → cannot delete accounts (403). Frontend hides admin nav links for non-admins.

- [x] T028 [US2] Update all existing backend routers to add `Depends(require_any_authenticated)` to all list/get/create/update/delete endpoints: `backend/app/routers/accounts.py`, `contacts.py`, `opportunities.py`, `activities.py`, `mock_email.py`, `seed.py`
- [x] T029 [US2] Update `backend/app/routers/leads.py` — add `Depends(require_any_authenticated)`; for PATCH/DELETE also pass `current_user` to service so Sales Rep ownership check can be enforced
- [x] T030 [US2] Update `backend/app/services/lead_service.py` — `update_lead` and `delete_lead` accept optional `current_user`; if role is `sales_rep` and `lead.created_by_user_id != current_user.id` raise 403
- [x] T031 [US2] Update `backend/app/services/activity_service.py` — same ownership enforcement for Sales Rep on update/delete
- [x] T032 [US2] Create `frontend/src/components/ui/RoleGuard.tsx` — `<RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>` renders children if current user role matches; renders `fallback` (default null) otherwise
- [x] T033 [US2] Update `frontend/src/components/layout/NavSidebar.tsx` — wrap Admin section links in `<RoleGuard allowedRoles={['admin']}>` so Managers and Sales Reps don't see them
- [x] T034 [US2] Update `frontend/src/router/index.tsx` — pass `allowedRoles={['admin']}` to `ProtectedRoute` wrapping `/admin/users`; non-admins get redirected to dashboard
- [x] T035 [US2] Write `backend/tests/test_rbac.py` — test each role getting 200 on allowed endpoints and 403 on forbidden ones; test Sales Rep cannot update another user's lead

**Checkpoint**: Backend enforces roles independently of frontend. Each role type can be fully tested with seed credentials.

---

## Phase 5: User Story 3 — Seed Users for Each Role (Priority: P2)

**Goal**: `POST /api/v1/seed/users` creates admin@crm.local, manager@crm.local, sales@crm.local (password123). Idempotent.

**Independent Test**: Call endpoint twice — first call returns `{"created": 3, "skipped": 0}`; second returns `{"created": 0, "skipped": 3}`. Each user can log in immediately.

- [x] T036 [US3] Update `backend/app/services/seed_service.py` — add `seed_users(db) -> dict` that upserts (check-by-email) three seed users with hashed passwords; returns `{"created": int, "skipped": int}`
- [x] T037 [US3] Update `backend/app/routers/seed.py` — add `POST /api/v1/seed/users` endpoint calling `seed_service.seed_users(db)`; apply `Depends(require_admin)` guard
- [x] T038 [US3] Update `frontend/src/features/admin/SeedManagerPage.tsx` — add "Seed Users" button (Admin only via RoleGuard) that calls `POST /api/v1/seed/users` and shows result toast with created/skipped counts
- [x] T039 [US3] Write `backend/tests/test_seed.py` additions — test seed_users creates 3 users; test idempotency; test seeded users can authenticate

**Checkpoint**: Seed users exist and work. All RBAC tests in Phase 4 can now use real seed credentials.

---

## Phase 6: User Story 6 — Mock Email on Lead Creation (Priority: P3)

**Goal**: Every new lead triggers a mock email to crm-leads@company.internal visible in the emails list.

**Independent Test**: POST /api/v1/leads/ → 201; then GET /api/v1/emails/?to=crm-leads%40company.internal → items contains email with lead's details.

- [x] T040 [US6] Update `backend/app/services/lead_service.py` — in `create_lead()`, after `await db.commit()` call `mock_email_service.send_email(db, EmailSend(from_email="crm-system@company.internal", to_email="crm-leads@company.internal", subject=f"New Lead: {lead.first_name} {lead.last_name}", body=f"Lead: {lead.first_name} {lead.last_name}\nEmail: {lead.email}\nCompany: {lead.company or 'N/A'}\nSource: {lead.source or 'N/A'}"))` wrapped in try/except (log warning, do not fail lead creation)
- [x] T041 [US6] Write test in `backend/tests/test_leads.py` — verify creating a lead creates a corresponding email_message in the database addressed to crm-leads@company.internal

**Checkpoint**: Any new lead created via API or UI generates a notification email visible in the mock email inbox.

---

## Phase 7: User Story 8 — Database Clear/Reset (Priority: P3)

**Goal**: Admin-only endpoint and UI button to wipe all CRM data (not users). Requires confirmation dialog.

**Independent Test**: Seed data → Admin calls DELETE /api/v1/admin/clear → 204. GET /api/v1/leads/ returns empty. GET /api/v1/users returns users still present. Non-admin gets 403.

- [x] T042 [US8] Create `backend/app/routers/admin.py` — `DELETE /api/v1/admin/clear` with `Depends(require_admin)`; calls `await db.execute(delete(Lead))` for each entity (Lead, Contact, Account, Opportunity, Activity, EmailMessage) in correct FK order; commits; returns 204
- [x] T043 [US8] Update `backend/app/main.py` to `include_router(admin_router)` for the new admin router
- [x] T044 [US8] Update `frontend/src/features/admin/SeedManagerPage.tsx` — add "Clear Database" button (Admin only via RoleGuard); on click open ConfirmDialog "This will delete all CRM records. Are you sure?"; on confirm call `DELETE /api/v1/admin/clear`; on success show success toast and invalidate all query caches; button shows loading state during operation

**Checkpoint**: Admin can clear all CRM data from the UI or API. Non-admins are blocked.

---

## Phase 8: User Story 4 — User Management (Priority: P3)

**Goal**: Admin can list, create, edit role, and deactivate users via /admin/users and API.

**Independent Test**: Log in as admin → POST /api/v1/users creates user → PATCH deactivates → login attempt returns 401. /admin/users page lists all users. Non-admin gets 403 on all /users endpoints.

- [x] T045 [US4] Create `backend/app/services/user_service.py` — `create_user(db, data: UserCreate) -> User` (hashes pw, checks email uniqueness → 409 on duplicate); `update_user(db, id, data: UserUpdate) -> User`; `list_users(db, page, size, role?, is_active?, sort_by, sort_dir) -> PaginatedResponse`; `get_by_email(db, email) -> User | None`; `get_by_id(db, id) -> User`; `get_current_user_profile(db, user_id) -> User`; `update_current_user(db, user_id, data: UserMeUpdate) -> User`
- [x] T046 [US4] Create `backend/app/routers/users.py` — `GET /api/v1/users` (Admin, paginated list); `POST /api/v1/users` (Admin, create); `PATCH /api/v1/users/{id}` (Admin, update role/is_active); `GET /api/v1/users/me` (any auth, own profile); `PATCH /api/v1/users/me` (any auth, display_name only); all return `UserResponse` schema
- [x] T047 [US4] Update `backend/app/main.py` to `include_router(users_router)` for the new users router
- [x] T048 [US4] Create `frontend/src/features/admin/useUsers.ts` — `useUsers(params)` (TanStack Query list), `useCreateUser()` mutation, `useUpdateUser()` mutation, `useCurrentUser()` (GET /users/me), `useUpdateCurrentUser()` mutation (PATCH /users/me)
- [x] T049 [US4] Create `frontend/src/features/admin/UserManagementPage.tsx` — paginated table with columns: email, display_name, role (Badge), is_active (toggle); "New User" button opens Modal with create form (email, password, role, display_name fields); click role badge to open edit modal; `<SortFilterBar>` with role filter + sort by email/created_at; visible only to Admin (route-level ProtectedRoute already handles this)
- [x] T050 [US4] Write `backend/tests/test_users.py` — test create user; test duplicate email 409; test PATCH role; test deactivate → login fails; test non-admin gets 403 on all /users endpoints

**Checkpoint**: Full user management cycle works. Admin can create/edit/deactivate users via UI and API.

---

## Phase 9: User Story 5 + User Story 15 — Profile Page & Sidebar Navigation (Priority: P3)

**Goal**: /profile page shows own profile + display_name edit. NavSidebar bottom shows clickable user card linking to /profile.

**Independent Test**: Log in → see user email at sidebar bottom → click → arrive at /profile → update display_name → sidebar updates immediately. Admin sees "Users" tab on /profile.

- [x] T051 [US5] Create `frontend/src/features/profile/ProfilePage.tsx` — shows avatar (initials circle), display_name input (pre-filled), email (read-only), role Badge; "Save" button calls `useUpdateCurrentUser()` mutation with `{ display_name }`; on success updates AuthContext and shows toast; Admin users see "Users" tab that renders `<UserManagementPage>`
- [x] T052 [US5] Update `frontend/src/router/index.tsx` — add `/profile` route (any authenticated user) → ProfilePage; add `/settings` route as Navigate redirect to `/profile`
- [x] T053 [US5] Update `frontend/src/components/layout/NavSidebar.tsx` — add bottom section: `<Link to="/profile">` containing avatar circle (initials from display_name or email), display_name (or email if null), role Badge; add separate logout icon button (`LogOut` from lucide-react) next to the profile link; this section is always visible to any authenticated user
- [x] T054 [US5] Update `frontend/src/contexts/AuthContext.tsx` — expose `updateDisplayName(name: string) => void` that updates the in-memory AuthUser so sidebar reflects changes without page reload
- [x] T055 [US5] Update `frontend/src/api/auth.ts` — add `getCurrentUser(): Promise<UserResponse>` (GET /api/v1/users/me) and `updateCurrentUser(data): Promise<UserResponse>` (PATCH /api/v1/users/me)

**Checkpoint**: Profile is reachable in ≤2 clicks. Display name persists across page interactions.

---

## Phase 10: User Story 14 — Sorting & Filtering on List Pages (Priority: P3)

**Goal**: All 6 CRM list pages (accounts, contacts, leads, opps, activities, users) have search/filter/sort controls; backend supports sort_by + sort_dir + search params.

**Independent Test**: `GET /api/v1/accounts/?search=acme&sort_by=name&sort_dir=asc` returns filtered+sorted results. On accounts list page, typing in search box filters in real time. Sorting by name column reverses with second click.

### Backend sort/filter additions

- [x] T056 [US14] Update `backend/app/services/account_service.py` — `list_accounts(db, page, size, search?, sort_by='created_at', sort_dir='desc')`: add sort whitelist `{name, industry, created_at}`; add `ilike('%search%')` on `Account.name` when search provided
- [x] T057 [US14] Update `backend/app/routers/accounts.py` — add `search: str | None = Query(None)`, `sort_by: str = Query('created_at')`, `sort_dir: str = Query('desc')` params; pass to service
- [x] T058 [US14] Update `backend/app/services/contact_service.py` — add search (OR across first_name, last_name, email) + sort whitelist `{last_name, first_name, email, created_at}`
- [x] T059 [US14] Update `backend/app/routers/contacts.py` — add `search`, `sort_by`, `sort_dir` params; pass to service
- [x] T060 [US14] Update `backend/app/services/lead_service.py` — add search (OR across first_name, last_name, email, company) + sort whitelist `{last_name, company, status, created_at}`
- [x] T061 [US14] Update `backend/app/routers/leads.py` — add `search`, `sort_by`, `sort_dir` params; pass to service (keep existing `status` filter)
- [x] T062 [US14] Update `backend/app/services/opportunity_service.py` — add sort whitelist `{value, expected_close_date, title, created_at}`; keep existing stage/account_id/contact_id filters
- [x] T063 [US14] Update `backend/app/routers/opportunities.py` — add `sort_by`, `sort_dir` params; pass to service
- [x] T064 [US14] Update `backend/app/services/activity_service.py` — add sort whitelist `{due_date, activity_type, created_at}`; keep existing contact_id/opportunity_id/activity_type filters
- [x] T065 [US14] Update `backend/app/routers/activities.py` — add `sort_by`, `sort_dir` params; pass to service
- [x] T066 [US14] Update `backend/app/services/user_service.py` `list_users()` — add `role` filter, `is_active` filter, sort whitelist `{email, role, created_at}`; already planned in T045; verify implementation matches
- [x] T067 [US14] Update `backend/app/routers/users.py` `GET /api/v1/users` — add `role`, `is_active`, `sort_by`, `sort_dir` params; already planned in T046; verify implementation matches

### Frontend sort/filter additions

- [x] T068 [US14] Create `frontend/src/hooks/useSortFilter.ts` — manages `search`, `sortBy`, `sortDir`, `filters` state; exposes `setSearch`, `setSortBy`, `setSortDir`, `setFilter`, `clearAll`; `queryParams` computed property returns `Record<string, string>` ready to spread into API call params
- [x] T069 [US14] Create `frontend/src/components/ui/SortFilterBar.tsx` — renders: optional debounced search input (300ms); optional sort dropdown (`<select>` with sort options); optional filter chips (one `<select>` per FilterOption); "Clear all" button (shown only when any value is active); uses `useSortFilter` output as controlled state
- [x] T070 [US14] Update `frontend/src/features/accounts/AccountsListPage.tsx` — add `useSortFilter({ sortBy: 'created_at', sortDir: 'desc' })`; render `<SortFilterBar>` with search placeholder "Search accounts…" and sort options (Name A→Z, Name Z→A, Newest, Oldest); pass `queryParams` to `useAccounts` hook
- [x] T071 [US14] Update `frontend/src/features/contacts/ContactsListPage.tsx` — add `useSortFilter` with account_id filter; render `<SortFilterBar>` with search "Search contacts…", Account dropdown filter, and sort options; pass `queryParams` to `useContacts` hook
- [x] T072 [US14] Update `frontend/src/features/leads/LeadsListPage.tsx` — existing status tab filter stays; add `useSortFilter` for search + sort; render `<SortFilterBar>` above status tabs with search "Search leads…" and sort options (Name, Company, Status, Newest); pass `queryParams` to `useLeads` hook
- [x] T073 [US14] Update `frontend/src/features/opportunities/OpportunitiesListPage.tsx` — add `useSortFilter` with stage filter; render `<SortFilterBar>` with stage dropdown, Account dropdown, and sort options (Value ↑↓, Close Date ↑↓, Newest); pass `queryParams` to `useOpportunities` hook
- [x] T074 [US14] Update `frontend/src/features/activities/ActivitiesLogPage.tsx` — add `useSortFilter` with type filter; render `<SortFilterBar>` with type dropdown and sort options (Due Date ↑↓, Newest); pass `queryParams` to `useActivities` hook
- [x] T075 [US14] Update `frontend/src/features/admin/UserManagementPage.tsx` — ensure `<SortFilterBar>` with role filter and sort (planned in T049); verify `useUsers` hook passes `queryParams` correctly

**Checkpoint**: All 6 list pages filter and sort in real time. Empty state shows "No results" with clear-filters CTA.

---

## Phase 11: User Story 7 — Docker Containerisation with Persistent Data (Priority: P3)

**Goal**: `docker compose up` starts full stack. Data persists across restarts. `docker compose down -v` is the only way to lose data.

**Independent Test**: docker compose up → seed data → docker compose restart → data still present → docker compose down → docker compose up → data still present → docker compose down -v → docker compose up → data gone.

- [x] T076 [US7] Create `backend/Dockerfile` — FROM python:3.12-slim; WORKDIR /app; COPY requirements.txt; RUN pip install; COPY app/ app/ alembic/ alembic/ alembic.ini; ENV DATABASE_URL=sqlite+aiosqlite:///./data/crm.db; EXPOSE 8000; CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
- [x] T077 [US7] Create `frontend/nginx.conf` — SPA config: `root /usr/share/nginx/html`; `try_files $uri $uri/ /index.html` (handles React Router client-side routes); gzip enabled; cache static assets
- [x] T078 [US7] Create `frontend/Dockerfile` — multi-stage: stage 1 FROM node:22-alpine as builder (npm ci && npm run build); stage 2 FROM nginx:alpine (COPY --from=builder /app/dist /usr/share/nginx/html; COPY nginx.conf /etc/nginx/conf.d/default.conf); EXPOSE 80
- [x] T079 [US7] Create `docker-compose.yml` at project root — services: `backend` (build: ./backend, ports: 8000:8000, volumes: crm_db_data:/app/data, env_file: backend/.env.example), `frontend` (build: ./frontend, ports: 3000:80, depends_on: backend); volumes: `crm_db_data` (named volume, no driver options)
- [x] T080 [US7] Verify Docker build locally: `docker compose build` succeeds, `docker compose up -d` starts both services, `curl http://localhost:8000/api/v1/health` returns 200, `curl http://localhost:3000` returns HTML

**Checkpoint**: Full stack runs in Docker with persistent SQLite volume.

---

## Phase 12: User Story 9 — UI Visual Improvements (Priority: P4)

**Goal**: Brand colour sidebar, coloured status/stage badges, logo in sidebar header.

**Independent Test**: Load app → sidebar has indigo-900 background + logo → status badges are colour-coded → stage badges are colour-coded.

- [x] T081 [US9] Update `frontend/tailwind.config.ts` — extend theme with `brand: { DEFAULT: '#1e3a5f', light: '#2d5f9e', accent: '#6366f1' }` colour
- [x] T082 [US9] Update `frontend/src/components/ui/Badge.tsx` — add colour map for LeadStatus values (`new`=blue, `contacted`=yellow, `qualified`=green, `lost`=red) and OpportunityStage values (`prospecting`=slate, `qualification`=blue, `proposal`=indigo, `negotiation`=orange, `closed-won`=green, `closed-lost`=red); ActivityType values (`call`=purple, `email`=blue, `meeting`=teal); existing `variant`/`value` prop interface preserved
- [x] T083 [US9] Update `frontend/src/components/layout/NavSidebar.tsx` — change sidebar background to `bg-indigo-900`; change all nav text to `text-white/80` with `hover:text-white hover:bg-indigo-800` active states; add CRM logo/brand mark in header (SVG icon + "CRM" text in white); ensure this matches the brand colour from tailwind.config
- [x] T084 [US9] Update `frontend/src/features/dashboard/PipelineFunnel.tsx` — use stage colour constants matching new Badge colours for chart cells

**Checkpoint**: Visual identity is consistent across sidebar, badges, and dashboard chart.

---

## Phase 13: User Story 10 — Gitignore Files (Priority: P4)

**Goal**: Three comprehensive .gitignore files prevent secrets, build artifacts, and IDE files from being committed.

**Independent Test**: `git check-ignore -v frontend/node_modules frontend/.env backend/__pycache__ backend/.venv .env` — all matched.

- [x] T085 [US10] Create root `.gitignore` — cover: `.env*`, `*.local`, Docker (`docker-data/`, `*.log`), IDE (`.vscode/`, `.idea/`, `*.swp`), OS (`.DS_Store`, `Thumbs.db`), and top-level build dirs not covered by sub-project ignores
- [x] T086 [US10] Create `frontend/.gitignore` — cover: `node_modules/`, `dist/`, `build/`, `.env*`, `coverage/`, `playwright-report/`, `test-results/`, `*.log`, `.vite/`
- [x] T087 [US10] Create `backend/.gitignore` — cover: `__pycache__/`, `*.pyc`, `*.pyo`, `.venv/`, `venv/`, `*.egg-info/`, `dist/`, `build/`, `.env*`, `*.db`, `*.db-shm`, `*.db-wal`, `alembic/versions/__pycache__/`, `.pytest_cache/`, `htmlcov/`

**Checkpoint**: Running `git status` shows clean repo with no unintended tracked files.

---

## Phase 14: User Story 11 — README Documentation (Priority: P4)

**Goal**: Three README files covering root architecture, frontend setup (Node 22.17.1), and backend setup.

**Independent Test**: Follow each README from a clean checkout — commands execute without modification.

- [x] T088 [US11] Create root `README.md` — sections: Project Overview, Architecture diagram (text), Prerequisites (Node 22.17.1 / npm 10.9.2 / Python 3.12 / Docker Desktop), Quick Start (dev mode), Quick Start (Docker), Seed Users, Project Structure (links to frontend/README.md and backend/README.md), Specs directory description
- [x] T089 [US11] Create `frontend/README.md` — sections: Prerequisites (Node 22.17.1), Install (`npm install`), Dev server (`npm run dev` → localhost:5173), Build (`npm run build`), Unit Tests (`npm run test`), E2E Tests (`npm run test:e2e`), Environment Variables (`VITE_API_BASE_URL`), Project structure overview
- [x] T090 [US11] Create `backend/README.md` — sections: Prerequisites (Python 3.12, pip), Install (pip install -r requirements.txt in venv), Dev server (`uvicorn app.main:app --reload`), Migrations (`alembic upgrade head`), Seed CRM Data, Seed Users, Environment Variables (`DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_EXPIRE_MINUTES`), Run Tests (`pytest`)

**Checkpoint**: Any developer can start the project from either README without prior knowledge.

---

## Phase 15: User Story 12 — CRM Demo Walkthrough Guide (Priority: P4)

**Goal**: `docs/demo-guide.md` provides a step-by-step guide for the full CRM workflow.

**Independent Test**: Follow the guide sequentially using the running application — every step succeeds and the expected UI state matches.

- [x] T091 [US12] Create `docs/demo-guide.md` — 8 numbered stages with expected values and verification steps at each: **(1)** Login as admin@crm.local; **(2)** Create Account "Acme Corp" (industry: Technology); **(3)** Create Contact "Jane Smith" at Acme Corp (email: jane@acme.com); **(4)** Create Lead "John Doe" (company: StartupCo, source: website); **(5)** Advance lead from New → Contacted → Qualified; **(6)** Convert lead to Opportunity (title: "StartupCo Deal", value: $50,000, stage: proposal); **(7)** Log Activity (type: call, subject: "Discovery call"); **(8)** Compose mock email to jane@acme.com; include [Screenshot placeholder] callouts at each step; end with "Verify" checklist

**Checkpoint**: Guide is complete and followable end-to-end.

---

## Phase 16: User Story 13 — E2E Demonstration Guide (Priority: P5)

**Goal**: `docs/e2e-demo-guide.md` explains the Playwright test setup and provides 3 worked examples.

**Independent Test**: Follow guide → `npx playwright test` runs without error → output matches what guide describes.

- [x] T092 [US13] Create `docs/e2e-demo-guide.md` — sections: **(1)** What E2E tests exist (list each spec file and what it covers); **(2)** Prerequisites & setup (`npm install`, backend seeded, `npx playwright install`); **(3)** Run all tests (`npx playwright test`), run single file, run with UI mode (`--ui`), run headed; **(4)** How to add a new test (page object pattern, locator strategy, assertions); **(5)** Example 1: Lead creation → conversion to opportunity (full flow); **(6)** Example 2: Send email from Contact detail page; **(7)** Example 3: Seed data and verify Dashboard KPIs; each example includes the test file path and expected Playwright output

**Checkpoint**: A developer unfamiliar with Playwright can add a new test after reading this guide.

---

## Phase 17: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, wiring, and quickstart verification

- [x] T093 Verify `backend/app/main.py` includes all new routers (auth, users, admin) and no duplicate includes; run `uvicorn app.main:app` and confirm `/api/v1/auth/login`, `/api/v1/users`, `/api/v1/admin/clear`, `/api/v1/seed/users` all appear in OpenAPI docs at `/docs`
- [x] T094 [P] Run full backend test suite: `cd backend && pytest -v` — all tests pass (existing + new auth/user/seed/lead tests)
- [x] T095 [P] Run frontend TypeScript check: `cd frontend && npx tsc --noEmit` — zero errors
- [x] T096 [P] Run frontend unit tests: `cd frontend && npx vitest run` — all existing tests still pass
- [ ] T097 Run quickstart validation from `specs/005-crm-platform-enhancements/quickstart.md` — execute Scenarios 1–10 in order and verify all expected outcomes match
- [ ] T098 Verify Docker build and persistence: `docker compose build && docker compose up -d` — seed users, restart containers, confirm users persist; `docker compose down -v && docker compose up -d` — confirm database is empty

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → ALL user story phases
Phase 2 (Foundational)
  └─ T007-T015 (backend: model, schemas, auth, migrations) MUST complete before US1
  └─ T016-T018 (frontend: tokenStore, AuthContext, client interceptors) MUST complete before US1
Phase 3 (US1 Auth) → Phase 4 (US2 RBAC) → Phase 5 (US3 Seed Users)
Phase 4 (US2 RBAC) → Phase 7 (US8 DB Clear) [admin guard needed]
Phase 3 (US1 Auth) → Phase 8 (US4 User Mgmt)
Phase 3 (US1 Auth) → Phase 9 (US5+US15 Profile)
Phase 4 (US2 RBAC) → Phase 10 (US14 Sort/Filter) [all routers need auth before adding sort]
Phase 6 (US6 Mock Email) → independent, only needs Phase 2 complete
Phase 11 (US7 Docker) → independent after all code phases complete
Phase 12-16 (UI/docs) → independent, any time after Phase 2
```

### User Story Dependencies

| Story | Depends On | Can Parallelise With |
|-------|-----------|----------------------|
| US1 (Auth) | Phase 2 complete | — (must be first US) |
| US2 (RBAC) | US1 complete | — |
| US3 (Seed Users) | US2 complete | US6, US7, US8 |
| US4 (User Mgmt) | US1, US2 complete | US6, US8, US9, US10, US11 |
| US5+US15 (Profile) | US1, US4 (uses /users/me) | US6, US7, US8 |
| US6 (Mock Email) | Phase 2 complete | US7, US8, US9, US10, US11 |
| US7 (Docker) | All code phases complete | US10, US11, US12 |
| US8 (DB Clear) | US2 (needs admin role) | US6, US9, US10, US11 |
| US14 (Sort/Filter) | US2 (needs auth on routers) | US9, US10, US11, US12, US13 |
| US9 (UI Visual) | Phase 2 frontend done | US10, US11, US12, US13 |
| US10 (Gitignore) | None | Everything |
| US11 (README) | Code phases complete | US12, US13 |
| US12 (Demo Guide) | App fully functional | US13 |
| US13 (E2E Guide) | US12 complete | — |

### Within Each Phase (local ordering)

- Backend tasks: model → schemas → service → router → main.py include
- Frontend tasks: API client → hooks → components → pages → router wiring
- Always: T007-T013 (auth module) before T019 (auth service)
- Always: T014-T015 (migrations) before any backend tests that write to DB

---

## Parallel Opportunities

### Phase 2: Foundational (can parallelise within backend and frontend)

```
# Backend group (T007-T015): sequential within group
# Frontend group (T016-T018): can run in parallel with backend group
Parallel: T016 + T017 + T018 (different files, no inter-dependency)
Parallel: T011 + T012 (password.py and jwt.py are independent)
```

### Phase 10: Sort/Filter (highly parallelisable)

```
# All backend service updates can run in parallel (different files):
Parallel: T056 + T058 + T060 + T062 + T064
# All backend router updates can run in parallel:
Parallel: T057 + T059 + T061 + T063 + T065
# All frontend list page updates can run in parallel:
Parallel: T070 + T071 + T072 + T073 + T074 + T075
```

### Phase 11-16: Documentation (all fully parallel with each other)

```
Parallel: T085 + T086 + T087 (gitignore files)
Parallel: T088 + T089 + T090 (README files)
```

---

## Implementation Strategy

### MVP (Phases 1–5 only)

1. Phase 1: Setup dependencies
2. Phase 2: Foundational (User model + auth module + AuthContext)
3. Phase 3: US1 — working login page + JWT + route protection
4. Phase 4: US2 — RBAC on all endpoints
5. Phase 5: US3 — seed users so you can test all roles
6. **STOP and VALIDATE**: Three roles work, all routes protected, JWT not in storage
7. Demo: `POST /api/v1/seed/users` → log in as each role → verify access

### Incremental Delivery After MVP

- Add US6 (mock email) → quick win, 2 tasks
- Add US8 (DB clear) → admin utility, 3 tasks
- Add US4+US5+US15 (user management + profile) → full user lifecycle
- Add US14 (sort/filter) → major UX improvement across all list pages
- Add US7 (Docker) → deployment readiness
- Add US9 (UI visual) → polish
- Add US10/US11/US12/US13 (docs) → documentation sprint

---

## Notes

- Tasks marked [P] touch different files with no unresolved dependencies — safe to run in parallel
- Each checkpoint validates the user story independently before moving on
- Backend `sort_by` whitelist dict pattern prevents SQL injection — do not use raw string interpolation
- Frontend `useSortFilter` state is React state (not URL params) — URL sync is a future enhancement
- JWT secret must be ≥32 chars in production; `.env.example` has a placeholder, not a real secret
- Alembic migrations run automatically in the Docker CMD — no manual migration step needed
- The `PATCH /api/v1/users/me` endpoint accepts only `display_name` — it cannot change role or is_active
