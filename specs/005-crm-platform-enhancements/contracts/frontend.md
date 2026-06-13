# Frontend Component Contracts: CRM Platform Enhancement Suite

**Feature**: `005-crm-platform-enhancements`
**Date**: 2026-06-13

---

## New: AuthContext

```typescript
// src/contexts/AuthContext.tsx
interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'sales_rep'
  displayName: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>  // throws on failure
  logout: () => void
}

// Usage:
const { user, isAuthenticated, login, logout } = useAuth()
```

---

## New: tokenStore (module singleton)

```typescript
// src/api/tokenStore.ts
export const tokenStore = {
  token: null as string | null,
  setToken: (t: string | null) => { tokenStore.token = t },
}
```

Axios interceptor reads `tokenStore.token` to attach `Authorization` header.

---

## New: ProtectedRoute

```typescript
// src/router/ProtectedRoute.tsx
interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'manager' | 'sales_rep'>
  // If omitted: any authenticated user can access
}
// Renders <Outlet /> if authenticated + role matches; redirects to /login otherwise
```

---

## New: LoginPage

```typescript
// src/features/auth/LoginPage.tsx
// Route: /login
// Form fields: email (text), password (password)
// On submit: calls AuthContext.login()
// On success: navigate to originally requested URL or /
// On error: shows error message below form
```

---

## New: useAuth hook

```typescript
// src/hooks/useAuth.ts
// Re-exports useContext(AuthContext) with guard:
// throws if used outside AuthProvider
export function useAuth(): AuthContextValue
```

---

## New: RoleGuard

```typescript
// src/components/ui/RoleGuard.tsx
interface RoleGuardProps {
  allowedRoles: Array<'admin' | 'manager' | 'sales_rep'>
  children: React.ReactNode
  fallback?: React.ReactNode  // default: null
}
// Renders children if current user role is in allowedRoles, else renders fallback
```

---

## New: SortFilterBar

```typescript
// src/components/ui/SortFilterBar.tsx
interface SortOption {
  value: string    // sort_by param value
  label: string    // display label e.g. "Name", "Date Created"
}

interface FilterOption {
  key: string           // query param name e.g. "status"
  label: string         // display label e.g. "Status"
  options: Array<{ value: string; label: string }>
}

interface SortFilterBarProps {
  search?: {
    placeholder: string
    value: string
    onChange: (v: string) => void
  }
  sortOptions?: SortOption[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void
  filters?: FilterOption[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onClear?: () => void
}
// Renders: search input | sort dropdown | filter chip selectors | "Clear all" button
// All sections are optional — omit props to hide that section
```

---

## New: useSortFilter hook

```typescript
// src/hooks/useSortFilter.ts
// Manages sort/filter/search state and syncs to URL query params
function useSortFilter(defaults: {
  sortBy: string
  sortDir: 'asc' | 'desc'
  filters?: Record<string, string>
  search?: string
}): {
  search: string
  setSearch: (v: string) => void
  sortBy: string
  sortDir: 'asc' | 'desc'
  setSortBy: (v: string) => void
  setSortDir: (v: 'asc' | 'desc') => void
  filters: Record<string, string>
  setFilter: (key: string, value: string) => void
  clearAll: () => void
  queryParams: Record<string, string>  // ready to pass to API
}
```

---

## New: UserManagementPage

```typescript
// src/features/admin/UserManagementPage.tsx
// Route: /admin/users (Admin only)
// Shows paginated user list (email, role, active status)
// Actions: Create User button (opens modal), Edit role/active inline
```

---

## New: ProfilePage

```typescript
// src/features/profile/ProfilePage.tsx
// Routes: /profile AND /settings (alias — both redirect here)
// Any authenticated user
// Sections:
//   - Profile card: avatar initials, display_name (editable inline), email, role badge
//   - "Save" button → PATCH /api/v1/users/me with updated display_name
//   - Admin only: "Users" tab → embeds UserManagementPage table
// On save success: AuthContext updates the display_name so sidebar reflects it immediately
```

---

## Modified: NavSidebar

