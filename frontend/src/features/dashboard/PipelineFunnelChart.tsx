import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts'
import type { Opportunity, OpportunityStage } from '@/types/api'
import { formatCurrency } from '@/utils/formatters'

const STAGE_COLORS: Record<OpportunityStage, string> = {
  prospecting: '#6366f1',
  proposal: '#3b82f6',
  negotiation: '#f59e0b',
  'closed-won': '#22c55e',
  'closed-lost': '#ef4444',
}

const STAGE_LABELS: Record<OpportunityStage, string> = {
  prospecting: 'Prospecting',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

const STAGES: OpportunityStage[] = [
  'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
]

interface Props {
  opportunities: Opportunity[]
}

export function PipelineFunnelChart({ opportunities }: Props) {
  const data = STAGES.map((stage) => {
    const stageOpps = opportunities.filter((o) => o.stage === stage)
    return {
      name: STAGE_LABELS[stage],
      value: stageOpps.reduce((s, o) => s + (o.value ?? 0), 0),
      count: stageOpps.length,
      fill: STAGE_COLORS[stage],
    }
  }).filter((d) => d.value > 0 || d.count > 0)

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No opportunity data.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <FunnelChart>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number, _name: string, props: { payload?: { count?: number } }) =>
            [`${formatCurrency(value)} (${props.payload?.count ?? 0} deals)`, 'Pipeline Value']
          }
        />
        <Funnel dataKey="value" data={data} isAnimationActive>
          <LabelList
            position="right"
            fill="#475569"
            stroke="none"
            dataKey="name"
            style={{ fontSize: 11, fontWeight: 500 }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  )
}