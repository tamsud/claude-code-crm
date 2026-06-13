# Research: Sales CRM Frontend

**Feature**: 004-crm-frontend | **Date**: 2026-06-13

All technical decisions below are resolved — no NEEDS CLARIFICATION items remain.

---

## 1. Build Tool & Dev Server

**Decision**: Vite 5.4

**Rationale**: First-class React + TypeScript support, native ESM dev server (instant HMR), built-in Vitest integration, generates optimised ESM bundles. Scaffolds in < 30s with `npm create vite@latest`.

**Alternatives considered**:
- Create React App — deprecated, slow, no ESM
- Next.js — SSR/SSG overhead not needed; this is a pure SPA with no SEO requirements
- Parcel — less ecosystem traction, limited TypeScript tooling

---

## 2. State Management

**Decision**: TanStack Query v5 (React Query) for all server state; `useState`/`useReducer` for local UI state; URL search params for filter and pagination state.

**Rationale**: Every piece of state in this CRM is either server-derived data or ephemeral UI state (open modal, active tab). React Query handles cache invalidation automatically on mutations, eliminating the need for manual refetch logic. URL params for filters mean filter state survives page refresh and can be linked.

**Alternatives considered**:
- Redux Toolkit + RTK Query — overkill; introduces boilerplate for no benefit in a single-user, no-auth CRM
- Zustand — useful for complex shared UI state; not needed here since filter state goes in URL and form state goes in React Hook Form

---

## 3. Routing

**Decision**: React Router v6 with `createBrowserRouter` (Data Router API)

**Rationale**: Data Router enables route-level error boundaries and loader patterns. `<Outlet>` layout nesting keeps `AppShell` + `NavSidebar` persistent across all routes. Fully compatible with Node 22.

**Route map**:
```
/                          → DashboardPage
/accounts                  → AccountsPage
/accounts/:id              → AccountDetail (tabs: contacts, opportunities)
/contacts                  → ContactsPage
/contacts/:id              → ContactDetail (tabs: overview, history, emails)
/leads                     → LeadsPage
/leads/:id                 → LeadDetail
/opportunities             → OpportunitiesPage (board/table)
/opportunities/:id         → OpportunityDetail
/activities                → ActivitiesPage
/admin/mock-email          → EmailInboxPage
/admin/mock-email/:id      → EmailDetail
/admin/seed                → SeedManagerPage
*                          → NotFoundPage (404)
```

---

## 4. HTTP Client

**Decision**: Axios 1.7 with a single configured instance in `src/api/client.ts`

**Rationale**: Axios provides request/response interceptors that allow centralised error unwrapping — the interceptor extracts `error.response.data.detail` and re-throws it as a plain `Error` with a human-readable message. All API modules import this single instance; `baseURL` comes from `import.meta.env.VITE_API_BASE_URL`.

**Error interceptor pattern**:
```typescript
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg: string }) => d.msg).join('; ')
        : 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
```

**Alternatives considered**:
- `fetch` — no built-in interceptor mechanism; error unwrapping requires manual wrapper at every call site
- `ky` — lightweight but less ecosystem support; interceptors are less ergonomic

---

## 5. Form Management

**Decision**: React Hook Form 7.52

**Rationale**: Uncontrolled-by-default (no re-render on every keystroke), excellent TypeScript generics, integrates cleanly with custom Tailwind inputs via `register()`. Handles required field validation, email format, numeric range. Smaller bundle than Formik.

**Alternatives considered**:
- Formik — controlled-by-default; slower for large forms; less TypeScript-first
- Plain `useState` — too verbose for multi-field forms with validation; duplicates error state logic across every form

---

## 6. Table Component

**Decision**: TanStack Table v8 (headless)

**Rationale**: Headless — full control over markup and Tailwind classes. Provides built-in column sorting, pagination helper, filter model. From the same TanStack family as React Query, consistent API patterns.

**Alternatives considered**:
- AG Grid — overkill; license complexity; heavy bundle
- Hand-rolled table — acceptable for simple cases but doesn't scale to sortable columns and server-side pagination without re-inventing TanStack Table

---

## 7. Charts

**Decision**: Recharts 2.12 for the dashboard pipeline bar chart

**Rationale**: React-native (components, not canvas wrappers), good TypeScript support, responsive container built-in, sufficient for one bar chart displaying pipeline value by stage.

**Chart used**: `BarChart` with 5 bars (one per opportunity stage), X-axis = stage name, Y-axis = total value in USD.

**Alternatives considered**:
- Chart.js — canvas-based, imperative API, needs wrapper for React; harder to style with Tailwind
- Victory — heavier bundle for equivalent feature set
- D3 — full power but far more code for a single bar chart

---

## 8. Icons

**Decision**: `lucide-react` 0.400

**Rationale**: Consistent stroke-based SVG icons, tree-shakeable (only imported icons in bundle), covers all needed icons: `Phone`, `Mail`, `Calendar`, `Building2`, `User`, `TrendingUp`, `CheckCircle`, `XCircle`, `AlertCircle`, `ChevronRight`, `Plus`, `Trash2`, `Edit`, `Eye`, `RefreshCw`.

