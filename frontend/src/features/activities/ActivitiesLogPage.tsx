import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { activitiesApi } from '@/api/activities'
import type { ActivityCreate, ActivityType } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SortFilterBar } from '@/components/ui/SortFilterBar'
import { useSortFilter } from '@/hooks/useSortFilter'
import { ActivityLogForm } from './ActivityLogForm'
import { formatDate } from '@/utils/formatters'

const PAGE_SIZE = 20
const TYPE_TABS: { key: ActivityType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'call', label: 'Calls' },
  { key: 'email', label: 'Emails' },
  { key: 'meeting', label: 'Meetings' },
]

const SORT_OPTIONS = [
  { value: 'activity_date', label: 'Activity Date' },
  { value: 'subject', label: 'Subject' },
  { value: 'type', label: 'Type' },
  { value: 'created_at', label: 'Date Logged' },
]

export function ActivitiesLogPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const sf = useSortFilter({ sortBy: 'activity_date' })

  const params = {
    page,
    size: PAGE_SIZE,
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    ...sf.toParams(),
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.activities.list(params),
    queryFn: () => activitiesApi.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (body: ActivityCreate) => activitiesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activities.lists() })
      toast.success('Activity logged')
      setShowCreate(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Log Activity
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TYPE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTypeFilter(t.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              typeFilter === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SortFilterBar state={sf} sortOptions={SORT_OPTIONS} placeholder="Search activities…" />

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState title="No activities found" description={sf.search ? `No activities matching "${sf.search}"` : 'Log your first activity'} />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="space-y-2">
            {data.items.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-indigo-200 transition-colors"
              >
                <Badge variant="activity" value={a.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                  {a.notes && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{a.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(a.activity_date)}
                </span>
              </div>
            ))}
          </div>
          <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Log Activity">
        <ActivityLogForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
