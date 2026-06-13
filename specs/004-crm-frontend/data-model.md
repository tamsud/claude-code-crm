# Data Model: Sales CRM Frontend

**Feature**: 004-crm-frontend | **Date**: 2026-06-13

This document defines the TypeScript type system, query key conventions, derived state computations, and the lead status state machine for the frontend. All interfaces mirror the backend API response shapes documented in `specs/003-frontend/seed-data-reference.md`.

---

## 1. Backend API Response Interfaces

Defined in `frontend/src/types/api.ts`.

```typescript
// ─── Pagination wrapper (all list endpoints) ───────────────────────────────
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

// ─── Account ──────────────────────────────────────────────────────────────
export interface Account {
  id: string;            // UUID
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;    // ISO datetime string
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
}

export type AccountUpdate = Partial<AccountCreate>;

// ─── Contact ──────────────────────────────────────────────────────────────
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  account_id?: string | null;
}

export type ContactUpdate = Partial<ContactCreate>;

// ─── Lead ─────────────────────────────────────────────────────────────────
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  converted_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email: string;
  company?: string | null;
  source?: string | null;
  status?: LeadStatus;
  notes?: string | null;
}

export type LeadUpdate = Partial<LeadCreate>;

export interface LeadStatusUpdate {
  status: LeadStatus;
}

export interface ConvertLeadResponse {
  lead: Lead;
  opportunity: Opportunity;
}

// ─── Opportunity ──────────────────────────────────────────────────────────
export type OpportunityStage =
  | 'prospecting'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost';

export interface Opportunity {
  id: string;
  title: string;
  account_id: string;
  contact_id: string | null;
  stage: OpportunityStage;
  value: number | null;        // USD; must be > 0 if set
  probability: number | null;  // 0–100
  expected_close_date: string | null;  // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  title: string;
  account_id: string;
  contact_id?: string | null;
  stage: OpportunityStage;
  value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
}

export type OpportunityUpdate = Partial<OpportunityCreate>;

// ─── Activity ─────────────────────────────────────────────────────────────
export type ActivityType = 'call' | 'email' | 'meeting';

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  notes: string | null;
  activity_date: string | null;  // ISO datetime
  contact_id: string | null;
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityCreate {
  type: ActivityType;
  subject: string;
  notes?: string | null;
  activity_date?: string | null;
  contact_id?: string | null;
  opportunity_id?: string | null;
}

export type ActivityUpdate = Partial<ActivityCreate>;

// ─── Email Message ────────────────────────────────────────────────────────
export interface EmailMessage {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string | null;
  html_body: string | null;
  sent_at: string;    // ISO datetime
  created_at: string;
}

export interface EmailSend {
  from_email: string;
  to_email: string;
  subject: string;
  body?: string | null;
  html_body?: string | null;
}

// ─── Seed ────────────────────────────────────────────────────────────────
export interface SeedResult {
  message: string;
  seeded: {
    accounts: number;
    contacts: number;
    leads: number;
    opportunities: number;
    activities: number;
    emails: number;
  };
}
```

---

## 2. UI-Only Types

Defined in `frontend/src/types/ui.ts`.

```typescript
// Tab IDs for contact detail page
export type ContactTab = 'overview' | 'history' | 'emails';

// Tab IDs for account detail page
export type AccountTab = 'contacts' | 'opportunities';

// Pipeline view mode (persisted to localStorage)
export type PipelineView = 'board' | 'table';

// Lead status filter (includes 'all')
export type LeadStatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'lost';

// Activity type filter (includes 'all')
export type ActivityTypeFilter = 'all' | 'call' | 'email' | 'meeting';

// Generic filter params passed to list API calls
export interface AccountListParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface ContactListParams {
  page?: number;
  size?: number;
  account_id?: string;
}

export interface LeadListParams {
  page?: number;
  size?: number;
  status?: string;
}

export interface OpportunityListParams {
  page?: number;
  size?: number;
  stage?: string;
  account_id?: string;
  contact_id?: string;
}

export interface ActivityListParams {
  page?: number;
  size?: number;
  type?: string;
  contact_id?: string;
  opportunity_id?: string;
}

export interface EmailListParams {
  page?: number;
  size?: number;
  to?: string;
}
```

---

## 3. React Query Key Factory

Defined in `frontend/src/queryKeys.ts`. Centralised to ensure consistent cache invalidation.

```typescript
export const queryKeys = {
  // Accounts
  accounts:      (params: AccountListParams = {}) => ['accounts', params] as const,
  account:       (id: string) => ['account', id] as const,

  // Contacts
  contacts:      (params: ContactListParams = {}) => ['contacts', params] as const,
  contact:       (id: string) => ['contact', id] as const,

  // Leads
  leads:         (params: LeadListParams = {}) => ['leads', params] as const,
  lead:          (id: string) => ['lead', id] as const,

  // Opportunities
  opportunities: (params: OpportunityListParams = {}) => ['opportunities', params] as const,
  opportunity:   (id: string) => ['opportunity', id] as const,

  // Activities
  activities:    (params: ActivityListParams = {}) => ['activities', params] as const,
  activity:      (id: string) => ['activity', id] as const,

  // Mock Email
  emails:        (params: EmailListParams = {}) => ['emails', params] as const,
  email:         (id: string) => ['email', id] as const,
} as const;
```

