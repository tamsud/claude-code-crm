# Data Model: Top Bar & Inner Page UI Modernisation

**Feature**: 006-topbar-and-inner-page-ui
**Date**: 2026-06-14

> This feature is **purely a UI layer change**. No backend schema, API endpoints, or database tables are created or modified. The data model below describes the **React component interface contracts** (props shapes) and **layout composition model**.

---

## Component Interface Models

### TopBar

```
TopBar
├── Props
│   └── (none — self-contained, reads from AuthContext internally)
├── Internal State
│   └── (none — delegates state to UserMenu)
└── Children rendered
    ├── Left: MobileMenuButton (md:hidden) — calls AppShell.setMobileOpen
    ├── Centre: app name (mobile-only, hidden md:block in sidebar)
    └── Right: UserMenu
```

**File**: `frontend/src/components/layout/TopBar.tsx`

---

### UserMenu

```
UserMenu
├── Props
│   └── (none — reads user from useAuth())
├── Internal State
│   ├── open: boolean          — dropdown visibility
│   └── ref: RefObject<div>    — for click-outside detection
└── Renders
    ├── Trigger button
    │   ├── Avatar circle (initials, bg-indigo-600)
    │   ├── Display name (truncated, hidden on xs)
    │   └── ChevronDown icon
    └── Dropdown panel (absolute, top-full right-0, shadow-dropdown, z-50)
        ├── Header row: full name + role badge
        ├── Divider
        ├── "View Profile" link → /profile
        └── "Sign out" button → logout() + navigate('/login')
```

**File**: `frontend/src/components/layout/UserMenu.tsx`

**Role badge colours** (reuse from NavSidebar):
| Role | Classes |
|------|---------|
| admin | `bg-red-100 text-red-700` |
| manager | `bg-blue-100 text-blue-700` |
| sales_rep | `bg-green-100 text-green-700` |

---

### PageHeader

```
PageHeader
├── Props
│   ├── title: string                     — main heading
│   ├── breadcrumb?: { label: string; to: string }   — optional back-link
│   └── actions?: React.ReactNode         — button(s) rendered right
├── Layout
│   ├── Container: px-6 py-4 flex items-start justify-between flex-wrap gap-3
│   ├── Left: breadcrumb (optional, text-sm text-slate-500 with ArrowLeft) + title (text-2xl font-bold text-slate-900)
│   └── Right: actions wrapped in flex gap-2
└── Responsive: flex-wrap allows actions to wrap to next line on mobile
```

**File**: `frontend/src/components/layout/PageHeader.tsx`

Replaces the existing inline `<div className="flex items-center justify-between"><h1>` pattern found in every list page, and supplements/replaces `DetailHeader.tsx` on detail pages.

---

### DetailCard

```
DetailCard
├── Props
│   ├── title: string                     — card section heading
│   ├── children: React.ReactNode         — field content (FieldRow grid)
│   └── actions?: React.ReactNode         — optional top-right actions within card
├── Layout
│   ├── Outer: bg-white rounded-xl shadow-card border border-slate-100
│   ├── Header: px-6 py-4 border-b border-slate-100 flex justify-between
│   │   ├── title: text-sm font-semibold text-slate-700 uppercase tracking-wide
│   │   └── actions (optional)
│   └── Body: px-6 py-5
```

**File**: `frontend/src/components/ui/DetailCard.tsx`

---

### FieldRow (used inside DetailCard body)

```
FieldRow
├── Props
│   ├── label: string
│   └── value: React.ReactNode
├── Layout (renders two cells in a CSS grid)
│   ├── label cell: text-xs text-slate-500 font-medium uppercase tracking-wide
│   └── value cell: text-sm text-slate-900
```

The parent grid is set on the `DetailCard` body: `grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4`

**File**: `frontend/src/components/ui/DetailCard.tsx` (exported alongside `DetailCard`)

---

## Layout Composition Model

### AppShell (updated)

```
AppShell
├── State: mobileOpen: boolean
├── Renders
│   ├── NavSidebar (unchanged except profile section removed)
│   └── Main area (flex-col)
│       ├── TopBar          ← NEW (full width, always visible)
│       └── <main>
│           └── <Outlet />
```

The mobile-specific `<header>` inside AppShell is replaced by `TopBar` (which handles both mobile and desktop).

---

### NavSidebar (profile section removal)

The `NavSidebar` currently renders a bottom profile block:
```jsx
{/* User profile section */}
<div onClick={() => navigate('/profile')} ...>
  {/* avatar + name + role badge + sign-out button */}
</div>
```
This entire block is removed. The collapse toggle button remains. The nav link section expands to fill the freed space.

---

### Detail Page Composition (before → after)

**Before**:
```
<div>
  <DetailHeader backTo=… title=… actions=… />
  <div className="flex gap-6 p-6">
    <ProfileSidebar name=… fields=… />
    <div className="flex-1">
      <TabStrip … />
      {tab content}
    </div>
  </div>
</div>
```

**After**:
```
<div className="p-6 space-y-6">
  <PageHeader title=… breadcrumb=… actions=… />
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div className="xl:col-span-2 space-y-6">
      <DetailCard title="[Entity] Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow label="…" value="…" />
          …
        </div>
      </DetailCard>
    </div>
    <div className="space-y-6">
      <DetailCard title="Related [Records]">
        {linked items list}
      </DetailCard>
    </div>
  </div>
</div>
```

---

### List Page Composition (before → after)

**Before**:
```
<div className="p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
    <Button>New Lead</Button>
  </div>
  {status tabs}
  <table>…</table>
</div>
```

**After**:
```
<div className="p-6 space-y-4">
  <PageHeader title="Leads" actions={<Button>New Lead</Button>} />
  {status tabs (unchanged)}
  <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
    <table>…</table>
  </div>
</div>
```

---

## Affected Files Summary

| File | Change |
|------|--------|
| `components/layout/AppShell.tsx` | Add `<TopBar>`, remove mobile-only header |
| `components/layout/NavSidebar.tsx` | Remove bottom profile section |
| `components/layout/TopBar.tsx` | **NEW** |
| `components/layout/UserMenu.tsx` | **NEW** |
| `components/layout/PageHeader.tsx` | **NEW** |
| `components/ui/DetailCard.tsx` | **NEW** (exports `DetailCard` + `FieldRow`) |
| `features/accounts/AccountDetailPage.tsx` | Adopt PageHeader + DetailCard layout |
| `features/accounts/AccountsListPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/contacts/ContactDetailPage.tsx` | Adopt PageHeader + DetailCard layout |
| `features/contacts/ContactsListPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/leads/LeadDetailPage.tsx` | Adopt PageHeader + DetailCard layout |
| `features/leads/LeadsListPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/opportunities/OpportunityDetailPage.tsx` | Adopt PageHeader + DetailCard layout |
| `features/opportunities/OpportunitiesListPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/activities/ActivitiesLogPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/admin/UserManagementPage.tsx` | Adopt PageHeader + card table wrapper |
| `features/dashboard/DashboardPage.tsx` | Add PageHeader (title only, no back) |
| `components/layout/DetailHeader.tsx` | Deprecated (kept, not deleted) |
| `components/layout/ProfileSidebar.tsx` | Deprecated (kept, not deleted) |
