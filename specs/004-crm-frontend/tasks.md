# Tasks: Sales CRM Frontend

**Input**: Design documents from `specs/004-crm-frontend/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Included — spec explicitly requires unit tests (TC-U001–TC-U022) and e2e integration tests (TC-I001–TC-I030).

**Organization**: Tasks are grouped by user story (US1–US7) to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1–US7)
- All paths are relative to repo root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Scaffold the Vite + React + TypeScript project, install all dependencies, configure tooling.

- [x] T001 Scaffold Vite project in `frontend/` with React + TypeScript template: `npm create vite@latest frontend -- --template react-ts`
- [x] T002 Install all npm dependencies in `frontend/`: react-router-dom, @tanstack/react-query, axios, tailwindcss, react-hook-form, @tanstack/react-table, recharts, lucide-react, sonner, @radix-ui/react-dialog, vitest, @testing-library/react, jsdom, playwright (per research.md §1–12)
- [x] T003 [P] Configure TailwindCSS in `frontend/tailwind.config.ts` and `frontend/src/index.css` (directives: base, components, utilities)
- [x] T004 [P] Configure TypeScript in `frontend/tsconfig.json` and `frontend/tsconfig.node.json` with strict mode, path aliases (`@/` → `src/`)
- [x] T005 [P] Configure Vite with inline Vitest settings in `frontend/vite.config.ts` (test.environment: jsdom, test.globals: true, test.include: tests/unit)
- [x] T006 [P] Configure Playwright in `frontend/playwright.config.ts` (baseURL: http://localhost:5173, testDir: tests/e2e, project: chromium)
- [x] T007 [P] Add `engines.node: ">=18"` to `frontend/package.json` and define npm scripts: dev, build, preview, test:unit, test:unit:watch, test:e2e, test:e2e:ui, typecheck, lint
- [x] T008 Create `frontend/.env.local` with `VITE_API_BASE_URL=http://localhost:8000` and `frontend/.env.local.example` as a committed template
- [x] T009 [P] Create `frontend/.gitignore` covering: `node_modules/`, `dist/`, `.env.local`, `playwright-report/`, `test-results/`, `.vite/`

**Checkpoint**: `cd frontend && npm run dev` starts without errors on http://localhost:5173

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, API client, utilities, and layout components that ALL user stories depend on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: Complete this phase before starting any user story phase.

### Types & API Foundation

- [x] T010 Create all backend response TypeScript interfaces in `frontend/src/types/api.ts` (Account, Contact, Lead, Opportunity, Activity, EmailMessage, SeedResult, PaginatedResponse — exactly as defined in data-model.md §1)
- [x] T011 [P] Create UI-only TypeScript types in `frontend/src/types/ui.ts` (ContactTab, AccountTab, PipelineView, LeadStatusFilter, ActivityTypeFilter, all ListParams interfaces — per data-model.md §2)
- [x] T012 Create Axios base client in `frontend/src/api/client.ts` with baseURL from `import.meta.env.VITE_API_BASE_URL`, Content-Type header, and response interceptor that unwraps `error.response.data.detail` into a plain human-readable `Error.message` (per contracts/api.md §Error Response Shape)
- [x] T013 [P] Create React Query key factory in `frontend/src/queryKeys.ts` (all entity keys: accounts, account, contacts, contact, leads, lead, opportunities, opportunity, activities, activity, emails, email — per data-model.md §3)

### Utility Functions

- [x] T014 [P] Implement lead status state machine in `frontend/src/utils/leadStateMachine.ts` (VALID_TRANSITIONS map, getNextStates, canConvert, hasTransitions — per data-model.md §4)
- [x] T015 [P] Implement date and currency formatters in `frontend/src/utils/formatters.ts` (formatCurrency, formatRelativeDate, formatDate, formatProbability — per data-model.md §6)
- [x] T016 [P] Implement derived metrics in `frontend/src/utils/metrics.ts` (computeWeightedPipeline, computeOpenPipeline, computeWinRate, computeActiveLeadCount, computeDaysSinceLastContact — per data-model.md §5)

### Shared UI Components

