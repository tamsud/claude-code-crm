# Feature Specification: CRM Platform Enhancement Suite

**Feature Branch**: `005-crm-platform-enhancements`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "CRM Platform Enhancement Suite — mock email on lead create, README files, Docker containerisation with persistent volumes, UI visual improvements, CRM demo walkthrough guide, database clear/reset with confirmation, .gitignore improvements, JWT login page, RBAC (Admin/Manager/Sales Rep), seed users per role, role-based view restrictions, user management page, role-aware profile/settings page, E2E demo guide document."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - JWT Authentication & Login (Priority: P1)

A user who is not logged in is redirected to a /login page. They enter their email and password. On success the system issues a JWT token stored in memory (not localStorage), attached as `Authorization: Bearer` on all subsequent API requests. Unauthenticated API calls return 401 and the frontend redirects to /login.

**Why this priority**: Without authentication, RBAC and user management are impossible. This is the security foundation for the entire enhancement suite.

**Independent Test**: Start the app unauthenticated → redirected to /login. Log in with admin@crm.local / password123 → redirected to dashboard. Refresh page → still logged in (token in memory, page reload clears session). Log out → redirected to /login.

**Acceptance Scenarios**:

1. **Given** a user visits any protected route, **When** they are not authenticated, **Then** they are redirected to /login.
2. **Given** a user is on /login, **When** they submit valid credentials, **Then** they receive a JWT and are redirected to the dashboard.
3. **Given** a user submits invalid credentials, **When** login is attempted, **Then** a clear error message is displayed and no token is issued.
4. **Given** a valid JWT, **When** the token is expired (>60 min), **Then** the next API call returns 401 and the user is redirected to /login.
5. **Given** a logged-in user, **When** they click Logout, **Then** the in-memory token is cleared and they are redirected to /login.

---

### User Story 2 - Role-Based Access Control (Priority: P2)

Three roles exist: Admin, Manager, Sales Rep. The JWT payload contains the user's role. The backend enforces role permissions on every protected endpoint. The frontend reads the role from the decoded JWT and shows/hides UI elements accordingly.

**Why this priority**: RBAC determines what each authenticated user can see and do. Must be in place before user management and role-aware views are built.

**Independent Test**: Log in as each of the three seed users and verify the correct pages, buttons, and API access are available or blocked per role.

**Acceptance Scenarios**:

1. **Given** an Admin is logged in, **When** they navigate the app, **Then** all pages are accessible including /admin/users, seed/clear controls.
2. **Given** a Manager is logged in, **When** they navigate the app, **Then** /admin/users is hidden, seed and clear buttons are hidden, all CRM data pages are accessible.
3. **Given** a Sales Rep is logged in, **When** they navigate the app, **Then** they can view all CRM data, create/edit only their own leads and activities, and cannot delete accounts/contacts/opportunities.
4. **Given** any role, **When** an API request is made for an operation that role cannot perform, **Then** the backend returns 403 Forbidden.

---

### User Story 3 - Seed Users for Each Role (Priority: P2)

A seed endpoint creates three test users: admin@crm.local (Admin), manager@crm.local (Manager), sales@crm.local (Sales Rep), all with password "password123". These users persist in the database and can be used immediately for login.

**Why this priority**: Seed users are required to test all RBAC scenarios without manual user creation.

**Independent Test**: Call the seed/users endpoint → then log in with each seeded credential → each login succeeds and returns a JWT with the correct role.

**Acceptance Scenarios**:

1. **Given** an empty user table, **When** the seed users endpoint is called, **Then** three users are created with the correct emails, roles, and hashed passwords.
2. **Given** seed users already exist, **When** the seed endpoint is called again, **Then** it is idempotent (no duplicates, no error).
3. **Given** a seeded user, **When** they log in, **Then** the JWT contains the correct role claim.

---

### User Story 4 - User Management (Priority: P3)

Admin users can create new users, assign roles, and deactivate existing users via a /admin/users page on the frontend and POST /api/v1/users + PATCH /api/v1/users/:id endpoints on the backend.

**Why this priority**: User management is important but only accessible to Admins, who already have a working login. Depends on US1 and US2.

