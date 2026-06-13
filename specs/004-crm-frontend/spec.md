# Feature Specification: Sales CRM Frontend

**Feature Branch**: `004-crm-frontend`

**Created**: 2026-06-13

**Status**: Draft

**Input**: React 18 single-page application that consumes the existing FastAPI backend at http://localhost:8000 — full CRUD UI for Accounts, Contacts, Leads, Opportunities, Activities, Mock Email, and Demo Seed management.

---

## Clarifications

### Session 2026-06-13

- Q: Should the UI follow the visual layout pattern shown in mock1.png (CRM-style header with entity name + company, left profile sidebar, tab navigation)? → A: Yes — the contact detail page and all entity detail pages must follow the CRM layout convention from mock1.png: top header bar showing "ContactName, AccountName", left profile sidebar, horizontal tab navigation, and action buttons in the header bar.
- Q: Should API response fields be explicitly mapped to the UI display labels they populate? → A: Yes — added API Field Display Mapping section to Key Entities. Every displayed field traces to a named API response field.
- Q: Should the spec include unit and integration test scenario requirements? → A: Yes — added Testing Requirements section (TC-U001–TC-U009 unit, TC-I001–TC-I012 integration) covering all pages and business rules.
- Q: Are any mock1.png KPIs derivable from the existing backend APIs? → A: "Days since last contact" is derivable from the most recent activity date linked to a contact — added as FR-045. Health score, NPS, renewal, enrichment, and AI panel remain out of scope.
- Q: What Node.js and npm versions must the frontend be compatible with? → A: Node.js v22.17.1 (LTS 22.x) and npm 10.9.2. All planned packages (Vite 5/6, React 18, TypeScript 5, TailwindCSS 3, React Query v5, React Router v6, Axios 1.x, Recharts) require Node ≥ 18 — v22.17.1 is fully compatible. Package version ranges must enforce `engines.node >= 18` in package.json.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pipeline Dashboard (Priority: P1)

A sales manager opens the application and immediately sees the health of the entire pipeline on a single screen: how many accounts exist, how many leads are active at each stage, the total and weighted value of open opportunities, the current win rate, and the 5 most recent sales activities. No navigation is required to get this overview.

**Why this priority**: The dashboard is the entry point for every session. It validates that the frontend connects to the backend, that data renders correctly, and that all derived metrics are computed accurately. It is the MVP that proves the integration works end-to-end.

**Independent Test**: Seed demo data via the admin tool, then open the dashboard and verify all KPI cards show non-zero values matching the seeded records (4 accounts, 2 active leads, $445,000 open pipeline, $237,500 weighted pipeline, 100% win rate).

**Acceptance Scenarios**:

1. **Given** demo data is seeded, **When** the user opens the dashboard, **Then** they see: total accounts (4), active lead count (2), open pipeline value ($445,000), weighted pipeline value ($237,500), win rate (100%), and the 5 most recent activities listed by date with type icon and subject.
2. **Given** all data has been cleared, **When** the user opens the dashboard, **Then** all KPI cards show zero/empty and the activity feed shows an empty-state message.
3. **Given** the backend is running, **When** the dashboard loads, **Then** all data is fetched live from the API — no hardcoded values appear.

---

### User Story 2 — Account & Contact Management (Priority: P2)

A sales rep needs to view, create, update, and delete company accounts and their associated contacts. They can search accounts by name, filter contacts by account, and navigate from a contact directly to its parent account and back. Creating an account or contact opens an inline form without navigating away from the list.

The contact detail page follows the CRM layout from the design mock: a header bar displaying "FirstName LastName, AccountName", a left profile sidebar with the contact's avatar, job title, phone, and email, and a horizontal tab strip for different views of the contact.

**Why this priority**: Accounts and Contacts are the foundational records that Leads, Opportunities, and Activities all reference. Without them, no other entity can be meaningfully linked.

**Independent Test**: Starting from an empty database, create one account and one contact linked to it, verify both appear in their respective lists, edit both, then delete — confirm the account deletion is blocked while the contact exists.

**Acceptance Scenarios**:

1. **Given** the accounts list, **When** the user submits a create form, **Then** the new account appears in the list immediately without a page reload.
2. **Given** an account has linked contacts, **When** the user attempts to delete the account, **Then** deletion is blocked and an explanatory message is shown.
3. **Given** the contacts list, **When** the user applies the account filter, **Then** only contacts belonging to that account are shown.
4. **Given** a contact detail page, **When** the user clicks the account name in the header, **Then** they navigate to that account's detail page.
5. **Given** two contacts with the same email, **When** the user attempts to save, **Then** a conflict error is shown and no duplicate is created.
6. **Given** a contact detail page, **When** viewed, **Then** the header reads "{FirstName} {LastName}, {AccountName}" and the left sidebar shows job title, phone, email, and account name.

---

### User Story 3 — Lead Capture & Qualification (Priority: P3)

A sales rep tracks inbound leads from first contact through qualification. They can create new leads, advance them through the status stages (new → contacted → qualified), mark them as lost at any point, and convert a qualified lead into an opportunity. The UI only offers valid next status transitions — invalid moves are never presented as options.

**Why this priority**: Lead management is the top of the sales funnel. The status machine and conversion flow are the most business-critical rules in the system.

**Independent Test**: Create a new lead, advance it to "contacted" then "qualified", then click Convert and confirm an opportunity is created and the lead shows a converted indicator with a link to that opportunity.

**Acceptance Scenarios**:

1. **Given** a lead in "new" status, **When** the status control is shown, **Then** only "Contacted" and "Lost" are available as next options — "Qualified" does not appear.
2. **Given** a lead in "qualified" status with no prior conversion, **When** the user clicks "Convert to Opportunity", **Then** a new opportunity is created, the lead shows a "Converted" badge, and the Convert button is disabled.
3. **Given** a lead in "lost" status, **When** the lead detail is viewed, **Then** no status transitions are offered and the Convert button is absent or disabled.
4. **Given** a lead already converted, **When** the lead detail is viewed, **Then** a link to the resulting opportunity is shown alongside the "Converted" indicator.
5. **Given** the leads list, **When** the user clicks a status filter tab (All / New / Contacted / Qualified / Lost), **Then** the list updates to show only leads with that status.

---

### User Story 4 — Opportunity Pipeline Management (Priority: P4)

A sales rep manages their open deals across the five pipeline stages. They can view deals as a Kanban board (grouped by stage) or switch to a flat table view. They can create, update, and delete opportunities, change the stage of a deal, and see total value per stage column. Filtering by stage, account, or contact narrows the view.

**Why this priority**: Opportunities represent revenue. The pipeline board is the core sales tool that makes the CRM valuable beyond a simple contacts database.

**Independent Test**: Seed demo data, open the pipeline board, verify 4 deals appear across 4 distinct stage columns with correct USD values displayed, then update one deal's stage and confirm the card moves to the correct column.

**Acceptance Scenarios**:

1. **Given** seeded demo data, **When** the pipeline board is shown, **Then** four opportunity cards appear in prospecting ($75,000 / 30%), proposal ($120,000 / 60%), negotiation ($250,000 / 75%), and closed-won ($500,000 / 100%) columns respectively.
2. **Given** the pipeline board, **When** the user changes a deal's stage using the inline control, **Then** the card moves to the correct column without a full page reload.
3. **Given** an opportunity value of 0 or negative, **When** the user attempts to save, **Then** validation prevents saving and an error is shown.
4. **Given** the opportunity detail page, **When** viewed, **Then** all linked activities are listed in reverse chronological order and a "Log activity" button is accessible.
5. **Given** the opportunities list, **When** the user filters by "closed-won", **Then** only completed deals are shown.

---

### User Story 5 — Activity Logging (Priority: P5)

A sales rep logs every interaction (call, email, or meeting) against a contact or opportunity. They can view a unified activity timeline across all entities, or filter the timeline by activity type, contact, or opportunity. Activities must be linked to at least one entity — the form enforces this.

**Why this priority**: Activity logging is the data source for the contact history tab, the opportunity timeline, and the "days since last contact" indicator. Without it, those views are empty.

**Independent Test**: Create one activity of each type (call, email, meeting) linked to different contacts/opportunities, verify all three appear in the activities log, then filter by each type and confirm exactly one result per filter.

**Acceptance Scenarios**:

1. **Given** the log activity form, **When** neither contact nor opportunity is selected, **Then** the form cannot be submitted and a validation message is shown.
2. **Given** an activity linked to a contact, **When** the contact's History tab is viewed, **Then** that activity appears in the timeline with its type icon, subject, and date.
3. **Given** the activities log with type filter set to "call", **When** viewed, **Then** only call-type activities are shown.
4. **Given** an opportunity detail page, **When** the user logs a new activity via the inline button, **Then** the activity appears immediately in the opportunity's activity list.

