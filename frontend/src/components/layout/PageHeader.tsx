import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'

interface PageHeaderProps {
  title: string
  breadcrumb?: { label: string; to: string }
  actions?: React.ReactNode
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  usePageTitle(title)

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        {breadcrumb && (
          <Link
            to={breadcrumb.to}
            className="mb-0.5 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" />
            {breadcrumb.label}
          </Link>
        )}
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}

/**
 * Compact page-level title for list pages.
 * Sits above the table card and sets the browser tab title automatically.
 */
export function ListPageTitle({ title, description }: { title: string; description?: string }) {
  usePageTitle(title)
  return (
    <div className="px-1 pb-1">
      <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
  )
}

