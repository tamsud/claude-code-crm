import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SkeletonText } from '@/components/ui/Skeleton'

interface TrendProps {
  direction: 'up' | 'down' | 'flat'
  percent?: number
  label?: string
}

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'violet'
  loading?: boolean
  error?: boolean
  trend?: TrendProps
  subtitle?: string
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  violet: { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
}

export function KpiCard({ label, value, icon: Icon, color = 'indigo', loading, error, trend, subtitle }: KpiCardProps) {
  const c = colorMap[color]

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus
  const trendColor = trend?.direction === 'up' ? 'text-emerald-600 bg-emerald-50' : trend?.direction === 'down' ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-50'

  return (
    <div className={`group bg-white rounded-xl border ${c.border} shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`${c.light} rounded-lg p-2`}>
          <Icon className={`h-4 w-4 ${c.text}`} />
        </div>
      </div>

      <div>
        {loading ? (
          <SkeletonText className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{error ? '—' : value}</p>
        )}
        {subtitle && !loading && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {!loading && trend && (
        <div className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-medium ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          {trend.percent != null && <span>{trend.percent}%</span>}
          {trend.label && <span>{trend.label}</span>}
        </div>
      )}
    </div>
  )
}