**Invalidation rules** (after mutations):
- Create account → invalidate `['accounts']` (all params)
- Update/delete account → invalidate `['account', id]` + `['accounts']`
- Create/update/delete contact → invalidate `['contacts']` + `['account', accountId]` (contacts tab)
- Lead status change → invalidate `['lead', id]` + `['leads']`
- Lead convert → invalidate `['lead', id]` + `['leads']` + `['opportunities']`
- Create activity → invalidate `['activities']` + `['contact', contactId]` + `['opportunity', opportunityId]`
- Seed or clear → invalidate everything: `queryClient.invalidateQueries()`

---

## 4. Lead Status State Machine

Defined in `frontend/src/utils/leadStateMachine.ts`.

```typescript
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';

export const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new:       ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['lost'],
  lost:      [],
};

// Returns only the valid next states from the current status
export function getNextStates(current: LeadStatus): LeadStatus[] {
  return VALID_TRANSITIONS[current];
}

// Whether the "Convert to Opportunity" button should be enabled
export function canConvert(lead: Pick<Lead, 'status' | 'converted_opportunity_id'>): boolean {
  return lead.status === 'qualified' && lead.converted_opportunity_id === null;
}

// Whether any status transitions are available (false = terminal state)
export function hasTransitions(current: LeadStatus): boolean {
  return VALID_TRANSITIONS[current].length > 0;
}
```

**State diagram**:
```
new ──────────────────────────────────────────── lost (terminal)
 │                                                 ↑
 └─→ contacted ──────────────────────────────── lost
          │                                       ↑
          └─→ qualified ──────────────────────── lost
                   │
                   └─→ [Convert to Opportunity]
```

---

## 5. Derived Metrics

Defined in `frontend/src/utils/metrics.ts`. All functions are pure — no side effects.

```typescript
import type { Lead, Opportunity, Activity } from '../types/api';

// Weighted pipeline: sum of (value × probability/100) for open deals
// "Open" = not closed-won or closed-lost
export function computeWeightedPipeline(opps: Opportunity[]): number {
  return opps
    .filter((o) => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
    .reduce((sum, o) => {
      if (o.value == null || o.probability == null) return sum;
      return sum + (o.value * o.probability) / 100;
    }, 0);
}

// Total open pipeline value (excludes closed stages)
export function computeOpenPipeline(opps: Opportunity[]): number {
  return opps
    .filter((o) => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
    .reduce((sum, o) => sum + (o.value ?? 0), 0);
}

// Win rate: closed-won / (closed-won + closed-lost). Returns null if no closed deals.
export function computeWinRate(opps: Opportunity[]): number | null {
  const won = opps.filter((o) => o.stage === 'closed-won').length;
  const lost = opps.filter((o) => o.stage === 'closed-lost').length;
  if (won + lost === 0) return null;
  return Math.round((won / (won + lost)) * 100);
}

// Active lead count: new + contacted + qualified
export function computeActiveLeadCount(leads: Lead[]): number {
  return leads.filter((l) =>
    l.status === 'new' || l.status === 'contacted' || l.status === 'qualified'
  ).length;
}

// Days since last contact: most recent activity_date for a contact's activities
// Returns null if no activities exist.
export function computeDaysSinceLastContact(activities: Activity[]): number | null {
  const sorted = activities
    .filter((a) => a.activity_date != null)
    .sort((a, b) =>
      new Date(b.activity_date!).getTime() - new Date(a.activity_date!).getTime()
    );
  if (sorted.length === 0) return null;
  const ms = Date.now() - new Date(sorted[0].activity_date!).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
```

---

## 6. Formatters

Defined in `frontend/src/utils/formatters.ts`.

```typescript
// Currency: null → "—", number → "$X,XXX" or "$X,XXX.XX"
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Date: null → "—", recent (≤30 days) → "N days ago", older → "Jan 15, 2025"
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 30) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

// Plain date: "YYYY-MM-DD" → "Jan 15, 2025", null → "—"
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// Probability: null → "—", 75 → "75%"
export function formatProbability(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value}%`;
}
```

---

## 7. Entity Relationships

```
Account ─────────────────┐
   │                     │
   ├──< Contact >────────┤ (account_id FK; nullable on contact)
   │        │            │
   │        └──< Activity (contact_id FK; nullable)
   │                     │
   └──< Opportunity >────┘ (account_id FK; required)
            │
            ├──< Activity (opportunity_id FK; nullable)
            │
            └── Lead.converted_opportunity_id (one-way reference)

EmailMessage.to_email (unlinked — matched by string against Contact.email)
```

**Cascade rules** (enforced by backend):
- Cannot delete Account that has Contacts or Opportunities → HTTP 409
- Cannot delete Contact that has Activities → HTTP 409 (backend may allow; check actual constraint)
- Deleting an Activity has no cascade

---

## 8. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Contact.email | Unique across all contacts | "Email already in use" |
| Activity | contact_id OR opportunity_id must be set | "Activity must be linked to a contact or opportunity" |
| Opportunity.value | null OR > 0 | "Value must be greater than zero" |
| Opportunity.probability | null OR 0–100 (integer) | "Probability must be between 0 and 100" |
| Lead status transition | Must be in VALID_TRANSITIONS[current] | "Invalid status transition" |
| Lead.converted_opportunity_id | Null for convert button to be enabled | "Lead already converted" |
| Any required text field | Non-empty string | "This field is required" |