```typescript
// src/components/layout/NavSidebar.tsx
// Changes:
// - Brand colour background (indigo-900)
// - Logo/brand mark in header
// - Admin section shown only when role === 'admin'
// - Bottom section (always visible, any authenticated user):
//     Avatar circle with initials | display_name or email | role badge
//     Entire bottom section is a <Link to="/profile"> clickable link
//     Logout icon button (separate from the profile link)
```

---

## Modified: Badge

```typescript
// src/components/ui/Badge.tsx
// Status colour map (existing logic preserved, colours changed):
// new → blue-100 text-blue-800
// contacted → yellow-100 text-yellow-800
// qualified → green-100 text-green-800
// lost → red-100 text-red-800
// Stage colour map:
// prospecting → slate, qualification → blue, proposal → indigo
// negotiation → orange, closed-won → green, closed-lost → red
```

---

## Modified: src/api/client.ts

```typescript
// Add request interceptor that reads tokenStore.token:
instance.interceptors.request.use((config) => {
  if (tokenStore.token) {
    config.headers.Authorization = `Bearer ${tokenStore.token}`
  }
  return config
})

// Add response interceptor to handle 401:
instance.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      tokenStore.setToken(null)
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.detail ?? error.message)
  }
)
```

---

## Modified: Router

```typescript
// src/router/index.tsx — new routes added:
// /login → LoginPage (public, no auth required)
// /profile → ProfilePage (any authenticated user)
// /settings → redirect to /profile
// /admin/users → UserManagementPage (Admin only, ProtectedRoute)
// All existing routes wrapped in ProtectedRoute (any authenticated user)
```

---

## Modified: List Pages (sort/filter additions)

All six list pages gain a `<SortFilterBar>` toolbar rendered above the table/list. Each page uses `useSortFilter()` to manage state and passes `queryParams` to its React Query hook.

| Page | Search field | Filters | Sort options |
|------|-------------|---------|-------------|
| AccountsListPage | name | — | Name A→Z, Name Z→A, Newest, Oldest |
| ContactsListPage | first/last/email | Account (dropdown) | Last Name A→Z, Newest |
| LeadsListPage | name/email/company | Status (chips) | Name, Company, Status, Newest |
| OpportunitiesListPage | — | Stage, Account | Value ↑↓, Close Date ↑↓, Newest |
| ActivitiesLogPage | — | Type, Contact, Opportunity | Due Date ↑↓, Newest |
| UserManagementPage | — | Role, Active | Email A→Z, Newest |

Each list page shows an `<EmptyState>` (already exists) with a "Clear filters" CTA when search/filter returns 0 results.

---

## New: useUsers hook

```typescript
// src/features/admin/useUsers.ts
// React Query hooks for user CRUD:
// useUsers(params) — list with sort/filter
// useCreateUser() — mutation
// useUpdateUser() — mutation
// useCurrentUser() — GET /api/v1/users/me (for ProfilePage)
// useUpdateCurrentUser() — PATCH /api/v1/users/me (for ProfilePage save)
```

---

## New: Skeleton (US16)

```typescript
// src/components/ui/Skeleton.tsx
// Exports three named components, all using Tailwind animate-pulse:

interface SkeletonProps { count?: number; className?: string }

// SkeletonRow — mimics a table/list row (horizontal bar with label + value placeholders)
export function SkeletonRow({ count = 5, className }: SkeletonProps): JSX.Element

// SkeletonCard — mimics a KPI card (square/rect with title + value placeholder)
export function SkeletonCard({ count = 4, className }: SkeletonProps): JSX.Element

// SkeletonText — single inline text line placeholder (for headings, labels)
export function SkeletonText({ className }: SkeletonProps): JSX.Element

// Usage pattern:
{isLoading && <SkeletonRow count={5} />}
{!isLoading && data && <DataTable rows={data.items} />}
```

---

## New: KpiCard (US16)

```typescript
// src/components/ui/KpiCard.tsx
interface KpiCardProps {
  label: string                    // e.g. "Total Leads"
  value: string | number           // e.g. 42
  trend?: {
    direction: 'up' | 'down'
    percent: number                // e.g. 12 → "+12%"
  }
  icon?: React.ReactNode           // lucide-react icon
  loading?: boolean                // shows SkeletonCard when true
  error?: boolean                  // shows "--" when true
}
// Card styling: bg-white shadow-card rounded-card p-6
// Value: text-2xl font-semibold text-slate-900
// Label: text-sm text-slate-500
// Trend up: text-green-600 ▲, trend down: text-red-500 ▼
```