- [x] T017 [P] Implement `Badge` component in `frontend/src/components/ui/Badge.tsx` with color variants for lead status (new=blue, contacted=amber, qualified=green, lost=gray), opportunity stage (prospecting=slate, proposal=blue, negotiation=amber, closed-won=green, closed-lost=red), and activity type (per research.md §14–15)
- [x] T018 [P] Implement `Button` component in `frontend/src/components/ui/Button.tsx` with variants: primary, secondary, destructive, ghost; sizes: sm, md, lg; loading spinner + disabled state
- [x] T019 [P] Implement `Card`, `EmptyState`, `ErrorBanner`, `LoadingSpinner` in `frontend/src/components/ui/` (EmptyState: title + optional description + optional CTA button; ErrorBanner: message + optional Retry + optional Dismiss)
- [x] T020 [P] Implement `Modal` component in `frontend/src/components/ui/Modal.tsx` wrapping @radix-ui/react-dialog (focus trap, Escape key, backdrop click close, size variants sm/md/lg)
- [x] T021 [P] Implement `Pagination` component in `frontend/src/components/ui/Pagination.tsx` (page prop 1-indexed, total records, size, onChange; shows "Showing X–Y of Z"; renders null when total ≤ size)
- [x] T022 Implement `AppShell` layout in `frontend/src/components/layout/AppShell.tsx` (fixed left NavSidebar + scrollable main content area using React Router `<Outlet>`)
- [x] T023 [P] Implement `NavSidebar` in `frontend/src/components/layout/NavSidebar.tsx` (links to all 12 routes; active link highlighted via useLocation(); two sections: main entities + admin tools with divider)
- [x] T024 [P] Implement `DetailHeader` in `frontend/src/components/layout/DetailHeader.tsx` (title prop for "Name, Company" pattern; optional subtitle; actions slot for buttons; optional back link)
- [x] T025 [P] Implement `ProfileSidebar` in `frontend/src/components/layout/ProfileSidebar.tsx` (initials avatar with configurable bg color; fields array with Lucide icon + label + value; value hidden when null; optional href for links)
- [x] T026 [P] Implement `TabStrip` in `frontend/src/components/layout/TabStrip.tsx` (generic typed tabs; activeTab highlighted; onChange callback; optional count badge per tab)
- [x] T027 [P] Implement `useConfirmDialog` hook in `frontend/src/hooks/useConfirmDialog.ts` (returns { confirm, ConfirmModal } — programmatic confirm-before-delete pattern used by all entity delete operations)

### Router

- [x] T028 Configure React Router `createBrowserRouter` in `frontend/src/router/index.tsx` with all 14 routes (/, /accounts, /accounts/:id, /contacts, /contacts/:id, /leads, /leads/:id, /opportunities, /opportunities/:id, /activities, /admin/mock-email, /admin/mock-email/:id, /admin/seed, * NotFoundPage)
- [x] T029 Wire `frontend/src/main.tsx` (React root render) and `frontend/src/App.tsx` (QueryClientProvider + RouterProvider wrapping AppShell)

**Checkpoint**: App loads at http://localhost:5173, nav sidebar renders all links, clicking any link navigates without 404

---

## Phase 3: User Story 1 — Pipeline Dashboard (Priority: P1) 🎯 MVP

**Goal**: Dashboard page showing live KPI cards, pipeline funnel chart, and recent activity feed — all computed from live API data.

**Independent Test** (TC-I001): Seed demo data → open `/` → verify: Total Accounts=4, Active Leads=2, Open Pipeline=$445,000, Weighted Pipeline=$237,500, Win Rate=100%, 5 activities listed with type icons.

### API Modules (required by Dashboard for multi-entity KPIs)

- [x] T030 [P] [US1] Create accounts API module in `frontend/src/api/accounts.ts` (list, get, create, update, delete — per contracts/api.md §Accounts)
- [x] T031 [P] [US1] Create leads API module in `frontend/src/api/leads.ts` (list, get, create, update, delete, patchStatus, convert — per contracts/api.md §Leads)
- [x] T032 [P] [US1] Create opportunities API module in `frontend/src/api/opportunities.ts` (list, get, create, update, delete — per contracts/api.md §Opportunities)
- [x] T033 [P] [US1] Create activities API module in `frontend/src/api/activities.ts` (list, get, create, update, delete — per contracts/api.md §Activities)

### Dashboard Implementation

