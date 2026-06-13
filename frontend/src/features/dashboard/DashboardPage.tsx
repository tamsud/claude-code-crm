import { useQuery } from '@tanstack/react-query'
import { Building2, Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { leadsApi } from '@/api/leads'
import { opportunitiesApi } from '@/api/opportunities'
import { activitiesApi } from '@/api/activities'
import { KpiCard } from './KpiCard'
import { ActivityFeed } from './ActivityFeed'
import { PipelineFunnelChart } from './PipelineFunnelChart'
import { DealsByStageChart } from './DealsByStageChart'
import { PipelineByProbability } from './PipelineByProbability'
import { StageCountChart } from './StageCountChart'
import { WonLostSummary } from './WonLostSummary'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  computeWeightedPipeline,
  computeOpenPipeline,
  computeWinRate,
  computeActiveLeadCount,
} from '@/utils/metrics'
import { formatCurrency } from '@/utils/formatters'

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {loading ? <SkeletonRow count={3} /> : children}
    </div>
  )
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const accounts = useQuery({
    queryKey: queryKeys.accounts.list({ size: 1 }),
    queryFn: () => accountsApi.list({ size: 1 }),
  })
  const leads = useQuery({
    queryKey: queryKeys.leads.list({ size: 200 }),
    queryFn: () => leadsApi.list({ size: 200 }),
  })
  const opportunities = useQuery({
    queryKey: queryKeys.opportunities.list({ size: 200 }),
    queryFn: () => opportunitiesApi.list({ size: 200 }),
  })
  const activities = useQuery({
    queryKey: queryKeys.activities.list({ size: 30 }),
    queryFn: () => activitiesApi.list({ size: 30 }),
  })

  const opps = opportunities.data?.items ?? []
  const allLeads = leads.data?.items ?? []
  const activeLeads = computeActiveLeadCount(allLeads)
  const winRate = computeWinRate(opps)

  const error = accounts.error || leads.error || opportunities.error

  // Pipeline stage counts for quick summary
  const openOpps = opps.filter((o) => !['closed-won', 'closed-lost'].includes(o.stage))

  return (
    <div className="p-4 space-y-4">
      {error && (
        <ErrorBanner message={(error as Error).message ?? 'Failed to load dashboard data'} />
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Accounts"
          value={String(accounts.data?.total ?? 0)}
          icon={Building2}
          color="indigo"
          loading={accounts.isLoading}
          subtitle="Tracked companies"
        />
        <KpiCard
          label="Active Leads"
          value={String(activeLeads)}
          icon={Target}
          color="amber"
          loading={leads.isLoading}
          subtitle="New + contacted + qualified"
        />
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(computeOpenPipeline(opps))}
          icon={DollarSign}
          color="emerald"
          loading={opportunities.isLoading}
          subtitle={`${openOpps.length} open deals`}
        />
        <KpiCard
          label="Weighted Value"
          value={formatCurrency(computeWeightedPipeline(opps))}
          icon={TrendingUp}
          color="blue"
          loading={opportunities.isLoading}
          subtitle="Probability-adjusted"
        />
        <KpiCard
          label="Win Rate"
          value={opportunities.isLoading ? '—' : (winRate == null ? '—' : `${winRate}%`)}
          icon={Users}
          color="violet"
          loading={opportunities.isLoading}
          subtitle="Closed won / total closed"
        />
      </div>

      {/* ── Main content: charts (left 2/3) + sidebar (right 1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Charts column — takes 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pipeline funnel + probability side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="Pipeline by Stage" loading={opportunities.isLoading}>
              <PipelineFunnelChart opportunities={opps} />
            </ChartCard>
            <ChartCard title="Deals by Stage (Count)" loading={opportunities.isLoading}>
              <StageCountChart opportunities={opps} />
            </ChartCard>
          </div>

          {/* Value pie + probability bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="Deals by Stage (Value)" loading={opportunities.isLoading}>
              <DealsByStageChart opportunities={opps} />
            </ChartCard>
            <ChartCard title="Pipeline by Probability" loading={opportunities.isLoading}>
              <PipelineByProbability opportunities={opps} />
            </ChartCard>
          </div>

        </div>

        {/* Right sidebar — takes 1/3 */}
        <div className="space-y-4">

          {/* Won / Lost summary */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Closed Deals</h3>
            <WonLostSummary opportunities={opps} />
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Activity</h3>
            <ActivityFeed
              activities={activities.data?.items ?? []}
              loading={activities.isLoading}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
