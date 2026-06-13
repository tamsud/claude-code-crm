import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { List, Columns } from 'lucide-react'
import { ListPageTitle } from '@/components/layout/PageHeader'
import { queryKeys } from '@/queryKeys'
import { opportunitiesApi } from '@/api/opportunities'
import type { OpportunityCreate, OpportunityStage } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { TableHead } from '@/components/ui/TableHead'
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

  const viewToggle = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setView('board')}
        title="Board view"
        className={`p-1 rounded transition-colors ${view === 'board' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
      >
        <Columns className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setView('table')}
        title="Table view"
        className={`p-1 rounded transition-colors ${view === 'table' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      <ListPageTitle title="Opportunities" />
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}

      <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonRow count={5} /></div>
        ) : (
          <>
            {/* Table view: TableHead in <table> with search+toggle embedded in thead */}
            {view === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <TableHead
                    columns={[
                      { label: 'Title', field: 'title' },
                      { label: 'Stage', field: 'stage' },
                      { label: 'Value', field: 'value' },
                      { label: 'Probability', field: 'probability', noSort: true },
                    ]}
                    sf={sf}
                    setPage={() => {}}
                    search={sf.search}
                    onSearch={(v) => sf.setSearch(v)}
                    searchPlaceholder="Search pipeline..."
                    onAdd={() => setShowCreate(true)}
                    addLabel="New Opportunity"
                    extra={viewToggle}
                  />
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState
                            title="No opportunities found"
                            description={sf.search ? `No opportunities matching "${sf.search}"` : 'Add your first opportunity'}
                            action={{ label: 'New Opportunity', onClick: () => setShowCreate(true) }}
                          />
                        </td>
                      </tr>
                    ) : (
                      items.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-indigo-600">
                            <Link to={`/opportunities/${o.id}`}>{o.title}</Link>
                          </td>
                          <td className="px-4 py-3"><Badge variant="stage" value={o.stage} /></td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(o.value ?? 0)}</td>
                          <td className="px-4 py-3 text-slate-600">{o.probability ?? '—'}%</td>
                          <td />
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Board view: compact header row then kanban columns */
              <>
                {/* Board header — mimics thead appearance */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Board</span>
                  <div className="flex items-center gap-1">
                    {/* Search */}
                    <BoardSearch sf={sf} />
                    {viewToggle}
                    <div className="w-px h-4 bg-slate-200 mx-0.5" />
                    <button
                      onClick={() => setShowCreate(true)}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <span className="text-base leading-none">+</span> New Opportunity
                    </button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <EmptyState
                    title="No opportunities found"
                    description={sf.search ? `No opportunities matching "${sf.search}"` : 'Add your first opportunity'}
                    action={{ label: 'New Opportunity', onClick: () => setShowCreate(true) }}
                  />
                ) : (
                  <div className="flex gap-4 overflow-x-auto p-4">
                    {STAGES.map((stage) => {
                      const stageItems = items.filter((o) => o.stage === stage)
                      return (
                        <div key={stage} className="min-w-[220px] w-[220px] flex-shrink-0">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {STAGE_LABELS[stage]}
                            </span>
                            <span className="text-xs text-slate-400">{stageItems.length}</span>
                          </div>
                          <div className="space-y-2">
                            {stageItems.map((o) => (
                              <Link
                                key={o.id}
                                to={`/opportunities/${o.id}`}
                                className="block rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                              >
                                <p className="text-sm font-medium text-slate-900 truncate">{o.title}</p>
                                <p className="text-sm text-indigo-600 mt-1">{formatCurrency(o.value ?? 0)}</p>
                                {o.probability != null && (
                                  <p className="text-xs text-slate-400 mt-1">{o.probability}% probability</p>
                                )}
                              </Link>
                            ))}
                            {stageItems.length === 0 && (
                              <div className="rounded-lg border border-dashed border-slate-100 p-3 text-center text-xs text-slate-400">Empty</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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

/** Inline search for board view header */
import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { UseSortFilterReturn } from '@/hooks/useSortFilter'

function BoardSearch({ sf }: { sf: UseSortFilterReturn }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const openIt = () => { setOpen(true); requestAnimationFrame(() => ref.current?.focus()) }

  return open ? (
    <div className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 shadow-xs">
      <Search className="h-3 w-3 text-slate-400 flex-shrink-0" />
      <input
        ref={ref}
        value={sf.search}
        onChange={(e) => sf.setSearch(e.target.value)}
        onBlur={() => { if (!sf.search) setOpen(false) }}
        placeholder="Search pipeline..."
        className="w-36 text-xs bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
      />
      <button onMouseDown={(e) => { e.preventDefault(); sf.setSearch(''); setOpen(false) }} className="text-slate-400 hover:text-slate-600">
        <X className="h-3 w-3" />
      </button>
    </div>
  ) : (
    <button
      onClick={openIt}
      title="Search"
      className={`p-1.5 rounded-md transition-colors ${sf.search ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
    >
      <Search className="h-3.5 w-3.5" />
    </button>
  )
}