- [x] T034 [P] [US1] Implement `KpiCard` component in `frontend/src/features/dashboard/KpiCard.tsx` (label, pre-formatted value string, Lucide icon, optional loading skeleton)
- [x] T035 [P] [US1] Implement `ActivityFeed` component in `frontend/src/features/dashboard/ActivityFeed.tsx` (up to 5 activities; type icon: Phone=call/Mail=email/Calendar=meeting; subject; formatRelativeDate; empty state "No recent activity")
- [x] T036 [P] [US1] Implement `PipelineFunnel` chart in `frontend/src/features/dashboard/PipelineFunnel.tsx` (Recharts BarChart — 5 bars for open stages; X=stage name; Y=total USD value; ResponsiveContainer)
- [x] T037 [US1] Implement `DashboardPage` in `frontend/src/features/dashboard/DashboardPage.tsx` (fetches accounts, leads, opportunities, activities in parallel with useQuery; computes KPIs using metrics.ts; renders KpiCard ×5 + PipelineFunnel + ActivityFeed; shows loading skeletons; ErrorBanner on fetch failure; empty state when all zeros)

### Unit Tests — Metrics

- [x] T038 [P] [US1] Write unit tests in `frontend/tests/unit/metrics.test.ts` covering: TC-U010 (weighted pipeline), TC-U011 (win rate with mixed stages), TC-U012 (win rate — no closed deals returns null), TC-U013 (days since last contact — 5 days ago), TC-U014 (days since — no activities returns null)

### E2E Tests — Dashboard

- [ ] T039 [US1] Write Playwright e2e tests in `frontend/tests/e2e/dashboard.spec.ts` covering: TC-I001 (seeded KPIs correct), TC-I002 (empty state after clear)

**Checkpoint**: Dashboard loads with all seeded KPI values. All unit tests pass (`npm run test:unit`). E2e tests TC-I001 and TC-I002 pass.

---

## Phase 4: User Story 2 — Account & Contact Management (Priority: P2)

**Goal**: Full CRUD for Accounts and Contacts with CRM-style contact detail layout (header + profile sidebar + tabs).

**Independent Test** (TC-I003): Create account "Test Co" → appears in list. (TC-I006): Create contact linked to "TechStart Inc" → detail header reads "FirstName LastName, TechStart Inc"; left sidebar shows avatar, job title, phone, email, account link.

### Accounts

- [ ] T040 [P] [US2] Implement `useAccounts` React Query hooks in `frontend/src/features/accounts/useAccounts.ts` (useAccountList, useAccount, useCreateAccount, useUpdateAccount, useDeleteAccount; cache invalidation per data-model.md §3)
- [x] T041 [P] [US2] Implement `AccountForm` (React Hook Form) in `frontend/src/features/accounts/AccountForm.tsx` (fields: name required, industry, website, phone optional; client-side required validation)
- [x] T042 [US2] Implement `AccountsPage` in `frontend/src/features/accounts/AccountsPage.tsx` (TanStack Table list with search input passing `?search=` to API; "New Account" button opens Modal with AccountForm; edit/delete per row; delete uses useConfirmDialog; account delete HTTP 409 → ErrorBanner "Cannot delete — linked contacts or opportunities exist")
- [x] T043 [US2] Implement `AccountDetail` in `frontend/src/features/accounts/AccountDetail.tsx` (DetailHeader with account name + Edit/Delete buttons; TabStrip with "Contacts" and "Opportunities" tabs; each tab fetches filtered list via `?account_id=`; EmptyState per tab when empty)

### Contacts

- [x] T044 [P] [US2] Create contacts API module in `frontend/src/api/contacts.ts` (list with account_id filter, get, create, update, delete — per contracts/api.md §Contacts)
- [ ] T045 [P] [US2] Implement `useContacts` hooks in `frontend/src/features/contacts/useContacts.ts` (useContactList, useContact, useCreateContact, useUpdateContact, useDeleteContact; invalidation rules per data-model.md §3)
- [x] T046 [P] [US2] Implement `ContactForm` in `frontend/src/features/contacts/ContactForm.tsx` (fields: first_name, last_name, email required; phone, job_title, account_id optional; account dropdown populated from accounts list; HTTP 409 on duplicate email → inline error "Email already in use")
- [x] T047 [US2] Implement `ContactsPage` in `frontend/src/features/contacts/ContactsPage.tsx` (list with account filter dropdown using `?account_id=`; "New Contact" button opens Modal with ContactForm; edit/delete per row)
- [x] T048 [US2] Implement `ContactDetail` CRM layout in `frontend/src/features/contacts/ContactDetail.tsx` (DetailHeader: title="{first_name} {last_name}, {account.name}"; actions: "Log Activity" button (pre-links contact) + "Compose Email" button (opens ComposeEmailForm pre-addressed); ProfileSidebar: initials avatar, job_title, Phone icon+phone (hidden if null), Mail icon+email, Building2 icon+account name linking to /accounts/:id; TabStrip: Overview/History/Emails)
- [ ] T049 [P] [US2] Implement `ContactOverviewTab` in `frontend/src/features/contacts/ContactOverviewTab.tsx` (fetches activities for contact via `?contact_id=`; computes computeDaysSinceLastContact; shows "N days ago" or "No contact yet"; fetches linked opportunity card via `?contact_id=` on opportunities API; shows linked opportunity summary card)
- [ ] T050 [P] [US2] Implement `ContactHistoryTab` in `frontend/src/features/contacts/ContactHistoryTab.tsx` (ActivityTimeline component with activities filtered by `?contact_id=`; reverse chronological; EmptyState when empty)
- [ ] T051 [P] [US2] Implement `ActivityTimeline` shared component in `frontend/src/features/activities/ActivityTimeline.tsx` (list of activities with type icon + subject + formatRelativeDate + notes collapsible; linked contact/opp shown as links when non-null; EmptyState with custom message prop)

