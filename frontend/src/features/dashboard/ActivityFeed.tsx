import { Phone, Mail, Calendar } from 'lucide-react'
import type { Activity, ActivityType } from '@/types/api'
import { formatRelativeDate } from '@/utils/formatters'
import { EmptyState } from '@/components/ui/EmptyState'

const typeIcon: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
}

const typeColor: Record<ActivityType, string> = {
  call: 'text-blue-600 bg-blue-50',
  email: 'text-green-600 bg-green-50',
  meeting: 'text-purple-600 bg-purple-50',
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) return <div className="text-sm text-gray-400 p-4">Loading…</div>
  if (activities.length === 0) return <EmptyState title="No recent activity" />

  return (
    <ul className="divide-y divide-gray-100">
      {activities.map((a) => {
        const Icon = typeIcon[a.type]
        return (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <div className={`rounded-full p-1.5 ${typeColor[a.type]}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{a.subject}</p>
              <p className="text-xs text-gray-400">{formatRelativeDate(a.activity_date)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