**Independent Test**: Log in as Admin → navigate to /admin/users → create a new user → assign a role → deactivate the user → verify the deactivated user cannot log in.

**Acceptance Scenarios**:

1. **Given** an Admin on /admin/users, **When** they submit a create-user form, **Then** a new user is created with the specified email and role.
2. **Given** an Admin, **When** they PATCH a user's role, **Then** the user's next JWT reflects the updated role.
3. **Given** an Admin, **When** they deactivate a user, **Then** that user's login attempt returns 401.
4. **Given** a non-Admin user, **When** they attempt to access /admin/users or the user management API, **Then** they receive a 403 or are redirected.

---

### User Story 5 - Role-Aware Profile/Settings Page (Priority: P3)

A /settings or /profile page shows the current user's name, email, and role. Admin users additionally see a Users tab on this page that embeds the user management table.

**Why this priority**: Provides each user visibility of their own identity and role. Admins get a convenient shortcut to user management.

**Independent Test**: Log in as each role → visit /settings → verify name/email/role are shown correctly → as Admin verify Users tab is present and functional.

**Acceptance Scenarios**:

1. **Given** any logged-in user, **When** they visit /settings, **Then** their email, display name (if set), and role are displayed.
2. **Given** an Admin user, **When** they visit /settings, **Then** a "Users" tab is visible with the user management table.
3. **Given** a Manager or Sales Rep, **When** they visit /settings, **Then** no Users tab is shown.

---

### User Story 6 - Mock Email on Lead Creation (Priority: P3)

When a new lead is created via the API, the system automatically sends a mock email notification to a hardcoded internal address (crm-leads@company.internal) via the existing Mock Email API. The notification contains the lead's name, email, company, and source.

**Why this priority**: Closes the gap in lead capture notification workflow. Straightforward integration with the existing mock email infrastructure.

**Independent Test**: Create a new lead via the API or UI → verify a mock email appears in the /api/v1/emails list addressed to crm-leads@company.internal.

**Acceptance Scenarios**:

1. **Given** a user creates a new lead, **When** the lead is saved successfully, **Then** a mock email is automatically sent to crm-leads@company.internal with the lead's details.
2. **Given** lead creation fails validation, **When** the lead is rejected, **Then** no mock email is sent.
3. **Given** a mock email is sent, **When** it is viewed in the email list, **Then** the subject and body contain the lead's first name, last name, company, and source.

---

### User Story 7 - Docker Containerisation with Persistent Data (Priority: P3)

Both the frontend and backend are containerised with Docker and orchestrated via docker-compose. The database is stored in a named Docker volume so data persists across container restarts. Restarting containers does not delete data; only explicitly removing the volume does.

**Why this priority**: Enables reproducible deployments and consistent environments. Depends on no earlier user story but is infrastructure.

**Independent Test**: `docker compose up` → use the CRM → `docker compose restart` → verify all data is still present → `docker compose down` → `docker compose up` → verify data still present → `docker compose down -v` → verify data is gone.

**Acceptance Scenarios**:

1. **Given** docker-compose.yml exists, **When** `docker compose up` is run, **Then** both frontend and backend start and are accessible on their configured ports.
2. **Given** a running stack with data, **When** containers are restarted, **Then** all database content is preserved.
3. **Given** `docker compose down` without `-v`, **When** containers are restarted, **Then** data is still present.
4. **Given** `docker compose down -v`, **When** containers are restarted, **Then** the database starts empty.

---

### User Story 8 - Database Clear/Reset (Priority: P3)

An admin-only "Clear Database" button (on the admin/seed page) wipes all CRM records and resets to a clean state. A confirmation dialog must be shown before the operation executes. Seed users are preserved (or can be re-seeded separately).

**Why this priority**: Required for demo and testing workflows where starting from a clean state is necessary.

**Independent Test**: Seed data → click Clear Database → confirm dialog → verify all leads/contacts/accounts/opportunities/activities are deleted → verify seed users remain accessible.

**Acceptance Scenarios**:

