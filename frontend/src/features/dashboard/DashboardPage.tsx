import { useQuery } from '@tanstack/react-query'
import { Building2, Users, TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import { queryKeys } from '@/queryKeys'
import { accountsApi } from '@/api/accounts'
import { leadsApi } from '@/api/leads'
import { opportunitiesApi } from '@/api/opportunities'
import { activitiesApi } from '@/api/activities'
import { KpiCard } from './KpiCard'
import { ActivityFeed } from './ActivityFeed'
import { PipelineFunnel } from './PipelineFunnel'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Card } from '@/components/ui/Card'
import {
  computeWeightedPipeline,
  computeOpenPipeline,
  computeWinRate,
  computeActiveLeadCount,
} from '@/utils/metrics'
import { formatCurrency } from '@/utils/formatters'

export function DashboardPage() {
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
    queryKey: queryKeys.activities.list({ size: 10 }),
    queryFn: () => activitiesApi.list({ size: 10 }),
  })

  const opps = opportunities.data?.items ?? []
  const allLeads = leads.data?.items ?? []

  const winRate = computeWinRate(opps)
  const winRateLabel = winRate == null ? '—' : `${winRate}%`

  const error = accounts.error || leads.error || opportunities.error

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {error && (
        <ErrorBanner
          message={(error as Error).message ?? 'Failed to load dashboard data'}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Accounts"
          value={String(accounts.data?.total ?? 0)}
          icon={Building2}
          loading={accounts.isLoading}
        />
        <KpiCard
          label="Active Leads"
          value={String(computeActiveLeadCount(allLeads))}
          icon={Users}
          loading={leads.isLoading}
        />
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(computeOpenPipeline(opps))}
          icon={DollarSign}
          loading={opportunities.isLoading}
        />
        <KpiCard
          label="Weighted Pipeline"
          value={formatCurrency(computeWeightedPipeline(opps))}
          icon={TrendingUp}
          loading={opportunities.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500 mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {opportunities.isLoading ? '—' : winRateLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Pipeline by Stage
            </h2>
          </div>
          {opportunities.isLoading ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              Loading…
            </div>
          ) : (
            <PipelineFunnel opportunities={opps} />
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <ActivityFeed
            activities={activities.data?.items ?? []}
            loading={activities.isLoading}
          />
        </Card>
      </div>
    </div>
  )
}
