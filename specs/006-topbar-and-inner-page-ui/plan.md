# Implementation Plan: Top Bar & Inner Page UI Modernisation

**Branch**: `006-topbar-and-inner-page-ui` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-topbar-and-inner-page-ui/spec.md`

---

## Summary

Move the user profile widget from the sidebar bottom to a persistent top bar (top-right corner), and modernise all inner pages (list + detail) with a card-based layout, `PageHeader` component, and `DetailCard` + `FieldRow` primitives — replacing the legacy `ProfileSidebar` + `TabStrip` pattern.

---

## Technical Context

**Language/Version**: TypeScript 5.4, React 18.3

**Primary Dependencies**: Tailwind CSS 3.4, lucide-react, TanStack Query v5, react-router-dom v6, @fontsource/inter

**Storage**: N/A (UI-only change)

**Testing**: Vitest (unit), `tsc --noEmit` (type check)

**Target Platform**: Web (Vite 5.4 dev server + nginx SPA)

**Project Type**: Web application (frontend SPA + FastAPI backend)

**Performance Goals**: No regressions in perceived paint time; skeleton loaders already in place

**Constraints**: Zero new npm packages; use existing design tokens (`brand.*`, `surface.*`, `shadow-card`, `shadow-dropdown`); WCAG 2.1 AA compliance via existing focus-visible ring in `style.css`

**Scale/Scope**: 4 new components, 1 updated layout file, 12 updated page files

---

## Constitution Check

The project constitution (`memory/constitution.md`) contains only placeholder text — no binding governance rules are in effect. All decisions follow the practical principles established in the existing codebase:

- Reuse existing design tokens; do not introduce new ones unless necessary
- No new npm packages
- Zero TypeScript errors required
- All existing Vitest tests must pass
- WCAG 2.1 AA focus-visible on all interactive elements

---

## Project Structure

### Documentation (this feature)

```text
specs/006-topbar-and-inner-page-ui/
├── plan.md              <- this file
├── research.md          Phase 0 output
├── data-model.md        Phase 1 output
├── quickstart.md        Phase 1 output
├── contracts/
│   └── ui-components.md Phase 1 output
└── tasks.md             Phase 2 output (/speckit-tasks command)
```

### Source Code (frontend)

```text
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          (update: add TopBar, remove mobile header)
│   │   ├── TopBar.tsx            (NEW)
│   │   ├── UserMenu.tsx          (NEW)
│   │   ├── PageHeader.tsx        (NEW)
│   │   ├── NavSidebar.tsx        (update: remove bottom profile section)
│   │   ├── DetailHeader.tsx      (deprecated - kept, no changes)
│   │   └── ProfileSidebar.tsx    (deprecated - kept, no changes)
│   └── ui/
│       └── DetailCard.tsx        (NEW: exports DetailCard + FieldRow)
└── features/
    ├── accounts/
    │   ├── AccountsListPage.tsx  (update: PageHeader + card table)
    │   └── AccountDetailPage.tsx (update: PageHeader + DetailCard layout)
    ├── contacts/
    │   ├── ContactsListPage.tsx  (update)
    │   └── ContactDetailPage.tsx (update)
    ├── leads/
    │   ├── LeadsListPage.tsx     (update)
    │   └── LeadDetailPage.tsx    (update)
    ├── opportunities/
    │   ├── OpportunitiesListPage.tsx (update)
    │   └── OpportunityDetailPage.tsx (update)
    ├── activities/
    │   └── ActivitiesLogPage.tsx (update: PageHeader + card table)
    ├── admin/
    │   └── UserManagementPage.tsx (update: PageHeader + card table)
    └── dashboard/
        └── DashboardPage.tsx     (update: add PageHeader)