1. **Given** an Admin, **When** they click Clear Database, **Then** a confirmation dialog appears before any data is deleted.
2. **Given** the user confirms, **When** the operation executes, **Then** all CRM records are deleted and a success toast is shown.
3. **Given** the user cancels the confirmation, **When** they return to the page, **Then** no data is deleted.
4. **Given** a non-Admin user, **When** they attempt to call the clear endpoint directly, **Then** they receive 403 Forbidden.

---

### User Story 9 - UI Visual Improvements (Priority: P4)

The application UI is improved with: a logo in the sidebar header, brand colours applied to the sidebar and key interactive elements, colourful status badge variants, and an improved overall visual polish.

**Why this priority**: Visual improvements enhance usability and professional appearance but do not affect functionality.

**Independent Test**: Load the app → verify the sidebar shows a logo, primary brand colour is applied consistently, status badges are colour-coded by value.

**Acceptance Scenarios**:

1. **Given** the app loads, **When** the sidebar is rendered, **Then** a logo or brand mark is displayed in the sidebar header.
2. **Given** any page with status badges, **When** badges render, **Then** each status value has a distinct colour (not all grey).
3. **Given** the sidebar, **When** rendered, **Then** it uses a brand colour accent rather than a plain white/grey background.

---

### User Story 10 - Gitignore Files (Priority: P4)

Comprehensive .gitignore files exist for the root, frontend, and backend directories, covering all relevant ignore patterns for Node.js/React, Python/FastAPI, Docker, IDE files, environment files, and build artifacts.

**Why this priority**: Prevents accidental commits of secrets or build artifacts. Simple to add and high value.

**Independent Test**: Review each .gitignore file and verify it contains patterns for node_modules, __pycache__, .env, dist/build, Docker volumes, and IDE directories (.vscode, .idea).

**Acceptance Scenarios**:

1. **Given** a root-level .gitignore exists, **When** it is read, **Then** it contains Docker, IDE, and environment file patterns.
2. **Given** frontend/.gitignore exists, **When** it is read, **Then** it contains node_modules, dist, .env, coverage, and build artifact patterns.
3. **Given** backend/.gitignore exists, **When** it is read, **Then** it contains __pycache__, *.pyc, .venv, .env, and dist patterns.

---

### User Story 11 - README Documentation (Priority: P4)

Three README.md files: one at the project root (architecture overview, quick-start), one for the frontend (React setup, dev server, build, test commands), one for the backend (FastAPI setup, migrations, seed, API overview). Compatible with Node 22.17.1 / npm 10.9.2.

**Why this priority**: Developer onboarding documentation. Non-functional but important for long-term maintainability.

**Independent Test**: Read each README and verify it contains the required sections with accurate commands that work on Node 22.17.1 / npm 10.9.2.

**Acceptance Scenarios**:

1. **Given** a developer clones the repo, **When** they follow the root README quick-start, **Then** they can run the full stack.
2. **Given** a developer reads frontend/README.md, **When** they follow the commands, **Then** the dev server starts and tests run on Node 22.17.1 / npm 10.9.2.
3. **Given** a developer reads backend/README.md, **When** they follow the commands, **Then** the FastAPI server starts and seeds work.

---

### User Story 12 - CRM Demo Walkthrough Guide (Priority: P4)

A `docs/demo-guide.md` file provides a step-by-step guide for using the CRM end-to-end: log in → create account → create contact → create lead → advance lead status → convert to opportunity → log activities → view pipeline → compose email. Includes expected values, verification steps, and screenshot placeholders.

**Why this priority**: Enables demonstrations and onboarding. Pure documentation, no code changes.

**Independent Test**: Follow the guide from start to finish using the running application and verify every described step produces the expected outcome.

**Acceptance Scenarios**:

1. **Given** a new user following the demo guide, **When** they complete each step, **Then** the expected UI state matches what the guide describes.
2. **Given** the guide is read, **When** it is reviewed, **Then** it contains all 8 stages of the CRM workflow with expected values.

---

### User Story 13 - E2E Demonstration Guide (Priority: P5)

A `docs/e2e-demo-guide.md` document explains what E2E tests exist, how to run them with Playwright, how to add new tests, and includes concrete examples for 3 scenarios: create lead → convert to opportunity, send email from contact page, seed and verify dashboard KPIs.

