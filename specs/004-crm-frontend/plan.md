# Implementation Plan: Sales CRM Frontend

**Branch**: `004-crm-frontend` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-crm-frontend/spec.md`

---

## Summary

Build a React 18 single-page CRM application in `frontend/` that consumes the existing FastAPI backend at `http://localhost:8000`. The app provides full CRUD UI for 6 entity types (Accounts, Contacts, Leads, Opportunities, Activities, Mock Email) plus admin tools (Seed Manager, Mock Email inbox). Layout follows the Creatio-style CRM pattern from `specs/mocks/mock1.png`: persistent left nav, entity detail pages with profile sidebar + horizontal tab strip + action header, Kanban pipeline board for opportunities. No authentication; all data from the live API.

---

## Technical Context

**Language/Version**: TypeScript 5.4 / Node.js 22.17.1 (LTS 22.x) / npm 10.9.2

**Primary Dependencies**:
- `react` 18.3 + `react-dom` 18.3 — UI component model
- `react-router-dom` 6.24 — routing (`createBrowserRouter`, Data Router)
- `@tanstack/react-query` 5.50 — server state, caching, optimistic updates
- `axios` 1.7 — HTTP client (base URL from env, interceptors for error unwrapping)
- `tailwindcss` 3.4 — utility-first CSS
- `react-hook-form` 7.52 — form state + validation (no controlled inputs everywhere)
- `@tanstack/react-table` 8.17 — headless table (sorting, pagination)
- `recharts` 2.12 — dashboard pipeline bar chart
- `lucide-react` 0.400 — icon set (Phone, Mail, Calendar, etc.)
- `sonner` 1.5 — toast notifications (3-second auto-dismiss)
- `@radix-ui/react-dialog` 1.1 — accessible modal/dialog primitive
- `vite` 5.4 — dev server + build (serves on `localhost:5173`)
- `vitest` 2.0 + `@testing-library/react` 16 + `jsdom` — unit tests
- `playwright` 1.46 — integration/e2e tests (Chromium headless)

**Storage**: None client-side (React Query cache is in-memory only; no localStorage except view-mode toggle for pipeline board)

**Testing**:
- Unit: `vitest` + `@testing-library/react` — pure logic (formatters, state machine, metrics)
- Integration/E2E: `playwright` against the live backend (requires backend running + seeded)

**Target Platform**: Desktop browsers — Chrome 120+, Firefox 120+, Edge 120+

**Project Type**: Single-page web application

**Performance Goals**:
- First Contentful Paint ≤ 2 seconds on localhost connection (SC-002)
- Client-side KPI computation ≤ 10ms
- All mutation responses reflected in UI without full page reload

**Constraints**:
- `engines.node: ">=18"` declared in `package.json` (enforces Node 22.x compatibility)
- No `--legacy-peer-deps` on `npm install`
- `VITE_API_BASE_URL` env var controls backend URL (default `http://localhost:8000`)
- No hardcoded data in any component — every piece of displayed data fetched from API (FR-003)
- Backend CORS already configured for `http://localhost:5173`

**Scale/Scope**: 12 routes, 6 entity modules, ~40 components, 22 unit test cases, 30 e2e test cases

---

## Constitution Check

*The project constitution file contains placeholder template content only — no active governance rules apply. All spec-derived gates evaluated below.*

| Gate | Status | Basis |
|------|--------|-------|
| No hardcoded data anywhere in UI | PASS | FR-003; spec Assumption |
| All API errors surfaced as readable messages | PASS | FR-038; SC-004 |
| Node >=18 enforced via package.json | PASS | Spec Assumption (Node 22.17.1 clarification) |
| All list pages show empty state | PASS | FR-041 |
| Lead state machine enforced client + server | PASS | FR-016; TC-U001–TC-U006 |
| No `--legacy-peer-deps` on install | PASS | Spec Assumption |
| All mutations show loading + success/error feedback | PASS | FR-036, FR-037, FR-039 |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-crm-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 — library selections and rationale
├── data-model.md        # Phase 1 — TypeScript interfaces, query keys, state machine
├── quickstart.md        # Phase 1 — validation guide (run after backend seeded)
├── contracts/
│   ├── api.md           # Backend API endpoint contracts (request/response)
│   └── components.md    # Shared UI component prop contracts
└── tasks.md             # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code

