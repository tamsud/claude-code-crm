import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Opportunity, OpportunityStage } from '@/types/api'
import { formatCurrency } from '@/utils/formatters'

const STAGE_COLORS: Record<OpportunityStage, string> = {
  prospecting: '#94a3b8',
  proposal: '#60a5fa',
  negotiation: '#f59e0b',
  'closed-won': '#22c55e',
  'closed-lost': '#ef4444',
}

const STAGE_LABELS: Record<OpportunityStage, string> = {
  prospecting: 'Prospecting',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Won',
  'closed-lost': 'Lost',
}

interface PipelineFunnelProps {
  opportunities: Opportunity[]
}

export function PipelineFunnel({ opportunities }: PipelineFunnelProps) {
  const stages: OpportunityStage[] = [
    'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
  ]
  const data = stages.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    value: opportunities
      .filter((o) => o.stage === stage)
      .reduce((s, o) => s + (o.value ?? 0), 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={40} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
