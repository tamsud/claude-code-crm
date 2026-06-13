# Data Model: CRM Platform Enhancement Suite

**Feature**: `005-crm-platform-enhancements`
**Date**: 2026-06-13

---

## New Entity: User

Stores application users with hashed passwords and roles.

```
User
├── id              String(36)   PK  UUID
├── email           String(255)  NOT NULL  UNIQUE
├── display_name    String(100)  nullable
├── hashed_password String(255)  NOT NULL
├── role            Enum         NOT NULL  → UserRole
├── is_active       Boolean      NOT NULL  default=True
├── created_at      DateTime     NOT NULL  server_default=now()
└── updated_at      DateTime     NOT NULL  server_default=now(), onupdate=now()
```

**UserRole enum**: `admin` | `manager` | `sales_rep`

**Validation rules**:
- email must be unique (raises 409 on duplicate)
- password hashed with bcrypt at cost factor 12 before storage
- is_active=False prevents login (401 on login attempt)

---

## Modified Entity: Lead

Add `created_by_user_id` for Sales Rep ownership tracking.

```
Lead (existing fields unchanged, adds:)
└── created_by_user_id  String(36)  FK→users.id  nullable  SET NULL on delete
```

**Constraint**: When `current_user.role == sales_rep`, PATCH and DELETE operations check `lead.created_by_user_id == current_user.id`. If mismatch → 403.

---

## Modified Entity: Activity

Add `created_by_user_id` for Sales Rep ownership tracking.

```
Activity (existing fields unchanged, adds:)
└── created_by_user_id  String(36)  FK→users.id  nullable  SET NULL on delete
```

Same ownership constraint as Lead.

---

## JWT Payload Schema

Not a database entity — describes the JWT claims structure.

```
JWTPayload
├── sub     String  (user.id)
├── email   String  (user.email)
├── role    String  (user.role value)
└── exp     Integer (Unix timestamp, now + 3600 seconds by default)
```

---

## In-Memory Auth State (Frontend)

TypeScript types for the React Auth Context — not persisted.

```typescript
interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'sales_rep'
  displayName: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
```

---

## New API Request/Response Schemas

### Login
```
POST /api/v1/auth/login
Request:  { email: string, password: string }
Response: { access_token: string, token_type: "bearer" }
```

### Create User (Admin only)
```
POST /api/v1/users
Request:  { email: string, password: string, role: UserRole, display_name?: string }
Response: User (no hashed_password in response)
```

### Update User (Admin only)
```
PATCH /api/v1/users/{id}
Request:  { role?: UserRole, is_active?: boolean, display_name?: string }
Response: User (no hashed_password in response)
```

### List Users (Admin only)
```
GET /api/v1/users
Response: PaginatedResponse[User]
```

### Clear Database (Admin only)
```
DELETE /api/v1/admin/clear
Response: 204 No Content
```

### Seed Users (Admin only)
```
POST /api/v1/seed/users
Response: { created: int, skipped: int }
```

---

## Alembic Migrations

### Migration 003: Add Users Table
- Create `users` table with all fields
- Create unique index on `users.email`

### Migration 004: Add created_by to Leads and Activities
- Add `created_by_user_id` column (nullable, FK to users.id SET NULL) to `leads`
- Add `created_by_user_id` column (nullable, FK to users.id SET NULL) to `activities`

---

## Frontend Design Token Model (US16)

Not a database entity — describes the Tailwind design token extension in `tailwind.config.ts`.

```typescript
// tailwind.config.ts (theme.extend additions)
colors: {
  brand: {
    DEFAULT: '#1e3a5f',   // primary nav/sidebar background
    light:   '#2d5f9e',   // hover/active states
    accent:  '#6366f1',   // indigo-500 for CTA buttons, focus rings
    muted:   '#94a3b8',   // subdued labels
  },
  surface: {
    base:    '#f8fafc',   // page background (slate-50)
    card:    '#ffffff',   // card/panel background
    border:  '#e2e8f0',   // card/input border (slate-200)
    overlay: 'rgba(0,0,0,0.4)',  // mobile sidebar backdrop
  },
},
borderRadius: {
  card: '0.75rem',        // 12px — used on KPI cards, modals, panels
},
boxShadow: {
  card:     '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  dropdown: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
},
```

**Contrast ratios (AA-compliant)**:
- `brand.DEFAULT` (#1e3a5f) on white: 10.8:1 ✓ (AAA)
- `brand.accent` (#6366f1) on white: 3.0:1 — use for large text / UI components only (≥3:1 required)
- `brand.accent` (#6366f1) on `surface.card` (#ffffff) as button bg with white text: white on #6366f1 = 4.6:1 ✓ (AA)
- Muted label (`brand.muted` = #94a3b8) on white: 2.8:1 — use font-size ≥18px or pair with `text-xs` labelling only
- Black text on `surface.base` (#f8fafc): 20.9:1 ✓

## Sidebar Collapsed State (Browser Storage)

Not a database entity — describes the localStorage persistence model for sidebar UX preference.

```
localStorage key: 'crm-sidebar-collapsed'
Values:           '1' = collapsed (icon-only, 64px)
                  '0' or absent = expanded (240px)
Security note:    UX preference only; no auth or role data stored here
```

## Component State Models (US16)

```typescript
// NavSidebar collapsed state
interface SidebarState {
  collapsed: boolean   // persisted to localStorage
  mobileOpen: boolean  // not persisted; resets on mount
}

// KpiCard data shape
interface KpiCardData {
  label: string
  value: string | number
  trend?: { direction: 'up' | 'down'; percent: number }
  icon?: React.ReactNode
  loading: boolean
  error: boolean
}

// Skeleton variants
type SkeletonVariant = 'card' | 'row' | 'text'
interface SkeletonProps {
  variant: SkeletonVariant
  count?: number   // number of repeated skeleton items
  className?: string
}
```
