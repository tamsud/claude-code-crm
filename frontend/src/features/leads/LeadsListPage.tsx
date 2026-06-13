import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { leadsApi } from '@/api/leads'
import type { LeadCreate, LeadStatus } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SortFilterBar } from '@/components/ui/SortFilterBar'
import { useSortFilter } from '@/hooks/useSortFilter'
import { LeadForm } from './LeadForm'

const PAGE_SIZE = 20
const STATUS_TABS: { key: LeadStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'lost', label: 'Lost' },
]

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'company', label: 'Company' },
  { value: 'status', label: 'Status' },
  { value: 'updated_at', label: 'Last Updated' },
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Lead
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatusFilter(t.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SortFilterBar state={sf} sortOptions={SORT_OPTIONS} placeholder="Search leads…" />

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && data?.items.length === 0 && (
        <EmptyState title="No leads found" description={sf.search ? `No leads matching "${sf.search}"` : 'Add your first lead'} />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      <Link to={`/leads/${l.id}`}>{l.first_name} {l.last_name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.company ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{l.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="status" value={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} size={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
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
