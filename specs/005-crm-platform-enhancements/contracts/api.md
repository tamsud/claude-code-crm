# API Contracts: CRM Platform Enhancement Suite

**Feature**: `005-crm-platform-enhancements`
**Date**: 2026-06-13

All existing API endpoints remain unchanged **except** for the addition of optional `sort_by`, `sort_dir`, and entity-specific `search`/filter params on all list endpoints. These params are backwards-compatible (all optional, defaults preserved). New and modified endpoints are documented below.

---

## Authentication

### POST /api/v1/auth/login

**Access**: Public (no JWT required)

**Request**:
```json
{
  "email": "admin@crm.local",
  "password": "password123"
}
```

**Response 200**:
```json
{
  "access_token": "<jwt-string>",
  "token_type": "bearer"
}
```

**Error Responses**:
- `401 Unauthorized` — invalid credentials or deactivated user
  ```json
  { "detail": "Invalid email or password" }
  ```

---

## Users (Admin Only)

All endpoints require `Authorization: Bearer <token>` with Admin role.

### GET /api/v1/users

**Query params**: `page=1&size=20`

**Response 200**:
```json
{
  "total": 3,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": "uuid",
      "email": "admin@crm.local",
      "display_name": "CRM Admin",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-06-13T10:00:00Z",
      "updated_at": "2026-06-13T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized` — missing/invalid token
- `403 Forbidden` — non-Admin role

---

### POST /api/v1/users

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "manager",
  "display_name": "New User"
}
```

**Response 201**: `User` object (no password field)

**Error Responses**:
- `409 Conflict` — email already exists
  ```json
  { "detail": "Email already registered" }
  ```
- `422 Unprocessable Entity` — validation error

---

### PATCH /api/v1/users/{id}

**Request** (all fields optional):
```json
{
  "role": "sales_rep",
  "is_active": false,
  "display_name": "Updated Name"
}
```

**Response 200**: Updated `User` object

**Error Responses**:
- `404 Not Found` — user not found
- `403 Forbidden` — non-Admin role

---

## Seed Users

### POST /api/v1/seed/users

**Access**: Admin only

**Request**: Empty body or `{}`

**Response 200**:
```json
{
  "created": 3,
  "skipped": 0
}
```

If run again when users exist:
```json
{
  "created": 0,
  "skipped": 3
}
```

---

## Admin Operations

### DELETE /api/v1/admin/clear

**Access**: Admin only

**Description**: Deletes all rows from leads, contacts, accounts, opportunities, activities, email_messages. Does NOT delete users.

**Response**: `204 No Content`

**Error Responses**:
- `401 Unauthorized` — missing/invalid token
- `403 Forbidden` — non-Admin role

---

## Modified: List Endpoints (sorting & filtering additions)

All list endpoints below gain optional `sort_by` and `sort_dir` params. All params are optional — omitting them preserves existing default behaviour.

### GET /api/v1/accounts/ (modified)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | Partial case-insensitive match on `name` |
| `sort_by` | string | `created_at` | Allowed: `name`, `industry`, `created_at` |
| `sort_dir` | string | `desc` | `asc` or `desc`; invalid value → `desc` |

**Example**: `GET /api/v1/accounts/?search=acme&sort_by=name&sort_dir=asc`

---

### GET /api/v1/contacts/ (modified)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | Partial match on first_name, last_name, or email |
| `sort_by` | string | `created_at` | Allowed: `last_name`, `first_name`, `email`, `created_at` |
| `sort_dir` | string | `desc` | `asc` or `desc` |

Existing `account_id` filter is preserved.

---

### GET /api/v1/leads/ (modified)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `search` | string | — | Partial match on first_name, last_name, email, or company |
| `sort_by` | string | `created_at` | Allowed: `last_name`, `company`, `status`, `created_at` |
| `sort_dir` | string | `desc` | `asc` or `desc` |

Existing `status` filter is preserved.

---

### GET /api/v1/opportunities/ (modified)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `sort_by` | string | `created_at` | Allowed: `value`, `expected_close_date`, `title`, `created_at` |
| `sort_dir` | string | `desc` | `asc` or `desc` |

Existing `stage`, `account_id`, `contact_id` filters are preserved.

---

### GET /api/v1/activities/ (modified)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `sort_by` | string | `created_at` | Allowed: `due_date`, `activity_type`, `created_at` |
| `sort_dir` | string | `desc` | `asc` or `desc` |

Existing `contact_id`, `opportunity_id`, `activity_type` filters are preserved.

---

### GET /api/v1/users (modified — Admin only)

**New query params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `role` | string | — | Filter by role: `admin`, `manager`, `sales_rep` |
| `is_active` | bool | — | Filter by active status |
| `sort_by` | string | `created_at` | Allowed: `email`, `role`, `created_at` |
| `sort_dir` | string | `asc` | `asc` or `desc` |

---

## New: Self-Service Profile Update

### GET /api/v1/users/me

**Access**: Any authenticated user

**Response 200**: `User` object for the current JWT's user (same shape as user list items, no password field).

---

### PATCH /api/v1/users/me

**Access**: Any authenticated user (updates own profile only)

**Request** (all fields optional):
```json
{
  "display_name": "My New Name"
}
```

**Response 200**: Updated `User` object

**Note**: Users cannot change their own role or is_active status via this endpoint. Only `display_name` is allowed. Role/active changes require Admin via `PATCH /api/v1/users/{id}`.

---

## Modified: Lead Create (adds mock email side-effect)

### POST /api/v1/leads/ (no contract change)

Existing contract unchanged. Side effect added: on successful lead creation, a mock email notification is automatically created in the `email_messages` table:
- `from_email`: `crm-system@company.internal`
- `to_email`: `crm-leads@company.internal`
- `subject`: `New Lead: {first_name} {last_name}`
- `body`: Lead details (name, email, company, source)

The response contract of POST /api/v1/leads/ is unchanged.

---

## Error Response Pattern (existing, unchanged)

All API errors follow:
```json
{ "detail": "Human-readable error message" }
```

RBAC errors:
- `401` — JWT missing, malformed, or expired
- `403` — Valid JWT but insufficient role for this operation
