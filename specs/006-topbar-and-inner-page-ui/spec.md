# Feature Specification: Top Bar & Inner Page UI Modernisation

**Feature Branch**: `006-topbar-and-inner-page-ui`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "can we move the profile to top right corner instead of low. also login page now good but inside the view page not good still looks like a old legacy crm application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Profile Access from Top Bar (Priority: P1)

A sales rep opens any page in the CRM. They want to access their profile, change settings, or sign out without looking at the bottom of a sidebar. The profile avatar and name are visible in the top-right corner of the global top bar at all times.

**Why this priority**: The profile widget is present on every page. Moving it to the top-right corner is the single most visible change and follows the industry standard layout used by Salesforce, HubSpot, and Zoho CRM.

**Independent Test**: Can be tested on any single page. A user can see their avatar/initials in the top-right corner, click it, and access profile and sign-out options without navigating to any other page.

**Acceptance Scenarios**:

1. **Given** a logged-in user on any page, **When** they look at the top-right corner, **Then** they see their avatar (initials circle) and display name or role badge
2. **Given** a user clicks the top-right avatar, **When** the dropdown opens, **Then** it shows "View Profile" and "Sign out" options
3. **Given** a user clicks "Sign out" from the dropdown, **When** the action completes, **Then** they are redirected to the login page
4. **Given** a user on mobile, **When** they view the top bar, **Then** the avatar is visible alongside the hamburger menu icon
5. **Given** the sidebar is collapsed (icon-only), **When** the user looks at the top bar, **Then** the profile widget remains accessible in the top-right corner unchanged

---

### User Story 2 — Modern Inner Page Layout (Priority: P1)

A sales manager opens a lead detail page, account detail page, or opportunity detail page. The page currently feels like a legacy database form — plain labels, no visual hierarchy, dense unstyled tables. After this feature, inner pages use a modern card-based layout with consistent typography, spacing, and colour tokens matching the dashboard's look and feel.

**Why this priority**: Inner pages are where users spend the majority of their time. A dated appearance reduces user confidence and productivity. This matches the visual standard already established on the Login page and Dashboard.

**Independent Test**: Open a Lead detail page. All data fields are grouped in labelled cards with clear sections. Typography, spacing, and colour match the dashboard style. No plain unstyled `<dl>` or raw `<table>` elements visible at root level.

**Acceptance Scenarios**:

1. **Given** a user navigates to a Lead detail page, **When** the page loads, **Then** fields are grouped into named card sections (e.g., "Lead Information", "Contact Details", "Activity")
2. **Given** any detail page, **When** the user views the page, **Then** section headings use consistent typography (`text-lg font-semibold text-slate-800`) and cards use `bg-white rounded-xl shadow-sm border border-slate-100`
3. **Given** a detail page with related sub-lists (e.g., Activities on a Contact), **When** the user views the sub-list, **Then** it is presented in a card with a header row, not a raw table
4. **Given** any list page (Accounts, Contacts, Leads, Opportunities, Activities), **When** the user views it, **Then** the table has a card container, alternating row hover states, and column headers with consistent style
5. **Given** a user on a 768 px-wide tablet, **When** viewing a detail page, **Then** two-column field layouts stack to single column without horizontal overflow

---

### User Story 3 — Consistent Page Header Pattern (Priority: P2)

Every inner page (list and detail) has a consistent page-header zone: page title on the left with optional breadcrumb, primary action button(s) on the right. This replaces ad-hoc heading placements.

**Why this priority**: Establishes a predictable navigation pattern. Users always know where the page title and primary actions are.

**Independent Test**: Navigate to three different list pages. Each has a `<PageHeader>` zone with title left-aligned and action button right-aligned. Same for three detail pages.

**Acceptance Scenarios**:

1. **Given** any list page, **When** the user views it, **Then** a page header shows the entity name (e.g., "Leads") on the left and a "New Lead" button on the right
2. **Given** any detail page, **When** the user views it, **Then** a page header shows the record name (breadcrumb: entity → name) and action buttons (Edit, Delete) on the right
3. **Given** mobile viewport, **When** the user views a page header with two action buttons, **Then** buttons stack or collapse to a "…" overflow menu without truncating the title