---

### User Story 6 — Contact Communication History (Priority: P6)

A sales rep opens a contact's detail page and, from the Emails tab, sees all mock emails sent to that contact's email address. They can view individual email content and compose a new mock email directly to that contact. This provides a full communication audit trail per contact, matching the "Email nurturing" section visible in the mock design.

**Why this priority**: The contact detail with email history is the primary day-to-day view for account managers reviewing their relationships before a call or meeting.

**Independent Test**: Seed demo data, open Tom Wilson's contact detail page, click the Emails tab, confirm 2 emails are listed. Click one to read its body. Compose and send a new email pre-addressed to tom.wilson@techstart.io, confirm it appears at the top of the list.

**Acceptance Scenarios**:

1. **Given** a contact with seeded emails, **When** the Emails tab is opened, **Then** all emails addressed to that contact's email address are listed, most recent first, showing sender, subject, and sent timestamp.
2. **Given** a contact with no emails, **When** the Emails tab is opened, **Then** an empty-state message is shown with a "Compose" button.
3. **Given** the compose form, **When** opened from a contact's email tab, **Then** the "To" field is pre-filled with the contact's email address and cannot be changed in this context.
4. **Given** a composed email, **When** sent, **Then** it appears immediately at the top of the inbox list for that contact.

---

### User Story 7 — Demo Environment Control (Priority: P7)

A developer or sales engineer running a demo can, from an admin page, load a full set of realistic demo data with one click, or wipe all data for a clean reset. After seeding, a confirmation panel shows exactly how many records were created per entity type. After clearing, all entity list pages show empty states.

**Why this priority**: Enables repeatable, consistent demos without manual data entry. Also serves as the developer's primary tool for resetting the frontend dev environment.

**Independent Test**: Open the Seed Manager, click "Seed demo data", verify the result panel shows 4 accounts / 4 contacts / 3 leads / 4 opportunities / 9 activities / 8 emails. Navigate to the accounts list and confirm 4 records appear. Click "Clear all", navigate to accounts list and confirm it is empty.

**Acceptance Scenarios**:

1. **Given** the Seed Manager page, **When** the user clicks "Seed demo data", **Then** a loading state is shown, then a result panel displays the exact count of each seeded entity type (accounts, contacts, leads, opportunities, activities, emails).
2. **Given** the Seed Manager page, **When** the user clicks "Clear all", **Then** a confirmation dialog is shown first, and only after confirmation is all data deleted.
3. **Given** data was previously seeded, **When** the user seeds again, **Then** the operation is idempotent — old data is replaced and counts remain the same, not doubled.
4. **Given** the Mock Email inbox admin page, **When** viewed, **Then** all stored emails are listed with sender, recipient, subject, and sent time; individual emails can be opened and the entire inbox can be cleared with one confirmed action.

---

### Edge Cases

- What happens when a list page is paginated and the user deletes the last item on page 2? → Automatically return to page 1.
- What happens when the backend is unreachable? → All data-fetching components show an error state with a retry option; the app does not crash or show a blank screen.
- What happens when a contact's email is updated? → Emails in the mock inbox remain associated with the old address and will not appear under the new address filter.
- What happens if the user navigates directly to `/accounts/invalid-id`? → A "Record not found" message is shown — not a blank page or JS error.
- What happens when an opportunity value field receives non-numeric input? → Immediate inline validation rejects it before submission.
- What happens when the Convert button is clicked on an already-converted lead? → The backend returns a 400 error; the frontend shows the error message and links to the existing opportunity.
- What happens when a lead status transition is attempted that the backend rejects? → The error response detail is surfaced to the user as an inline message and the status display reverts to its previous value.
- What happens when the activity form is submitted with both contact and opportunity set to null? → Client-side validation blocks submission before any API call is made.

---

## Requirements *(mandatory)*

### Functional Requirements

**Navigation & Layout**
- **FR-001**: The application MUST provide persistent navigation allowing users to reach any primary entity list (Accounts, Contacts, Leads, Opportunities, Activities) from any page within one click.
- **FR-002**: The application MUST show the current active section highlighted in the navigation.