### E2E Tests — Accounts & Contacts

- [ ] T052 [US2] Write Playwright e2e tests in `frontend/tests/e2e/accounts.spec.ts` covering: TC-I003 (create account), TC-I004 (delete blocked — has contacts), TC-I005 (delete success — no contacts)
- [ ] T053 [US2] Write Playwright e2e tests in `frontend/tests/e2e/contacts.spec.ts` covering: TC-I006 (create contact + CRM header), TC-I007 (duplicate email error), TC-I008 (account filter), TC-I009 (overview tab days-since), TC-I010 (history tab activities), TC-I011 (emails tab — placeholder content, full test in US6)

**Checkpoint**: Account and contact CRUD fully functional. CRM detail layout matches mock1.png. E2e tests TC-I003–TC-I011 pass.

---

## Phase 5: User Story 3 — Lead Capture & Qualification (Priority: P3)

**Goal**: Lead CRUD with status tab filtering, state-machine-aware transition control, and one-click Convert to Opportunity.

**Independent Test** (TC-I012): Create lead → advance new→contacted→qualified → click Convert → opportunity created, lead shows "Converted" badge with link.

### Implementation

- [ ] T054 [P] [US3] Implement `useLeads` hooks in `frontend/src/features/leads/useLeads.ts` (useLeadList, useLead, useCreateLead, useUpdateLead, useDeleteLead, useTransitionLeadStatus, useConvertLead; invalidation: lead status change → invalidate lead + leads; convert → invalidate lead + leads + opportunities)
- [x] T055 [P] [US3] Implement `LeadForm` in `frontend/src/features/leads/LeadForm.tsx` (fields: first_name, last_name, email required; company, source, notes, status optional)
- [ ] T056 [P] [US3] Implement `LeadStatusControl` in `frontend/src/features/leads/LeadStatusControl.tsx` (reads currentStatus, calls getNextStates(currentStatus), renders a select/button group showing only valid next states; renders nothing if hasTransitions(status)===false; calls onTransition with new status; shows loading state during mutation; HTTP 400 INVALID_LEAD_TRANSITION → error toast)
- [x] T057 [US3] Implement `LeadsPage` in `frontend/src/features/leads/LeadsPage.tsx` (status tab strip: All/New/Contacted/Qualified/Lost passing `?status=` filter; TanStack Table list; status Badge per row; "New Lead" button opens Modal with LeadForm; delete per row)
- [x] T058 [US3] Implement `LeadDetail` in `frontend/src/features/leads/LeadDetail.tsx` (DetailHeader with lead name + company; status Badge; LeadStatusControl; "Convert to Opportunity" Button — enabled only when canConvert(lead)===true; on convert: show loading, call useConvertLead, on success show "Converted" Badge + link to /opportunities/:converted_opportunity_id; notes field shown when non-null; HTTP 400 on double-convert → ErrorBanner with detail message)

### Unit Tests — Lead State Machine

- [x] T059 [P] [US3] Write unit tests in `frontend/tests/unit/leadStateMachine.test.ts` covering: TC-U001 (new→contacted valid), TC-U002 (new→qualified invalid), TC-U003 (lost→any invalid), TC-U004 (canConvert qualified+null=true), TC-U005 (canConvert qualified+id=false), TC-U006 (canConvert non-qualified=false)

### E2E Tests — Leads

