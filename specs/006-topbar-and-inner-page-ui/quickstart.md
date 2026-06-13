# Quickstart Validation Guide: Top Bar & Inner Page UI Modernisation

**Feature**: 006-topbar-and-inner-page-ui
**Date**: 2026-06-14

This guide defines runnable validation scenarios that confirm the feature works end-to-end. Run these scenarios in order after implementation is complete.

---

## Prerequisites

```powershell
# From repo root — start the full stack
docker-compose up -d

# Seed initial data (if not already seeded)
# POST http://localhost:8000/seed/   (or use the Seed Manager page)
```

Frontend dev server (for rapid iteration):
```powershell
cd frontend
npm run dev
# Open http://localhost:5173
```

Log in as: `admin@example.com` / `password123`

---

## Scenario 12a: Profile Widget in Top Bar (Desktop)

**Goal**: Verify profile avatar is in the top-right corner, not at the sidebar bottom.

1. Open the app at viewport 1366×768 (desktop)
2. Log in
3. Navigate to the Dashboard

**Expected**:
- A horizontal top bar is visible across the full content area (right of sidebar)
- Top-right corner shows a circular avatar with user initials and the display name
- The sidebar contains only navigation links and the collapse toggle — no profile section at the bottom

**Pass criteria**:
- [ ] Avatar visible in top bar
- [ ] No profile section in sidebar bottom

---

## Scenario 12b: UserMenu Dropdown

**Goal**: Verify dropdown opens, shows correct content, and closes on outside click.

1. Click the avatar/name in the top-right corner

**Expected**:
- A dropdown panel appears below the avatar with: full name, role badge, "View Profile" link, "Sign out" button

2. Click anywhere outside the dropdown panel

**Expected**:
- Dropdown closes without navigating

3. Click the avatar again, then click "View Profile"

**Expected**:
- Navigates to `/profile`

4. Click the avatar, then click "Sign out"

**Expected**:
- User is signed out and redirected to the Login page

**Pass criteria**:
- [ ] Dropdown opens on click
- [ ] Full name + role badge shown
- [ ] Click-outside closes dropdown
- [ ] "View Profile" navigates correctly
- [ ] "Sign out" works and redirects

---

## Scenario 12c: Profile Widget on Mobile (375 px)

**Goal**: Verify avatar is visible on mobile alongside hamburger.

1. Set viewport to 375×812 (iPhone)
2. Log in

**Expected**:
- Top bar shows hamburger icon (left) and avatar/initials (right)
- Tapping the hamburger opens the sidebar drawer
- Tapping the avatar opens the UserMenu dropdown

**Pass criteria**:
- [ ] Avatar visible on mobile viewport
- [ ] Hamburger and avatar coexist in top bar

---

## Scenario 12d: Leads List Page — Modern Card Table

**Goal**: Verify the leads table is wrapped in a styled card container.

1. Navigate to `/leads`

**Expected**:
- Page title "Leads" is in a `PageHeader` (left-aligned)
- "New Lead" button is right-aligned in the same header row
- The leads table has a white card container with rounded corners and a subtle shadow
- Column headers are styled (muted, uppercase, small text)
- Row hover shows a subtle background change

**Pass criteria**:
- [ ] PageHeader present with title + action button
- [ ] Table in styled card wrapper
- [ ] Row hover visible

---

## Scenario 12e: Lead Detail Page — Card Sections

**Goal**: Verify lead detail uses card-based sections, not a legacy form layout.

1. Navigate to `/leads`, click any lead

**Expected**:
- `PageHeader` shows lead full name with "Leads" breadcrumb link and Edit/Delete buttons right
- Page content shows at least 2 `DetailCard` sections (e.g., "Lead Information", "Contact Details")
- Each card has a header row with the section name
- Fields inside cards use a two-column grid (label left, value right) on desktop
- No `ProfileSidebar` or `TabStrip` visible

**Pass criteria**:
- [ ] PageHeader with breadcrumb
- [ ] Minimum 2 DetailCard sections
- [ ] Two-column field grid
- [ ] No legacy ProfileSidebar

---

## Scenario 12f: Account Detail Page — Card Sections + Related Records

**Goal**: Verify account detail and its related-records tabs use card layout.

1. Navigate to `/accounts`, click any account

**Expected**:
- `PageHeader` shows account name with "Accounts" breadcrumb and Edit/Delete
- At least one `DetailCard` for account info (Industry, Website, etc.)
- Contacts and Opportunities sub-sections are in their own `DetailCard` (not bare `TabStrip`)

**Pass criteria**:
- [ ] PageHeader with breadcrumb
- [ ] Account info in DetailCard
- [ ] Related records in card(s)

---

## Scenario 12g: Responsive Layout (768 px Tablet)

**Goal**: Verify detail page two-column grid stacks at tablet width.

1. Set viewport to 768×1024
2. Navigate to any detail page (e.g., a Lead)

**Expected**:
- Field grid inside DetailCard renders as a single column (label above value for each field)
- No horizontal scrollbar appears
- PageHeader actions wrap to a second line if needed (no overflow)

**Pass criteria**:
- [ ] Single-column field layout at 768 px
- [ ] No horizontal overflow

---

## Scenario 12h: TypeScript and Unit Tests

**Goal**: Verify zero TypeScript errors and all unit tests pass.

```powershell
cd frontend
npx tsc --noEmit
# Expected: no output (exit code 0)

npx vitest run
# Expected: all tests pass (currently 26 tests)
```

**Pass criteria**:
- [ ] `tsc --noEmit` exits with code 0
- [ ] All Vitest tests pass

---

## Quick Reference: Key Files Changed

See [data-model.md](../data-model.md) for the full affected files list and component interface shapes.

See [contracts/ui-components.md](../contracts/ui-components.md) for prop contracts.