```

---

## Phase 0: Research

Complete — see [research.md](research.md)

Key decisions:
1. Profile widget moved to TopBar top-right; removed from sidebar bottom
2. UserMenu — self-contained with click-outside via useEffect; no third-party dropdown
3. Inner pages — PageHeader + DetailCard/FieldRow replaces DetailHeader + ProfileSidebar + TabStrip
4. List pages — table wrapped in styled card container
5. Responsive — grid-cols-2 collapses to grid-cols-1 at < md; flex-wrap for PageHeader actions on mobile

---

## Phase 1: Design & Contracts

Complete

- [data-model.md](data-model.md) — component interface models, layout composition before/after
- [contracts/ui-components.md](contracts/ui-components.md) — prop contracts for all new components
- [quickstart.md](quickstart.md) — Scenarios 12a through 12h

---

## Phase 2: Implementation Plan (for /speckit-tasks)

### Group A — Foundation Components (parallel, no dependencies)

| ID | File | Change |
|----|------|--------|
| A1 | components/ui/DetailCard.tsx | Create DetailCard + FieldRow |
| A2 | components/layout/PageHeader.tsx | Create PageHeader |
| A3 | components/layout/UserMenu.tsx | Create UserMenu (click-outside, dropdown) |
| A4 | components/layout/TopBar.tsx | Create TopBar (wraps UserMenu, hamburger) |

### Group B — Layout Wiring (depends on A3, A4)

| ID | File | Change |
|----|------|--------|
| B1 | components/layout/NavSidebar.tsx | Remove bottom profile section |
| B2 | components/layout/AppShell.tsx | Add TopBar, remove mobile header |

### Group C — List Pages (depends on A2, parallel with each other)

| ID | File | Change |
|----|------|--------|
| C1 | features/accounts/AccountsListPage.tsx | PageHeader + card table wrapper |
| C2 | features/contacts/ContactsListPage.tsx | PageHeader + card table wrapper |
| C3 | features/leads/LeadsListPage.tsx | PageHeader + card table wrapper |
| C4 | features/opportunities/OpportunitiesListPage.tsx | PageHeader + card table wrapper |
| C5 | features/activities/ActivitiesLogPage.tsx | PageHeader + card table wrapper |
| C6 | features/admin/UserManagementPage.tsx | PageHeader + card table wrapper |

### Group D — Detail Pages (depends on A1, A2, parallel with each other)

| ID | File | Change |
|----|------|--------|
| D1 | features/accounts/AccountDetailPage.tsx | PageHeader + DetailCard layout |
| D2 | features/contacts/ContactDetailPage.tsx | PageHeader + DetailCard layout |
| D3 | features/leads/LeadDetailPage.tsx | PageHeader + DetailCard layout |
| D4 | features/opportunities/OpportunityDetailPage.tsx | PageHeader + DetailCard layout |

### Group E — Dashboard (depends on A2)

| ID | File | Change |
|----|------|--------|
| E1 | features/dashboard/DashboardPage.tsx | Add PageHeader (title only) |

### Group F — Validation (depends on all above)

| ID | Action |
|----|--------|
| F1 | npx tsc --noEmit — zero errors |
| F2 | npx vitest run — all tests pass |
| F3 | Quickstart Scenarios 12a through 12h manual validation |

---

## Design Token Reference

All new components MUST use these tokens (defined in tailwind.config.ts):

| Token | Value | Usage |
|-------|-------|-------|
| bg-surface-base | #f8fafc | Page background |
| bg-surface-card / bg-white | #ffffff | Card backgrounds |
| border-surface-border | #e2e8f0 | Card borders |
| shadow-card | subtle 1px shadow | All DetailCard + table cards |
| shadow-dropdown | 4px shadow | UserMenu dropdown panel |
| rounded-xl | 0.75rem | All card elements |
| bg-indigo-900 | sidebar colour | NavSidebar (unchanged) |
| bg-indigo-600 | avatar background | UserMenu avatar circle |
| text-slate-900 | primary text | Field values, headings |
| text-slate-500 | secondary text | Field labels, breadcrumb |
| text-slate-700 | card header title | DetailCard heading |