**Why this priority**: Developer documentation for the test suite. Low priority as it does not add functional capability.

**Independent Test**: Follow the e2e guide → run `npx playwright test` → tests execute and produce the output described in the guide.

**Acceptance Scenarios**:

1. **Given** a developer reads the e2e guide, **When** they run the Playwright commands, **Then** the tests execute as described.
2. **Given** a developer wants to add a test, **When** they follow the guide's "adding a new test" section, **Then** they can create a working test.
3. **Given** the 3 example scenarios, **When** each is run, **Then** it exercises the described CRM workflow.

---

### User Story 14 - Sorting & Filtering on List Pages (Priority: P3)

All CRM list pages (Accounts, Contacts, Leads, Opportunities, Activities, Users) provide search, filter, and sort controls so users can quickly find records without scrolling through all items. Controls are rendered as a compact toolbar above each list.

**Why this priority**: Without sort/filter the lists become unusable with more than ~20 records. This is essential for a functional CRM UX.

**Independent Test**: On the Leads list page, enter a name in the search box → list filters in real time. Click a column header → list re-sorts. Select a status filter chip → list shows only matching leads. All three controls work together.

**Acceptance Scenarios**:

1. **Given** the Accounts list, **When** the user types in the search box, **Then** the list shows only accounts whose name matches the query (case-insensitive, partial match).
2. **Given** the Leads list, **When** the user selects "Qualified" from the status filter, **Then** only qualified leads are shown.
3. **Given** any list page, **When** the user clicks a sortable column header, **Then** the list re-sorts by that column; clicking again reverses the direction.
4. **Given** active filters, **When** the user clears them, **Then** the full unfiltered list is restored.
5. **Given** the Users list (Admin only), **When** the admin filters by role "Manager", **Then** only Manager users are shown.

---

### User Story 15 - Profile Page in Navigation (Priority: P3)

The current user's profile (name, email, role) is accessible via a clearly visible link in the navigation sidebar — not just through a hidden route. Clicking the user's name or avatar at the bottom of the sidebar navigates to /profile (or /settings). The page also allows updating the display name.

**Why this priority**: Without a visible profile link, users cannot discover or use the settings page.

**Independent Test**: Log in → see user email/avatar at sidebar bottom → click it → navigate to /profile → see name, email, role → update display name → see the new name reflected in the sidebar immediately.

**Acceptance Scenarios**:

1. **Given** any logged-in user, **When** the sidebar is rendered, **Then** their email address and role badge are visible at the bottom of the sidebar.
2. **Given** the user clicks their name/email in the sidebar, **When** navigation occurs, **Then** they arrive at /profile.
3. **Given** the /profile page, **When** the user updates their display name, **Then** the sidebar shows the updated name without a page reload.
4. **Given** an Admin on /profile, **When** they click the "Users" tab, **Then** the user management table is rendered on the same page.

---

### Edge Cases

- What happens when a JWT token expires mid-session? → API returns 401, frontend clears token and redirects to /login.
- What happens if seed users are called when users already exist? → Idempotent — no error, no duplicates.
- What happens if a Sales Rep tries to delete an account via direct API call? → 403 Forbidden returned.
- What happens if the database clear endpoint is called without admin role? → 403 Forbidden returned.
- What happens if Docker volume already exists? → Container starts normally, existing data is preserved.
- What happens if a lead is created with missing required fields? → Validation error, no mock email sent.
- What happens if a sort column is invalid? → Backend ignores it, falls back to default sort (created_at desc).
- What happens if a search query returns no results? → Empty state with a "No results for '…'" message and a clear-filters button.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Security**

- **FR-001**: System MUST expose a POST /api/v1/auth/login endpoint that accepts email and password and returns a signed JWT access token.
- **FR-002**: JWT tokens MUST be stored in application memory (React Context/state), never in localStorage or sessionStorage.
- **FR-003**: JWT tokens MUST expire after 60 minutes (configurable via environment variable).
- **FR-004**: All protected API endpoints MUST require a valid JWT `Authorization: Bearer` header; unauthenticated requests MUST return 401.
- **FR-005**: The frontend MUST attach the JWT to every API request via Axios request interceptor.
- **FR-006**: Unauthenticated frontend route visits MUST redirect to /login; successful login MUST redirect back to the originally requested route.

