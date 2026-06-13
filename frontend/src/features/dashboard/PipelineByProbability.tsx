import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Opportunity } from '@/types/api'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  opportunities: Opportunity[]
}

const BUCKETS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]

export function PipelineByProbability({ opportunities }: Props) {
  const data = BUCKETS.map((bucket) => {
    const inBucket = opportunities.filter((o) => {
      const p = o.probability ?? 0
      return p >= bucket && p < bucket + 10
    })
    return {
      label: `${bucket}%`,
      count: inBucket.length,
      value: inBucket.reduce((sum, o) => sum + (o.value ?? 0), 0),
    }
  }).filter((d) => d.count > 0)

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No opportunity data.</p>
  }

  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, maxCount + 1]} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number, name: string) =>
            name === 'value' ? [formatCurrency(value), 'Value'] : [value, 'Deals']
          }
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {data.map((_, i) => (
            <Cell key={i} fill="#6366f1" opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}