- [ ] T060 [US3] Write Playwright e2e tests in `frontend/tests/e2e/leads.spec.ts` covering: TC-I012 (full lead lifecycle: create→contacted→qualified→convert), TC-I013 (invalid transition not shown — new lead has no "Qualified" option), TC-I014 (lost terminal state: no transitions, no Convert button)

**Checkpoint**: Lead state machine enforced in UI. Convert flow creates opportunity and shows link. Unit tests TC-U001–TC-U006 pass. E2e tests TC-I012–TC-I014 pass.

---

## Phase 6: User Story 4 — Opportunity Pipeline Management (Priority: P4)

**Goal**: Opportunity CRUD with Kanban board view (one column per stage) and flat table toggle. Stage changes move cards between columns.

**Independent Test** (TC-I015): Seed data → open `/opportunities` board → verify 4 cards in 4 correct stage columns with USD values displayed.

### Implementation

- [ ] T061 [P] [US4] Implement `useOpportunities` hooks in `frontend/src/features/opportunities/useOpportunities.ts` (useOpportunityList, useOpportunity, useCreateOpportunity, useUpdateOpportunity, useDeleteOpportunity; list accepts OpportunityListParams: stage, account_id, contact_id, page, size)
- [x] T062 [P] [US4] Implement `OpportunityForm` in `frontend/src/features/opportunities/OpportunityForm.tsx` (fields: title+account_id+stage required; contact_id, value, probability, expected_close_date optional; client-side: value must be null OR >0, probability 0–100; account and contact dropdowns populated from API; close date as date input)
- [ ] T063 [P] [US4] Implement `PipelineBoard` in `frontend/src/features/opportunities/PipelineBoard.tsx` (5 stage columns: prospecting/proposal/negotiation/closed-won/closed-lost; each column: header with stage name Badge + total USD value; opportunity cards with title, value, probability bar, contact name, close date in amber if ≤30 days; inline stage change select per card; EmptyState per empty column)
- [ ] T064 [P] [US4] Implement `PipelineTable` in `frontend/src/features/opportunities/PipelineTable.tsx` (TanStack Table with columns: title, account, contact, stage Badge, value, probability, close date; filter dropdowns for stage/account/contact; pagination)
- [x] T065 [US4] Implement `OpportunitiesPage` in `frontend/src/features/opportunities/OpportunitiesPage.tsx` (board/table toggle button persisted in localStorage as 'board'|'table'; "New Opportunity" button opens Modal with OpportunityForm; passes filter params to both views)
- [x] T066 [US4] Implement `OpportunityDetail` in `frontend/src/features/opportunities/OpportunityDetail.tsx` (DetailHeader with opp title + Edit/Delete buttons; stage select control for inline stage update; value + probability + close date display; AccountDetail link; contact link; ActivityTimeline filtered by `?opportunity_id=`; "Log Activity" button opens ActivityForm pre-linked to this opportunity)

### E2E Tests — Opportunities

- [ ] T067 [US4] Write Playwright e2e tests in `frontend/tests/e2e/opportunities.spec.ts` covering: TC-I015 (seeded pipeline board — 4 cards in correct columns), TC-I016 (stage update moves card), TC-I017 (value validation — negative rejected client-side), TC-I018 (opportunity detail shows 3 activities for Finance Solutions opp)

**Checkpoint**: Pipeline board shows all seeded opportunities in correct columns. Stage update reflected immediately. E2e tests TC-I015–TC-I018 pass.

---

## Phase 7: User Story 5 — Activity Logging (Priority: P5)

**Goal**: Unified activity log with type/contact/opportunity filters. Activity form enforces that at least one of contact or opportunity is linked.

**Independent Test** (TC-I019): Log a call activity for Tom Wilson → appears in activities log AND in Tom Wilson's History tab.

### Implementation

- [ ] T068 [P] [US5] Implement `useActivities` hooks in `frontend/src/features/activities/useActivities.ts` (useActivityList, useActivity, useCreateActivity, useUpdateActivity, useDeleteActivity; invalidation on create: invalidate activities + contact if contact_id set + opportunity if opportunity_id set)
- [x] T069 [P] [US5] Implement `ActivityForm` in `frontend/src/features/activities/ActivityForm.tsx` (fields: type required (call/email/meeting dropdown), subject required, activity_date optional, notes optional, contact_id optional (dropdown), opportunity_id optional (dropdown); client-side validation: submit blocked if BOTH contact_id AND opportunity_id are null — shows "Activity must be linked to a contact or opportunity"; optionally pre-fills contact_id or opportunity_id when opened from detail pages)
- [x] T070 [US5] Implement `ActivitiesPage` in `frontend/src/features/activities/ActivitiesPage.tsx` (ActivityTimeline in reverse chronological order; filter controls: type (All/Call/Email/Meeting) passing `?type=`; contact dropdown passing `?contact_id=`; opportunity dropdown passing `?opportunity_id=`; "Log Activity" button opens Modal with ActivityForm; pagination; EmptyState when no results)

