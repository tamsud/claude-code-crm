# API Contracts: Sales CRM Frontend → Backend

**Feature**: 004-crm-frontend | **Date**: 2026-06-13

Backend base URL: `http://localhost:8000` (via `VITE_API_BASE_URL` env var)

All endpoints are under `/api/v1/`. All list endpoints return `PaginatedResponse<T>`. All timestamps are ISO 8601 UTC strings.

---

## Error Response Shape

All 4xx/5xx responses return:

```json
{
  "detail": "Human-readable message string",
  "code": "HTTP_ERROR | VALIDATION_ERROR | ..."
}
```

For HTTP 422 (validation), `detail` is an array of Pydantic error objects:
```json
{
  "detail": [{ "loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error.email" }],
  "code": "VALIDATION_ERROR"
}
```

The Axios interceptor in `src/api/client.ts` normalises all errors into a plain `Error` with a human-readable `message` string.

---

## Accounts

### `GET /api/v1/accounts/`
**Query params**: `page` (int, default 1), `size` (int, default 20, max 100), `search` (string, partial name match)

**Response 200**:
```json
{
  "total": 4,
  "page": 1,
  "size": 20,
  "items": [
    { "id": "uuid", "name": "TechStart Inc", "industry": "Technology", "website": "https://techstart.io", "phone": "+1-415-555-0101", "created_at": "...", "updated_at": "..." }
  ]
}
```

### `POST /api/v1/accounts/`
**Body**: `{ "name": "string", "industry"?: "string|null", "website"?: "string|null", "phone"?: "string|null" }`
**Response 201**: Full Account object
**Error 422**: Validation error (name required)

### `GET /api/v1/accounts/{id}`
**Response 200**: Full Account object
**Error 404**: `{ "detail": "Account not found" }`

### `PATCH /api/v1/accounts/{id}`
**Body**: Partial Account fields
**Response 200**: Updated Account object
**Error 404**: Not found

### `DELETE /api/v1/accounts/{id}`
**Response 204**: No content
**Error 404**: Not found
**Error 409**: `{ "detail": "Cannot delete account with linked contacts or opportunities" }`

---

## Contacts

### `GET /api/v1/contacts/`
**Query params**: `page`, `size`, `account_id` (UUID filter)

**Response 200**: `PaginatedResponse<Contact>`

### `POST /api/v1/contacts/`
**Body**: `{ "first_name": "string", "last_name": "string", "email": "string", "phone"?: "string|null", "job_title"?: "string|null", "account_id"?: "string|null" }`
**Response 201**: Full Contact object
**Error 409**: `{ "detail": "Contact with this email already exists" }`
**Error 422**: Validation (email format, required fields)

### `GET /api/v1/contacts/{id}`
**Response 200**: Full Contact object
**Error 404**: Not found

### `PATCH /api/v1/contacts/{id}`
**Body**: Partial Contact fields
**Response 200**: Updated Contact object
**Error 409**: Duplicate email

### `DELETE /api/v1/contacts/{id}`
**Response 204**: No content
**Error 404**: Not found

---

## Leads

### `GET /api/v1/leads/`
**Query params**: `page`, `size`, `status` (exact match: `new|contacted|qualified|lost`)

**Response 200**: `PaginatedResponse<Lead>`

### `POST /api/v1/leads/`
**Body**: `{ "first_name": "string", "last_name": "string", "email": "string", "company"?: "string|null", "source"?: "string|null", "status"?: "new", "notes"?: "string|null" }`
**Response 201**: Full Lead object
**Error 422**: Validation

### `GET /api/v1/leads/{id}`
**Response 200**: Full Lead object (includes `converted_opportunity_id`)
**Error 404**: Not found

### `PATCH /api/v1/leads/{id}`
**Body**: Partial Lead fields (including `status` for transition)
**Response 200**: Updated Lead object
**Error 400**: `{ "detail": "Invalid lead status transition: new → qualified", "code": "INVALID_LEAD_TRANSITION" }`
**Error 404**: Not found

### `POST /api/v1/leads/{id}/convert`
**Body**: None
**Response 201**: `{ "lead": Lead, "opportunity": Opportunity }` — lead's `converted_opportunity_id` is set
**Error 400**: `{ "detail": "Lead already converted" }` or `{ "detail": "Lead must be in qualified status to convert" }`
**Error 404**: Not found

### `DELETE /api/v1/leads/{id}`
**Response 204**: No content

