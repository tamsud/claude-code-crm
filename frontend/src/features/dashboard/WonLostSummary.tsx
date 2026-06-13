import { CheckCircle2, XCircle } from 'lucide-react'
import type { Opportunity } from '@/types/api'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  opportunities: Opportunity[]
}

export function WonLostSummary({ opportunities }: Props) {
  const won = opportunities.filter((o) => o.stage === 'closed-won')
  const lost = opportunities.filter((o) => o.stage === 'closed-lost')
  const wonValue = won.reduce((sum, o) => sum + (o.value ?? 0), 0)
  const lostValue = lost.reduce((sum, o) => sum + (o.value ?? 0), 0)

  return (
    <div className="space-y-2">
      {/* Won */}
      <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Closed Won</p>
          <p className="text-lg font-bold text-emerald-800">{won.length} deals</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-emerald-700">{formatCurrency(wonValue)}</p>
          <p className="text-xs text-emerald-500">total value</p>
        </div>
      </div>
      {/* Lost */}
      <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
          <XCircle className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Closed Lost</p>
          <p className="text-lg font-bold text-red-700">{lost.length} deals</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-red-600">{formatCurrency(lostValue)}</p>
          <p className="text-xs text-red-400">total value</p>
        </div>
      </div>
    </div>
  )
}
