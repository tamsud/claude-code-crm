# Tasks: Top Bar & Inner Page UI Modernisation + Dashboard Enhancements

**Input**: Design documents from `specs/006-topbar-and-inner-page-ui/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**User argument**: "Also add more dashboards like what's in the image and create a task split-up"
**Dashboard reference**: `specs/mocks/image.png` (Zoho CRM Deal Dashboards — Pipeline by Stage funnel, Pipeline by Probability bar chart, Big Deals pie chart, Deals by Type bar chart, Win Rate KPI)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1=Profile in TopBar, US2=Modern Inner Pages, US3=Page Header Pattern, US4=Dashboard Charts
- Include exact file paths in descriptions

---

## Phase 1: Foundation Components (no dependencies, all parallelisable)

**Purpose**: Create the new shared UI primitives that every user story depends on.

- [x] T001 [P] Create `frontend/src/components/ui/DetailCard.tsx` — export two named components: `DetailCard({ title, children, actions?, className? })` renders `<div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">` with a card header (`px-6 py-4 border-b border-slate-100 flex items-center justify-between`) showing `title` as `text-sm font-semibold text-slate-700 uppercase tracking-wide` and optional `actions` right; card body is `<div className="px-6 py-5">{children}</div>`; also export `FieldRow({ label, value })` which renders a label span (`text-xs text-slate-500 font-medium uppercase tracking-wide`) and a value span (`text-sm text-slate-900`) — these are used inside a parent `grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4` set by the consumer

- [x] T002 [P] Create `frontend/src/components/layout/PageHeader.tsx` — export `PageHeader({ title, breadcrumb?, actions? })` where `breadcrumb?: { label: string; to: string }`; renders `<div className="px-6 py-4 flex items-start justify-between flex-wrap gap-3">`; left side: if `breadcrumb`, render `<Link to={breadcrumb.to}><ArrowLeft className="h-3.5 w-3.5" /> {breadcrumb.label}</Link>` in `text-sm text-slate-500 hover:text-slate-700 mb-1 inline-flex items-center gap-1`, then `<h1 className="text-2xl font-bold text-slate-900">{title}</h1>`; right side: `<div className="flex items-center gap-2 flex-wrap">{actions}</div>`; import `ArrowLeft` from `lucide-react` and `Link` from `react-router-dom`

- [x] T003 [P] Create `frontend/src/components/layout/UserMenu.tsx` — self-contained dropdown widget; reads `user`, `logout` from `useAuth()`; internal state: `open: boolean`; add click-outside via `useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler) }, [])`; trigger button renders: avatar circle `w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold` showing initials, display name `truncate max-w-[120px] text-sm font-medium text-slate-700 hidden sm:block`, and `ChevronDown` icon; dropdown panel: `absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-dropdown border border-slate-100 z-50 py-1`; panel header: user full name + role badge (reuse role colours from NavSidebar); divider; "View Profile" link to `/profile`; "Sign out" button calls `logout()` then `navigate('/login')`; role badge colours: admin=`bg-red-100 text-red-700`, manager=`bg-blue-100 text-blue-700`, sales_rep=`bg-green-100 text-green-700`

- [x] T004 [P] Create `frontend/src/components/layout/TopBar.tsx` — `TopBar({ onMenuClick }: { onMenuClick: () => void })`; renders `<header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">`; left: hamburger `<button onClick={onMenuClick} className="md:hidden ..."><Menu className="h-5 w-5" /></button>` and `<span className="md:hidden text-sm font-semibold text-slate-800">Sales CRM</span>`; right (ml-auto): `<UserMenu />`; import `Menu` from `lucide-react` and `UserMenu` from `./UserMenu`

**Checkpoint**: All 4 foundation components created — no page files needed yet.

---

## Phase 2: Layout Wiring — US1 Profile in Top Bar (depends on T003, T004)

**Goal**: Profile widget moved to top-right of persistent top bar; removed from sidebar bottom.

**Independent Test**: On any page, user sees avatar in top-right corner; sidebar has no profile section at bottom.

- [x] T005 [US1] Update `frontend/src/components/layout/NavSidebar.tsx` — remove the entire "User profile section" block (the `<div onClick={() => navigate('/profile')}...>` block at the bottom of the `<aside>` containing avatar, display name, role badge, and sign-out button); keep the collapse toggle button and all nav links unchanged; the `navigate` and `UserCircle` imports can also be removed if no longer used; verify with `tsc --noEmit` after

