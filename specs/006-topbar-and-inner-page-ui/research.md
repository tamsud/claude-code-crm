# Research: Top Bar & Inner Page UI Modernisation

**Feature**: 006-topbar-and-inner-page-ui
**Date**: 2026-06-14

---

## Decision 1: User Profile Widget Placement

**Decision**: Move user profile from sidebar bottom to a persistent `TopBar` component in the top-right corner.

**Rationale**: All three reference CRMs (Salesforce Lightning, HubSpot, Zoho) place the avatar/user-menu in the top-right corner of a global header bar. This is the established SaaS convention. The sidebar bottom location is associated with legacy tools (early Slack, old enterprise portals). Moving it to the top bar also frees the sidebar to be purely navigational, improving its collapse/icon-only mode.

**Mock image evidence**: Both reference images (`mocks/image.png`, `mocks/mock1.png`) show a horizontal top bar with avatar top-right and a clean sidebar containing only navigation items.

**Alternatives considered**:
- Keep in sidebar bottom, add a floating avatar to the top bar as well → dismissed (duplication, inconsistent state)
- Use a separate Profile page link in the sidebar nav → dismissed (hides the user identity from every page)

---

## Decision 2: Top Bar Structure

**Decision**: Extend the existing `AppShell.tsx` to include a full-width persistent `TopBar` on all authenticated pages (desktop + mobile). The top bar contains: hamburger (mobile-only), app name/logo (hidden on desktop where sidebar shows it), and a `UserMenu` widget (always visible, right-aligned).

**Rationale**: The current `AppShell` already renders a mobile-only header bar. Extending it to a full persistent top bar (visible on desktop too) is the minimal change. The desktop sidebar still shows the logo; on mobile the top bar shows it.

**Alternatives considered**:
- Create a separate `TopBar.tsx` component file → chosen approach — keeps AppShell clean and delegates responsibility
- Embed UserMenu directly in AppShell → creates too much coupling; TopBar.tsx gives an obvious single-responsibility component

---

## Decision 3: UserMenu Dropdown Implementation

**Decision**: Implement `UserMenu` as a self-contained component using React `useState` + a `useOnClickOutside` hook (or `useEffect` + `document.addEventListener`) to close on click-outside. No third-party dropdown library.

**Rationale**: The project already has no third-party dropdown/popover library. Adding one (Headless UI, Radix) would be justified for a full design system but is out of scope here. A simple absolute-positioned `<div>` toggled by a boolean flag with click-outside cleanup is idiomatic React for this use case.

**Alternatives considered**:
- `@radix-ui/react-dropdown-menu` → adds a dependency, out of scope
- Native `<details>`/`<summary>` HTML element → poor keyboard/focus control, not accessible enough

---

## Decision 4: Inner Page Layout — Card-Based Sections

**Decision**: Replace the current `ProfileSidebar` + `TabStrip` pattern on detail pages with a full-width card-based layout. Each logical data group (Identity, Contact Info, CRM Meta, Related Records) becomes a `DetailCard` with a two-column field grid.

**Rationale**: The mock images show a card-grid approach used by HubSpot and Zoho, where related fields are in clearly delineated sections with a card header. The current `ProfileSidebar` (avatar + 2 fields in a narrow right sidebar) is legacy "form in a box" UX.

**New pattern**:
```
┌─────────────────────────────────────────────────────────┐
│ [PageHeader: title + breadcrumb left, actions right]    │
├─────────────────────┬───────────────────────────────────┤
│ DetailCard: Info    │ DetailCard: Contact / Meta        │
│  2-col field grid   │  2-col field grid                 │
├─────────────────────┴───────────────────────────────────┤
│ DetailCard: Related (Activities / Contacts / Opps)      │
│  styled list rows                                       │
└─────────────────────────────────────────────────────────┘
```

**Alternatives considered**:
- Keep ProfileSidebar, update its styling only → addresses symptoms, not the layout problem
- Single-column stacked cards → wastes horizontal space on desktop; cards side-by-side use space better

---

## Decision 5: Shared UI Components to Create

**Decision**: Create three new shared UI primitives:

| Component | File | Purpose |
|-----------|------|---------|
| `TopBar` | `components/layout/TopBar.tsx` | Global top bar shell |
| `UserMenu` | `components/layout/UserMenu.tsx` | Avatar + dropdown widget |
| `PageHeader` | `components/layout/PageHeader.tsx` | Per-page title + breadcrumb + actions |
| `DetailCard` | `components/ui/DetailCard.tsx` | Card with header + two-col body |

`DetailHeader.tsx` and `ProfileSidebar.tsx` are **deprecated by this feature** — kept in place but no longer used by the updated pages (safe to delete in a future cleanup task).

**Rationale**: Small, focused components over large multi-concern ones. Each component solves exactly one layout problem.

---

## Decision 6: List Page Card Container

**Decision**: Wrap each list page's table in a styled `<div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">`. The list header (title + action button) moves into a `<PageHeader>` above the card. Column headers use `bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider`. Row hover: `hover:bg-slate-50 transition-colors`.

**Alternatives considered**:
- Leave tables unstyled, add colour only → not sufficient; no card container = no visual grouping
- Replace tables with card-grid (like Kanban) → out of scope; tabular list is the correct pattern for entity lists

---

## Decision 7: Responsive Behaviour

**Decision**: Detail page field grids use `grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4`. Top bar is always visible. PageHeader actions on mobile wrap to a second line (flex-wrap) rather than collapsing to a "…" menu (simpler, fewer edge cases).

**Rationale**: flex-wrap is zero additional code vs. an overflow menu component. Two wrapped buttons on mobile are acceptable.

---

## Resolved Clarifications (none required)

All technical decisions were resolvable from the existing codebase, mock images, and established design tokens. No external research APIs were needed.
