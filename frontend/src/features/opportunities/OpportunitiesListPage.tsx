import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, List, Columns } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { opportunitiesApi } from '@/api/opportunities'
import type { OpportunityCreate, OpportunityStage } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SortFilterBar } from '@/components/ui/SortFilterBar'
import { useSortFilter } from '@/hooks/useSortFilter'
import { OpportunityForm } from './OpportunityForm'
import { formatCurrency } from '@/utils/formatters'

const STAGES: OpportunityStage[] = [
  'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
]

const STAGE_LABELS: Record<OpportunityStage, string> = {
  prospecting: 'Prospecting',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Won',
  'closed-lost': 'Lost',
}

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'stage', label: 'Stage' },
  { value: 'value', label: 'Value' },
  { value: 'probability', label: 'Probability' },
  { value: 'expected_close_date', label: 'Close Date' },
]

type ViewMode = 'board' | 'table'

export function OpportunitiesListPage() {
  const qc = useQueryClient()
  const [view, setView] = useState<ViewMode>('board')
  const [showCreate, setShowCreate] = useState(false)
  const sf = useSortFilter()

  const params = { size: 200, ...sf.toParams() }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.opportunities.list(params),
    queryFn: () => opportunitiesApi.list(params),
  })

  const createMutation = useMutation({
    mutationFn: (body: OpportunityCreate) => opportunitiesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.lists() })
      toast.success('Opportunity created')
      setShowCreate(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('board')}
            className={`p-1.5 rounded ${view === 'board' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
            title="Board view"
          >
            <Columns className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded ${view === 'table' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Opportunity
          </Button>
        </div>
      </div>

      <SortFilterBar state={sf} sortOptions={SORT_OPTIONS} placeholder="Search opportunities…" />

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <EmptyState
          title="No opportunities found"
          description={sf.search ? `No opportunities matching "${sf.search}"` : 'Add your first opportunity'}
          action={{ label: 'New Opportunity', onClick: () => setShowCreate(true) }}
        />
      )}

      {view === 'board' && items.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageItems = items.filter((o) => o.stage === stage)
            return (
              <div key={stage} className="min-w-[220px] w-[220px] flex-shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs text-gray-400">{stageItems.length}</span>
                </div>
                <div className="space-y-2">
                  {stageItems.map((o) => (
                    <Link
                      key={o.id}
                      to={`/opportunities/${o.id}`}
                      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{o.title}</p>
                      <p className="text-sm text-indigo-600 mt-1">{formatCurrency(o.value ?? 0)}</p>
                      {o.probability != null && (
                        <p className="text-xs text-gray-400 mt-1">{o.probability}% probability</p>
                      )}
                    </Link>
                  ))}
                  {stageItems.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'table' && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Stage</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Value</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-indigo-600">
                    <Link to={`/opportunities/${o.id}`}>{o.title}</Link>
                  </td>
                  <td className="px-4 py-3"><Badge variant="stage" value={o.stage} /></td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(o.value ?? 0)}</td>
                  <td className="px-4 py-3 text-gray-600">{o.probability ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onOpenChange={setShowCreate} title="New Opportunity" size="lg">
        <OpportunityForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