```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts               # Axios instance (baseURL from env, error interceptor)
│   │   ├── accounts.ts             # Account CRUD
│   │   ├── contacts.ts             # Contact CRUD + filter by account_id
│   │   ├── leads.ts                # Lead CRUD + PATCH status + POST convert
│   │   ├── opportunities.ts        # Opportunity CRUD + filter
│   │   ├── activities.ts           # Activity CRUD + filter
│   │   ├── email.ts                # Mock email send/list/get/filter/clear
│   │   └── seed.ts                 # POST /seed, DELETE /seed
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx           # Status/stage color badges (lead, opportunity)
│   │   │   ├── Button.tsx          # Primary/secondary/destructive variants
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx      # Empty list with descriptive message + CTA button
│   │   │   ├── ErrorBanner.tsx     # Surfaces API `detail` field as readable message
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Modal.tsx           # Radix Dialog wrapper for create/edit forms
│   │   │   └── Pagination.tsx      # Page controls (prev/next + page count)
│   │   └── layout/
│   │       ├── AppShell.tsx        # Root layout: left nav + main content area
│   │       ├── NavSidebar.tsx      # Navigation links (Dashboard, Accounts, …, Admin)
│   │       ├── DetailHeader.tsx    # "Name, Company" title + action buttons (Log, Compose)
│   │       ├── ProfileSidebar.tsx  # Left sidebar on detail pages (avatar, name, meta fields)
│   │       └── TabStrip.tsx        # Horizontal tab nav for detail page sections
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── KpiCard.tsx         # Individual metric card (label + value)
│   │   │   ├── ActivityFeed.tsx    # 5 most recent activities with type icon
│   │   │   └── PipelineFunnel.tsx  # Recharts bar chart — value by stage
│   │   ├── accounts/
│   │   │   ├── AccountsPage.tsx    # List + search + create modal
│   │   │   ├── AccountDetail.tsx   # Tabs: Contacts, Opportunities
│   │   │   ├── AccountForm.tsx     # Create/edit form (React Hook Form)
│   │   │   └── useAccounts.ts      # React Query hooks (list, get, create, update, delete)
│   │   ├── contacts/
│   │   │   ├── ContactsPage.tsx    # List + account filter + create modal
│   │   │   ├── ContactDetail.tsx   # CRM layout: DetailHeader + ProfileSidebar + TabStrip
│   │   │   ├── ContactForm.tsx
│   │   │   ├── ContactOverviewTab.tsx  # Days since contact + linked opportunity
│   │   │   ├── ContactHistoryTab.tsx   # Activity timeline
│   │   │   ├── ContactEmailsTab.tsx    # Mock inbox filtered by contact.email
│   │   │   └── useContacts.ts
│   │   ├── leads/
│   │   │   ├── LeadsPage.tsx       # List + status tab filter + create modal
│   │   │   ├── LeadDetail.tsx      # Status badge + transition control + convert button
│   │   │   ├── LeadForm.tsx
│   │   │   ├── LeadStatusControl.tsx  # Dropdown showing only valid next states
│   │   │   └── useLeads.ts
│   │   ├── opportunities/
│   │   │   ├── OpportunitiesPage.tsx   # Board/table toggle
│   │   │   ├── PipelineBoard.tsx       # Kanban columns by stage
│   │   │   ├── PipelineTable.tsx       # Flat table with filters
│   │   │   ├── OpportunityDetail.tsx   # Activity timeline + Log activity button
│   │   │   ├── OpportunityForm.tsx
│   │   │   └── useOpportunities.ts
│   │   ├── activities/
│   │   │   ├── ActivitiesPage.tsx      # Unified timeline + type/contact/opp filter
│   │   │   ├── ActivityTimeline.tsx    # List with type icons
│   │   │   ├── ActivityForm.tsx        # Requires contact OR opportunity (validated)
│   │   │   └── useActivities.ts
│   │   ├── email/
│   │   │   ├── EmailInboxPage.tsx      # List + filter by recipient
│   │   │   ├── EmailDetail.tsx         # Full email view (body / html_body)
│   │   │   ├── ComposeEmailForm.tsx    # Send new mock email
│   │   │   └── useEmail.ts
│   │   └── admin/
│   │       ├── SeedManagerPage.tsx     # Seed + Clear buttons + result counts panel
│   │       └── useSeed.ts
│   ├── hooks/
│   │   └── useConfirmDialog.ts     # Confirm-before-delete pattern
│   ├── router/
│   │   └── index.tsx               # createBrowserRouter — all 12 routes
│   ├── types/
│   │   ├── api.ts                  # Backend response interfaces (matches seed-data-reference.md)
│   │   └── ui.ts                   # UI-only types (tab IDs, filter state, board view mode)
│   ├── utils/
│   │   ├── formatters.ts           # formatCurrency, formatDate, formatRelativeDate
│   │   ├── leadStateMachine.ts     # VALID_TRANSITIONS, getNextStates, canConvert
│   │   └── metrics.ts              # computeWeightedPipeline, computeWinRate, computeDaysSince
│   ├── queryKeys.ts                # Centralized React Query key factory
│   ├── main.tsx                    # Entry: React.render + QueryClientProvider + RouterProvider
│   └── App.tsx                     # <Outlet> inside AppShell
├── tests/
│   ├── unit/
│   │   ├── leadStateMachine.test.ts   # TC-U001–TC-U006
│   │   ├── formatters.test.ts         # TC-U007–TC-U009, TC-U015–TC-U016
│   │   └── metrics.test.ts            # TC-U010–TC-U014, TC-U017–TC-U022
│   └── e2e/
│       ├── dashboard.spec.ts          # TC-I001–TC-I002
│       ├── accounts.spec.ts           # TC-I003–TC-I005
│       ├── contacts.spec.ts           # TC-I006–TC-I011
│       ├── leads.spec.ts              # TC-I012–TC-I014
│       ├── opportunities.spec.ts      # TC-I015–TC-I018
│       ├── activities.spec.ts         # TC-I019–TC-I021
│       ├── email.spec.ts              # TC-I022–TC-I024
│       └── seed.spec.ts               # TC-I025–TC-I030
├── index.html
├── package.json                       # engines.node >= 18
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                     # test: vitest config inline
├── tailwind.config.ts
├── playwright.config.ts               # baseURL: http://localhost:5173
└── .env.local                         # VITE_API_BASE_URL=http://localhost:8000
```

**Structure Decision**: Option 2 (Web application). Backend already exists in `backend/`. Frontend is a new `frontend/` directory at repo root with Vite-scaffolded React + TypeScript. Feature-based directory structure inside `src/features/` groups all files for a given entity (page, form, detail, hooks) rather than splitting by type — avoids cross-directory imports for closely related code.

---

## Phase 0 Research Output

See [research.md](research.md)

## Phase 1 Design Output

See [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [contracts/components.md](contracts/components.md), [quickstart.md](quickstart.md)
