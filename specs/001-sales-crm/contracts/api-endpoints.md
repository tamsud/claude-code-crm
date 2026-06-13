# API Contract: Sales CRM

**Phase**: 1 — Design
**Date**: 2026-06-13
**Base URL**: `/api/v1`
**Format**: JSON (Content-Type: application/json)
**Auth**: None (v1 — all endpoints unauthenticated)

---

## Common Patterns

### Paginated List Response

All `GET /resource` list endpoints return:

```json
{
  "total": 150,
  "page": 1,
  "size": 20,
  "items": [ ... ]
}
```

**Query parameters** (all list endpoints):
| Parameter | Type    | Default | Max | Description           |
|-----------|---------|---------|-----|-----------------------|
| `page`    | integer | 1       | —   | 1-indexed page number |
| `size`    | integer | 20      | 100 | Records per page      |

### Error Response

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

| HTTP Status | When Used                                                          |
|-------------|--------------------------------------------------------------------|
| 400         | Business rule violation (invalid lead transition, unqualified lead conversion) |
| 404         | Resource not found                                                |
| 409         | Conflict (account has dependents, email already exists)           |
| 422         | Pydantic schema validation failure (invalid field values)         |

---

## Accounts

### `GET /api/v1/accounts`

List all accounts (paginated).

**Response 200**:
```json
{
  "total": 5,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corp",
      "industry": "Manufacturing",
      "website": "https://acme.example.com",
      "phone": "+1-555-0100",
      "address": "123 Main St, Springfield",
      "created_at": "2026-06-13T10:00:00Z",
      "updated_at": "2026-06-13T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/accounts`

Create a new account.

**Request body**:
```json
{
  "name": "Acme Corp",
  "industry": "Manufacturing",
  "website": "https://acme.example.com",
  "phone": "+1-555-0100",
  "address": "123 Main St, Springfield"
}
```
*Required: `name`. All others optional.*

**Response 201**: AccountResponse (same shape as list item above)

---

### `GET /api/v1/accounts/{id}`

Get a single account.

**Response 200**: AccountResponse
**Response 404**: `{"detail": "Account not found", "code": "ACCOUNT_NOT_FOUND"}`

---

### `PATCH /api/v1/accounts/{id}`

Partially update an account. All fields optional.

**Request body**: Any subset of Account fields (excluding `id`, `created_at`, `updated_at`)
**Response 200**: Updated AccountResponse
**Response 404**: Account not found

---

### `DELETE /api/v1/accounts/{id}`

Delete an account.

**Response 204**: No content (success)
**Response 404**: Account not found
**Response 409**:
```json
{
  "detail": "Cannot delete account: has 3 contact(s) and 1 opportunity(ies)",
  "code": "ACCOUNT_HAS_DEPENDENTS"
}
```

---

## Contacts

### `GET /api/v1/contacts`

List contacts. Optional filter: `?account_id={uuid}`

**Response 200**: PaginatedResponse[ContactResponse]

ContactResponse shape:
```json
{
  "id": "uuid",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@acme.example.com",
  "phone": "+1-555-0101",
  "job_title": "VP Sales",
  "account_id": "uuid-of-account",
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

---

### `POST /api/v1/contacts`

Create a contact.

**Request body**:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@acme.example.com",
  "phone": "+1-555-0101",
  "job_title": "VP Sales",
  "account_id": "uuid-of-account"
}
```
*Required: `first_name`, `last_name`, `email`. Others optional.*

**Response 201**: ContactResponse
**Response 409**: `{"detail": "Email already registered", "code": "EMAIL_CONFLICT"}`

---

### `GET /api/v1/contacts/{id}`

**Response 200**: ContactResponse | **Response 404**: Not found

---

### `PATCH /api/v1/contacts/{id}`

**Request body**: Any subset of contact fields (excluding id, timestamps)
**Response 200**: Updated ContactResponse
**Response 409**: Email conflict (if updating email to one already in use)

---

### `DELETE /api/v1/contacts/{id}`

**Response 204**: Deleted
**Response 404**: Not found

---

## Leads

### `GET /api/v1/leads`

List leads. Optional filter: `?status=new|contacted|qualified|lost`