### Unit Tests — Activity Validation

- [ ] T071 [P] [US5] Add activity form validator unit tests to `frontend/tests/unit/metrics.test.ts`: TC-U017 (both null → invalid), TC-U018 (contact_id set only → valid); and opportunity value/probability validators: TC-U019 (value=0 → invalid), TC-U020 (value=75000 → valid), TC-U021 (probability=101 → invalid), TC-U022 (probability=100 → valid)

### E2E Tests — Activities

- [ ] T072 [US5] Write Playwright e2e tests in `frontend/tests/e2e/activities.spec.ts` covering: TC-I019 (create call linked to Tom Wilson — appears in log and contact history), TC-I020 (submit with no links blocked client-side — no API request), TC-I021 (type filter: meeting → 3 results)

**Checkpoint**: Activity form prevents submission with no links. New activity appears in both activities log and linked contact/opportunity. E2e tests TC-I019–TC-I021 pass.

---

## Phase 8: User Story 6 — Contact Communication History (Priority: P6)

**Goal**: Contact Emails tab showing mock inbox filtered by contact email, plus compose form pre-addressed to the contact.

**Independent Test** (TC-I011): Open Tom Wilson → Emails tab → 2 emails shown. Compose new email pre-filled to tom.wilson@techstart.io → sent email appears at top.

### Implementation

- [x] T073 Create email API module in `frontend/src/api/email.ts` (list with `?to=` filter, get, send/POST, delete all — per contracts/api.md §Mock Email)
- [ ] T074 [P] [US6] Implement `useEmail` hooks in `frontend/src/features/email/useEmail.ts` (useEmailList, useEmail, useSendEmail, useClearEmails; list accepts `{ to?: string, page, size }` params)
- [x] T075 [P] [US6] Implement `ComposeEmailForm` in `frontend/src/features/email/ComposeEmailForm.tsx` (fields: from_email required, to_email required (pre-filled + disabled when opened from contact tab), subject required, body optional; submits to POST /api/v1/mock-email/; success → onSuccess callback + toast; error → inline ErrorBanner)
- [x] T076 [US6] Implement `ContactEmailsTab` in `frontend/src/features/contacts/ContactEmailsTab.tsx` (fetches emails via `GET /api/v1/mock-email/?to={contact.email}`; lists emails newest-first with from_email, subject, sent_at; click email → modal with full body (html_body rendered if set, else body, else "No body"); "Compose" button opens ComposeEmailForm with defaultTo=contact.email; EmptyState with "Compose" CTA when no emails)

### E2E Tests — Contact Emails

- [ ] T077 [US6] Complete Playwright e2e tests in `frontend/tests/e2e/email.spec.ts` (partial — TC-I022: open Sarah Johnson Emails tab, "To" pre-filled with sarah.j@healthcarepro.com, send email, appears at top of list)

**Checkpoint**: Tom Wilson's Emails tab shows 2 seeded emails. Compose from contact tab pre-fills recipient and cannot be changed. Sent email appears immediately. E2e test TC-I022 passes.

---

## Phase 9: User Story 7 — Demo Environment Control (Priority: P7)

**Goal**: Seed Manager and Mock Email admin inbox pages with one-click seed, confirmed clear, and result display.

**Independent Test** (TC-I025): Open /admin/seed → Seed → result panel shows 4/4/3/4/9/8 counts → Seed again → same counts (idempotent, no doubling).

### Implementation