**Dashboard**
- **FR-003**: The dashboard MUST display: total account count, active lead count (new + contacted + qualified), total open pipeline value (USD), weighted pipeline value, and win rate — all computed from live API data at the time of page load.
- **FR-004**: The dashboard MUST display a feed of the 5 most recent activities with type icon, subject, and relative date (e.g., "2 days ago").
- **FR-005**: All dashboard metrics MUST update when the user navigates back to the dashboard after seeding or clearing data.

**Accounts**
- **FR-006**: Users MUST be able to create, read, update, and delete accounts from the accounts list and detail pages.
- **FR-007**: The accounts list MUST support text search by account name.
- **FR-008**: Account deletion MUST be blocked with an explanatory error when linked contacts or opportunities exist (backend returns HTTP 409).
- **FR-009**: The account detail page MUST show two tabs: "Contacts" (all contacts linked to this account via `GET /api/v1/contacts/?account_id=`) and "Opportunities" (all deals linked via `GET /api/v1/opportunities/?account_id=`).

**Contacts**
- **FR-010**: Users MUST be able to create, read, update, and delete contacts.
- **FR-011**: The contacts list MUST support filtering by account using a dropdown populated from `GET /api/v1/accounts/`.
- **FR-012**: Contact email MUST be unique — the form MUST surface a "Email already in use" error on HTTP 409 response from the backend.
- **FR-013**: The contact detail page MUST show three tabs: "Overview" (linked opportunity card + activity count + days since last contact), "History" (full activity timeline from `GET /api/v1/activities/?contact_id=`), and "Emails" (mock inbox from `GET /api/v1/mock-email/?to={contact.email}`).

**CRM Contact Detail Layout (from mock1.png)**
- **FR-042**: The contact detail page header MUST display the title in the format "{first_name} {last_name}, {account.name}" — this is the canonical CRM "Contact, Company" header pattern.
- **FR-043**: The contact detail page MUST include a left profile sidebar showing: contact avatar (initials-based if no photo), full name, job title, phone (displayed only if set), email address, and a clickable account name that links to the account detail page.
- **FR-044**: The contact detail page header MUST include contextual action buttons: "Log Activity" (opens the log activity form pre-linked to this contact) and "Compose Email" (opens the compose form pre-addressed to this contact).
- **FR-045**: The contact Overview tab MUST display a "Days since last contact" indicator computed as the number of days between today and the most recent `activity.activity_date` linked to this contact via `GET /api/v1/activities/?contact_id=`. If no activities exist, display "No contact yet".

**Leads**
- **FR-014**: Users MUST be able to create, read, update, and delete leads.
- **FR-015**: The leads list MUST support filtering by status via tab controls: All / New / Contacted / Qualified / Lost — each tab passes `?status=` to `GET /api/v1/leads/`.
- **FR-016**: The lead status control MUST only present valid next-state transitions based on current status. Valid paths: new → {contacted, lost}; contacted → {qualified, lost}; qualified → {lost}; lost → none. The backend state machine (HTTP 400 `INVALID_LEAD_TRANSITION`) is the authoritative source of truth.
- **FR-017**: The "Convert to Opportunity" button MUST be enabled only when `lead.status === "qualified"` AND `lead.converted_opportunity_id === null`.
- **FR-018**: After conversion (`POST /api/v1/leads/{id}/convert` returns HTTP 201 with the new Opportunity), the lead detail MUST show a "Converted" badge and a link to the opportunity using `lead.converted_opportunity_id`.

**Lead Status Badge Colors**
- **FR-046**: Lead status badges MUST use distinct colors to aid quick visual scanning: new = blue, contacted = amber/yellow, qualified = green, lost = gray/red.

**Opportunities**
- **FR-019**: Users MUST be able to create, read, update, and delete opportunities.
- **FR-020**: The opportunities view MUST offer a Kanban board mode (one column per stage) and a flat table mode, toggled by the user with the preference persisted for the session.
- **FR-021**: Opportunity value MUST be validated as a positive number greater than zero before submission. A null value (not yet set) is permitted and displayed as "—".
- **FR-022**: Opportunity probability MUST be validated as an integer between 0 and 100 inclusive.
- **FR-023**: The opportunity detail MUST display all linked activities (from `GET /api/v1/activities/?opportunity_id=`) in reverse chronological order and provide a "Log activity" button.
- **FR-024**: Opportunities MUST be filterable by stage, account (`?account_id=`), and contact (`?contact_id=`).

