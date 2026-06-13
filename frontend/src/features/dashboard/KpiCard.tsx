import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  loading?: boolean
}

export function KpiCard({ label, value, icon: Icon, loading }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {loading ? (
            <LoadingSpinner size="sm" className="mt-1" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className="rounded-lg bg-blue-50 p-2">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
    </Card>
  )
}
