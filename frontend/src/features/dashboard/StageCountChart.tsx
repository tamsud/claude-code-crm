import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Opportunity, OpportunityStage } from '@/types/api'

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

const STAGES: OpportunityStage[] = [
  'prospecting', 'proposal', 'negotiation', 'closed-won', 'closed-lost',
]

interface Props {
  opportunities: Opportunity[]
}

export function StageCountChart({ opportunities }: Props) {
  const data = STAGES.map((stage) => ({
    label: STAGE_LABELS[stage],
    count: opportunities.filter((o) => o.stage === stage).length,
    color: STAGE_COLORS[stage],
  })).filter((d) => d.count > 0)

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No opportunity data.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number) => [value, 'Deals']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}