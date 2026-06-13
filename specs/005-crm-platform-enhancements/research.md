# Research: CRM Platform Enhancement Suite

**Feature**: `005-crm-platform-enhancements`
**Date**: 2026-06-13

---

## Decision 1: JWT Library (Backend)

**Decision**: `python-jose[cryptography]` with HS256 algorithm.

**Rationale**: python-jose is the most widely used JWT library in FastAPI projects. The FastAPI official docs use it in their OAuth2 tutorial. It supports HS256 natively, handles claims validation (exp, sub), and integrates cleanly with Pydantic and FastAPI dependency injection. PyJWT is a valid alternative but requires more boilerplate.

**Alternatives considered**:
- `PyJWT` — also excellent; slightly simpler API but less FastAPI-native documentation. Either works.
- `authlib` — overkill; designed for full OAuth2 flows.

**Outcome**: Add `python-jose[cryptography]>=3.3.0` to backend/requirements.txt.

---

## Decision 2: Password Hashing

**Decision**: `passlib[bcrypt]` with bcrypt backend, `CryptContext(schemes=["bcrypt"], deprecated="auto")`.

**Rationale**: passlib provides a clean, future-proof API. The bcrypt backend has cost factor 12 by default (configurable). Using passlib rather than calling bcrypt directly makes it easy to add multiple schemes later (e.g., argon2). The `deprecated="auto"` setting automatically marks old schemes as needing rehash.

**Alternatives considered**:
- Raw `bcrypt` package — works but passlib wrapper is cleaner and more idiomatic.
- `argon2-cffi` — stronger but overkill for a CRM demo; bcrypt at factor 12 is appropriate.

**Outcome**: Add `passlib[bcrypt]>=1.7.4` to backend/requirements.txt.

---

## Decision 3: JWT Token Storage (Frontend)

**Decision**: Store access token in a JavaScript module-level variable inside `AuthContext`. This is an in-memory store — it survives re-renders but is wiped on page reload (which also clears the session). A `useRef` or module singleton is appropriate.

**Rationale**: The spec requires JWT NOT in localStorage or sessionStorage. Module-level state (React Context) satisfies this. The tradeoff is that page reload logs the user out — acceptable for a CRM demo context.

**Alternatives considered**:
- `httpOnly` cookie — ideal for production (XSS-safe), but requires CORS + SameSite cookie config changes to the FastAPI backend; adds complexity not justified for this scope.
- `sessionStorage` — slightly better than localStorage for XSS but still accessible from JS. Spec explicitly prohibits browser storage.

**Outcome**: `AuthContext` provides `{ token, login, logout, user }`. `token` is stored in `useRef` inside the provider component.

---

## Decision 4: RBAC Enforcement Pattern (Backend)

**Decision**: FastAPI dependency injection with a reusable `get_current_user` dependency that validates the JWT, and role-specific guard dependencies: `require_admin`, `require_manager_or_above`, `require_any_role`.

**Rationale**: FastAPI's `Depends()` system is the canonical way to protect endpoints. A single `get_current_user` dependency decodes the JWT and returns the user object. Layered role guards then wrap it. This avoids decorators or middleware and makes role requirements visible in function signatures.

**Alternatives considered**:
- FastAPI middleware — can check JWT but cannot easily pass decoded user to route handlers without request state.
- `casbin` or `oso` RBAC libraries — significant overhead for 3 roles.

**Outcome**: `app/auth/dependencies.py` provides `get_current_user`, `require_admin`, `require_manager_or_above`, `require_any_authenticated`.

---

## Decision 5: Sales Rep Ownership Tracking

**Decision**: Add `created_by_user_id` (String, FK to users.id, nullable) to the `leads` and `activities` tables. The `lead_service.create_lead` and `activity_service.create_activity` functions accept the current user's ID from the auth dependency.

**Rationale**: Sales Reps can only edit their own leads/activities. Without a `created_by` field there is no way to enforce this. The field is nullable to allow backward compatibility with records created before auth existed (pre-migration data is admin-owned by convention).

**Alternatives considered**:
- Store ownership in a separate `resource_ownership` table — unnecessarily complex for 2 entity types.