- [x] T078 Create seed API module in `frontend/src/api/seed.ts` (seedDemo: POST /api/v1/seed/ returns SeedResult; clearAll: DELETE /api/v1/seed/)
- [ ] T079 [P] [US7] Implement `useSeed` hooks in `frontend/src/features/admin/useSeed.ts` (useSeedDemo mutation, useClearAll mutation; on success: queryClient.invalidateQueries() — invalidates everything)
- [x] T080 [P] [US7] Implement `SeedManagerPage` in `frontend/src/features/admin/SeedManagerPage.tsx` ("Seed demo data" Button → calls useSeedDemo → shows SeedResultPanel with counts table (accounts/contacts/leads/opportunities/activities/emails); "Clear all data" Button → useConfirmDialog → on confirm calls useClearAll; both buttons show loading state; success toast on completion; ErrorBanner on failure)
- [x] T081 [P] [US7] Implement `EmailInboxPage` in `frontend/src/features/email/EmailInboxPage.tsx` (full inbox list from GET /api/v1/mock-email/; recipient filter input; email list with from_email/to_email/subject/sent_at; click row → EmailDetail modal; "Clear inbox" button → useConfirmDialog → useClearEmails → EmptyState shown; pagination)
- [x] T082 [P] [US7] Implement `EmailDetail` in `frontend/src/features/email/EmailDetail.tsx` (shows from/to/subject/sent_at header; renders html_body as HTML if present, else body as plain text, else "No body"; used as a modal in both EmailInboxPage and ContactEmailsTab)

### E2E Tests — Seed & Mock Email Admin

- [ ] T083 [US7] Write Playwright e2e tests in `frontend/tests/e2e/seed.spec.ts` covering: TC-I025 (seed twice — counts same, no doubling), TC-I026 (seed→clear→seed cycle), TC-I027 (404 on invalid account ID — "Record not found"), TC-I028 (double convert error surfaced from detail field), TC-I029 (backend unreachable — error state + retry), TC-I030 (pagination: 21 accounts, delete last on page 2 → returns to page 1)
- [ ] T084 [US7] Complete Playwright e2e tests in `frontend/tests/e2e/email.spec.ts`: TC-I023 (filter by emma.davis@globalretail.com → 2 results), TC-I024 (clear inbox → 8 emails removed, EmptyState shown)

**Checkpoint**: Seed Manager shows correct counts. Clear requires confirmation. Mock Email inbox filters and clears correctly. E2e tests TC-I023–TC-I030 pass (except pre-seeded test scenarios).

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Unit test completion, formatters tests, 404 page, type checking, full test suite validation.

- [x] T085 [P] Implement `NotFoundPage` in `frontend/src/pages/NotFoundPage.tsx` (shown for `*` wildcard route; displays "Page not found" with link back to Dashboard; also used when API returns 404 for a specific entity ID via router error boundary)
- [x] T086 [P] Write unit tests in `frontend/tests/unit/formatters.test.ts` covering: TC-U007 (formatCurrency(75000) → "$75,000"), TC-U008 (formatCurrency(120000.50) → "$120,000.50"), TC-U009 (formatCurrency(null) → "—"), TC-U015 (formatRelativeDate — within 30 days → "14 days ago"), TC-U016 (formatRelativeDate — older than 30 days → "Jan 15, 2025")
- [ ] T087 [P] Add remaining unit tests to `frontend/tests/unit/metrics.test.ts` to cover TC-U013 (days since contact — 5 days ago → 5), TC-U014 (no activities → null); verify all 22 unit test cases (TC-U001–TC-U022) have coverage
- [x] T088 Run `npm run typecheck` from `frontend/` and fix all TypeScript errors (zero `any` types in production code; strict mode must pass)
- [x] T089 Run `npm run test:unit` — verify all 22 unit tests pass (TC-U001–TC-U022 across leadStateMachine.test.ts, formatters.test.ts, metrics.test.ts)
- [ ] T090 Run `npm run test:e2e` with backend seeded — verify all 30 integration scenarios pass (TC-I001–TC-I030 across 8 spec files)
- [ ] T091 Manually validate quickstart.md scenarios V-01 through V-15 in a browser (Chrome) with seeded demo data — confirm all acceptance criteria from spec.md match what renders

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 complete — **BLOCKS all US phases**
- **Phases 3–9 (US1–US7)**: All require Phase 2 complete; can proceed in priority order (P1→P7)
- **Phase 10 (Polish)**: Requires all US phases complete

### User Story Dependencies

| Story | Phase | Depends On | Notes |
|-------|-------|-----------|-------|
| US1 Dashboard | 3 | Phase 2 | Creates shared API modules (accounts, leads, opps, activities) |
| US2 Accounts/Contacts | 4 | Phase 2 + T030–T033 for API modules | CRM layout components used by US5–US6 |
| US3 Leads | 5 | Phase 2 + T031 (leads API) | State machine unit tests first |
| US4 Opportunities | 6 | Phase 2 + T030 (accounts API) + T031 (leads API, for convert) | Board requires opportunities API |
| US5 Activities | 7 | Phase 2 + T030–T033 (all APIs for dropdowns) + T051 (ActivityTimeline) | ActivityForm + ActivityTimeline shared across US2/US4 |
| US6 Emails | 8 | Phase 2 + T048 (ContactDetail layout) | ContactEmailsTab added to existing ContactDetail |
| US7 Admin/Seed | 9 | Phase 2 only | Standalone pages; seed invalidates all queries |