- [x] T006 [US1] Update `frontend/src/components/layout/AppShell.tsx` — replace the existing mobile-only `<header className="md:hidden ...">` block with `<TopBar onMenuClick={() => setMobileOpen(true)} />`; import `TopBar` from `./TopBar`; remove the `MobileMenuButton` import (it is now internal to TopBar); the `MobileMenuButton` named export can remain in `NavSidebar.tsx` temporarily for backward compatibility or be removed — verify `tsc --noEmit`; the resulting AppShell layout: `<aside NavSidebar />` + `<div flex-col><TopBar /><main><Outlet /></main></div>`

**Checkpoint US1**: `tsc --noEmit` passes. Load any page → top bar shows avatar top-right. Sidebar bottom has no profile section. Dropdown opens with name, role, View Profile, Sign out.

---

## Phase 3: Inner Page Card Layout — US2 Modern Detail Pages (depends on T001, T002)

**Goal**: All 4 detail pages replaced with card-based sections using `PageHeader` + `DetailCard` + `FieldRow`.

**Independent Test**: Open Lead detail → see PageHeader with breadcrumb + at least 2 `DetailCard` sections with two-column field grid. No `ProfileSidebar` or `DetailHeader` visible.

- [x] T007 [P] [US2] Rewrite `frontend/src/features/leads/LeadDetailPage.tsx` — replace `<DetailHeader>` with `<PageHeader title={fullName} breadcrumb={{ label: 'Leads', to: '/leads' }} actions={...} />`; replace `<div className="flex gap-6 p-6"><ProfileSidebar .../><div flex-1>...</div></div>` with a `<div className="p-6 space-y-6">` containing: (1) `<DetailCard title="Lead Information">` with `<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">` containing `<FieldRow label="Status" value={<Badge .../>} />`, `<FieldRow label="Company" value={lead.company ?? '—'} />`, `<FieldRow label="Email" value={lead.email} />`, `<FieldRow label="Source" value={lead.source ?? '—'} />`, `<FieldRow label="Created" value={formatRelativeDate(lead.created_at)} />`; (2) `<DetailCard title="Stage Actions">` showing next-state buttons and Convert button as before; keep all existing mutations, `useConfirmDialog`, `LeadForm` modal, and `ConfirmDialog` unchanged; remove `DetailHeader` and `ProfileSidebar` imports

- [x] T008 [P] [US2] Rewrite `frontend/src/features/accounts/AccountDetailPage.tsx` — replace `<DetailHeader>` + `<div flex gap-6><ProfileSidebar/><TabStrip/></div>` pattern; new layout in `<div className="p-6 space-y-6">`: (1) `<PageHeader title={account.name} breadcrumb={{ label: 'Accounts', to: '/accounts' }} actions={Edit+Delete buttons} />`; (2) two-col grid `xl:grid-cols-3 gap-6`: left `xl:col-span-2` `<DetailCard title="Account Details">` with FieldRows for Industry, Website, Description, Created; right col: `<DetailCard title="Contacts">` listing contacts as `<Link>` rows, and `<DetailCard title="Opportunities">` listing opps with Badge + value; keep all existing query hooks, mutations, `useConfirmDialog`, `AccountForm` modal; remove `DetailHeader`, `ProfileSidebar`, `TabStrip` imports

- [x] T009 [P] [US2] Rewrite `frontend/src/features/contacts/ContactDetailPage.tsx` — same pattern as T008; `<PageHeader title={fullName} breadcrumb={{ label: 'Contacts', to: '/contacts' }} actions={Edit+Delete} />`; `<DetailCard title="Contact Information">` with FieldRows: Account (link), Email, Phone, Title, Created; related cards for Activities and Emails; keep all existing hooks and modals; remove `DetailHeader`, `ProfileSidebar`, `TabStrip` imports

- [x] T010 [P] [US2] Rewrite `frontend/src/features/opportunities/OpportunityDetailPage.tsx` — same pattern; `<PageHeader title={opportunity.title} breadcrumb={{ label: 'Pipeline', to: '/opportunities' }} actions={Edit+Delete+stage buttons} />`; `<DetailCard title="Opportunity Details">` with FieldRows: Account (link), Stage (badge), Value, Probability, Expected Close, Created; related `<DetailCard title="Activities">`; keep all mutations; remove `DetailHeader`, `ProfileSidebar` imports

**Checkpoint US2**: Open each of the 4 detail pages — all show `PageHeader` with breadcrumb and `DetailCard` card sections. `tsc --noEmit` passes. Two-column grid visible on desktop; single column on mobile.

---

## Phase 4: List Page Card Tables — US2 + US3 Modern List Pages (depends on T002)

**Goal**: All 6 list pages use `PageHeader` + card-wrapped table styling.

**Independent Test**: Navigate to Accounts list → `PageHeader` title left, action button right; table inside white rounded card with hover rows.