**Outcome**: Alembic migration adds `created_by_user_id` to `leads` and `activities`.

---

## Decision 6: Docker Stack

**Decision**: Multi-stage Dockerfile for backend (Python 3.12-slim). Single-stage Dockerfile for frontend (node:22-alpine for build, nginx:alpine for serve). `docker-compose.yml` at project root. Named volume `crm_db_data` mounted at `/app/data` in the backend container with `DATABASE_URL=sqlite+aiosqlite:///./data/crm.db`.

**Rationale**: SQLite is already the database. Storing the `.db` file on a named volume is the simplest approach that satisfies the persistence requirement. Named volumes (not bind mounts) survive `docker compose down` and only disappear with `docker compose down -v`.

**Alternatives considered**:
- PostgreSQL in Docker — valid for production but adds `asyncpg` dependency and a third service; overkill for the demo spec.
- Bind mount to host path — works but causes permission issues on Windows/Linux differences.

**Outcome**: `docker-compose.yml` defines `backend`, `frontend`, and `volumes: crm_db_data`.

---

## Decision 7: Frontend Auth State & Axios Integration

**Decision**: `AuthProvider` wraps the entire app. Axios request interceptor reads from a shared module-level `tokenStore` (simple object `{ token: string | null }`). The `AuthProvider` calls `tokenStore.setToken(token)` on login so the interceptor can attach `Authorization: Bearer`.

**Rationale**: Axios interceptors are callbacks and cannot directly access React Context. The cleanest pattern is a module-level singleton (`tokenStore.ts`) that both the AuthContext and the Axios interceptor can import. This avoids passing refs to the interceptor.

**Alternatives considered**:
- Axios `defaults.headers` — works but requires resetting on logout.
- `axios.create()` per request — verbose and loses instance-level interceptor benefits.

**Outcome**: `src/api/tokenStore.ts` (singleton), `src/api/client.ts` (interceptor reads from tokenStore), `src/contexts/AuthContext.tsx` (updates tokenStore on login/logout).

---

## Decision 8: UI Brand Colours

**Decision**: Use a deep indigo/navy primary colour (`#1e3a5f` or Tailwind `indigo-900`) for the sidebar background with white text and `indigo-500` accent highlights. Status badges get explicit colour mappings: new=blue, contacted=yellow, qualified=green, lost=red; opportunity stages: prospecting=slate, qualification=blue, proposal=indigo, negotiation=orange, closed-won=green, closed-lost=red.

**Rationale**: Matches a professional CRM aesthetic without custom CSS (uses Tailwind utilities). Indigo-navy is distinctive and consistent with enterprise SaaS (Salesforce, HubSpot influence).

**Alternatives considered**:
- CSS custom properties — valid but adds complexity vs Tailwind.
- Purple brand colour — too similar to Figma/Notion aesthetic.

**Outcome**: `tailwind.config.ts` extended with `brand` colour. `Badge.tsx` and `NavSidebar.tsx` updated.

---

## Decision 9: README Approach

**Decision**: Three README files — `README.md` (root), `frontend/README.md`, `backend/README.md`. Content focuses on quick-start commands only, not architecture deep-dives. Root README links to the two sub-READMEs and the specs directory.

**Rationale**: Developers typically land at the root README first, then navigate to the sub-project. Three files keep each README focused and short. Commands are verified against Node 22.17.1 / npm 10.9.2 and Python 3.12.

**Outcome**: Three README.md files written to root, `frontend/`, and `backend/`.

---

## Decision 10: Gitignore Strategy

**Decision**: Root `.gitignore` covers shared patterns (Docker, IDE, OS). `frontend/.gitignore` covers JS/TS patterns. `backend/.gitignore` covers Python patterns. No consolidation into one file — keeps each project self-contained.

**Rationale**: Monorepo with two distinct technology stacks; separate ignore files per directory is cleaner than one massive root file that needs path prefixes.

**Outcome**: Three `.gitignore` files (root, frontend/, backend/).

---

## Decision 11: Database Clear Endpoint

**Decision**: New route `DELETE /api/v1/admin/clear` (Admin role required) that deletes all rows from leads, contacts, accounts, opportunities, activities, and email_messages tables but leaves the users table intact.