**Opportunity Stage Badge Colors**
- **FR-047**: Opportunity stage badges MUST use a progressive color scale: prospecting = slate, proposal = blue, negotiation = amber, closed-won = green, closed-lost = red.

**Activities**
- **FR-025**: Users MUST be able to create, read, update, and delete activities.
- **FR-026**: The activity log MUST be filterable by type (`?type=call|email|meeting`), contact (`?contact_id=`), and opportunity (`?opportunity_id=`).
- **FR-027**: The activity form MUST require at least one of contact or opportunity to be selected — client-side validation MUST block submission when both are empty, before any API call.
- **FR-028**: Activities MUST be displayed in reverse chronological order (most recent first) by default.
- **FR-048**: Each activity in a list or timeline MUST display a distinct type icon: phone/handset icon for calls, envelope icon for emails, calendar icon for meetings.

**Mock Email Inbox**
- **FR-029**: The mock email inbox page MUST list all stored emails (`GET /api/v1/mock-email/`) with sender (`from_email`), recipient (`to_email`), subject, and sent timestamp (`sent_at`).
- **FR-030**: Users MUST be able to open an individual email (`GET /api/v1/mock-email/{id}`) to view its full `body` content.
- **FR-031**: Users MUST be able to compose and send a new mock email via a form with fields: from (`from_email`), to (`to_email`), subject, and body — submitted via `POST /api/v1/mock-email/`.
- **FR-032**: Users MUST be able to clear the entire inbox (`DELETE /api/v1/mock-email/`) with a confirmation step before execution.
- **FR-033**: The inbox MUST support filtering by recipient email address via `GET /api/v1/mock-email/?to={email}`.

**Seed Manager**
- **FR-034**: The Seed Manager page MUST provide a "Seed demo data" button that calls `POST /api/v1/seed/` and displays the response `seeded` counts (accounts, contacts, leads, opportunities, activities, emails) in a result panel.
- **FR-035**: The Seed Manager MUST provide a "Clear all data" button that calls `DELETE /api/v1/seed/` only after the user confirms a destructive-action dialog.
- **FR-036**: Both seed operations MUST show a loading/spinner state during execution and a success toast notification on completion, or an error message on failure.

**Error Handling & Feedback**
- **FR-037**: All forms MUST show field-level validation errors before submission where possible (required fields, email format, value range).
- **FR-038**: All API error responses (4xx, 5xx) MUST be surfaced as readable messages using the `detail` field from the backend JSON body — no raw error objects, status codes, or blank states shown to the user.
- **FR-039**: All successful create, update, and delete operations MUST show a transient success notification (toast) that auto-dismisses after 3 seconds.
- **FR-040**: All list and detail pages MUST show a loading skeleton or spinner while data is being fetched from the API.
- **FR-041**: All list pages MUST show an empty-state component with a descriptive message and a call-to-action (e.g., "No accounts yet — Create your first account") when no records match the current filters.

### Key Entities & API Field Display Mapping

Each entity is fetched from the backend. The table below maps every API response field to the UI element that displays it, ensuring no field is silently ignored or renamed.

