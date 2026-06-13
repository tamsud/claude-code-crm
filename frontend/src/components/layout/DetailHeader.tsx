import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DetailHeaderProps {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  backTo?: string
  backLabel?: string
}

export function DetailHeader({ title, subtitle, actions, backTo, backLabel = 'Back' }: DetailHeaderProps) {
  return (
    <div className="border-b border-slate-100 bg-white px-6 py-4">
      {backTo && (
        <Link
          to={backTo}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