**Rationale**: The existing `DELETE /api/v1/seed/` clears everything including seed data. The new endpoint is admin-only and preserves users so the admin can still log in after a clear. It is separate from the seed endpoint to avoid confusion.

**Outcome**: New router `app/routers/admin.py` with `/api/v1/admin/clear` endpoint.

---

## Decision 12: Mock Email Notification on Lead Create

**Decision**: Call `mock_email_service.send_email(db, ...)` at the end of `lead_service.create_lead()`, fire-and-forget style (no exception if email fails — log warning only). Hardcoded `TO: crm-leads@company.internal`, `FROM: crm-system@company.internal`.

**Rationale**: The existing `mock_email_service` already handles this. Calling it from the service layer keeps the router clean. Fire-and-forget ensures lead creation is not blocked by email failures.

**Outcome**: `lead_service.create_lead()` calls `mock_email_service.send_email()` after committing the lead.

---

## Decision 13: Sorting & Filtering Architecture (Backend)

**Decision**: Add optional `sort_by: str | None`, `sort_dir: Literal['asc', 'desc'] = 'desc'`, and entity-specific `search: str | None` query params to each `list_*` service function. Sorting is applied via `SQLAlchemy`'s `.order_by()` with a whitelist of allowed columns per entity. `search` uses `ilike('%value%')` applied with `OR` across relevant string columns. An invalid `sort_by` silently falls back to `created_at`.

**Rationale**: The SQLAlchemy 2.0 async pattern already in use makes adding `order_by()` trivial. `ilike` is SQLite/PostgreSQL compatible. A whitelist (dict mapping param value → SQLAlchemy column) prevents SQL injection via sort_by param. Keeping all logic in the service layer (not the router) keeps routers thin.

**Alternatives considered**:
- ORM-level `@hybrid_property` for search — overkill; ilike is sufficient.
- Full-text search (FTS5 in SQLite) — better for large datasets but unnecessary at CRM demo scale.
- Client-side filtering — defeats pagination; not acceptable when data may exceed one page.

**Outcome**: Each `list_*` function accepts `sort_by`, `sort_dir`, and (where relevant) `search` params. Sort whitelists defined per entity in each service file.

---

## Decision 14: Sorting & Filtering Architecture (Frontend)

**Decision**: A shared `useSortFilter()` hook manages search/sort/filter state. State is stored in React state (not URL params) for simplicity — URL sync is a future enhancement. `SortFilterBar` is a reusable compound component accepting `search`, `sortOptions`, and `filters` prop groups; unused sections are omitted by not passing their props. Filter state is passed as `queryParams` to the entity's React Query hook, which forwards them to the Axios call.

**Rationale**: Centralising sort/filter state in a custom hook avoids prop-drilling and keeps list pages thin. Not syncing to URL params keeps the implementation simple; the CRM is primarily used in single-session workflows where URL sharing is not a priority.

**Alternatives considered**:
- URL query param sync (React Router `useSearchParams`) — cleaner for sharing URLs; adds complexity. Can be added later.
- @tanstack/react-table column sorting — good for client-side but we want server-side pagination + sort.
- Generic filter sidebar — too complex; inline toolbar chips are faster to use for 2-3 filter options.

**Outcome**: `src/hooks/useSortFilter.ts` + `src/components/ui/SortFilterBar.tsx`. Each list page wires them up with entity-specific options.

---

## Decision 15: Profile Page Navigation

**Decision**: Route `/profile` is the canonical profile page. `/settings` is a redirect alias. The `NavSidebar` bottom section (below main nav links) shows a clickable user card (avatar initials + display_name/email + role badge) that links to `/profile`. A separate logout icon button sits to the right of the user card.

**Rationale**: Putting the profile link in the sidebar bottom is the industry-standard pattern (Slack, Linear, Notion). It is always visible without occupying a main nav slot. The display_name update is handled via `PATCH /api/v1/users/me` — a self-service endpoint that only allows display_name (not role or active status) to prevent privilege escalation.

**Alternatives considered**:
- Top-right user menu dropdown — also common but requires an extra click; sidebar bottom is always visible.
- Profile as a main nav link (e.g., "Profile" alongside "Dashboard") — wastes nav space for something accessed rarely.

