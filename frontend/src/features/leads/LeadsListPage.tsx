import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/queryKeys'
import { leadsApi } from '@/api/leads'
import type { LeadCreate, LeadStatus } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableHead } from '@/components/ui/TableHead'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { useSortFilter } from '@/hooks/useSortFilter'
import { LeadForm } from './LeadForm'

const PAGE_SIZE = 20
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'lost', label: 'Lost' },
]

export function LeadsListPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const sf = useSortFilter()

  const params = {
    page,
    size: PAGE_SIZE,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...sf.toParams(),
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: () => leadsApi.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (body: LeadCreate) => leadsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      toast.success('Lead created')
      setShowCreate(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-3">
      <ListPageTitle title="Leads" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <TableHead
                columns={[
                  { label: 'Name', field: 'first_name' },
                  { label: 'Company', field: 'company' },
                  { label: 'Email', field: 'email' },
                  { label: 'Status', field: 'status' },
                ]}
                sf={sf}
                setPage={setPage}
                search={sf.search}
                onSearch={(v) => { sf.setSearch(v); setPage(1) }}
                searchPlaceholder="Search leads..."
                onAdd={() => setShowCreate(true)}
                addLabel="New Lead"
                tabs={STATUS_TABS}
                activeTab={statusFilter}
                onTabChange={(k) => setStatusFilter(k as LeadStatus | 'all')}
              />
              <tbody className="divide-y divide-slate-100">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="No leads found" description={sf.search ? `No leads matching "${sf.search}"` : 'Add your first lead'} />
                    </td>
                  </tr>
                ) : (
                  data?.items.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-600">
                        <Link to={`/leads/${l.id}`}>{l.first_name} {l.last_name}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{l.company ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{l.email}</td>
                      <td className="px-4 py-3"><Badge variant="status" value={l.status} /></td>
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
      <Modal open={showCreate} onOpenChange={setShowCreate} title="New Lead">
        <LeadForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}