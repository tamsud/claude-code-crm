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
