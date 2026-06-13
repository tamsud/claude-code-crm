import { useState } from 'react'
import { Phone, Mail, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Activity, ActivityType } from '@/types/api'
import { formatRelativeDate } from '@/utils/formatters'

const typeIcon: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
}

const typeColor: Record<ActivityType, string> = {
  call: 'text-blue-600 bg-blue-50',
  email: 'text-emerald-600 bg-emerald-50',
  meeting: 'text-violet-600 bg-violet-50',
}

const typeLabel: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
}

const PAGE_SIZE = 5

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const [page, setPage] = useState(0)

  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-1 py-2.5 animate-pulse">
            <div className="h-7 w-7 rounded-lg bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <Calendar className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-xs">No recent activity</p>
      </div>
    )
  }

  const totalPages = Math.ceil(activities.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const slice = activities.slice(start, start + PAGE_SIZE)

  return (
    <div className="flex flex-col">
      {/* Fixed list — always renders PAGE_SIZE slots to keep height stable */}
      <div>
        {slice.map((a) => {
          const Icon = typeIcon[a.type]
          return (
            <div
              key={a.id}
              className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${typeColor[a.type]}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate leading-snug">{a.subject}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-400">{typeLabel[a.type]}</span>
                  <span className="text-slate-200 text-[10px]">·</span>
                  <span className="text-[11px] text-slate-400">{formatRelativeDate(a.activity_date)}</span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Spacer rows to keep height stable when last page has fewer items */}
        {Array.from({ length: PAGE_SIZE - slice.length }).map((_, i) => (
          <div key={`spacer-${i}`} className="h-[46px]" />
        ))}
      </div>

      {/* Footer: pagination + view all link */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
        <Link
          to="/activities"
          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-slate-400 min-w-[2.5rem] text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}