**Alternatives considered**:
- Heroicons — fewer icons, only 2 sizes
- Font Awesome React — font-based, harder to colour/animate with Tailwind

---

## 9. Toast Notifications

**Decision**: Sonner 1.5

**Rationale**: Single `<Toaster />` component at root, imperative `toast.success()` / `toast.error()` API, auto-dismiss, stacks gracefully, styled cleanly with Tailwind overrides. Zero boilerplate.

**Implementation**: Wrap all mutation `onSuccess` / `onError` callbacks: `toast.success('Account created')` or `toast.error(error.message)`.

**Alternatives considered**:
- `react-hot-toast` — similar API but less maintained; no native promise handling
- Custom toast state in Context — unnecessary complexity

---

## 10. Modal / Dialog

**Decision**: `@radix-ui/react-dialog` 1.1 wrapped in `Modal.tsx`

**Rationale**: Fully accessible (focus trap, ARIA roles, Escape key), unstyled so Tailwind classes applied freely, composable primitive. One wrapper component `<Modal>` used for all create/edit forms and confirmation dialogs.

**Alternatives considered**:
- HTML `<dialog>` — browser support gaps in 2024 for advanced features; no focus trap out-of-box
- Headless UI Dialog — Tailwind-team library, but requires Tailwind UI licence for full examples; Radix is fully free

---

## 11. Unit Testing

**Decision**: Vitest 2.0 + `@testing-library/react` 16 + `jsdom`

**Rationale**: Vitest shares Vite config (no separate Jest config), runs ESM natively (matches Node 22), Jest-compatible API (`describe`, `it`, `expect`). `@testing-library/react` encourages testing behaviour over implementation. `jsdom` provides a browser-like DOM in Node.

**Test scope**: Pure utility functions only — `leadStateMachine.ts`, `formatters.ts`, `metrics.ts`. No component rendering tests in unit suite (component behaviour validated by Playwright e2e).

**Vitest config** (inline in `vite.config.ts`):
```typescript
test: {
  environment: 'jsdom',
  globals: true,
  include: ['tests/unit/**/*.test.ts'],
}
```

---

## 12. Integration / E2E Testing

**Decision**: Playwright 1.46 (Chromium)

**Rationale**: Node 22 fully supported, parallel test execution, first-class `page.goto` + `page.locator` API, built-in auto-wait (no manual `sleep`), generates HTML report. Tests run against live backend on `localhost:8000` + frontend on `localhost:5173`.

**Test setup pattern** (each spec file):
```typescript
test.beforeAll(async ({ request }) => {
  await request.delete('http://localhost:8000/api/v1/seed/');
  await request.post('http://localhost:8000/api/v1/seed/');
});
```

**Alternatives considered**:
- Cypress — historically slower, video/snapshot approach; less ergonomic for API-seeded data setups
- Testing Library + MSW — mocks the API; the spec explicitly forbids mock data and requires tests against the live backend

---

## 13. Activity Type Icons

**Decision**: Map `activity.type` to Lucide icons:
- `"call"` → `<Phone />` (blue)
- `"email"` → `<Mail />` (green)
- `"meeting"` → `<Calendar />` (purple)

---

## 14. Lead Status Badge Colors (FR-046)

| Status | Tailwind classes |
|--------|-----------------|
| new | `bg-blue-100 text-blue-800` |
| contacted | `bg-amber-100 text-amber-800` |
| qualified | `bg-green-100 text-green-800` |
| lost | `bg-gray-100 text-gray-600` |

---

## 15. Opportunity Stage Badge Colors (FR-047)

| Stage | Tailwind classes |
|-------|-----------------|
| prospecting | `bg-slate-100 text-slate-700` |
| proposal | `bg-blue-100 text-blue-800` |
| negotiation | `bg-amber-100 text-amber-800` |
| closed-won | `bg-green-100 text-green-800` |
| closed-lost | `bg-red-100 text-red-800` |

---

## 16. Pagination

**Decision**: URL-based pagination — `?page=1&size=20` in URL search params, read with `useSearchParams()`.

**Rationale**: Browser Back/Forward works correctly, sharable links retain page position, no extra state sync needed between React Query and URL.

**Backend pagination**: All list endpoints return `{ total, page, size, items[] }`. Frontend requests `?page=N&size=20` (default) up to `?size=100` (maximum per backend config).

---

## 17. Pipeline Board View / Table Toggle

**Decision**: `localStorage.getItem('pipelineView')` — `'board'` (default) or `'table'`. Persists across page reload but does not propagate to URL.

**Rationale**: View preference is user-level, not shareable. Unlike filters, the board/table choice does not change which data is shown — only how it is rendered.

---

## 18. Date Handling

**Decision**: All dates displayed in user's local timezone. `activity_date` and `expected_close_date` come as ISO strings from the API.

**formatRelativeDate logic**:
- If within 30 days: `"N days ago"` / `"Today"` / `"Yesterday"`
- Older: `"Jan 15, 2025"` (`Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`)

**Close date urgency**: If `expected_close_date` is within 30 days from today and opportunity is not closed, display date in amber text.