**Outcome**: `NavSidebar` bottom user card → `/profile`. `ProfilePage` with inline display_name edit. New `PATCH /api/v1/users/me` endpoint.

---

## Decision 16: Responsive Design Strategy (US16)

**Decision**: Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`, `xl:` prefixes) applied directly in component JSX. Breakpoints: `sm=640px` (large phone), `md=768px` (tablet), `lg=1024px` (laptop), `xl=1280px` (desktop). Layout uses CSS Grid for page-level structures and Flexbox for component-level arrangements. No new npm packages — standard Tailwind config is sufficient.

**Rationale**: Tailwind's responsive prefix system (`md:grid-cols-2`, `lg:flex`) is the lowest-friction way to add responsiveness to an existing Vite/React project. No additional CSS framework or layout library needed. The plan constraint "No new frontend npm packages" is maintained.

**Alternatives considered**:
- CSS custom media queries with `@apply` — verbose, loses JIT benefits.
- `react-responsive` package — adds a dependency and JS-based breakpoints that flash on SSR (not applicable here but bad habit).
- CSS Grid named areas — too rigid for a CRM where content varies.

**Outcome**: All page layouts use Tailwind responsive utilities. Sidebar collapses to icon-only at `<lg`. Login page uses two-panel layout on `lg+`, single-column centred card on `<lg`.

---

## Decision 17: Login Page Layout (US16)

**Decision**: Two-panel layout on `lg+` screens (left panel = brand/hero ~40% width with indigo gradient + tagline, right panel = login form ~60% width). On `md` and below: single-column centred card (max-width 420px, full-height vertically centred). Logo appears in both layouts. Form uses `react-hook-form` (already in use for existing forms in codebase).

**Rationale**: Two-panel login pages are the modern SaaS standard (HubSpot, Zoho, Freshdesk). The brand panel communicates product identity even before login. On small screens, the full-screen card is the cleanest UX — no panel clutter. No new libraries needed.

**Alternatives considered**:
- Fullscreen background image — requires external image asset; no asset pipeline defined.
- Single card on all sizes — simpler but not modern enough for the stated goal.

**Outcome**: `LoginPage.tsx` redesigned with responsive two-panel layout. Brand panel reuses `indigo-900` brand colour. Left panel hidden on `<lg`.

---

## Decision 18: Sidebar Collapsible Behaviour (US16)

**Decision**: Sidebar has two states: `expanded` (240px wide, icon + text labels) and `collapsed` (64px wide, icons only with Tooltip on hover). Toggle trigger is a chevron button at the top-right edge of the sidebar. Collapsed state is persisted in `localStorage` key `crm-sidebar-collapsed` so it survives page reloads. On `<md` screens the sidebar becomes a slide-in drawer triggered by a hamburger button in the top bar.

**Rationale**: Icon-only collapse is the CRM industry standard (Salesforce, Zoho). It maximises content area on laptop screens (1366×768 is the most common) without hiding nav entirely. Persistence in localStorage for sidebar state (not auth token) is safe and improves UX.

**Alternatives considered**:
- Hide sidebar entirely on collapse — loses discoverability.
- CSS `transition: width` only — no `localStorage` persistence; sidebar resets on every page load.
- Drawer on desktop — not appropriate for primary navigation.

**Outcome**: `NavSidebar.tsx` gains `collapsed` state, chevron toggle, CSS `transition-all duration-200`, and tooltip-on-hover for icon labels. Mobile: drawer via `fixed inset-0` overlay + `translate-x-0/-translate-x-full` CSS toggle.

---

## Decision 19: Skeleton Loaders (US16)

**Decision**: Skeleton loaders built with Tailwind `animate-pulse` utility on `<div>` placeholders. Implemented as thin wrapper components per pattern: `SkeletonCard`, `SkeletonRow`, `SkeletonText`. Applied on all TanStack Query `isLoading` states for: all 6 list pages, Dashboard KPI cards, Detail page headers.

**Rationale**: Tailwind `animate-pulse` provides a pulsing grey shimmer with zero JS or external library. Matching the approximate shape of the loaded content reduces layout shift. TanStack Query's `isLoading` boolean is already available at every data-fetching point.

**Alternatives considered**:
- `react-loading-skeleton` npm package — polished but adds dependency.
- CSS spinner — less informative (no shape hint), already used for button loading states.
- Content-area fade-in only — no skeleton, still better than nothing but not "polished".

**Outcome**: `src/components/ui/Skeleton.tsx` exports `SkeletonCard`, `SkeletonRow`, `SkeletonText`. Each list page replaces `{isLoading && <Spinner>}` with `{isLoading && <SkeletonRow count={5} />}`. Dashboard replaces inline spinner with `<SkeletonCard count={4} />`.

---

## Decision 20: Design Token System (US16)

**Decision**: Extend `tailwind.config.ts` with a structured design token layer: `colors.brand.*`, `colors.surface.*`, `borderRadius.card`, `boxShadow.card`, `boxShadow.dropdown`. Typography scale uses Tailwind's existing `text-sm/base/lg/xl` — no custom font sizes. Inter font loaded via `@fontsource/inter` — EXCEPTION: this single package is added to satisfy the enterprise-grade typography requirement. All other npm constraints remain.

**Rationale**: A token layer in Tailwind config ensures visual consistency without per-component overrides. `@fontsource/inter` is a small, tree-shaken font package (no CDN dependency, works offline in Docker) and Inter is the industry-standard SaaS UI font (Linear, Vercel, GitHub). This is the only justified exception to the no-new-packages rule.

**Alternatives considered**:
- Google Fonts CDN `<link>` tag — requires network; fails in offline Docker demo.
- System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`) — acceptable fallback but inconsistent cross-platform.
- No custom font — does not meet "enterprise-grade" bar.

