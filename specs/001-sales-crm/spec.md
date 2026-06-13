# Feature Specification: Sales CRM

**Feature Branch**: `001-sales-crm`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "Sales CRM application using Python FastAPI backend, PostgreSQL, SQLAlchemy ORM, and Pydantic v2. Entities: Contacts, Accounts, Leads, Opportunities, Activities."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contact & Account Management (Priority: P1)

A sales representative needs to maintain a master record of the companies they sell to (Accounts) and the individuals they deal with at each company (Contacts). Without this foundation, no other CRM workflow is possible.

**Why this priority**: All other entities (Leads, Opportunities, Activities) reference Accounts and Contacts. This is the non-negotiable core of any CRM.

**Independent Test**: Can be fully tested by creating an Account, then creating a Contact linked to that Account, updating both records, and verifying retrieval — delivering a usable address book without any other module.

**Acceptance Scenarios**:

1. **Given** no accounts exist, **When** a sales rep submits a new account with a name, **Then** the account is created and returned with a system-assigned ID and creation timestamp.
2. **Given** an account exists, **When** a sales rep creates a contact with that account's ID, **Then** the contact is saved and retrievable, showing the linked account.
3. **Given** a contact exists, **When** a sales rep updates the contact's phone number, **Then** the updated record is returned and the change is persisted.
4. **Given** an account has associated contacts, **When** a sales rep attempts to delete the account, **Then** the deletion is rejected with a clear error message listing the dependency.
5. **Given** an account has no contacts or opportunities, **When** a sales rep deletes the account, **Then** the account is permanently removed.

---

### User Story 2 - Lead Capture & Status Progression (Priority: P2)

A sales rep receives enquiries from potential customers who haven't been qualified yet. They need to capture these leads and track their progression through outreach stages (new → contacted → qualified, or → lost).

**Why this priority**: Leads are the top of the sales funnel. Capturing and qualifying them is how new Opportunities are created.

**Independent Test**: Can be fully tested by creating leads, changing their statuses through valid transitions, attempting invalid transitions and confirming they are rejected, and retrieving leads filtered by status.

**Acceptance Scenarios**:

1. **Given** no leads exist, **When** a rep submits a lead with a name and email, **Then** the lead is created with a default status of "new".
2. **Given** a lead with status "new", **When** a rep updates the status to "contacted", **Then** the transition is accepted and saved.
3. **Given** a lead with status "contacted", **When** a rep updates the status back to "new", **Then** the update is rejected with a clear error describing valid transitions.
4. **Given** a lead with status "qualified", **When** a rep updates the status to "lost", **Then** the transition is accepted (any non-lost status can move to lost).
5. **Given** a lead with status "lost", **When** a rep attempts any status change, **Then** the update is rejected — a lost lead cannot be reopened.

---

### User Story 3 - Lead-to-Opportunity Conversion (Priority: P3)

Once a lead is qualified, a sales rep converts it into an active sales Opportunity. This single action should create the Opportunity record and, if needed, also create a Contact and Account from the lead's data.

**Why this priority**: Conversion is the critical handoff from lead generation to active selling. It must be atomic and reliable.

**Independent Test**: Can be fully tested by converting a qualified lead and verifying that an Opportunity is created, and that corresponding Contact/Account records are either created or reused if they already exist.

**Acceptance Scenarios**:

1. **Given** a lead with status "qualified", **When** a rep triggers conversion, **Then** a new Opportunity is created, the lead's company becomes an Account (or reuses an existing one), and the lead's personal data becomes a Contact.
2. **Given** a lead with status "new" or "contacted", **When** a rep attempts conversion, **Then** the request is rejected with an error indicating the lead must be qualified first.
3. **Given** a lead whose company name matches an existing Account, **When** conversion occurs, **Then** the existing Account is reused and no duplicate is created.

---

### User Story 4 - Opportunity Pipeline Management (Priority: P4)

A sales manager needs to track all active deals, their current stage, and their monetary value to forecast revenue and manage the team's pipeline.

**Why this priority**: Opportunities represent real revenue. Managers need to view, filter, and update them to run the business.

**Independent Test**: Can be fully tested by creating opportunities with values and stages, updating stages through the pipeline, filtering by stage or account, and verifying that negative or zero values are rejected.

**Acceptance Scenarios**:

1. **Given** an Account exists, **When** a rep creates an Opportunity with a title, stage, and value of $5,000, **Then** the opportunity is saved and returned.
2. **Given** an Opportunity exists, **When** a rep submits a value update of $0 or a negative number, **Then** the update is rejected with a clear validation error.
3. **Given** multiple opportunities exist in different stages, **When** a manager filters by stage "proposal", **Then** only opportunities in that stage are returned.
4. **Given** an Opportunity in "negotiation", **When** a rep marks it "closed-won", **Then** the stage is updated and the record reflects the final state.

