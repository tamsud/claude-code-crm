import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Database, Trash2 } from 'lucide-react'
import { seedApi } from '@/api/seed'
import type { SeedResult } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { queryKeys } from '@/queryKeys'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ListPageTitle } from '@/components/layout/PageHeader'

export function SeedManagerPage() {
  usePageTitle('Seed Manager')
  const qc = useQueryClient()
  const [result, setResult] = useState<SeedResult | null>(null)
  const confirm = useConfirmDialog()

  const seedMutation = useMutation({
    mutationFn: () => seedApi.seedDemo(),
    onSuccess: (data) => {
      setResult(data)
      qc.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.activities.lists() })
      toast.success('Demo data seeded successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const clearMutation = useMutation({
    mutationFn: () => seedApi.clearAll(),
    onSuccess: () => {
      setResult(null)
      qc.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.leads.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.opportunities.lists() })
      qc.invalidateQueries({ queryKey: queryKeys.activities.lists() })
      toast.success('All data cleared')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isLoading = seedMutation.isPending || clearMutation.isPending

  return (
    <div className="p-4 space-y-3 max-w-xl">
      <ListPageTitle title="Seed Manager" />

      <Card>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Seed Demo Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Populate the database with sample accounts, contacts, leads, opportunities, and
          activities for demonstration purposes.
        </p>
        <Button
          onClick={() => seedMutation.mutate()}
          loading={seedMutation.isPending}
          disabled={isLoading}
        >
          <Database className="h-4 w-4 mr-1" /> Seed Demo Data
        </Button>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Clear All Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Permanently delete all records from the database. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          onClick={() => confirm.confirm('Clear ALL data? This cannot be undone.')}
          loading={clearMutation.isPending}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear All Data
        </Button>
      </Card>

      {result && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Seed Results</h2>
          <dl className="space-y-1 text-sm">
            {Object.entries(result).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <dt className="capitalize text-slate-600">{key.replace(/_/g, ' ')}</dt>
                <dd className="font-medium text-slate-900">{count}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <ConfirmDialog
        open={confirm.isOpen}
        message={confirm.message}
        onConfirm={() => { confirm.handleConfirm(); clearMutation.mutate() }}
        onCancel={confirm.handleCancel}
      />
    </div>
  )
}