### Within Each User Story

- API modules (`src/api/`) and hooks (`useX.ts`) → before Page and Detail components
- Forms → before Pages (Pages open Forms in Modals)
- Shared components (ActivityTimeline, ComposeEmailForm) → before their parent pages
- Unit tests for utilities → can run in parallel with implementation
- E2e tests → after implementation complete (tests written against live app)

### Parallel Opportunities

- All Phase 2 utility/component tasks marked [P] can run simultaneously (T014–T027)
- Within each US phase, tasks marked [P] touch different files and can run simultaneously
- US3 unit tests (T059) can run while US3 implementation (T054–T058) is in progress

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These 14 tasks can run simultaneously (all different files):
T014: frontend/src/utils/leadStateMachine.ts
T015: frontend/src/utils/formatters.ts
T016: frontend/src/utils/metrics.ts
T017: frontend/src/components/ui/Badge.tsx
T018: frontend/src/components/ui/Button.tsx
T019: frontend/src/components/ui/Card.tsx + EmptyState.tsx + ErrorBanner.tsx + LoadingSpinner.tsx
T020: frontend/src/components/ui/Modal.tsx
T021: frontend/src/components/ui/Pagination.tsx
T023: frontend/src/components/layout/NavSidebar.tsx
T024: frontend/src/components/layout/DetailHeader.tsx
T025: frontend/src/components/layout/ProfileSidebar.tsx
T026: frontend/src/components/layout/TabStrip.tsx
T027: frontend/src/hooks/useConfirmDialog.ts
# Then sequential:
T022: AppShell.tsx (depends on NavSidebar)
T028: router/index.tsx (depends on all pages existing as stubs)
T029: main.tsx + App.tsx (depends on router)
```

## Parallel Example: US3 — Lead Qualification

```bash
# Run simultaneously:
T054: frontend/src/features/leads/useLeads.ts
T055: frontend/src/features/leads/LeadForm.tsx
T056: frontend/src/features/leads/LeadStatusControl.tsx
T059: frontend/tests/unit/leadStateMachine.test.ts
# Then sequential (depend on above):
T057: LeadsPage.tsx (needs useLeads + LeadForm + LeadStatusControl)
T058: LeadDetail.tsx (needs useLeads + LeadStatusControl)
T060: leads.spec.ts (e2e — after LeadsPage + LeadDetail complete)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1 — Dashboard)
3. **VALIDATE**: Open http://localhost:5173/ with seeded backend — all 5 KPI cards show correct values
4. **MVP is shippable** — demonstrates live API integration end-to-end

### Incremental Delivery

| Milestone | After completing | Deliverable |
|-----------|-----------------|-------------|
| MVP | Phase 1–3 | Working dashboard with live KPIs |
| Core CRM | Phase 4 | Account + Contact CRUD with CRM layout |
| Sales Pipeline | Phases 5–6 | Lead qualification + Opportunity board |
| Full Activity | Phase 7 | Activity logging across all entities |
| Email History | Phase 8 | Contact email history + compose |
| Demo Ready | Phase 9 | Seed/clear cycle for demos |
| Production Ready | Phase 10 | All tests pass; type-safe |

---

## Notes

- `[P]` tasks touch different files — they can run in parallel within their phase
- `[Story]` labels map tasks to spec.md user stories for traceability
- Each user story phase is independently completable and testable
- E2e tests require: backend on :8000 + frontend on :5173 + database seeded (via SeedManagerPage or curl)
- Unit tests (Vitest) require no backend — pure function tests only
- Run `npm run test:unit` after each utility function is written to verify correctness before UI depends on it
- ActivityTimeline (T051) is created in Phase 4 but reused by Phase 7 (ActivitiesPage) and Phase 8 (ContactEmailsTab via ContactHistoryTab)
- ComposeEmailForm (T075) created in Phase 8 but also referenced from ContactDetail (Phase 4, T048) — ContactDetail opens it in a Modal; implement as a stub in Phase 4 if needed or add a TODO placeholder