- [x] T011 [P] [US2] [US3] Update `frontend/src/features/accounts/AccountsListPage.tsx` — replace inline `<div className="flex items-center justify-between"><h1...><Button...></div>` with `<PageHeader title="Accounts" actions={canCreate ? <Button...>New Account</Button> : undefined} />`; wrap the `<table>` (or rows/list) in `<div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">`; add `className="hover:bg-slate-50 transition-colors"` to each `<tr>`; column headers `<th>` use `className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50"`; import `PageHeader` from `@/components/layout/PageHeader`

- [x] T012 [P] [US2] [US3] Update `frontend/src/features/contacts/ContactsListPage.tsx` — same pattern as T011; `PageHeader title="Contacts"` with "New Contact" action; card table wrapper; styled column headers and row hover

- [x] T013 [P] [US2] [US3] Update `frontend/src/features/leads/LeadsListPage.tsx` — same pattern; `PageHeader title="Leads"` with "New Lead" action; card table wrapper; keep existing `STATUS_TABS` filter tabs outside the card, above it; styled column headers and row hover

- [x] T014 [P] [US2] [US3] Update `frontend/src/features/opportunities/OpportunitiesListPage.tsx` — same pattern; `PageHeader title="Pipeline"` with "New Opportunity" action; card table wrapper; styled column headers and row hover

- [x] T015 [P] [US2] [US3] Update `frontend/src/features/activities/ActivitiesLogPage.tsx` — same pattern; `PageHeader title="Activities"` with "Log Activity" action; card table wrapper; styled column headers and row hover

- [x] T016 [P] [US2] [US3] Update `frontend/src/features/admin/UserManagementPage.tsx` — same pattern; `PageHeader title="User Management"` with "Invite User" action (if applicable); card table wrapper; styled column headers and row hover

**Checkpoint US2+US3**: All 6 list pages show `PageHeader` + card table. `tsc --noEmit` passes.

---

## Phase 5: Dashboard Page Header — US3 (depends on T002)

**Goal**: Dashboard gets a `PageHeader` for consistent heading pattern across all pages.

- [x] T017 [US3] Update `frontend/src/features/dashboard/DashboardPage.tsx` — replace `<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>` with `<PageHeader title="Dashboard" />`; import `PageHeader` from `@/components/layout/PageHeader`; no breadcrumb or actions needed on dashboard

**Checkpoint US3**: All pages (list, detail, dashboard) show a `PageHeader`. Sidebar has no heading of its own.

---

## Phase 6: Dashboard Enhancements — US4 (depends on existing recharts, no blocking prereqs)

**Goal**: Add 4 new dashboard chart widgets inspired by the Zoho CRM "Deal Dashboards" reference image: Win Rate KPI card, Pipeline by Probability bar chart, Deals by Stage count bar chart, Recent Won/Lost Deals summary.

**Independent Test**: Dashboard shows 5+ KPI cards, a Pipeline by Probability chart, a Deals by Stage count chart, and a Won vs Lost summary card. All render correctly with seeded data.

- [x] T018 [P] [US4] Create `frontend/src/features/dashboard/PipelineByProbability.tsx` — chart showing deal count grouped by probability bucket (10%, 20%, …, 90%+); props: `opportunities: Opportunity[]`; compute buckets: map each opp to `Math.floor((opp.probability ?? 0) / 10) * 10` (0–100 in steps of 10), group and count; render `<ResponsiveContainer width="100%" height={200}><BarChart data={data}><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#6366f1" radius={[3,3,0,0]} /></BarChart></ResponsiveContainer>`; data shape: `{ label: '10%', count: number }[]`; import from `recharts`

- [x] T019 [P] [US4] Create `frontend/src/features/dashboard/StageCountChart.tsx` — bar chart showing **number of opportunities** per stage (not value); props: `opportunities: Opportunity[]`; group by stage, count; use same `STAGE_COLORS` and `STAGE_LABELS` as `PipelineFunnel.tsx`; render `<ResponsiveContainer width="100%" height={200}><BarChart data={data}><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} /><Tooltip /><Bar dataKey="count" radius={[3,3,0,0]}><Cell key={s} fill={STAGE_COLORS[s]} /></Bar></BarChart></ResponsiveContainer>`

- [x] T020 [P] [US4] Create `frontend/src/features/dashboard/WonLostSummary.tsx` — summary card showing Closed Won count + total value vs Closed Lost count + total value; props: `opportunities: Opportunity[]`; derive `won = opps.filter(o => o.stage === 'closed-won')`, `lost = opps.filter(o => o.stage === 'closed-lost')`; render two side-by-side stat blocks inside a `DetailCard` (import from `@/components/ui/DetailCard`): Won block with `text-green-600` accent (TrendingUp icon, count, total value), Lost block with `text-red-500` accent (TrendingDown icon, count, total value); import `TrendingUp`, `TrendingDown` from `lucide-react` and `formatCurrency` from `@/utils/formatters`

