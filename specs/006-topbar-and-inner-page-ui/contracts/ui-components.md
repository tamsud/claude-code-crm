# UI Component Contracts: Top Bar & Inner Page UI Modernisation

**Feature**: 006-topbar-and-inner-page-ui
**Date**: 2026-06-14

This document defines the public prop contracts for each new shared component introduced by this feature. These serve as the binding interface between the layout system and the pages that consume them.

---

## TopBar

**File**: `frontend/src/components/layout/TopBar.tsx`

```typescript
// No external props — reads from AuthContext, receives callbacks via context or AppShell wiring

interface TopBarProps {
  onMenuClick: () => void   // called when hamburger button is pressed
}
```

**Behaviour contract**:
- `onMenuClick` is invoked when the hamburger icon is pressed (mobile only — button hidden on `md:` and above)
- The `UserMenu` is always rendered and always visible regardless of viewport
- The component renders as `<header>` with `role="banner"` and `aria-label="Top bar"`

---

## UserMenu

**File**: `frontend/src/components/layout/UserMenu.tsx`

```typescript
// No external props — reads user from useAuth()
// Self-contained: manages open/closed state internally
interface UserMenuProps {}
```

**Behaviour contract**:
- Reads `user`, `logout` from `useAuth()`
- Opens dropdown on trigger click; closes on second click or click-outside
- "View Profile" navigates to `/profile` and closes dropdown
- "Sign out" calls `logout()` then `navigate('/login')` and closes dropdown
- Dropdown panel has `role="menu"` and each item has `role="menuitem"`
- Focus is trapped within the open dropdown when navigating with Tab/Shift+Tab

---

## PageHeader

**File**: `frontend/src/components/layout/PageHeader.tsx`

```typescript
interface PageHeaderProps {
  title: string
  breadcrumb?: {
    label: string   // e.g. "Leads"
    to: string      // e.g. "/leads"
  }
  actions?: React.ReactNode
}
```

**Behaviour contract**:
- When `breadcrumb` is provided, renders a back-arrow link above the title using `react-router-dom` `Link`
- `title` renders as `<h1>` (list pages) or `<h1>` with breadcrumb as visual prefix (detail pages)
- `actions` is rendered flush-right; wraps to a new line on small viewports
- Component has no internal state

---

## DetailCard

**File**: `frontend/src/components/ui/DetailCard.tsx`

```typescript
interface DetailCardProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode   // optional top-right controls within the card header
  className?: string          // additional classes on the outer wrapper
}
```

**Behaviour contract**:
- Renders a card shell: white background, rounded corners, subtle shadow, border
- Card header contains `title` (left) and optional `actions` (right)
- Card body contains `children` (no additional padding override needed from consumer)
- Has no internal state

---

## FieldRow

**File**: `frontend/src/components/ui/DetailCard.tsx` (exported from same file)

```typescript
interface FieldRowProps {
  label: string
  value: React.ReactNode    // string, link, badge, or any inline element
}
```

**Behaviour contract**:
- Renders a label cell and a value cell
- Does NOT include its own grid wrapper — parent must apply `grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4`
- `label` is visually styled as a secondary descriptor (small, muted, uppercase)
- `value` can be any React node; plain strings are rendered as `text-sm text-slate-900`

---

## Integration Contract: AppShell + TopBar

`AppShell` is the sole owner of `mobileOpen` state. It passes `onMenuClick` down to `TopBar`. This keeps the drawer state in one place (not split between `TopBar` and `NavSidebar`).

```
AppShell
  state: mobileOpen
  ├─ TopBar        onMenuClick={() => setMobileOpen(true)}
  └─ NavSidebar    mobileOpen={mobileOpen}  onMobileClose={() => setMobileOpen(false)}
```
