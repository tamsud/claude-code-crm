import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { activitiesApi } from '@/api/activities'
import type { ActivityCreate, ActivityType } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { TableHead } from '@/components/ui/TableHead'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { useSortFilter } from '@/hooks/useSortFilter'
import { ActivityLogForm } from './ActivityLogForm'
import { formatDate } from '@/utils/formatters'

const PAGE_SIZE = 20
const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'call', label: 'Calls' },
  { key: 'email', label: 'Emails' },
  { key: 'meeting', label: 'Meetings' },
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
    <div className="p-4 space-y-3">
      <ListPageTitle title="Activities" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <TableHead
                columns={[
                  { label: 'Type', field: 'type', noSort: true },
                  { label: 'Subject', field: 'subject' },
                  { label: 'Notes', field: 'notes', noSort: true },
                  { label: 'Date', field: 'activity_date' },
                ]}
                sf={sf}
                setPage={setPage}
                search={sf.search}
                onSearch={(v) => { sf.setSearch(v); setPage(1) }}
                searchPlaceholder="Search activities..."
                onAdd={() => setShowCreate(true)}
                addLabel="Log Activity"
                tabs={TYPE_TABS}
                activeTab={typeFilter}
                onTabChange={(k) => setTypeFilter(k as ActivityType | 'all')}
              />
              <tbody className="divide-y divide-slate-100">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="No activities found" description={sf.search ? `No activities matching "${sf.search}"` : 'Log your first activity'} />
                    </td>
                  </tr>
                ) : (
                  data?.items.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><Badge variant="activity" value={a.type} /></td>
                      <td className="px-4 py-3 font-medium text-slate-900">{a.subject}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs">
                        <span className="truncate block">{a.notes ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(a.activity_date)}</td>
                      <td />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && data.total != null && data.total > PAGE_SIZE && (
        <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
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