---

## Opportunities

### `GET /api/v1/opportunities/`
**Query params**: `page`, `size`, `stage`, `account_id`, `contact_id`

**Response 200**: `PaginatedResponse<Opportunity>`

### `POST /api/v1/opportunities/`
**Body**: `{ "title": "string", "account_id": "uuid", "contact_id"?: "uuid|null", "stage": "prospecting|proposal|negotiation|closed-won|closed-lost", "value"?: "number|null", "probability"?: "number|null", "expected_close_date"?: "YYYY-MM-DD|null" }`
**Response 201**: Full Opportunity object
**Error 422**: Validation (value must be > 0 if set; probability 0–100; account_id required)

### `GET /api/v1/opportunities/{id}`
**Response 200**: Full Opportunity object
**Error 404**: Not found

### `PATCH /api/v1/opportunities/{id}`
**Body**: Partial Opportunity fields
**Response 200**: Updated Opportunity object

### `DELETE /api/v1/opportunities/{id}`
**Response 204**: No content

---

## Activities

### `GET /api/v1/activities/`
**Query params**: `page`, `size`, `type` (call|email|meeting), `contact_id`, `opportunity_id`

**Response 200**: `PaginatedResponse<Activity>`

### `POST /api/v1/activities/`
**Body**: `{ "type": "call|email|meeting", "subject": "string", "notes"?: "string|null", "activity_date"?: "ISO datetime|null", "contact_id"?: "uuid|null", "opportunity_id"?: "uuid|null" }`
**Response 201**: Full Activity object
**Error 422**: Validation (type and subject required; at least one of contact_id or opportunity_id should be set — backend may or may not enforce this; frontend always enforces it client-side per FR-027)

### `GET /api/v1/activities/{id}`
**Response 200**: Full Activity object
**Error 404**: Not found

### `PATCH /api/v1/activities/{id}`
**Body**: Partial Activity fields
**Response 200**: Updated Activity object

### `DELETE /api/v1/activities/{id}`
**Response 204**: No content

---

## Mock Email

### `GET /api/v1/mock-email/`
**Query params**: `page`, `size`, `to` (exact recipient email filter)

**Response 200**: `PaginatedResponse<EmailMessage>`

### `POST /api/v1/mock-email/`
**Body**: `{ "from_email": "string (valid email)", "to_email": "string (valid email)", "subject": "string", "body"?: "string|null", "html_body"?: "string|null" }`
**Response 201**: Full EmailMessage object
**Error 422**: Invalid email addresses

### `GET /api/v1/mock-email/{id}`
**Response 200**: Full EmailMessage object
**Error 404**: Not found

### `DELETE /api/v1/mock-email/`
**Response 200**: `{ "message": "All emails cleared", "count": 8 }`

---

## Seed Management

### `POST /api/v1/seed/`
**Body**: None
**Response 201**:
```json
{
  "message": "Demo data seeded successfully.",
  "seeded": {
    "accounts": 4,
    "contacts": 4,
    "leads": 3,
    "opportunities": 4,
    "activities": 9,
    "emails": 8
  }
}
```

### `DELETE /api/v1/seed/`
**Response 200**: `{ "message": "All data cleared successfully." }`

---

## Health Check

### `GET /health`
**Response 200**: `{ "status": "ok" }`
Used by frontend startup to verify backend is reachable before showing the app.

---

## API Module Structure (`frontend/src/api/`)

### `client.ts`
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Unwrap backend error detail into plain Error message
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg: string }) => d.msg).join('; ')
          : err.message ?? 'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

export default client;
```

### Per-entity module pattern (example: `contacts.ts`)
```typescript
import client from './client';
import type { Contact, ContactCreate, ContactUpdate, ContactListParams, PaginatedResponse } from '../types/api';

const BASE = '/api/v1/contacts';

export const contactsApi = {
  list:   (p: ContactListParams = {}) => client.get<PaginatedResponse<Contact>>(BASE + '/', { params: p }).then(r => r.data),
  get:    (id: string) => client.get<Contact>(`${BASE}/${id}`).then(r => r.data),
  create: (body: ContactCreate) => client.post<Contact>(BASE + '/', body).then(r => r.data),
  update: (id: string, body: ContactUpdate) => client.patch<Contact>(`${BASE}/${id}`, body).then(r => r.data),
  delete: (id: string) => client.delete(`${BASE}/${id}`),
};
```