**Role-Based Access Control**

- **FR-007**: Three roles MUST exist: Admin, Manager, Sales Rep. The JWT payload MUST contain a `role` claim.
- **FR-008**: Admin MUST have full access to all pages and API endpoints including user management and seed/clear database operations.
- **FR-009**: Manager MUST be able to read and write all CRM data (accounts, contacts, leads, opportunities, activities) but MUST NOT access user management or seed/clear operations.
- **FR-010**: Sales Rep MUST be able to view all CRM records but MUST only create/edit their own leads and activities. Sales Rep MUST NOT delete accounts, contacts, or opportunities.
- **FR-011**: Backend MUST enforce role permissions on all protected endpoints, returning 403 for unauthorised operations regardless of frontend state.

**User Management**

- **FR-012**: System MUST expose POST /api/v1/users endpoint (Admin only) to create a new user with email, password, role, and optional display name.
- **FR-013**: System MUST expose PATCH /api/v1/users/:id endpoint (Admin only) to update a user's role or deactivate them.
- **FR-014**: Deactivated users MUST be rejected at login with a 401 response.
- **FR-015**: The frontend /admin/users page MUST list all users (email, role, active status) and provide create/edit forms (Admin only).

**Seed Users**

- **FR-016**: A seed users endpoint or integrated seed step MUST create three users: admin@crm.local (Admin), manager@crm.local (Manager), sales@crm.local (Sales Rep), password "password123" for each.
- **FR-017**: The seed users operation MUST be idempotent (safe to call multiple times without creating duplicates).

**Mock Email on Lead Creation**

- **FR-018**: When a lead is successfully created, the backend MUST automatically send a mock email notification to crm-leads@company.internal via the existing email service.
- **FR-019**: The mock email body MUST include the lead's first name, last name, email, company, and source.

**Docker**

- **FR-020**: A docker-compose.yml MUST exist at the project root that starts both frontend and backend services.
- **FR-021**: The database MUST be stored in a named Docker volume (not bind-mounted to host path) so data persists across `docker compose restart` and `docker compose down` (without `-v`).
- **FR-022**: Frontend Dockerfile MUST build the Vite React app and serve it via a production web server (e.g., nginx or node serve).
- **FR-023**: Backend Dockerfile MUST install Python dependencies and start the FastAPI server.

**Database Clear/Reset**

- **FR-024**: System MUST expose a DELETE /api/v1/admin/clear-database endpoint (Admin only) that deletes all CRM records (leads, contacts, accounts, opportunities, activities, emails).
- **FR-025**: The frontend Clear Database button MUST show a confirmation dialog before calling the endpoint.

**UI Visual Improvements**

- **FR-026**: The sidebar MUST display a logo or brand mark in the header area.
- **FR-027**: Status and stage badges MUST use distinct colours per value (not all grey).
- **FR-028**: The sidebar MUST use a brand colour accent rather than a plain white background.

**Gitignore**

- **FR-029**: A root-level .gitignore MUST cover Docker, IDE, environment, and OS patterns.
- **FR-030**: frontend/.gitignore MUST cover node_modules, dist, .env*, coverage, and build artifacts.
- **FR-031**: backend/.gitignore MUST cover __pycache__, *.pyc, .venv, .env*, dist, and egg-info patterns.

**Documentation**

- **FR-032**: Three README.md files MUST exist (root, frontend/, backend/) each with setup and usage instructions compatible with Node 22.17.1 / npm 10.9.2.
- **FR-033**: docs/demo-guide.md MUST provide a complete step-by-step CRM walkthrough (8 stages: login through email compose).
- **FR-034**: docs/e2e-demo-guide.md MUST explain how to run Playwright tests, add new tests, and include 3 worked examples.

**Profile/Settings Page**

- **FR-035**: The /profile page (also accessible via /settings alias) MUST display the current user's email, display name, and role for all logged-in users.
- **FR-036**: Admin users on /profile MUST see a "Users" tab that embeds the user management table.

