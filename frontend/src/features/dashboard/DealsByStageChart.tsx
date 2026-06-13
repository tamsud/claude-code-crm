import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
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

interface LabelProps {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number
  percent: number; count: number
}

const RADIAN = Math.PI / 180

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, count }: LabelProps) {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${count} (${(percent * 100).toFixed(0)}%)`}
    </text>
  )
}

export function DealsByStageChart({ opportunities }: Props) {
  const data = STAGES.map((stage) => {
    const stageOpps = opportunities.filter((o) => o.stage === stage)
    return {
      name: STAGE_LABELS[stage],
      value: stageOpps.reduce((s, o) => s + (o.value ?? 0), 0),
      count: stageOpps.length,
      fill: STAGE_COLORS[stage],
    }
  }).filter((d) => d.count > 0)

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">No opportunity data.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          labelLine={false}
          label={(props) => <CustomLabel {...props} count={props.payload.count} />}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number, name: string, props: { payload?: { count?: number } }) =>
            [`${formatCurrency(value)} · ${props.payload?.count ?? 0} deals`, name]
          }
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
