import { cn } from '@/utils/cn'

const colorMap: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  qualified: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-600',
  prospecting: 'bg-slate-100 text-slate-700',
  proposal: 'bg-blue-100 text-blue-800',
  negotiation: 'bg-amber-100 text-amber-800',
  'closed-won': 'bg-green-100 text-green-800',
  'closed-lost': 'bg-red-100 text-red-800',
  call: 'bg-blue-50 text-blue-700',
  email: 'bg-green-50 text-green-700',
  meeting: 'bg-purple-50 text-purple-700',
  default: 'bg-gray-100 text-gray-700',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}
