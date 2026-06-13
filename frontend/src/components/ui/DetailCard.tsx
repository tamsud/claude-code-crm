interface DetailCardProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DetailCard({ title, children, actions, className = '' }: DetailCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

interface FieldRowProps {
  label: string
  value: React.ReactNode
}

export function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div>
      <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-900">{value ?? '—'}</dd>
    </div>
  )
}
