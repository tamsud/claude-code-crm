import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: LucideIcon
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500 max-w-xs">{description}</p>}
      {action && (
        <div className="mt-4">
          <Button onClick={action.onClick} size="sm">{action.label}</Button>
        </div>
      )}
    </div>
  )
}

