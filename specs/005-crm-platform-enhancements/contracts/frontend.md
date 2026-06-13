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