---

## New: NavSidebar Collapsible Contract (US16)

```typescript
// src/components/layout/NavSidebar.tsx
// Additional props/state beyond existing component:

// Collapsed state (read from localStorage on mount):
const [collapsed, setCollapsed] = useState<boolean>(
  () => localStorage.getItem('crm-sidebar-collapsed') === '1'
)

// Width transitions:
// expanded:  w-60 (240px)  — icon + text label visible
// collapsed: w-16 (64px)   — icon only; Tooltip shows label on hover
// Transition: transition-all duration-200

// Mobile drawer (useMediaQuery('(max-width: 768px)')):
// fixed inset-y-0 left-0 z-50 translate-x-0 | -translate-x-full
// Backdrop: fixed inset-0 bg-surface-overlay z-40

// Chevron toggle button:
// position: absolute right-0 top-4 translate-x-1/2
// icon: ChevronLeft (expanded) | ChevronRight (collapsed) from lucide-react
```

---

## New: LoginPage Responsive Layout (US16)

```typescript
// src/features/auth/LoginPage.tsx
// Layout structure:
//
// <div class="min-h-screen flex">
//   <!-- Brand Panel — hidden on < lg -->
//   <div class="hidden lg:flex lg:w-2/5 bg-brand flex-col justify-center p-12">
//     <Logo />
//     <h1 class="text-white text-3xl font-semibold mt-8">Your CRM, simplified.</h1>
//     <p class="text-white/70 mt-4 text-base">Manage leads, contacts, and opportunities...</p>
//   </div>
//   <!-- Form Panel -->
//   <div class="flex-1 flex items-center justify-center p-8 bg-surface-base">
//     <div class="w-full max-w-sm">
//       <Logo class="lg:hidden mb-8" />  <!-- logo visible on mobile only -->
//       <h2>Sign in to your account</h2>
//       <form ...>
//         <input name="email" ... />
//         <input name="password" ... />
//         <Button type="submit" loading={isSubmitting}>Sign in</Button>
//       </form>
//     </div>
//   </div>
// </div>

// Acceptance: entire form div fits within 1366×768 viewport height (no vertical scroll)
```

---

## New: useMediaQuery hook (US16)

```typescript
// src/hooks/useMediaQuery.ts
// Returns true when the media query matches:
function useMediaQuery(query: string): boolean
// Usage:
const isMobile = useMediaQuery('(max-width: 768px)')
// Used by NavSidebar to toggle between drawer (mobile) and collapsible panel (desktop)
```

---

## New: RecentActivityFeed (US16)

```typescript
// src/features/dashboard/RecentActivityFeed.tsx
// Props: none (self-contained)
// Fetches last 5 activities from existing GET /api/v1/activities/?sort_by=created_at&sort_dir=desc&page=1&size=5
// Renders a compact list: activity type badge | subject | contact name | relative timestamp
// Loading state: <SkeletonRow count={5} />
// Error state: subtle "Unable to load recent activity" message
```

---

## Modified: DashboardPage (US16)

```typescript
// src/features/dashboard/DashboardPage.tsx
// Layout:
//
// <main>
//   <!-- KPI Row: responsive grid -->
//   <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
//     <KpiCard label="Total Leads" value={leadsTotal} icon={<Users />} loading={leadsLoading} />
//     <KpiCard label="Open Opp. Value" value={`$${openOppValue}`} icon={<DollarSign />} loading={oppsLoading} />
//     <KpiCard label="Active Accounts" value={accountsTotal} icon={<Building2 />} loading={accsLoading} />
//     <KpiCard label="Activities Due Today" value={dueTodayCount} icon={<Calendar />} loading={activitiesLoading} />
//   </div>
//   <!-- Existing pipeline funnel (recoloured by T084) -->
//   <PipelineFunnel />
//   <!-- New: Recent activity feed -->
//   <RecentActivityFeed />
// </main>
//
// Data sources: existing React Query hooks — useLeads, useOpportunities, useAccounts, useActivities
// No new backend endpoints required
```
