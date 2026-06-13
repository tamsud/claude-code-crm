# Component Contracts: Sales CRM Frontend

**Feature**: 004-crm-frontend | **Date**: 2026-06-13

Prop interfaces for all shared UI components. Feature-specific components (AccountForm, LeadStatusControl, etc.) are self-contained and documented inline in their respective feature directories.

---

## Layout Components (`src/components/layout/`)

### `AppShell`
```typescript
interface AppShellProps {
  children: React.ReactNode;
}
// Renders: NavSidebar (left, fixed) + <main> (right, scrollable) containing children
// Active route highlighted in NavSidebar via useLocation()
```

### `NavSidebar`
```typescript
// No external props — derives active route from useLocation()
// Renders navigation links:
// / → Dashboard
// /accounts → Accounts
// /contacts → Contacts
// /leads → Leads
// /opportunities → Opportunities (Pipeline)
// /activities → Activities
// --- divider ---
// /admin/mock-email → Mock Email
// /admin/seed → Seed Manager
```

### `DetailHeader`
```typescript
interface DetailHeaderProps {
  title: string;              // "{FirstName} {LastName}, {AccountName}" or just entity name
  subtitle?: string;          // Optional second line (e.g., job title)
  actions?: React.ReactNode;  // Action buttons (Log Activity, Compose Email, Edit, Delete)
  backHref?: string;          // If set, shows a back arrow link to this URL
}
```

### `ProfileSidebar`
```typescript
interface ProfileSidebarProps {
  name: string;
  initials: string;           // First letter of first + last name, shown in avatar
  avatarColor?: string;       // Tailwind bg class for avatar background
  fields: Array<{
    icon: React.ComponentType<{ className?: string }>;  // Lucide icon component
    label: string;            // Display label
    value: string | null;     // Display value; null renders nothing (field hidden)
    href?: string;            // If set, value is rendered as a link
  }>;
}
```

### `TabStrip`
```typescript
interface TabStripProps<T extends string> {
  tabs: Array<{ id: T; label: string; count?: number }>;
  activeTab: T;
  onChange: (tab: T) => void;
}
```

---

## UI Primitives (`src/components/ui/`)

### `Badge`
```typescript
type LeadStatusColor = 'new' | 'contacted' | 'qualified' | 'lost';
type StageColor = 'prospecting' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
type ActivityTypeColor = 'call' | 'email' | 'meeting';

interface BadgeProps {
  variant: LeadStatusColor | StageColor | ActivityTypeColor | 'default' | 'destructive';
  children: React.ReactNode;
  className?: string;
}
// Renders a pill with pre-defined Tailwind color classes per variant (see research.md §14–15)
```

### `Button`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;          // Shows spinner + disables button when true
  icon?: React.ComponentType<{ className?: string }>;  // Left icon
  children: React.ReactNode;
}
```

### `Card`
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;       // If set, card renders as a clickable element
}
```

### `EmptyState`
```typescript
interface EmptyStateProps {
  title: string;              // e.g., "No accounts yet"
  description?: string;       // e.g., "Create your first account to get started."
  action?: {
    label: string;            // e.g., "Create account"
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}
```

### `ErrorBanner`
```typescript
interface ErrorBannerProps {
  message: string;            // Human-readable error (from Error.message after interceptor)
  onRetry?: () => void;       // If set, shows a "Retry" button
  onDismiss?: () => void;     // If set, shows a dismiss ×
}
```

### `LoadingSpinner`
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;             // Screen-reader accessible label (aria-label)
}
```

### `Modal`
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';  // Controls max-width
}
// Uses @radix-ui/react-dialog under the hood
// Closes on Escape key and backdrop click
// Focus is trapped inside while open
```

### `Pagination`
```typescript
interface PaginationProps {
  page: number;               // Current page (1-indexed)
  total: number;              // Total record count (from API response)
  size: number;               // Page size
  onChange: (page: number) => void;
}
// Displays: "Showing X–Y of Z results"
// Prev / Next buttons; disabled when at first/last page
// If total ≤ size, component renders null (no pagination needed)
```

---

## Feature Component Contracts

### `KpiCard` (Dashboard)
```typescript
interface KpiCardProps {
  label: string;              // e.g., "Open Pipeline"
  value: string;              // Pre-formatted (e.g., "$445,000", "2", "100%")
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';  // Optional trend indicator
  loading?: boolean;
}
```

### `ActivityFeed` (Dashboard)
```typescript
interface ActivityFeedProps {
  activities: Activity[];     // Up to 5, already fetched
  loading?: boolean;
}
// Renders each activity with: type icon (Phone/Mail/Calendar), subject, relative date
// Empty state: "No recent activity"
```

### `LeadStatusControl`
```typescript
interface LeadStatusControlProps {
  currentStatus: LeadStatus;
  onTransition: (newStatus: LeadStatus) => void;
  loading?: boolean;
}
// Only renders valid next states from VALID_TRANSITIONS[currentStatus]
// If getNextStates(currentStatus).length === 0, renders nothing (terminal state)
```

### `PipelineBoard`
```typescript
interface PipelineBoardProps {
  opportunities: Opportunity[];
  onStageChange: (id: string, stage: OpportunityStage) => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}
// Groups opportunities by stage into 5 columns
// Shows column header with stage label + total value
// Empty column shows EmptyState per column
```

### `ActivityTimeline`
```typescript
interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
  emptyMessage?: string;
}
// Renders activities in reverse chronological order
// Each item: type icon + subject + relative date + notes (collapsed, expand on click)
// Linked contact/opportunity names shown if set
```

### `ComposeEmailForm`
```typescript
interface ComposeEmailFormProps {
  defaultTo?: string;          // Pre-fill To field (used from contact email tab)
  defaultFrom?: string;        // Pre-fill From field
  onSuccess?: () => void;      // Called after successful send
  onCancel?: () => void;
}
```

### `SeedResultPanel`
```typescript
interface SeedResultPanelProps {
  result: SeedResult;          // From POST /api/v1/seed/ response
}
// Displays a table: Entity | Count
// accounts | 4, contacts | 4, leads | 3, opportunities | 4, activities | 9, emails | 8
```