**Outcome**: `npm install @fontsource/inter` added as the sole new frontend package. `tailwind.config.ts` extended with full token set. `src/style.css` imports `@fontsource/inter/400.css` and `@fontsource/inter/600.css`.

---

## Decision 21: Dashboard Modernisation (US16)

**Decision**: Dashboard gets 4 KPI stat cards (Total Leads, Open Opportunities Value, Active Accounts, Activities Due Today), a pipeline funnel chart (already exists), and a recent activity feed. KPI cards use the `surface.card` token (white bg, `shadow-card`, `rounded-card`). Values use `text-2xl font-semibold`. Trend indicator (up/down arrow + % change) shown where calculable from existing data. No new chart library — Recharts already in use.

**Rationale**: KPI cards + funnel + activity feed is the canonical CRM dashboard pattern (Zoho, HubSpot). All required data is available from existing API endpoints (no new backend work). Recharts is already a dependency. The dashboard currently has minimal polish; this closes the "outdated" gap without backend changes.

**Alternatives considered**:
- Full analytics with date-range selectors — requires new backend aggregation endpoints; out of scope.
- Third-party dashboard widget library — adds heavy dependency; Recharts + Tailwind cards are sufficient.

**Outcome**: `DashboardPage.tsx` redesigned with KPI stat card row, existing `PipelineFunnel` component (recoloured), and `RecentActivityFeed` component pulling from existing activities API.

---

## Decision 22: Accessibility Standards (US16)

**Decision**: Target WCAG 2.1 AA compliance for all new and modified components. Minimum requirements: colour contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text and UI components; all interactive elements keyboard-accessible (visible focus ring); all images and icons have `aria-label` or `aria-hidden`; form fields have associated `<label>` elements.

**Rationale**: WCAG 2.1 AA is the legal and industry standard for enterprise SaaS. The brief explicitly requires accessibility standards. The indigo/white colour scheme with proper contrast ratios satisfies AA automatically for most text combinations.

**Alternatives considered**:
- WCAG 2.2 AA — slight increment with minor new criteria (target size, focus appearance); not yet universally required.
- WCAG AAA — too strict; prohibits some colour combinations used in the brand palette.

**Outcome**: Tailwind focus utilities (`focus-visible:ring-2 focus-visible:ring-indigo-500`) applied to all buttons, links, and form controls. Contrast ratios validated in `tailwind.config.ts` colour token definitions.