---

### User Story 5 - Activity Logging (Priority: P5)

Sales reps must log every interaction (calls, emails, meetings) against a Contact or Opportunity so the team has a complete history of customer engagement.

**Why this priority**: Activity history is essential for team handoffs, follow-ups, and accountability — but is only useful once Contacts and Opportunities exist.

**Independent Test**: Can be fully tested by logging activities of all three types linked to a Contact, logging activities linked to an Opportunity, attempting to log an activity with no linked entity and confirming rejection, and retrieving activity history filtered by type or linked record.

**Acceptance Scenarios**:

1. **Given** a Contact exists, **When** a rep logs a "call" activity with a subject and date, **Then** the activity is saved and linked to that Contact.
2. **Given** an Opportunity exists, **When** a rep logs a "meeting" activity linked to that Opportunity, **Then** the activity is saved with the opportunity link.
3. **Given** no contact or opportunity ID is provided, **When** a rep attempts to log an activity, **Then** the request is rejected with an error stating that at least one linked entity is required.
4. **Given** multiple activities exist, **When** a rep filters activities by type "email", **Then** only email activities are returned.

---

### Edge Cases

- What happens when a contact's email conflicts with an existing contact's email (duplicate check)?
- What happens when an opportunity's expected close date is in the past?
- What happens when an activity is linked to both a contact and an opportunity simultaneously — is that allowed?
- How does the system handle pagination when no results match a filter?
- What happens if an account is referenced in both an open opportunity and has contacts — deletion must be blocked.
- What happens when a lead is converted but the associated contact email already exists as a Contact record?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Accounts

- **FR-001**: System MUST allow creation of an Account with at minimum a name field (required); optional fields include industry, website, phone, and address.
- **FR-002**: System MUST allow retrieval of a paginated list of all Accounts.
- **FR-003**: System MUST allow retrieval, update, and deletion of a single Account by ID.
- **FR-004**: System MUST prevent deletion of an Account that has associated Contacts or Opportunities, returning a descriptive error.

#### Contacts

- **FR-005**: System MUST allow creation of a Contact with first name, last name, and email (all required); optional fields include phone, job title, and account association.
- **FR-006**: System MUST enforce email uniqueness across all Contacts.
- **FR-007**: System MUST allow retrieval of a paginated list of Contacts, with optional filtering by Account ID.
- **FR-008**: System MUST allow retrieval, update, and deletion of a single Contact by ID.

#### Leads

- **FR-009**: System MUST allow creation of a Lead with first name, last name, and email (all required); optional fields include phone, company name, lead source, and notes. Lead email addresses are NOT required to be unique — the same email may appear on multiple Lead records (a person may submit multiple enquiries).
- **FR-010**: System MUST assign a default status of "new" to all newly created Leads.
- **FR-011**: System MUST enforce the following valid Lead status transitions only:
  - `new` → `contacted`
  - `contacted` → `qualified`
  - `new`, `contacted`, or `qualified` → `lost`
  - All other transitions (including any → from `lost`) MUST be rejected.
- **FR-012**: System MUST allow retrieval of a paginated list of Leads, with optional filtering by status.
- **FR-013**: System MUST allow retrieval, update, and deletion of a single Lead by ID.
- **FR-014**: System MUST provide a dedicated Lead conversion operation that:
  - Requires the Lead to have status "qualified" (rejects otherwise)
  - Rejects conversion if the Lead has already been converted (i.e., `converted_opportunity_id` is already set); returns a 400 error whose detail includes the existing opportunity ID so the caller can retrieve it without an additional lookup
  - Creates a new Opportunity from the Lead data
  - Creates or reuses an existing Account based on the Lead's company name (case-insensitive match)
  - Creates or reuses an existing Contact based on the Lead's email address

#### Opportunities

- **FR-015**: System MUST allow creation of an Opportunity with a title (required) and an associated Account ID (required); optional fields include Contact ID, stage, value in USD, probability (0–100%), and expected close date.
- **FR-016**: System MUST default new Opportunities to stage "prospecting" if no stage is provided.
- **FR-017**: System MUST enforce that Opportunity value, when provided, is a number strictly greater than zero.
- **FR-018**: System MUST allow Opportunity stage updates to any of the five defined stages without enforcing strict sequential progression (reps may need to skip or revisit stages).
- **FR-019**: System MUST allow retrieval of a paginated list of Opportunities, with optional filtering by stage, Account ID, or Contact ID.
- **FR-020**: System MUST allow retrieval, update, and deletion of a single Opportunity by ID.

