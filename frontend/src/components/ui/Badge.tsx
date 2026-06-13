import { cn } from '@/utils/cn'

const colorMap: Record<string, string> = {
  new:          'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
  contacted:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  qualified:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  lost:         'bg-slate-100 text-slate-500 ring-1 ring-slate-200/60',
  prospecting:  'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
  proposal:     'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  negotiation:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  'closed-won': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  'closed-lost':'bg-red-50 text-red-600 ring-1 ring-red-200/60',
  call:         'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  email:        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  meeting:      'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  default:      'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
}

function formatLabel(v: string): string {
  return v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface BadgeProps {
  variant?: 'status' | 'stage' | 'activity' | string
  value?: string
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant: _variant, value, children, className }: BadgeProps) {
  const colorKey = value ?? 'default'
  const classes = colorMap[colorKey] ?? colorMap.default
  const label = children ?? (value ? formatLabel(value) : '')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}