**Sorting & Filtering**

- **FR-037**: All CRM list endpoints (accounts, contacts, leads, opportunities, activities) MUST accept `sort_by` (field name) and `sort_dir` (asc|desc) query parameters. Invalid `sort_by` values MUST fall back to `created_at` descending.
- **FR-038**: The accounts list endpoint MUST accept a `search` query parameter for partial name match.
- **FR-039**: The contacts list endpoint MUST accept a `search` query parameter for partial first/last name or email match. It already accepts `account_id`; this remains.
- **FR-040**: The leads list endpoint MUST accept a `search` parameter for name/email/company match. It already accepts `status`; this remains.
- **FR-041**: The opportunities list endpoint already accepts `stage`, `account_id`, `contact_id`; it MUST additionally accept `sort_by` (value, expected_close_date, created_at) and `sort_dir`.
- **FR-042**: The activities list endpoint MUST accept `sort_by` (due_date, created_at) and `sort_dir` in addition to existing filters.
- **FR-043**: The users list endpoint MUST accept `role` and `is_active` filter parameters and `sort_by` (email, created_at) and `sort_dir`.

**Profile Navigation**

- **FR-044**: The NavSidebar MUST display the current user's display name (or email) and role badge at the bottom, as a clickable link to /profile.
- **FR-045**: The /profile page MUST allow the logged-in user to update their display name via PATCH /api/v1/users/me.

### Key Entities

- **User**: id, email, hashed_password, display_name (nullable), role (admin|manager|sales_rep), is_active, created_at, updated_at.
- **JWT Payload**: sub (user id), email, role, exp (Unix timestamp).
- **AuthToken (in-memory)**: access_token string, decoded payload (role, email, sub, exp).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with no prior knowledge can log in with a seed credential and reach the dashboard in under 30 seconds.
- **SC-002**: All three role types (Admin, Manager, Sales Rep) can be exercised end-to-end with the three seed users without any manual database changes.
- **SC-003**: Backend role enforcement passes: 100% of role-restricted API calls return 403 when made by an unauthorised role.
- **SC-004**: JWT token is not readable from browser storage (localStorage, sessionStorage, cookies) — confirmed by browser devtools inspection.
- **SC-005**: Restarting Docker containers (without `-v`) preserves 100% of previously created CRM records.
- **SC-006**: The demo-guide.md can be followed from start to finish without any step failing or requiring clarification.
- **SC-007**: `docker compose up` starts the full stack from a clean environment in under 3 minutes.
- **SC-008**: All three .gitignore files pass a review confirming no secrets, build artifacts, or dependency directories are committed.
- **SC-009**: Any list page can be filtered to a single record by searching for a known value in under 2 seconds; the empty state is shown when no records match.
- **SC-010**: The current user's profile is reachable in ≤2 clicks from any CRM page via the sidebar link.

## Assumptions

- The existing FastAPI backend (Python) is the target for all backend changes; no new backend framework is introduced.
- The existing React 18 / Vite frontend is the target for all frontend changes; no framework change.
- SQLite is the primary database for development; PostgreSQL support in Docker via volume is acceptable for production Dockerfile.
- JWT signing uses HS256 algorithm with a secret key configurable via environment variable (`JWT_SECRET_KEY`).
- Password hashing uses bcrypt; minimum cost factor 12.
- The existing `/api/v1/seed` endpoint for CRM data remains unchanged; seed users is a separate operation (new endpoint or new button).
- The Sales Rep "own leads" restriction is enforced by checking `created_by` field on leads/activities; a `created_by` field will be added to those entities.
- Mobile/responsive design is out of scope — desktop-first only.
- OAuth2, SAML, or any external identity provider is explicitly out of scope; self-contained JWT auth only.
- Node 22.17.1 / npm 10.9.2 compatibility is required for all frontend tooling and Docker frontend builds.
- `python-jose[cryptography]` (or PyJWT) and `bcrypt` (or `passlib[bcrypt]`) will be added as backend dependencies.
- React Context will be used to hold the in-memory auth token; no third-party auth state library is added.