#### Activities

- **FR-021**: System MUST allow creation of an Activity with type (call, email, or meeting — required), subject (required), and at least one of: Contact ID or Opportunity ID.
- **FR-022**: System MUST reject Activity creation if neither a valid Contact ID nor a valid Opportunity ID is provided.
- **FR-023**: System MUST allow an Activity to be simultaneously linked to both a Contact and an Opportunity.
- **FR-024**: System MUST allow optional fields on Activities: notes, and activity date (defaults to time of creation if omitted).
- **FR-025**: System MUST allow retrieval of a paginated list of Activities, with optional filtering by type, Contact ID, or Opportunity ID.
- **FR-026**: System MUST allow retrieval, update, and deletion of a single Activity by ID.

### Key Entities *(include if feature involves data)*

- **Account**: A company or organization that is a current or potential customer. Serves as the parent for Contacts and Opportunities. Key attributes: name, industry, website, phone, address.
- **Contact**: An individual person associated with an Account. The primary point of human interaction in the sales process. Key attributes: first name, last name, email (unique), phone, job title, linked Account.
- **Lead**: An unqualified potential customer inquiry. Not yet confirmed as a viable deal. Progresses through statuses and can be converted into an Opportunity + Contact + Account. Key attributes: name, email, company, status, source, notes.
- **Opportunity**: A qualified sales deal actively being pursued. Tracks deal stage and monetary value. Always linked to an Account, optionally to a Contact. Key attributes: title, linked Account, linked Contact, stage, value (USD), probability, expected close date.
- **Activity**: A logged interaction between the sales team and a customer. Must be linked to at least one Contact or Opportunity. Key attributes: type (call/email/meeting), subject, notes, activity date, linked Contact, linked Opportunity.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A sales rep can create a new account and link a contact to it in under 60 seconds using only API calls.
- **SC-002**: 100% of lead status transitions that violate the defined state machine are rejected with an informative error message; no invalid state is ever persisted.
- **SC-003**: 100% of opportunity value submissions that are zero or negative are rejected before persistence, with a clear validation error returned to the caller.
- **SC-004**: 100% of activity submissions without a valid linked Contact or Opportunity are rejected with a descriptive error; no orphaned activity can be saved.
- **SC-005**: A qualified lead can be converted to an opportunity, contact, and account in a single operation without the caller needing to make additional API calls.
- **SC-006**: All five entity types support full create, read, update, and delete operations independently verifiable through API calls.
- **SC-007**: List endpoints return paginated results for datasets up to 10,000 records within 3 seconds under normal load.
- **SC-008**: Attempting to delete an Account with associated Contacts or Opportunities is blocked in 100% of cases with a human-readable error.

---

## Assumptions

- API authentication and user authorization are **out of scope for v1**; all endpoints operate without authentication.
- No frontend UI is in scope; this specification covers the backend API only.
- The technology stack is: Python, FastAPI, SQLAlchemy ORM, and Pydantic v2. The current database target is **SQLite** (zero-setup for development). The codebase is designed to remain database-agnostic so that PostgreSQL can be adopted later via a configuration change only (no code rewrite).
- Soft deletes are not required; all deletions are permanent (hard delete).
- Opportunity stage progression is non-linear — reps may move to any stage freely (no enforced sequence beyond creation defaults).
- Lead conversion is an all-or-nothing atomic operation; partial conversions are not permitted.
- An activity may be linked to both a Contact and an Opportunity simultaneously (this is valid and supported).
- Pagination defaults to 20 records per page; callers may request up to 100 per page.
- Contact email uniqueness is enforced system-wide (not per account).
- Account name matching during lead conversion is case-insensitive; the first match found is used.
- All monetary values (Opportunity value) are stored and returned in USD with up to two decimal places.
- The system is a single-tenant deployment; multi-tenancy is out of scope.

---

## Clarifications

### Session 2026-06-13

- Q: Should the database be PostgreSQL (as originally specified) or SQLite, and is this change temporary or permanent? → A: SQLite is the current target for development. The design must stay database-agnostic so PostgreSQL can be adopted later via configuration change only.
- Q: Are Lead email addresses required to be unique across all Lead records? → A: No — duplicate lead emails are permitted. The same person may submit multiple enquiries. Email uniqueness is enforced only on Contacts (FR-006), not Leads.
- Q: What should happen if a caller attempts to convert a Lead that has already been converted? → A: Reject with 400 error; include the existing `converted_opportunity_id` in the error response body so the caller can retrieve the opportunity without an extra lookup.