- [x] T021 [US4] Update `frontend/src/features/dashboard/DashboardPage.tsx` — import `PipelineByProbability` from `./PipelineByProbability`, `StageCountChart` from `./StageCountChart`, `WonLostSummary` from `./WonLostSummary`; replace the existing single `sm:col-span-1` Win Rate row with a new KPI row: move Win Rate into the main 4-card KPI grid as a 5th card `sm:grid-cols-2 xl:grid-cols-5`; below KPIs add a second chart row `grid grid-cols-1 lg:grid-cols-2 gap-6` containing: `<Card><h2 ...>Pipeline by Probability</h2><PipelineByProbability opportunities={opps} /></Card>` and `<Card><h2 ...>Deals by Stage (Count)</h2><StageCountChart opportunities={opps} /></Card>`; below that add a full-width `<WonLostSummary opportunities={opps} />`; keep existing Pipeline by Stage funnel card and Recent Activity card; surround chart cards in skeleton loaders when `opportunities.isLoading`

**Checkpoint US4**: Dashboard shows 5 KPI cards, Pipeline by Stage funnel, Pipeline by Probability chart, Deals by Stage count chart, Won/Lost summary. All load with seeded data.

---

## Phase 7: Validation

**Purpose**: Verify TypeScript, tests, and all quickstart scenarios.

- [ ] T022 Run `cd frontend && npx tsc --noEmit` from the repo root — fix any TypeScript errors introduced by new components or imports; zero errors required before proceeding to T023
- [ ] T023 Run `cd frontend && npx vitest run` — all 26 existing unit tests must pass; no regressions from layout changes
- [ ] T024 Manual validation — execute Quickstart Scenarios 12a through 12h from `specs/006-topbar-and-inner-page-ui/quickstart.md` verifying: (12a) avatar in top bar desktop; (12b) dropdown opens/closes/navigates; (12c) avatar on mobile 375px; (12d) leads list card table; (12e) lead detail card sections; (12f) account detail card + related records; (12g) responsive two-column stacking at 768px; (12h) tsc + vitest pass

---

## Dependencies & Execution Order

```
T001 ──────────────────────────────────┐
T002 ──────────────────────────────────┤── T007, T008, T009, T010 (detail pages)
T003 ──────────────────────────┐       │
T004 (depends T003) ───────────┤       │
                               │       │
T005 (depends T004) ─ US1 done─┤       ├── T011–T016 (list pages)
T006 (depends T004) ─ US1 done─┘       │
                                       ├── T017 (dashboard PageHeader)
T018, T019, T020 (parallel) ──────────── T021 (dashboard enhancements)
                                        │
T022 ← T023 ← T024  (validation, sequential)
```

**Parallel opportunities**:
- T001, T002, T003 can all start immediately (no dependencies)
- T004 unblocks once T003 is done
- T007–T010 can all run in parallel once T001 + T002 done
- T011–T016 can all run in parallel once T002 done
- T018, T019, T020 can run in parallel at any time (no shared files)

**MVP scope** (User Story 1 only): T003 → T004 → T005 → T006 → T022 → T023
Profile in top bar works, sidebar cleaned up. 3 hours estimated.

**Full scope**: All T001–T024, approximately 1–2 days.

---

## Implementation Strategy

1. **Start parallel**: T001 (DetailCard), T002 (PageHeader), T003 (UserMenu), T018, T019, T020 (chart components)
2. **Chain**: T004 (TopBar) after T003
3. **Layout wiring**: T005 + T006 after T004 → US1 complete, validate with tsc
4. **Detail pages**: T007–T010 in parallel → US2 detail pages complete
5. **List pages**: T011–T016 in parallel → US2+US3 list pages complete
6. **Dashboard**: T017 (PageHeader) + T021 (charts wired up) → US3+US4 complete
7. **Validate**: T022 → T023 → T024

## Notes

- `DetailHeader.tsx` and `ProfileSidebar.tsx` are **deprecated** but NOT deleted — they may still be referenced until all 4 detail pages are updated (T007–T010)
- `MobileMenuButton` export in `NavSidebar.tsx` is superseded by TopBar's internal hamburger — remove the import from AppShell in T006
- Win Rate KPI card in DashboardPage: currently rendered in a separate row (`sm:col-span-1`) — T021 moves it into the main KPI grid
- All chart components (`PipelineByProbability`, `StageCountChart`) use the already-installed `recharts@2.12` — no new npm packages needed
- `WonLostSummary` imports `DetailCard` from T001 — ensure T001 is complete before T020 is wired