LeadResponse shape:
```json
{
  "id": "uuid",
  "first_name": "Bob",
  "last_name": "Smith",
  "email": "bob.smith@prospect.com",
  "phone": "+1-555-0200",
  "company": "Prospect Inc",
  "status": "new",
  "source": "website",
  "notes": "Interested in enterprise plan",
  "converted_opportunity_id": null,
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

---

### `POST /api/v1/leads`

Create a lead.

**Request body**:
```json
{
  "first_name": "Bob",
  "last_name": "Smith",
  "email": "bob.smith@prospect.com",
  "phone": "+1-555-0200",
  "company": "Prospect Inc",
  "source": "website",
  "notes": "Interested in enterprise plan"
}
```
*Required: `first_name`, `last_name`, `email`. Status auto-set to `new`.*

**Response 201**: LeadResponse

---

### `GET /api/v1/leads/{id}`

**Response 200**: LeadResponse | **Response 404**: Not found

---

### `PATCH /api/v1/leads/{id}`

Update lead. Status changes validated against state machine.

**Request body**: Any subset of lead fields. When `status` is included, the transition is validated.

**Response 200**: Updated LeadResponse
**Response 400** (invalid transition):
```json
{
  "detail": "Invalid status transition: 'lost' → 'new'. Lost leads cannot be reopened.",
  "code": "INVALID_LEAD_TRANSITION"
}
```

---

### `DELETE /api/v1/leads/{id}`

**Response 204**: Deleted | **Response 404**: Not found

---

### `POST /api/v1/leads/{id}/convert`

Convert a qualified lead into an Opportunity (with Account and Contact).

**Request body**: Empty `{}` (no body required)

**Response 201**: OpportunityResponse (the newly created opportunity)
**Response 400** (not qualified):
```json
{
  "detail": "Lead must have status 'qualified' before conversion. Current status: 'contacted'.",
  "code": "LEAD_NOT_QUALIFIED"
}
```
**Response 404**: Lead not found

---

## Opportunities

### `GET /api/v1/opportunities`

List opportunities. Optional filters: `?stage=prospecting&account_id={uuid}&contact_id={uuid}`

OpportunityResponse shape:
```json
{
  "id": "uuid",
  "title": "Acme Corp - Enterprise Deal",
  "account_id": "uuid",
  "contact_id": "uuid",
  "stage": "proposal",
  "value": 25000.00,
  "probability": 60,
  "expected_close_date": "2026-09-30",
  "created_at": "2026-06-13T10:00:00Z",
  "updated_at": "2026-06-13T10:00:00Z"
}
```

---

### `POST /api/v1/opportunities`

Create an opportunity.

**Request body**:
```json
{
  "title": "Acme Corp - Enterprise Deal",
  "account_id": "uuid",
  "contact_id": "uuid",
  "stage": "proposal",
  "value": 25000.00,
  "probability": 60,
  "expected_close_date": "2026-09-30"
}
```
*Required: `title`, `account_id`. Stage defaults to `prospecting`. Value must be > 0 if provided.*

**Response 201**: OpportunityResponse
**Response 422** (invalid value):
```json
{
  "detail": [{"loc": ["body", "value"], "msg": "Value must be greater than 0", "type": "value_error"}]
}
```

---

### `GET /api/v1/opportunities/{id}`

**Response 200**: OpportunityResponse | **Response 404**: Not found

---

### `PATCH /api/v1/opportunities/{id}`

Update opportunity. Any field can be changed including stage (no sequence enforced).

**Response 200**: Updated OpportunityResponse
**Response 422**: Value validation failure

---

### `DELETE /api/v1/opportunities/{id}`

**Response 204**: Deleted | **Response 404**: Not found

---

## Activities

### `GET /api/v1/activities`

List activities. Optional filters: `?type=call|email|meeting&contact_id={uuid}&opportunity_id={uuid}`

ActivityResponse shape:
```json
{
  "id": "uuid",
  "type": "call",
  "subject": "Discovery call with Jane Doe",
  "notes": "Discussed pricing, next steps: send proposal",
  "activity_date": "2026-06-13T14:30:00Z",
  "contact_id": "uuid",
  "opportunity_id": "uuid",
  "created_at": "2026-06-13T14:30:00Z",
  "updated_at": "2026-06-13T14:30:00Z"
}
```

---

### `POST /api/v1/activities`

Log a new activity.

**Request body**:
```json
{
  "type": "call",
  "subject": "Discovery call with Jane Doe",
  "notes": "Discussed pricing",
  "activity_date": "2026-06-13T14:30:00Z",
  "contact_id": "uuid",
  "opportunity_id": "uuid"
}
```
*Required: `type`, `subject`, and at least one of `contact_id` or `opportunity_id`.*

**Response 201**: ActivityResponse
**Response 400** (no linked entity):
```json
{
  "detail": "Activity must be linked to at least one Contact or Opportunity.",
  "code": "ACTIVITY_NO_LINK"
}
```

---

### `GET /api/v1/activities/{id}`

**Response 200**: ActivityResponse | **Response 404**: Not found

---

### `PATCH /api/v1/activities/{id}`

Update activity. Linked entity constraint re-validated if contact_id or opportunity_id are changed to null.

**Response 200**: Updated ActivityResponse | **Response 400**: Link constraint violation

---

### `DELETE /api/v1/activities/{id}`

**Response 204**: Deleted | **Response 404**: Not found