---

### Edge Cases

- What happens when a user's display name is very long (> 30 characters)? → Name is truncated with ellipsis in the top bar; full name shown in the dropdown tooltip.
- What happens if the profile dropdown is open and the user clicks elsewhere? → Dropdown closes (click-outside behaviour).
- What happens on a detail page that is still loading? → Skeleton loaders already exist (T117); page header also shows skeleton for the title until data resolves.
- How does the sidebar handle the absence of the profile widget at the bottom? → The bottom profile section is removed from the sidebar entirely; only nav links and the collapse toggle remain.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The global layout MUST include a persistent top bar visible on all authenticated pages, containing the hamburger menu (mobile), page context area (centre or left), and the user profile widget (right)
- **FR-002**: The user profile widget in the top bar MUST display the user's initials avatar, display name, and a dropdown on click with "View Profile" and "Sign out" actions
- **FR-003**: The sidebar MUST have the profile section removed from its bottom; only navigation links and collapse toggle remain
- **FR-004**: All detail pages (Lead, Contact, Account, Opportunity) MUST group fields into named card sections using consistent card styling (`bg-white`, `rounded-xl`, `shadow-sm`, `border border-slate-100`)
- **FR-005**: All list pages MUST wrap their data table in a styled card container with a header row (title + action button) and consistent row hover states
- **FR-006**: All inner pages MUST include a consistent `PageHeader` component displaying the page/record title (left) and primary action buttons (right)
- **FR-007**: The `PageHeader` component MUST support an optional breadcrumb trail (e.g., "Leads › Acme Corp")
- **FR-008**: Detail page field groups MUST use a two-column grid layout on screens ≥ 768 px, collapsing to single column on smaller screens
- **FR-009**: The profile dropdown MUST close when the user clicks outside of it
- **FR-010**: All UI changes MUST pass `tsc --noEmit` with zero errors and all existing Vitest unit tests must continue to pass

### Key Entities

- **TopBar**: Global header component — contains hamburger (mobile), optional title slot, and `UserMenu` widget (right)
- **UserMenu**: Dropdown widget showing avatar, name, role badge; actions: View Profile, Sign out
- **PageHeader**: Page-level header — title (+ optional breadcrumb) left, action buttons right
- **DetailCard**: Reusable card wrapper with title, two-column field grid body
- **FieldLabel / FieldValue**: Atomic components for label-value pairs inside DetailCard

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The user profile widget is visible and accessible within the top bar on 100% of authenticated pages across desktop, tablet, and mobile viewports
- **SC-002**: No profile section exists at the bottom of the sidebar after the change
- **SC-003**: All 4 detail page types (Lead, Contact, Account, Opportunity) render fields in named card sections with no unstyled flat lists at the root level
- **SC-004**: All 6 list pages (Accounts, Contacts, Leads, Opportunities, Activities, Users) wrap their table in a styled card container
- **SC-005**: A `PageHeader` component is present on all list and detail pages
- **SC-006**: Two-column field layout on detail pages stacks to single column at < 768 px with no horizontal overflow
- **SC-007**: `npx tsc --noEmit` reports zero errors after all changes
- **SC-008**: All existing Vitest unit tests pass after all changes
- **SC-009**: Profile dropdown opens and closes correctly; click-outside dismisses it

## Assumptions

- The existing `AppShell.tsx` and `NavSidebar.tsx` will be updated in-place; no new routing changes are required
- "Inner pages" refers to: all list pages (Accounts, Contacts, Leads, Opportunities, Activities, Admin pages) and all detail pages (Account, Contact, Lead, Opportunity); does NOT include the Login page or Dashboard KPI cards (those were addressed in US16)
- Dashboard page's existing KPI card + chart layout is already modern; only the page header zone needs to be added for consistency
- The existing design tokens from `tailwind.config.ts` (brand, surface, card shadow) are used; no new tokens need to be introduced
- `lucide-react` is the icon library; no additional icon packages will be installed
- The `UserMenu` dropdown will use a simple absolute-positioned div with a click-outside hook; no third-party dropdown library is introduced
- WCAG 2.1 AA focus-visible ring already established in `style.css` covers all new interactive elements