**Account** (`GET /api/v1/accounts/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Used for routing and FK references; not shown |
| `name` | Account Name | Bold, primary identifier in list and detail header |
| `industry` | Industry | Shown as a badge/tag on list rows and detail sidebar |
| `website` | Website | Shown as a clickable external link (opens new tab) |
| `phone` | Phone | Shown only if non-null |
| `created_at` | Member since | Formatted as "MMM D, YYYY" |
| `updated_at` | Last updated | Shown in detail page footer as relative time |

**Contact** (`GET /api/v1/contacts/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Routing + FK |
| `first_name` + `last_name` | Full name | Combined; page title = "{first_name} {last_name}, {account.name}" |
| `email` | Email | Shown as `mailto:` link; used as filter key for mock email tab |
| `phone` | Phone | Shown only if non-null |
| `job_title` | Title / Role | Shown in left sidebar below name |
| `account_id` | Account | Resolved to account name via separate GET; shown as clickable link |
| `created_at` | Added | Relative date in detail footer |

**Lead** (`GET /api/v1/leads/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Routing |
| `first_name` + `last_name` | Name | List row primary text |
| `email` | Email | Shown as `mailto:` link |
| `company` | Company | Shown if non-null; used as display label on list |
| `source` | Source | Badge (e.g., "Website", "Referral") |
| `status` | Status | Color-coded badge (new=blue, contacted=amber, qualified=green, lost=gray) |
| `notes` | Notes | Multi-line text block on detail page; hidden if null |
| `converted_opportunity_id` | Converted to | If non-null: show "Converted" badge + link to `/opportunities/{id}` |
| `created_at` | Created | Date in detail page |

**Opportunity** (`GET /api/v1/opportunities/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Routing |
| `title` | Deal Name | Bold primary text in list and Kanban card |
| `stage` | Stage | Color-coded badge; determines Kanban column |
| `value` | Value | Formatted as `$X,XXX` (USD); "—" if null |
| `probability` | Probability | Shown as `X%` and a visual progress bar (0–100) |
| `expected_close_date` | Close Date | Formatted as "MMM D, YYYY"; "—" if null; shown in amber if within 30 days |
| `account_id` | Account | Resolved to account name; shown as clickable link |
| `contact_id` | Contact | Resolved to full name; shown as clickable link; hidden if null |
| `created_at` | Created | Date in detail footer |

**Activity** (`GET /api/v1/activities/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Routing |
| `type` | Type | Icon (📞 call, ✉ email, 📅 meeting) + text label |
| `subject` | Subject | Primary text in timeline and list |
| `notes` | Notes | Collapsed by default; expand on click; hidden if null |
| `activity_date` | Date | Formatted as relative ("3 days ago") if within 30 days, else "MMM D, YYYY" |
| `contact_id` | Contact | Resolved to full name; shown as link; "—" if null |
| `opportunity_id` | Opportunity | Resolved to title; shown as link; "—" if null |

**Email Message** (`GET /api/v1/mock-email/{id}`)

| API Field | Display Label | Notes |
|-----------|--------------|-------|
| `id` | — | Routing |
| `from_email` | From | Shown in email header |
| `to_email` | To | Shown in email header; used as filter key |
| `subject` | Subject | Bold in list row; heading in email view |
| `body` | Body | Multi-line text in email view; "No body" if null |
| `html_body` | — | Rendered as HTML if present; falls back to `body` |
| `sent_at` | Sent | Relative time in list; full timestamp in email view |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A sales rep can navigate from the dashboard to any individual record and back within 3 clicks.
- **SC-002**: All list pages load and display records within 2 seconds on a local development connection.
- **SC-003**: A new lead can be created, advanced through all valid statuses, and converted to an opportunity in under 2 minutes without consulting documentation.
- **SC-004**: 100% of backend validation errors (HTTP 400, 409, 422) are surfaced as human-readable messages — zero instances of blank pages or raw JSON shown to the user.
- **SC-005**: The pipeline board correctly reflects all 5 opportunity stages at all times — records never appear in the wrong column.
- **SC-006**: Seeding demo data and verifying all 6 entity types appear on their respective list pages takes under 30 seconds end-to-end.
- **SC-007**: Clearing all data and confirming all lists show empty states takes under 10 seconds end-to-end.
- **SC-008**: The lead status control never presents an invalid transition option — 0 invalid transitions reachable through the UI.
- **SC-009**: All forms with required fields prevent submission when those fields are empty — no API requests are made for obviously invalid form state.
- **SC-010**: The application remains functional (no crashes, no blank screens) when navigated directly to any valid URL, including entity detail pages.
- **SC-011**: The unit test suite covers all business logic functions (transition guard, metrics computation, formatters) with 100% pass rate.
- **SC-012**: The integration test suite covers all 12 pages and all API error response types (400, 404, 409, 422) with 100% pass rate.

---

## Testing Requirements

### Unit Test Scenarios

Unit tests verify isolated logic functions — no API calls, no DOM rendering required.

| ID | Scenario | Input | Expected Result |
|----|----------|-------|-----------------|
| TC-U001 | Lead transition guard — valid: new → contacted | `{status: "new"}, "contacted"` | Returns `true` |
| TC-U002 | Lead transition guard — invalid: new → qualified | `{status: "new"}, "qualified"` | Returns `false` |
| TC-U003 | Lead transition guard — terminal: lost → any | `{status: "lost"}, "new"` | Returns `false` for all targets |
| TC-U004 | Convert button enabled — qualified, not converted | `{status: "qualified", converted_opportunity_id: null}` | Returns `true` |
| TC-U005 | Convert button disabled — qualified, already converted | `{status: "qualified", converted_opportunity_id: "abc"}` | Returns `false` |
| TC-U006 | Convert button disabled — non-qualified status | `{status: "new", converted_opportunity_id: null}` | Returns `false` |
| TC-U007 | Currency formatter — whole number | `75000` | `"$75,000"` |
| TC-U008 | Currency formatter — decimal | `120000.50` | `"$120,000.50"` |
| TC-U009 | Currency formatter — null value | `null` | `"—"` |
| TC-U010 | Weighted pipeline — two open deals | `[{value: 100000, probability: 50}, {value: 200000, probability: 75}]` | `$200,000` |
| TC-U011 | Win rate — 1 won, 1 lost, 2 open | `{won: 1, lost: 1, open: 2}` | `50%` |
| TC-U012 | Win rate — no closed deals | `{won: 0, lost: 0, open: 4}` | `"—"` (undefined, not 0%) |
| TC-U013 | Days since last contact — activity 5 days ago | `activity_date = today - 5` | `"5 days ago"` |
| TC-U014 | Days since last contact — no activities | `[]` | `"No contact yet"` |
| TC-U015 | Relative date — within 30 days | `date = today - 14` | `"14 days ago"` |
| TC-U016 | Relative date — older than 30 days | `date = 2025-01-15` | `"Jan 15, 2025"` |
| TC-U017 | Activity form validator — both links null | `{contact_id: null, opportunity_id: null}` | Invalid — returns error message |
| TC-U018 | Activity form validator — contact only | `{contact_id: "abc", opportunity_id: null}` | Valid |
| TC-U019 | Opportunity value validator — zero | `0` | Invalid |
| TC-U020 | Opportunity value validator — positive | `75000` | Valid |
| TC-U021 | Opportunity probability validator — 101 | `101` | Invalid |
| TC-U022 | Opportunity probability validator — 100 | `100` | Valid |

### Integration Test Scenarios

Integration tests run against the live backend (backend must be running, data seeded before each test group via `POST /api/v1/seed/`).

| ID | Page / Flow | Steps | Expected Result |
|----|------------|-------|-----------------|
| TC-I001 | Dashboard — seeded KPIs | Seed, open `/` | KPI cards show: 4 accounts, 2 active leads, $445,000 pipeline, $237,500 weighted, 100% win rate, 5 activities listed |
| TC-I002 | Dashboard — empty state | Clear, open `/` | All KPIs show 0/empty, activity feed shows empty state |
| TC-I003 | Accounts — create | Open `/accounts`, submit form with name "Test Co" | Row "Test Co" appears in list; toast shown |
| TC-I004 | Accounts — delete blocked | Seed, attempt delete of "TechStart Inc" (has contact) | Error message "Cannot delete — linked contacts exist"; account remains in list |
| TC-I005 | Accounts — delete success | Create account with no contacts, delete it | Account removed from list; toast shown |
| TC-I006 | Contacts — create & account link | Create contact linked to "TechStart Inc", view detail | Header shows "FirstName LastName, TechStart Inc"; sidebar shows account link |
| TC-I007 | Contacts — duplicate email | Seed, attempt to create contact with "tom.wilson@techstart.io" | Error "Email already in use" shown; no duplicate created |
| TC-I008 | Contacts — account filter | Seed, open `/contacts`, filter by "HealthCare Pro" | Only Sarah Johnson shown (1 result) |
| TC-I009 | Contact detail — Overview tab | Seed, open Tom Wilson | Days since last contact = 7 (most recent activity is "Sent enterprise platform proposal", 7 days ago); linked opportunity card shows |
| TC-I010 | Contact detail — History tab | Seed, open Tom Wilson, click History | 2 activities listed in reverse chronological order |
| TC-I011 | Contact detail — Emails tab | Seed, open Tom Wilson, click Emails | 2 emails shown; subjects: "Welcome to Sales CRM", "Your proposal is ready" |
| TC-I012 | Lead lifecycle — full flow | Create lead → status=new; transition to contacted; transition to qualified; click Convert | Opportunity created (HTTP 201); lead shows "Converted" badge; link to opportunity visible |
| TC-I013 | Lead — invalid transition blocked | Seed, open Lisa Chen (new), attempt to set status to "qualified" | Option "Qualified" not present in status control; cannot reach invalid state |
| TC-I014 | Lead — lost terminal state | Seed, open James Park (lost) | No status options shown; Convert button absent or disabled |
| TC-I015 | Opportunity pipeline board | Seed, open `/opportunities` board view | 4 cards visible in correct columns; stage column totals shown |
| TC-I016 | Opportunity — stage update | Seed, open opp 1 (prospecting), change stage to "proposal" | Card moves to proposal column; stage badge updates |
| TC-I017 | Opportunity — value validation | Open create form, enter value = -100, submit | Error "Value must be greater than zero" shown; no API call made |
| TC-I018 | Opportunity detail — activities | Seed, open Finance Solutions opp (negotiation) | 3 activities listed in reverse chronological order |
| TC-I019 | Activities — create linked to contact | Open log activity form, select Tom Wilson, type=call, subject="Follow up", submit | Activity appears in activities log and in Tom Wilson's History tab |
| TC-I020 | Activities — link validation | Open log activity form, leave contact and opportunity empty, click Submit | Client-side error shown; no API request sent |
| TC-I021 | Activities — type filter | Seed, open `/activities`, filter by type="meeting" | 3 results shown (only meeting activities) |
| TC-I022 | Contact email tab — compose | Seed, open Sarah Johnson, Emails tab, click Compose | "To" field pre-filled with "sarah.j@healthcarepro.com"; composing and sending adds email to tab |
| TC-I023 | Mock inbox — filter by recipient | Seed, open `/admin/mock-email`, filter by "emma.davis@globalretail.com" | 2 emails shown |
| TC-I024 | Mock inbox — clear | Seed, open `/admin/mock-email`, click Clear, confirm | All 8 emails removed; empty state shown |
| TC-I025 | Seed — idempotent | Seed twice consecutively | Second seed returns same counts; no doubling in lists |
| TC-I026 | Seed — clear cycle | Seed → clear → seed | After second seed: lists show correct counts (4 accounts, etc.) |
| TC-I027 | Error — 404 on invalid ID | Navigate to `/accounts/nonexistent-id` | "Record not found" message shown; no crash |
| TC-I028 | Error — 400 on double convert | Seed, open Tom Wilson lead (already converted), click Convert | Error message from `detail` field shown; lead retains "Converted" badge |
| TC-I029 | Error — backend unreachable | Stop backend, open any list page | Error state shown with "Retry" option; no blank screen or crash |
| TC-I030 | Pagination — page 2 then delete | Create 21 accounts, navigate to page 2 (1 record), delete it | Automatically returns to page 1 with 20 records |

---

## Assumptions

- The backend is always available at `http://localhost:8000` during development; no offline mode is required.
- There is no user authentication — all pages and data are accessible without login.
- The application targets desktop browsers (Chrome, Firefox, Edge) only — mobile layout is out of scope for this version.
- All data displayed comes exclusively from the live backend API; no frontend-side mock data, fixtures, or hardcoded records are permitted.
- The backend CORS policy already allows the frontend origin (`http://localhost:5173`).
- The mock1.png design (Creatio-style CRM) informs the layout pattern for entity detail pages — specifically: header bar with "Name, Company" title, left profile sidebar, horizontal tab navigation, and top action bar. Features in the mock with no backend support (health score, NPS, enrichment, AI chat, "Next best offers") are explicitly out of scope.
- Pagination defaults: 20 records per page, maximum 100 — matching backend `page_size_default` and `page_size_max` config.
- The lead status state machine is enforced on the frontend (for UX) and the backend (authoritative). The backend HTTP 400 `INVALID_LEAD_TRANSITION` error is the final arbiter.
- Opportunity value of `null` (not yet set) is valid and displayed as "—". A value of 0 is invalid and will be rejected by the backend with HTTP 422.
- Date fields (`expected_close_date`, `activity_date`) are displayed in the user's local timezone. They are stored as UTC on the backend.
- The Seed Manager (`/admin/seed`) and Mock Email inbox (`/admin/mock-email`) are developer/demo tools placed under the `/admin` route prefix.
- Integration tests require the backend to be running and the database to be in a known state (seeded via `POST /api/v1/seed/` before each test group).
- The frontend development environment runs Node.js v22.17.1 (LTS 22.x) and npm 10.9.2. All package dependencies must declare `engines: { node: ">=18" }` in package.json and must install cleanly under npm 10.x without `--legacy-peer-deps`. Packages that require Node < 18 or that break under npm 10 are not permitted.
